import { config } from "@/config/config";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

// Route imports
import authRoutes from "@/routes/auth";
import contentRoutes from "@/routes/content";
import feedRoutes from "@/routes/feed";
import graphRoutes from "@/routes/graph";
import recommendationRoutes from "@/routes/recommendations";
import userRoutes from "@/routes/user";

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.frontend.url,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/content", authMiddleware, contentRoutes);
app.use("/api/feed", authMiddleware, feedRoutes);
app.use("/api/graph", authMiddleware, graphRoutes);
app.use("/api/recommendations", authMiddleware, recommendationRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
const PORT = config.server.port || 3001;
const HOST = config.server.host || "0.0.0.0";

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server started on ${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${config.environment}`);
  logger.info(`🔗 Frontend URL: ${config.frontend.url}`);
});

export default app;
