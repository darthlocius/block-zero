import {
  player,
  world,
  audio,
  currentWeapon,
  fireRate,
  moveVector,
  rand,
  burst,
  spawnMuzzleFlash,
  spawnWeaponDischarge,
  spawnImpactFlash,
  pushBlastGlow,
  applyFoeKnockback,
  dist,
  damagePlayer,
  addScreenShake,
  getMetaExecutionBonusMultiplier,
  hasSynergy,
} from "./game.js";
import { projectileHitsSolids } from "./collision.js";

// Projectile spawning, weapon firing, and shot updates.

function projectile(origin, angle, speed, damage, color, style, friendly = false, radius = 5, extra = {}) {
  const life = extra.life || 2.8;
  const shot = {
    x: origin.x,
    y: origin.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    damage,
    color,
    style,
    life,
    maxLife: life,
    friendly,
    pierce: extra.pierce || 0,
    weaponId: extra.weaponId || null,
    splashRadius: extra.splashRadius || 0,
    explosive: Boolean(extra.explosive),
    hitIds: new Set(),
  };
  if (friendly) world.bullets.push(shot);
  else world.enemyShots.push(shot);
}

function applyShotKnockback(foe, shot) {
  let force = shot.weaponId === "shotgun"
    ? 128
    : shot.weaponId === "rail"
      ? 92
      : shot.weaponId === "smg"
        ? 26
        : 44;
  force *= world.waveBonusModifiers.knockbackMul;
  if (shot.weaponId === "shotgun") force *= world.waveBonusModifiers.shotgunKnockbackMul;
  if (shot.weaponId === "shotgun" && hasSynergy("crowd_control")) {
    force *= 1.5;
    foe.slowTimer = Math.max(foe.slowTimer || 0, 0.8);
  }
  applyFoeKnockback(foe, force, Math.atan2(shot.vy, shot.vx));
}

function explodeEnemyShot(shot, directHit = false) {
  const x = shot.x;
  const y = shot.y;
  const radius = shot.splashRadius || 0;
  burst(x, y, shot.style === "rocket" ? "#b8ff72" : shot.color, shot.style === "rocket" ? 9 : 6, shot.style === "rocket" ? 1.15 : 0.85);
  pushBlastGlow(x, y, shot.style === "rocket" ? 42 : 26, shot.style === "rocket" ? "rgba(167,255,102,0.34)" : "rgba(127,201,255,0.26)", shot.style === "rocket" ? 0.34 : 0.22);
  spawnImpactFlash(x, y, shot.style === "rocket" ? "#d8ff99" : shot.color, shot.style === "rocket" ? 1.1 : 0.95, shot.style === "rocket" ? "rocket" : "cannon");
  if (shot.style === "rocket") addScreenShake(0.11);
  if (radius <= 0) {
    if (directHit) damagePlayer(shot.damage, { explosive: shot.style === "rocket" });
    return;
  }
  const d = Math.hypot(player.x - x, player.y - y);
  if (directHit || d < radius) {
    const falloff = directHit ? 1 : Math.max(0.3, 1 - d / radius);
    damagePlayer(shot.damage * falloff, { explosive: true });
  }
}

function triggerBulletStorm(weapon, muzzle, baseAngle) {
  if (!hasSynergy("bullet_storm")) return;
  if (weapon.id !== "pistol" && weapon.id !== "smg") return;
  world.synergyCounters.bulletStormShots = (world.synergyCounters.bulletStormShots || 0) + 1;
  if (world.synergyCounters.bulletStormShots % 6 !== 0) return;
  const angle = baseAngle + rand(-weapon.spread * 0.55, weapon.spread * 0.55);
  projectile(
    muzzle,
    angle,
    weapon.speed * 1.04,
    weapon.damage * 0.68,
    weapon.color,
    weapon.style,
    true,
    Math.max(3, weapon.radius - 1),
    {
      life: weapon.id === "smg" ? 1.2 : 1.8,
      pierce: weapon.pierce || 0,
      weaponId: weapon.id,
    },
  );
  burst(muzzle.x, muzzle.y, weapon.id === "smg" ? "#ffd18c" : "#ffe9bb", 3, 0.44);
}

function triggerShockCorridor(primaryTarget, shot) {
  if (!hasSynergy("shock_corridor") || shot.weaponId !== "rail") return;
  if (Math.random() > 0.55) return;
  let chainTarget = null;
  let best = 150;
  for (const foe of world.foes) {
    if (foe === primaryTarget || foe.hp <= 0) continue;
    const distance = Math.hypot(foe.x - primaryTarget.x, foe.y - primaryTarget.y);
    if (distance < best) {
      best = distance;
      chainTarget = foe;
    }
  }
  if (!chainTarget) return;
  const arcDamage = shot.damage * 0.34;
  chainTarget.hp -= arcDamage;
  chainTarget.hitFlash = Math.max(chainTarget.hitFlash, 0.16);
  burst(chainTarget.x, chainTarget.y, "#8ef3ff", 4, 0.5);
  spawnImpactFlash(chainTarget.x, chainTarget.y, "#8ef3ff", 0.92, "plasmaOrb");
}

