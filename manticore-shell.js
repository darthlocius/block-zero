// Browser-independent Manticore-4 shell flight and one-shot impact resolution.

import {
  MANTICORE_CONFIG,
  getEffectiveManticoreExplosionDamage,
  getManticoreDestructibleDamage,
  getManticoreKnockbackDescriptor,
} from "./manticore.js";

const MANTICORE_EXPLOSION_EFFECT_DURATION = 0.62;

function finiteNumber(value, fallback) {
  let numeric;
  try {
    numeric = Number(value);
  } catch {
    return fallback;
  }
  return Number.isFinite(numeric) ? numeric : fallback;
}

function finitePoint(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: point.x, y: point.y };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createManticoreShell(shotDescriptor, launchPoint, combatSnapshot = {}) {
  const start = finitePoint(launchPoint);
  const target = finitePoint(shotDescriptor?.targetPoint);
  const duration = finiteNumber(shotDescriptor?.flightTime, 0);
  const arcHeight = finiteNumber(shotDescriptor?.arcHeight, -1);

  if (!start || !target || duration <= 0 || arcHeight < 0) return null;

  return {
    startX: start.x,
    startY: start.y,
    targetX: target.x,
    targetY: target.y,
    x: start.x,
    y: start.y,
    height: 0,
    elapsed: 0,
    duration,
    arcHeight,
    tubeIndex: Math.trunc(finiteNumber(shotDescriptor?.tubeIndex, 0)),
    wave: finiteNumber(combatSnapshot.wave, 1),
    heavyCaliberLevel: finiteNumber(combatSnapshot.heavyCaliberLevel, 0),
    armoryDamageMultiplier: finiteNumber(combatSnapshot.armoryDamageMultiplier, 1),
    rotation: Math.atan2(target.y - start.y, target.x - start.x),
    visualProgress: 0,
    detonated: false,
  };
}

function advanceManticoreShell(shell, dt) {
  if (!shell || shell.detonated) return 1;

  const safeDt = Math.max(0, finiteNumber(dt, 0));
  shell.elapsed = clamp(shell.elapsed + safeDt, 0, shell.duration);
  const progress = clamp(shell.elapsed / shell.duration, 0, 1);

  shell.x = shell.startX + (shell.targetX - shell.startX) * progress;
  shell.y = shell.startY + (shell.targetY - shell.startY) * progress;
  shell.height = progress >= 1
    ? 0
    : Math.sin(progress * Math.PI) * shell.arcHeight;
  shell.visualProgress = progress;
  return progress;
}

function createManticoreExplosionEffect(x, y) {
  return {
    x,
    y,
    radius: MANTICORE_CONFIG.explosionRadius,
    life: MANTICORE_EXPLOSION_EFFECT_DURATION,
    maxLife: MANTICORE_EXPLOSION_EFFECT_DURATION,
  };
}

function updateManticoreExplosionEffects(effects, dt) {
  const safeDt = Math.max(0, finiteNumber(dt, 0));
  const activeEffects = [];

  for (const effect of effects || []) {
    if (!effect || !Number.isFinite(effect.life)) continue;
    effect.life = Math.max(0, effect.life - safeDt);
    if (effect.life > 0) activeEffects.push(effect);
  }

  return activeEffects;
}

function isLivingFoe(foe) {
  return Boolean(foe && finiteNumber(foe.hp, 0) > 0 && foe.dead !== true);
}

function resolveManticoreExplosion(shell, context = {}) {
  if (!shell || shell.detonated) return false;

  shell.detonated = true;
  const impactX = shell.targetX;
  const impactY = shell.targetY;
  const impactPoint = { x: impactX, y: impactY };
  const applyDamageToFoe = context.applyDamageToFoe;
  const applyFoeKnockback = context.applyFoeKnockback;
  const damageSolid = context.damageSolid;

  for (const foe of context.foes || []) {
    if (!isLivingFoe(foe)) continue;

    const distance = Math.hypot(foe.x - impactX, foe.y - impactY);
    if (distance > MANTICORE_CONFIG.explosionRadius) continue;

    const damage = getEffectiveManticoreExplosionDamage({
      wave: shell.wave,
      heavyCaliberLevel: shell.heavyCaliberLevel,
      armoryDamageMultiplier: shell.armoryDamageMultiplier,
      distance,
      boss: Boolean(foe.boss || foe.isBoss),
    });

    if (typeof applyDamageToFoe === "function") {
      applyDamageToFoe(foe, damage, { source: "manticore" });
    }

    if (typeof applyFoeKnockback === "function") {
      const knockback = getManticoreKnockbackDescriptor(impactPoint, foe);
      const angle = Math.atan2(knockback.directionY, knockback.directionX);
      applyFoeKnockback(foe, knockback.force, angle);
    }
  }

  for (const solid of [...(context.destructibles || [])]) {
    if (!solid || solid.destroyed) continue;

    const distance = Math.hypot(solid.x - impactX, solid.y - impactY);
    if (distance > MANTICORE_CONFIG.explosionRadius) continue;

    const explosionDamage = getEffectiveManticoreExplosionDamage({
      wave: shell.wave,
      heavyCaliberLevel: shell.heavyCaliberLevel,
      armoryDamageMultiplier: shell.armoryDamageMultiplier,
      distance,
    });

    if (typeof damageSolid === "function") {
      damageSolid(
        solid,
        getManticoreDestructibleDamage(explosionDamage),
        solid.x,
        solid.y,
      );
    }
  }

  if (Array.isArray(context.explosionEffects)) {
    context.explosionEffects.push(createManticoreExplosionEffect(impactX, impactY));
  }
  if (typeof context.onDetonate === "function") {
    context.onDetonate({ x: impactX, y: impactY, shell });
  }
  return true;
}

function spawnManticoreShell(
  worldState,
  shotDescriptor,
  launchPoint,
  combatSnapshot,
) {
  if (!worldState) return null;
  if (!Array.isArray(worldState.manticoreShells)) worldState.manticoreShells = [];

  const shell = createManticoreShell(
    shotDescriptor,
    launchPoint,
    combatSnapshot,
  );
  if (!shell) return null;

  worldState.manticoreShells.push(shell);
  return shell;
}

function updateManticoreShells(worldState, dt, callbacks = {}) {
  if (!worldState) return;
  if (!Array.isArray(worldState.manticoreShells)) worldState.manticoreShells = [];
  if (!Array.isArray(worldState.manticoreExplosionEffects)) {
    worldState.manticoreExplosionEffects = [];
  }

  worldState.manticoreExplosionEffects = updateManticoreExplosionEffects(
    worldState.manticoreExplosionEffects,
    dt,
  );

  const activeShells = [];
  for (const shell of worldState.manticoreShells) {
    const progress = advanceManticoreShell(shell, dt);
    if (progress < 1) {
      activeShells.push(shell);
      continue;
    }

    resolveManticoreExplosion(shell, {
      ...callbacks,
      foes: callbacks.foes || worldState.foes,
      destructibles: callbacks.destructibles || worldState.destructibles,
      explosionEffects: worldState.manticoreExplosionEffects,
    });

    if (worldState.state === "death_sequence") {
      worldState.manticoreShells = [];
      worldState.manticoreExplosionEffects = [];
      return;
    }
  }

  worldState.manticoreShells = activeShells;
}

export {
  MANTICORE_EXPLOSION_EFFECT_DURATION,
  createManticoreShell,
  advanceManticoreShell,
  createManticoreExplosionEffect,
  updateManticoreExplosionEffects,
  resolveManticoreExplosion,
  spawnManticoreShell,
  updateManticoreShells,
};
