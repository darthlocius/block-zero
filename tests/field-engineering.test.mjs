import test from "node:test";
import assert from "node:assert/strict";

import {
  FIELD_ENGINEERING_CONFIG,
  getFieldEngineeringCooldown,
  getFieldEngineeringCooldownMultiplier,
  getFieldEngineeringDamageMultiplier,
  getFieldEngineeringFireRateMultiplier,
  getFieldEngineeringShotInterval,
  normalizeFieldEngineeringLevel,
} from "../field-engineering.js";

function assertClose(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

test("Field Engineering levels normalize safely to the zero-to-five range", () => {
  assert.equal(FIELD_ENGINEERING_CONFIG.maxLevel, 5);
  assert.equal(normalizeFieldEngineeringLevel(-1), 0);
  assert.equal(normalizeFieldEngineeringLevel(0), 0);
  assert.equal(normalizeFieldEngineeringLevel(1), 1);
  assert.equal(normalizeFieldEngineeringLevel(5), 5);
  assert.equal(normalizeFieldEngineeringLevel(6), 5);
  assert.equal(normalizeFieldEngineeringLevel(Number.NaN), 0);
  assert.equal(normalizeFieldEngineeringLevel(Number.POSITIVE_INFINITY), 0);
  assert.equal(normalizeFieldEngineeringLevel(Number.NEGATIVE_INFINITY), 0);
  assert.equal(normalizeFieldEngineeringLevel(undefined), 0);
  assert.equal(normalizeFieldEngineeringLevel("invalid"), 0);
  assert.equal(normalizeFieldEngineeringLevel(Symbol("invalid")), 0);
});

test("Heavy Caliber adds six percent damage per normalized level", () => {
  assertClose(getFieldEngineeringDamageMultiplier(0), 1);
  assertClose(getFieldEngineeringDamageMultiplier(1), 1.06);
  assertClose(getFieldEngineeringDamageMultiplier(5), 1.30);
});

test("Overdrive Motors adds four percent fire rate per normalized level", () => {
  assertClose(getFieldEngineeringFireRateMultiplier(0), 1);
  assertClose(getFieldEngineeringFireRateMultiplier(5), 1.20);
});

test("Rapid Redeployment removes four percent cooldown per normalized level", () => {
  assertClose(getFieldEngineeringCooldownMultiplier(0), 1);
  assertClose(getFieldEngineeringCooldownMultiplier(1), 0.96);
  assertClose(getFieldEngineeringCooldownMultiplier(5), 0.80);
});

test("Field Engineering fire rate scales any supplied base shot interval", () => {
  assertClose(getFieldEngineeringShotInterval(0.10, 5), 0.08333333333333334);
  assertClose(getFieldEngineeringShotInterval(0.24, 5), 0.20);
});

test("Field Engineering cooldown scales any supplied base cooldown", () => {
  assertClose(getFieldEngineeringCooldown(30, 5), 24);
  assertClose(getFieldEngineeringCooldown(45, 5), 36);
});
