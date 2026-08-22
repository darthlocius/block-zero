import assert from "node:assert/strict";
import test from "node:test";

import {
  beginEngineeringPlacement,
  cancelEngineeringPlacement,
  hasActiveEngineeringPlacement,
  releaseEngineeringPlacement,
  selectedEngineeringDevice,
} from "../engineering-device-control.js";
import { createManticoreAbilityState } from "../manticore.js";
import { createTurretAbilityState } from "../turret.js";

const point = Object.freeze({ x: 620, y: 500 });

function placementContext() {
  return {
    player: { x: 500, y: 500, radius: 18 },
    worldWidth: 2000,
    worldHeight: 1200,
    solids: [],
    actors: [],
    enemies: [],
  };
}

function engineeringWorld(runDevice) {
  return {
    engineeringLoadout: { runDevice },
    turretAbility: createTurretAbilityState(),
    manticoreAbility: createManticoreAbilityState(),
  };
}

test("runDevice bastion7 routes Q begin only to Bastion", () => {
  const world = engineeringWorld("bastion7");
  assert.equal(selectedEngineeringDevice(world), "bastion7");
  assert.equal(beginEngineeringPlacement(world, point, placementContext()), true);
  assert.equal(world.turretAbility.placement.active, true);
  assert.equal(world.manticoreAbility.placement.active, false);
  assert.equal(hasActiveEngineeringPlacement(world), true);
});

test("runDevice manticore4 routes Q begin only to Manticore", () => {
  const world = engineeringWorld("manticore4");
  assert.equal(beginEngineeringPlacement(world, point, placementContext()), true);
  assert.equal(world.turretAbility.placement.active, false);
  assert.equal(world.manticoreAbility.placement.active, true);
  assert.equal(hasActiveEngineeringPlacement(world), true);
});

test("Q release deploys only the selected engineering device", () => {
  for (const deviceId of ["bastion7", "manticore4"]) {
    const world = engineeringWorld(deviceId);
    beginEngineeringPlacement(world, point, placementContext());
    const result = releaseEngineeringPlacement(world, point, placementContext());
    assert.equal(result.deployed, true, deviceId);
    assert.equal(Boolean(world.turretAbility.active), deviceId === "bastion7");
    assert.equal(Boolean(world.manticoreAbility.active), deviceId === "manticore4");
  }
});

test("Esc or RMB cancellation clears only the selected preview without cooldown", () => {
  for (const deviceId of ["bastion7", "manticore4"]) {
    const world = engineeringWorld(deviceId);
    beginEngineeringPlacement(world, point, placementContext());
    assert.equal(cancelEngineeringPlacement(world), true, deviceId);
    assert.equal(hasActiveEngineeringPlacement(world), false, deviceId);
    assert.equal(world.turretAbility.cooldown, 0, deviceId);
    assert.equal(world.manticoreAbility.cooldown, 0, deviceId);
    assert.equal(world.turretAbility.active, null, deviceId);
    assert.equal(world.manticoreAbility.active, null, deviceId);
  }
});

test("unknown or null runDevice never starts the Manticore path", () => {
  for (const deviceId of [null, "unknown-device"]) {
    const world = engineeringWorld(deviceId);
    assert.equal(beginEngineeringPlacement(world, point, placementContext()), false);
    assert.deepEqual(
      releaseEngineeringPlacement(world, point, placementContext()),
      { deployed: false, reason: "unknown_device" },
    );
    assert.equal(cancelEngineeringPlacement(world), false);
    assert.equal(world.turretAbility.placement.active, false);
    assert.equal(world.manticoreAbility.placement.active, false);
  }
});

test("Bastion routing preserves its existing deployment contract", () => {
  const world = engineeringWorld("bastion7");
  beginEngineeringPlacement(world, point, placementContext());
  const result = releaseEngineeringPlacement(world, point, placementContext());
  assert.equal(result.reason, "deployed");
  assert.equal(result.turret, world.turretAbility.active);
  assert.equal(world.turretAbility.active.remaining, 30);
  assert.equal(world.turretAbility.cooldown, 0);
  assert.equal(world.manticoreAbility.active, null);
});
