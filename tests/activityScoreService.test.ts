import test from "node:test";
import assert from "node:assert/strict";
import { calculateOutdoorScore } from "../src/services/activityScoreService";

test("calculateOutdoorScore returns 100 for ideal conditions", () => {
  const score = calculateOutdoorScore(
    {
      current_weather: {
        temperature: 20,
        windspeed: 10
      }
    },
    {
      current: {
        pm2_5: 10,
        pm10: 20
      }
    }
  );

  assert.equal(score, 100);
});

test("calculateOutdoorScore applies stacked penalties and clamps at zero", () => {
  const score = calculateOutdoorScore(
    {
      current_weather: {
        temperature: 33,
        windspeed: 31
      }
    },
    {
      current: {
        pm2_5: 55,
        pm10: 120
      }
    }
  );

  assert.equal(score, 0);
});

test("calculateOutdoorScore uses default values when source data is missing", () => {
  assert.equal(calculateOutdoorScore({}, {}), 100);
});

test("calculateOutdoorScore applies medium threshold penalties correctly", () => {
  const score = calculateOutdoorScore(
    {
      current_weather: {
        temperature: 29,
        windspeed: 21
      }
    },
    {
      current: {
        pm2_5: 26,
        pm10: 51
      }
    }
  );

  assert.equal(score, 50);
});
