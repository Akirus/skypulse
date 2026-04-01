import path from "path";

export type AppConfig = {
  analyticsApiKey: string;
  analyticsEndpoint: string;
  port: number;
  upstreamTimeoutMs: number;
  weatherCacheTtlMs: number;
  weatherCacheMaxSize: number;
  dbPath: string;
};

let cachedConfig: AppConfig | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    analyticsApiKey: requireEnv("ANALYTICS_API_KEY"),
    analyticsEndpoint: process.env.ANALYTICS_ENDPOINT || "https://httpbin.org/post",
    port: parsePositiveInteger(process.env.PORT, 3000, "PORT"),
    upstreamTimeoutMs: parsePositiveInteger(
      process.env.UPSTREAM_TIMEOUT_MS,
      3000,
      "UPSTREAM_TIMEOUT_MS"
    ),
    weatherCacheTtlMs: parsePositiveInteger(
      process.env.WEATHER_CACHE_TTL_MS,
      5 * 60 * 1000,
      "WEATHER_CACHE_TTL_MS"
    ),
    weatherCacheMaxSize: parsePositiveInteger(
      process.env.WEATHER_CACHE_MAX_SIZE,
      500,
      "WEATHER_CACHE_MAX_SIZE"
    ),
    dbPath: process.env.DB_PATH || path.join(process.cwd(), "skypulse.db")
  };

  return cachedConfig;
}

export function resetConfigForTests(): void {
  cachedConfig = null;
}
