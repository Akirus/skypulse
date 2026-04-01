import express from "express";
import { initializeDatabase } from "./db";
import { requestLogger } from "./middleware/requestLogger";
import { activityRoutes } from "./routes/activityRoutes";
import { healthRoutes } from "./routes/healthRoutes";

export function createApp() {
  initializeDatabase();
  const app = express();
  app.use(requestLogger);
  app.use(healthRoutes);
  app.use(activityRoutes);
  return app;
}
