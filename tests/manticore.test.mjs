import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getFieldEngineeringCooldown,
  getFieldEngineeringDamageMultiplier,
  getFieldEngineeringShotInterval,
} from "../field-engineering.js";
import {
  MANTICORE_CONFIG,
  MANTICORE_VISUAL,
  attemptDeployManticore,
  beginManticorePlacement,
  cancelManticorePlacement,
  createManticoreAbilityState,
  createManticoreShotDescriptor,
  createNextManticoreShot,
  evaluateManticoreTargetCandidate,
  getEffectiveManticoreCooldown,
  getEffectiveManticoreExplosionDamage,
  getEffectiveManticoreShotInterval,
  getManticoreArcHeight,
  getManticoreDestructibleDamage,
  getManticoreExplosionDamageFactor,
  getManticoreFlightTime,
  getManticoreHeavyCaliberMultiplier,
  getManticoreKnockbackDescriptor,
  getManticoreKnockbackForce,
  getManticoreTargetWeight,
  getManticoreWaveDamageMultiplier,
  isManticoreAnchorInRange,
  isManticoreFiringDistance,
  manticoreTubeLaunchPosition,
  normalizeManticoreAngle,
  releaseManticorePlacement,
  resetManticoreAbilityState,
  selectBestManticoreTarget,
  selectBestManticoreTargetCandidate,
  stopActiveManticore,
  turnManticoreTowardAngle,
  updateManticoreAbility,
  updateManticoreCooldown,
  validateManticorePlacement,
} from "../manticore.js";
import { spawnManticoreShell } from "../manticore-shell.js";

const player = Object.freeze({ x: 500, y: 500, radius: 18 });

