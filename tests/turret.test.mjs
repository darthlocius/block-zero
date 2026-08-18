import test from "node:test";
import assert from "node:assert/strict";

import { I18N } from "../i18n.js";
import {
  FIELD_ENGINEERING_CONFIG,
  TURRET_AUDIO_CONFIG,
  TURRET_CONFIG,
  attemptDeployTurret,
  beginTurretPlacement,
  cancelTurretPlacement,
  createTurretAbilityState,
  getEffectiveTurretCooldown,
  getEffectiveTurretDamage,
  getEffectiveTurretShotInterval,
  getTurretCooldownMultiplier,
  getTurretFireRateMultiplier,
  getTurretHeavyCaliberMultiplier,
  getTurretLoopPlaybackRate,
  getTurretWaveDamageMultiplier,
  resetTurretAbilityState,
  releaseTurretPlacement,
  selectNearestVisibleTarget,
  spreadForDistance,
  stopActiveTurret,
  turretDamage,
  turretHudState,
  turretMuzzlePosition,
  updateTurretAbility,
  updateTurretCooldown,
  validateTurretPlacement,
} from "../turret.js";

const player = Object.freeze({ x: 500, y: 500, radius: 18 });

function placementContext(overrides = {}) {
  return {
    player,
    worldWidth: 2000,
    worldHeight: 1200,
    solids: [],
    actors: [],
    ...overrides,
  };
}

function validPoint() {
  return { x: 620, y: 500 };
}

function deployedAbility() {
  const ability = createTurretAbilityState();
  const result = attemptDeployTurret(ability, validPoint(), placementContext());
  assert.equal(result.deployed, true);
  return ability;
}

