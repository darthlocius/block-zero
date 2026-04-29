import {
  TAU,
  enemies,
  bosses,
  animationProfiles,
  player,
  world,
  rand,
  pick,
  banner,
  addScreenShake,
  audio,
  updateActorFacing,
  awardKill,
  damagePlayer,
  spawnEnemyShotEffect,
  spawnWaveBarrels,
  spawnWaveCoverObjects,
  syncHud,
  expireWaveBonusIfNeeded,
  startWaveClearSequence,
} from "./game.js";
import { projectile } from "./bullet.js";
import { t } from "./i18n.js";
import { moveActor } from "./collision.js";

// Enemy spawning, waves, and AI behavior.

function createWave(wave) {
  const bossWave = wave % 4 === 0;
  const total = 6 + wave * 2 + Math.floor(wave / 2);
  return {
    wave,
    bossWave,
    regularTotal: bossWave ? total - 2 : total,
    regularSpawned: 0,
    bossSpawned: false,
    spawnTimer: 0.8,
    spawnInterval: Math.max(0.36, 1.05 - wave * 0.05),
    bossTemplate: bossWave ? bosses[Math.floor((wave / 4 - 1) % bosses.length)] : null,
  };
}

function spawnPoint() {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: -30, y: rand(0, world.height) };
  if (side === 1) return { x: world.width + 30, y: rand(0, world.height) };
  if (side === 2) return { x: rand(0, world.width), y: -30 };
  return { x: rand(0, world.width), y: world.height + 30 };
}

function waveScaling(wave) {
  const waveIndex = Math.max(0, wave - 1);
  return {
    waveIndex,
    hpScale: 1 + waveIndex * 0.055,
    damageScale: 1 + waveIndex * 0.035,
  };
}

function makeFoe(template, x, y, extra = {}) {
  return {
    ...template,
    kind: extra.kind || template.id,
    x,
    y,
    hp: extra.hp ?? template.hp,
    maxHp: extra.hp ?? template.hp,
    speed: extra.speed ?? template.speed,
    radius: extra.radius ?? template.radius,
    damage: extra.damage ?? template.damage,
    reward: extra.reward ?? template.reward,
    attackCooldown: extra.attackCooldown ?? template.attackCooldown,
    attackTimer: rand(0.2, extra.attackCooldown ?? template.attackCooldown ?? 1.1),
    specialCooldown: extra.specialCooldown ?? rand(3.2, 5),
    pulse: Math.random() * TAU,
    hitFlash: 0,
    boss: Boolean(extra.boss),
    bossId: extra.bossId || null,
    strafeDir: Math.random() < 0.5 ? -1 : 1,
    chargeTimer: 0,
    chargeHasHit: false,
    meleeCooldown: 0,
    rangedSpecialCooldown: extra.rangedSpecialCooldown ?? rand(3.5, 5.5),
    summonTimer: rand(5, 7),
    burstShots: 0,
    burstTimer: 0,
    animationProfile: "topdown_octant",
    facingIndex: 2,
    facingLeft: false,
    facingName: "down",
    facingVertical: "down",
    animTime: 0,
    attackAnimTimer: 0,
    projectileSpeed: extra.projectileSpeed ?? template.projectileSpeed,
    knockbackX: 0,
    knockbackY: 0,
    slowTimer: 0,
  };
}


function beginWave() {
  world.wave += 1;
  world.currentWave = createWave(world.wave);
  world.state = "playing";
  spawnWaveBarrels(Math.min(4, 2 + Math.floor(world.wave / 3)));
  spawnWaveCoverObjects();
  const bossWave = world.currentWave.bossWave;
  banner(
    bossWave ? t("banner.waveBoss.title", { wave: world.wave }) : t("banner.wave.title", { wave: world.wave }),
    bossWave ? t("banner.waveBoss.subtitle", { boss: t(`boss.${world.currentWave.bossTemplate.id}`) }) : t("banner.wave.subtitle"),
    2.7,
    bossWave ? "#ff2f6d" : "#ff9d43",
  );
  audio.wave(bossWave);
  addScreenShake(bossWave ? 0.28 : 0.14);
  syncHud();
}

function intermission() {
  expireWaveBonusIfNeeded();
  startWaveClearSequence();
}

