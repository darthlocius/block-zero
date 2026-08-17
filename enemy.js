import {
  TAU,
  enemies,
  bosses,
  animationProfiles,
  player,
  world,
  clamp,
  rand,
  pick,
  banner,
  queueSynergyToast,
  queueBossWarning,
  bossDisplayName,
  addScreenShake,
  audio,
  updateActorFacing,
  awardKill,
  damagePlayer,
  spawnEnemyShotEffect,
  spawnImpactFlash,
  pushParticle,
  pushBlastGlow,
  spawnWaveBarrels,
  spawnWaveCoverObjects,
  syncHud,
  expireWaveBonusIfNeeded,
  startWaveClearSequence,
  trackWaveStartedForAchievements,
  trackWaveClearedForAchievements,
} from "./game.js";
import { projectile } from "./bullet.js";
import { t } from "./i18n.js";
import { firstSolidIntersection, moveActor } from "./collision.js";
import { restockGrenadeAtWaveStart } from "./grenade.js";
import { SNIPER_SPAWN, planSnipersForWave } from "./wave-planning.js";

// Enemy spawning, waves, and AI behavior.

const SWARM_DEBUG = false;

const TECHPRIEST_BUFF = {
  hpMul: 1.65,
  damageMul: 1.5,
  rangedCooldownMul: 0.65,
  meleeSpeedMul: 1.14,
  meleeCooldownMul: 0.68,
};

const TECHPRIEST_SPAWN = {
  firstWave: 5,
  earlyChance: 0.3,
  lateChance: 0.5,
  lateChanceWave: 8,
  spawnAtMin: 0.28,
  spawnAtMax: 0.36,
};

const TECHPRIEST_SIGNAL_WAVE = Object.freeze({
  radius: 500,
  innerFullDamageRadius: 180,
  edgeDamageRatio: 0.4,

  baseDamage: 18,
  damagePerWave: 0.8,

  telegraphDuration: 0.85,

  firstCooldownMin: 2.2,
  firstCooldownMax: 2.8,

  repeatCooldownMin: 4.0,
  repeatCooldownMax: 5.2,

  chargeMoveMultiplier: 0.55,
});

const SNIPER_POSITIONING = Object.freeze({
  preferredMin: 520,
  preferredMax: 720,
  hardRetreatDistance: 300,
  acquisitionMin: 280,
  acquisitionMax: 820,
  trackingMoveMultiplier: 0.22,
});

const SNIPER_ATTACK = Object.freeze({
  totalAimDuration: 1.35,
  finalLockDuration: 0.32,
  trackingDuration: 1.03,
  beamDuration: 0.12,
  beamRange: 980,
  postShotCooldownMin: 3.8,
  postShotCooldownMax: 5.0,
  baseCooldown: 4.4,
  repositionMin: 0.9,
  repositionMax: 1.35,
  lostSightDelayMin: 0.8,
  lostSightDelayMax: 1.1,
  beamColor: "#ff2400",
});

function techpriestChanceForWave(wave) {
  if (wave < TECHPRIEST_SPAWN.firstWave) return 0;
  if (wave < TECHPRIEST_SPAWN.lateChanceWave) return TECHPRIEST_SPAWN.earlyChance;
  return TECHPRIEST_SPAWN.lateChance;
}

function isTechpriestEligibleWave(wave, bossWave) {
  return wave >= TECHPRIEST_SPAWN.firstWave && !bossWave;
}

function shouldPlanTechpriest(wave, bossWave) {
  if (!isTechpriestEligibleWave(wave, bossWave)) return false;

  if (world.activeCheats?.forceTechpriest) {
    world.activeCheats.forceTechpriest = false;
    world.techpriestEligibleMisses = 0;
    return true;
  }

  if ((world.techpriestEligibleMisses || 0) >= 3) {
    world.techpriestEligibleMisses = 0;
    return true;
  }

  const chance = techpriestChanceForWave(wave);
  const planned = chance > 0 && Math.random() < chance;

  if (planned) {
    world.techpriestEligibleMisses = 0;
  } else {
    world.techpriestEligibleMisses = (world.techpriestEligibleMisses || 0) + 1;
  }

  return planned;
}

function createWave(wave) {
  const bossWave = wave % 4 === 0;
  const total = 6 + wave * 2 + Math.floor(wave / 2);
  const regularTotal = bossWave ? total - 2 : total;
  let swarmPackTarget = swarmPackTargetForWave(wave);
  if (world.activeCheats?.swarmHell) {
    swarmPackTarget = Math.ceil(swarmPackTarget * 1.75 + 1);
  }
  const techpriestPlanned = shouldPlanTechpriest(wave, bossWave);
  const techpriestSpawnAt = techpriestPlanned
    ? Math.max(1, Math.floor(regularTotal * rand(TECHPRIEST_SPAWN.spawnAtMin, TECHPRIEST_SPAWN.spawnAtMax)))
    : Infinity;
  const sniperPlan = planSnipersForWave(
    wave,
    bossWave,
    regularTotal,
    techpriestPlanned,
  );

  const waveState = {
    wave,
    bossWave,
    regularTotal,
    regularSpawned: 0,
    bossSpawned: false,
    spawnTimer: 0.8,
    spawnInterval: Math.max(0.36, 1.05 - wave * 0.05),
    bossTemplate: bossWave ? bosses[Math.floor((wave / 4 - 1) % bosses.length)] : null,
    swarmPackTarget,
    swarmPacksSpawned: 0,
    swarmSidesUsed: [],
    swarmWarningShown: false,
    swarmNextSpawnAt: Infinity,
    techpriestPlanned,
    techpriestSpawned: false,
    techpriestSpawnAt,
    techpriestBuffActive: false,
    ...sniperPlan,
  };

  scheduleNextSwarmPack(waveState);

  return waveState;
}

function spawnPoint() {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: -30, y: rand(0, world.height) };
  if (side === 1) return { x: world.width + 30, y: rand(0, world.height) };
  if (side === 2) return { x: rand(0, world.width), y: -30 };
  return { x: rand(0, world.width), y: world.height + 30 };
}

