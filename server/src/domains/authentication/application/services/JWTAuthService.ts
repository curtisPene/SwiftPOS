import jwt from "jsonwebtoken";
import { UserRole } from "../../domain/UserRole";
import { RedisConnector } from "@/config/RedisConnector";

export interface JWTAuthServiceConfig {}

interface JWTPayload {
  userId: string;
  storeId: string;
  role: UserRole;
  email: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface StoreContext {
  storeId: string;
  userId: string;
  role: UserRole;
  email: string;
}

export class JWTAuthService {
  private static instance: JWTAuthService;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: `${number}${"s" | "m" | "h" | "d"}`;
  private readonly refreshTokenExpiry: `${number}${"s" | "m" | "h" | "d"}`;
  private readonly redisConnector: RedisConnector;

  private constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET!;
    this.accessTokenExpiry = "15m";
    this.refreshTokenExpiry = "7d";
    this.redisConnector = RedisConnector.getInstance();

    // Validate secrets exist
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error("JWT secrets must be defined in environment variables");
    }
  }

  static getInstance(): JWTAuthService {
    if (!this.instance) {
      this.instance = new JWTAuthService();
    }

    return this.instance;
  }

  public async generateTokens(
    payload: Omit<JWTPayload, "iat" | "exp">
  ): Promise<TokenPair> {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });

    // Store refresh token in Redis with expiration
    const redisKey = `refresh_token:${payload.userId}:${payload.storeId}`;
    const redis = this.redisConnector.getClient();
    await redis.setEx(redisKey, 7 * 24 * 60 * 60, refreshToken); // 7 days

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  public async validateAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      if (await this.isTokenBlacklisted(token)) {
        return null;
      }

      const payload = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      return payload;
    } catch (error) {
      return null;
    }
  }

  public async validateRefreshToken(
    token: string,
    userId: string,
    storeId: string
  ): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as JWTPayload;

      // Check if stored in Redis
      const redisKey = `refresh_token:${userId}:${storeId}`;
      const redis = this.redisConnector.getClient();
      const refreshToken = await redis.get(redisKey);
      if (refreshToken !== token) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  public async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.refreshTokenSecret
      ) as JWTPayload;

      const validPayload = (await this.validateRefreshToken(
        refreshToken,
        payload.userId,
        payload.storeId
      )) as JWTPayload;

      if (!validPayload) {
        return null;
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(validPayload);

      // Revoke old refresh token
      await this.revokeRefreshToken(payload.userId, payload.storeId);

      return newTokens;
    } catch (error) {
      return null;
    }
  }

  public async revokeTokens(
    userId: string,
    storeId: string,
    accessToken?: string
  ): Promise<void> {
    if (accessToken) {
      await this.blacklistToken(accessToken);
    }

    await this.revokeRefreshToken(userId, storeId);
  }

  public extractStoreContext(payload: JWTPayload): StoreContext {
    return {
      storeId: payload.storeId,
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const redis = this.redisConnector.getClient();
      const blacklistKey = `blacklist:${token}`;
      const result = await redis.get(blacklistKey);
      return result === "1";
    } catch (error) {
      return false;
    }
  }

  private async blacklistToken(token: string): Promise<void> {
    try {
      const payload = jwt.decode(token) as JWTPayload;
      if (payload && payload.exp) {
        const redis = this.redisConnector.getClient();
        const blacklistKey = `blacklist:${token}`;
        const ttl = payload.exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
          await redis.setEx(blacklistKey, ttl, "1");
        }
      }
    } catch (error) {
      console.error("❌ Failed to blacklist token:", error);
    }
  }

  private async revokeRefreshToken(
    userId: string,
    storeId: string
  ): Promise<void> {
    const redisKey = `refresh_token:${userId}:${storeId}`;
    const redis = this.redisConnector.getClient();
    await redis.del(redisKey);
  }
}
