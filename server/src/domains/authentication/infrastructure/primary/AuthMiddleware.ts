import { Request, NextFunction, Response } from "express";
import {
  JWTAuthService,
  StoreContext,
} from "../../application/services/JWTAuthService";

export interface AuthRequest extends Request {
  user?: StoreContext;
}

export interface AuthMiddlewareConfig {
  required?: boolean;
}

export class AuthMiddleware {
  private static instacne: AuthMiddleware;
  private readonly jwtAuthService: JWTAuthService;

  private constructor() {
    this.jwtAuthService = JWTAuthService.getInstance();
  }

  public static getInstance(): AuthMiddleware {
    if (!this.instacne) {
      this.instacne = new AuthMiddleware();
    }
    return this.instacne;
  }

  public authenticate(config: AuthMiddlewareConfig = { required: true }) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

        if (!token) {
          if (config.required) {
            return res.status(401).json({
              error: "Authentication required",
              message: "Missing or invalid authorization header",
            });
          }
          return next();
        }

        const payload = await this.jwtAuthService.validateAccessToken(token);

        if (!payload) {
          return res.status(401).json({
            error: "Authentication failed",
            message: "Invalid or expired token",
          });
        }

        req.user = this.jwtAuthService.extractStoreContext(payload);
        next();
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: "Authentication processing failed",
        });
      }
    };
  }
}