function spawnRegular() {
  const wave = world.wave;
  const pool = ["animal"];
  if (wave >= 2) pool.push("criminal");
  if (wave >= 3) pool.push("monster");
  if (wave >= 5) pool.push(pick(["animal", "monster", "criminal"]));
  const base = enemies[pick(pool)];
  const pos = spawnPoint();
  const { waveIndex, hpScale, damageScale } = waveScaling(wave);
  const tankHpBonus = base.id === "criminal" ? 0.08 : 0;
  const earlyRangedFactor = base.id === "criminal"
    ? (wave <= 3 ? 1.22 : wave <= 5 ? 1.08 : 1)
    : base.id === "monster"
      ? (wave <= 3 ? 1.35 : wave <= 5 ? 1.14 : 1)
      : 1;
  world.foes.push(makeFoe(base, pos.x, pos.y, {
    hp: Math.round(base.hp * (hpScale + tankHpBonus)),
    damage: Math.round(base.damage * damageScale),
    speed: base.speed + waveIndex * (base.id === "animal" ? 2.2 : 1.2),
    attackCooldown: base.attackCooldown * earlyRangedFactor,
  }));
  world.currentWave.regularSpawned += 1;
}

function spawnBoss() {
  if (!world.currentWave || !world.currentWave.bossWave || world.currentWave.bossSpawned) return;
  const base = world.currentWave.bossTemplate;
  const pos = spawnPoint();
  const { waveIndex, damageScale: bossDamageScale } = waveScaling(world.wave);
  world.foes.push(makeFoe(base, pos.x, pos.y, {
    kind: base.kind,
    hp: Math.round((base.hp + world.wave * 18) * (1 + waveIndex * 0.045)),
    speed: base.speed,
    radius: base.radius,
    damage: Math.round(base.damage * bossDamageScale),
    reward: base.reward + world.wave * 8,
    attackCooldown: base.attackCooldown,
    specialCooldown: base.specialCooldown,
    boss: true,
    bossId: base.id,
  }));
  world.currentWave.bossSpawned = true;
  banner(t(`boss.${base.id}`).toUpperCase(), t("banner.bossIncoming.subtitle"), 2.2, "#ff2f6d");
  addScreenShake(0.22);
}

function spawnMinions(foe, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = TAU / count * i + Math.random() * 0.4;
    const range = foe.radius + 18;
    const base = enemies[foe.kind] || enemies.animal;
    world.foes.push(makeFoe(base, foe.x + Math.cos(angle) * range, foe.y + Math.sin(angle) * range, {
      hp: Math.round(base.hp * 0.85),
      speed: base.speed + 18,
      reward: Math.round(base.reward * 0.75),
    }));
  }
}

const FACE_DEAD_ZONE = 18;
const HELLHOUND_PLAYER_STOP_PADDING = 10;

function keepFoeOutsidePlayer(foe, minDistance) {
  const dx = foe.x - player.x;
  const dy = foe.y - player.y;
  const distance = Math.hypot(dx, dy) || 1;

  if (distance >= minDistance) return;

  const push = minDistance - distance;
  foe.x += (dx / distance) * push;
  foe.y += (dy / distance) * push;
}

function updateWave(dt) {
  if (!world.currentWave) return;
  world.currentWave.spawnTimer -= dt;
  if (world.currentWave.spawnTimer <= 0 && world.currentWave.regularSpawned < world.currentWave.regularTotal) {
    world.currentWave.spawnTimer = world.currentWave.spawnInterval;
    spawnRegular();
  }
  if (world.currentWave.bossWave && !world.currentWave.bossSpawned && (world.currentWave.regularSpawned >= Math.ceil(world.currentWave.regularTotal * 0.55) || world.currentWave.regularSpawned >= world.currentWave.regularTotal)) spawnBoss();
  const done = world.currentWave.regularSpawned >= world.currentWave.regularTotal && (!world.currentWave.bossWave || world.currentWave.bossSpawned) && world.foes.length === 0;
  if (done) intermission();
}

