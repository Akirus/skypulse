import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import httpMocks from "node-mocks-http";
import { resetConfigForTests } from "../src/config";
import { createApp } from "../src/app";
import { createTestDb, insertPreferences } from "./helpers/testDb";

const dbPath = createTestDb("app");
process.env.DB_PATH = dbPath;
process.env.ANALYTICS_API_KEY = "test-analytics-key";
resetConfigForTests();

insertPreferences(
  dbPath,
  Array.from({ length: 130 }, (_, index) => ({
    user_id: `user-${index}`,
    location_id: `10.${String(index).padStart(2, "0")},20.${String(index).padStart(2, "0")}`,
    preference_type: "activity_type",
    preference_value: "walking"
  }))
);

insertPreferences(dbPath, [
  {
    user_id: "duplicate-a",
    location_id: "40.71,-74.01",
    preference_type: "activity_type",
    preference_value: "running"
  },
  {
    user_id: "duplicate-b",
    location_id: "40.71,-74.01",
    preference_type: "temperature_unit",
    preference_value: "celsius"
  },
  {
    user_id: "test-user",
    location_id: "40.71,-74.01",
    preference_type: "activity_type",
    preference_value: "running"
  },
  {
    user_id: "test-user",
    location_id: "40.71,-74.01",
    preference_type: "weekly_goal",
    preference_value: "4"
  },
  {
    user_id: "test-user",
    location_id: "40.71,-74.01",
    preference_type: "wind_sensitivity",
    preference_value: "high"
  },
  {
    user_id: "filter-user",
    location_id: "48.86,2.35",
    preference_type: "activity_type",
    preference_value: "walking"
  },
  {
    user_id: "filter-user",
    location_id: "51.51,-0.13",
    preference_type: "temperature_unit",
    preference_value: "celsius"
  },
  {
    user_id: "filter-user",
    location_id: "48.86,2.35",
    preference_type: "weekly_goal",
    preference_value: "4"
  }
]);

let analyticsCalls: Array<{ url: string; body: string | undefined }> = [];

async function invokeApp(url: string) {
  const app = createApp();
  const req = httpMocks.createRequest({
    method: "GET",
    url
  });
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter
  });

  await new Promise<void>((resolve, reject) => {
    res.on("end", resolve);
    res.on("error", reject);
    (app as typeof app & { handle: (req: unknown, res: unknown, next: (err?: Error) => void) => void })
      .handle(req, res, reject);
  });

  return {
    status: res.statusCode,
    body: JSON.parse(res._getData() || "{}")
  };
}

beforeEach(() => {
  analyticsCalls = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/forecast")) {
      return new Response(
        JSON.stringify({
          current_weather: {
            temperature: 24,
            windspeed: 13.4,
            weathercode: 2
          }
        })
      );
    }

    if (url.includes("/air-quality")) {
      return new Response(
        JSON.stringify({
          current: {
            pm2_5: 15.1,
            pm10: 15.8
          }
        })
      );
    }

    analyticsCalls.push({
      url,
      body: init?.body as string | undefined
    });

    return new Response(JSON.stringify({ ok: true }));
  }) as typeof fetch;
});

test("GET /api/v1/activity-score returns 400 when lat is missing", async () => {
  const response = await invokeApp("/api/v1/activity-score?lon=-74.01");

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "lat and lon are required" });
});

test("GET /health/live returns process liveness", async () => {
  const response = await invokeApp("/health/live");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test("GET /health/ready returns readiness", async () => {
  const response = await invokeApp("/health/ready");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ready" });
});

test("GET /api/v1/activity-score returns 400 when lon is invalid", async () => {
  const response = await invokeApp("/api/v1/activity-score?lat=40.71&lon=abc");

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "lat and lon must be numbers" });
});

test("GET /api/v1/activity-score returns expected payload and analytics event", async () => {
  const response = await invokeApp(
    "/api/v1/activity-score?lat=40.71&lon=-74.01&user_id=test-user"
  );

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    score: 95,
    recommendation: "Wind may be uncomfortable for your high wind sensitivity",
    preferences: [
      {
        preference_type: "activity_type",
        preference_value: "running"
      },
      {
        preference_type: "weekly_goal",
        preference_value: "4"
      },
      {
        preference_type: "wind_sensitivity",
        preference_value: "high"
      }
    ],
    weather: {
      temperature: 24,
      wind_speed: 13.4,
      conditions: 2
    },
    air_quality: {
      pm2_5: 15.1,
      pm10: 15.8
    }
  });
  assert.equal(analyticsCalls.length, 1);
  assert.match(analyticsCalls[0].url, /httpbin\.org\/post/);
  assert.deepEqual(JSON.parse(analyticsCalls[0].body ?? "{}"), {
    event: "activity_score_calculated",
    user_id: "test-user",
    latitude: 40.71,
    longitude: -74.01,
    score: 95,
    timestamp: JSON.parse(analyticsCalls[0].body ?? "{}").timestamp
  });
});

test("GET /api/v1/locations returns paginated distinct locations with metadata", async () => {
  const response = await invokeApp("/api/v1/locations");

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(response.body.locations), true);
  assert.equal(response.body.locations.length, 100);
  assert.equal(new Set(response.body.locations.map((location: { location_id: string }) => location.location_id)).size, 100);
  assert.deepEqual(response.body.locations[0], {
    location_id: "10.00,20.00",
    lat: 10,
    lon: 20
  });
  assert.deepEqual(response.body.pagination, {
    page: 1,
    limit: 100,
    total: 133,
    total_pages: 2
  });
});

test("GET /api/v1/locations supports custom page and limit", async () => {
  const response = await invokeApp("/api/v1/locations?page=2&limit=20");

  assert.equal(response.status, 200);
  assert.equal(response.body.locations.length, 20);
  assert.deepEqual(response.body.pagination, {
    page: 2,
    limit: 20,
    total: 133,
    total_pages: 7
  });
});

test("GET /api/v1/locations supports filtering by user_id", async () => {
  const response = await invokeApp("/api/v1/locations?user_id=filter-user");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.locations, [
    { location_id: "48.86,2.35", lat: 48.86, lon: 2.35 },
    { location_id: "51.51,-0.13", lat: 51.51, lon: -0.13 }
  ]);
  assert.deepEqual(response.body.pagination, {
    page: 1,
    limit: 100,
    total: 2,
    total_pages: 1
  });
});

test("GET /api/v1/locations rejects invalid pagination params", async () => {
  const invalidPage = await invokeApp("/api/v1/locations?page=0");
  assert.equal(invalidPage.status, 400);
  assert.deepEqual(invalidPage.body, {
    error: "page must be a positive integer"
  });

  const invalidLimit = await invokeApp("/api/v1/locations?limit=101");
  assert.equal(invalidLimit.status, 400);
  assert.deepEqual(invalidLimit.body, {
    error: "limit must be an integer between 1 and 100"
  });
});
