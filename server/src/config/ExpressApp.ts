import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";

export class ExpressApp {
  private static instance: ExpressApp;
  private app: express.Express;

  private constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  public static getInstance(): ExpressApp {
    if (!this.instance) {
      this.instance = new ExpressApp();
    }
    return this.instance;
  }

  private setupMiddleware() {
    this.app.use(
      cors({
        allowedHeaders: ["Content-Type", "Authorization"],
        origin: process.env.CLIENT,
        credentials: true,
      })
    );
    this.app.use(bodyParser.json());

    this.app.use(
      "/health-check",
      (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ message: "Server is running" });
      }
    );

    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status || 500).json({ message: err.message });
      }
    );
  }

  public getApp() {
    if (!this.app) {
      throw new Error("App is not initialized");
    }
    return this.app;
  }
}
