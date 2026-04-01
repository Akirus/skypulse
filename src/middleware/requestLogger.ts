import { NextFunction, Request, Response } from "express";
import { logInfo } from "../logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    logInfo("request completed", {
      method: req.method,
      path: req.path,
      query: req.query,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt
    });
  });

  next();
}