function assertClose(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function enemy(kind, x, y, overrides = {}) {
  return { kind, x, y, hp: 10, radius: 18, ...overrides };
}

function placementContext(overrides = {}) {
  return {
    player,
    worldWidth: 2000,
    worldHeight: 1200,
    solids: [],
    enemies: [],
    ...overrides,
  };
}

function validPlacementPoint() {
  return { x: 620, y: 500 };
}

function deployedAbility() {
  const ability = createManticoreAbilityState();
  const result = attemptDeployManticore(
    ability,
    validPlacementPoint(),
    placementContext(),
  );
  assert.equal(result.deployed, true);
  return ability;
}

test("Manticore-4 frozen config preserves the approved balance contract", () => {
  assert.equal(MANTICORE_CONFIG.id, "manticore4");
  assert.equal(MANTICORE_CONFIG.activeDuration, 30);
  assert.equal(MANTICORE_CONFIG.cooldown, 30);
  assert.equal(MANTICORE_CONFIG.placementRange, 480);
  assert.equal(MANTICORE_CONFIG.minimumPlayerDistance, 70);
  assert.equal(MANTICORE_CONFIG.footprintRadius, 46);
  assert.equal(MANTICORE_CONFIG.minimumFiringRange, 190);
  assert.equal(MANTICORE_CONFIG.attackRange, 750);
  assert.equal(MANTICORE_CONFIG.shotInterval, 1.45);
  assert.equal(MANTICORE_CONFIG.baseDamage, 240);
  assert.equal(MANTICORE_CONFIG.fullDamageRadius, 90);
  assert.equal(MANTICORE_CONFIG.explosionRadius, 240);
  assert.equal(MANTICORE_CONFIG.edgeDamageRatio, 0.35);
  assert.equal(MANTICORE_CONFIG.bossMultiplier, 0.30);
  assert.equal(MANTICORE_CONFIG.baseKnockback, 360);
  assert.equal(MANTICORE_CONFIG.destructibleDamageMultiplier, 0.68);
  assert.equal(MANTICORE_CONFIG.tubeCount, 4);
  assert.equal(MANTICORE_CONFIG.unlimitedAmmo, true);
  assert.equal(MANTICORE_CONFIG.turnSpeed, 4);
  assertClose(MANTICORE_CONFIG.aimTolerance, 10 * Math.PI / 180);
  assert.equal(Object.isFrozen(MANTICORE_CONFIG), true);
  assert.equal(Object.isFrozen(MANTICORE_CONFIG.targetWeights), true);
  assert.equal(Object.isFrozen(MANTICORE_CONFIG.knockbackMultipliers), true);
  assert.equal(Object.isFrozen(MANTICORE_CONFIG.visual), true);
  assert.equal(Object.hasOwn(MANTICORE_CONFIG, "magazine"), false);
  assert.equal(Object.hasOwn(MANTICORE_CONFIG, "burstSize"), false);
});

test("Manticore imports the shared Field Engineering module", () => {
  const source = readFileSync(new URL("../manticore.js", import.meta.url), "utf8");
  assert.match(source, /from "\.\/field-engineering\.js"/);
  assertClose(
    getManticoreHeavyCaliberMultiplier(5),
    getFieldEngineeringDamageMultiplier(5),
  );
});

test("Overdrive Motors scales Manticore interval through the shared helper", () => {
  assertClose(getEffectiveManticoreShotInterval(0), 1.45);
  assertClose(getEffectiveManticoreShotInterval(5), 1.45 / 1.20);
  assertClose(
    getEffectiveManticoreShotInterval(5),
    getFieldEngineeringShotInterval(1.45, 5),
  );
  assertClose(60 / getEffectiveManticoreShotInterval(5), 49.6551724137931);
});

test("Rapid Redeployment scales Manticore cooldown through the shared helper", () => {
  assertClose(getEffectiveManticoreCooldown(0), 30);
  assertClose(getEffectiveManticoreCooldown(5), 24);
  assertClose(getEffectiveManticoreCooldown(5), getFieldEngineeringCooldown(30, 5));
});

test("Manticore wave damage scaling starts after wave 4", () => {
  const expected = new Map([
    [1, 1],
    [4, 1],
    [5, 1.05],
    [7, 1.15],
    [12, 1.40],
    [20, 1.80],
    [30, 2.30],
  ]);
  for (const [wave, multiplier] of expected) {
    assertClose(getManticoreWaveDamageMultiplier(wave), multiplier);
  }
});

test("explosion falloff is full through 90 and reaches 35 percent at 240", () => {
  assertClose(getManticoreExplosionDamageFactor(0), 1);
  assertClose(getManticoreExplosionDamageFactor(50), 1);
  assertClose(getManticoreExplosionDamageFactor(90), 1);
  assertClose(getManticoreExplosionDamageFactor(165), 0.675);
  assertClose(getManticoreExplosionDamageFactor(240), 0.35);
  assertClose(getManticoreExplosionDamageFactor(240.01), 0);
});

test("wave-one explosion damage matches center, middle, edge, and outside values", () => {
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 0 }), 240);
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 50 }), 240);
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 90 }), 240);
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 165 }), 162);
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 240 }), 84);
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 241 }), 0);
});

test("boss damage multiplier is applied after ordinary damage and falloff", () => {
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 0, boss: true }), 72);
  assertClose(getEffectiveManticoreExplosionDamage({ distance: 240, boss: true }), 25.2);
});

test("Heavy Caliber and Armory multiply normal damage exactly once", () => {
  const damage = getEffectiveManticoreExplosionDamage({
    wave: 5,
    heavyCaliberLevel: 5,
    armoryDamageMultiplier: 1.2,
    distance: 0,
  });
  assertClose(damage, 240 * 1.05 * 1.30 * 1.20);
});

test("destructible multiplier applies to already falloff-adjusted damage", () => {
  const center = getEffectiveManticoreExplosionDamage({ distance: 0 });
  const edge = getEffectiveManticoreExplosionDamage({ distance: 240 });
  assertClose(getManticoreDestructibleDamage(center), 163.2);
  assertClose(getManticoreDestructibleDamage(edge), 57.12);
});

test("knockback uses ordinary, Tank, Tech-Priest, and boss multipliers", () => {
  assertClose(getManticoreKnockbackForce(0, enemy("swarm", 0, 0)), 360);
  assertClose(getManticoreKnockbackForce(0, enemy("criminal", 0, 0)), 198);
  assertClose(getManticoreKnockbackForce(0, enemy("techpriest", 0, 0)), 108);
  assertClose(
    getManticoreKnockbackForce(0, enemy("criminal", 0, 0, { boss: true })),
    36,
  );
});

