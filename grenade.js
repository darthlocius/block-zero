import {
  TAU,
  GRENADE_CONFIG,
  player,
  world,
  clamp,
  rand,
  pick,
  pushParticle,
  pushBlastGlow,
  addDecal,
  addScreenShake,
  applyDamageToFoe,
  applyFoeKnockback,
  audio,
  syncHud,
} from "./game.js";
import { damageSolid } from "./collision.js";

// Targeted impact grenades use their own world-space flight and explosion path.

function emitGrenadeTrail(grenade) {
  pushParticle({
    x: grenade.x + rand(-1.5, 1.5),
    y: grenade.y - grenade.height * 0.38 + rand(-1.5, 1.5),
    vx: rand(-8, 8),
    vy: rand(-8, 5),
    life: rand(0.12, 0.2),
    size: rand(2.2, 3.8),
    sizeEnd: 0,
    color: pick([
      "rgba(207, 255, 151, 0.72)",
      "rgba(156, 255, 47, 0.66)",
      "rgba(255, 181, 78, 0.58)",
    ]),
    type: "flare",
    drag: 0.88,
  });
}

function createGrenadeExplosionEffects(x, y) {
  pushBlastGlow(x, y, 78, "rgba(236, 255, 221, 0.86)", 0.18);
  pushBlastGlow(
    x,
    y,
    GRENADE_CONFIG.explosionRadius,
    "rgba(116, 255, 77, 0.46)",
    0.36,
  );

  pushParticle({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.16,
    size: 24,
    sizeEnd: 82,
    color: "rgba(244, 255, 234, 0.96)",
    type: "flare",
    alpha: 0.94,
  });

  pushParticle({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.34,
    size: 18,
    sizeEnd: GRENADE_CONFIG.explosionRadius,
    color: "rgba(190, 255, 142, 0.78)",
    type: "shockwave",
    lineWidth: 11,
    alpha: 0.82,
  });

  pushParticle({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.2,
    size: 12,
    sizeEnd: 122,
    color: "rgba(230, 255, 198, 0.92)",
    type: "ring",
    lineWidth: 6,
    alpha: 0.92,
  });

  for (let i = 0; i < 24; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(150, 390);
    pushParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.18, 0.38),
      size: rand(4, 8),
      sizeEnd: 0,
      color: pick([
        "rgba(244, 255, 232, 0.94)",
        "rgba(156, 255, 47, 0.88)",
        "rgba(139, 153, 145, 0.82)",
      ]),
      type: i % 5 === 0 ? "debris" : "spark",
      rotation: angle,
      spin: rand(-9, 9),
      gravity: i % 5 === 0 ? 180 : 40,
      drag: 0.9,
      stretch: 0.34,
    });
  }

  for (let i = 0; i < 8; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(18, 58);
    pushParticle({
      x: x + rand(-22, 22),
      y: y + rand(-16, 16),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(16, 34),
      life: rand(0.42, 0.72),
      size: rand(9, 16),
      sizeEnd: rand(18, 28),
      color: pick([
        "rgba(38, 50, 42, 0.46)",
        "rgba(49, 61, 52, 0.4)",
        "rgba(29, 37, 32, 0.5)",
      ]),
      type: "smoke",
      drag: 0.95,
    });
  }

  addDecal(x, y, 68, "rgba(116, 255, 77, 0.18)", 0.14);
  addDecal(x, y, 57, "rgba(8, 14, 10, 0.72)", 0.28);
  addScreenShake(0.36);
  audio.explosion();
}

