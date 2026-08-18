// Dependency-free Bastion-7 configuration, runtime, and pure gameplay helpers.

const DEG_TO_RAD = Math.PI / 180;
const TAU = Math.PI * 2;

const TURRET_VISUAL = Object.freeze({
  spriteSize: 1254,
  renderSize: 92,
  headPivotX: 430 / 1254,
  headPivotY: 644 / 1254,
  muzzleOffsetX: 738 / 1254,
  muzzleOffsetY: 0,
  ghostAlpha: 0.48,
});

const TURRET_CONFIG = Object.freeze({
  id: "bastion7",
  cooldown: 30,
  activeDuration: 30,
  maxActive: 1,
  placementRange: 480,
  minimumPlayerDistance: 70,
  footprintRadius: 42,
  deployDuration: 0.45,
  attackRange: 600,
  shotInterval: 0.10,
  baseDamage: 10,
  projectileSpeed: 900,
  projectileRadius: 3,
  projectileLife: 0.9,
  nearSpread: 7 * DEG_TO_RAD,
  farSpread: 11 * DEG_TO_RAD,
  spreadNearDistance: 250,
  spreadFarDistance: 600,
  bossDamageMultiplier: 0.6,
  turnSpeed: 8,
  aimTolerance: 0.14,
  deactivationDuration: 0.28,
  accent: "#9cff2f",
  projectileColor: "#ffd166",
  visual: TURRET_VISUAL,
});

const FIELD_ENGINEERING_CONFIG = Object.freeze({
  maxLevel: 5,
  waveScalingStartsAfter: 4,
  waveDamagePerWave: 0.05,
  heavyCaliberDamagePerLevel: 0.06,
  overdriveMotorsFireRatePerLevel: 0.04,
  rapidRedeploymentCooldownPerLevel: 0.04,
});

const TURRET_AUDIO_CONFIG = Object.freeze({
  baseLoopPlaybackRate: 0.94,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(angle) {
  let normalized = angle % TAU;
  if (normalized > Math.PI) normalized -= TAU;
  if (normalized < -Math.PI) normalized += TAU;
  return normalized;
}

function createTurretAbilityState() {
  return {
    cooldown: 0,
    cooldownDuration: TURRET_CONFIG.cooldown,
    active: null,
    deactivation: null,
    readyFlash: 0,
    placement: {
      active: false,
      point: null,
      valid: false,
      reason: "inactive",
    },
  };
}

function resetTurretAbilityState(ability) {
  const next = createTurretAbilityState();
  if (!ability) return next;
  ability.cooldown = next.cooldown;
  ability.cooldownDuration = next.cooldownDuration;
  ability.active = next.active;
  ability.deactivation = next.deactivation;
  ability.readyFlash = next.readyFlash;
  ability.placement = next.placement;
  return ability;
}

function pointOverlapsSolid(point, radius, solid) {
  if (!solid || solid.destroyed) return false;
  const halfWidth = Math.max(0, Number(solid.w) || 0) * 0.5;
  const halfHeight = Math.max(0, Number(solid.h) || 0) * 0.5;
  const nearestX = clamp(point.x, solid.x - halfWidth, solid.x + halfWidth);
  const nearestY = clamp(point.y, solid.y - halfHeight, solid.y + halfHeight);
  return Math.hypot(point.x - nearestX, point.y - nearestY) < radius;
}

function pointOverlapsActor(point, radius, actor) {
  if (!actor || actor.hp <= 0) return false;
  return Math.hypot(point.x - actor.x, point.y - actor.y)
    < radius + Math.max(0, Number(actor.radius) || 0);
}

function validateTurretPlacement(point, context = {}) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return { valid: false, reason: "invalid_point" };
  }

  const player = context.player;
  if (!player || !Number.isFinite(player.x) || !Number.isFinite(player.y)) {
    return { valid: false, reason: "missing_player" };
  }

  if (context.activeTurret) {
    return { valid: false, reason: "max_active" };
  }

  const playerDistance = Math.hypot(point.x - player.x, point.y - player.y);
  if (playerDistance > TURRET_CONFIG.placementRange) {
    return { valid: false, reason: "out_of_range" };
  }
  if (playerDistance < TURRET_CONFIG.minimumPlayerDistance) {
    return { valid: false, reason: "too_close" };
  }

  const width = Number(context.worldWidth) || 0;
  const height = Number(context.worldHeight) || 0;
  const radius = TURRET_CONFIG.footprintRadius;
  if (
    point.x - radius < 0
    || point.y - radius < 0
    || point.x + radius > width
    || point.y + radius > height
  ) {
    return { valid: false, reason: "outside_world" };
  }

  if ((context.solids || []).some((solid) => pointOverlapsSolid(point, radius, solid))) {
    return { valid: false, reason: "solid_overlap" };
  }

  if ((context.actors || []).some((actor) => pointOverlapsActor(point, radius, actor))) {
    return { valid: false, reason: "actor_overlap" };
  }

  return { valid: true, reason: "valid" };
}