test("knockback follows explosion falloff and is zero outside the radius", () => {
  assertClose(getManticoreKnockbackForce(90), 360);
  assertClose(getManticoreKnockbackForce(165), 243);
  assertClose(getManticoreKnockbackForce(240), 126);
  assertClose(getManticoreKnockbackForce(240.01), 0);
});

test("knockback descriptor points outward and remains finite at the center", () => {
  const outward = getManticoreKnockbackDescriptor(
    { x: 10, y: 20 },
    enemy("swarm", 13, 24),
  );
  assertClose(outward.directionX, 0.6);
  assertClose(outward.directionY, 0.8);
  assertClose(outward.force, 360);

  const centered = getManticoreKnockbackDescriptor(
    { x: 10, y: 20 },
    enemy("swarm", 10, 20),
  );
  assert.deepEqual(centered, { force: 360, directionX: 0, directionY: 0 });
  assert.equal(Number.isNaN(centered.directionX), false);
  assert.equal(Number.isNaN(centered.directionY), false);
});

test("ballistic endpoints match approved flight times and arc heights", () => {
  assertClose(getManticoreFlightTime(190), 0.50);
  assertClose(getManticoreFlightTime(750), 1.05);
  assertClose(getManticoreArcHeight(190), 120);
  assertClose(getManticoreArcHeight(750), 220);
});

test("ballistics interpolate linearly and clamp outside the firing annulus", () => {
  assertClose(getManticoreFlightTime(470), 0.775);
  assertClose(getManticoreArcHeight(470), 170);
  assertClose(getManticoreFlightTime(0), 0.50);
  assertClose(getManticoreFlightTime(1000), 1.05);
  assertClose(getManticoreArcHeight(0), 120);
  assertClose(getManticoreArcHeight(1000), 220);
});

test("firing range accepts inclusive 190 through 750 only", () => {
  assert.equal(isManticoreFiringDistance(189.99), false);
  assert.equal(isManticoreFiringDistance(190), true);
  assert.equal(isManticoreFiringDistance(750), true);
  assert.equal(isManticoreFiringDistance(750.01), false);
});

test("a single living enemy in the annulus is selected", () => {
  const origin = { x: 0, y: 0 };
  const target = enemy("swarm", 200, 0);
  assert.equal(isManticoreAnchorInRange(origin, target), true);
  assert.equal(selectBestManticoreTarget(origin, [target]), target);
});

test("a larger cluster is preferred over an isolated enemy", () => {
  const origin = { x: 0, y: 0 };
  const isolated = enemy("swarm", 200, 0);
  const cluster = [
    enemy("swarm", 640, 0),
    enemy("swarm", 650, 10),
    enemy("swarm", 660, -10),
    enemy("swarm", 670, 0),
  ];
  assert.equal(selectBestManticoreTarget(origin, [isolated, ...cluster]), cluster[0]);
});

test("an isolated Tech-Priest outweighs a cluster of three Swarm", () => {
  const origin = { x: 0, y: 0 };
  const techpriest = enemy("techpriest", 250, 0);
  const swarmCluster = [
    enemy("swarm", 640, 0),
    enemy("swarm", 650, 10),
    enemy("swarm", 660, -10),
  ];
  assert.equal(
    selectBestManticoreTarget(origin, [techpriest, ...swarmCluster]),
    techpriest,
  );
});

test("seven Swarm produce cluster score 7", () => {
  const origin = { x: 0, y: 0 };
  const targets = Array.from({ length: 7 }, (_unused, index) => (
    enemy("swarm", 300 + index * 8, index % 2 ? 8 : -8)
  ));
  const result = evaluateManticoreTargetCandidate(origin, targets[0], targets, 0);
  assertClose(result.score, 7);
  assert.equal(result.enemyCount, 7);
});

