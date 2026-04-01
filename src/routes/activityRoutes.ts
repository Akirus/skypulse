import { logError } from "../logger";
import { Request, Response, Router } from "express";
import { UpstreamServiceError } from "../errors";
import { countLocations, listLocations } from "../repositories/locationRepository";
import { getActivityScore } from "../services/activityScoreService";

const router = Router();
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

router.get("/api/v1/activity-score", async (req: Request, res: Response) => {
  const { lat, lon, user_id: userId } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const parsedLat = Number(lat);
  const parsedLon = Number(lon);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
    return res.status(400).json({ error: "lat and lon must be numbers" });
  }

  try {
    const response = await getActivityScore(
      parsedLat,
      parsedLon,
      typeof userId === "string" ? userId : undefined
    );

    return res.json(response);
  } catch (error) {
    if (error instanceof UpstreamServiceError) {
      logError("activity score upstream failure", {
        path: req.path,
        message: error.message
      });
      return res.status(502).json({ error: error.message });
    }

    logError("activity score request failed", {
      path: req.path,
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({ error: "internal server error" });
  }
});

router.get("/api/v1/locations", async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : DEFAULT_PAGE;
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_LIMIT;
  const userId = typeof req.query.user_id === "string" ? req.query.user_id : undefined;

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: "page must be a positive integer" });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return res.status(400).json({ error: `limit must be an integer between 1 and ${MAX_LIMIT}` });
  }

  const offset = (page - 1) * limit;
  try {
    const [locations, total] = await Promise.all([
      listLocations(limit, offset, userId),
      countLocations(userId)
    ]);

    return res.json({
      locations,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logError("locations request failed", {
      path: req.path,
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({ error: "internal server error" });
  }
});

export { router as activityRoutes };