function placementContextForAbility(ability, context = {}) {
  return {
    ...context,
    activeTurret: ability?.active || context.activeTurret || null,
  };
}

function refreshTurretPlacement(ability, point, context = {}) {
  if (!ability?.placement?.active) return ability?.placement || null;
  const result = validateTurretPlacement(
    point,
    placementContextForAbility(ability, context),
  );
  ability.placement.point = { x: point.x, y: point.y };
  ability.placement.valid = result.valid;
  ability.placement.reason = result.reason;
  return ability.placement;
}

function beginTurretPlacement(ability, point, context = {}) {
  if (!ability || ability.cooldown > 0 || ability.active) return false;
  ability.placement = {
    active: true,
    point: { x: point.x, y: point.y },
    valid: false,
    reason: "invalid_point",
  };
  refreshTurretPlacement(ability, point, context);
  return true;
}

function cancelTurretPlacement(ability) {
  if (!ability?.placement?.active) return false;
  ability.placement = {
    active: false,
    point: null,
    valid: false,
    reason: "cancelled",
  };
  return true;
}

function createActiveTurret(point) {
  return {
    id: TURRET_CONFIG.id,
    x: point.x,
    y: point.y,
    angle: 0,
    remaining: TURRET_CONFIG.activeDuration,
    deployElapsed: 0,
    visualTime: 0,
    recoil: 0,
    muzzleFlash: 0,
    target: null,
    firing: false,
    shotTimer: 0,
  };
}

function attemptDeployTurret(ability, point, context = {}) {
  if (!ability || ability.cooldown > 0 || ability.active) {
    return { deployed: false, reason: ability?.active ? "max_active" : "cooldown" };
  }

  const result = validateTurretPlacement(
    point,
    placementContextForAbility(ability, context),
  );
  if (!result.valid) return { deployed: false, reason: result.reason };

  ability.active = createActiveTurret(point);
  ability.deactivation = null;
  ability.cooldown = 0;
  ability.readyFlash = 0;
  ability.placement = {
    active: false,
    point: null,
    valid: false,
    reason: "deployed",
  };
  return { deployed: true, reason: "deployed", turret: ability.active };
}

