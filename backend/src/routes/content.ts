import axios from "axios";
import { Request, Response, Router } from "express";
import { param, query, validationResult } from "express-validator";
import { config } from "../config/config";
import { authenticateToken } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

// In-memory content store (replace with database in production)
interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  platform: "twitter" | "reddit" | "hackernews";
  publishedAt: Date;
  score: number;
  entities: string[];
  tags: string[];
  embedding?: number[];
  userId?: string;
  interactions: {
    views: number;
    likes: number;
    bookmarks: number;
    shares: number;
  };
}

const contentStore: ContentItem[] = [];

// Get content by ID
router.get(
  "/content/:id",
  param("id").isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const content = contentStore.find((item) => item.id === id);

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Update view count
      content.interactions.views++;

      res.json({ content });
    } catch (error) {
      logger.error("Error getting content:", error);
      res.status(500).json({ error: "Failed to get content" });
    }
  }
);

// Search content
router.get(
  "/search",
  query("q").isString().notEmpty(),
  query("platform").optional().isIn(["twitter", "reddit", "hackernews"]),
  query("tags").optional().isString(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q, platform, tags, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let filteredContent = contentStore;

      // Text search
      if (q) {
        const searchTerm = (q as string).toLowerCase();
        filteredContent = filteredContent.filter(
          (item) =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Platform filter
      if (platform) {
        filteredContent = filteredContent.filter(
          (item) => item.platform === platform
        );
      }

      // Tags filter
      if (tags) {
        const tagList = (tags as string)
          .split(",")
          .map((tag) => tag.trim().toLowerCase());
        filteredContent = filteredContent.filter((item) =>
          tagList.some((tag) =>
            item.tags.some((itemTag) => itemTag.toLowerCase().includes(tag))
          )
        );
      }

      // Sort by score and date
      filteredContent.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      });

      const paginatedContent = filteredContent.slice(offset, offset + limit);
      const totalCount = filteredContent.length;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        content: paginatedContent,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      logger.error("Error searching content:", error);
      res.status(500).json({ error: "Failed to search content" });
    }
  }
);

// Get similar content using AI embeddings
router.get(
  "/similar/:id",
  param("id").isString().notEmpty(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { limit = 10 } = req.query;

      const targetContent = contentStore.find((item) => item.id === id);
      if (!targetContent) {
        return res.status(404).json({ error: "Content not found" });
      }

      try {
        // Call AI service for similarity
        const aiResponse = await axios.post(
          `${config.ai.baseUrl}/similarity`,
          {
            text: `${targetContent.title} ${targetContent.description}`,
            candidates: contentStore
              .filter((item) => item.id !== id)
              .map((item) => ({
                id: item.id,
                text: `${item.title} ${item.description}`,
              })),
          },
          {
            timeout: 10000,
          }
        );

        const similarContent = aiResponse.data.results
          .slice(0, limit)
          .map((result: any) =>
            contentStore.find((item) => item.id === result.id)
          )
          .filter(Boolean);

        res.json({ similarContent });
      } catch (aiError) {
        logger.warn("AI service unavailable, using fallback similarity");

        // Fallback: simple tag-based similarity
        const similarContent = contentStore
          .filter((item) => item.id !== id)
          .map((item) => ({
            item,
            similarity: calculateTagSimilarity(targetContent.tags, item.tags),
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit)
          .map((result) => result.item);

        res.json({ similarContent });
      }
    } catch (error) {
      logger.error("Error getting similar content:", error);
      res.status(500).json({ error: "Failed to get similar content" });
    }
  }
);

// Bookmark content
router.post(
  "/bookmark/:id",
  authenticateToken,
  param("id").isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = (req as any).user.userId;

      const content = contentStore.find((item) => item.id === id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Update bookmark count
      content.interactions.bookmarks++;

      // In production, save to user's bookmarks in database
      logger.info(`User ${userId} bookmarked content ${id}`);

      res.json({ message: "Content bookmarked successfully" });
    } catch (error) {
      logger.error("Error bookmarking content:", error);
      res.status(500).json({ error: "Failed to bookmark content" });
    }
  }
);

// Like content
router.post(
  "/like/:id",
  authenticateToken,
  param("id").isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = (req as any).user.userId;

      const content = contentStore.find((item) => item.id === id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Update like count
      content.interactions.likes++;

      // In production, save to user interactions in database
      logger.info(`User ${userId} liked content ${id}`);

      res.json({ message: "Content liked successfully" });
    } catch (error) {
      logger.error("Error liking content:", error);
      res.status(500).json({ error: "Failed to like content" });
    }
  }
);

// Share content
router.post(
  "/share/:id",
  authenticateToken,
  param("id").isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = (req as any).user.userId;

      const content = contentStore.find((item) => item.id === id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Update share count
      content.interactions.shares++;

      // In production, log share interaction in database
      logger.info(`User ${userId} shared content ${id}`);

      res.json({
        message: "Content shared successfully",
        shareUrl: `${config.baseUrl}/content/${id}`,
      });
    } catch (error) {
      logger.error("Error sharing content:", error);
      res.status(500).json({ error: "Failed to share content" });
    }
  }
);

// Get trending content
router.get(
  "/trending",
  query("timeframe").optional().isIn(["hour", "day", "week", "month"]),
  query("platform").optional().isIn(["twitter", "reddit", "hackernews"]),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = "day", platform, limit = 20 } = req.query;

      // Calculate time threshold
      const now = new Date();
      const timeThresholds = {
        hour: new Date(now.getTime() - 60 * 60 * 1000),
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };

      let filteredContent = contentStore.filter(
        (item) =>
          new Date(item.publishedAt) >=
          timeThresholds[timeframe as keyof typeof timeThresholds]
      );

      if (platform) {
        filteredContent = filteredContent.filter(
          (item) => item.platform === platform
        );
      }

      // Calculate trending score based on interactions and recency
      const trendingContent = filteredContent
        .map((item) => ({
          ...item,
          trendingScore: calculateTrendingScore(item),
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      res.json({ content: trendingContent });
    } catch (error) {
      logger.error("Error getting trending content:", error);
      res.status(500).json({ error: "Failed to get trending content" });
    }
  }
);

// Helper functions
function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  const set1 = new Set(tags1.map((tag) => tag.toLowerCase()));
  const set2 = new Set(tags2.map((tag) => tag.toLowerCase()));

  const intersection = new Set([...set1].filter((tag) => set2.has(tag)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateTrendingScore(content: ContentItem): number {
  const { interactions } = content;
  const ageInHours =
    (Date.now() - new Date(content.publishedAt).getTime()) / (1000 * 60 * 60);

  // Trending score formula: (interactions weighted by type) / age decay
  const interactionScore =
    interactions.views * 0.1 +
    interactions.likes * 1.0 +
    interactions.bookmarks * 2.0 +
    interactions.shares * 3.0;

  const ageDecay = Math.max(0.1, 1 / (1 + ageInHours * 0.1));

  return interactionScore * ageDecay * content.score;
}

export default router;