test("two Tanks plus three Swarm produce cluster score 7", () => {
  const origin = { x: 0, y: 0 };
  const targets = [
    enemy("criminal", 300, 0),
    enemy("criminal", 310, 0),
    enemy("swarm", 320, 0),
    enemy("swarm", 330, 0),
    enemy("swarm", 340, 0),
  ];
  const result = evaluateManticoreTargetCandidate(origin, targets[0], targets, 0);
  assertClose(result.score, 7);
  assert.equal(result.enemyCount, 5);
});

test("an enemy inside minimum range is collateral but cannot anchor", () => {
  const origin = { x: 0, y: 0 };
  const closeEnemy = enemy("swarm", 100, 0);
  const anchor = enemy("swarm", 200, 0);
  const targets = [closeEnemy, anchor];
  assert.equal(evaluateManticoreTargetCandidate(origin, closeEnemy, targets, 0), null);
  const result = selectBestManticoreTargetCandidate(origin, targets);
  assert.equal(result.target, anchor);
  assertClose(result.score, 2);
  assert.equal(result.enemyCount, 2);
});

test("dead enemies are neither anchors nor cluster members", () => {
  const origin = { x: 0, y: 0 };
  const live = enemy("swarm", 300, 0);
  const dead = enemy("techpriest", 310, 0, { hp: 0 });
  const result = selectBestManticoreTargetCandidate(origin, [dead, live]);
  assert.equal(result.target, live);
  assertClose(result.score, 1);
  assert.equal(result.enemyCount, 1);
});

test("unknown enemies weigh 1 and boss flag overrides ordinary id with weight 3", () => {
  assertClose(getManticoreTargetWeight(enemy("unknown", 0, 0)), 1);
  assertClose(getManticoreTargetWeight(enemy("criminal", 0, 0, { boss: true })), 3);
});

test("target tie-break follows count, anchor weight, distance, then input order", () => {
  const origin = { x: 0, y: 0 };

  const boss = enemy("swarm", 200, 0, { boss: true });
  const threeSwarm = [
    enemy("swarm", 640, 0),
    enemy("swarm", 650, 5),
    enemy("swarm", 660, -5),
  ];
  assert.equal(
    selectBestManticoreTarget(origin, [boss, ...threeSwarm]),
    threeSwarm[0],
    "enemy count must break equal score before anchor weight",
  );

  const swarm = enemy("swarm", 300, 0);
  const tank = enemy("criminal", 310, 0);
  assert.equal(
    selectBestManticoreTarget(origin, [swarm, tank]),
    tank,
    "anchor weight must break equal score and count",
  );

  const near = enemy("swarm", 200, 0);
  const far = enemy("swarm", 500, 0);
  assert.equal(
    selectBestManticoreTarget(origin, [far, near]),
    near,
    "distance must break otherwise equal isolated candidates",
  );

  const first = enemy("swarm", 300, 0);
  const second = enemy("swarm", 300, 0);
  assert.equal(
    selectBestManticoreTarget(origin, [first, second]),
    first,
    "input order must be the final tie-break",
  );
});

test("cluster selection is fully deterministic", () => {
  const origin = { x: 0, y: 0 };
  const targets = [
    enemy("swarm", 300, 0),
    enemy("criminal", 310, 0),
    enemy("techpriest", 650, 0),
  ];
  const first = selectBestManticoreTarget(origin, targets);
  for (let index = 0; index < 50; index += 1) {
    assert.equal(selectBestManticoreTarget(origin, targets), first);
  }
});

test("shot descriptor captures current target point without predictive lead", () => {
  const launchPoint = { x: 500, y: 500 };
  const target = enemy("swarm", 690, 500, { vx: 900, vy: -400 });
  const shot = createManticoreShotDescriptor(launchPoint, target, 2);
  assert.equal(shot.source, "manticore");
  assert.deepEqual(shot.targetPoint, { x: 690, y: 500 });
  assertClose(shot.distance, 190);
  assertClose(shot.flightTime, 0.50);
  assertClose(shot.arcHeight, 120);
  assert.equal(shot.baseExplosionRadius, 240);
  assert.equal(shot.tubeIndex, 2);
  assert.equal(Object.hasOwn(shot, "velocity"), false);

  target.x = 900;
  target.y = 700;
  assert.deepEqual(shot.targetPoint, { x: 690, y: 500 });
});