function updateFoe(foe, dt) {
  foe.hitFlash = Math.max(0, foe.hitFlash - dt);
  foe.slowTimer = Math.max(0, (foe.slowTimer || 0) - dt);
  foe.attackTimer -= dt;
  foe.attackAnimTimer = Math.max(0, foe.attackAnimTimer - dt);
  foe.specialCooldown -= dt;
  foe.meleeCooldown = Math.max(0, (foe.meleeCooldown || 0) - dt);
  foe.rangedSpecialCooldown = Math.max(0, (foe.rangedSpecialCooldown || 0) - dt);
  foe.summonTimer -= dt;
  foe.burstTimer -= dt;
  foe.pulse += dt * (foe.boss ? 5.2 : 6.5);
  const dx = player.x - foe.x;
  const dy = player.y - foe.y;
  if (Math.abs(dx) > FACE_DEAD_ZONE) {
    foe.facingLeft = dx < 0;
  }
  foe.angle = Math.atan2(dy, dx);
  updateActorFacing(foe, foe.angle, foe.animationProfile);
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const tx = -ny;
  const ty = nx;
  let vx = 0;
  let vy = 0;

  if (foe.boss) {
    if (foe.bossId === "alpha") {
      if (foe.chargeTimer > 0) {
        foe.chargeTimer -= dt;
        vx = foe.chargeDirX * 450;
        vy = foe.chargeDirY * 450;
        if (!foe.chargeHasHit && len < foe.radius + player.radius + 14) {
          foe.chargeHasHit = true;
          foe.attackAnimTimer = 0.28;
          damagePlayer(Math.round(foe.damage * 1.4));
          addScreenShake(0.34);
          audio.attack("animal");
        }
      } else {
        vx = (nx + tx * 0.12 * Math.sin(foe.pulse)) * foe.speed;
        vy = (ny + ty * 0.12 * Math.sin(foe.pulse)) * foe.speed;
        if (foe.specialCooldown <= 0 && len < 260) {
          foe.specialCooldown = 5.1;
          foe.chargeTimer = 0.58;
          foe.chargeHasHit = false;
          foe.chargeDirX = nx;
          foe.chargeDirY = ny;
          audio.attack("monster");
          banner(t("banner.alphaCharge.title"), t("banner.alphaCharge.subtitle"), 1, "#ff5b2e");
        }
        if (foe.summonTimer <= 0 && world.foes.length < 24) {
          foe.summonTimer = 7;
          spawnMinions(foe, 2);
        }
      }
    } else if (foe.bossId === "abomination") {
      vx = (nx + tx * 0.08 * Math.cos(foe.pulse * 0.7)) * foe.speed;
      vy = (ny + ty * 0.08 * Math.sin(foe.pulse * 0.7)) * foe.speed;
      if (foe.specialCooldown <= 0) {
        const orbCount = 12;
        const acidDamage = Math.max(14, Math.round(foe.damage * 0.55));
        foe.specialCooldown = 4.4;
        audio.attack("abomination");
        addScreenShake(0.24);
        for (let i = 0; i < orbCount; i += 1) projectile(foe, TAU / orbCount * i + foe.pulse * 0.2, 235, acidDamage, "#93ff67", "acid", false, 7);
      }
    } else {
      if (len > 240) { vx = nx * foe.speed; vy = ny * foe.speed; }
      else if (len < 150) { vx = -nx * foe.speed * 0.7; vy = -ny * foe.speed * 0.7; }
      vx += tx * foe.speed * 0.35 * foe.strafeDir;
      vy += ty * foe.speed * 0.35 * foe.strafeDir;
      if (len < 135 && foe.meleeCooldown <= 0) {
        const baseAngle = Math.atan2(dy, dx);
        foe.meleeCooldown = 3.2;
        foe.attackTimer = Math.max(foe.attackTimer, 0.5);
        foe.attackAnimTimer = 0.32;
        damagePlayer(Math.round(foe.damage * 1.65));
        addScreenShake(0.24);
        audio.attack("warlord");
        for (const spread of [-0.28, 0, 0.28]) {
          projectile(foe, baseAngle + spread, 330, Math.round(foe.damage * 0.55), "#bce8ff", "slug", false, 5, { life: 0.45 });
        }
      }
      if (len > 320 && foe.rangedSpecialCooldown <= 0) {
        const baseAngle = Math.atan2(dy, dx);
        foe.rangedSpecialCooldown = rand(4.8, 5.6);
        foe.attackTimer = Math.max(foe.attackTimer, 0.4);
        foe.attackAnimTimer = 0.26;
        addScreenShake(0.16);
        audio.attack("warlord");
        for (const spread of [-0.22, -0.11, 0, 0.11, 0.22]) {
          projectile(foe, baseAngle + spread, 430, Math.round(foe.damage * 0.9), "#9bdcff", "slug", false, 5, { life: 2.0 });
        }
      }
      if (foe.attackTimer <= 0) { foe.attackTimer = foe.attackCooldown; foe.burstShots = 3; foe.burstTimer = 0; }
      if (foe.burstShots > 0 && foe.burstTimer <= 0) {
        foe.burstTimer = 0.12;
        foe.burstShots -= 1;
        projectile(foe, Math.atan2(dy, dx) + rand(-0.1, 0.1), 360, foe.damage, "#9bdcff", "slug", false, 5);
        audio.attack("warlord");
      }
      if (foe.specialCooldown <= 0 && world.foes.length < 18) { foe.specialCooldown = 5.6; spawnMinions(foe, 2); }
    }
  } else if (foe.id === "animal") {
    const stopDistance = player.radius + foe.radius + HELLHOUND_PLAYER_STOP_PADDING;
    const strafe = Math.sin(foe.pulse * 1.4);
    if (len > stopDistance) {
      const approachSpeed = Math.min(foe.speed, Math.max(0, (len - stopDistance) / Math.max(dt, 0.016)));
      vx = (nx + tx * 0.14 * strafe) * approachSpeed;
      vy = (ny + ty * 0.14 * strafe) * approachSpeed;
    } else {
      vx = tx * foe.speed * 0.12 * strafe;
      vy = ty * foe.speed * 0.12 * strafe;
    }
  } else if (foe.id === "monster") {
    if (len > 320) {
      vx = nx * foe.speed * 0.92;
      vy = ny * foe.speed * 0.92;
    } else if (len < 190) {
      vx = -nx * foe.speed * 0.48;
      vy = -ny * foe.speed * 0.48;
    }
    vx += tx * foe.speed * 0.1 * Math.sin(foe.pulse * 0.5);
    vy += ty * foe.speed * 0.1 * Math.sin(foe.pulse * 0.5);
    if (foe.attackTimer <= 0 && len > 150 && len < 430) {
      foe.attackTimer = foe.attackCooldown;
      const shotAngle = Math.atan2(dy, dx) + rand(-0.04, 0.04);
      const muzzleX = foe.x + Math.cos(shotAngle) * (foe.radius + 10);
      const muzzleY = foe.y + Math.sin(shotAngle) * (foe.radius + 10);
      spawnEnemyShotEffect("monster", muzzleX, muzzleY, shotAngle);
      projectile(foe, shotAngle, foe.projectileSpeed, foe.damage, "#b9ff6a", "rocket", false, 8, {
        life: 2.2,
        splashRadius: 46,
        explosive: true,
      });
      audio.attack("monster");
    }
  } else {
    if (len > 340) { vx = nx * foe.speed; vy = ny * foe.speed; }
    else if (len < 210) { vx = -nx * foe.speed * 0.82; vy = -ny * foe.speed * 0.82; }
    vx += tx * foe.speed * 0.18 * foe.strafeDir;
    vy += ty * foe.speed * 0.18 * foe.strafeDir;
    if (foe.attackTimer <= 0 && len < 460) {
      foe.attackTimer = foe.attackCooldown;
      const shotAngle = Math.atan2(dy, dx) + rand(-0.05, 0.05);
      const muzzleX = foe.x + Math.cos(shotAngle) * (foe.radius + 12);
      const muzzleY = foe.y + Math.sin(shotAngle) * (foe.radius + 12);
      spawnEnemyShotEffect("criminal", muzzleX, muzzleY, shotAngle);
      projectile(foe, shotAngle, foe.projectileSpeed, foe.damage, "#7fc9ff", "cannon", false, 6, {
        life: 2.6,
      });
      audio.attack("criminal");
    }
  }

  foe.knockbackX *= Math.max(0, 1 - dt * 7.5);
  foe.knockbackY *= Math.max(0, 1 - dt * 7.5);
  const slowMultiplier = foe.slowTimer > 0 ? 0.58 : 1;
  vx *= slowMultiplier;
  vy *= slowMultiplier;
  vx += foe.knockbackX;
  vy += foe.knockbackY;

  const moving = Math.hypot(vx, vy) > 2;
  foe.isMoving = moving;
  foe.animTime += dt * (moving ? 1 : 0.7);

  moveActor(foe, vx, vy, dt);
  if (!foe.boss && foe.id === "animal") {
    keepFoeOutsidePlayer(foe, player.radius + foe.radius + HELLHOUND_PLAYER_STOP_PADDING);
  }

  const afterDx = player.x - foe.x;
  const afterDy = player.y - foe.y;
  const afterLen = Math.hypot(afterDx, afterDy) || 1;
  const contactRange = foe.radius + player.radius + (foe.id === "animal" ? 18 : 6);

  if (afterLen <= contactRange && foe.attackTimer <= 0) {
    foe.attackTimer = foe.attackCooldown;
    foe.attackAnimTimer = 0.22;
    damagePlayer(foe.damage);
    audio.attack(foe.kind || foe.id);
  }
}

function cleanupDeadFoes() {
  const alive = [];
  for (const foe of world.foes) {
    if (foe.hp <= 0) awardKill(foe);
    else alive.push(foe);
  }
  world.foes = alive;
}

function updateFoes(dt) {
  for (const foe of world.foes) {
    if (foe.hp > 0) updateFoe(foe, dt);
  }
  cleanupDeadFoes();
}

export {
  createWave,
  spawnPoint,
  makeFoe,
  beginWave,
  intermission,
  spawnRegular,
  spawnBoss,
  spawnMinions,
  updateWave,
  updateFoe,
  cleanupDeadFoes,
  updateFoes,
};
