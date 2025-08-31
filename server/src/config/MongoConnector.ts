import mongoose from "mongoose";

export class MongoConnector {
  private uri: string | undefined = process.env.MONGO_CONNECTION_STRING;
  private static instance: MongoConnector;

  private constructor() {}

  public static getInstance(): MongoConnector {
    if (!this.instance) {
      this.instance = new MongoConnector();
    }
    return this.instance;
  }

  public async connect() {
    if (!this.uri) {
      throw new Error("MONGO_CONNECTION_STRING is not defined");
    }

    const connection = await mongoose.connect(this.uri, {
      dbName: "SwiftPOS",
    });

    console.log("Connected to MongoDB");

    return connection;
  }
}
