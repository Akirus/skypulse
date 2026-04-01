import { UpstreamServiceError } from "../errors";
import { saveStatistics } from "../clients/analyticsClient";
import { getAirQuality, getWeather } from "../clients/weatherClient";
import { getPreferencesByCoordinates } from "../repositories/locationRepository";
import {
  ActivityScoreResponse,
  AirQualityResponse,
  UserPreferenceRow,
  WeatherResponse
} from "../types";

export function calculateOutdoorScore(
  weather: WeatherResponse,
  airQuality: AirQualityResponse
): number {
  let score = 100;

  const current = weather.current_weather || {};
  const temp = current.temperature ?? 20;
  const wind = current.windspeed ?? 0;

  if (temp < 10 || temp > 32) {
    score -= 30;
  } else if (temp < 15 || temp > 28) {
    score -= 15;
  }

  if (wind > 30) {
    score -= 25;
  } else if (wind > 20) {
    score -= 10;
  }

  const currentAq = airQuality.current || {};
  const pm25 = currentAq.pm2_5 ?? 0;
  const pm10 = currentAq.pm10 ?? 0;

  if (pm25 > 50) {
    score -= 30;
  } else if (pm25 > 25) {
    score -= 15;
  } else if (pm25 > 15) {
    score -= 5;
  }

  if (pm10 > 100) {
    score -= 20;
  } else if (pm10 > 50) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function buildRecommendation(
  score: number,
  preferences: UserPreferenceRow[],
  weather: WeatherResponse,
  airQuality: AirQualityResponse
): string {
  const preferenceMap = new Map(
    preferences.map((preference) => [preference.preference_type, preference.preference_value])
  );
  const activityType = preferenceMap.get("activity_type");
  const preferredTime = preferenceMap.get("preferred_time");
  const windSensitivity = preferenceMap.get("wind_sensitivity");
  const airQualityThreshold = Number(preferenceMap.get("air_quality_threshold"));
  const wind = weather.current_weather?.windspeed ?? 0;
  const pm25 = airQuality.current?.pm2_5 ?? 0;

  const activityLabel = activityType ? `${activityType}` : "outdoor activities";

  if (Number.isFinite(airQualityThreshold) && pm25 > airQualityThreshold) {
    return `Air quality is below your preferred threshold for ${activityLabel}`;
  }

  const windThresholdBySensitivity: Record<string, number> = {
    low: 30,
    medium: 20,
    high: 10
  };

  if (windSensitivity && wind > (windThresholdBySensitivity[windSensitivity] ?? Number.POSITIVE_INFINITY)) {
    return `Wind may be uncomfortable for your ${windSensitivity} wind sensitivity`;
  }

  if (score < 50) {
    return `Conditions are poor for ${activityLabel} today`;
  }

  if (score < 70) {
    return `Moderate conditions - light ${activityLabel} recommended`;
  }

  if (preferredTime && preferredTime !== "any") {
    return `Good conditions for ${activityLabel} in the ${preferredTime}`;
  }

  return `Good conditions for ${activityLabel}`;
}

export async function getActivityScore(
  lat: number,
  lon: number,
  userId?: string
): Promise<ActivityScoreResponse> {
  let weather: WeatherResponse;
  let airQuality: AirQualityResponse;

  try {
    [weather, airQuality] = await Promise.all([
      getWeather(lat, lon),
      getAirQuality(lat, lon)
    ]);
  } catch (error) {
    if (error instanceof UpstreamServiceError) {
      throw error;
    }

    throw new UpstreamServiceError("Failed to fetch weather inputs");
  }

  const score = calculateOutdoorScore(weather, airQuality);

  const preferences = await getPreferencesByCoordinates(lat, lon, userId);
  await saveStatistics(userId, lat, lon, score);

  return {
    score,
    recommendation: buildRecommendation(score, preferences, weather, airQuality),
    preferences,
    weather: {
      temperature: weather.current_weather?.temperature,
      wind_speed: weather.current_weather?.windspeed,
      conditions: weather.current_weather?.weathercode
    },
    air_quality: {
      pm2_5: airQuality.current?.pm2_5,
      pm10: airQuality.current?.pm10
    }
  };
}
