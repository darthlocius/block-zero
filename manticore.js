// Browser-independent Manticore-4 configuration, runtime, and gameplay math.

import {
  getFieldEngineeringCooldown,
  getFieldEngineeringCooldownMultiplier,
  getFieldEngineeringDamageMultiplier,
  getFieldEngineeringFireRateMultiplier,
  getFieldEngineeringShotInterval,
} from "./field-engineering.js";

const DEG_TO_RAD = Math.PI / 180;
const TAU = Math.PI * 2;

const MANTICORE_TARGET_WEIGHTS = Object.freeze({
  swarm: 1,
  animal: 1.2,
  monster: 1.4,
  sniper: 1.6,
  criminal: 2,
  techpriest: 3.5,
});

const MANTICORE_KNOCKBACK_MULTIPLIERS = Object.freeze({
  ordinary: 1,
  criminal: 0.55,
  techpriest: 0.30,
  boss: 0.10,
});

const MANTICORE_SPRITE_SIZE = 1254;
const MANTICORE_HEAD_PIVOT = Object.freeze({ x: 343, y: 573 });
const MANTICORE_TUBE_POINTS = Object.freeze([
  Object.freeze({ x: 1190, y: 411 }),
  Object.freeze({ x: 1190, y: 493 }),
  Object.freeze({ x: 1190, y: 580 }),
  Object.freeze({ x: 1190, y: 674 }),
]);
const MANTICORE_VISUAL = Object.freeze({
  spriteSize: MANTICORE_SPRITE_SIZE,
  renderSize: 104,
  headPivotX: MANTICORE_HEAD_PIVOT.x / MANTICORE_SPRITE_SIZE,
  headPivotY: MANTICORE_HEAD_PIVOT.y / MANTICORE_SPRITE_SIZE,
  tubeOffsets: Object.freeze(MANTICORE_TUBE_POINTS.map((point) => Object.freeze({
    x: (point.x - MANTICORE_HEAD_PIVOT.x) / MANTICORE_SPRITE_SIZE,
    y: (point.y - MANTICORE_HEAD_PIVOT.y) / MANTICORE_SPRITE_SIZE,
  }))),
  ghostAlpha: 0.48,
});

const MANTICORE_CONFIG = Object.freeze({
  id: "manticore4",
  activeDuration: 30,
  cooldown: 30,
  maxActive: 1,
  placementRange: 480,
  minimumPlayerDistance: 70,
  footprintRadius: 46,
  minimumFiringRange: 190,
  attackRange: 750,
  shotInterval: 1.45,
  baseDamage: 240,
  fullDamageRadius: 90,
  explosionRadius: 240,
  edgeDamageRatio: 0.35,
  bossMultiplier: 0.30,
  baseKnockback: 360,
  destructibleDamageMultiplier: 0.68,
  minimumFlightTime: 0.50,
  maximumFlightTime: 1.05,
  minimumArcHeight: 120,
  maximumArcHeight: 220,
  tubeCount: 4,
  unlimitedAmmo: true,
  turnSpeed: 4,
  aimTolerance: 10 * DEG_TO_RAD,
  deployDuration: 0.13,
  deactivationDuration: 0.28,
  recoilDistance: 8,
  recoilReturnDuration: 0.19,
  launchFlashDuration: 0.09,
  targetWeights: MANTICORE_TARGET_WEIGHTS,
  knockbackMultipliers: MANTICORE_KNOCKBACK_MULTIPLIERS,
  visual: MANTICORE_VISUAL,
});

const WAVE_SCALING_STARTS_AFTER = 4;
const WAVE_DAMAGE_PER_WAVE = 0.05;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value, fallback) {
  let numeric;
  try {
    numeric = Number(value);
  } catch {
    return fallback;
  }
  return Number.isFinite(numeric) ? numeric : fallback;
}

function copyFinitePoint(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: point.x, y: point.y };
}

