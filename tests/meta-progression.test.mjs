import test from "node:test";
import assert from "node:assert/strict";

import {
  META_PROGRESS_KEY,
  calculateMetaUpgradeCost,
  canPurchaseMetaUpgrade,
  createDefaultMetaState,
  metaUpgrades,
  normalizeMetaState,
  purchaseMetaUpgrade,
} from "../meta-progression.js";

const FIELD_ENGINEERING_IDS = Object.freeze([
  "field_heavy_caliber",
  "field_overdrive_motors",
  "field_rapid_redeployment",
]);

test("Field Engineering extends the existing registry from 17 to 20 upgrades", () => {
  assert.equal(Object.keys(metaUpgrades).length, 20);
  assert.equal(META_PROGRESS_KEY, "block-zero-meta-v1");
  for (const id of FIELD_ENGINEERING_IDS) {
    assert.equal(metaUpgrades[id].id, id);
    assert.equal(metaUpgrades[id].category, "field_engineering");
    assert.equal(metaUpgrades[id].maxLevel, 5);
  }
  assert.equal(Object.hasOwn(metaUpgrades, "field_overdrive_feed"), false);
});

test("Field Engineering reuses comparable five-level cost curves", () => {
  const expectedCosts = {
    field_heavy_caliber: [180, 403, 626, 849, 1072],
    field_overdrive_motors: [220, 492, 764, 1036, 1308],
    field_rapid_redeployment: [170, 382, 594, 806, 1018],
  };
  for (const [id, expected] of Object.entries(expectedCosts)) {
    const upgrade = metaUpgrades[id];
    const actual = Array.from(
      { length: upgrade.maxLevel },
      (_, level) => calculateMetaUpgradeCost(upgrade, level),
    );
    assert.deepEqual(actual, expected, id);
  }
  assert.deepEqual(
    [metaUpgrades.field_heavy_caliber.baseCost, metaUpgrades.field_heavy_caliber.costScale],
    [metaUpgrades.armory_damage.baseCost, metaUpgrades.armory_damage.costScale],
  );
  assert.deepEqual(
    [metaUpgrades.field_overdrive_motors.baseCost, metaUpgrades.field_overdrive_motors.costScale],
    [metaUpgrades.armory_fire_rate.baseCost, metaUpgrades.armory_fire_rate.costScale],
  );
  assert.deepEqual(
    [metaUpgrades.field_rapid_redeployment.baseCost, metaUpgrades.field_rapid_redeployment.costScale],
    [metaUpgrades.armory_range.baseCost, metaUpgrades.armory_range.costScale],
  );
});

test("an old block-zero-meta-v1 save keeps existing progress and defaults new fields to zero", () => {
  const oldSave = {
    credits: 4321,
    totalEarnedCredits: 7654,
    unlockedMetaUpgrades: ["weapon_mastery", "armory_damage"],
    metaUpgradeLevels: {
      max_health: 2,
      weapon_mastery: 4,
      armory_damage: 3,
      armory_fire_rate: 1,
    },
    totalRuns: 19,
    totalKills: 876,
    bestWaveEver: 14,
    bestScoreEver: 54321,
  };

  const normalized = normalizeMetaState(oldSave);
  assert.equal(normalized.credits, oldSave.credits);
  assert.equal(normalized.totalEarnedCredits, oldSave.totalEarnedCredits);
  assert.equal(normalized.metaUpgradeLevels.max_health, 2);
  assert.equal(normalized.metaUpgradeLevels.weapon_mastery, 4);
  assert.equal(normalized.metaUpgradeLevels.armory_damage, 3);
  assert.equal(normalized.metaUpgradeLevels.armory_fire_rate, 1);
  assert.equal(normalized.totalRuns, oldSave.totalRuns);
  assert.equal(normalized.totalKills, oldSave.totalKills);
  assert.equal(normalized.bestWaveEver, oldSave.bestWaveEver);
  assert.equal(normalized.bestScoreEver, oldSave.bestScoreEver);
  for (const id of FIELD_ENGINEERING_IDS) {
    assert.equal(normalized.metaUpgradeLevels[id], 0);
  }
});

test("Field Engineering levels clamp to the existing zero-to-max guards", () => {
  const normalized = normalizeMetaState({
    metaUpgradeLevels: {
      field_heavy_caliber: -2,
      field_overdrive_motors: 6,
      field_rapid_redeployment: 99,
    },
  });
  assert.equal(normalized.metaUpgradeLevels.field_heavy_caliber, 0);
  assert.equal(normalized.metaUpgradeLevels.field_overdrive_motors, 5);
  assert.equal(normalized.metaUpgradeLevels.field_rapid_redeployment, 5);
});

test("Field Engineering purchase uses the ordinary currency and survives save normalization", () => {
  const state = createDefaultMetaState();
  state.credits = 1000;
  const result = purchaseMetaUpgrade(state, "field_heavy_caliber");
  assert.deepEqual(result, { purchased: true, cost: 180 });
  assert.equal(state.credits, 820);
  assert.equal(state.metaUpgradeLevels.field_heavy_caliber, 1);
  assert.ok(state.unlockedMetaUpgrades.includes("field_heavy_caliber"));

  const reloaded = normalizeMetaState(JSON.parse(JSON.stringify(state)));
  assert.equal(reloaded.credits, 820);
  assert.equal(reloaded.metaUpgradeLevels.field_heavy_caliber, 1);
});

test("insufficient credits and MAX both block Field Engineering purchases", () => {
  const poorState = createDefaultMetaState();
  poorState.credits = 179;
  assert.equal(canPurchaseMetaUpgrade(poorState, "field_heavy_caliber"), false);
  assert.deepEqual(
    purchaseMetaUpgrade(poorState, "field_heavy_caliber"),
    { purchased: false, cost: 0 },
  );
  assert.equal(poorState.credits, 179);
  assert.equal(poorState.metaUpgradeLevels.field_heavy_caliber, 0);

  const maxState = createDefaultMetaState();
  maxState.credits = 99999;
  maxState.metaUpgradeLevels.field_overdrive_motors = 5;
  assert.equal(canPurchaseMetaUpgrade(maxState, "field_overdrive_motors"), false);
  assert.deepEqual(
    purchaseMetaUpgrade(maxState, "field_overdrive_motors"),
    { purchased: false, cost: 0 },
  );
  assert.equal(maxState.credits, 99999);
  assert.equal(maxState.metaUpgradeLevels.field_overdrive_motors, 5);
});
