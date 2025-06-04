import { config } from "@/config/config";
import { authenticateToken } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

const router = Router();

// In-memory user store (replace with database in production)
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  socialAccounts?: {
    twitter?: { id: string; username: string; accessToken: string };
    reddit?: { id: string; username: string; accessToken: string };
  };
  preferences?: {
    contentTypes: string[];
    filterStrength: number;
    sources: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const users: Map<string, User> = new Map();
const tokenBlacklist: Set<string> = new Set();

// Helper function to generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "7d" });
};

// Helper function to hash password
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Helper function to verify password
const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Validation middleware
const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
];

const validateRegister = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("name").trim().isLength({ min: 2, max: 50 }),
];

// POST /api/auth/login
router.post(
  "/login",
  validateLogin,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = Array.from(users.values()).find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
      },
      token,
    });
  })
);

// POST /api/auth/register
router.post(
  "/register",
  validateRegister,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      (u) => u.email === email
    );
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      email,
      name,
      password: hashedPassword,
      preferences: {
        contentTypes: ["article", "discussion", "news"],
        filterStrength: 80,
        sources: ["hackernews", "twitter", "reddit"],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(userId, newUser);

    // Generate JWT token
    const token = generateToken(userId);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        preferences: newUser.preferences,
      },
      token,
    });
  })
);

// POST /api/auth/logout
router.post(
  "/logout",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      tokenBlacklist.add(token);
    }

    logger.info(`User ${req.user.userId} logged out`);

    res.json({
      message: "Logout successful",
    });
  })
);

// GET /api/auth/twitter
router.get(
  "/twitter",
  asyncHandler(async (req, res) => {
    // Twitter OAuth URL (replace with actual OAuth implementation)
    const twitterAuthUrl = `https://api.twitter.com/oauth/authorize?oauth_token=placeholder&oauth_callback=${encodeURIComponent(config.baseUrl + "/api/auth/twitter/callback")}`;

    logger.info("Initiating Twitter OAuth flow");

    res.redirect(twitterAuthUrl);
  })
);

// GET /api/auth/twitter/callback
router.get(
  "/twitter/callback",
  asyncHandler(async (req, res) => {
    const { oauth_token, oauth_verifier } = req.query;

    if (!oauth_token || !oauth_verifier) {
      return res
        .status(400)
        .json({ message: "Invalid Twitter OAuth callback" });
    }

    // TODO: Exchange OAuth tokens for access token
    // This is a placeholder - implement actual Twitter OAuth flow

    logger.info("Twitter OAuth callback received");

    res.json({
      message: "Twitter OAuth callback processed",
      redirect: "/dashboard",
    });
  })
);

// GET /api/auth/reddit
router.get(
  "/reddit",
  asyncHandler(async (req, res) => {
    // TODO: Implement Reddit OAuth
    res.redirect("/api/auth/reddit/callback");
  })
);

// GET /api/auth/reddit/callback
router.get(
  "/reddit/callback",
  asyncHandler(async (req, res) => {
    // TODO: Handle Reddit OAuth callback
    res.json({
      message: "Reddit OAuth callback - implementation pending",
    });
  })
);

export default router;
