import test from "node:test";
import assert from "node:assert/strict";
import { resetConfigForTests } from "../src/config";
import {
  countLocations,
  getPreferencesByCoordinates,
  listLocations
} from "../src/repositories/locationRepository";
import { createTestDb, insertPreferences } from "./helpers/testDb";

const dbPath = createTestDb("location-repository");
process.env.DB_PATH = dbPath;
process.env.ANALYTICS_API_KEY = "test-analytics-key";
resetConfigForTests();

insertPreferences(dbPath, [
  {
    user_id: "user-1",
    location_id: "40.71,-74.01",
    preference_type: "activity_type",
    preference_value: "running"
  },
  {
    user_id: "user-2",
    location_id: "41.00,-73.50",
    preference_type: "activity_type",
    preference_value: "cycling"
  },
  {
    user_id: "user-3",
    location_id: "41.00,-73.50",
    preference_type: "temperature_unit",
    preference_value: "celsius"
  },
  {
    user_id: "user-1",
    location_id: "41.00,-73.50",
    preference_type: "weekly_goal",
    preference_value: "3"
  }
]);

test("getPreferencesByCoordinates rounds coordinates when querying", async () => {
  const rows = await getPreferencesByCoordinates(40.714, -74.006);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].preference_type, "activity_type");
  assert.equal(rows[0].preference_value, "running");
});

test("getPreferencesByCoordinates filters by user_id when provided", async () => {
  const rows = await getPreferencesByCoordinates(40.714, -74.006, "user-1");

  assert.equal(rows.length, 1);
  assert.equal(rows[0].preference_type, "activity_type");
  assert.equal(rows[0].preference_value, "running");
});

test("listLocations returns distinct locations", async () => {
  const locations = await listLocations();
  assert.deepEqual(locations, [
    { location_id: "40.71,-74.01", lat: 40.71, lon: -74.01 },
    { location_id: "41.00,-73.50", lat: 41, lon: -73.5 }
  ]);
});

test("listLocations supports limit and offset pagination", async () => {
  const locations = await listLocations(1, 1);
  assert.deepEqual(locations, [{ location_id: "41.00,-73.50", lat: 41, lon: -73.5 }]);
});

test("countLocations returns the total distinct location count", async () => {
  const count = await countLocations();
  assert.equal(count, 2);
});

test("listLocations supports filtering by user_id", async () => {
  const locations = await listLocations(100, 0, "user-1");
  assert.deepEqual(locations, [
    { location_id: "40.71,-74.01", lat: 40.71, lon: -74.01 },
    { location_id: "41.00,-73.50", lat: 41, lon: -73.5 }
  ]);
});

test("countLocations supports filtering by user_id", async () => {
  const count = await countLocations("user-1");
  assert.equal(count, 2);
});
