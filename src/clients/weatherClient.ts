import { getConfig } from "../config";
import { UpstreamServiceError } from "../errors";
import { AirQualityResponse, WeatherResponse } from "../types";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const CACHE_CLEANUP_INTERVAL_MS = 60 * 1000;
const weatherCache = new Map<string, CacheEntry<WeatherResponse>>();
const airQualityCache = new Map<string, CacheEntry<AirQualityResponse>>();

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) {
      throw new UpstreamServiceError(`Upstream request failed with status ${resp.status}`);
    }

    return (await resp.json()) as T;
  } catch (error) {
    if (error instanceof UpstreamServiceError) {
      throw error;
    }

    throw new UpstreamServiceError("Failed to fetch upstream weather data");
  } finally {
    clearTimeout(timeout);
  }
}

function getCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function pruneExpiredEntries<T>(cache: Map<string, CacheEntry<T>>): void {
  const now = Date.now();

  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function startCacheCleanup(): void {
  const interval = setInterval(() => {
    pruneExpiredEntries(weatherCache);
    pruneExpiredEntries(airQualityCache);
  }, CACHE_CLEANUP_INTERVAL_MS);

  interval.unref();
}

function enforceMaxSize<T>(cache: Map<string, CacheEntry<T>>, maxSize: number): void {
  while (cache.size > maxSize) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) {
      return;
    }

    cache.delete(oldestKey);
  }
}

function setCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  const config = getConfig();
  cache.delete(key);
  cache.set(key, {
    value,
    expiresAt: Date.now() + config.weatherCacheTtlMs
  });
  enforceMaxSize(cache, config.weatherCacheMaxSize);
}

startCacheCleanup();

export async function getWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const cacheKey = getCacheKey(lat, lon);
  const cached = getCachedValue(weatherCache, cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetchJsonWithTimeout<WeatherResponse>(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  );

  setCachedValue(weatherCache, cacheKey, response);
  return response;
}

export async function getAirQuality(
  lat: number,
  lon: number
): Promise<AirQualityResponse> {
  const cacheKey = getCacheKey(lat, lon);
  const cached = getCachedValue(airQualityCache, cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetchJsonWithTimeout<AirQualityResponse>(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5`
  );

  setCachedValue(airQualityCache, cacheKey, response);
  return response;
}
