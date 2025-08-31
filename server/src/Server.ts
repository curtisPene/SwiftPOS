import dotenv from "dotenv";
dotenv.config();

import { ExpressApp } from "./config/ExpressApp";
import { MongoConnector } from "./config/MongoConnector";
import { RedisConnector } from "./config/RedisConnector";

const app = ExpressApp.getInstance().getApp();
const mongoConnector = MongoConnector.getInstance();
const redisconnector = RedisConnector.getInstance();

if (process.env.NODE_ENV === "DEVELOPMENT") {
  mongoConnector
    .connect()
    .then(() => {
      return redisconnector.connect();
    })
    .then(() => {
      console.log("Connected to Redis");
      app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
      });
    });
}