function releaseTurretPlacement(ability, point, context = {}) {
  if (!ability?.placement?.active) {
    return { deployed: false, reason: "inactive" };
  }
  const result = attemptDeployTurret(ability, point, context);
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

function stopActiveTurret(ability, reason = "expired", withFade = true) {
  if (!ability?.active) return false;
  if (withFade) {
    ability.deactivation = {
      ...ability.active,
      reason,
      fadeRemaining: TURRET_CONFIG.deactivationDuration,
      fadeDuration: TURRET_CONFIG.deactivationDuration,
    };
  } else {
    ability.deactivation = null;
  }
  ability.active = null;
  ability.cooldown = Number.isFinite(ability.cooldownDuration)
    ? ability.cooldownDuration
    : TURRET_CONFIG.cooldown;
  ability.readyFlash = 0;
  return true;
}

function updateTurretCooldown(ability, dt, onReady) {
  if (!ability) return false;
  const previous = ability.cooldown;
  ability.cooldown = Math.max(0, previous - Math.max(0, dt));
  if (previous > 0 && ability.cooldown === 0) {
    ability.readyFlash = 0.42;
    onReady?.();
    return true;
  }
  return false;
}

function spreadForDistance(distance) {
  if (distance <= TURRET_CONFIG.spreadNearDistance) return TURRET_CONFIG.nearSpread;
  if (distance >= TURRET_CONFIG.spreadFarDistance) return TURRET_CONFIG.farSpread;
  const ratio = (
    distance - TURRET_CONFIG.spreadNearDistance
  ) / (
    TURRET_CONFIG.spreadFarDistance - TURRET_CONFIG.spreadNearDistance
  );
  return TURRET_CONFIG.nearSpread
    + (TURRET_CONFIG.farSpread - TURRET_CONFIG.nearSpread) * ratio;
}

function normalizeFieldEngineeringLevel(level) {
  const numericLevel = Number(level);
  if (!Number.isFinite(numericLevel)) return 0;
  return clamp(Math.floor(numericLevel), 0, FIELD_ENGINEERING_CONFIG.maxLevel);
}

function getTurretWaveDamageMultiplier(wave) {
  const numericWave = Number(wave);
  const currentWave = Number.isFinite(numericWave)
    ? Math.max(1, Math.floor(numericWave))
    : 1;
  return 1 + FIELD_ENGINEERING_CONFIG.waveDamagePerWave * Math.max(
    0,
    currentWave - FIELD_ENGINEERING_CONFIG.waveScalingStartsAfter,
  );
}

function getTurretHeavyCaliberMultiplier(level) {
  return 1 + FIELD_ENGINEERING_CONFIG.heavyCaliberDamagePerLevel
    * normalizeFieldEngineeringLevel(level);
}

function getTurretFireRateMultiplier(level) {
  return 1 + FIELD_ENGINEERING_CONFIG.overdriveMotorsFireRatePerLevel
    * normalizeFieldEngineeringLevel(level);
}

function getEffectiveTurretShotInterval(level, baseShotInterval = TURRET_CONFIG.shotInterval) {
  const safeBase = Number.isFinite(baseShotInterval) && baseShotInterval > 0
    ? baseShotInterval
    : TURRET_CONFIG.shotInterval;
  return safeBase / getTurretFireRateMultiplier(level);
}

function getTurretCooldownMultiplier(level) {
  return 1 - FIELD_ENGINEERING_CONFIG.rapidRedeploymentCooldownPerLevel
    * normalizeFieldEngineeringLevel(level);
}

function getEffectiveTurretCooldown(level, baseCooldown = TURRET_CONFIG.cooldown) {
  const safeBase = Number.isFinite(baseCooldown) && baseCooldown >= 0
    ? baseCooldown
    : TURRET_CONFIG.cooldown;
  return safeBase * getTurretCooldownMultiplier(level);
}

function getEffectiveTurretDamage({
  baseDamage = TURRET_CONFIG.baseDamage,
  wave = 1,
  heavyCaliberLevel = 0,
  armoryDamageMultiplier = 1,
  boss = false,
} = {}) {
  const safeBaseDamage = Number.isFinite(baseDamage)
    ? baseDamage
    : TURRET_CONFIG.baseDamage;
  const safeArmoryMultiplier = Number.isFinite(armoryDamageMultiplier)
    ? armoryDamageMultiplier
    : 1;
  const normalDamage = safeBaseDamage
    * getTurretWaveDamageMultiplier(wave)
    * getTurretHeavyCaliberMultiplier(heavyCaliberLevel)
    * safeArmoryMultiplier;
  return turretDamage(normalDamage, boss);
}

function getTurretLoopPlaybackRate(
  overdriveMotorsLevel = 0,
  basePlaybackRate = TURRET_AUDIO_CONFIG.baseLoopPlaybackRate,
) {
  const safeBase = Number.isFinite(basePlaybackRate) && basePlaybackRate > 0
    ? basePlaybackRate
    : 1;
  return safeBase * getTurretFireRateMultiplier(overdriveMotorsLevel);
}

function turretDamage(baseDamage, boss = false) {
  return baseDamage * (boss ? TURRET_CONFIG.bossDamageMultiplier : 1);
}

function isTargetUsable(origin, target, context = {}) {
  if (!target || target.hp <= 0) return false;
  if (Math.hypot(target.x - origin.x, target.y - origin.y) > TURRET_CONFIG.attackRange) {
    return false;
  }
  return context.isVisible ? Boolean(context.isVisible(origin, target)) : true;
}

function selectNearestVisibleTarget(origin, targets = [], context = {}) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const target of targets) {
    if (!isTargetUsable(origin, target, context)) continue;
    const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
    if (distance >= nearestDistance) continue;
    nearest = target;
    nearestDistance = distance;
  }

  return nearest;
}