function spawnPointForSide(side) {
  if (side === 0) return { x: -34, y: rand(80, world.height - 80) };
  if (side === 1) return { x: world.width + 34, y: rand(80, world.height - 80) };
  if (side === 2) return { x: rand(80, world.width - 80), y: -34 };
  return { x: rand(80, world.width - 80), y: world.height + 34 };
}

function waveScaling(wave) {
  const waveIndex = Math.max(0, wave - 1);
  return {
    waveIndex,
    hpScale: 1 + waveIndex * 0.055,
    damageScale: 1 + waveIndex * 0.035,
  };
}

function activeSwarmPackCount() {
  return new Set(
    world.foes
      .filter((foe) => foe.hp > 0 && foe.id === "swarm" && foe.packId)
      .map((foe) => foe.packId)
  ).size;
}

function maxSwarmPacksForWave(wave) {
  let maxPacks = 10;
  if (wave < 2) maxPacks = 0;
  else if (wave <= 4) maxPacks = 2;
  else if (wave <= 7) maxPacks = 4;
  else if (wave <= 10) maxPacks = 6;
  else if (wave <= 13) maxPacks = 8;

  return world.activeCheats?.swarmHell
    ? Math.ceil(maxPacks * 1.75 + 1)
    : maxPacks;
}

function swarmPackTargetForWave(wave) {
  if (wave < 2) return 0;
  if (wave <= 4) return 2;
  if (wave <= 7) return 4;
  if (wave <= 10) return 6;
  if (wave <= 13) return 8;
  return 10;
}

function scheduleNextSwarmPack(currentWave) {
  if (!currentWave) return;

  const packsLeft = Math.max(0, (currentWave.swarmPackTarget || 0) - (currentWave.swarmPacksSpawned || 0));
  const remainingSlots = Math.max(0, currentWave.regularTotal - currentWave.regularSpawned);

  if (packsLeft <= 0 || remainingSlots <= 0) {
    currentWave.swarmNextSpawnAt = Infinity;
    return;
  }

  const safeWindow = Math.max(1, Math.floor(remainingSlots / Math.max(1, packsLeft + 1)));
  const delay = Math.floor(rand(0, safeWindow + 1));

  currentWave.swarmNextSpawnAt = Math.min(
    currentWave.regularTotal - 1,
    currentWave.regularSpawned + delay,
  );
}

function chooseSwarmSide(currentWave) {
  const used = currentWave.swarmSidesUsed || [];
  const all = [0, 1, 2, 3];
  const available = all.filter((side) => !used.includes(side));
  return pick(available.length ? available : all);
}

function shouldSpawnSwarmPack() {
  const currentWave = world.currentWave;
  if (!currentWave) return false;

  const maxPacks = maxSwarmPacksForWave(world.wave);
  if (maxPacks <= 0) return false;

  const remainingSlots = currentWave.regularTotal - currentWave.regularSpawned;
  if (remainingSlots <= 0) return false;

  currentWave.swarmPackTarget = currentWave.swarmPackTarget ?? swarmPackTargetForWave(world.wave);
  currentWave.swarmPacksSpawned = currentWave.swarmPacksSpawned || 0;
  currentWave.swarmSidesUsed = currentWave.swarmSidesUsed || [];

  if (currentWave.swarmPacksSpawned >= currentWave.swarmPackTarget) return false;
  if (currentWave.swarmPacksSpawned >= maxPacks) return false;
  if (activeSwarmPackCount() >= maxPacks) return false;

  if (typeof currentWave.swarmNextSpawnAt !== "number") {
    scheduleNextSwarmPack(currentWave);
  }

  return currentWave.regularSpawned >= currentWave.swarmNextSpawnAt;
}

function canBeTechpriestBuffed(foe) {
  return Boolean(
    foe
    && foe.hp > 0
    && !foe.boss
    && foe.id !== "techpriest"
  );
}

function applyTechpriestBuff(foe) {
  if (!canBeTechpriestBuffed(foe)) return;
  if (foe.techpriestEmpowered) return;

  foe.techpriestEmpowered = true;
  foe.techpriestBaseMaxHp = foe.maxHp;
  foe.techpriestBaseDamage = foe.damage;
  foe.techpriestBaseAttackCooldown = foe.attackCooldown;
  foe.techpriestBaseSpeed = foe.speed;

  const oldMaxHp = Math.max(1, foe.maxHp);
  const hpRatio = Math.max(0, Math.min(1, foe.hp / oldMaxHp));

  foe.maxHp = Math.round(foe.techpriestBaseMaxHp * TECHPRIEST_BUFF.hpMul);
  foe.hp = Math.max(1, Math.round(foe.maxHp * hpRatio));
  foe.damage = Math.max(1, Math.round(foe.techpriestBaseDamage * TECHPRIEST_BUFF.damageMul));

  if (foe.ranged) {
    foe.attackCooldown = Math.max(0.18, foe.techpriestBaseAttackCooldown * TECHPRIEST_BUFF.rangedCooldownMul);
    foe.attackTimer = Math.min(foe.attackTimer, foe.attackCooldown);
  }

  const isMelee = !foe.ranged;

  if (isMelee) {
    foe.speed = foe.techpriestBaseSpeed * TECHPRIEST_BUFF.meleeSpeedMul;
    foe.attackCooldown = Math.max(
      0.16,
      foe.techpriestBaseAttackCooldown * TECHPRIEST_BUFF.meleeCooldownMul,
    );
    foe.attackTimer = Math.min(foe.attackTimer, foe.attackCooldown);
  }

  foe.empowerFlashTimer = rand(0.12, 0.36);
  foe.empowerArcTimer = Math.random() < 0.28 ? 0.18 : 0;
  foe.empowerArcCooldown = rand(0.9, 2.6);
  foe.empowerArcSeed = Math.random() * TAU;
}

function applyTechpriestBuffToWave() {
  for (const foe of world.foes) {
    applyTechpriestBuff(foe);
  }
}

