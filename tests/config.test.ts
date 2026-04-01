import test from "node:test";
import assert from "node:assert/strict";
import { getConfig, resetConfigForTests } from "../src/config";

test("getConfig throws when ANALYTICS_API_KEY is missing", () => {
  const originalValue = process.env.ANALYTICS_API_KEY;

  delete process.env.ANALYTICS_API_KEY;
  resetConfigForTests();

  assert.throws(() => getConfig(), /Missing required environment variable: ANALYTICS_API_KEY/);

  process.env.ANALYTICS_API_KEY = originalValue;
  resetConfigForTests();
});

test("getConfig validates WEATHER_CACHE_MAX_SIZE", () => {
  const originalAnalyticsKey = process.env.ANALYTICS_API_KEY;
  const originalCacheMaxSize = process.env.WEATHER_CACHE_MAX_SIZE;

  process.env.ANALYTICS_API_KEY = "test-key";
  process.env.WEATHER_CACHE_MAX_SIZE = "0";
  resetConfigForTests();

  assert.throws(() => getConfig(), /WEATHER_CACHE_MAX_SIZE must be a positive integer/);

  process.env.ANALYTICS_API_KEY = originalAnalyticsKey;
  process.env.WEATHER_CACHE_MAX_SIZE = originalCacheMaxSize;
  resetConfigForTests();
});