function shoot() {
  if (player.fireCooldown > 0 || (world.state !== "playing" && world.state !== "intermission")) return;
  const weapon = currentWeapon();
  const dx = world.pointer.x - player.x;
  const dy = world.pointer.y - player.y;
  const baseAngle = Math.atan2(dy, dx);
  const muzzle = { x: player.x + Math.cos(baseAngle) * 28, y: player.y + Math.sin(baseAngle) * 28 };
  spawnMuzzleFlash(weapon.id, muzzle.x, muzzle.y, baseAngle);
  player.shootAnimTimer = 0.16;
  player.animTime = 0;
  player.fireCooldown = fireRate();
  triggerBulletStorm(weapon, muzzle, baseAngle);
  for (let i = 0; i < weapon.pellets; i += 1) {
    const angle = baseAngle + rand(-weapon.spread, weapon.spread);
    let damage = weapon.damage;
    let pierce = weapon.pierce || 0;
    if (weapon.id === "pistol" && world.waveBonusModifiers.pistolDeadeyeEvery > 0) {
      world.waveBonusModifiers.pistolDeadeyeCounter += 1;
      if (world.waveBonusModifiers.pistolDeadeyeCounter % world.waveBonusModifiers.pistolDeadeyeEvery === 0) {
        damage *= world.waveBonusModifiers.pistolDeadeyeDamageMul;
        pierce += world.waveBonusModifiers.pistolDeadeyePierceBonus;
      }
    }
    projectile(
      muzzle,
      angle,
      weapon.speed,
      damage,
      weapon.color,
      weapon.style,
      true,
      weapon.radius,
      {
        life: weapon.id === "shotgun" ? 0.72 : weapon.id === "rail" ? 1.15 : weapon.id === "smg" ? 1.6 : 2.2,
        pierce,
        weaponId: weapon.id,
      },
    );
  }
  burst(muzzle.x, muzzle.y, weapon.id === "rail" ? "#86f7ff" : "#ffd166", weapon.id === "shotgun" ? 7 : 4, weapon.id === "rail" ? 1 : 0.7);
  spawnWeaponDischarge(weapon, muzzle, baseAngle);
  if (weapon.id === "shotgun") addScreenShake(0.18);
  else if (weapon.id === "rail") addScreenShake(0.13);
  else if (weapon.id === "smg") addScreenShake(0.025);
  else addScreenShake(0.055);
  audio.weapon(weapon.id);
}

function dash() {
  if (player.dashCooldown > 0 || (world.state !== "playing" && world.state !== "intermission")) return;
  const move = moveVector();
  if (!move.active) return;
  player.dashCooldown = 2.6 * world.waveBonusModifiers.dashCooldownMul;
  player.dashDuration = 0.2;
  player.dashVector = move;
  audio.dash();
  burst(player.x, player.y, "#29d3c2", 18, 1.2);
}

function updateShots(dt) {
  world.bullets = world.bullets.filter((shot) => {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (projectileHitsSolids(shot, 0.8)) return false;
    for (const foe of world.foes) {
      if (shot.hitIds.has(foe)) continue;
      if (dist(shot, foe) <= shot.radius + foe.radius) {
        let damage = shot.damage;
        if (world.waveBonusModifiers.executionThreshold > 0 && foe.hp / foe.maxHp <= world.waveBonusModifiers.executionThreshold) {
          damage *= world.waveBonusModifiers.executionDamageMul;
        }
        if (foe.hp / foe.maxHp <= 0.35) damage *= getMetaExecutionBonusMultiplier();
        foe.hp -= damage;
        foe.hitFlash = 0.12;
        applyShotKnockback(foe, shot);
        triggerShockCorridor(foe, shot);
        shot.hitIds.add(foe);
        burst(shot.x, shot.y, "#ffe3a1", 4, 0.6);
        spawnImpactFlash(
          shot.x,
          shot.y,
          shot.weaponId === "rail" ? "#8cefff" : shot.weaponId === "shotgun" ? "#ffd79d" : shot.weaponId === "smg" ? "#ffd18c" : "#ffe9bb",
          shot.weaponId === "rail"
            ? 1.18 * world.waveBonusModifiers.plasmaImpactMul
            : shot.weaponId === "shotgun"
              ? 1.12
              : shot.weaponId === "smg"
                ? 0.72
                : 0.9,
          shot.weaponId === "rail" ? "plasmaOrb" : shot.style
        );
        if (shot.weaponId === "rail" && world.waveBonusModifiers.plasmaImpactMul > 1) {
          burst(shot.x, shot.y, "#8ef3ff", 5, 0.72);
        }
        if (foe.boss && shot.weaponId === "shotgun") addScreenShake(0.12);
        else if (foe.boss && shot.weaponId === "rail") addScreenShake(0.1);
        if (shot.pierce > 0) {
          shot.pierce -= 1;
          continue;
        }
        return false;
      }
    }
    return shot.life > 0 && shot.x > -30 && shot.x < world.width + 30 && shot.y > -30 && shot.y < world.height + 30;
  });

  world.enemyShots = world.enemyShots.filter((shot) => {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (projectileHitsSolids(shot, 0.5)) {
      if (shot.explosive) explodeEnemyShot(shot, false);
      return false;
    }
    if (dist(shot, player) <= shot.radius + player.radius) {
      if (shot.explosive) explodeEnemyShot(shot, true);
      else {
        damagePlayer(shot.damage);
        burst(shot.x, shot.y, shot.color, 5, 0.7);
        spawnImpactFlash(shot.x, shot.y, shot.color, shot.style === "cannon" ? 1 : 0.9, shot.style === "cannon" ? "cannon" : "enemy");
      }
      return false;
    }
    if (shot.life <= 0) {
      if (shot.explosive) explodeEnemyShot(shot, false);
      return false;
    }
    return shot.life > 0 && shot.x > -30 && shot.x < world.width + 30 && shot.y > -30 && shot.y < world.height + 30;
  });
}

export {
  projectile,
  shoot,
  dash,
  updateShots,
};