function distanceBetween(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function normalizeManticoreAngle(angle) {
  let normalized = finiteNumber(angle, 0) % TAU;
  if (normalized > Math.PI) normalized -= TAU;
  if (normalized < -Math.PI) normalized += TAU;
  return normalized;
}

function turnManticoreTowardAngle(current, target, maxStep) {
  const safeCurrent = normalizeManticoreAngle(current);
  const safeTarget = normalizeManticoreAngle(target);
  const safeStep = Math.max(0, finiteNumber(maxStep, 0));
  const delta = normalizeManticoreAngle(safeTarget - safeCurrent);
  if (Math.abs(delta) <= safeStep) return safeTarget;
  return normalizeManticoreAngle(safeCurrent + Math.sign(delta) * safeStep);
}

function isLivingManticoreTarget(target) {
  return Boolean(
    target
    && Number.isFinite(target.x)
    && Number.isFinite(target.y)
    && finiteNumber(target.hp, 0) > 0
    && target.dead !== true,
  );
}

function isManticoreBoss(target) {
  return Boolean(target?.boss || target?.isBoss);
}

function getManticoreEntityKind(target) {
  const values = [target?.kind, target?.id, target?.type];
  return values.find((value) => Object.hasOwn(MANTICORE_TARGET_WEIGHTS, value)) || null;
}

function getManticoreWaveDamageMultiplier(wave) {
  const numericWave = finiteNumber(wave, 1);
  const currentWave = Math.max(1, Math.floor(numericWave));
  return 1 + WAVE_DAMAGE_PER_WAVE * Math.max(
    0,
    currentWave - WAVE_SCALING_STARTS_AFTER,
  );
}

function getManticoreHeavyCaliberMultiplier(level) {
  return getFieldEngineeringDamageMultiplier(level);
}

function getManticoreFireRateMultiplier(level) {
  return getFieldEngineeringFireRateMultiplier(level);
}

function getEffectiveManticoreShotInterval(
  level,
  baseShotInterval = MANTICORE_CONFIG.shotInterval,
) {
  const safeBase = Number.isFinite(baseShotInterval) && baseShotInterval > 0
    ? baseShotInterval
    : MANTICORE_CONFIG.shotInterval;
  return getFieldEngineeringShotInterval(safeBase, level);
}

function getManticoreCooldownMultiplier(level) {
  return getFieldEngineeringCooldownMultiplier(level);
}

function getEffectiveManticoreCooldown(
  level,
  baseCooldown = MANTICORE_CONFIG.cooldown,
) {
  const safeBase = Number.isFinite(baseCooldown) && baseCooldown >= 0
    ? baseCooldown
    : MANTICORE_CONFIG.cooldown;
  return getFieldEngineeringCooldown(safeBase, level);
}

function getManticoreExplosionDamageFactor(distance) {
  const safeDistance = Math.max(0, finiteNumber(distance, Infinity));
  if (safeDistance <= MANTICORE_CONFIG.fullDamageRadius) return 1;
  if (safeDistance > MANTICORE_CONFIG.explosionRadius) return 0;

  const falloffProgress = (
    safeDistance - MANTICORE_CONFIG.fullDamageRadius
  ) / (
    MANTICORE_CONFIG.explosionRadius - MANTICORE_CONFIG.fullDamageRadius
  );
  return 1 + (MANTICORE_CONFIG.edgeDamageRatio - 1) * falloffProgress;
}

function getEffectiveManticoreExplosionDamage({
  baseDamage = MANTICORE_CONFIG.baseDamage,
  wave = 1,
  heavyCaliberLevel = 0,
  armoryDamageMultiplier = 1,
  distance = 0,
  boss = false,
} = {}) {
  const safeBaseDamage = finiteNumber(baseDamage, MANTICORE_CONFIG.baseDamage);
  const safeArmoryMultiplier = finiteNumber(armoryDamageMultiplier, 1);
  const normalDamage = safeBaseDamage
    * getManticoreWaveDamageMultiplier(wave)
    * getManticoreHeavyCaliberMultiplier(heavyCaliberLevel)
    * safeArmoryMultiplier;
  const distanceAdjustedDamage = normalDamage
    * getManticoreExplosionDamageFactor(distance);
  return distanceAdjustedDamage * (boss ? MANTICORE_CONFIG.bossMultiplier : 1);
}

function getManticoreDestructibleDamage(explosionDamage) {
  return Math.max(0, finiteNumber(explosionDamage, 0))
    * MANTICORE_CONFIG.destructibleDamageMultiplier;
}

function getManticoreTargetWeight(target) {
  if (isManticoreBoss(target)) return 3;
  const kind = getManticoreEntityKind(target);
  return kind ? MANTICORE_TARGET_WEIGHTS[kind] : 1;
}

function getManticoreKnockbackMultiplier(target) {
  if (isManticoreBoss(target)) return MANTICORE_KNOCKBACK_MULTIPLIERS.boss;
  const kind = getManticoreEntityKind(target);
  if (kind === "criminal") return MANTICORE_KNOCKBACK_MULTIPLIERS.criminal;
  if (kind === "techpriest") return MANTICORE_KNOCKBACK_MULTIPLIERS.techpriest;
  return MANTICORE_KNOCKBACK_MULTIPLIERS.ordinary;
}

function getManticoreKnockbackForce(distance, target = {}) {
  return MANTICORE_CONFIG.baseKnockback
    * getManticoreExplosionDamageFactor(distance)
    * getManticoreKnockbackMultiplier(target);
}

function getManticoreKnockbackDescriptor(explosionPoint, target) {
  const origin = copyFinitePoint(explosionPoint);
  const targetPoint = copyFinitePoint(target);
  if (!origin || !targetPoint) {
    return { force: 0, directionX: 0, directionY: 0 };
  }

  const offsetX = targetPoint.x - origin.x;
  const offsetY = targetPoint.y - origin.y;
  const distance = Math.hypot(offsetX, offsetY);
  const inverseDistance = distance > 0 ? 1 / distance : 0;
  return {
    force: getManticoreKnockbackForce(distance, target),
    directionX: offsetX * inverseDistance,
    directionY: offsetY * inverseDistance,
  };
}

function getManticoreBallisticProgress(distance) {
  const safeDistance = clamp(
    finiteNumber(distance, MANTICORE_CONFIG.minimumFiringRange),
    MANTICORE_CONFIG.minimumFiringRange,
    MANTICORE_CONFIG.attackRange,
  );
  return (
    safeDistance - MANTICORE_CONFIG.minimumFiringRange
  ) / (
    MANTICORE_CONFIG.attackRange - MANTICORE_CONFIG.minimumFiringRange
  );
}

function getManticoreFlightTime(distance) {
  const progress = getManticoreBallisticProgress(distance);
  return MANTICORE_CONFIG.minimumFlightTime
    + (MANTICORE_CONFIG.maximumFlightTime - MANTICORE_CONFIG.minimumFlightTime) * progress;
}

function getManticoreArcHeight(distance) {
  const progress = getManticoreBallisticProgress(distance);
  return MANTICORE_CONFIG.minimumArcHeight
    + (MANTICORE_CONFIG.maximumArcHeight - MANTICORE_CONFIG.minimumArcHeight) * progress;
}

function isManticoreFiringDistance(distance) {
  return Number.isFinite(distance)
    && distance >= MANTICORE_CONFIG.minimumFiringRange
    && distance <= MANTICORE_CONFIG.attackRange;
}

function isManticoreAnchorInRange(origin, target) {
  const safeOrigin = copyFinitePoint(origin);
  if (!safeOrigin || !isLivingManticoreTarget(target)) return false;
  return isManticoreFiringDistance(distanceBetween(safeOrigin, target));
}

function evaluateManticoreTargetCandidate(origin, anchor, targets = [], inputIndex = -1) {
  if (!isManticoreAnchorInRange(origin, anchor)) return null;

  let score = 0;
  let enemyCount = 0;
  for (const target of targets) {
    if (!isLivingManticoreTarget(target)) continue;
    if (distanceBetween(anchor, target) > MANTICORE_CONFIG.explosionRadius) continue;
    score += getManticoreTargetWeight(target);
    enemyCount += 1;
  }

  return {
    target: anchor,
    targetPoint: { x: anchor.x, y: anchor.y },
    score,
    enemyCount,
    anchorWeight: getManticoreTargetWeight(anchor),
    distance: distanceBetween(origin, anchor),
    inputIndex,
  };
}

function isBetterManticoreTargetCandidate(candidate, currentBest) {
  if (!currentBest) return true;
  if (candidate.score !== currentBest.score) return candidate.score > currentBest.score;
  if (candidate.enemyCount !== currentBest.enemyCount) {
    return candidate.enemyCount > currentBest.enemyCount;
  }
  if (candidate.anchorWeight !== currentBest.anchorWeight) {
    return candidate.anchorWeight > currentBest.anchorWeight;
  }
  if (candidate.distance !== currentBest.distance) return candidate.distance < currentBest.distance;
  return candidate.inputIndex < currentBest.inputIndex;
}

function selectBestManticoreTargetCandidate(origin, targets = []) {
  const safeOrigin = copyFinitePoint(origin);
  if (!safeOrigin) return null;

  let best = null;
  targets.forEach((target, inputIndex) => {
    const candidate = evaluateManticoreTargetCandidate(
      safeOrigin,
      target,
      targets,
      inputIndex,
    );
    if (candidate && isBetterManticoreTargetCandidate(candidate, best)) best = candidate;
  });
  return best;
}

function selectBestManticoreTarget(origin, targets = []) {
  return selectBestManticoreTargetCandidate(origin, targets)?.target || null;
}

function normalizeManticoreTubeIndex(tubeIndex) {
  const numericIndex = Math.floor(finiteNumber(tubeIndex, 0));
  return ((numericIndex % MANTICORE_CONFIG.tubeCount) + MANTICORE_CONFIG.tubeCount)
    % MANTICORE_CONFIG.tubeCount;
}

function getNextManticoreTubeIndex(tubeIndex) {
  return (normalizeManticoreTubeIndex(tubeIndex) + 1) % MANTICORE_CONFIG.tubeCount;
}

function createManticoreShotDescriptor(launchPoint, target, tubeIndex = 0) {
  const origin = copyFinitePoint(launchPoint);
  const targetPoint = copyFinitePoint(target);
  if (!origin || !targetPoint) return null;
  const distance = distanceBetween(origin, targetPoint);
  return {
    source: "manticore",
    targetPoint,
    distance,
    flightTime: getManticoreFlightTime(distance),
    arcHeight: getManticoreArcHeight(distance),
    baseExplosionRadius: MANTICORE_CONFIG.explosionRadius,
    tubeIndex: normalizeManticoreTubeIndex(tubeIndex),
  };
}

function createManticoreAbilityState() {
  return {
    cooldown: 0,
    cooldownDuration: MANTICORE_CONFIG.cooldown,
    active: null,
    deactivation: null,
    placement: {
      active: false,
      point: null,
      valid: false,
      reason: "inactive",
    },
  };
}

function resetManticoreAbilityState(ability) {
  const next = createManticoreAbilityState();
  if (!ability) return next;
  ability.cooldown = next.cooldown;
  ability.cooldownDuration = next.cooldownDuration;
  ability.active = next.active;
  ability.deactivation = next.deactivation;
  ability.placement = next.placement;
  return ability;
}

function pointOverlapsManticoreSolid(point, radius, solid) {
  if (!solid || solid.destroyed || (Number.isFinite(solid.hp) && solid.hp <= 0)) return false;
  const halfWidth = Math.max(0, finiteNumber(solid.w, 0)) * 0.5;
  const halfHeight = Math.max(0, finiteNumber(solid.h, 0)) * 0.5;
  const nearestX = clamp(point.x, solid.x - halfWidth, solid.x + halfWidth);
  const nearestY = clamp(point.y, solid.y - halfHeight, solid.y + halfHeight);
  return Math.hypot(point.x - nearestX, point.y - nearestY) < radius;
}

function pointOverlapsLivingEnemy(point, radius, enemy) {
  if (!isLivingManticoreTarget(enemy)) return false;
  const enemyRadius = Math.max(0, finiteNumber(enemy.radius, 0));
  return distanceBetween(point, enemy) < radius + enemyRadius;
}

function validateManticorePlacement(point, context = {}) {
  const safePoint = copyFinitePoint(point);
  if (!safePoint) return { valid: false, reason: "invalid_point" };

  const player = copyFinitePoint(context.player);
  if (!player) return { valid: false, reason: "missing_player" };
  if (context.activeManticore) return { valid: false, reason: "max_active" };

  const playerDistance = distanceBetween(player, safePoint);
  if (playerDistance > MANTICORE_CONFIG.placementRange) {
    return { valid: false, reason: "out_of_range" };
  }
  if (playerDistance < MANTICORE_CONFIG.minimumPlayerDistance) {
    return { valid: false, reason: "too_close" };
  }

  const width = finiteNumber(context.worldWidth, 0);
  const height = finiteNumber(context.worldHeight, 0);
  const radius = MANTICORE_CONFIG.footprintRadius;
  if (
    safePoint.x - radius < 0
    || safePoint.y - radius < 0
    || safePoint.x + radius > width
    || safePoint.y + radius > height
  ) {
    return { valid: false, reason: "outside_world" };
  }

  if ((context.solids || []).some((solid) => (
    pointOverlapsManticoreSolid(safePoint, radius, solid)
  ))) {
    return { valid: false, reason: "solid_overlap" };
  }

  const enemies = context.enemies || context.actors || [];
  if (enemies.some((enemy) => pointOverlapsLivingEnemy(safePoint, radius, enemy))) {
    return { valid: false, reason: "enemy_overlap" };
  }

  return { valid: true, reason: "valid" };
}

function placementContextForManticore(ability, context = {}) {
  return {
    ...context,
    activeManticore: ability?.active || context.activeManticore || null,
  };
}

function refreshManticorePlacement(ability, point, context = {}) {
  if (!ability?.placement?.active) return ability?.placement || null;
  const result = validateManticorePlacement(
    point,
    placementContextForManticore(ability, context),
  );
  ability.placement.point = copyFinitePoint(point);
  ability.placement.valid = result.valid;
  ability.placement.reason = result.reason;
  return ability.placement;
}

function beginManticorePlacement(ability, point, context = {}) {
  if (!ability || ability.cooldown > 0 || ability.active) return false;
  ability.placement = {
    active: true,
    point: copyFinitePoint(point),
    valid: false,
    reason: "invalid_point",
  };
  refreshManticorePlacement(ability, point, context);
  return true;
}

function cancelManticorePlacement(ability) {
  if (!ability?.placement?.active) return false;
  ability.placement = {
    active: false,
    point: null,
    valid: false,
    reason: "cancelled",
  };
  return true;
}

function createActiveManticore(point) {
  return {
    id: MANTICORE_CONFIG.id,
    x: point.x,
    y: point.y,
    angle: 0,
    remaining: MANTICORE_CONFIG.activeDuration,
    deployElapsed: 0,
    visualTime: 0,
    recoil: 0,
    launchFlash: null,
    firing: false,
    shotTimer: 0,
    target: null,
    nextTubeIndex: 0,
  };
}

function attemptDeployManticore(ability, point, context = {}) {
  if (!ability || ability.cooldown > 0 || ability.active) {
    return {
      deployed: false,
      reason: ability?.active ? "max_active" : "cooldown",
    };
  }

  const result = validateManticorePlacement(
    point,
    placementContextForManticore(ability, context),
  );
  if (!result.valid) return { deployed: false, reason: result.reason };

  ability.active = createActiveManticore(point);
  ability.deactivation = null;
  ability.cooldown = 0;
  ability.placement = {
    active: false,
    point: null,
    valid: false,
    reason: "deployed",
  };
  return { deployed: true, reason: "deployed", manticore: ability.active };
}

function releaseManticorePlacement(ability, point, context = {}) {
  if (!ability?.placement?.active) return { deployed: false, reason: "inactive" };
  const result = attemptDeployManticore(ability, point, context);
  if (!result.deployed) {
    ability.placement = {
      active: false,
      point: null,
      valid: false,
      reason: result.reason,
    };
  }
  return result;
}

function stopActiveManticore(ability, reason = "expired", withFade = true) {
  if (!ability?.active) return false;
  if (withFade) {
    ability.deactivation = {
      ...ability.active,
      recoil: 0,
      launchFlash: null,
      firing: false,
      reason,
      fadeRemaining: MANTICORE_CONFIG.deactivationDuration,
      fadeDuration: MANTICORE_CONFIG.deactivationDuration,
    };
  } else {
    ability.deactivation = null;
  }
  ability.active = null;
  ability.cooldown = Number.isFinite(ability.cooldownDuration)
    ? ability.cooldownDuration
    : MANTICORE_CONFIG.cooldown;
  return true;
}

function updateManticoreCooldown(ability, dt) {
  if (!ability) return false;
  const previous = ability.cooldown;
  ability.cooldown = Math.max(0, previous - Math.max(0, finiteNumber(dt, 0)));
  return previous > 0 && ability.cooldown === 0;
}

function createNextManticoreShot(activeManticore, target) {
  if (!activeManticore) return null;
  const descriptor = createManticoreShotDescriptor(
    activeManticore,
    target,
    activeManticore.nextTubeIndex,
  );
  if (!descriptor) return null;
  activeManticore.nextTubeIndex = getNextManticoreTubeIndex(
    activeManticore.nextTubeIndex,
  );
  return descriptor;
}

function manticoreTubeLaunchPosition(activeManticore, tubeIndex) {
  const origin = copyFinitePoint(activeManticore);
  if (!origin) return null;
  const visual = MANTICORE_CONFIG.visual;
  const offset = visual.tubeOffsets[normalizeManticoreTubeIndex(tubeIndex)];
  if (!offset) return null;

  const localX = offset.x * visual.renderSize;
  const localY = offset.y * visual.renderSize;
  const angle = normalizeManticoreAngle(activeManticore.angle);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: origin.x + localX * cos - localY * sin,
    y: origin.y + localX * sin + localY * cos,
  };
}

