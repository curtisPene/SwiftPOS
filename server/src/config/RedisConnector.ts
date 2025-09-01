import { createClient, RedisClientType } from "redis";

export interface RedisConnectorConfig {
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  enableLogging?: boolean;
}

export interface RedisConnectionInfo {
  host: string;
  port: number;
  username: string;
  status: string;
}

export class RedisConnector {
  private static instance: RedisConnector;
  private client: RedisClientType;
  private config: RedisConnectorConfig;
  private isConnected: boolean = false;

  private constructor(config: RedisConnectorConfig = {}) {
    // Build config with defaults
    this.config = {
      host: config.host || process.env.REDIS_CONNECTION_STRING!,
      port: config.port || 16307,
      username: config.username || "default",
      password: config.password || process.env.REDIS_PASSWORD!,
      enableLogging: config.enableLogging || false,
    };

    // Use your Redis website pattern with createClient
    const clientOptions: any = {
      username: this.config.username,
      password: this.config.password,
      socket: {
        host: this.config.host,
        port: this.config.port,
      },
    };

    this.client = createClient(clientOptions);
  }

  public static getInstance(config?: RedisConnectorConfig): RedisConnector {
    if (!this.instance) {
      this.instance = new RedisConnector(config);
    }
    return this.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected && this.client.isReady) {
        console.log("🔴 Redis already connected");
        return;
      }

      if (!this.config.host) {
        throw new Error("REDIS_CONNECTION_STRING is not defined");
      }

      console.log(
        `🔴 Connecting to Redis at ${this.config.host}:${this.config.port}...`
      );

      // Setup event listeners with enhanced logging
      this.setupEventListeners();

      // Your original connection pattern
      await this.client.connect();
      this.isConnected = true;

      const connectionInfo = this.getConnectionInfo();
      console.log(`✅ Redis connected successfully`);
      console.log(`🌐 Host: ${connectionInfo.host}:${connectionInfo.port}`);
      console.log(`👤 Username: ${connectionInfo.username}`);
    } catch (error: any) {
      this.isConnected = false;
      console.error("❌ Redis connection failed:", error.message);
      throw new Error(`Failed to connect to Redis: ${error.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        console.log("🔴 Redis disconnected successfully");
      }
    } catch (error: any) {
      console.error("❌ Redis disconnect failed:", error.message);
      throw new Error(`Failed to disconnect from Redis: ${error.message}`);
    }
  }

  public getConnectionInfo(): RedisConnectionInfo {
    return {
      host: this.config.host || "localhost",
      port: this.config.port || 16307,
      username: this.config.username || "default",
      status: this.client.isReady ? "ready" : "connecting",
    };
  }

  public isHealthy(): boolean {
    return this.isConnected && this.client.isReady;
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) return false;
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  public getClient(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client is not initialized");
    }
    if (!this.isConnected) {
      throw new Error("Redis client is not connected");
    }
    return this.client;
  }

  private setupEventListeners(): void {
    const client = this.client;

    // Enhanced error handling with better logging
    client.on("error", (error: Error) => {
      console.error("❌ Redis client error:", error.message);
      this.isConnected = false;
    });

    client.on("connect", () => {
      if (this.config.enableLogging) {
        console.log("🔄 Redis connecting...");
      }
    });

    client.on("ready", () => {
      if (this.config.enableLogging) {
        console.log("✅ Redis client ready");
      }
      this.isConnected = true;
    });

    client.on("end", () => {
      if (this.config.enableLogging) {
        console.log("🔴 Redis connection ended");
      }
      this.isConnected = false;
    });

    client.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await this.disconnect();
        process.exit(0);
      } catch (error) {
        console.error("Error during Redis graceful shutdown:", error);
        process.exit(1);
      }
    });
  }
}
