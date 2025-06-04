import { AuthRequest, optionalAuth } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import axios from "axios";
import { Router } from "express";
import { param, query } from "express-validator";
import Parser from "rss-parser";

const router = Router();
const rssParser = new Parser();

// Content interfaces
interface ContentItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  url: string;
  source: "hackernews" | "twitter" | "reddit";
  publishedAt: Date;
  tags: string[];
  relevanceScore?: number;
  sentimentScore?: number;
  entities?: {
    people: string[];
    organizations: string[];
    topics: string[];
  };
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
  isFiltered?: boolean;
  filterReason?: string | undefined;
}

interface FeedResponse {
  items: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  filters: {
    sources: string[];
    contentTypes: string[];
    minRelevance: number;
  };
}

// In-memory content store (replace with database in production)
const contentStore: ContentItem[] = [];
let lastHackerNewsSync = 0;

// Validation middleware
const validateFeedQuery = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("source").optional().isIn(["hackernews", "twitter", "reddit", "all"]),
  query("minRelevance").optional().isFloat({ min: 0, max: 100 }).toFloat(),
  query("tags").optional().isString(),
];

// Helper function to fetch Hacker News RSS
const fetchHackerNewsRSS = async (): Promise<ContentItem[]> => {
  try {
    const feed = await rssParser.parseURL("https://hnrss.org/frontpage");

    return feed.items.map((item, index) => ({
      id: `hn_${Date.now()}_${index}`,
      title: item.title || "Untitled",
      content: item.contentSnippet || item.content || "",
      summary: item.contentSnippet?.substring(0, 200) + "..." || "",
      author: item.creator || "Anonymous",
      url: item.link || "",
      source: "hackernews" as const,
      publishedAt: new Date(item.pubDate || Date.now()),
      tags: item.categories || [],
      engagement: {
        likes: Math.floor(Math.random() * 100), // Placeholder
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 20),
      },
    }));
  } catch (error) {
    logger.error("Error fetching Hacker News RSS:", error);
    return [];
  }
};

// Helper function to filter content using AI service
const filterContentWithAI = async (
  items: ContentItem[]
): Promise<ContentItem[]> => {
  try {
    // Call AI service for content filtering
    const response = await axios.post(
      "http://localhost:8000/filter/content",
      {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          source: item.source,
        })),
      },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const filteredIds = new Set(
      response.data.filteredItems.map((item: any) => item.id)
    );

    return items.map((item) => ({
      ...item,
      isFiltered: !filteredIds.has(item.id),
      filterReason: filteredIds.has(item.id)
        ? undefined
        : "Low relevance or brain rot content",
      relevanceScore: response.data.scores?.[item.id] || 0,
    }));
  } catch (error) {
    logger.warn(
      "AI filtering service unavailable, returning unfiltered content:",
      error
    );
    // Return content with default relevance scores if AI service is down
    return items.map((item) => ({
      ...item,
      isFiltered: false,
      relevanceScore: 75, // Default neutral score
    }));
  }
};

// Sync content from external sources
const syncContent = async (): Promise<void> => {
  const now = Date.now();

  // Sync Hacker News every 30 minutes
  if (now - lastHackerNewsSync > 30 * 60 * 1000) {
    logger.info("Syncing Hacker News content...");

    const hackerNewsItems = await fetchHackerNewsRSS();
    const filteredItems = await filterContentWithAI(hackerNewsItems);

    // Add new items to store (replace with database upsert)
    filteredItems.forEach((item) => {
      const existingIndex = contentStore.findIndex(
        (existing) => existing.url === item.url
      );
      if (existingIndex === -1) {
        contentStore.push(item);
      } else {
        contentStore[existingIndex] = item;
      }
    });

    // Keep only recent items (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentItems = contentStore.filter(
      (item) => item.publishedAt > weekAgo
    );
    contentStore.length = 0;
    contentStore.push(...recentItems);

    lastHackerNewsSync = now;
    logger.info(`Synced ${filteredItems.length} items from Hacker News`);
  }
};

// GET /api/feed - Get curated content feed
router.get(
  "/",
  optionalAuth,
  validateFeedQuery,
  asyncHandler(async (req: AuthRequest, res) => {
    // Sync content before serving
    await syncContent();

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const source = (req.query.source as string) || "all";
    const minRelevance = Number(req.query.minRelevance) || 0;
    const tagsFilter = req.query.tags as string;

    let filteredItems = contentStore.filter((item) => !item.isFiltered);

    // Apply source filter
    if (source !== "all") {
      filteredItems = filteredItems.filter((item) => item.source === source);
    }

    // Apply relevance filter
    if (minRelevance > 0) {
      filteredItems = filteredItems.filter(
        (item) => (item.relevanceScore || 0) >= minRelevance
      );
    }

    // Apply tags filter
    if (tagsFilter) {
      const tags = tagsFilter.split(",").map((tag) => tag.trim().toLowerCase());
      filteredItems = filteredItems.filter((item) =>
        item.tags.some((tag) => tags.includes(tag.toLowerCase()))
      );
    }

    // Apply user preferences if authenticated
    if (req.user?.userId) {
      // TODO: Apply user-specific filtering based on preferences
      logger.info(`Applying personalized filters for user ${req.user.userId}`);
    }

    // Sort by relevance and publish date
    filteredItems.sort((a, b) => {
      const scoreA =
        (a.relevanceScore || 0) * 0.7 +
        ((Date.now() - a.publishedAt.getTime()) / (24 * 60 * 60 * 1000)) * 0.3;
      const scoreB =
        (b.relevanceScore || 0) * 0.7 +
        ((Date.now() - b.publishedAt.getTime()) / (24 * 60 * 60 * 1000)) * 0.3;
      return scoreB - scoreA;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    const response: FeedResponse = {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        hasNext: endIndex < filteredItems.length,
      },
      filters: {
        sources: ["hackernews", "twitter", "reddit"],
        contentTypes: ["article", "discussion", "news"],
        minRelevance: minRelevance,
      },
    };

    res.json(response);
  })
);

// GET /api/feed/sources - Get available content sources
router.get(
  "/sources",
  asyncHandler(async (req, res) => {
    const sources = [
      {
        id: "hackernews",
        name: "Hacker News",
        description: "Technology and startup news",
        enabled: true,
        lastSync: new Date(lastHackerNewsSync),
        itemCount: contentStore.filter((item) => item.source === "hackernews")
          .length,
      },
      {
        id: "twitter",
        name: "Twitter/X",
        description: "Social media updates",
        enabled: false, // Not implemented yet
        lastSync: null,
        itemCount: 0,
      },
      {
        id: "reddit",
        name: "Reddit",
        description: "Community discussions",
        enabled: false, // Not implemented yet
        lastSync: null,
        itemCount: 0,
      },
    ];

    res.json({ sources });
  })
);

// POST /api/feed/sync - Manual content sync
router.post(
  "/sync",
  asyncHandler(async (req, res) => {
    logger.info("Manual content sync requested");

    await syncContent();

    res.json({
      message: "Content sync completed",
      itemCount: contentStore.length,
      lastSync: new Date(),
    });
  })
);

// GET /api/feed/:id - Get specific content item
router.get(
  "/:id",
  param("id").isString(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = contentStore.find((item) => item.id === id);

    if (!item) {
      return res.status(404).json({ message: "Content item not found" });
    }

    res.json({ item });
  })
);

export default router;