function updateActiveManticore(ability, dt, context = {}) {
  const active = ability?.active;
  if (!active) return [];

  active.remaining = Math.max(0, active.remaining - dt);
  active.deployElapsed = Math.min(
    MANTICORE_CONFIG.deployDuration,
    active.deployElapsed + dt,
  );
  active.visualTime += dt;
  active.recoil = Math.max(
    0,
    active.recoil - dt * MANTICORE_CONFIG.recoilDistance
      / MANTICORE_CONFIG.recoilReturnDuration,
  );
  if (active.launchFlash) {
    active.launchFlash.remaining = Math.max(0, active.launchFlash.remaining - dt);
    if (active.launchFlash.remaining <= 0) active.launchFlash = null;
  }
  if (active.remaining <= 0) {
    stopActiveManticore(ability, "duration");
    return [];
  }
  if (context.combatEnabled === false) {
    active.firing = false;
    return [];
  }

  const selection = selectBestManticoreTargetCandidate(active, context.targets || []);
  if (!selection) {
    active.target = null;
    active.firing = false;
    active.shotTimer = 0;
    return [];
  }

  const hadTarget = active.target !== null;
  active.target = selection.target;
  if (!hadTarget) active.shotTimer = 0;
  else if (active.shotTimer > 0) active.shotTimer -= dt;
  else active.shotTimer = 0;

  const desiredAngle = Math.atan2(
    selection.targetPoint.y - active.y,
    selection.targetPoint.x - active.x,
  );
  active.angle = turnManticoreTowardAngle(
    active.angle,
    desiredAngle,
    MANTICORE_CONFIG.turnSpeed * dt,
  );
  const aimError = Math.abs(normalizeManticoreAngle(desiredAngle - active.angle));
  if (aimError - MANTICORE_CONFIG.aimTolerance > 1e-9) {
    active.firing = false;
    active.shotTimer = Math.max(0, active.shotTimer);
    return [];
  }

  const shotInterval = getEffectiveManticoreShotInterval(context.overdriveMotorsLevel);
  const shots = [];
  while (active.shotTimer <= 0) {
    const shot = createNextManticoreShot(active, selection.target);
    if (!shot) break;
    shots.push(shot);
    active.firing = true;
    active.recoil = MANTICORE_CONFIG.recoilDistance;
    active.launchFlash = {
      tubeIndex: shot.tubeIndex,
      remaining: MANTICORE_CONFIG.launchFlashDuration,
      duration: MANTICORE_CONFIG.launchFlashDuration,
    };
    context.onShot?.(shot);
    active.shotTimer += shotInterval;
  }
  if (!shots.length) active.firing = false;
  return shots;
}