function removeTechpriestBuffFromFoe(foe) {
  if (!foe || !foe.techpriestEmpowered) return;

  foe.maxHp = foe.techpriestBaseMaxHp || foe.maxHp;
  foe.damage = foe.techpriestBaseDamage || foe.damage;
  foe.attackCooldown = foe.techpriestBaseAttackCooldown || foe.attackCooldown;
  foe.speed = foe.techpriestBaseSpeed || foe.speed;

  if (foe.hp > foe.maxHp) foe.hp = foe.maxHp;

  foe.techpriestEmpowered = false;
  foe.empowerFlashTimer = 0.55;
  foe.empowerArcTimer = 0;
  foe.empowerArcCooldown = 0;

  delete foe.techpriestBaseMaxHp;
  delete foe.techpriestBaseDamage;
  delete foe.techpriestBaseAttackCooldown;
  delete foe.techpriestBaseSpeed;
}

function removeTechpriestBuffFromWave(showBanner = true) {
  const currentWave = world.currentWave;
  const wasActive = currentWave
    ? currentWave.techpriestBuffActive
    : world.foes.some((foe) => foe.techpriestEmpowered);

  if (!wasActive) return;
  if (currentWave) currentWave.techpriestBuffActive = false;

  for (const foe of world.foes) {
    removeTechpriestBuffFromFoe(foe);
  }

  if (showBanner) {
    banner(
      t("banner.techpriestRemoved.title"),
      t("banner.techpriestRemoved.subtitle"),
      2.1,
      "#8ef3ff",
    );
    addScreenShake(0.16);
  }
}

function addFoeToWorld(foe) {
  if (world.currentWave?.techpriestBuffActive) {
    applyTechpriestBuff(foe);
  }
  world.foes.push(foe);
}