test("successive shots cycle launch tubes 0, 1, 2, 3, 0, 1", () => {
  const active = deployedAbility().active;
  const target = enemy("swarm", active.x + 190, active.y);
  const tubeIndices = Array.from({ length: 6 }, () => (
    createNextManticoreShot(active, target).tubeIndex
  ));
  assert.deepEqual(tubeIndices, [0, 1, 2, 3, 0, 1]);
  assert.equal(active.nextTubeIndex, 2);
});

test("placement accepts a clear point in range", () => {
  assert.deepEqual(
    validateManticorePlacement(validPlacementPoint(), placementContext()),
    { valid: true, reason: "valid" },
  );
});

test("placement rejects beyond 480 and inside 70 player distance", () => {
  assert.equal(
    validateManticorePlacement(
      { x: player.x + 480.01, y: player.y },
      placementContext(),
    ).reason,
    "out_of_range",
  );
  assert.equal(
    validateManticorePlacement(
      { x: player.x + 69.99, y: player.y },
      placementContext(),
    ).reason,
    "too_close",
  );
});

test("placement keeps the complete 46-unit footprint inside world bounds", () => {
  const result = validateManticorePlacement(
    { x: MANTICORE_CONFIG.footprintRadius - 0.01, y: 500 },
    placementContext(),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "outside_world");
});

test("placement rejects overlap with a live solid", () => {
  const result = validateManticorePlacement(
    validPlacementPoint(),
    placementContext({ solids: [{ x: 640, y: 500, w: 42, h: 42 }] }),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "solid_overlap");
});

test("placement rejects overlap with a living enemy", () => {
  const result = validateManticorePlacement(
    validPlacementPoint(),
    placementContext({ enemies: [enemy("swarm", 650, 500)] }),
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, "enemy_overlap");
});

test("placement ignores destroyed solids and dead enemies", () => {
  const result = validateManticorePlacement(
    validPlacementPoint(),
    placementContext({
      solids: [{ x: 620, y: 500, w: 80, h: 80, destroyed: true }],
      enemies: [enemy("techpriest", 620, 500, { hp: 0 })],
    }),
  );
  assert.equal(result.valid, true);
});

test("an active Manticore blocks a second deployment", () => {
  const ability = deployedAbility();
  const result = attemptDeployManticore(
    ability,
    { x: 760, y: 500 },
    placementContext(),
  );
  assert.equal(result.deployed, false);
  assert.equal(result.reason, "max_active");
});

test("cancelled and invalid placement attempts do not start cooldown", () => {
  const cancelled = createManticoreAbilityState();
  assert.equal(
    beginManticorePlacement(cancelled, validPlacementPoint(), placementContext()),
    true,
  );
  assert.equal(cancelManticorePlacement(cancelled), true);
  assert.equal(cancelled.cooldown, 0);
  assert.equal(cancelled.active, null);

  const invalid = createManticoreAbilityState();
  const invalidPoint = { x: player.x + 600, y: player.y };
  beginManticorePlacement(invalid, invalidPoint, placementContext());
  const result = releaseManticorePlacement(invalid, invalidPoint, placementContext());
  assert.equal(result.deployed, false);
  assert.equal(invalid.cooldown, 0);
  assert.equal(invalid.active, null);
});

test("successful deployment starts 30 active seconds with cooldown zero", () => {
  const ability = deployedAbility();
  assert.equal(ability.cooldown, 0);
  assert.equal(ability.active.remaining, 30);
  assert.equal(ability.active.shotTimer, 0);
  assert.equal(ability.active.target, null);
  assert.equal(ability.active.nextTubeIndex, 0);
  assert.equal(Object.hasOwn(ability.active, "ammo"), false);
});

test("active duration decreases without starting cooldown", () => {
  const ability = deployedAbility();
  updateManticoreAbility(ability, 10, { combatEnabled: false });
  assertClose(ability.active.remaining, 20);
  assert.equal(ability.cooldown, 0);
});

