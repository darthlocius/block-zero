import assert from "node:assert/strict";
import test from "node:test";

import {
  MANTICORE_CONFIG,
  getEffectiveManticoreExplosionDamage,
  getManticoreDestructibleDamage,
} from "../manticore.js";
import {
  MANTICORE_EXPLOSION_EFFECT_DURATION,
  advanceManticoreShell,
  createManticoreShell,
  resolveManticoreExplosion,
  spawnManticoreShell,
  updateManticoreExplosionEffects,
  updateManticoreShells,
} from "../manticore-shell.js";

function assertClose(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function descriptor(overrides = {}) {
  return {
    targetPoint: { x: 300, y: 500 },
    flightTime: 2,
    arcHeight: 140,
    tubeIndex: 2,
    ...overrides,
  };
}

function snapshot(overrides = {}) {
  return {
    wave: 10,
    heavyCaliberLevel: 3,
    armoryDamageMultiplier: 1.25,
    ...overrides,
  };
}

function shell(overrides = {}) {
  return {
    ...createManticoreShell(
      descriptor(),
      { x: 100, y: 100 },
      snapshot(),
    ),
    ...overrides,
  };
}

function foe(kind, x, y, overrides = {}) {
  return { kind, x, y, hp: 1000, ...overrides };
}

test("creation copies launch, target, ballistics, tube, and combat snapshot", () => {
  const launchPoint = { x: 100, y: 120 };
  const shot = descriptor({ targetPoint: { x: 420, y: 360 } });
  const combat = snapshot();
  const created = createManticoreShell(shot, launchPoint, combat);

  assert.deepEqual(
    {
      startX: created.startX,
      startY: created.startY,
      x: created.x,
      y: created.y,
    },
    { startX: 100, startY: 120, x: 100, y: 120 },
  );
  assert.deepEqual(
    { targetX: created.targetX, targetY: created.targetY },
    { targetX: 420, targetY: 360 },
  );
  assert.equal(created.duration, 2);
  assert.equal(created.arcHeight, 140);
  assert.equal(created.tubeIndex, 2);
  assert.equal(created.wave, 10);
  assert.equal(created.heavyCaliberLevel, 3);
  assert.equal(created.armoryDamageMultiplier, 1.25);
  assert.equal(Object.hasOwn(created, "overdriveMotorsLevel"), false);
  assert.equal(Object.hasOwn(created, "rapidRedeploymentLevel"), false);

  launchPoint.x = -1;
  shot.targetPoint.x = 999;
  combat.wave = 88;
  assert.equal(created.startX, 100);
  assert.equal(created.targetX, 420);
  assert.equal(created.wave, 10);
});

test("creation stores no enemy reference, velocity, or homing state", () => {
  const enemy = foe("swarm", 300, 500, { vx: 900, vy: -400 });
  const shot = descriptor({
    targetPoint: { x: enemy.x, y: enemy.y },
    enemy,
    velocity: { x: enemy.vx, y: enemy.vy },
  });
  const created = createManticoreShell(shot, { x: 100, y: 100 }, snapshot());

  enemy.x = 700;
  enemy.y = 800;
  enemy.vx = -500;
  shot.targetPoint.x = 600;

  assert.deepEqual(
    { targetX: created.targetX, targetY: created.targetY },
    { targetX: 300, targetY: 500 },
  );
  assert.equal(Object.hasOwn(created, "enemy"), false);
  assert.equal(Object.hasOwn(created, "target"), false);
  assert.equal(Object.hasOwn(created, "velocity"), false);
});

test("movement follows the linear path and approved sine arc", () => {
  const created = createManticoreShell(
    descriptor({ targetPoint: { x: 500, y: 300 }, arcHeight: 160 }),
    { x: 100, y: 100 },
    snapshot(),
  );

  assert.equal(advanceManticoreShell(created, 0), 0);
  assert.deepEqual(
    { x: created.x, y: created.y, height: created.height },
    { x: 100, y: 100, height: 0 },
  );

  assert.equal(advanceManticoreShell(created, 1), 0.5);
  assert.deepEqual({ x: created.x, y: created.y }, { x: 300, y: 200 });
  assertClose(created.height, 160);

  assert.equal(advanceManticoreShell(created, 1), 1);
  assert.deepEqual(
    { x: created.x, y: created.y, height: created.height },
    { x: 500, y: 300, height: 0 },
  );
});

test("movement clamps oversized dt and ignores negative or invalid dt", () => {
  const stationary = shell();
  advanceManticoreShell(stationary, -5);
  advanceManticoreShell(stationary, Number.NaN);
  assert.equal(stationary.elapsed, 0);
  assert.deepEqual({ x: stationary.x, y: stationary.y }, { x: 100, y: 100 });

  const completed = shell();
  assert.equal(advanceManticoreShell(completed, 999), 1);
  assert.equal(completed.elapsed, completed.duration);
  assert.deepEqual(
    { x: completed.x, y: completed.y, height: completed.height },
    { x: 300, y: 500, height: 0 },
  );
});

test("spawn helper adds a created shell to its dedicated world collection", () => {
  const world = {};
  const created = spawnManticoreShell(
    world,
    descriptor(),
    { x: 100, y: 100 },
    snapshot(),
  );

  assert.equal(world.manticoreShells.length, 1);
  assert.equal(world.manticoreShells[0], created);
  assert.equal(Object.hasOwn(world, "grenades"), false);
});

test("flight ignores intervening solids and resolves damage only at landing", () => {
  const solid = { type: "concrete", x: 200, y: 300, hp: 100, destroyed: false };
  const damageCalls = [];
  const world = {
    state: "playing",
    foes: [],
    destructibles: [solid],
    manticoreShells: [shell()],
    manticoreExplosionEffects: [],
  };

  updateManticoreShells(world, 1, {
    damageSolid: (...args) => damageCalls.push(args),
  });
  assert.equal(world.manticoreShells.length, 1);
  assert.equal(damageCalls.length, 0);

  solid.x = 300;
  solid.y = 500;
  updateManticoreShells(world, 1, {
    damageSolid: (...args) => damageCalls.push(args),
  });
  assert.equal(world.manticoreShells.length, 0);
  assert.equal(damageCalls.length, 1);
});

test("completed shell detonates exactly once, is removed, and leaves other shells active", () => {
  const first = shell({ duration: 1 });
  const second = shell({ duration: 3, targetX: 700, targetY: 800 });
  const impacts = [];
  const world = {
    state: "playing",
    foes: [],
    destructibles: [],
    manticoreShells: [first, second],
    manticoreExplosionEffects: [],
  };

  updateManticoreShells(world, 1, {
    onDetonate: (impact) => impacts.push(impact),
  });

  assert.equal(impacts.length, 1);
  assert.deepEqual(
    { x: impacts[0].x, y: impacts[0].y },
    { x: 300, y: 500 },
  );
  assert.deepEqual(world.manticoreShells, [second]);
  assert.equal(second.elapsed, 1);
  assert.equal(resolveManticoreExplosion(first, {
    onDetonate: (impact) => impacts.push(impact),
  }), false);
  assert.equal(impacts.length, 1);
});

test("foes at center and edge receive core damage; outside and dead foes are skipped", () => {
  const targets = [
    foe("swarm", 300, 500),
    foe("criminal", 540, 500),
    foe("swarm", 540.01, 500),
    foe("techpriest", 310, 500, { hp: 0 }),
  ];
  const calls = [];

  resolveManticoreExplosion(shell(), {
    foes: targets,
    applyDamageToFoe: (...args) => calls.push(args),
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], targets[0]);
  assertClose(calls[0][1], getEffectiveManticoreExplosionDamage({
    ...snapshot(),
    distance: 0,
  }));
  assert.equal(calls[1][0], targets[1]);
  assertClose(calls[1][1], getEffectiveManticoreExplosionDamage({
    ...snapshot(),
    distance: 240,
  }));
  assert.deepEqual(calls.map((call) => call[2]), [
    { source: "manticore" },
    { source: "manticore" },
  ]);
});

test("boss multiplier is applied exactly once by the Manticore core", () => {
  const boss = foe("criminal", 300, 500, { boss: true });
  const calls = [];
  resolveManticoreExplosion(shell(), {
    foes: [boss],
    applyDamageToFoe: (...args) => calls.push(args),
  });

  assert.equal(calls.length, 1);
  assertClose(calls[0][1], getEffectiveManticoreExplosionDamage({
    ...snapshot(),
    distance: 0,
    boss: true,
  }));
});

test("each in-radius foe is resolved independently through the ordinary callback", () => {
  const targets = [
    foe("swarm", 300, 500),
    foe("criminal", 350, 500),
    foe("techpriest", 400, 500),
  ];
  const calls = [];
  resolveManticoreExplosion(shell(), {
    foes: targets,
    applyDamageToFoe: (...args) => calls.push(args),
  });

  assert.deepEqual(calls.map((call) => call[0]), targets);
  assert.equal(new Set(calls.map((call) => call[1])).size, 2);
});

test("Tech-Priest shield and armor remain owned by applyDamageToFoe", () => {
  const techpriest = foe("techpriest", 300, 500, {
    shieldHp: 120,
    armorReduction: 0.5,
  });
  const damageCalls = [];
  const knockbackCalls = [];

  resolveManticoreExplosion(shell(), {
    foes: [techpriest],
    applyDamageToFoe: (...args) => damageCalls.push(args),
    applyFoeKnockback: (...args) => knockbackCalls.push(args),
  });

  assert.equal(damageCalls.length, 1);
  assert.equal(damageCalls[0][0], techpriest);
  assert.deepEqual(damageCalls[0][2], { source: "manticore" });
  assert.equal(techpriest.shieldHp, 120);
  assert.equal(techpriest.hp, 1000);
  assert.equal(knockbackCalls.length, 1);
  assertClose(knockbackCalls[0][1], 108);
});

test("ordinary, Tank, Tech-Priest, and boss use core knockback without NaN", () => {
  const targets = [
    foe("swarm", 300, 500),
    foe("criminal", 300, 500),
    foe("techpriest", 300, 500),
    foe("criminal", 300, 500, { boss: true }),
    foe("swarm", 541, 500),
  ];
  const calls = [];
  resolveManticoreExplosion(shell(), {
    foes: targets,
    applyFoeKnockback: (...args) => calls.push(args),
  });

  [360, 198, 108, 36].forEach((expectedForce, index) => {
    assertClose(calls[index][1], expectedForce);
  });
  assert.equal(calls.every((call) => Number.isFinite(call[2])), true);
  assert.equal(calls.every((call) => call[2] === 0), true);
});

test("destructibles use core falloff and multiplier through damageSolid", () => {
  const center = { type: "crate", x: 300, y: 500, hp: 100, destroyed: false };
  const edge = { type: "concrete", x: 540, y: 500, hp: 100, destroyed: false };
  const outside = { type: "barricade", x: 541, y: 500, hp: 100, destroyed: false };
  const destroyed = { type: "crate", x: 310, y: 500, hp: 0, destroyed: true };
  const calls = [];

  resolveManticoreExplosion(shell(), {
    destructibles: [center, edge, outside, destroyed],
    damageSolid: (...args) => calls.push(args),
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((call) => call[0]), [center, edge]);
  assertClose(calls[0][1], getManticoreDestructibleDamage(
    getEffectiveManticoreExplosionDamage({ ...snapshot(), distance: 0 }),
  ));
  assertClose(calls[1][1], getManticoreDestructibleDamage(
    getEffectiveManticoreExplosionDamage({ ...snapshot(), distance: 240 }),
  ));
  assert.deepEqual(calls[0].slice(2), [center.x, center.y]);
});

test("barrels are passed to damageSolid with no separate explosion path", () => {
  const barrel = {
    type: "barrel",
    explosive: true,
    x: 300,
    y: 500,
    hp: 20,
    destroyed: false,
  };
  const calls = [];
  resolveManticoreExplosion(shell(), {
    destructibles: [barrel],
    damageSolid: (...args) => calls.push(args),
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], barrel);
  assert.equal(barrel.destroyed, false, "the mock callback remains the only barrel owner");
});

test("direct player damage is not part of explosion resolution", () => {
  let playerDamageCalls = 0;
  resolveManticoreExplosion(shell(), {
    player: { x: 300, y: 500, hp: 100 },
    damagePlayer: () => { playerDamageCalls += 1; },
  });
  assert.equal(playerDamageCalls, 0);
});

test("damage uses shot-time wave and Armory snapshots after external values change", () => {
  const combat = snapshot({ wave: 6, armoryDamageMultiplier: 1.1 });
  const created = createManticoreShell(
    descriptor(),
    { x: 100, y: 100 },
    combat,
  );
  combat.wave = 50;
  combat.heavyCaliberLevel = 5;
  combat.armoryDamageMultiplier = 9;
  const calls = [];

  resolveManticoreExplosion(created, {
    foes: [foe("swarm", 300, 500)],
    applyDamageToFoe: (...args) => calls.push(args),
  });

  assert.equal(created.wave, 6);
  assert.equal(created.heavyCaliberLevel, 3);
  assert.equal(created.armoryDamageMultiplier, 1.1);
  assertClose(calls[0][1], getEffectiveManticoreExplosionDamage({
    wave: 6,
    heavyCaliberLevel: 3,
    armoryDamageMultiplier: 1.1,
    distance: 0,
  }));
});

test("detonation creates one finite-lifetime radius-240 visual effect", () => {
  const effects = [];
  resolveManticoreExplosion(shell(), { explosionEffects: effects });

  assert.equal(effects.length, 1);
  assert.deepEqual(
    { x: effects[0].x, y: effects[0].y, radius: effects[0].radius },
    { x: 300, y: 500, radius: MANTICORE_CONFIG.explosionRadius },
  );
  assert.equal(effects[0].life, MANTICORE_EXPLOSION_EFFECT_DURATION);
  assert.equal(effects[0].maxLife, MANTICORE_EXPLOSION_EFFECT_DURATION);

  const active = updateManticoreExplosionEffects(effects, 0.2);
  assert.equal(active.length, 1);
  assertClose(active[0].life, MANTICORE_EXPLOSION_EFFECT_DURATION - 0.2);
  assert.deepEqual(updateManticoreExplosionEffects(active, 10), []);
});

test("death sequence transition clears remaining shells and effects immediately", () => {
  const first = shell({ duration: 1 });
  const second = shell({ duration: 3 });
  const world = {
    state: "playing",
    foes: [],
    destructibles: [{ x: 300, y: 500, destroyed: false }],
    manticoreShells: [first, second],
    manticoreExplosionEffects: [],
  };

  updateManticoreShells(world, 1, {
    damageSolid: () => { world.state = "death_sequence"; },
  });

  assert.deepEqual(world.manticoreShells, []);
  assert.deepEqual(world.manticoreExplosionEffects, []);
});