function updateManticoreAbility(ability, dt, context = {}) {
  if (!ability) return [];
  const safeDt = Math.max(0, finiteNumber(dt, 0));

  if (Object.hasOwn(context, "rapidRedeploymentLevel")) {
    ability.cooldownDuration = getEffectiveManticoreCooldown(
      context.rapidRedeploymentLevel,
    );
  }
  if (!ability.active) updateManticoreCooldown(ability, safeDt);
  if (ability.deactivation) {
    ability.deactivation.fadeRemaining = Math.max(
      0,
      ability.deactivation.fadeRemaining - safeDt,
    );
    ability.deactivation.visualTime += safeDt;
    if (ability.deactivation.fadeRemaining <= 0) ability.deactivation = null;
  }
  if (ability.placement.active && context.pointer) {
    refreshManticorePlacement(ability, context.pointer, context);
  }
  return updateActiveManticore(ability, safeDt, context);
}

export {
  MANTICORE_CONFIG,
  MANTICORE_VISUAL,
  MANTICORE_TARGET_WEIGHTS,
  MANTICORE_KNOCKBACK_MULTIPLIERS,
  getManticoreWaveDamageMultiplier,
  getManticoreHeavyCaliberMultiplier,
  getManticoreFireRateMultiplier,
  getEffectiveManticoreShotInterval,
  getManticoreCooldownMultiplier,
  getEffectiveManticoreCooldown,
  getManticoreExplosionDamageFactor,
  getEffectiveManticoreExplosionDamage,
  getManticoreDestructibleDamage,
  getManticoreTargetWeight,
  getManticoreKnockbackMultiplier,
  getManticoreKnockbackForce,
  getManticoreKnockbackDescriptor,
  getManticoreFlightTime,
  getManticoreArcHeight,
  isManticoreFiringDistance,
  isManticoreAnchorInRange,
  evaluateManticoreTargetCandidate,
  selectBestManticoreTargetCandidate,
  selectBestManticoreTarget,
  normalizeManticoreTubeIndex,
  getNextManticoreTubeIndex,
  normalizeManticoreAngle,
  turnManticoreTowardAngle,
  createManticoreShotDescriptor,
  createManticoreAbilityState,
  resetManticoreAbilityState,
  validateManticorePlacement,
  refreshManticorePlacement,
  beginManticorePlacement,
  cancelManticorePlacement,
  attemptDeployManticore,
  releaseManticorePlacement,
  stopActiveManticore,
  updateManticoreCooldown,
  createNextManticoreShot,
  manticoreTubeLaunchPosition,
  updateActiveManticore,
  updateManticoreAbility,
};