test("natural expiration removes Manticore and starts full cooldown", () => {
  const ability = deployedAbility();
  updateManticoreAbility(ability, 30, { combatEnabled: false });
  assert.equal(ability.active, null);
  assertClose(ability.cooldown, 30);
});

test("Rapid Redeployment changes cooldown duration but not active duration", () => {
  const ability = deployedAbility();
  updateManticoreAbility(ability, 0, {
    combatEnabled: false,
    rapidRedeploymentLevel: 5,
  });
  assertClose(ability.active.remaining, 30);
  assertClose(ability.cooldownDuration, 24);
  updateManticoreAbility(ability, 30, {
    combatEnabled: false,
    rapidRedeploymentLevel: 5,
  });
  assert.equal(ability.active, null);
  assertClose(ability.cooldown, 24);
});

test("cooldown decreases by simulation dt and never becomes negative", () => {
  const ability = deployedAbility();
  stopActiveManticore(ability);
  updateManticoreCooldown(ability, 4.25);
  assertClose(ability.cooldown, 25.75);
  updateManticoreCooldown(ability, 100);
  assert.equal(ability.cooldown, 0);
});

test("reset returns Manticore to its ready run-local state", () => {
  const ability = deployedAbility();
  stopActiveManticore(ability);
  ability.placement.active = true;
  resetManticoreAbilityState(ability);
  assert.deepEqual(ability, createManticoreAbilityState());
});

test("runtime fires immediately at the best cluster and follows interval cadence", () => {
  const ability = deployedAbility();
  const isolated = enemy("swarm", ability.active.x + 200, ability.active.y);
  const cluster = [
    enemy("swarm", ability.active.x + 500, ability.active.y),
    enemy("swarm", ability.active.x + 510, ability.active.y + 5),
    enemy("swarm", ability.active.x + 520, ability.active.y - 5),
  ];
  const shots = [];
  const context = {
    targets: [isolated, ...cluster],
    onShot: (shot) => shots.push(shot),
  };

  updateManticoreAbility(ability, 0, context);
  assert.equal(shots.length, 1);
  assert.deepEqual(shots[0].targetPoint, { x: cluster[0].x, y: cluster[0].y });
  assert.equal(shots[0].tubeIndex, 0);

  updateManticoreAbility(ability, MANTICORE_CONFIG.shotInterval, context);
  assert.equal(shots.length, 2);
  assert.equal(shots[1].tubeIndex, 1);
});

test("switching to a better target does not bypass the remaining shot interval", () => {
  const ability = deployedAbility();
  const first = enemy("swarm", ability.active.x + 200, ability.active.y);
  const shots = [];
  const context = {
    targets: [first],
    onShot: (shot) => shots.push(shot),
  };

  updateManticoreAbility(ability, 0, context);
  assert.equal(shots.length, 1);

  const betterCluster = [
    enemy("swarm", ability.active.x + 500, ability.active.y),
    enemy("swarm", ability.active.x + 510, ability.active.y + 5),
    enemy("swarm", ability.active.x + 520, ability.active.y - 5),
  ];
  context.targets = betterCluster;
  updateManticoreAbility(ability, 0.10, context);
  assert.equal(ability.active.target, betterCluster[0]);
  assert.equal(shots.length, 1);

  updateManticoreAbility(ability, MANTICORE_CONFIG.shotInterval - 0.10, context);
  assert.equal(shots.length, 2);
  assert.deepEqual(shots[1].targetPoint, {
    x: betterCluster[0].x,
    y: betterCluster[0].y,
  });
});

test("runtime does not fire when no anchor lies in the firing annulus", () => {
  const ability = deployedAbility();
  const shots = updateManticoreAbility(ability, 1, {
    targets: [enemy("swarm", ability.active.x + 100, ability.active.y)],
  });
  assert.deepEqual(shots, []);
  assert.equal(ability.active.target, null);
  assert.equal(ability.active.shotTimer, 0);
});

