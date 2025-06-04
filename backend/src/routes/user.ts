import { authenticateToken, AuthRequest } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import { Router } from "express";
import { body, validationResult } from "express-validator";

const router = Router();

// User preferences interface
interface UserPreferences {
  contentTypes: string[];
  filterStrength: number;
  sources: string[];
  topics: string[];
  notificationSettings: {
    email: boolean;
    browser: boolean;
    frequency: "realtime" | "daily" | "weekly";
  };
  privacySettings: {
    shareReadingHistory: boolean;
    allowRecommendations: boolean;
  };
}

// In-memory user store (replace with database)
const userProfiles: Map<string, any> = new Map();

// Validation middleware
const validatePreferences = [
  body("contentTypes").isArray().withMessage("Content types must be an array"),
  body("filterStrength")
    .isInt({ min: 0, max: 100 })
    .withMessage("Filter strength must be between 0-100"),
  body("sources").isArray().withMessage("Sources must be an array"),
  body("topics").optional().isArray().withMessage("Topics must be an array"),
];

// GET /api/user/profile - Get user profile
router.get(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const profile = userProfiles.get(userId) || {
      id: userId,
      email: req.user.email,
      name: req.user.name,
      preferences: {
        contentTypes: ["article", "discussion", "news"],
        filterStrength: 80,
        sources: ["hackernews", "twitter", "reddit"],
        topics: [],
        notificationSettings: {
          email: true,
          browser: false,
          frequency: "daily",
        },
        privacySettings: {
          shareReadingHistory: false,
          allowRecommendations: true,
        },
      },
      stats: {
        itemsRead: 0,
        itemsFiltered: 0,
        averageRelevanceScore: 0,
        topTopics: [],
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // Store default profile if it doesn't exist
    if (!userProfiles.has(userId)) {
      userProfiles.set(userId, profile);
    }

    res.json({ profile });
  })
);

// PUT /api/user/preferences - Update user preferences
router.put(
  "/preferences",
  authenticateToken,
  validatePreferences,
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const {
      contentTypes,
      filterStrength,
      sources,
      topics,
      notificationSettings,
      privacySettings,
    } = req.body;

    // Get existing profile or create new one
    const existingProfile = userProfiles.get(userId) || {
      id: userId,
      email: req.user.email,
      name: req.user.name,
    };

    // Update preferences
    const updatedPreferences: UserPreferences = {
      contentTypes: contentTypes || ["article", "discussion", "news"],
      filterStrength: filterStrength || 80,
      sources: sources || ["hackernews"],
      topics: topics || [],
      notificationSettings: {
        email: notificationSettings?.email ?? true,
        browser: notificationSettings?.browser ?? false,
        frequency: notificationSettings?.frequency || "daily",
      },
      privacySettings: {
        shareReadingHistory: privacySettings?.shareReadingHistory ?? false,
        allowRecommendations: privacySettings?.allowRecommendations ?? true,
      },
    };

    const updatedProfile = {
      ...existingProfile,
      preferences: updatedPreferences,
      updatedAt: new Date().toISOString(),
    };

    userProfiles.set(userId, updatedProfile);

    logger.info(`Updated preferences for user ${userId}`);

    res.json({
      message: "Preferences updated successfully",
      preferences: updatedPreferences,
    });
  })
);

// GET /api/user/sources - Get user's connected social media sources
router.get(
  "/sources",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Mock connected sources (replace with actual social media integrations)
    const sources = [
      {
        id: "hackernews",
        name: "Hacker News",
        type: "rss",
        connected: true,
        lastSync: new Date().toISOString(),
        itemCount: 150,
        status: "active",
      },
      {
        id: "twitter",
        name: "Twitter/X",
        type: "oauth",
        connected: false,
        lastSync: null,
        itemCount: 0,
        status: "not_connected",
        connectUrl: "/api/auth/twitter",
      },
      {
        id: "reddit",
        name: "Reddit",
        type: "oauth",
        connected: false,
        lastSync: null,
        itemCount: 0,
        status: "not_connected",
        connectUrl: "/api/auth/reddit",
      },
    ];

    res.json({ sources });
  })
);

// POST /api/user/sources/:sourceId/connect - Connect a social media source
router.post(
  "/sources/:sourceId/connect",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { sourceId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate source ID
    const validSources = ["twitter", "reddit"];
    if (!validSources.includes(sourceId)) {
      return res.status(400).json({ message: "Invalid source ID" });
    }

    logger.info(`User ${userId} attempting to connect ${sourceId}`);

    // Redirect to OAuth flow
    const redirectUrl = `/api/auth/${sourceId}?userId=${userId}`;

    res.json({
      message: `Redirect to ${sourceId} OAuth`,
      redirectUrl,
      status: "redirect_required",
    });
  })
);

// DELETE /api/user/sources/:sourceId - Disconnect a social media source
router.delete(
  "/sources/:sourceId",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { sourceId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // TODO: Remove OAuth tokens and disconnect source
    logger.info(`User ${userId} disconnected ${sourceId}`);

    res.json({
      message: `${sourceId} disconnected successfully`,
      sourceId,
      status: "disconnected",
    });
  })
);

// GET /api/user/stats - Get user reading statistics
router.get(
  "/stats",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Mock statistics (replace with actual analytics)
    const stats = {
      readingStats: {
        itemsRead: 127,
        itemsFiltered: 45,
        averageRelevanceScore: 85.2,
        timeSpentReading: 1280, // minutes
        streakDays: 7,
      },
      topTopics: [
        { topic: "AI/Machine Learning", count: 34, percentage: 26.8 },
        { topic: "Web Development", count: 28, percentage: 22.0 },
        { topic: "Startups", count: 19, percentage: 15.0 },
        { topic: "Science", count: 15, percentage: 11.8 },
        { topic: "Technology News", count: 31, percentage: 24.4 },
      ],
      sourceBreakdown: [
        { source: "Hacker News", count: 89, percentage: 70.1 },
        { source: "Twitter", count: 25, percentage: 19.7 },
        { source: "Reddit", count: 13, percentage: 10.2 },
      ],
      weeklyActivity: [
        { date: "2024-01-01", itemsRead: 18 },
        { date: "2024-01-02", itemsRead: 22 },
        { date: "2024-01-03", itemsRead: 15 },
        { date: "2024-01-04", itemsRead: 19 },
        { date: "2024-01-05", itemsRead: 21 },
        { date: "2024-01-06", itemsRead: 17 },
        { date: "2024-01-07", itemsRead: 15 },
      ],
      brainRotPrevented: {
        itemsFiltered: 45,
        timeSaved: 180, // minutes saved from not reading brain rot
        wellnessScore: 8.5, // out of 10
      },
    };

    res.json({ stats });
  })
);

export default router;
