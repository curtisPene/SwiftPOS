import { createClient, RedisClientType } from "redis";

export class RedisConnector {
  private static instance: RedisConnector;
  private client: RedisClientType;
  private uri: string | undefined = process.env.REDIS_CONNECTION_STRING;
  private password: string | undefined = process.env.REDIS_PASSWORD;
  constructor() {
    this.client = createClient({
      username: "default",
      password: this.password,
      socket: {
        host: this.uri,
        port: 16307,
      },
    });
  }

  public static getInstance(): RedisConnector {
    if (!this.instance) {
      this.instance = new RedisConnector();
    }
    return this.instance;
  }

  public async connect() {
    if (!this.uri) {
      throw new Error("REDIS_CONNECTION_STRING is not defined");
    }

    this.client.on("error", (err) => console.log("Redis Client Error", err));

    const connection = await this.client.connect();

    return connection;
  }

  public getClient() {
    if (!this.client) {
      throw new Error("Redis client is not initialized");
    }
    return this.client;
  }
}