test("render metadata is frozen and derived from the inspected 1254px head", () => {
  assert.equal(MANTICORE_VISUAL.spriteSize, 1254);
  assert.equal(MANTICORE_VISUAL.renderSize, 104);
  assertClose(MANTICORE_VISUAL.headPivotX, 343 / 1254);
  assertClose(MANTICORE_VISUAL.headPivotY, 573 / 1254);
  assert.equal(MANTICORE_VISUAL.tubeOffsets.length, 4);
  assert.equal(Object.isFrozen(MANTICORE_VISUAL), true);
  assert.equal(Object.isFrozen(MANTICORE_VISUAL.tubeOffsets), true);
  for (const offset of MANTICORE_VISUAL.tubeOffsets) {
    assert.equal(Object.isFrozen(offset), true);
    const pixelX = 343 + offset.x * 1254;
    const pixelY = 573 + offset.y * 1254;
    assert.ok(pixelX >= 30 && pixelX <= 1218);
    assert.ok(pixelY >= 171 && pixelY <= 1080);
    assert.ok(offset.x > 0, "angle zero must point every launch tube toward +X");
  }
});

test("tube launch points rotate from +X around the head pivot", () => {
  const manticore = { x: 100, y: 200, angle: 0 };
  const right = manticoreTubeLaunchPosition(manticore, 0);
  const offset = MANTICORE_VISUAL.tubeOffsets[0];
  assertClose(right.x, 100 + offset.x * MANTICORE_VISUAL.renderSize);
  assertClose(right.y, 200 + offset.y * MANTICORE_VISUAL.renderSize);
  assert.ok(right.x > manticore.x);

  manticore.angle = Math.PI / 2;
  const down = manticoreTubeLaunchPosition(manticore, 0);
  assertClose(down.x, 100 - offset.y * MANTICORE_VISUAL.renderSize);
  assertClose(down.y, 200 + offset.x * MANTICORE_VISUAL.renderSize);
  assert.ok(down.y > manticore.y);
});

test("head rotation takes the shortest angular path and respects 4 rad/sec", () => {
  const current = Math.PI - 0.05;
  const target = -Math.PI + 0.05;
  const next = turnManticoreTowardAngle(current, target, 0.04);
  assertClose(Math.abs(normalizeManticoreAngle(next - current)), 0.04);
  assertClose(Math.abs(normalizeManticoreAngle(target - next)), 0.06);

  const ability = deployedAbility();
  const verticalTarget = enemy(
    "swarm",
    ability.active.x,
    ability.active.y + 300,
  );
  updateManticoreAbility(ability, 0.1, { targets: [verticalTarget] });
  assertClose(ability.active.angle, 0.4);
});

test("a ready shot waits for alignment without resetting its timer", () => {
  const ability = deployedAbility();
  const target = enemy("swarm", ability.active.x, ability.active.y + 300);
  const shots = [];
  const context = { targets: [target], onShot: (shot) => shots.push(shot) };

  updateManticoreAbility(ability, 0.1, context);
  assert.equal(shots.length, 0);
  assert.equal(ability.active.shotTimer, 0);
  assert.ok(ability.active.angle < Math.PI / 2);

  updateManticoreAbility(ability, 0.1, context);
  updateManticoreAbility(ability, 0.1, context);
  assert.equal(shots.length, 0);
  assert.equal(ability.active.shotTimer, 0);

  updateManticoreAbility(ability, 0.1, context);
  assert.equal(shots.length, 1);
  assert.equal(shots[0].tubeIndex, 0);
  assertClose(ability.active.angle, Math.PI / 2);
  assertClose(ability.active.shotTimer, MANTICORE_CONFIG.shotInterval);
});

test("aim error above 10 degrees blocks fire and error within 10 degrees allows it", () => {
  const targetAngle = Math.PI / 2;
  const targetFor = (ability) => enemy(
    "swarm",
    ability.active.x,
    ability.active.y + 300,
  );

  const blocked = deployedAbility();
  blocked.active.angle = targetAngle - MANTICORE_CONFIG.aimTolerance - 0.001;
  assert.equal(updateManticoreAbility(blocked, 0, {
    targets: [targetFor(blocked)],
  }).length, 0);
  assert.equal(blocked.active.shotTimer, 0);

  const aligned = deployedAbility();
  aligned.active.angle = targetAngle - MANTICORE_CONFIG.aimTolerance;
  assert.equal(updateManticoreAbility(aligned, 0, {
    targets: [targetFor(aligned)],
  }).length, 1);
});

