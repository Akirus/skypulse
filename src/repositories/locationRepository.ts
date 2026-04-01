import { runQuery } from "../db";
import { LocationResponseItem, LocationRow, UserPreferenceRow } from "../types";

function formatLocationId(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function parseLocationId(locationId: string): LocationResponseItem {
  const [lat, lon] = locationId.split(",").map(Number);

  return {
    location_id: locationId,
    lat,
    lon
  };
}

export async function getPreferencesByCoordinates(
  lat: number,
  lon: number,
  userId?: string
): Promise<UserPreferenceRow[]> {
  return userId
    ? runQuery<UserPreferenceRow>(
        `
          SELECT preference_type, preference_value
          FROM user_preferences
          WHERE location_id = ? AND user_id = ?
          ORDER BY preference_type
        `,
        [formatLocationId(lat, lon), userId]
      )
    : runQuery<UserPreferenceRow>(
        `
          SELECT preference_type, preference_value
          FROM user_preferences
          WHERE location_id = ?
          ORDER BY preference_type
        `,
        [formatLocationId(lat, lon)]
      );
}

export async function listLocations(
  limit = 100,
  offset = 0,
  userId?: string
): Promise<LocationResponseItem[]> {
  const rows = userId
    ? await runQuery<LocationRow>(
        `
          SELECT DISTINCT location_id
          FROM user_preferences
          WHERE user_id = ?
          ORDER BY location_id
          LIMIT ? OFFSET ?
        `,
        [userId, limit, offset]
      )
    : await runQuery<LocationRow>(
        `
          SELECT DISTINCT location_id
          FROM user_preferences
          ORDER BY location_id
          LIMIT ? OFFSET ?
        `,
        [limit, offset]
      );

  return rows.map((row) => parseLocationId(row.location_id));
}

export async function countLocations(userId?: string): Promise<number> {
  const rows = userId
    ? await runQuery<{ count: number }>(
        `
          SELECT COUNT(*) AS count
          FROM (
            SELECT DISTINCT location_id
            FROM user_preferences
            WHERE user_id = ?
          )
        `,
        [userId]
      )
    : await runQuery<{ count: number }>(
        `
          SELECT COUNT(*) AS count
          FROM (
            SELECT DISTINCT location_id
            FROM user_preferences
          )
        `
      );

  return rows[0]?.count ?? 0;
}
