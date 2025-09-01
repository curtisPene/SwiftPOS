import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";

export interface ExpressAppConfig {
  corsOrigin?: string;
  enableLogging?: boolean;
  trustProxy?: boolean;
}

export interface RouteModule {
  path: string;
  router: express.Router;
}

export class ExpressApp {
  private static instance: ExpressApp;
  private app: Express;
  private config: ExpressAppConfig;

  private constructor(config: ExpressAppConfig = {}) {
    this.config = config;
    this.app = express();
    this.setupGlobalMiddleware();
  }

  public static getInstance(config?: ExpressAppConfig): ExpressApp {
    if (!this.instance) {
      this.instance = new ExpressApp(config);
    }
    return this.instance;
  }

  private setupGlobalMiddleware(): void {
    // Trust proxy for load balancers
    if (this.config.trustProxy) {
      this.app.set("trust proxy", 1);
    }

    // CORS configuration
    this.app.use(
      cors({
        origin: this.config.corsOrigin || process.env.CLIENT_URL,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Body parsing
    this.app.use(bodyParser.json({ limit: "10mb" }));
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Request logging (if enabled)
    if (this.config.enableLogging) {
      this.app.use(this.requestLogger);
    }

    // Health check endpoint
    this.app.get("/health-check", this.healthCheck);
  }

  public registerRoutes(routes: RouteModule[]): void {
    routes.forEach((route) => {
      this.app.use(route.path, route.router);
    });

    // 404 handler (after all routes)
    this.app.use((req, res) => this.notFoundHandler(req, res));
  }

  public setupErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(this.globalErrorHandler);
  }

  private requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.path}`);
    next();
  };

  private healthCheck = (req: Request, res: Response): void => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };

  private notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.path} not found`,
    });
  };

  private globalErrorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    console.error("Global error handler:", error);

    res.status(error.status || 500).json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
      ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    });
  };

  public getApp(): Express {
    return this.app;
  }
}