test("a fired tube drives one recoil impulse and one launch flash", () => {
  const ability = deployedAbility();
  const target = enemy("swarm", ability.active.x + 300, ability.active.y);
  const shots = updateManticoreAbility(ability, 0, { targets: [target] });
  assert.equal(shots.length, 1);
  assert.equal(ability.active.recoil, 8);
  assert.equal(ability.active.launchFlash.tubeIndex, 0);
  assertClose(
    ability.active.launchFlash.remaining,
    MANTICORE_CONFIG.launchFlashDuration,
  );

  updateManticoreAbility(ability, MANTICORE_CONFIG.recoilReturnDuration, {
    combatEnabled: false,
  });
  assert.equal(ability.active.recoil, 0);
  assert.equal(ability.active.launchFlash, null);
});

test("target changes preserve cadence and the four-tube cycle", () => {
  const ability = deployedAbility();
  const first = enemy("swarm", ability.active.x + 300, ability.active.y);
  const second = enemy("criminal", ability.active.x + 310, ability.active.y);
  const shots = [];
  const context = { targets: [first], onShot: (shot) => shots.push(shot) };

  updateManticoreAbility(ability, 0, context);
  context.targets = [second];
  updateManticoreAbility(ability, MANTICORE_CONFIG.shotInterval, context);
  assert.deepEqual(shots.map((shot) => shot.tubeIndex), [0, 1]);
});

test("Manticore cluster targeting does not require LOS", () => {
  const ability = deployedAbility();
  const target = enemy("swarm", ability.active.x + 300, ability.active.y, {
    blocked: true,
  });
  const shots = updateManticoreAbility(ability, 0, {
    targets: [target],
    isVisible: () => false,
  });
  assert.equal(shots.length, 1);
  assert.deepEqual(shots[0].targetPoint, { x: target.x, y: target.y });
});

test("runtime callback spawns exactly one shell from the fired tube with combat snapshots", () => {
  const ability = deployedAbility();
  const target = enemy("swarm", ability.active.x + 300, ability.active.y);
  const shellWorld = { manticoreShells: [] };
  const snapshot = {
    wave: 12,
    heavyCaliberLevel: 4,
    armoryDamageMultiplier: 1.18,
  };

  updateManticoreAbility(ability, 0, {
    targets: [target],
    onShot: (shot) => {
      const launchPoint = manticoreTubeLaunchPosition(
        ability.active,
        shot.tubeIndex,
      );
      spawnManticoreShell(shellWorld, shot, launchPoint, snapshot);
    },
  });

  assert.equal(shellWorld.manticoreShells.length, 1);
  const shell = shellWorld.manticoreShells[0];
  const expectedLaunch = manticoreTubeLaunchPosition(ability.active, 0);
  assertClose(shell.startX, expectedLaunch.x);
  assertClose(shell.startY, expectedLaunch.y);
  assert.equal(shell.targetX, target.x);
  assert.equal(shell.targetY, target.y);
  assert.equal(shell.tubeIndex, 0);
  assert.equal(shell.wave, 12);
  assert.equal(shell.heavyCaliberLevel, 4);
  assertClose(shell.armoryDamageMultiplier, 1.18);
});

test("wave-end stop creates visual deactivation and reset removes all visual state", () => {
  const ability = deployedAbility();
  ability.active.recoil = 8;
  ability.active.launchFlash = { tubeIndex: 2, remaining: 0.05, duration: 0.09 };
  assert.equal(stopActiveManticore(ability, "wave_end"), true);
  assert.equal(ability.active, null);
  assert.equal(ability.deactivation.reason, "wave_end");
  assertClose(ability.cooldown, 30);

  resetManticoreAbilityState(ability);
  assert.deepEqual(ability, createManticoreAbilityState());
});
