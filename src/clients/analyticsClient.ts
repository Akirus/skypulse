import { getConfig } from "../config";
import { logWarn } from "../logger";

export async function saveStatistics(
  userId: string | undefined,
  lat: number,
  lon: number,
  score: number
): Promise<void> {
  const config = getConfig();

  try {
    await fetch(config.analyticsEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.analyticsApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: "activity_score_calculated",
        user_id: userId,
        latitude: lat,
        longitude: lon,
        score,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    logWarn("analytics submission failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