function assertClose(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

test("Bastion-7 config preserves the Field Engineering balance contract", () => {
  assert.equal(TURRET_CONFIG.cooldown, 30);
  assert.equal(TURRET_CONFIG.activeDuration, 30);
  assert.equal(TURRET_CONFIG.shotInterval, 0.10);
  assert.equal(TURRET_CONFIG.baseDamage, 10);
  assert.equal(TURRET_CONFIG.attackRange, 600);
  assert.equal(TURRET_CONFIG.bossDamageMultiplier, 0.6);
  assert.equal(TURRET_CONFIG.turnSpeed, 8);
  assert.equal(TURRET_CONFIG.deployDuration, 0.45);
  assert.equal(TURRET_CONFIG.placementRange, 480);
  assert.equal(TURRET_CONFIG.maxActive, 1);
  assert.equal(Object.hasOwn(TURRET_CONFIG, "ammo"), false);
  assert.equal(Object.hasOwn(TURRET_CONFIG, "burstSize"), false);
  assert.equal(Object.hasOwn(TURRET_CONFIG, "burstPause"), false);
  assert.equal(Object.isFrozen(TURRET_CONFIG), true);
  assert.equal(Object.isFrozen(TURRET_CONFIG.visual), true);
  assert.equal(FIELD_ENGINEERING_CONFIG.maxLevel, 5);
});

test("wave damage scaling starts after wave 4", () => {
  const expected = new Map([
    [1, 1],
    [4, 1],
    [5, 1.05],
    [7, 1.15],
    [12, 1.4],
    [20, 1.8],
  ]);
  for (const [wave, multiplier] of expected) {
    assertClose(getTurretWaveDamageMultiplier(wave), multiplier);
  }
});

test("Heavy Caliber adds 6 percent Bastion damage per level", () => {
  assertClose(getTurretHeavyCaliberMultiplier(0), 1);
  assertClose(getTurretHeavyCaliberMultiplier(1), 1.06);
  assertClose(getTurretHeavyCaliberMultiplier(5), 1.3);
  assertClose(getTurretHeavyCaliberMultiplier(6), 1.3);
  assertClose(getTurretHeavyCaliberMultiplier(-1), 1);
});

test("Overdrive Motors divides the base interval by its fire-rate multiplier", () => {
  assertClose(getTurretFireRateMultiplier(0), 1);
  assertClose(getEffectiveTurretShotInterval(0), 0.1);
  assertClose(getTurretFireRateMultiplier(5), 1.2);
  assertClose(getEffectiveTurretShotInterval(5), 1 / 12);
});

test("Rapid Redeployment scales the post-deactivation cooldown only", () => {
  assertClose(getTurretCooldownMultiplier(0), 1);
  assertClose(getEffectiveTurretCooldown(0), 30);
  assertClose(getEffectiveTurretCooldown(1), 28.8);
  assertClose(getEffectiveTurretCooldown(5), 24);
  assert.equal(TURRET_CONFIG.activeDuration, 30);
});

test("Bastion damage stacks wave, Heavy Caliber, and Armory once", () => {
  assertClose(getEffectiveTurretDamage({ wave: 7 }), 11.5);
  assertClose(getEffectiveTurretDamage({ wave: 7, heavyCaliberLevel: 5 }), 14.95);
  assertClose(getEffectiveTurretDamage({ wave: 12, heavyCaliberLevel: 5 }), 18.2);
  assertClose(getEffectiveTurretDamage({ wave: 20, heavyCaliberLevel: 5 }), 23.4);
  assertClose(getEffectiveTurretDamage({
    wave: 7,
    heavyCaliberLevel: 5,
    armoryDamageMultiplier: 1.2,
  }), 17.94);
});

test("Bastion loop playback rate follows Overdrive Motors", () => {
  assertClose(getTurretLoopPlaybackRate(0), TURRET_AUDIO_CONFIG.baseLoopPlaybackRate);
  assertClose(getTurretLoopPlaybackRate(3), 1.0528);
  assertClose(getTurretLoopPlaybackRate(5), 1.128);
});

test("placement accepts a clear point inside the 480-unit radius", () => {
  assert.deepEqual(
    validateTurretPlacement(validPoint(), placementContext()),
    { valid: true, reason: "valid" },
  );
});

test("placement rejects a point beyond 480 world units", () => {
  const result = validateTurretPlacement(
    { x: player.x + TURRET_CONFIG.placementRange + 0.01, y: player.y },
    placementContext(),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "out_of_range");
});

test("placement rejects a point too close to the player", () => {
  const result = validateTurretPlacement(
    { x: player.x + TURRET_CONFIG.minimumPlayerDistance - 0.01, y: player.y },
    placementContext(),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "too_close");
});

test("placement keeps the complete footprint inside world bounds", () => {
  const result = validateTurretPlacement(
    { x: TURRET_CONFIG.footprintRadius - 0.01, y: 500 },
    placementContext(),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "outside_world");
});

test("placement rejects overlap with a live solid", () => {
  const result = validateTurretPlacement(
    validPoint(),
    placementContext({ solids: [{ x: 640, y: 500, w: 42, h: 42 }] }),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "solid_overlap");
});

test("placement ignores destroyed solids", () => {
  const result = validateTurretPlacement(
    validPoint(),
    placementContext({
      solids: [{ x: 620, y: 500, w: 80, h: 80, destroyed: true }],
    }),
  );
  assert.equal(result.valid, true);
});

test("placement rejects physical overlap with a living enemy", () => {
  const result = validateTurretPlacement(
    validPoint(),
    placementContext({ actors: [{ x: 650, y: 500, radius: 18, hp: 10 }] }),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "actor_overlap");
});

test("Q placement can be cancelled without deployment", () => {
  const ability = createTurretAbilityState();
  assert.equal(beginTurretPlacement(ability, validPoint(), placementContext()), true);
  assert.equal(ability.placement.active, true);
  assert.equal(cancelTurretPlacement(ability), true);
  const result = releaseTurretPlacement(ability, validPoint(), placementContext());
  assert.equal(result.deployed, false);
  assert.equal(ability.active, null);
  assert.equal(ability.cooldown, 0);
});

test("successful release starts 30 active seconds without starting cooldown", () => {
  const ability = createTurretAbilityState();
  beginTurretPlacement(ability, validPoint(), placementContext());
  const result = releaseTurretPlacement(ability, validPoint(), placementContext());
  assert.equal(result.deployed, true);
  assert.equal(ability.cooldown, 0);
  assert.equal(ability.active.remaining, 30);
  assert.equal(Object.hasOwn(ability.active, "ammo"), false);
});

test("invalid release does not start cooldown", () => {
  const ability = createTurretAbilityState();
  const invalidPoint = { x: player.x + 600, y: player.y };
  beginTurretPlacement(ability, invalidPoint, placementContext());
  const result = releaseTurretPlacement(ability, invalidPoint, placementContext());
  assert.equal(result.deployed, false);
  assert.equal(ability.cooldown, 0);
  assert.equal(ability.active, null);
});

test("cooldown decreases by simulation dt and never becomes negative", () => {
  const ability = deployedAbility();
  stopActiveTurret(ability, "test", false);
  updateTurretCooldown(ability, 4.25);
  assertClose(ability.cooldown, 25.75);
  updateTurretCooldown(ability, 100);
  assert.equal(ability.cooldown, 0);
});

test("cooldown reports ready exactly on the positive-to-zero transition", () => {
  const ability = deployedAbility();
  stopActiveTurret(ability, "test", false);
  let readyCount = 0;
  updateTurretCooldown(ability, 30, () => { readyCount += 1; });
  updateTurretCooldown(ability, 1, () => { readyCount += 1; });
  assert.equal(ability.cooldown, 0);
  assert.equal(readyCount, 1);
});

test("active lifetime decreases while cooldown remains inactive", () => {
  const ability = deployedAbility();
  updateTurretAbility(ability, 10, { combatEnabled: false });
  assertClose(ability.active.remaining, 20);
  assert.equal(ability.cooldown, 0);
});

test("natural expiration deactivates the turret and starts full cooldown", () => {
  const ability = deployedAbility();
  updateTurretAbility(ability, 30, { combatEnabled: false });
  assert.equal(ability.active, null);
  assert.equal(ability.deactivation.reason, "duration");
  assert.equal(ability.cooldown, 30);
});

test("Rapid Redeployment starts a 24-second cooldown after deactivation", () => {
  const ability = deployedAbility();
  updateTurretAbility(ability, 30, {
    combatEnabled: false,
    rapidRedeploymentLevel: 5,
  });
  assert.equal(ability.active, null);
  assertClose(ability.cooldownDuration, 24);
  assertClose(ability.cooldown, 24);
  assert.equal(turretHudState(ability).value, "24");
  assertClose(turretHudState(ability).progress, 0);
});

test("cooldown counts down only after deactivation and becomes ready", () => {
  const ability = deployedAbility();
  updateTurretAbility(ability, 30, { combatEnabled: false });
  updateTurretAbility(ability, 10, { combatEnabled: false });
  assertClose(ability.cooldown, 20);
  updateTurretAbility(ability, 30, { combatEnabled: false });
  assert.equal(ability.cooldown, 0);
  assert.equal(turretHudState(ability).mode, "ready");
});

test("wave-end shutdown discards active time and starts a full cooldown", () => {
  const ability = deployedAbility();
  updateTurretAbility(ability, 9, { combatEnabled: false });
  assertClose(ability.active.remaining, 21);
  assert.equal(stopActiveTurret(ability, "wave_end"), true);
  assert.equal(ability.active, null);
  assert.equal(ability.deactivation.reason, "wave_end");
  assert.equal(ability.cooldown, 30);
});

test("run reset removes active and cooldown state without a ready flash", () => {
  const ability = deployedAbility();
  stopActiveTurret(ability, "wave_end");
  ability.readyFlash = 0.2;
  resetTurretAbilityState(ability);
  assert.equal(ability.active, null);
  assert.equal(ability.deactivation, null);
  assert.equal(ability.cooldown, 0);
  assert.equal(ability.readyFlash, 0);
  assert.equal(turretHudState(ability).mode, "ready");
});

test("a second deployment is refused while Bastion-7 is active", () => {
  const ability = deployedAbility();
  ability.cooldown = 0;
  const result = attemptDeployTurret(
    ability,
    { x: 760, y: 500 },
    placementContext(),
  );
  assert.equal(result.deployed, false);
  assert.equal(result.reason, "max_active");
});

test("spread remains 7 degrees through close range", () => {
  assertClose(spreadForDistance(0), 7 * Math.PI / 180);
  assertClose(spreadForDistance(250), 7 * Math.PI / 180);
});

test("spread reaches and clamps at 11 degrees at long range", () => {
  assertClose(spreadForDistance(600), 11 * Math.PI / 180);
  assertClose(spreadForDistance(900), 11 * Math.PI / 180);
});

test("spread linearly interpolates between 250 and 600 units", () => {
  assertClose(spreadForDistance(425), 9 * Math.PI / 180);
});

test("ordinary enemies receive full turret damage", () => {
  assert.equal(turretDamage(10, false), 10);
});

test("bosses receive the explicit 0.60 turret multiplier", () => {
  const normalDamage = getEffectiveTurretDamage({ wave: 7, heavyCaliberLevel: 5 });
  assertClose(normalDamage, 14.95);
  assertClose(turretDamage(normalDamage, true), 8.97);
});

test("targeting selects the nearest visible enemy", () => {
  const origin = { x: 0, y: 0 };
  const near = { x: 100, y: 0, hp: 10 };
  const far = { x: 200, y: 0, hp: 10 };
  assert.equal(
    selectNearestVisibleTarget(origin, [far, near], { isVisible: () => true }),
    near,
  );
});

test("targeting ignores enemies beyond 600 units", () => {
  const origin = { x: 0, y: 0 };
  const target = { x: 600.01, y: 0, hp: 10 };
  assert.equal(
    selectNearestVisibleTarget(origin, [target], { isVisible: () => true }),
    null,
  );
});

test("targeting ignores an occluded enemy", () => {
  const origin = { x: 0, y: 0 };
  const target = { x: 100, y: 0, hp: 10, blocked: true };
  assert.equal(
    selectNearestVisibleTarget(origin, [target], {
      isVisible: (_origin, candidate) => !candidate.blocked,
    }),
    null,
  );
});

test("targeting chooses a farther visible enemy when the nearest is blocked", () => {
  const origin = { x: 0, y: 0 };
  const blocked = { x: 80, y: 0, hp: 10, blocked: true };
  const visible = { x: 180, y: 0, hp: 10, blocked: false };
  assert.equal(
    selectNearestVisibleTarget(origin, [blocked, visible], {
      isVisible: (_origin, target) => !target.blocked,
    }),
    visible,
  );
});

test("deployment phase prevents firing before 0.45 seconds", () => {
  const ability = deployedAbility();
  const shots = [];
  updateTurretAbility(ability, 0.44, {
    targets: [{ x: 800, y: 500, hp: 10 }],
    isVisible: () => true,
    random: () => 0.5,
    onShot: (shot) => shots.push(shot),
  });
  assert.equal(shots.length, 0);
  assert.notEqual(ability.active, null);
});

test("full-auto fire keeps its target and emits source-marked projectiles", () => {
  const ability = deployedAbility();
  const first = { x: 800, y: 500, hp: 10 };
  const laterNearer = { x: 620, y: 580, hp: 10 };
  const shots = [];
  const context = {
    targets: [first],
    isVisible: () => true,
    random: () => 0.5,
    onShot: (shot) => shots.push(shot),
  };

  updateTurretAbility(ability, TURRET_CONFIG.deployDuration, context);
  assert.equal(shots.length, 1);
  assert.equal(shots[0].source, "turret");
  assert.equal(ability.active.target, first);

  context.targets = [laterNearer, first];
  updateTurretAbility(ability, TURRET_CONFIG.shotInterval + 0.001, context);
  assert.equal(shots.length, 2);
  assert.equal(ability.active.target, first);
  assertClose(shots[1].angle, 0);
});

test("runtime shot damage uses wave, Heavy Caliber, and Armory stacking", () => {
  const ability = deployedAbility();
  const shots = [];
  updateTurretAbility(ability, TURRET_CONFIG.deployDuration, {
    targets: [{ x: 800, y: 500, hp: 10 }],
    isVisible: () => true,
    random: () => 0.5,
    wave: 7,
    heavyCaliberLevel: 5,
    armoryDamageMultiplier: 1.2,
    onShot: (shot) => shots.push(shot),
  });
  assert.equal(shots.length, 1);
  assertClose(shots[0].damage, 17.94);
});

test("runtime full-auto cadence reaches 12 shots per second at Overdrive level 5", () => {
  const ability = deployedAbility();
  const target = { x: 800, y: 500, hp: 10 };
  const shotInterval = getEffectiveTurretShotInterval(5);
  let shotCount = 0;
  const context = {
    targets: [target],
    isVisible: () => true,
    random: () => 0.5,
    overdriveMotorsLevel: 5,
    onShot: () => { shotCount += 1; },
  };

  updateTurretAbility(ability, TURRET_CONFIG.deployDuration, context);
  for (let i = 1; i < 12; i += 1) {
    updateTurretAbility(ability, shotInterval, context);
  }
  assert.equal(shotCount, 12);
});

test("full-auto cadence has no artificial pause after seven shots", () => {
  const ability = deployedAbility();
  const target = { x: 800, y: 500, hp: 10 };
  const shotTimes = [];
  let elapsed = TURRET_CONFIG.deployDuration;
  const context = {
    targets: [target],
    isVisible: () => true,
    random: () => 0.5,
    onShot: () => { shotTimes.push(elapsed); },
  };

  updateTurretAbility(ability, TURRET_CONFIG.deployDuration, context);
  for (let i = 1; i < 10; i += 1) {
    elapsed += TURRET_CONFIG.shotInterval;
    updateTurretAbility(ability, TURRET_CONFIG.shotInterval, context);
  }

  assert.equal(shotTimes.length, 10);
  for (let i = 1; i < shotTimes.length; i += 1) {
    assertClose(shotTimes[i] - shotTimes[i - 1], TURRET_CONFIG.shotInterval);
  }
  assert.equal(ability.active.target, target);
});

test("sustained full-auto continues beyond the old 90-round limit", () => {
  const ability = deployedAbility();
  const target = { x: 800, y: 500, hp: 10 };
  let shotCount = 0;
  const context = {
    targets: [target],
    isVisible: () => true,
    random: () => 0.5,
    onShot: () => { shotCount += 1; },
  };

  updateTurretAbility(ability, TURRET_CONFIG.deployDuration, context);
  for (let i = 1; i < 150; i += 1) {
    updateTurretAbility(ability, TURRET_CONFIG.shotInterval, context);
  }

  assert.equal(shotCount, 150);
  assert.notEqual(ability.active, null);
  assert.ok(ability.active.remaining > 0);
  assert.equal(Object.hasOwn(ability.active, "ammo"), false);
});

test("target loss stops fire and reacquire resumes without burst delay", () => {
  const ability = deployedAbility();
  const first = { x: 800, y: 500, hp: 10 };
  const replacement = { x: 850, y: 500, hp: 10 };
  let shotCount = 0;
  const context = {
    targets: [first],
    isVisible: () => true,
    random: () => 0.5,
    onShot: () => { shotCount += 1; },
  };

  updateTurretAbility(ability, TURRET_CONFIG.deployDuration, context);
  first.hp = 0;
  context.targets = [];
  updateTurretAbility(ability, TURRET_CONFIG.shotInterval, context);
  assert.equal(shotCount, 1);
  assert.equal(ability.active.target, null);

  context.targets = [replacement];
  updateTurretAbility(ability, 0, context);
  assert.equal(shotCount, 2);
  assert.equal(ability.active.target, replacement);
});

test("muzzle metadata keeps angle zero on +X and rotates through 90 degrees", () => {
  const turret = { x: 100, y: 200, angle: 0 };
  const right = turretMuzzlePosition(turret);
  assert.ok(right.x > turret.x);
  assertClose(right.y, turret.y);

  turret.angle = Math.PI / 2;
  const down = turretMuzzlePosition(turret);
  assertClose(down.x, turret.x);
  assert.ok(down.y > turret.y);
});

test("EN and RU contain the same Bastion-7 localization keys", () => {
  const turretKeys = [
    "controls.turret",
    "controls.turretKeys",
    "controls.turretPlacement",
    "controls.turretPlacementKeys",
    "controls.turretCancelLabel",
    "controls.turretCancelKeys",
    "ui.turretReady",
    "ui.turretPlacement",
    "ui.turretActive",
    "ui.turretCooldown",
    "meta.tab.fieldEngineering",
    "metaUpgrade.field_heavy_caliber.title",
    "metaUpgrade.field_heavy_caliber.description",
    "metaUpgrade.field_overdrive_motors.title",
    "metaUpgrade.field_overdrive_motors.description",
    "metaUpgrade.field_rapid_redeployment.title",
    "metaUpgrade.field_rapid_redeployment.description",
  ];

  for (const key of turretKeys) {
    assert.equal(typeof I18N.en[key], "string", `missing EN key ${key}`);
    assert.equal(typeof I18N.ru[key], "string", `missing RU key ${key}`);
  }
  assert.equal(I18N.en["metaUpgrade.field_overdrive_motors.title"], "OVERDRIVE MOTORS");
  assert.equal(I18N.ru["metaUpgrade.field_overdrive_motors.title"], "ФОРСИРОВАННЫЕ ПРИВОДЫ");
  assert.deepEqual(Object.keys(I18N.en).sort(), Object.keys(I18N.ru).sort());
});
