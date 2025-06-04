import { config } from "@/config/config";
import { CustomError } from "@/middleware/errorHandler";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?:
    | {
        userId: string;
        id: string;
        email: string;
        name: string;
      }
    | undefined;
  headers: any;
  query: any;
  params: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new CustomError("Access token is required", 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as {
        userId: string;
        id?: string;
        email?: string;
        name?: string;
      };

      req.user = {
        userId: decoded.userId,
        id: decoded.id || decoded.userId,
        email: decoded.email || "",
        name: decoded.name || "",
      };
      next();
    } catch (jwtError) {
      throw new CustomError("Invalid or expired token", 401);
    }
  } catch (error) {
    next(error);
  }
};

// Legacy export for backward compatibility
export const authMiddleware = authenticateToken;

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers?.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as {
          userId: string;
          id?: string;
          email?: string;
          name?: string;
        };

        req.user = {
          userId: decoded.userId,
          id: decoded.id || decoded.userId,
          email: decoded.email || "",
          name: decoded.name || "",
        };
      } catch (jwtError) {
        // Token is invalid, but that's ok for optional auth
        req.user = undefined;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