function turnTowardAngle(current, target, maxStep) {
  const delta = normalizeAngle(target - current);
  if (Math.abs(delta) <= maxStep) return normalizeAngle(target);
  return normalizeAngle(current + Math.sign(delta) * maxStep);
}

function turretMuzzlePosition(turret, recoil = 0) {
  const renderSize = TURRET_CONFIG.visual.renderSize;
  const localX = TURRET_CONFIG.visual.muzzleOffsetX * renderSize - recoil;
  const localY = TURRET_CONFIG.visual.muzzleOffsetY * renderSize;
  const cos = Math.cos(turret.angle);
  const sin = Math.sin(turret.angle);
  return {
    x: turret.x + localX * cos - localY * sin,
    y: turret.y + localX * sin + localY * cos,
  };
}

function fireTurretShot(turret, target, context) {
  const distance = Math.hypot(target.x - turret.x, target.y - turret.y);
  const targetAngle = Math.atan2(target.y - turret.y, target.x - turret.x);
  const spread = spreadForDistance(distance);
  const random = context.random || Math.random;
  const shotAngle = targetAngle + (random() * 2 - 1) * spread;
  const armoryDamageMultiplier = Number.isFinite(context.armoryDamageMultiplier)
    ? context.armoryDamageMultiplier
    : context.damageMultiplier;
  const origin = turretMuzzlePosition(turret);

  context.onShot?.({
    origin,
    angle: shotAngle,
    speed: TURRET_CONFIG.projectileSpeed,
    damage: getEffectiveTurretDamage({
      wave: context.wave,
      heavyCaliberLevel: context.heavyCaliberLevel,
      armoryDamageMultiplier,
    }),
    color: TURRET_CONFIG.projectileColor,
    style: "turret",
    radius: TURRET_CONFIG.projectileRadius,
    life: TURRET_CONFIG.projectileLife,
    source: "turret",
  });

  turret.muzzleFlash = 0.065;
  turret.recoil = 1;
}

function updateActiveTurret(ability, dt, context = {}) {
  const turret = ability.active;
  if (!turret) return;

  turret.remaining = Math.max(0, turret.remaining - dt);
  turret.deployElapsed = Math.min(
    TURRET_CONFIG.deployDuration,
    turret.deployElapsed + dt,
  );
  turret.visualTime += dt;
  turret.recoil = Math.max(0, turret.recoil - dt * 13);
  turret.muzzleFlash = Math.max(0, turret.muzzleFlash - dt);

  if (turret.remaining <= 0) {
    stopActiveTurret(ability, "duration");
    return;
  }
  if (turret.deployElapsed < TURRET_CONFIG.deployDuration || context.combatEnabled === false) {
    turret.firing = false;
    turret.shotTimer = 0;
    return;
  }

  const targetContext = { isVisible: context.isVisible };
  if (!isTargetUsable(turret, turret.target, targetContext)) {
    turret.target = null;
    turret.firing = false;
    turret.shotTimer = 0;
  }

  if (!turret.target) {
    turret.target = selectNearestVisibleTarget(
      turret,
      context.targets || [],
      targetContext,
    );
  }

  if (!turret.target) {
    turret.firing = false;
    turret.shotTimer = 0;
    return;
  }

  const desiredAngle = Math.atan2(
    turret.target.y - turret.y,
    turret.target.x - turret.x,
  );
  turret.angle = turnTowardAngle(
    turret.angle,
    desiredAngle,
    TURRET_CONFIG.turnSpeed * dt,
  );
  const aimError = Math.abs(normalizeAngle(desiredAngle - turret.angle));
  if (aimError > TURRET_CONFIG.aimTolerance) {
    turret.firing = false;
    turret.shotTimer = 0;
    return;
  }

  const shotInterval = getEffectiveTurretShotInterval(context.overdriveMotorsLevel);
  if (!turret.firing) {
    turret.firing = true;
    turret.shotTimer = shotInterval;
    fireTurretShot(turret, turret.target, context);
    return;
  }

  turret.shotTimer -= dt;
  if (turret.shotTimer <= 0) {
    fireTurretShot(turret, turret.target, context);
    turret.shotTimer = Math.max(
      0,
      turret.shotTimer + shotInterval,
    );
  }
}

