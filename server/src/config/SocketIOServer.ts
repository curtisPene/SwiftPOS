import {
  JWTAuthService,
  StoreContext,
} from "@/domains/authentication/application/services/JWTAuthService";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export interface SocketIOServerConfig {
  httpServer: HttpServer;
  corsOrigins: string[];
  enableLogging?: boolean;
}

export interface AuthenticatedSocket extends Socket {
  storeContext: StoreContext;
}

export class SocketServer {
  private static instance: SocketServer;
  private io: any;
  private jwtAuthService: JWTAuthService;
  private connectedStores: Map<string, Set<String>> = new Map();

  private constructor(config: SocketIOServerConfig) {
    this.jwtAuthService = JWTAuthService.getInstance();

    this.io = new Server(config.httpServer, {
      cors: {
        origin: config.corsOrigins,
      },
    });

    this.setupAuthentication();
  }

  private setupAuthentication(): void {
    this.io.use(
      async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const payload = await this.jwtAuthService.validateAccessToken(token);

        if (!payload) {
          return next(new Error("Invalid or expired token"));
        }

        socket.storeContext = this.jwtAuthService.extractStoreContext(payload);
        next();
      }
    );
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const storeContext = socket.storeContext;

      console.log(
        `✅ Store ${storeContext.storeId} connected (User: ${storeContext.userId})`
      );

      const storeRoom = `store-${storeContext.storeId}`;
      socket.join(storeRoom);

      this.trackStoreConnection(storeContext.storeId, socket.id);
    });
  }

  private trackStoreConnection(storeId: string, socketId: string): void {
    if (!this.connectedStores.has(storeId)) {
      this.connectedStores.set(storeId, new Set());
    }

    this.connectedStores.get(storeId)?.add(socketId);
  }

  private setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    const storeId = socket.storeContext.storeId;

    socket.on("transaction:create", (data) => {
      try {
        if (data.storeId !== storeId) {
          socket.emit("error", { message: "Store ID mismatch" });

          // Process transaction here

          this.io.to(`store:${storeId}`).emit("transaction:created", {
            transactionId: data.id,
            amount: data.amount,
            timestamp: new Date(),
            userId: socket.storeContext!.userId,
          });
          return;
        }
      } catch (error) {
        socket.emit("transaction:error", {
          message: "Failed to create transaction",
        });
      }
    });
  }
}
