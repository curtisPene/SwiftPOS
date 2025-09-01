import dotenv from "dotenv";
dotenv.config();

import { ExpressApp, ExpressAppConfig, RouteModule } from "./config/ExpressApp";
import { MongoConnector } from "./config/MongoConnector";
import { RedisConnector } from "./config/RedisConnector";
import { createStoreRoutes } from "./domains/stores/infrastructure/primary/StoreRoutes";

async function startServer() {
  try {
    console.log("🚀 Starting SwiftPOS Server...");

    // 1. Setup Express app with configuration
    const appConfig: ExpressAppConfig = {
      enableLogging: process.env.NODE_ENV === "development",
      trustProxy: process.env.NODE_ENV === "production",
    };

    // Only add corsOrigin if it's actually defined
    if (process.env.CLIENT_URL) {
      appConfig.corsOrigin = process.env.CLIENT_URL;
    }

    const expressApp = ExpressApp.getInstance(appConfig);

    // 2. Connect to databases
    console.log("📦 Connecting to MongoDB...");
    const mongoConnector = MongoConnector.getInstance();
    await mongoConnector.connect();

    console.log("🔴 Connecting to Redis...");
    const redisConnector = RedisConnector.getInstance();
    await redisConnector.connect();

    // 3. Register routes
    console.log("🛤️  Registering routes...");
    const routes: RouteModule[] = [
      {
        path: "/api/stores",
        router: createStoreRoutes(),
      },
      // Future routes will be added here:
      // { path: "/api/auth", router: createAuthRoutes() },
      // { path: "/api/users", router: createUserRoutes() },
      // etc.
    ];

    expressApp.registerRoutes(routes);

    // 4. Setup error handling (must be last)
    expressApp.setupErrorHandling();

    // 5. Start server
    const port = process.env.PORT || 3000;
    const app = expressApp.getApp();

    app.listen(port, () => {
      console.log(`✅ SwiftPOS Server running on port ${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health-check`);
      console.log(`🏪 Store API: http://localhost:${port}/api/stores`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start server only in development/production
if (
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production"
) {
  startServer();
}