function explodeGrenade(grenade) {
  const x = grenade.targetX;
  const y = grenade.targetY;

  for (const foe of world.foes) {
    if (!foe || foe.hp <= 0) continue;

    const distance = Math.hypot(foe.x - x, foe.y - y);
    if (distance > GRENADE_CONFIG.explosionRadius) continue;

    const normalizedDistance = clamp(
      distance / GRENADE_CONFIG.explosionRadius,
      0,
      1,
    );
    const falloff = 1
      - (1 - GRENADE_CONFIG.edgeDamageRatio) * normalizedDistance;

    let damage = GRENADE_CONFIG.baseDamage * falloff;
    if (foe.boss) damage *= GRENADE_CONFIG.bossDamageMultiplier;

    applyDamageToFoe(foe, damage, {
      source: "playerGrenade",
    });

    let knockback = GRENADE_CONFIG.knockbackForce
      * (1 - normalizedDistance * 0.72);

    if (foe.id === "techpriest") {
      knockback *= GRENADE_CONFIG.techpriestKnockbackMultiplier;
    }
    if (foe.boss) {
      knockback *= GRENADE_CONFIG.bossKnockbackMultiplier;
    }

    const angle = distance > 0.001
      ? Math.atan2(foe.y - y, foe.x - x)
      : Math.random() * TAU;
    applyFoeKnockback(foe, knockback, angle);
  }

  for (const solid of [...world.destructibles]) {
    if (solid.destroyed) continue;

    const distance = Math.hypot(solid.x - x, solid.y - y);
    if (distance > GRENADE_CONFIG.explosionRadius) continue;

    const normalizedDistance = clamp(
      distance / GRENADE_CONFIG.explosionRadius,
      0,
      1,
    );
    const falloff = 1
      - (1 - GRENADE_CONFIG.edgeDamageRatio) * normalizedDistance;

    damageSolid(
      solid,
      GRENADE_CONFIG.baseDamage
        * GRENADE_CONFIG.destructibleDamageMultiplier
        * falloff,
      solid.x,
      solid.y,
    );
  }

  createGrenadeExplosionEffects(x, y);
}

function throwGrenade() {
  if (world.state !== "playing") return false;

  if (world.grenadeCount <= 0) {
    world.grenadeHudEmptyPulse = 0.32;
    syncHud();
    return false;
  }

  if (world.grenadeCooldown > 0) return false;

  const dx = world.pointer.x - player.x;
  const dy = world.pointer.y - player.y;
  const rawDistance = Math.hypot(dx, dy);
  const distance = Math.min(rawDistance, GRENADE_CONFIG.maxRange);
  const scale = rawDistance > 0 ? distance / rawDistance : 0;

  const targetX = clamp(
    player.x + dx * scale,
    12,
    world.width - 12,
  );
  const targetY = clamp(
    player.y + dy * scale,
    12,
    world.height - 12,
  );
  const flightDuration = clamp(
    GRENADE_CONFIG.flightBase
      + distance / GRENADE_CONFIG.flightDistanceDivisor,
    GRENADE_CONFIG.minFlightTime,
    GRENADE_CONFIG.maxFlightTime,
  );

  world.grenades.push({
    startX: player.x,
    startY: player.y,
    targetX,
    targetY,
    x: player.x,
    y: player.y,
    height: 0,
    elapsed: 0,
    duration: flightDuration,
    rotation: player.angle,
    spin: rand(7, 11) * (Math.random() < 0.5 ? -1 : 1),
    pulse: Math.random() * TAU,
    trailTimer: 0,
  });

  world.grenadeCount -= 1;
  world.grenadeCooldown = GRENADE_CONFIG.cooldown;
  world.grenadeHudPulse = 0.28;
  syncHud();
  return true;
}

function updateGrenades(dt) {
  world.grenadeCooldown = Math.max(0, world.grenadeCooldown - dt);
  world.grenadeHudPulse = Math.max(0, world.grenadeHudPulse - dt);
  world.grenadeHudEmptyPulse = Math.max(0, world.grenadeHudEmptyPulse - dt);

  const activeGrenades = [];

  for (const grenade of world.grenades) {
    grenade.elapsed += dt;

    const progress = clamp(grenade.elapsed / grenade.duration, 0, 1);
    grenade.x = grenade.startX
      + (grenade.targetX - grenade.startX) * progress;
    grenade.y = grenade.startY
      + (grenade.targetY - grenade.startY) * progress;
    grenade.height = Math.sin(progress * Math.PI)
      * GRENADE_CONFIG.arcHeight;
    grenade.rotation += grenade.spin * dt;
    grenade.pulse += dt * 10;
    grenade.trailTimer -= dt;

    if (progress >= 1) {
      explodeGrenade(grenade);
      if (world.state === "death_sequence") {
        world.grenades = [];
        return;
      }
      continue;
    }

    if (grenade.trailTimer <= 0) {
      grenade.trailTimer += 0.05;
      emitGrenadeTrail(grenade);
    }

    activeGrenades.push(grenade);
  }

  world.grenades = activeGrenades;
}

function restockGrenadeAtWaveStart() {
  if (world.wave <= 1) return false;
  if (world.grenadeCount >= world.grenadeMax) return false;

  world.grenadeCount = Math.min(
    world.grenadeMax,
    world.grenadeCount + 1,
  );
  world.grenadeHudPulse = 0.55;
  syncHud();
  return true;
}

export {
  throwGrenade,
  updateGrenades,
  restockGrenadeAtWaveStart,
};
