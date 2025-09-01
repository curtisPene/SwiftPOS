import mongoose, { Connection } from "mongoose";

export interface MongoConnectorConfig {
  uri?: string;
  dbName?: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  enableLogging?: boolean;
}

export interface ConnectionInfo {
  host: string;
  port: number;
  database: string;
  readyState: number;
  connectionString: string;
}

export class MongoConnector {
  private static instance: MongoConnector;
  private connection: Connection | null = null;
  private config: MongoConnectorConfig;
  private isConnected: boolean = false;

  private constructor(config: MongoConnectorConfig = {}) {
    // Build config object conditionally to satisfy exactOptionalPropertyTypes
    this.config = {
      dbName: config.dbName || "SwiftPOS",
      maxPoolSize: config.maxPoolSize || 10,
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: config.socketTimeoutMS || 45000,
      enableLogging: config.enableLogging || false,
    };

    // Only add uri if it exists
    const connectionUri = config.uri || process.env.MONGO_CONNECTION_STRING;
    if (connectionUri) {
      this.config.uri = connectionUri;
    }
  }

  public static getInstance(config?: MongoConnectorConfig): MongoConnector {
    if (!this.instance) {
      this.instance = new MongoConnector(config);
    }
    return this.instance;
  }

  public async connect(): Promise<Connection> {
    try {
      if (this.isConnected && this.connection) {
        console.log("📦 MongoDB already connected");
        return this.connection;
      }

      if (!this.config.uri) {
        throw new Error(
          "MONGO_CONNECTION_STRING is not defined in environment variables"
        );
      }

      console.log(
        `📦 Connecting to MongoDB database: ${this.config.dbName}...`
      );

      // Setup connection options - build conditionally for exactOptionalPropertyTypes
      const options: any = {};

      if (this.config.dbName) {
        options.dbName = this.config.dbName;
      }
      if (this.config.maxPoolSize) {
        options.maxPoolSize = this.config.maxPoolSize;
      }
      if (this.config.serverSelectionTimeoutMS) {
        options.serverSelectionTimeoutMS = this.config.serverSelectionTimeoutMS;
      }
      if (this.config.socketTimeoutMS) {
        options.socketTimeoutMS = this.config.socketTimeoutMS;
      }

      // Connect to MongoDB
      const mongooseInstance = await mongoose.connect(this.config.uri, options);
      this.connection = mongooseInstance.connection;

      // Setup event listeners
      this.setupEventListeners();

      // Enable query logging if requested
      if (this.config.enableLogging) {
        mongoose.set("debug", true);
      }

      this.isConnected = true;

      const connectionInfo = this.getConnectionInfo();
      console.log(`✅ MongoDB connected successfully`);
      console.log(`📊 Database: ${connectionInfo.database}`);
      console.log(`🌐 Host: ${connectionInfo.host}:${connectionInfo.port}`);
      console.log(`🏊 Pool size: ${this.config.maxPoolSize}`);

      return this.connection;
    } catch (error: any) {
      this.isConnected = false;
      console.error("❌ MongoDB connection failed:", error.message);
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connection && this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        this.connection = null;
        console.log("📦 MongoDB disconnected successfully");
      }
    } catch (error: any) {
      console.error("❌ MongoDB disconnect failed:", error.message);
      throw new Error(`Failed to disconnect from MongoDB: ${error.message}`);
    }
  }

  public getConnectionInfo(): ConnectionInfo {
    if (!this.connection) {
      throw new Error("MongoDB not connected");
    }

    return {
      host: this.connection.host,
      port: this.connection.port,
      database: this.connection.name,
      readyState: this.connection.readyState,
      connectionString: this.maskConnectionString(this.config.uri || ""),
    };
  }

  public isHealthy(): boolean {
    return (
      this.isConnected &&
      this.connection !== null &&
      this.connection.readyState === 1
    ); // 1 = connected
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.connection || !this.connection.db) return false;
      await this.connection.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.connection) {
      console.warn("⚠️ Cannot setup event listeners: MongoDB connection not established");
      return;
    }

    const connection = this.connection;

    connection.on("error", (error: Error) => {
      console.error("❌ MongoDB connection error:", error);
      this.isConnected = false;
    });

    connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
      this.isConnected = false;
    });

    connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      this.isConnected = true;
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await this.disconnect();
        process.exit(0);
      } catch (error) {
        console.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    });
  }

  private maskConnectionString(uri: string): string {
    // Mask password in connection string for logging
    return uri.replace(/:([^:@]+)@/, ":****@");
  }
}