function spawnSwarmPack() {
  const currentWave = world.currentWave;
  if (!currentWave) return false;

  const remainingSlots = currentWave.regularTotal - currentWave.regularSpawned;
  if (remainingSlots <= 0) return false;

  const base = enemies.swarm;
  if (!base) return false;

  const side = chooseSwarmSide(currentWave);
  const origin = spawnPointForSide(side);
  const count = Math.floor(rand(8, 13));

  if (count < 8 || count > 12) return false;

  const packId = `swarm-${world.wave}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (SWARM_DEBUG) {
    console.debug("[swarm] spawn pack", {
      wave: world.wave,
      packId,
      count,
      side,
      regularSpawned: currentWave.regularSpawned,
      regularTotal: currentWave.regularTotal,
      target: currentWave.swarmPackTarget,
    });
  }

  const { waveIndex } = waveScaling(world.wave);
  const hpScale = 1 + waveIndex * 0.035;
  const speed = Math.min(base.speed + waveIndex * 2.4, 265);
  const damage = Math.max(3, Math.round(base.damage * (1 + waveIndex * 0.02)));

  const spacing = (base.spacingRadius || 17) * 2 + 3;
  const columns = 4;

  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / columns);
    const col = i % columns;

    const centeredCol = col - (Math.min(columns, count) - 1) / 2;
    const jitterX = rand(-5, 5);
    const jitterY = rand(-5, 5);

    let x = origin.x;
    let y = origin.y;

    if (side === 0 || side === 1) {
      x += (side === 0 ? -1 : 1) * row * 12 + jitterX;
      y += centeredCol * spacing + jitterY;
    } else {
      x += centeredCol * spacing + jitterX;
      y += (side === 2 ? -1 : 1) * row * 12 + jitterY;
    }

    const foe = makeFoe(base, x, y, {
      kind: "swarm",
      hp: Math.round(base.hp * hpScale),
      damage,
      speed,
      radius: base.radius,
      spacingRadius: base.spacingRadius,
      reward: base.reward,
      attackCooldown: base.attackCooldown,
      packId,
      packSide: side,
      swarmSeed: Math.random() * TAU,
      comboGain: base.comboGain,
      pickupChanceMul: base.pickupChanceMul,
    });
    addFoeToWorld(foe);
  }

  currentWave.regularSpawned += 1;
  currentWave.swarmPacksSpawned = (currentWave.swarmPacksSpawned || 0) + 1;
  currentWave.swarmSidesUsed = [...(currentWave.swarmSidesUsed || []), side];
  scheduleNextSwarmPack(currentWave);

  currentWave.swarmWarningShown = true;

  return true;
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
    packId: extra.packId || null,
    packSide: extra.packSide ?? null,
    swarmSeed: extra.swarmSeed ?? Math.random() * TAU,
    spacingRadius: extra.spacingRadius ?? template.spacingRadius ?? template.radius,
    comboGain: extra.comboGain ?? template.comboGain,
    pickupChanceMul: extra.pickupChanceMul ?? template.pickupChanceMul,
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
  restockGrenadeAtWaveStart();
  world.currentWave = createWave(world.wave);
  trackWaveStartedForAchievements();
  world.state = "playing";
  spawnWaveBarrels(Math.min(4, 2 + Math.floor(world.wave / 3)));
  spawnWaveCoverObjects();
  const bossWave = world.currentWave.bossWave;
  if (bossWave) {
    queueBossWarning(bossDisplayName(world.currentWave.bossTemplate));
  } else {
    banner(
      t("banner.wave.title", { wave: world.wave }),
      t("banner.wave.subtitle"),
      2.7,
      "#ff9d43",
    );
  }
  if (Array.isArray(world.pendingSynergyAnnouncements) && world.pendingSynergyAnnouncements.length) {
    const pendingSynergies = [...world.pendingSynergyAnnouncements];
    world.pendingSynergyAnnouncements = [];
    for (const synergyId of pendingSynergies) {
      queueSynergyToast(synergyId);
    }
  }
  audio.wave(bossWave);
  addScreenShake(bossWave ? 0.35 : 0.14);
  syncHud();
}

function intermission() {
  expireWaveBonusIfNeeded();
  trackWaveClearedForAchievements(world.wave);
  startWaveClearSequence();
}

function activeSniperCount() {
  return world.foes.filter((foe) => foe.id === "sniper" && foe.hp > 0).length;
}

function shouldSpawnPlannedSniper() {
  const currentWave = world.currentWave;
  if (!currentWave || currentWave.bossWave) return false;
  if ((currentWave.snipersSpawned || 0) >= (currentWave.sniperPlannedCount || 0)) return false;
  if (activeSniperCount() >= (currentWave.maxActiveSnipers || 0)) return false;

  const nextIndex = currentWave.sniperSpawnIndices?.[currentWave.snipersSpawned || 0];
  return Number.isFinite(nextIndex) && currentWave.regularSpawned >= nextIndex;
}

function sniperSpawnPoint() {
  const livingSnipers = world.foes.filter((foe) => foe.id === "sniper" && foe.hp > 0);
  const priorSpawnPoints = world.currentWave?.sniperSpawnPoints || [];
  let candidate = spawnPoint();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const clearOfLiving = livingSnipers.every(
      (foe) => Math.hypot(foe.x - candidate.x, foe.y - candidate.y) >= 180,
    );
    const clearOfPriorSpawns = priorSpawnPoints.every(
      (point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) >= 180,
    );
    if (clearOfLiving && clearOfPriorSpawns) {
      break;
    }
    candidate = spawnPoint();
  }

  return candidate;
}

function spawnSniper() {
  const currentWave = world.currentWave;
  if (!currentWave || !shouldSpawnPlannedSniper()) return false;

  const base = enemies.sniper;
  if (!base) return false;

  const pos = sniperSpawnPoint();
  const { hpScale, damageScale } = waveScaling(world.wave);
  const foe = makeFoe(base, pos.x, pos.y, {
    kind: "sniper",
    hp: Math.round(base.hp * hpScale),
    damage: Math.round(base.damage * damageScale),
    speed: base.speed,
    radius: base.radius,
    reward: base.reward,
    attackCooldown: base.attackCooldown,
    comboGain: base.comboGain,
    pickupChanceMul: base.pickupChanceMul,
  });

  foe.sniperPhase = "idle";
  foe.sniperAimTimer = 0;
  foe.sniperLockedAngle = null;
  foe.sniperAimX = player.x;
  foe.sniperAimY = player.y;
  foe.sniperRepositionTimer = 0;
  foe.sniperRepositionDir = foe.strafeDir;

  addFoeToWorld(foe);
  currentWave.sniperSpawnPoints = [
    ...(currentWave.sniperSpawnPoints || []),
    { x: pos.x, y: pos.y },
  ];
  currentWave.snipersSpawned = (currentWave.snipersSpawned || 0) + 1;
  currentWave.regularSpawned += 1;

  if (!world.sniperBannerShown) {
    world.sniperBannerShown = true;
    banner(
      t("banner.sniperDetected.title"),
      t("banner.sniperDetected.subtitle"),
      2.6,
      SNIPER_ATTACK.beamColor,
    );
  }

  return true;
}

function spawnRegular() {
  if (shouldSpawnPlannedSniper() && spawnSniper()) return;
  if (shouldSpawnSwarmPack() && spawnSwarmPack()) return;

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
  const foe = makeFoe(base, pos.x, pos.y, {
    hp: Math.round(base.hp * (hpScale + tankHpBonus)),
    damage: Math.round(base.damage * damageScale),
    speed: base.speed + waveIndex * (base.id === "animal" ? 2.2 : 1.2),
    attackCooldown: base.attackCooldown * earlyRangedFactor,
  });
  addFoeToWorld(foe);
  world.currentWave.regularSpawned += 1;
}

function spawnTechpriest() {
  const currentWave = world.currentWave;
  if (!currentWave || !currentWave.techpriestPlanned || currentWave.techpriestSpawned) return false;

  const base = enemies.techpriest;
  if (!base) return false;

  const pos = spawnPoint();
  const { waveIndex, hpScale, damageScale } = waveScaling(world.wave);
  const hp = Math.round(base.hp * hpScale);

  const foe = makeFoe(base, pos.x, pos.y, {
    kind: "techpriest",
    hp,
    radius: base.radius,
    speed: base.speed + waveIndex * 0.7,
    damage: Math.round(base.damage * damageScale),
    reward: base.reward + world.wave * 3,
    attackCooldown: base.attackCooldown,
    projectileSpeed: base.projectileSpeed,
  });

  foe.shieldHp = Math.round(hp * base.shieldRatio);
  foe.maxShieldHp = foe.shieldHp;
  foe.armorReduction = base.armorReduction;
  foe.techpriestWaveTimer = rand(
    TECHPRIEST_SIGNAL_WAVE.firstCooldownMin,
    TECHPRIEST_SIGNAL_WAVE.firstCooldownMax,
  );
  foe.techpriestWaveCharging = false;
  foe.techpriestWaveChargeTimer = 0;
  foe.techpriestWaveChargeDuration = TECHPRIEST_SIGNAL_WAVE.telegraphDuration;
  foe.techpriestWaveChargeSeed = Math.random() * TAU;
  foe.techpriestBurstShots = 0;
  foe.techpriestBurstTimer = 0;
  foe.techpriestCaster = true;

  world.foes.push(foe);

  currentWave.techpriestSpawned = true;
  currentWave.techpriestBuffActive = true;
  world.techpriestSpawnedThisRun = (world.techpriestSpawnedThisRun || 0) + 1;

  applyTechpriestBuffToWave();

  banner(
    t("banner.techpriestDetected.title"),
    t("banner.techpriestDetected.subtitle"),
    2.6,
    "#7cff4f",
  );

  addScreenShake(0.22);
  audio.attack("monster");

  return true;
}

function maybeSpawnTechpriest() {
  const currentWave = world.currentWave;
  if (!currentWave) return;
  if (!currentWave.techpriestPlanned || currentWave.techpriestSpawned) return;
  if (currentWave.bossWave) return;
  if (currentWave.regularSpawned < currentWave.techpriestSpawnAt) return;

  spawnTechpriest();
}

function forceSpawnTechpriestNow() {
  const currentWave = world.currentWave;
  if (!currentWave) return false;
  if (currentWave.bossWave) return false;
  if (currentWave.techpriestSpawned) return false;
  if (world.foes.some((foe) => foe.id === "techpriest" && foe.hp > 0)) return false;

  currentWave.techpriestPlanned = true;
  currentWave.techpriestSpawned = false;
  currentWave.techpriestSpawnAt = 0;

  return spawnTechpriest();
}

function spawnBoss() {
  if (!world.currentWave || !world.currentWave.bossWave || world.currentWave.bossSpawned) return;
  const base = world.currentWave.bossTemplate;
  const pos = spawnPoint();
  const { waveIndex, damageScale: bossDamageScale } = waveScaling(world.wave);
  const foe = makeFoe(base, pos.x, pos.y, {
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
  });
  addFoeToWorld(foe);
  world.currentWave.bossSpawned = true;
  addScreenShake(0.22);
}

function spawnMinions(foe, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = TAU / count * i + Math.random() * 0.4;
    const range = foe.radius + 18;
    const base = enemies[foe.kind] || enemies.animal;
    const minion = makeFoe(base, foe.x + Math.cos(angle) * range, foe.y + Math.sin(angle) * range, {
      hp: Math.round(base.hp * 0.85),
      speed: base.speed + 18,
      reward: Math.round(base.reward * 0.75),
    });
    addFoeToWorld(minion);
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

function separateSwarmFoes() {
  const swarm = world.foes.filter((foe) => foe.hp > 0 && foe.id === "swarm");
  if (swarm.length < 2) return;

  for (let iteration = 0; iteration < 2; iteration += 1) {
    for (let i = 0; i < swarm.length; i += 1) {
      for (let j = i + 1; j < swarm.length; j += 1) {
        const a = swarm[i];
        const b = swarm[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1;

        const minDist = (a.spacingRadius || a.radius) + (b.spacingRadius || b.radius) + 2;
        if (distance >= minDist) continue;

        const push = (minDist - distance) * 0.5;
        const nx = dx / distance;
        const ny = dy / distance;

        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;

        a.x = clamp(a.x, a.radius + 6, world.width - a.radius - 6);
        a.y = clamp(a.y, a.radius + 6, world.height - a.radius - 6);
        b.x = clamp(b.x, b.radius + 6, world.width - b.radius - 6);
        b.y = clamp(b.y, b.radius + 6, world.height - b.radius - 6);
      }
    }
  }
}

function updateWave(dt) {
  if (!world.currentWave) return;
  world.currentWave.spawnTimer -= dt;
  if (world.currentWave.spawnTimer <= 0 && world.currentWave.regularSpawned < world.currentWave.regularTotal) {
    world.currentWave.spawnTimer = world.currentWave.spawnInterval;
    spawnRegular();
  }
  maybeSpawnTechpriest();
  if (world.currentWave.bossWave && !world.currentWave.bossSpawned && (world.currentWave.regularSpawned >= Math.ceil(world.currentWave.regularTotal * 0.55) || world.currentWave.regularSpawned >= world.currentWave.regularTotal)) spawnBoss();
  const done = world.currentWave.regularSpawned >= world.currentWave.regularTotal && (!world.currentWave.bossWave || world.currentWave.bossSpawned) && world.foes.length === 0;
  if (done) intermission();
}

function startTechpriestSignalCharge(foe) {
  if (!foe || foe.hp <= 0) return;
  if (foe.techpriestWaveCharging) return;

  foe.techpriestWaveCharging = true;
  foe.techpriestWaveChargeTimer = TECHPRIEST_SIGNAL_WAVE.telegraphDuration;
  foe.techpriestWaveChargeDuration = TECHPRIEST_SIGNAL_WAVE.telegraphDuration;
  foe.techpriestWaveChargeSeed = Math.random() * TAU;

  foe.techpriestBurstShots = 0;
  foe.techpriestBurstTimer = 0;

  audio.techpriestWaveCharge();

  pushBlastGlow(
    foe.x,
    foe.y,
    120,
    "rgba(116, 255, 77, 0.18)",
    0.32,
  );
}

function triggerTechpriestSignalWave(foe) {
  pushParticle({
    x: foe.x,
    y: foe.y,
    vx: 0,
    vy: 0,
    life: 0.86,
    size: 32,
    sizeEnd: TECHPRIEST_SIGNAL_WAVE.radius,
    color: "rgba(116, 255, 77, 0.58)",
    type: "shockwave",
    lineWidth: 9,
  });

  pushParticle({
    x: foe.x,
    y: foe.y,
    vx: 0,
    vy: 0,
    life: 0.68,
    size: 20,
    sizeEnd: 350,
    color: "rgba(142, 243, 255, 0.42)",
    type: "shockwave",
    lineWidth: 5,
  });

  pushBlastGlow(foe.x, foe.y, 280, "rgba(116, 255, 77, 0.34)", 0.48);
  audio.techpriestWaveImpact();

  const bolts = 9;
  for (let i = 0; i < bolts; i += 1) {
    const angle = TAU / bolts * i + rand(-0.24, 0.24);
    const startRadius = rand(45, 95);
    const x = foe.x + Math.cos(angle) * startRadius;
    const y = foe.y + Math.sin(angle) * startRadius;

    pushParticle({
      x,
      y,
      vx: Math.cos(angle) * rand(105, 185),
      vy: Math.sin(angle) * rand(105, 185),
      life: rand(0.22, 0.36),
      size: rand(28, 46),
      sizeEnd: rand(8, 14),
      color: Math.random() < 0.65 ? "#9cff2f" : "#8ef3ff",
      type: "spark",
      alpha: 0.9,
      drag: 0.9,
    });
  }

  const dx = player.x - foe.x;
  const dy = player.y - foe.y;
  const distanceToPlayer = Math.hypot(dx, dy);

  if (distanceToPlayer <= TECHPRIEST_SIGNAL_WAVE.radius) {
    const fullDamage = Math.round(
      TECHPRIEST_SIGNAL_WAVE.baseDamage
      + world.wave * TECHPRIEST_SIGNAL_WAVE.damagePerWave,
    );
    let damageFactor = 1;

    if (distanceToPlayer > TECHPRIEST_SIGNAL_WAVE.innerFullDamageRadius) {
      const falloffRange = (
        TECHPRIEST_SIGNAL_WAVE.radius
        - TECHPRIEST_SIGNAL_WAVE.innerFullDamageRadius
      );
      const falloffProgress = clamp(
        (
          distanceToPlayer
          - TECHPRIEST_SIGNAL_WAVE.innerFullDamageRadius
        ) / falloffRange,
        0,
        1,
      );

      damageFactor = (
        1
        - (1 - TECHPRIEST_SIGNAL_WAVE.edgeDamageRatio) * falloffProgress
      );
    }

    const waveDamage = Math.max(
      1,
      Math.round(fullDamage * damageFactor),
    );

    damagePlayer(waveDamage, {
      source: "techpriest_wave",
    });

    addScreenShake(0.2);
  }
}

function updateTechpriest(foe, dt, len, nx, ny, tx, ty, dx, dy) {
  foe.techpriestBurstTimer = Math.max(0, (foe.techpriestBurstTimer || 0) - dt);

  if (foe.techpriestWaveCharging) {
    foe.techpriestWaveChargeTimer = Math.max(
      0,
      (foe.techpriestWaveChargeTimer || 0) - dt,
    );

    if (foe.techpriestWaveChargeTimer <= 0) {
      foe.techpriestWaveCharging = false;
      triggerTechpriestSignalWave(foe);
      foe.techpriestWaveTimer = rand(
        TECHPRIEST_SIGNAL_WAVE.repeatCooldownMin,
        TECHPRIEST_SIGNAL_WAVE.repeatCooldownMax,
      );
    }
  } else {
    foe.techpriestWaveTimer = Math.max(
      0,
      (foe.techpriestWaveTimer || 0) - dt,
    );

    if (foe.techpriestWaveTimer <= 0) {
      startTechpriestSignalCharge(foe);
    }
  }

  const desiredMin = 320;
  const desiredMax = 520;
  const panicDistance = 235;

  let vx = 0;
  let vy = 0;

  if (len < panicDistance) {
    vx = -nx * foe.speed * 1.05;
    vy = -ny * foe.speed * 1.05;
  } else if (len < desiredMin) {
    vx = -nx * foe.speed * 0.52;
    vy = -ny * foe.speed * 0.52;
  } else if (len > desiredMax) {
    vx = nx * foe.speed * 0.72;
    vy = ny * foe.speed * 0.72;
  }

  const strafe = Math.sin(foe.pulse * 0.85) * foe.speed * 0.42;
  vx += tx * strafe;
  vy += ty * strafe;

  const edgePadding = 190;
  const edgeForce = foe.speed * 1.15;

  if (foe.x < edgePadding) vx += edgeForce * (1 - foe.x / edgePadding);
  else if (foe.x > world.width - edgePadding) vx -= edgeForce * (1 - (world.width - foe.x) / edgePadding);

  if (foe.y < edgePadding) vy += edgeForce * (1 - foe.y / edgePadding);
  else if (foe.y > world.height - edgePadding) vy -= edgeForce * (1 - (world.height - foe.y) / edgePadding);

  if (
    !foe.techpriestWaveCharging
    && len < 720
    && foe.attackTimer <= 0
  ) {
    foe.attackTimer = foe.attackCooldown;
    foe.techpriestBurstShots = 5;
    foe.techpriestBurstTimer = 0;
  }

  if (
    !foe.techpriestWaveCharging
    && foe.techpriestBurstShots > 0
    && foe.techpriestBurstTimer <= 0
  ) {
    foe.techpriestBurstShots -= 1;
    foe.techpriestBurstTimer = 0.065;

    const shotAngle = Math.atan2(dy, dx) + rand(-0.055, 0.055);
    const muzzleX = foe.x + Math.cos(shotAngle) * (foe.radius + 14);
    const muzzleY = foe.y + Math.sin(shotAngle) * (foe.radius + 14);

    spawnEnemyShotEffect("monster", muzzleX, muzzleY, shotAngle);
    projectile(foe, shotAngle, foe.projectileSpeed || 460, foe.damage, "#8ef3ff", "slug", false, 4, {
      life: 1.6,
    });

    audio.attack("criminal");
  }

  foe.knockbackX *= Math.max(0, 1 - dt * 7.5);
  foe.knockbackY *= Math.max(0, 1 - dt * 7.5);

  const slowMultiplier = foe.slowTimer > 0 ? 0.58 : 1;
  const chargeMoveMultiplier = foe.techpriestWaveCharging
    ? TECHPRIEST_SIGNAL_WAVE.chargeMoveMultiplier
    : 1;
  vx = vx * slowMultiplier * chargeMoveMultiplier + foe.knockbackX;
  vy = vy * slowMultiplier * chargeMoveMultiplier + foe.knockbackY;

  foe.isMoving = Math.hypot(vx, vy) > 2;
  foe.animTime += dt * (foe.isMoving ? 1 : 0.7);

  moveActor(foe, vx, vy, dt);
}

function sniperMuzzlePoint(foe, angle) {
  const offset = foe.radius + 10;
  return {
    x: foe.x + Math.cos(angle) * offset,
    y: foe.y + Math.sin(angle) * offset,
  };
}

function segmentCircleIntersection(x1, y1, x2, y2, circle) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - circle.x;
  const fy = y1 - circle.y;
  const a = dx * dx + dy * dy;
  if (a <= 1e-8) return null;

  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circle.radius * circle.radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const candidates = [
    (-b - root) / (2 * a),
    (-b + root) / (2 * a),
  ].filter((t) => t >= 0 && t <= 1);

  if (!candidates.length) return null;
  const t = Math.min(...candidates);
  return {
    x: x1 + dx * t,
    y: y1 + dy * t,
    t,
  };
}

function sniperRay(foe, angle, range = SNIPER_ATTACK.beamRange) {
  const muzzle = sniperMuzzlePoint(foe, angle);
  const farX = muzzle.x + Math.cos(angle) * range;
  const farY = muzzle.y + Math.sin(angle) * range;
  const solidHit = firstSolidIntersection(muzzle.x, muzzle.y, farX, farY);

  return {
    muzzle,
    farX,
    farY,
    solidHit,
    endX: solidHit?.x ?? farX,
    endY: solidHit?.y ?? farY,
  };
}

function sniperHasLineOfSight(foe) {
  const angle = Math.atan2(player.y - foe.y, player.x - foe.x);
  const muzzle = sniperMuzzlePoint(foe, angle);
  return !firstSolidIntersection(muzzle.x, muzzle.y, player.x, player.y);
}

function cancelSniperAim(foe) {
  foe.sniperPhase = "idle";
  foe.sniperAimTimer = 0;
  foe.sniperLockedAngle = null;
  foe.attackTimer = rand(
    SNIPER_ATTACK.lostSightDelayMin,
    SNIPER_ATTACK.lostSightDelayMax,
  );
  foe.sniperRepositionTimer = rand(
    SNIPER_ATTACK.repositionMin,
    SNIPER_ATTACK.repositionMax,
  );
  foe.strafeDir *= -1;
  foe.sniperRepositionDir = foe.strafeDir;
}

function beginSniperAim(foe) {
  foe.sniperPhase = "tracking";
  foe.sniperAimTimer = SNIPER_ATTACK.totalAimDuration;
  foe.sniperLockedAngle = null;
  foe.sniperAimX = player.x;
  foe.sniperAimY = player.y;
  foe.sniperAimAngle = Math.atan2(player.y - foe.y, player.x - foe.x);
  audio.sniperAimStart();
}

function lockSniperAim(foe) {
  foe.sniperPhase = "lock";
  foe.sniperAimTimer = SNIPER_ATTACK.finalLockDuration;
  foe.sniperLockedAngle = Math.atan2(player.y - foe.y, player.x - foe.x);
  foe.sniperAimAngle = foe.sniperLockedAngle;
  const ray = sniperRay(foe, foe.sniperLockedAngle);
  foe.sniperAimX = ray.endX;
  foe.sniperAimY = ray.endY;
  audio.sniperLock();
}

function fireSniperBeam(foe) {
  if (!foe || foe.hp <= 0 || !Number.isFinite(foe.sniperLockedAngle)) return;

  const ray = sniperRay(foe, foe.sniperLockedAngle);
  const playerHit = segmentCircleIntersection(
    ray.muzzle.x,
    ray.muzzle.y,
    ray.farX,
    ray.farY,
    player,
  );
  const playerIsFirstHit = Boolean(
    playerHit
    && (!ray.solidHit || playerHit.t < ray.solidHit.t - 1e-6),
  );

  world.sniperBeams.push({
    x1: ray.muzzle.x,
    y1: ray.muzzle.y,
    x2: ray.endX,
    y2: ray.endY,
    life: SNIPER_ATTACK.beamDuration,
    total: SNIPER_ATTACK.beamDuration,
    color: SNIPER_ATTACK.beamColor,
  });

  if (playerIsFirstHit) {
    damagePlayer(foe.damage, { source: "sniper_beam" });
  }

  spawnImpactFlash(
    ray.muzzle.x,
    ray.muzzle.y,
    SNIPER_ATTACK.beamColor,
    0.95,
    "enemy",
  );
  spawnImpactFlash(
    ray.endX,
    ray.endY,
    SNIPER_ATTACK.beamColor,
    ray.solidHit ? 1.22 : 0.92,
    "enemy",
  );
  pushBlastGlow(
    ray.muzzle.x,
    ray.muzzle.y,
    50,
    "rgba(255, 36, 0, 0.38)",
    SNIPER_ATTACK.beamDuration,
  );
  pushBlastGlow(
    ray.endX,
    ray.endY,
    ray.solidHit ? 60 : 44,
    "rgba(255, 73, 61, 0.34)",
    SNIPER_ATTACK.beamDuration,
  );

  audio.sniperFire();
  addScreenShake(0.19);

  const cooldownScale = Math.max(
    0.2,
    (foe.attackCooldown || SNIPER_ATTACK.baseCooldown) / SNIPER_ATTACK.baseCooldown,
  );
  foe.attackTimer = rand(
    SNIPER_ATTACK.postShotCooldownMin,
    SNIPER_ATTACK.postShotCooldownMax,
  ) * cooldownScale;
  foe.sniperPhase = "idle";
  foe.sniperAimTimer = 0;
  foe.sniperLockedAngle = null;
  foe.sniperAimX = ray.endX;
  foe.sniperAimY = ray.endY;
  foe.sniperRepositionTimer = rand(
    SNIPER_ATTACK.repositionMin,
    SNIPER_ATTACK.repositionMax,
  );
  foe.strafeDir *= -1;
  foe.sniperRepositionDir = foe.strafeDir;
  foe.attackAnimTimer = 0.2;
}

function updateSniper(foe, dt, len, nx, ny, tx, ty) {
  foe.sniperRepositionTimer = Math.max(0, (foe.sniperRepositionTimer || 0) - dt);

  if (foe.sniperPhase === "tracking") {
    if (!sniperHasLineOfSight(foe)) {
      cancelSniperAim(foe);
    } else {
      foe.sniperAimTimer = Math.max(0, foe.sniperAimTimer - dt);
      foe.sniperAimX = player.x;
      foe.sniperAimY = player.y;
      foe.sniperAimAngle = Math.atan2(player.y - foe.y, player.x - foe.x);
      if (foe.sniperAimTimer <= SNIPER_ATTACK.finalLockDuration) {
        lockSniperAim(foe);
      }
    }
  } else if (foe.sniperPhase === "lock") {
    foe.sniperAimTimer = Math.max(0, foe.sniperAimTimer - dt);
    const ray = sniperRay(foe, foe.sniperLockedAngle);
    foe.sniperAimX = ray.endX;
    foe.sniperAimY = ray.endY;
    if (foe.sniperAimTimer <= 0) fireSniperBeam(foe);
  } else if (
    foe.attackTimer <= 0
    && len >= SNIPER_POSITIONING.acquisitionMin
    && len <= SNIPER_POSITIONING.acquisitionMax
    && sniperHasLineOfSight(foe)
  ) {
    beginSniperAim(foe);
  }

  let vx = 0;
  let vy = 0;
  const strafeDir = foe.sniperRepositionTimer > 0
    ? (foe.sniperRepositionDir || foe.strafeDir)
    : foe.strafeDir;

  if (len > SNIPER_POSITIONING.preferredMax) {
    vx += nx * foe.speed * 0.82;
    vy += ny * foe.speed * 0.82;
    vx += tx * foe.speed * 0.16 * strafeDir;
    vy += ty * foe.speed * 0.16 * strafeDir;
  } else if (len < SNIPER_POSITIONING.hardRetreatDistance) {
    vx -= nx * foe.speed * 1.1;
    vy -= ny * foe.speed * 1.1;
    vx += tx * foe.speed * 0.36 * strafeDir;
    vy += ty * foe.speed * 0.36 * strafeDir;
  } else if (len < SNIPER_POSITIONING.preferredMin) {
    vx -= nx * foe.speed * 0.58;
    vy -= ny * foe.speed * 0.58;
    vx += tx * foe.speed * 0.46 * strafeDir;
    vy += ty * foe.speed * 0.46 * strafeDir;
  } else {
    vx += tx * foe.speed * 0.34 * strafeDir;
    vy += ty * foe.speed * 0.34 * strafeDir;
  }

  if (foe.sniperRepositionTimer > 0) {
    vx += tx * foe.speed * 0.48 * strafeDir;
    vy += ty * foe.speed * 0.48 * strafeDir;
  }

  const edgePadding = 210;
  const edgeForce = foe.speed * 1.2;
  if (foe.x < edgePadding) vx += edgeForce * (1 - foe.x / edgePadding);
  else if (foe.x > world.width - edgePadding) vx -= edgeForce * (1 - (world.width - foe.x) / edgePadding);
  if (foe.y < edgePadding) vy += edgeForce * (1 - foe.y / edgePadding);
  else if (foe.y > world.height - edgePadding) vy -= edgeForce * (1 - (world.height - foe.y) / edgePadding);

  foe.knockbackX *= Math.max(0, 1 - dt * 7.5);
  foe.knockbackY *= Math.max(0, 1 - dt * 7.5);
  const slowMultiplier = foe.slowTimer > 0 ? 0.58 : 1;
  vx = vx * slowMultiplier + foe.knockbackX;
  vy = vy * slowMultiplier + foe.knockbackY;

  if (foe.sniperPhase === "lock") {
    vx = 0;
    vy = 0;
  } else if (foe.sniperPhase === "tracking") {
    const speed = Math.hypot(vx, vy);
    const maxTrackingSpeed = foe.speed * SNIPER_POSITIONING.trackingMoveMultiplier;
    if (speed > maxTrackingSpeed && speed > 0) {
      vx = vx / speed * maxTrackingSpeed;
      vy = vy / speed * maxTrackingSpeed;
    }
  }

  foe.isMoving = Math.hypot(vx, vy) > 2;
  foe.animTime += dt * (foe.isMoving ? 1 : 0.7);
  moveActor(foe, vx, vy, dt);
}

function updateFoe(foe, dt) {
  foe.hitFlash = Math.max(0, foe.hitFlash - dt);
  foe.slowTimer = Math.max(0, (foe.slowTimer || 0) - dt);
  foe.empowerFlashTimer = Math.max(0, (foe.empowerFlashTimer || 0) - dt);
  foe.empowerArcTimer = Math.max(0, (foe.empowerArcTimer || 0) - dt);

  if (foe.techpriestEmpowered) {
    foe.empowerArcCooldown = Math.max(0, (foe.empowerArcCooldown || 0) - dt);

    if (foe.empowerArcCooldown <= 0) {
      foe.empowerArcTimer = 0.18;
      foe.empowerArcCooldown = rand(2.1, 3.4);
      foe.empowerArcSeed = Math.random() * TAU;
    }
  }

  foe.shieldFlash = Math.max(0, (foe.shieldFlash || 0) - dt);
  foe.shieldBreakTimer = Math.max(0, (foe.shieldBreakTimer || 0) - dt);
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
  const sniperDirectionLocked = (
    foe.id === "sniper"
    && foe.sniperPhase === "lock"
    && Number.isFinite(foe.sniperLockedAngle)
  );
  if (!sniperDirectionLocked && Math.abs(dx) > FACE_DEAD_ZONE) {
    foe.facingLeft = dx < 0;
  }
  foe.angle = sniperDirectionLocked ? foe.sniperLockedAngle : Math.atan2(dy, dx);
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
  } else if (foe.id === "sniper") {
    updateSniper(foe, dt, len, nx, ny, tx, ty);
    return;
  } else if (foe.id === "techpriest") {
    updateTechpriest(foe, dt, len, nx, ny, tx, ty, dx, dy);
    return;
  } else if (foe.id === "swarm") {
    const stopDistance = player.radius + foe.radius + 4;
    const lateral = Math.sin(foe.pulse * 2.1 + (foe.swarmSeed || 0)) * 0.18;
    const wobble = Math.cos(foe.pulse * 1.35 + (foe.swarmSeed || 0)) * 0.06;

    if (len > stopDistance) {
      const approachSpeed = Math.min(foe.speed, Math.max(0, (len - stopDistance) / Math.max(dt, 0.016)));
      vx = (nx + tx * lateral) * approachSpeed;
      vy = (ny + ty * (lateral + wobble)) * approachSpeed;
    } else {
      vx = tx * foe.speed * 0.10 * lateral;
      vy = ty * foe.speed * 0.10 * lateral;
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
  if (!foe.boss && foe.id === "swarm") {
    keepFoeOutsidePlayer(foe, player.radius + foe.radius + 4);
  }

  const afterDx = player.x - foe.x;
  const afterDy = player.y - foe.y;
  const afterLen = Math.hypot(afterDx, afterDy) || 1;
  const contactRange = foe.radius + player.radius + (foe.id === "animal" ? 18 : foe.id === "swarm" ? 8 : 6);

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
    if (foe.hp <= 0) {
      if (foe.id === "techpriest") {
        foe.techpriestWaveCharging = false;
        foe.techpriestWaveChargeTimer = 0;
        removeTechpriestBuffFromWave(true);
      }
      if (foe.id === "sniper") {
        foe.sniperPhase = "idle";
        foe.sniperAimTimer = 0;
        foe.sniperLockedAngle = null;
      }
      awardKill(foe);
    } else {
      alive.push(foe);
    }
  }
  world.foes = alive;
}

function updateFoes(dt) {
  for (const foe of world.foes) {
    if (foe.hp > 0) updateFoe(foe, dt);
  }
  separateSwarmFoes();
  cleanupDeadFoes();
}

export {
  TECHPRIEST_SIGNAL_WAVE,
  SNIPER_SPAWN,
  SNIPER_POSITIONING,
  SNIPER_ATTACK,
  planSnipersForWave,
  segmentCircleIntersection,
  createWave,
  spawnPoint,
  makeFoe,
  beginWave,
  intermission,
  spawnRegular,
  spawnSniper,
  forceSpawnTechpriestNow,
  spawnBoss,
  spawnMinions,
  updateWave,
  updateFoe,
  cleanupDeadFoes,
  updateFoes,
};
