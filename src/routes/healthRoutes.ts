import { Request, Response, Router } from "express";
import { isDatabaseReady } from "../db";

const router = Router();

router.get("/health/live", (_req: Request, res: Response) => {
  return res.json({ status: "ok" });
});

router.get("/health/ready", (_req: Request, res: Response) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({ status: "not_ready" });
  }

  return res.json({ status: "ready" });
});

export { router as healthRoutes };
