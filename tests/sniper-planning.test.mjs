import test from "node:test";
import assert from "node:assert/strict";

import { planSnipersForWave } from "../wave-planning.js";

function randomSequence(...values) {
  let index = 0;
  return () => {
    assert.ok(index < values.length, "planner requested an unexpected random value");
    const value = values[index];
    index += 1;
    return value;
  };
}

function randomMustNotRun() {
  assert.fail("planner should not request a random value for this wave");
}

test("planSnipersForWave plans no Snipers on waves 1 through 4", () => {
  for (const wave of [1, 2, 3, 4]) {
    const plan = planSnipersForWave(wave, false, 20, false, randomMustNotRun);
    assert.equal(plan.sniperPlannedCount, 0);
    assert.deepEqual(plan.sniperSpawnIndices, []);
    assert.equal(plan.maxActiveSnipers, 0);
  }
});

test("planSnipersForWave uses the 40 percent chance on waves 5 through 7", () => {
  for (const wave of [5, 6, 7]) {
    const below = planSnipersForWave(
      wave,
      false,
      20,
      false,
      randomSequence(0.39, 0.5),
    );
    const above = planSnipersForWave(
      wave,
      false,
      20,
      false,
      randomSequence(0.41),
    );

    assert.equal(below.sniperPlannedCount, 1);
    assert.equal(below.maxActiveSnipers, 1);
    assert.equal(above.sniperPlannedCount, 0);
  }
});

test("planSnipersForWave excludes the exact 0.40 boundary on early waves", () => {
  const plan = planSnipersForWave(5, false, 20, false, randomSequence(0.4));

  assert.equal(plan.sniperPlannedCount, 0);
});

test("planSnipersForWave suppresses waves 5 through 7 when a Tech-Priest is planned", () => {
  for (const wave of [5, 6, 7]) {
    const plan = planSnipersForWave(wave, false, 20, true, randomMustNotRun);
    assert.equal(plan.sniperPlannedCount, 0);
  }
});

test("planSnipersForWave uses the 65 percent chance on waves 8 through 11", () => {
  for (const wave of [8, 9, 10, 11]) {
    const below = planSnipersForWave(
      wave,
      false,
      20,
      false,
      randomSequence(0.64, 0.5),
    );
    const above = planSnipersForWave(
      wave,
      false,
      20,
      false,
      randomSequence(0.66),
    );

    assert.equal(below.sniperPlannedCount, 1);
    assert.equal(below.maxActiveSnipers, 1);
    assert.equal(above.sniperPlannedCount, 0);
  }
});

test("planSnipersForWave excludes the exact 0.65 boundary on mid waves", () => {
  const plan = planSnipersForWave(8, false, 20, false, randomSequence(0.65));

  assert.equal(plan.sniperPlannedCount, 0);
});

test("planSnipersForWave allows a Sniper and Tech-Priest to coexist from wave 8", () => {
  const plan = planSnipersForWave(8, false, 20, true, randomSequence(0.1, 0.5));

  assert.equal(plan.sniperPlannedCount, 1);
  assert.equal(plan.maxActiveSnipers, 1);
});

test("planSnipersForWave guarantees one Sniper and can add a second from wave 12", () => {
  const twoSnipers = planSnipersForWave(
    12,
    false,
    20,
    false,
    randomSequence(0.34, 0, 0),
  );
  const oneSniper = planSnipersForWave(
    12,
    false,
    20,
    false,
    randomSequence(0.36, 0),
  );

  assert.equal(twoSnipers.sniperPlannedCount, 2);
  assert.equal(twoSnipers.maxActiveSnipers, 2);
  assert.equal(oneSniper.sniperPlannedCount, 1);
  assert.equal(oneSniper.maxActiveSnipers, 2);
});

test("planSnipersForWave preserves late-wave rules at wave 20", () => {
  const twoSnipers = planSnipersForWave(
    20,
    false,
    20,
    true,
    randomSequence(0.1, 0.5, 0.5),
  );
  const oneSniper = planSnipersForWave(
    20,
    false,
    20,
    true,
    randomSequence(0.9, 0.5),
  );

  assert.equal(twoSnipers.sniperPlannedCount, 2);
  assert.equal(oneSniper.sniperPlannedCount, 1);
});

test("planSnipersForWave plans no Snipers when the boss-wave flag is set", () => {
  for (const wave of [4, 8, 12, 20]) {
    const plan = planSnipersForWave(wave, true, 20, false, randomMustNotRun);
    assert.equal(plan.sniperPlannedCount, 0);
    assert.deepEqual(plan.sniperSpawnIndices, []);
  }
});

test("planSnipersForWave keeps the first spawn in the 22 to 42 percent slot band", () => {
  const lower = planSnipersForWave(
    5,
    false,
    100,
    false,
    randomSequence(0.1, 0),
  );
  const upper = planSnipersForWave(
    5,
    false,
    100,
    false,
    randomSequence(0.1, 0.999999),
  );

  assert.deepEqual(lower.sniperSpawnIndices, [22]);
  assert.deepEqual(upper.sniperSpawnIndices, [41]);
});

test("planSnipersForWave keeps the second spawn later and in its 62 to 82 percent band", () => {
  const lower = planSnipersForWave(
    12,
    false,
    100,
    false,
    randomSequence(0.1, 0, 0),
  );
  const upper = planSnipersForWave(
    12,
    false,
    100,
    false,
    randomSequence(0.1, 0.999999, 0.999999),
  );

  assert.deepEqual(lower.sniperSpawnIndices, [22, 62]);
  assert.deepEqual(upper.sniperSpawnIndices, [41, 81]);
  assert.ok(lower.sniperSpawnIndices[1] > lower.sniperSpawnIndices[0]);
  assert.ok(upper.sniperSpawnIndices[1] > upper.sniperSpawnIndices[0]);
  assert.equal(new Set(lower.sniperSpawnIndices).size, 2);
  assert.equal(new Set(upper.sniperSpawnIndices).size, 2);
});

test("planSnipersForWave never plans more Snipers than regular spawn slots", () => {
  const plan = planSnipersForWave(
    12,
    false,
    1,
    false,
    randomSequence(0.1, 0),
  );

  assert.equal(plan.sniperPlannedCount, 1);
  assert.deepEqual(plan.sniperSpawnIndices, [0]);
  assert.ok(plan.sniperSpawnIndices.every((index) => index >= 0 && index < 1));
});