function updateTurretAbility(ability, dt, context = {}) {
  if (!ability) return;
  const safeDt = Math.max(0, Number(dt) || 0);

  if (Object.hasOwn(context, "rapidRedeploymentLevel")) {
    ability.cooldownDuration = getEffectiveTurretCooldown(context.rapidRedeploymentLevel);
  }

  if (!ability.active) {
    updateTurretCooldown(ability, safeDt, context.onReady);
  }
  ability.readyFlash = Math.max(0, ability.readyFlash - safeDt);

  if (ability.deactivation) {
    ability.deactivation.fadeRemaining = Math.max(
      0,
      ability.deactivation.fadeRemaining - safeDt,
    );
    ability.deactivation.visualTime += safeDt;
    if (ability.deactivation.fadeRemaining <= 0) ability.deactivation = null;
  }

  if (ability.placement.active && context.pointer) {
    refreshTurretPlacement(ability, context.pointer, context);
  }

  updateActiveTurret(ability, safeDt, context);
}

function turretHudState(ability) {
  if (!ability) return { mode: "ready", value: "", progress: 1 };
  if (ability.placement.active) {
    return { mode: "placement", value: "", progress: 1 };
  }
  if (ability.active) {
    return {
      mode: "active",
      value: String(Math.ceil(ability.active.remaining)),
      progress: clamp(
        ability.active.remaining / TURRET_CONFIG.activeDuration,
        0,
        1,
      ),
    };
  }
  if (ability.cooldown > 0) {
    const cooldownDuration = Number.isFinite(ability.cooldownDuration)
      ? ability.cooldownDuration
      : TURRET_CONFIG.cooldown;
    return {
      mode: "cooldown",
      value: String(Math.ceil(ability.cooldown)),
      progress: clamp(1 - ability.cooldown / cooldownDuration, 0, 1),
    };
  }
  return { mode: "ready", value: "", progress: 1 };
}

export {
  TURRET_CONFIG,
  FIELD_ENGINEERING_CONFIG,
  TURRET_AUDIO_CONFIG,
  createTurretAbilityState,
  resetTurretAbilityState,
  validateTurretPlacement,
  refreshTurretPlacement,
  beginTurretPlacement,
  cancelTurretPlacement,
  attemptDeployTurret,
  releaseTurretPlacement,
  stopActiveTurret,
  updateTurretCooldown,
  spreadForDistance,
  normalizeFieldEngineeringLevel,
  getTurretWaveDamageMultiplier,
  getTurretHeavyCaliberMultiplier,
  getTurretFireRateMultiplier,
  getEffectiveTurretShotInterval,
  getTurretCooldownMultiplier,
  getEffectiveTurretCooldown,
  getEffectiveTurretDamage,
  getTurretLoopPlaybackRate,
  turretDamage,
  selectNearestVisibleTarget,
  turnTowardAngle,
  turretMuzzlePosition,
  updateTurretAbility,
  turretHudState,
};
