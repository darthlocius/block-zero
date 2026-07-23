// Shared game state, assets, UI helpers, and reusable systems.

import { addLanguageChangeListener, getLanguage, t } from "./i18n.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fullscreenRoot = document.getElementById("fullscreenRoot");
const gameFrame = document.getElementById("gameFrame");
const fullscreenButton = document.getElementById("fullscreenButton");
const mainMenuOverlay = document.getElementById("mainMenuOverlay");
const mainMenuStartButton = document.getElementById("mainMenuStartButton");
const mainMenuControlsButton = document.getElementById("mainMenuControlsButton");
const mainMenuUpgradesButton = document.getElementById("mainMenuUpgradesButton");
const mainMenuSynergyGuideButton = document.getElementById("mainMenuSynergyGuideButton");
const mainMenuAchievementsButton = document.getElementById("mainMenuAchievementsButton");
const mainMenuHallButton = document.getElementById("mainMenuHallButton");
const mainMenuFullscreenButton = document.getElementById("mainMenuFullscreenButton");
const mainMenuFullscreenState = document.getElementById("mainMenuFullscreenState");
const mainMenuAudioButton = document.getElementById("mainMenuAudioButton");
const mainMenuAudioPanel = document.getElementById("mainMenuAudioPanel");
const mainMenuAudioState = document.getElementById("mainMenuAudioState");
const mainMenuExitButton = document.getElementById("mainMenuExitButton");
const controlsOverlay = document.getElementById("controlsOverlay");
const closeControlsButton = document.getElementById("closeControlsButton");

const healthValue = document.getElementById("healthValue");
const healthBar = document.getElementById("healthBar");
const healthBarFill = document.getElementById("healthBarFill");
const healthBarGloss = healthBar?.querySelector(".health-bar-gloss") || null;
const scoreValue = document.getElementById("scoreValue");
const waveValue = document.getElementById("waveValue");
const comboValue = document.getElementById("comboValue");
const weaponValue = document.getElementById("weaponValue");
const grenadeHud = document.getElementById("grenadeHud");
const grenadeValue = document.getElementById("grenadeValue");
const boostsBar = document.getElementById("boostsBar");
const waveBonusBadge = document.getElementById("waveBonusBadge");
const synergyPanel = document.getElementById("synergyPanel");
const leaderboardCount = document.getElementById("leaderboardCount");
const leaderboardBody = document.getElementById("leaderboardBody");
const openLeaderboardButton = document.getElementById("openLeaderboardButton");
const closeLeaderboardButton = document.getElementById("closeLeaderboardButton");
const leaderboardOverlay = document.getElementById("leaderboardOverlay");
const leaderboardOverlayCount = document.getElementById("leaderboardOverlayCount");
const leaderboardBestScore = document.getElementById("leaderboardBestScore");
const leaderboardFullBody = document.getElementById("leaderboardFullBody");
const leaderboardDetails = document.getElementById("leaderboardDetails");
const startButton = document.getElementById("startButton");
const menuMetaButton = document.getElementById("menuMetaButton");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayButton = document.getElementById("overlayButton");
const overlayMetaButton = document.getElementById("overlayMetaButton");
const audioPrompt = document.getElementById("audioPrompt");
const waveClearOverlay = document.getElementById("waveClearOverlay");
const perkOverlay = document.getElementById("perkOverlay");
const perkHint = document.getElementById("perkHint");
const perkPanel = document.getElementById("perkPanel");
const perkSynergyGuideButton = document.getElementById("perkSynergyGuideButton");
const perkSynergyPanel = document.getElementById("perkSynergyPanel");
const perkControls = document.getElementById("perkControls");
const perkChoices = document.getElementById("perkChoices");
const deathSequenceOverlay = document.getElementById("deathSequenceOverlay");
const metaOverlay = document.getElementById("metaOverlay");
const metaSynergyGuideButton = document.getElementById("metaSynergyGuideButton");
const closeMetaButton = document.getElementById("closeMetaButton");
const synergyGuideOverlay = document.getElementById("synergyGuideOverlay");
const synergyGuideList = document.getElementById("synergyGuideList");
const closeSynergyGuideButton = document.getElementById("closeSynergyGuideButton");
const backSynergyGuideButton = document.getElementById("backSynergyGuideButton");
const achievementsOverlay = document.getElementById("achievementsOverlay");
const closeAchievementsButton = document.getElementById("closeAchievementsButton");
const backAchievementsButton = document.getElementById("backAchievementsButton");
const achievementsList = document.getElementById("achievementsList");
const achievementsUnlockedCount = document.getElementById("achievementsUnlockedCount");
const achievementsTotalKills = document.getElementById("achievementsTotalKills");
const achievementsSwarmKills = document.getElementById("achievementsSwarmKills");
const achievementsBarrelsDestroyed = document.getElementById("achievementsBarrelsDestroyed");
const achievementToastRoot = document.getElementById("achievementToastRoot");
const metaCreditsValue = document.getElementById("metaCreditsValue");
const metaEarnedValue = document.getElementById("metaEarnedValue");
const metaStatsGrid = document.getElementById("metaStatsGrid");
const metaUpgradeList = document.getElementById("metaUpgradeList");
const metaUpgradeTabs = document.getElementById("metaUpgradeTabs");
const metaTeaserCredits = document.getElementById("metaTeaserCredits");
const runSummaryPanel = document.getElementById("runSummaryPanel");
const runSummaryResult = document.getElementById("runSummaryResult");
const runSummaryDuration = document.getElementById("runSummaryDuration");
const runSummaryWave = document.getElementById("runSummaryWave");
const runSummaryKills = document.getElementById("runSummaryKills");
const runSummaryScore = document.getElementById("runSummaryScore");
const runSummaryMaxCombo = document.getElementById("runSummaryMaxCombo");
const runSummaryWeapon = document.getElementById("runSummaryWeapon");
const runSummaryCreditsEarned = document.getElementById("runSummaryCreditsEarned");
const runSummaryCreditsTotal = document.getElementById("runSummaryCreditsTotal");
const runSummarySynergies = document.getElementById("runSummarySynergies");
const scoreEntryPanel = document.getElementById("scoreEntryPanel");
const playerNameInput = document.getElementById("playerNameInput");
const saveScoreButton = document.getElementById("saveScoreButton");
const saveScoreStatus = document.getElementById("saveScoreStatus");
const cheatToastRoot = document.getElementById("cheatToastRoot");
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeRunButton = document.getElementById("resumeRunButton");
const abortRunButton = document.getElementById("abortRunButton");
const pauseMainMenuButton = document.getElementById("pauseMainMenuButton");
const masterVolume = document.getElementById("masterVolume");
const musicVolume = document.getElementById("musicVolume");
const sfxVolume = document.getElementById("sfxVolume");

const DEFAULT_CANVAS_WIDTH = 1120;
const DEFAULT_CANVAS_HEIGHT = 680;
const TAU = Math.PI * 2;
const BASE_WORLD_WIDTH = canvas.width;
const BASE_WORLD_HEIGHT = canvas.height;
const WORLD_SCALE = 1.8;
const LEADERBOARD_KEY = "block-zero-leaderboard-v1";
const LEADERBOARD_NAME_KEY = "block-zero-player-name";
const META_PROGRESS_KEY = "block-zero-meta-v1";
const ACHIEVEMENTS_STORAGE_KEY = "block-zero-achievements-v1";

const GRENADE_CONFIG = Object.freeze({
  maxCharges: 3,
  maxRange: 720,
  cooldown: 0.55,

  flightBase: 0.32,
  flightDistanceDivisor: 1450,
  minFlightTime: 0.42,
  maxFlightTime: 0.82,
  arcHeight: 112,

  explosionRadius: 230,
  baseDamage: 460,
  edgeDamageRatio: 0.45,

  bossDamageMultiplier: 0.30,
  destructibleDamageMultiplier: 0.65,

  knockbackForce: 280,
  techpriestKnockbackMultiplier: 0.45,
  bossKnockbackMultiplier: 0.20,
});

const achievementDefinitions = [
  { id: "first_blood", iconIndex: 0, progressType: "counter", counter: "kills", target: 1 },
  { id: "first_line", iconIndex: 1, progressType: "runWave", target: 5 },
  { id: "twelfth_line", iconIndex: 2, progressType: "runWave", target: 12 },
  { id: "mr_wick", iconIndex: 3, progressType: "weaponStreak", weapon: "pistol", target: 12 },
  { id: "gauge_fury", iconIndex: 4, progressType: "weaponStreak", weapon: "shotgun", target: 12 },
  { id: "exterminator", iconIndex: 5, progressType: "counter", counter: "swarmKills", target: 1000 },
  { id: "bad_day_swarm", iconIndex: 6, progressType: "runCounter", counter: "runSwarmKills", target: 250 },
  { id: "beginner", iconIndex: 7, progressType: "tierCounter", counter: "kills", from: 0, target: 2500 },
  { id: "experienced_killer", iconIndex: 8, progressType: "tierCounter", counter: "kills", from: 2500, target: 5000 },
  { id: "death_machine", iconIndex: 9, progressType: "tierCounter", counter: "kills", from: 5000, target: 10000 },
  { id: "hate_barrels", iconIndex: 10, progressType: "counter", counter: "barrelsDestroyed", target: 100 },
  { id: "dont_touch_that", iconIndex: 11, progressType: "runCounter", counter: "runBarrelsDestroyed", target: 10 },
  { id: "synergy_online", iconIndex: 12, progressType: "runCounter", counter: "runSynergiesActivated", target: 1 },
  { id: "war_engineer", iconIndex: 13, progressType: "runCounter", counter: "runSynergiesActivated", target: 3 },
  { id: "giant_down", iconIndex: 14, progressType: "flag", flag: "bossKilled" },
  { id: "elusive", iconIndex: 15, progressType: "flag", flag: "waveClearedWithoutDamage" },
];

const defaultAchievementState = () => ({
  unlocked: {},
  counters: {
    kills: 0,
    swarmKills: 0,
    barrelsDestroyed: 0,
  },
});

let achievementState = loadAchievementState();
let cheatToastTimeout = null;

const enemies = {
  animal: { id: "animal", label: "Hellhound", speed: 168, radius: 18, hp: 34, color: "#ff8d3a", flesh: "#6e3b2a", reward: 11, damage: 9, attackCooldown: 0.72, blood: "#ff6e42", ranged: false },
  monster: { id: "monster", label: "Orb", speed: 66, radius: 24, hp: 64, color: "#8dff5c", flesh: "#3b5a28", reward: 18, damage: 18, attackCooldown: 2.0, blood: "#93ff67", ranged: true, projectileSpeed: 210 },
  criminal: { id: "criminal", label: "Tank", speed: 94, radius: 21, hp: 52, color: "#45c7ff", flesh: "#3b4254", reward: 15, damage: 14, attackCooldown: 1.65, blood: "#68e1ff", ranged: true, projectileSpeed: 250 },
  swarm: {
    id: "swarm",
    label: "Swarm",
    speed: 212,
    radius: 13,
    spacingRadius: 17,
    hp: 12,
    color: "#9cff2f",
    flesh: "#171b16",
    reward: 1,
    damage: 4,
    attackCooldown: 0.95,
    blood: "#9cff2f",
    ranged: false,
    comboGain: 0.02,
    pickupChanceMul: 0.10,
  },
  techpriest: {
    id: "techpriest",
    label: "Tech-Priest of the Swarm",
    speed: 74,
    radius: 34,
    hp: 420,
    color: "#7cff4f",
    flesh: "#101812",
    reward: 120,
    damage: 13,
    attackCooldown: 0.55,
    blood: "#9cff2f",
    ranged: true,
    projectileSpeed: 560,
    comboGain: 0.75,
    pickupChanceMul: 1.0,
    shieldRatio: 1.15,
    armorReduction: 0.3,
  },
};

const bosses = [
  { id: "alpha", label: "Мегамозг", kind: "animal", radius: 34, hp: 320, speed: 170, damage: 24, reward: 180, color: "#ff5b2e", flesh: "#3c1613", blood: "#ff7c57", attackCooldown: 0.8, specialCooldown: 5.2 },
  { id: "abomination", label: "Отродье", kind: "monster", radius: 40, hp: 420, speed: 84, damage: 28, reward: 220, color: "#a6ff47", flesh: "#243216", blood: "#c9ff6b", attackCooldown: 1.3, specialCooldown: 4.6 },
  { id: "warlord", label: "Повелитель битвы", kind: "criminal", radius: 32, hp: 360, speed: 114, damage: 18, reward: 200, color: "#74d5ff", flesh: "#1e2432", blood: "#93ebff", attackCooldown: 0.72, specialCooldown: 5.4 },
];

const solids = {
  barrel: { w: 36, h: 36, hp: 78, reward: 8, explosive: true, assetKey: "object_barrel" },
  crate: { w: 42, h: 42, hp: 58, reward: 5, explosive: false, assetKey: "object_box" },
  barricade: { w: 84, h: 24, hp: 88, reward: 7, explosive: false, assetKey: "object_concrete_h" },
  wall: { w: 36, h: 84, hp: 102, reward: 9, explosive: false, assetKey: "object_concrete_v" },
  longcrate: { w: 74, h: 30, hp: 80, reward: 6, explosive: false, assetKey: "object_box_long" },
};

const MAX_ACTIVE_BARRELS = 6;
const MAX_ACTIVE_WOODEN_CRATES = 6;
const MAX_ACTIVE_CONCRETE_BLOCKS = 5;
const WOODEN_CRATE_TYPES = ["crate", "longcrate"];
const CONCRETE_COVER_TYPES = ["wall", "barricade"];

const barrelSpawnPoints = [
  { x: 338, y: 108 }, { x: 216, y: 454 }, { x: 502, y: 92 }, { x: 604, y: 164 },
  { x: 728, y: 246 }, { x: 304, y: 214 }, { x: 420, y: 324 }, { x: 566, y: 418 },
  { x: 714, y: 482 }, { x: 252, y: 520 }, { x: 814, y: 118 }, { x: 164, y: 196 },
];

const buffs = {
  drone: { label: "Hunter Drone", color: "#ff5cf4", duration: 10 },
  rapid: { label: "Скорострельность", color: "#ff9d43", duration: 10 },
  speed: { label: "Скорость", color: "#8af2ff", duration: 10 },
  armor: { label: "Броня", color: "#7cff93", duration: 12 },
};

const weapons = {
  pistol: { id: "pistol", label: "Пистолет", fireRate: 0.18, damage: 28, speed: 650, spread: 0.028, pellets: 1, color: "#ffd477", style: "bullet", radius: 4 },
  smg: { id: "smg", label: 'SMG "Гадюка"', fireRate: 0.065, damage: 12, speed: 780, spread: 0.085, pellets: 1, color: "#ffbf68", style: "needle", radius: 3 },
  shotgun: { id: "shotgun", label: "Бульдог-8", fireRate: 0.56, damage: 15, speed: 560, spread: 0.24, pellets: 8, color: "#ffd89b", style: "shell", radius: 4 },
  rail: { id: "rail", label: "Плазменная винтовка 40 Wt", fireRate: 0.36, damage: 76, speed: 760, spread: 0.006, pellets: 1, color: "#86f7ff", style: "plasmaOrb", radius: 7 },
};

const assetManifest = {
  images: {
    player: "assets/images/player/player.png",
    enemy_animal: "assets/images/enemies/hellhound.png",
    enemy_monster: "assets/images/enemies/orb.png",
    enemy_criminal: "assets/images/enemies/tank.png",
    enemy_swarm: "assets/images/enemies/swarm.png",
    enemy_techpriest: "assets/images/enemies/swarm-techpriest.png",
    boss: "assets/images/boss/alpha.png",
    boss_alpha: "assets/images/boss/alpha.png",
    boss_abomination: "assets/images/boss/abomination.png",
    boss_warlord: "assets/images/boss/warlord.png",
    terrain: "assets/images/terrain/terrain.png",
    terrain_01: "assets/images/terrain/terrain_01.png",
    terrain_02: "assets/images/terrain/terrain_02.png",
    terrain_03: "assets/images/terrain/terrain_03.png",
    terrain_04: "assets/images/terrain/terrain_04.png",
    pickup_med: "assets/images/pickups/medkit.png",
    pickup_rapid: "assets/images/pickups/firerate.png",
    pickup_speed: "assets/images/pickups/speed_boost.png",
    pickup_armor: "assets/images/pickups/armor.png",
    pickup_drone: "assets/images/pickups/drone_case.png",
    weapon_smg: "assets/images/pickups/smg.png",
    weapon_shotgun: "assets/images/pickups/shotgun.png",
    weapon_rail: "assets/images/pickups/coil_rifle.png",
    ally_drone: "assets/images/allies/drone.png",
    effect_hellhound_death: "assets/images/effects/hellhound_after_death.png",
    effect_orb_death: "assets/images/effects/orb_after_death.png",
    effect_tank_death: "assets/images/effects/tank_after_death.png",
    object_barrel: "assets/images/objects/barrel.png",
    object_box: "assets/images/objects/box.png",
    object_box_long: "assets/images/objects/box_long.png",
    object_concrete_h: "assets/images/objects/concrete_horisontal.png",
    object_concrete_v: "assets/images/objects/concrete_vertical.png",
  },
  audio: {
    menu_music: "assets/audio/main_menu_music.mp3",
    battle_music: "assets/audio/battle_music.mp3",
    battle_music_02: "assets/audio/battle_music_02.mp3",
    battle_music_03: "assets/audio/battle_music_03.mp3",
    battle_music_04: "assets/audio/battle_music_04.mp3",
    battle_music_05: "assets/audio/battle_music_05.mp3",
    battle_music_06: "assets/audio/battle_music_06.mp3",
    battle_music_07: "assets/audio/battle_music_07.mp3",
    battle_music_08: "assets/audio/battle_music_08.mp3",
    gun_pistol: "assets/audio/pistol-fire.mp3",
    gun_shotgun: "assets/audio/shotgun-fire.mp3",
    gun_smg: "assets/audio/smg-fire.mp3",
    gun_rail: "assets/audio/coillance-fire.mp3",
    drone_beam: "assets/audio/hunterdrone-beam.mp3",
  },
};

const battleTrackKeys = [
  "battle_music",
  "battle_music_02",
  "battle_music_03",
  "battle_music_04",
  "battle_music_05",
  "battle_music_06",
  "battle_music_07",
  "battle_music_08",
];

const playerSpritesheetMeta = {
  frameWidth: 64,
  frameHeight: 64,
  fps: 60,
  directions: ["up", "up_right", "right", "down_right", "down", "down_left", "left", "up_left"],
  layouts: {
    idle: { rowStart: 0, rowCount: 4 },
    walk: { rowStart: 4, rowCount: 6 },
    shoot: { rowStart: 10, rowCount: 3 },
    death: { rowStart: 13, rowCount: 6 },
  },
};

const enemySpritesheetMeta = {
  animal: {
    frameWidth: 64,
    frameHeight: 64,
    fps: 60,
    directions: ["up", "up_right", "right", "down_right", "down", "down_left", "left", "up_left"],
    layouts: {
      walk: { rowStart: 0, rowCount: 6 },
      attack: { rowStart: 6, rowCount: 4 },
      death: { rowStart: 10, rowCount: 6 },
    },
  },
};

const animationProfiles = {
  topdown_octant: {
    directions: ["right", "down_right", "down", "down_left", "left", "up_left", "up", "up_right"],
    offset: 0,
    hysteresis: 0.18,
    verticalThreshold: 0.2,
  },
};

const player = {
  x: (BASE_WORLD_WIDTH * WORLD_SCALE) / 2,
  y: (BASE_WORLD_HEIGHT * WORLD_SCALE) / 2,
  radius: 18,
  baseSpeed: 260,
  baseMaxHealth: 112,
  health: 112,
  maxHealth: 112,
  angle: 0,
  fireCooldown: 0,
  baseFireRate: 0.16,
  weapon: "pistol",
  dashCooldown: 0,
  dashDuration: 0,
  dashVector: { x: 0, y: 0 },
  hitFlash: 0,
  armorFlash: 0,
  traumaArmorTimer: 0,
  invulnTimer: 0,
  animTime: 0,
  shootAnimTimer: 0,
  deathAnimTimer: 0,
  animationProfile: "topdown_octant",
  facingIndex: 2,
  facingName: "down",
  facingVertical: "down",
};

function baseWaveBonusModifiers() {
  return {
    fireRateMul: 1,
    pistolFireRateMul: 1,
    spreadMul: 1,
    smgSpreadMul: 1,
    incomingDamageMul: 1,
    incomingExplosionDamageMul: 1,
    moveSpeedMul: 1,
    projectileSpeedMul: 1,
    knockbackMul: 1,
    shotgunPelletsBonus: 0,
    shotgunKnockbackMul: 1,
    pickupChanceBonus: 0,
    medkitBias: 0,
    weaponDropBonus: 0,
    flatPierceBonus: 0,
    plasmaPierceBonus: 0,
    pistolDeadeyeEvery: 0,
    pistolDeadeyeCounter: 0,
    pistolDeadeyeDamageMul: 1,
    pistolDeadeyePierceBonus: 0,
    plasmaDamageMul: 1,
    plasmaImpactMul: 1,
    globalDamageMul: 1,
    railFireRateMul: 1,
    dashCooldownMul: 1,
    killHealChance: 0,
    killHealAmount: 0,
    traumaGel: false,
    traumaGelReduction: 1,
    secondWind: false,
    secondWindUsed: false,
    hunterProtocol: false,
    hunterDamageMul: 1,
    executionThreshold: 0,
    executionDamageMul: 1,
  };
}

const metaUpgrades = {
  max_health: {
    id: "max_health",
    title: "Укрепление организма",
    description: "+10 к максимальному здоровью за уровень.",
    maxLevel: 5,
    baseCost: 24,
    costScale: 18,
  },
  move_speed: {
    id: "move_speed",
    title: "Моторная реакция",
    description: "+4% к скорости перемещения за уровень.",
    maxLevel: 5,
    baseCost: 22,
    costScale: 16,
  },
  damage_resistance: {
    id: "damage_resistance",
    title: "Композитная броня",
    description: "-4% входящего урона за уровень.",
    maxLevel: 5,
    baseCost: 26,
    costScale: 18,
  },
  pickup_luck: {
    id: "pickup_luck",
    title: "Полевой трофейщик",
    description: "+6% к шансу дропа за уровень.",
    maxLevel: 5,
    baseCost: 18,
    costScale: 14,
  },
  weapon_mastery: {
    id: "weapon_mastery",
    title: "Оружейная подготовка",
    description: "+5% к базовому урону оружия за уровень.",
    maxLevel: 5,
    baseCost: 28,
    costScale: 20,
  },
  crit_protocol: {
    id: "crit_protocol",
    title: "Протокол добивания",
    description: "+5% к урону по врагам с низким HP за уровень.",
    maxLevel: 5,
    baseCost: 24,
    costScale: 18,
  },
  recovery: {
    id: "recovery",
    title: "Экстренная регенерация",
    description: "Повышает эффективность лечения на 10% за уровень.",
    maxLevel: 5,
    baseCost: 18,
    costScale: 14,
  },
  perk_bias: {
    id: "perk_bias",
    title: "Тактическая интуиция",
    description: "Чуть чаще показывает редкие и эпические усиления между волнами.",
    maxLevel: 5,
    baseCost: 30,
    costScale: 22,
  },
  reroll_protocol: {
    id: "reroll_protocol",
    title: "Reroll Protocol",
    description: "Grants +1 augment reroll per level during each run.",
    maxLevel: 3,
    baseCost: 450,
    costScale: 240,
  },
  expanded_selection: {
    id: "expanded_selection",
    title: "Expanded Selection",
    description: "Adds a fourth augment option between waves.",
    maxLevel: 1,
    baseCost: 1900,
    costScale: 0,
  },
  synergy_scanner: {
    id: "synergy_scanner",
    title: "Synergy Scanner",
    description: "Shows which augment choices can lead toward synergies.",
    maxLevel: 1,
    baseCost: 1400,
    costScale: 0,
  },
  armory_damage: {
    id: "armory_damage",
    category: "armory",
    title: "Убойная калибровка",
    description: "+4% к урону всего оружия за уровень.",
    maxLevel: 5,
    baseCost: 180,
    costScale: 115,
  },
  armory_fire_rate: {
    id: "armory_fire_rate",
    category: "armory",
    title: "Разогнанные затворы",
    description: "Уменьшает задержку между выстрелами на 3% за уровень.",
    maxLevel: 5,
    baseCost: 220,
    costScale: 140,
  },
  armory_projectile_speed: {
    id: "armory_projectile_speed",
    category: "armory",
    title: "Ускоренный импульс",
    description: "+4% к скорости снарядов за уровень.",
    maxLevel: 5,
    baseCost: 160,
    costScale: 105,
  },
  armory_range: {
    id: "armory_range",
    category: "armory",
    title: "Дальняя баллистика",
    description: "+6% к дальности полёта снарядов за уровень.",
    maxLevel: 5,
    baseCost: 170,
    costScale: 110,
  },
  armory_stability: {
    id: "armory_stability",
    category: "armory",
    title: "Гиростабилизаторы ствола",
    description: "-5% к разбросу оружия за уровень.",
    maxLevel: 5,
    baseCost: 180,
    costScale: 120,
  },
  armory_pierce: {
    id: "armory_pierce",
    category: "armory",
    title: "Пробойные сердечники",
    description: "+1 к пробитию за уровень для пистолета, SMG и плазменной винтовки. Дробовик не получает пробитие.",
    maxLevel: 2,
    baseCost: 850,
    costScale: 520,
  },
};

function createDefaultMetaState() {
  const levels = {};
  for (const id of Object.keys(metaUpgrades)) levels[id] = 0;
  return {
    credits: 0,
    totalEarnedCredits: 0,
    unlockedMetaUpgrades: [],
    metaUpgradeLevels: levels,
    totalRuns: 0,
    totalKills: 0,
    bestWaveEver: 0,
    bestScoreEver: 0,
  };
}

const world = {
  width: Math.round(BASE_WORLD_WIDTH * WORLD_SCALE),
  height: Math.round(BASE_WORLD_HEIGHT * WORLD_SCALE),
  isGameFullscreen: false,
  canvasUiScale: 1,
  waveBannerScale: 1,
  state: "menu",
  stateBeforePause: null,
  pauseOpenedAt: 0,
  lastTime: 0,
  screenShake: 0,
  shakeX: 0,
  shakeY: 0,
  shakeRot: 0,
  keys: new Set(),
  camera: { x: 0, y: 0, width: canvas.width, height: canvas.height },
  pointerScreen: { x: canvas.width / 2, y: canvas.height / 2 },
  pointer: { x: canvas.width / 2, y: canvas.height / 2, down: false },
  bullets: [],
  grenades: [],
  grenadeCount: GRENADE_CONFIG.maxCharges,
  grenadeMax: GRENADE_CONFIG.maxCharges,
  grenadeCooldown: 0,
  grenadeHudPulse: 0,
  grenadeHudEmptyPulse: 0,
  enemyShots: [],
  foes: [],
  particles: [],
  pickups: [],
  weaponPickupPromptTarget: null,
  weaponPickupTarget: null,
  weaponPickupHoldTime: 0,
  weaponPickupHoldProgress: 0,
  destructibles: [],
  decals: [],
  deathEffects: [],
  blastGlows: [],
  fireZones: [],
  objectDebris: [],
  gibs: [],
  muzzleFlashes: [],
  terrain: { puddles: [], cracks: [], trash: [], glows: [], windows: [], stains: [] },
  score: 0,
  combo: 1,
  comboTimer: 0,
  wave: 0,
  techpriestEligibleMisses: 0,
  techpriestSpawnedThisRun: 0,
  kills: 0,
  runCreditsEarned: 0,
  runDuration: 0,
  maxCombo: 1,
  weaponsUsed: [],
  runEndReason: "",
  runMetaAwarded: false,
  runStatsCounted: false,
  runSwarmKills: 0,
  runBarrelsDestroyed: 0,
  runSynergiesActivated: 0,
  runClearedWaves: 0,
  runWeaponStreak: {
    weapon: "pistol",
    clearedWaves: 0,
  },
  damageTakenThisWave: 0,
  waveClearTimer: 0,
  waveClearPendingPerk: false,
  intermissionTimer: 0,
  banner: null,
  bannerQueue: [],
  bossWarning: null,
  currentWave: null,
  buffs: { rapid: 0, speed: 0, armor: 0, drone: 0 },
  activeWaveBonus: null,
  pendingWaveBonuses: [],
  perkRerollsLeft: 0,
  perkRerollCapacity: 0,
  waveBonusExpiresOnWave: 0,
  acquiredRunBonuses: [],
  buildTagsCounter: {},
  runBonusHistory: [],
  activeSynergies: [],
  expandedPerkSynergyId: null,
  synergyCounters: {
    bulletStormShots: 0,
  },
  waveBonusModifiers: baseWaveBonusModifiers(),
  hunterDrones: [],
  droneSwarmPhase: 0,
  droneBeamSoundCooldown: 0,
  radar: { range: 260, ping: 0 },
  leaderboard: [],
  selectedLeaderboardIndex: 0,
  pendingLeaderboardEntry: null,
  resultOverlayKind: null,
  deathSequenceTimer: 0,
  deathSequenceReadyForClick: false,
  deathOverlayAlpha: 0,
  synergyToast: null,
  pendingSynergyAnnouncements: [],
  achievementToastQueue: [],
  achievementToastActive: false,
  achievementStateSnapshot: null,
  cheatsUsed: false,
  activeCheats: {
    godMode: false,
  },
  nextRunCheats: {
    godMode: false,
    forceTechpriest: false,
    armoryDrop: false,
    swarmHell: false,
  },
  cheatToast: null,
  cheatToastTimer: 0,
};

const metaState = loadMetaProgress();
let activeMetaUpgradeTab = "general";

function setMetaUpgradeTab(tab) {
  if (tab !== "general" && tab !== "armory") return;
  activeMetaUpgradeTab = tab;
  renderMetaUpgrades();
}

const waveBonusRarities = {
  common: {
    rarityLabel: "ОБЫЧНЫЙ",
    borderColor: "#b7c1cf",
    glowColor: "rgba(188, 198, 214, 0.2)",
    chanceWeight: 1.2,
  },
  rare: {
    rarityLabel: "РЕДКИЙ",
    borderColor: "#63afff",
    glowColor: "rgba(73, 160, 255, 0.24)",
    chanceWeight: 0.92,
  },
  epic: {
    rarityLabel: "ЭПИЧЕСКИЙ",
    borderColor: "#b476ff",
    glowColor: "rgba(173, 93, 255, 0.28)",
    chanceWeight: 0.62,
  },
  legendary: {
    rarityLabel: "ЛЕГЕНДАРНЫЙ",
    borderColor: "#ffb159",
    glowColor: "rgba(255, 166, 71, 0.34)",
    chanceWeight: 0.34,
  },
};

function createWaveBonus(config) {
  const rarity = waveBonusRarities[config.rarity || "common"] || waveBonusRarities.common;
  return {
    ...config,
    tags: Array.isArray(config.tags) ? [...config.tags] : [],
    rarity: config.rarity || "common",
    rarityLabel: rarity.rarityLabel,
    borderColor: config.borderColor || rarity.borderColor,
    glowColor: config.glowColor || rarity.glowColor,
    chanceWeight: config.chanceWeight || rarity.chanceWeight,
  };
}

const waveBonuses = {
  rapid_overdrive: createWaveBonus({
    id: "rapid_overdrive",
    title: "Смазанный затвор",
    description: "+35% к скорострельности до конца следующей волны.",
    color: "#ffb347",
    rarity: "common",
    weight: 1,
    tags: ["offense", "rapidfire"],
    apply() {
      world.waveBonusModifiers.fireRateMul = 1 / 1.35;
    },
  }),
  precision_array: createWaveBonus({
    id: "precision_array",
    title: "Точная стрельба",
    description: "-35% к разбросу до конца следующей волны.",
    color: "#9fe7ff",
    rarity: "common",
    weight: 1,
    tags: ["precision", "control"],
    apply() {
      world.waveBonusModifiers.spreadMul = 0.65;
    },
  }),
  reinforced_plates: createWaveBonus({
    id: "reinforced_plates",
    title: "Усиленные пластины",
    description: "-30% входящего урона до конца следующей волны.",
    color: "#7cff93",
    rarity: "rare",
    weight: 0.96,
    tags: ["defense"],
    apply() {
      world.waveBonusModifiers.incomingDamageMul = 0.7;
    },
  }),
  combat_stim: createWaveBonus({
    id: "combat_stim",
    title: "Тренировка ног",
    description: "+35% к скорости перемещения до конца следующей волны.",
    color: "#8af2ff",
    rarity: "common",
    weight: 1,
    tags: ["mobility"],
    apply() {
      world.waveBonusModifiers.moveSpeedMul = 1.35;
    },
  }),
  stopping_power: createWaveBonus({
    id: "stopping_power",
    title: "Останавливающая сила",
    description: "Усиливает отбрасывание врагов от попаданий на одну волну.",
    color: "#ffd27d",
    rarity: "rare",
    weight: 0.94,
    tags: ["control", "offense"],
    apply() {
      world.waveBonusModifiers.knockbackMul = 1.65;
    },
  }),
  fragmentation: createWaveBonus({
    id: "fragmentation",
    title: "Фрагментация",
    description: "+2 дробины для дробовика до конца следующей волны.",
    color: "#ffc993",
    rarity: "epic",
    weight: 0.84,
    tags: ["weapon_shotgun", "offense"],
    isAvailable() {
      return player.weapon === "shotgun";
    },
    apply() {
      world.waveBonusModifiers.shotgunPelletsBonus = 2;
    },
  }),
  field_medicine: createWaveBonus({
    id: "field_medicine",
    title: "Полевая медицина",
    description: "Шанс выпадения аптечек заметно выше до конца следующей волны.",
    color: "#8fffb4",
    rarity: "common",
    weight: 0.94,
    tags: ["utility", "sustain"],
    apply() {
      world.waveBonusModifiers.medkitBias = 0.32;
    },
  }),
  scavenger: createWaveBonus({
    id: "scavenger",
    title: "Оружейный барон",
    description: "Повышает шанс выпадения оружия до конца следующей волны.",
    color: "#f4e08f",
    rarity: "common",
    weight: 0.95,
    tags: ["utility"],
    apply() {
      world.waveBonusModifiers.pickupChanceBonus = 0.11;
      world.waveBonusModifiers.weaponDropBonus = 0.05;
    },
  }),
  repair_kit: createWaveBonus({
    id: "repair_kit",
    title: "Ремкомплект",
    description: "Мгновенно восстанавливает часть здоровья перед стартом следующей волны.",
    color: "#7cff93",
    rarity: "common",
    weight: 0.88,
    persistent: false,
    tags: ["sustain", "defense"],
    isAvailable() {
      return player.health < player.maxHealth - 8;
    },
    apply() {
      player.health = Math.min(player.maxHealth, player.health + 38);
    },
  }),
  second_wind: createWaveBonus({
    id: "second_wind",
    title: "Второе дыхание",
    description: "Один раз за волну пережить смертельный урон и остаться с 25 HP.",
    color: "#ff92ae",
    rarity: "epic",
    weight: 0.82,
    tags: ["defense", "sustain"],
    apply() {
      world.waveBonusModifiers.secondWind = true;
      world.waveBonusModifiers.secondWindUsed = false;
    },
  }),
  piercing_core: createWaveBonus({
    id: "piercing_core",
    title: "Тяжелые пули",
    description: "+1 пробитие для пистолета и SMG, усиленное пробитие плазменной винтовки.",
    color: "#b6e4ff",
    rarity: "rare",
    weight: 0.88,
    tags: ["offense", "pierce", "weapon_pistol", "weapon_smg", "weapon_plasma"],
    apply() {
      world.waveBonusModifiers.flatPierceBonus = 1;
      world.waveBonusModifiers.plasmaPierceBonus = 1;
    },
  }),
  hunter_protocol: createWaveBonus({
    id: "hunter_protocol",
    title: "Протокол охоты",
    description: "Вызывает hunter drone на следующую волну или усиливает уже активного.",
    color: "#ff5cf4",
    rarity: "epic",
    weight: 0.74,
    tags: ["drone", "utility", "offense"],
    apply() {
      world.waveBonusModifiers.hunterProtocol = true;
      world.waveBonusModifiers.hunterDamageMul = 1.18;
    },
  }),
  berserk_drive: createWaveBonus({
    id: "berserk_drive",
    title: "Берсерк",
    description: "+45% к скорострельности, но разброс становится заметно выше.",
    color: "#ff8d57",
    rarity: "rare",
    weight: 0.92,
    tags: ["offense", "rapidfire"],
    apply() {
      world.waveBonusModifiers.fireRateMul = 1 / 1.45;
      world.waveBonusModifiers.spreadMul = 1.12;
    },
  }),
  cold_focus: createWaveBonus({
    id: "cold_focus",
    title: "Холодный расчет",
    description: "Сильно снижает разброс и ускоряет полет снарядов.",
    color: "#98dfff",
    rarity: "rare",
    weight: 0.9,
    tags: ["precision", "control"],
    apply() {
      world.waveBonusModifiers.spreadMul = 0.5;
      world.waveBonusModifiers.projectileSpeedMul = 1.18;
    },
  }),
  shock_lattice: createWaveBonus({
    id: "shock_lattice",
    title: "Снятие ограничений",
    description: "Плазменная винтовка бьет сильнее и оставляет более злой электрический импакт.",
    color: "#8ef3ff",
    rarity: "legendary",
    weight: 0.62,
    tags: ["weapon_plasma", "status", "offense"],
    apply() {
      world.waveBonusModifiers.plasmaDamageMul = 1.24;
      world.waveBonusModifiers.plasmaImpactMul = 1.5;
    },
  }),
  blast_padding: createWaveBonus({
    id: "blast_padding",
    title: "Амортизация",
    description: "Сильно снижает урон от взрывов до конца следующей волны.",
    color: "#ffd6a5",
    rarity: "rare",
    weight: 0.88,
    tags: ["defense", "explosive"],
    apply() {
      world.waveBonusModifiers.incomingExplosionDamageMul = 0.56;
    },
  }),
  blood_harvest: createWaveBonus({
    id: "blood_harvest",
    title: "Кровавая жатва",
    description: "Убийства иногда восстанавливают немного здоровья.",
    color: "#ff7a97",
    rarity: "rare",
    weight: 0.88,
    tags: ["sustain"],
    apply() {
      world.waveBonusModifiers.killHealChance = 0.24;
      world.waveBonusModifiers.killHealAmount = 4;
    },
  }),
  predator_rounds: createWaveBonus({
    id: "predator_rounds",
    title: "Реактивные пули",
    description: "Пистолет и SMG получают дополнительное пробитие.",
    color: "#d7e8ff",
    rarity: "rare",
    weight: 0.86,
    tags: ["pierce", "weapon_pistol", "weapon_smg", "offense"],
    apply() {
      world.waveBonusModifiers.flatPierceBonus = 1;
    },
  }),
  shockwave_shells: createWaveBonus({
    id: "shockwave_shells",
    title: "Ударная дробь",
    description: "Дробовик сильнее отбрасывает все, во что попадает.",
    color: "#ffcb7f",
    rarity: "rare",
    weight: 0.84,
    tags: ["weapon_shotgun", "control"],
    isAvailable() {
      return player.weapon === "shotgun";
    },
    apply() {
      world.waveBonusModifiers.shotgunKnockbackMul = 1.8;
    },
  }),
  light_frame: createWaveBonus({
    id: "light_frame",
    title: "Налегке",
    description: "Еще выше скорость движения и более быстрый откат рывка.",
    color: "#98f7ff",
    rarity: "common",
    weight: 0.94,
    tags: ["mobility", "utility"],
    apply() {
      world.waveBonusModifiers.moveSpeedMul = 1.48;
      world.waveBonusModifiers.dashCooldownMul = 0.72;
    },
  }),
  salvage_protocol: createWaveBonus({
    id: "salvage_protocol",
    title: "Протокол утилизации",
    description: "Медкиты и полезные дропы появляются заметно чаще.",
    color: "#f3e5a0",
    rarity: "common",
    weight: 0.92,
    tags: ["utility", "sustain"],
    apply() {
      world.waveBonusModifiers.pickupChanceBonus = 0.12;
      world.waveBonusModifiers.medkitBias = 0.24;
      world.waveBonusModifiers.weaponDropBonus = 0.03;
    },
  }),
  overcharged_core: createWaveBonus({
    id: "overcharged_core",
    title: "Перегрузка ядра",
    description: "Плазменная винтовка бьет еще сильнее, но стреляет чуть медленнее.",
    color: "#9ee8ff",
    rarity: "epic",
    weight: 0.78,
    tags: ["weapon_plasma", "offense"],
    apply() {
      world.waveBonusModifiers.plasmaDamageMul = 1.42;
      world.waveBonusModifiers.railFireRateMul = 1.18;
    },
  }),
  sentry_link: createWaveBonus({
    id: "sentry_link",
    title: "Дроновод",
    description: "Hunter drone гарантированно выходит в бой и работает заметно агрессивнее.",
    color: "#ff83f2",
    rarity: "epic",
    weight: 0.74,
    tags: ["drone", "offense", "utility"],
    apply() {
      world.waveBonusModifiers.hunterProtocol = true;
      world.waveBonusModifiers.hunterDamageMul = 1.55;
    },
  }),
  execution_window: createWaveBonus({
    id: "execution_window",
    title: "Добивающий",
    description: "Враги с низким запасом HP получают заметно больше урона.",
    color: "#ffb4bd",
    rarity: "rare",
    weight: 0.86,
    tags: ["crit", "offense"],
    apply() {
      world.waveBonusModifiers.executionThreshold = 0.35;
      world.waveBonusModifiers.executionDamageMul = 1.45;
    },
  }),
  deadeye_routine: createWaveBonus({
    id: "deadeye_routine",
    title: "Протокол «Точный выстрел»",
    description: "Каждый пятый выстрел из пистолета наносит усиленный урон и пробивает цель.",
    color: "#d6e9ff",
    rarity: "rare",
    weight: 0.82,
    tags: ["weapon_pistol", "precision", "offense"],
    isAvailable() {
      return player.weapon === "pistol";
    },
    apply() {
      world.waveBonusModifiers.pistolDeadeyeEvery = 5;
      world.waveBonusModifiers.pistolDeadeyeCounter = 0;
      world.waveBonusModifiers.pistolDeadeyeDamageMul = 1.9;
      world.waveBonusModifiers.pistolDeadeyePierceBonus = 1;
    },
  }),
  quick_draw: createWaveBonus({
    id: "quick_draw",
    title: "Быстрый хват",
    description: "Скорость стрельбы пистолета увеличена.",
    color: "#ffd9a0",
    rarity: "common",
    weight: 0.9,
    tags: ["weapon_pistol", "rapidfire"],
    isAvailable() {
      return player.weapon === "pistol";
    },
    apply() {
      world.waveBonusModifiers.pistolFireRateMul = 0.78;
    },
  }),
  feed_stabilizer: createWaveBonus({
    id: "feed_stabilizer",
    title: "Стабилизатор подачи",
    description: "Разброс SMG уменьшается при стрельбе.",
    color: "#a7ebff",
    rarity: "common",
    weight: 0.88,
    tags: ["weapon_smg", "control"],
    isAvailable() {
      return player.weapon === "smg";
    },
    apply() {
      world.waveBonusModifiers.smgSpreadMul = 0.62;
    },
  }),
  buckshot_array: createWaveBonus({
    id: "buckshot_array",
    title: "Картечный блок",
    description: "Дробовик выпускает больше снарядов.",
    color: "#ffd39a",
    rarity: "rare",
    weight: 0.8,
    tags: ["weapon_shotgun", "offense"],
    isAvailable() {
      return player.weapon === "shotgun";
    },
    apply() {
      world.waveBonusModifiers.shotgunPelletsBonus += 2;
    },
  }),
  ionized_core: createWaveBonus({
    id: "ionized_core",
    title: "Ионизированное ядро",
    description: "Плазма наносит больше урона.",
    color: "#92f3ff",
    rarity: "rare",
    weight: 0.8,
    tags: ["weapon_plasma", "offense"],
    isAvailable() {
      return player.weapon === "rail";
    },
    apply() {
      world.waveBonusModifiers.plasmaDamageMul *= 1.18;
    },
  }),
  overpressure: createWaveBonus({
    id: "overpressure",
    title: "Избыточное давление",
    description: "Общий урон увеличен.",
    color: "#ffbe86",
    rarity: "rare",
    weight: 0.84,
    tags: ["offense"],
    apply() {
      world.waveBonusModifiers.globalDamageMul = 1.14;
    },
  }),
  trauma_gel: createWaveBonus({
    id: "trauma_gel",
    title: "Травмогель",
    description: "После урона вы временно получаете защиту.",
    color: "#9dffd7",
    rarity: "rare",
    weight: 0.78,
    tags: ["defense"],
    apply() {
      world.waveBonusModifiers.traumaGel = true;
      world.waveBonusModifiers.traumaGelReduction = 0.64;
    },
  }),
  scavenger_teeth: createWaveBonus({
    id: "scavenger_teeth",
    title: "Инстинкт падальщика",
    description: "Повышен шанс дропа.",
    color: "#efe197",
    rarity: "common",
    weight: 0.9,
    tags: ["utility"],
    apply() {
      world.waveBonusModifiers.pickupChanceBonus = Math.max(world.waveBonusModifiers.pickupChanceBonus, 0.09);
    },
  }),
  drone_link: createWaveBonus({
    id: "drone_link",
    title: "Связь с дроном",
    description: "Дрон стреляет чаще.",
    color: "#ff90f5",
    rarity: "rare",
    weight: 0.78,
    tags: ["drone"],
    apply() {
      world.waveBonusModifiers.hunterProtocol = true;
      world.waveBonusModifiers.hunterDamageMul = Math.max(world.waveBonusModifiers.hunterDamageMul, 1.28);
    },
  }),
};

const synergies = {
  bullet_storm: {
    id: "bullet_storm",
    title: "Пулевой шторм",
    description: "Поток огня усиливается. Периодически появляется дополнительный выстрел.",
    hintTags: ["rapidfire", "offense", "weapon_pistol", "weapon_smg"],
    requirements: [
      { tag: "rapidfire", count: 1 },
      { tag: "offense", count: 2 },
    ],
    condition(tags) {
      return (tags.rapidfire || 0) >= 1 && (tags.offense || 0) >= 2;
    },
  },
  shock_corridor: {
    id: "shock_corridor",
    title: "Шоковый коридор",
    description: "Плазма пробивает цели и вызывает цепные разряды.",
    hintTags: ["weapon_plasma", "pierce", "offense"],
    requirements: [
      { tag: "weapon_plasma", count: 1 },
      { tag: "pierce", count: 1 },
      { tag: "offense", count: 1 },
    ],
    condition(tags) {
      return (tags.weapon_plasma || 0) >= 1 && (tags.pierce || 0) >= 1 && (tags.offense || 0) >= 1;
    },
  },
  crowd_control: {
    id: "crowd_control",
    title: "Контроль толпы",
    description: "Дробовик сильнее замедляет и отбрасывает врагов.",
    hintTags: ["control", "weapon_shotgun"],
    requirements: [
      { tag: "control", count: 1 },
      { tag: "weapon_shotgun", count: 1 },
    ],
    condition(tags) {
      return (tags.control || 0) >= 1 && (tags.weapon_shotgun || 0) >= 1;
    },
  },
  scavenger_loop: {
    id: "scavenger_loop",
    title: "Цикл падальщика",
    description: "Убийства чаще дают ресурсы и шанс восстановления.",
    hintTags: ["utility", "sustain"],
    requirements: [
      { tag: "utility", count: 1 },
      { tag: "sustain", count: 1 },
    ],
    condition(tags) {
      return (tags.utility || 0) >= 1 && (tags.sustain || 0) >= 1;
    },
  },
  hunter_swarm: {
    id: "hunter_swarm",
    title: "Рой охотников",
    description: "Дроны усиливаются и стреляют чаще.",
    hintTags: ["drone", "offense"],
    requirements: [
      { tag: "drone", count: 1 },
      { tag: "offense", count: 1 },
    ],
    condition(tags) {
      return (tags.drone || 0) >= 1 && (tags.offense || 0) >= 1;
    },
  },
};

function currentWaveBonusData() {
  return world.activeWaveBonus ? waveBonuses[world.activeWaveBonus] || null : null;
}

function resetWaveBonusModifiers() {
  world.waveBonusModifiers = baseWaveBonusModifiers();
}

function labelForBuildTag(tag) {
  return t(`tag.${tag}`);
}

function weaponLabel(id) {
  return t(`weapon.${id}`);
}

function bossLabel(boss) {
  const id = typeof boss === "string" ? boss : boss?.id;
  return t(`boss.${id}`);
}

function bossDisplayName(boss) {
  if (!boss) return t("boss.unknown");
  const id = boss.bossId || boss.id || boss.kind || "";
  const key = id ? `boss.${id}` : "";
  const translated = key ? t(key) : "";
  if (translated && translated !== key) return translated;
  return boss.label || boss.name || id || t("boss.unknown");
}

function bonusTitle(bonus) {
  return t(`bonus.${bonus.id}.title`);
}

function bonusDescription(bonus) {
  return t(`bonus.${bonus.id}.description`);
}

function bonusRarityLabel(bonus) {
  return t(`rarity.${bonus.rarity}`);
}

function synergyTitle(synergy) {
  const id = typeof synergy === "string" ? synergy : synergy?.id;
  return t(`synergy.${id}.title`);
}

function synergyDescription(synergy) {
  const id = typeof synergy === "string" ? synergy : synergy?.id;
  return t(`synergy.${id}.description`);
}

function getSynergyRequirements(synergy) {
  return Array.isArray(synergy?.requirements) ? synergy.requirements : [];
}

function getSynergyRequirementProgress(synergy, tags = world.buildTagsCounter) {
  return getSynergyRequirements(synergy).map((requirement) => {
    const have = tags[requirement.tag] || 0;
    const needed = requirement.count || 1;

    return {
      tag: requirement.tag,
      have,
      needed,
      complete: have >= needed,
      label: labelForBuildTag(requirement.tag),
    };
  });
}

function getSynergyProgressRatio(synergy, tags = world.buildTagsCounter) {
  const progress = getSynergyRequirementProgress(synergy, tags);
  if (!progress.length) return 0;

  const completedUnits = progress.reduce((sum, item) => (
    sum + Math.min(item.have, item.needed)
  ), 0);

  const requiredUnits = progress.reduce((sum, item) => sum + item.needed, 0);

  return requiredUnits > 0 ? completedUnits / requiredUnits : 0;
}

function getSynergyProgressText(synergy, tags = world.buildTagsCounter) {
  const progress = getSynergyRequirementProgress(synergy, tags);
  const completedUnits = progress.reduce((sum, item) => (
    sum + Math.min(item.have, item.needed)
  ), 0);
  const requiredUnits = progress.reduce((sum, item) => sum + item.needed, 0);

  return t("synergyGuide.progress", {
    current: completedUnits,
    total: requiredUnits,
  });
}

function metaUpgradeTitle(upgrade) {
  return t(`metaUpgrade.${upgrade.id}.title`);
}

function metaUpgradeDescription(upgrade) {
  return t(`metaUpgrade.${upgrade.id}.description`);
}

function displayLeaderboardName(name) {
  const normalized = typeof name === "string" ? name.trim() : "";
  return normalized && normalized !== "Игрок" && normalized !== "Player"
    ? normalized
    : t("leaderboard.defaultPlayer");
}

function getWaveBonusBuildBias(bonus) {
  if (!bonus?.tags?.length) return 1;
  let bias = 1;
  for (const tag of bonus.tags) {
    const count = world.buildTagsCounter[tag] || 0;
    if (!count) continue;
    const step = tag.startsWith("weapon_")
      ? 0.14
      : ["offense", "defense", "mobility", "utility", "control"].includes(tag)
        ? 0.07
        : 0.1;
    bias += step * Math.min(2, count);
  }
  if (bonus.tags.some((tag) => (world.buildTagsCounter[tag] || 0) >= 2)) bias += 0.08;
  return Math.min(1.42, bias);
}

function buildPerkHintText() {
  return world.activeSynergies.length
    ? t("perk.hint.active")
    : t("perk.hint.default");
}

function simulateTagsWithBonus(bonus) {
  const tags = { ...world.buildTagsCounter };
  for (const tag of bonus?.tags || []) {
    tags[tag] = (tags[tag] || 0) + 1;
  }
  return tags;
}

function getBonusSynergyHints(bonus) {
  if (!hasSynergyScanner()) return [];

  const bonusTags = bonus?.tags || [];
  const simulatedTags = simulateTagsWithBonus(bonus);

  return Object.values(synergies)
    .filter((synergy) => !world.activeSynergies.includes(synergy.id))
    .map((synergy) => {
      const activates = synergy.condition(simulatedTags, [...world.acquiredRunBonuses, bonus.id]);
      const contributes = (synergy.hintTags || []).some((tag) => bonusTags.includes(tag));

      if (!activates && !contributes) return null;

      return {
        id: synergy.id,
        title: synergyTitle(synergy),
        activates,
      };
    })
    .filter(Boolean)
    .slice(0, 2);
}

function getBonusSynergyActivationHints(bonus) {
  if (!bonus) return [];

  const simulatedTags = simulateTagsWithBonus(bonus);
  const simulatedBonuses = [...world.acquiredRunBonuses, bonus.id];

  return Object.values(synergies)
    .filter((synergy) => !world.activeSynergies.includes(synergy.id))
    .filter((synergy) => {
      const activeNow = synergy.condition(world.buildTagsCounter, world.acquiredRunBonuses);
      const activeAfter = synergy.condition(simulatedTags, simulatedBonuses);
      return !activeNow && activeAfter;
    })
    .map((synergy) => ({
      id: synergy.id,
      title: synergyTitle(synergy),
    }));
}

function showSynergyToast(synergyId) {
  if (!synergyId) return;
  if (!world.pendingSynergyAnnouncements.includes(synergyId)) {
    world.pendingSynergyAnnouncements.push(synergyId);
  }
}

function queueSynergyToast(synergyId) {
  const synergy = synergies[synergyId];
  if (!synergy) return;

  queueAnnouncement({
    kind: "synergy",
    id: synergy.id,
    title: synergyTitle(synergy),
    subtitle: t("synergy.toast"),
    duration: 2.35,
    accent: "#ffbf4a",
  });
}

function queueBossWarning(bossName) {
  queueAnnouncement({
    kind: "boss",
    title: t("bossWarning.title"),
    subtitle: t("bossWarning.subtitle"),
    bossName: bossName || t("boss.unknown"),
    duration: 3.1,
    accent: "#ff243d",
  });
}

function loadAchievementState() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return defaultAchievementState();

    const parsed = JSON.parse(raw);
    return {
      unlocked: parsed?.unlocked && typeof parsed.unlocked === "object" ? parsed.unlocked : {},
      counters: {
        kills: Number(parsed?.counters?.kills) || 0,
        swarmKills: Number(parsed?.counters?.swarmKills) || 0,
        barrelsDestroyed: Number(parsed?.counters?.barrelsDestroyed) || 0,
      },
    };
  } catch (error) {
    console.warn("Failed to load achievements", error);
    return defaultAchievementState();
  }
}

function saveAchievementState() {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievementState));
  } catch (error) {
    console.warn("Failed to save achievements", error);
  }
}

function cloneAchievementState(state = achievementState) {
  return {
    unlocked: { ...(state?.unlocked || {}) },
    counters: {
      kills: Number(state?.counters?.kills) || 0,
      swarmKills: Number(state?.counters?.swarmKills) || 0,
      barrelsDestroyed: Number(state?.counters?.barrelsDestroyed) || 0,
    },
  };
}

function restoreRunAchievementSnapshot() {
  if (!world.achievementStateSnapshot) return;
  achievementState = cloneAchievementState(world.achievementStateSnapshot);
  world.achievementToastQueue = [];
  world.achievementToastActive = false;
  if (achievementToastRoot) achievementToastRoot.innerHTML = "";
  saveAchievementState();
  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
}

function isAchievementUnlocked(id) {
  return Boolean(achievementState.unlocked?.[id]);
}

function getAchievementDefinition(id) {
  return achievementDefinitions.find((definition) => definition.id === id);
}

function achievementTitle(definitionOrId) {
  const id = typeof definitionOrId === "string" ? definitionOrId : definitionOrId.id;
  return t(`achievement.${id}.title`);
}

function achievementDescription(definitionOrId) {
  const id = typeof definitionOrId === "string" ? definitionOrId : definitionOrId.id;
  return t(`achievement.${id}.description`);
}

function achievementIconStyle(definition) {
  const index = Math.max(0, Math.min(15, Number(definition?.iconIndex) || 0));
  const col = index % 4;
  const row = Math.floor(index / 4);
  return `--icon-col:${col}; --icon-row:${row};`;
}

function unlockAchievement(id) {
  if (world.cheatsUsed) return false;
  const definition = getAchievementDefinition(id);
  if (!definition || isAchievementUnlocked(id)) return false;

  achievementState.unlocked[id] = {
    unlockedAt: Date.now(),
  };

  saveAchievementState();
  queueAchievementToast(definition);

  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }

  return true;
}

function queueAchievementToast(definition) {
  if (!definition || !achievementToastRoot) return;

  world.achievementToastQueue.push(definition);
  showNextAchievementToast();
}

function showNextAchievementToast() {
  if (world.achievementToastActive || !achievementToastRoot) return;

  const definition = world.achievementToastQueue.shift();
  if (!definition) return;

  world.achievementToastActive = true;
  achievementToastRoot.innerHTML = (
    `<div class="achievement-toast">`
    + `<div class="achievement-toast-icon achievement-icon-sheet" style="${achievementIconStyle(definition)}"></div>`
    + `<div>`
    + `<span class="achievement-toast-kicker">${escapeHtml(t("achievements.toastUnlocked"))}</span>`
    + `<h3>${escapeHtml(achievementTitle(definition))}</h3>`
    + `<p>${escapeHtml(achievementDescription(definition))}</p>`
    + `</div>`
    + `</div>`
  );

  window.setTimeout(() => {
    achievementToastRoot.innerHTML = "";
    world.achievementToastActive = false;
    showNextAchievementToast();
  }, 4100);
}

function getRunAchievementCounter(counter) {
  if (counter === "runSwarmKills") return world.runSwarmKills || 0;
  if (counter === "runBarrelsDestroyed") return world.runBarrelsDestroyed || 0;
  if (counter === "runSynergiesActivated") return world.runSynergiesActivated || 0;
  return 0;
}

function getAchievementProgress(definition) {
  if (isAchievementUnlocked(definition.id)) {
    return {
      current: definition.target || 1,
      target: definition.target || 1,
      ratio: 1,
    };
  }

  if (definition.progressType === "counter") {
    const current = Number(achievementState.counters?.[definition.counter]) || 0;
    const target = definition.target || 1;
    return {
      current: Math.min(current, target),
      target,
      ratio: Math.min(1, current / target),
    };
  }

  if (definition.progressType === "tierCounter") {
    const total = Number(achievementState.counters?.[definition.counter]) || 0;
    const from = definition.from || 0;
    const target = definition.target || 1;
    const stageTarget = Math.max(1, target - from);
    const current = Math.max(0, Math.min(stageTarget, total - from));
    return {
      current,
      target: stageTarget,
      ratio: Math.min(1, current / stageTarget),
    };
  }

  if (definition.progressType === "runWave") {
    const current = Math.min(world.runClearedWaves || 0, definition.target || 1);
    const target = definition.target || 1;
    return {
      current,
      target,
      ratio: Math.min(1, current / target),
    };
  }

  if (definition.progressType === "weaponStreak") {
    const current = world.runWeaponStreak?.weapon === definition.weapon
      ? Math.min(world.runWeaponStreak.clearedWaves || 0, definition.target || 1)
      : 0;
    const target = definition.target || 1;
    return {
      current,
      target,
      ratio: Math.min(1, current / target),
    };
  }

  if (definition.progressType === "runCounter") {
    const current = Math.min(getRunAchievementCounter(definition.counter), definition.target || 1);
    const target = definition.target || 1;
    return {
      current,
      target,
      ratio: Math.min(1, current / target),
    };
  }

  return {
    current: 0,
    target: 1,
    ratio: 0,
  };
}

function formatAchievementDate(timestamp) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(getLanguage() === "ru" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

function renderAchievementsOverlay() {
  if (!achievementsList) return;

  const unlockedCount = achievementDefinitions.filter((definition) => isAchievementUnlocked(definition.id)).length;
  const totalCount = achievementDefinitions.length;

  if (achievementsUnlockedCount) achievementsUnlockedCount.textContent = `${unlockedCount} / ${totalCount}`;
  if (achievementsTotalKills) achievementsTotalKills.textContent = String(achievementState.counters.kills || 0);
  if (achievementsSwarmKills) achievementsSwarmKills.textContent = String(achievementState.counters.swarmKills || 0);
  if (achievementsBarrelsDestroyed) achievementsBarrelsDestroyed.textContent = String(achievementState.counters.barrelsDestroyed || 0);

  achievementsList.innerHTML = achievementDefinitions.map((definition) => {
    const unlocked = isAchievementUnlocked(definition.id);
    const progress = getAchievementProgress(definition);
    const unlockedAt = unlocked ? achievementState.unlocked[definition.id]?.unlockedAt : null;
    const progressText = unlocked
      ? t("achievements.completed")
      : t("achievements.progress", { current: progress.current, total: progress.target });
    const unlockedText = unlocked && unlockedAt
      ? `<span class="achievement-unlocked-at">${escapeHtml(t("achievements.unlockedAt", {
          date: formatAchievementDate(unlockedAt),
        }))}</span>`
      : "";

    return (
      `<article class="achievement-card${unlocked ? " unlocked" : ""}">`
      + `<div class="achievement-icon achievement-icon-sheet" style="${achievementIconStyle(definition)}"></div>`
      + `<div class="achievement-content">`
      + `<div class="achievement-card-head">`
      + `<h3>${escapeHtml(achievementTitle(definition))}</h3>`
      + `<span class="achievement-status">${escapeHtml(unlocked ? t("achievements.statusUnlocked") : t("achievements.statusLocked"))}</span>`
      + `</div>`
      + `<p class="achievement-description">${escapeHtml(achievementDescription(definition))}</p>`
      + `<div class="achievement-progress" aria-hidden="true">`
      + `<div class="achievement-progress-fill" style="--progress:${Math.round(progress.ratio * 100)}%"></div>`
      + `</div>`
      + `<span class="achievement-progress-text">${escapeHtml(progressText)}</span>`
      + unlockedText
      + `</div>`
      + `</article>`
    );
  }).join("");
}

function openAchievementsOverlay() {
  renderAchievementsOverlay();
  achievementsOverlay?.classList.add("visible");
}

function closeAchievementsOverlay() {
  achievementsOverlay?.classList.remove("visible");
}

function resetRunAchievementStats() {
  world.runSwarmKills = 0;
  world.runBarrelsDestroyed = 0;
  world.runSynergiesActivated = 0;
  world.runClearedWaves = 0;
  world.damageTakenThisWave = 0;
  world.runWeaponStreak = {
    weapon: player.weapon || "pistol",
    clearedWaves: 0,
  };
}

function isSwarmEnemy(foe) {
  return foe?.type === "swarm"
    || foe?.kind === "swarm"
    || foe?.id === "swarm"
    || foe?.enemyType === "swarm"
    || foe?.role === "swarm";
}

function trackEnemyKilledForAchievements(foe) {
  if (world.cheatsUsed) return;
  achievementState.counters.kills = (achievementState.counters.kills || 0) + 1;
  unlockAchievement("first_blood");

  if (isSwarmEnemy(foe)) {
    achievementState.counters.swarmKills = (achievementState.counters.swarmKills || 0) + 1;
    world.runSwarmKills = (world.runSwarmKills || 0) + 1;
    if (achievementState.counters.swarmKills >= 1000) unlockAchievement("exterminator");
    if (world.runSwarmKills >= 250) unlockAchievement("bad_day_swarm");
  }

  const totalKills = achievementState.counters.kills || 0;
  if (totalKills >= 2500) unlockAchievement("beginner");
  if (totalKills >= 5000) unlockAchievement("experienced_killer");
  if (totalKills >= 10000) unlockAchievement("death_machine");

  if (foe?.boss || foe?.bossId || foe?.isBoss) {
    unlockAchievement("giant_down");
  }

  saveAchievementState();

  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
}

function trackPlayerDamagedForAchievements(amount = 1) {
  if (world.cheatsUsed) return;
  if ((Number(amount) || 0) <= 0) return;
  world.damageTakenThisWave = (world.damageTakenThisWave || 0) + Math.max(0, Number(amount) || 0);
}

function trackBarrelDestroyedForAchievements() {
  if (world.cheatsUsed) return;
  achievementState.counters.barrelsDestroyed = (achievementState.counters.barrelsDestroyed || 0) + 1;
  world.runBarrelsDestroyed = (world.runBarrelsDestroyed || 0) + 1;

  if (achievementState.counters.barrelsDestroyed >= 100) unlockAchievement("hate_barrels");
  if (world.runBarrelsDestroyed >= 10) unlockAchievement("dont_touch_that");

  saveAchievementState();

  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
}

function trackWaveStartedForAchievements() {
  world.damageTakenThisWave = 0;
}

function trackWaveClearedForAchievements(clearedWave) {
  if (world.cheatsUsed) return;
  const waveNumber = Number(clearedWave) || world.wave || 0;
  world.runClearedWaves = Math.max(world.runClearedWaves || 0, waveNumber);
  if (waveNumber >= 5) unlockAchievement("first_line");
  if (waveNumber >= 12) unlockAchievement("twelfth_line");

  if ((world.damageTakenThisWave || 0) <= 0) {
    unlockAchievement("elusive");
  }

  const currentWeapon = player.weapon || "pistol";
  if (!world.runWeaponStreak || world.runWeaponStreak.weapon !== currentWeapon) {
    world.runWeaponStreak = {
      weapon: currentWeapon,
      clearedWaves: 0,
    };
  }

  world.runWeaponStreak.clearedWaves += 1;
  if (currentWeapon === "pistol" && world.runWeaponStreak.clearedWaves >= 12) unlockAchievement("mr_wick");
  if (currentWeapon === "shotgun" && world.runWeaponStreak.clearedWaves >= 12) unlockAchievement("gauge_fury");

  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
}

function trackWeaponChangedForAchievements(weaponId) {
  if (world.cheatsUsed) return;
  world.runWeaponStreak = {
    weapon: weaponId || player.weapon || "pistol",
    clearedWaves: 0,
  };

  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
}

function trackSynergyActivatedForAchievements(synergyId) {
  if (world.cheatsUsed) return;
  if (!synergyId) return;

  world.runSynergiesActivated = Math.max(
    world.runSynergiesActivated || 0,
    Array.isArray(world.activeSynergies) ? world.activeSynergies.length : 0,
  );

  if (world.runSynergiesActivated >= 1) unlockAchievement("synergy_online");
  if (world.runSynergiesActivated >= 3) unlockAchievement("war_engineer");

  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
}

function recomputeActiveSynergies() {
  const previous = new Set(world.activeSynergies);
  world.activeSynergies = Object.values(synergies)
    .filter((synergy) => synergy.condition(world.buildTagsCounter, world.acquiredRunBonuses))
    .map((synergy) => synergy.id);
  const newlyActivated = world.activeSynergies.filter((id) => !previous.has(id));
  console.log("[build] activeSynergies:", [...world.activeSynergies]);
  console.log(
    "[build] synergyTitles:",
    world.activeSynergies.map((id) => synergyTitle(id)),
  );
  if (newlyActivated.length) console.log("[build] newlyActivatedSynergies:", [...newlyActivated]);
  console.log("[build] buildTagsCounter:", { ...world.buildTagsCounter });
  for (const synergyId of newlyActivated) {
    trackSynergyActivatedForAchievements(synergyId);
  }
  return newlyActivated;
}

function hasSynergy(id) {
  return world.activeSynergies.includes(id);
}

function registerRunBonusSelection(bonus) {
  if (!bonus) return;
  world.acquiredRunBonuses.push(bonus.id);
  world.runBonusHistory.push({
    id: bonus.id,
    title: bonusTitle(bonus),
    tags: [...(bonus.tags || [])],
    wave: world.wave,
  });
  for (const tag of bonus.tags || []) {
    world.buildTagsCounter[tag] = (world.buildTagsCounter[tag] || 0) + 1;
  }
  console.log("[build] acquiredRunBonuses:", [...world.acquiredRunBonuses]);
  console.log("[build] buildTagsCounter:", { ...world.buildTagsCounter });
  return recomputeActiveSynergies();
}

function buildWaveBonusChoices() {
  const targetCount = getWaveBonusChoiceCount();
  const all = Object.values(waveBonuses);
  let pool = all.filter((bonus) => !bonus.isAvailable || bonus.isAvailable());
  if (!pool.length) pool = all;
  const picks = [];
  const available = [...pool];
  const perkBias = getMetaPerkBiasFactor();
  while (available.length && picks.length < targetCount) {
    const totalWeight = available.reduce((sum, bonus) => {
      const rarityBias = bonus.rarity === "legendary" ? perkBias * 1.25 : bonus.rarity === "epic" ? perkBias * 1.12 : bonus.rarity === "rare" ? perkBias * 1.05 : 1;
      const buildBias = getWaveBonusBuildBias(bonus);
      return sum + ((bonus.weight || 1) * (bonus.chanceWeight || 1) * rarityBias * buildBias);
    }, 0);
    let roll = Math.random() * totalWeight;
    let choiceIndex = 0;
    for (let i = 0; i < available.length; i += 1) {
      const bonus = available[i];
      const rarityBias = bonus.rarity === "legendary" ? perkBias * 1.25 : bonus.rarity === "epic" ? perkBias * 1.12 : bonus.rarity === "rare" ? perkBias * 1.05 : 1;
      const buildBias = getWaveBonusBuildBias(bonus);
      roll -= (bonus.weight || 1) * (bonus.chanceWeight || 1) * rarityBias * buildBias;
      if (roll <= 0) {
        choiceIndex = i;
        break;
      }
    }
    picks.push(available[choiceIndex]);
    available.splice(choiceIndex, 1);
  }
  return picks;
}

function renderPerkControls() {
  if (!perkControls) return;

  const capacity = world.perkRerollCapacity || 0;

  if (capacity <= 0) {
    perkControls.classList.add("hidden");
    perkControls.innerHTML = "";
    return;
  }

  const left = Math.max(0, world.perkRerollsLeft || 0);
  const disabled = left <= 0;

  perkControls.classList.remove("hidden");
  perkControls.innerHTML = `
    <div class="perk-controls-inner">
      <span class="perk-reroll-counter">${escapeHtml(t("perk.rerollsLeft", { count: left }))}</span>
      <button class="perk-reroll-button" type="button" data-perk-reroll ${disabled ? "disabled" : ""}>
        ${escapeHtml(t("perk.reroll"))}
      </button>
    </div>
  `;
}

function renderSynergyGuide() {
  if (!synergyGuideList) return;

  const hasRunProgress = world.state === "playing"
    || world.state === "wave_clear"
    || world.state === "perk_select"
    || world.state === "paused"
    || world.acquiredRunBonuses.length > 0;

  synergyGuideList.innerHTML = Object.values(synergies).map((synergy) => {
    const active = world.activeSynergies.includes(synergy.id);
    const progress = getSynergyRequirementProgress(synergy);
    const ratio = hasRunProgress ? getSynergyProgressRatio(synergy) : 0;
    const progressText = hasRunProgress
      ? getSynergyProgressText(synergy)
      : t("synergyGuide.noRunProgress");

    const requirements = progress.map((item) => (
      `<span class="synergy-guide-requirement${item.complete ? " complete" : ""}">`
      + `<strong>${escapeHtml(item.label)}</strong>`
      + `<span>${hasRunProgress ? `${item.have}/${item.needed}` : item.needed}</span>`
      + `</span>`
    )).join("");

    return (
      `<article class="synergy-guide-card${active ? " active" : ""}">`
      + `<div class="synergy-guide-card-head">`
      + `<h3>${escapeHtml(synergyTitle(synergy))}</h3>`
      + `<span class="synergy-guide-status">${escapeHtml(active ? t("synergyGuide.statusActive") : t("synergyGuide.statusLocked"))}</span>`
      + `</div>`
      + `<p class="synergy-guide-description">${escapeHtml(synergyDescription(synergy))}</p>`
      + `<div class="synergy-guide-requirements">${requirements}</div>`
      + `<div class="synergy-guide-progress" aria-hidden="true">`
      + `<div class="synergy-guide-progress-fill" style="--progress:${Math.round(ratio * 100)}%"></div>`
      + `</div>`
      + `<span class="synergy-guide-progress-text">${escapeHtml(progressText)}</span>`
      + `</article>`
    );
  }).join("");
}

function openSynergyGuideOverlay() {
  renderSynergyGuide();
  synergyGuideOverlay?.classList.add("visible");
}

function closeSynergyGuideOverlay() {
  synergyGuideOverlay?.classList.remove("visible");
}

function renderWaveBonusSelection() {
  if (!perkChoices) return;
  if (perkHint) perkHint.textContent = buildPerkHintText();
  const hasFourChoices = world.pendingWaveBonuses.length >= 4;
  perkChoices.classList.toggle("has-four", hasFourChoices);
  perkPanel?.classList.toggle("has-four-choices", hasFourChoices);
  renderPerkControls();
  perkChoices.innerHTML = world.pendingWaveBonuses.map((bonus, index) => {
    const activationHints = getBonusSynergyActivationHints(bonus);
    const synergyHints = getBonusSynergyHints(bonus);
    const synergyHint = activationHints.length
      ? `<div class="perk-synergy-hint perk-synergy-hint-activates">${escapeHtml(t("perk.synergyHintActivates", {
        names: activationHints.map((hint) => hint.title).join(", "),
      }))}</div>`
      : synergyHints.length
        ? `<div class="perk-synergy-hint">${escapeHtml(t(
          synergyHints.some((hint) => hint.activates) ? "perk.synergyHintActivates" : "perk.synergyHint",
          { names: synergyHints.map((hint) => hint.title).join(", ") },
        ))}</div>`
      : "";

    return (
      `<button class="perk-card rarity-${bonus.rarity}${activationHints.length ? " synergy-finisher" : ""}" type="button" data-bonus-id="${bonus.id}" style="--perk-accent:${bonus.color};--perk-border:${bonus.borderColor};--perk-glow:${bonus.glowColor};--perk-delay:${index * 80}ms">`
      + `<div class="perk-card-head">`
      + `<span class="perk-rarity-badge">${escapeHtml(bonusRarityLabel(bonus))}</span>`
      + `</div>`
      + `<strong>${escapeHtml(bonusTitle(bonus))}</strong>`
      + `<span>${escapeHtml(bonusDescription(bonus))}</span>`
      + `<div class="perk-tag-row">${(bonus.tags || []).slice(0, 4).map((tag) => `<span class="perk-build-tag">${escapeHtml(labelForBuildTag(tag))}</span>`).join("")}</div>`
      + synergyHint
      + "</button>"
    );
  }).join("");
  renderPerkSynergies();
}

function renderPerkSynergies() {
  if (!perkSynergyPanel) return;
  const activeSynergies = world.activeSynergies.map((id) => synergies[id]).filter(Boolean);

  if (!activeSynergies.length) {
    world.expandedPerkSynergyId = null;
    perkSynergyPanel.classList.add("hidden");
    perkSynergyPanel.innerHTML = "";
    return;
  }

  perkSynergyPanel.classList.remove("hidden");
  const expanded = synergies[world.expandedPerkSynergyId] || null;
  const chips = activeSynergies.map((synergy) => (
    `<button class="perk-synergy-chip${synergy.id === world.expandedPerkSynergyId ? " active" : ""}" type="button" data-perk-synergy-id="${escapeHtml(synergy.id)}">`
    + `${escapeHtml(synergyTitle(synergy))}`
    + "</button>"
  )).join("");
  const description = expanded
    ? `<div class="perk-synergy-description"><strong>${escapeHtml(synergyTitle(expanded))}</strong><span>${escapeHtml(synergyDescription(expanded))}</span></div>`
    : "";

  perkSynergyPanel.innerHTML = (
    `<div class="perk-synergy-title">${escapeHtml(t("perk.activeSynergies"))}</div>`
    + `<div class="perk-synergy-list">${chips}</div>`
    + description
  );
}

function togglePerkSynergyDescription(id) {
  if (!id || !synergies[id]) return;
  world.expandedPerkSynergyId = world.expandedPerkSynergyId === id ? null : id;
  renderPerkSynergies();
}

function closeWaveBonusSelection() {
  if (perkOverlay) perkOverlay.classList.remove("visible");
  if (perkChoices) {
    perkChoices.classList.remove("has-four");
    perkChoices.innerHTML = "";
  }
  if (perkControls) {
    perkControls.classList.add("hidden");
    perkControls.innerHTML = "";
  }
  if (perkSynergyPanel) {
    perkSynergyPanel.classList.add("hidden");
    perkSynergyPanel.innerHTML = "";
  }
  if (perkHint) perkHint.textContent = t("perk.hint.default");
  world.expandedPerkSynergyId = null;
  world.pendingWaveBonuses = [];
}

function rerollWaveBonusChoices() {
  if (world.state !== "perk_select") return false;
  if ((world.perkRerollsLeft || 0) <= 0) return false;

  world.perkRerollsLeft -= 1;
  world.expandedPerkSynergyId = null;
  world.pendingWaveBonuses = buildWaveBonusChoices();
  renderWaveBonusSelection();
  return true;
}

function showWaveClearOverlay() {
  if (waveClearOverlay) waveClearOverlay.classList.add("visible");
}

function hideWaveClearOverlay() {
  if (waveClearOverlay) waveClearOverlay.classList.remove("visible");
}

function showDeathSequenceOverlay() {
  if (!deathSequenceOverlay) return;
  deathSequenceOverlay.classList.add("visible");
  deathSequenceOverlay.classList.remove("ready");
  deathSequenceOverlay.style.opacity = "0";
}

function hideDeathSequenceOverlay() {
  if (!deathSequenceOverlay) return;
  deathSequenceOverlay.classList.remove("visible", "ready");
  deathSequenceOverlay.style.opacity = "0";
}

function startWaveClearSequence() {
  closeWaveBonusSelection();
  world.enemyShots = [];
  world.bullets = [];
  world.intermissionTimer = 0;
  clearAnnouncements();
  world.waveClearTimer = 1.08;
  world.waveClearPendingPerk = true;
  world.state = "wave_clear";
  showWaveClearOverlay();
}

function openWaveBonusSelection() {
  hideWaveClearOverlay();
  world.enemyShots = [];
  world.bullets = [];
  world.intermissionTimer = 0;
  world.waveClearPendingPerk = false;
  world.pendingWaveBonuses = buildWaveBonusChoices();
  renderWaveBonusSelection();
  world.state = "perk_select";
  if (perkOverlay) perkOverlay.classList.add("visible");
}

function updateWaveClear(dt) {
  if (world.state !== "wave_clear") return;
  world.waveClearTimer = Math.max(0, world.waveClearTimer - dt);
  if (world.waveClearTimer <= 0 && world.waveClearPendingPerk) openWaveBonusSelection();
}

function expireWaveBonusIfNeeded() {
  if (!world.activeWaveBonus) return;
  if (world.waveBonusExpiresOnWave !== world.wave) return;
  resetWaveBonusModifiers();
  world.activeWaveBonus = null;
  world.waveBonusExpiresOnWave = 0;
  syncHud();
}

function chooseWaveBonus(id) {
  if (world.state !== "perk_select") return;
  const bonus = world.pendingWaveBonuses.find((entry) => entry.id === id);
  if (!bonus) return;
  const newlyActivatedSynergies = registerRunBonusSelection(bonus) || [];
  resetWaveBonusModifiers();
  bonus.apply?.();
  world.activeWaveBonus = bonus.persistent === false ? null : bonus.id;
  world.waveBonusExpiresOnWave = bonus.persistent === false ? 0 : world.wave + 1;
  closeWaveBonusSelection();
  world.state = "intermission";
  world.intermissionTimer = 1.4;
  banner(
    bonusTitle(bonus).toUpperCase(),
    bonus.persistent === false ? t("banner.bonusApplied.once") : t("banner.bonusApplied.wave"),
    1.8,
    bonus.color,
  );
  if (newlyActivatedSynergies.length) showSynergyToast(newlyActivatedSynergies[0]);
  syncHud();
}

function startDeathSequence() {
  finalizeRunMetaProgress();
  world.state = "death_sequence";
  world.grenades = [];
  world.deathSequenceTimer = 2.45;
  world.deathSequenceReadyForClick = false;
  world.deathOverlayAlpha = 0;
  clearAnnouncements();
  audio.setMode("menu");
  closeWaveBonusSelection();
  hideWaveClearOverlay();
  hideScoreEntry();
  overlay.classList.remove("visible");
  closeMetaOverlay();
  showDeathSequenceOverlay();
}

function updateDeathSequence(dt) {
  if (world.state !== "death_sequence") return;
  world.deathSequenceTimer = Math.max(0, world.deathSequenceTimer - dt);
  world.deathOverlayAlpha = clamp(world.deathOverlayAlpha + dt / 2.45, 0, 1);
  if (deathSequenceOverlay) deathSequenceOverlay.style.opacity = `${world.deathOverlayAlpha}`;
  if (world.deathSequenceTimer <= 0 && !world.deathSequenceReadyForClick) {
    world.deathSequenceReadyForClick = true;
    if (deathSequenceOverlay) deathSequenceOverlay.classList.add("ready");
  }
}

function confirmDeathSequence() {
  if (world.state !== "death_sequence" || !world.deathSequenceReadyForClick) return;
  world.state = "gameover";
  world.resultOverlayKind = "gameover";
  hideDeathSequenceOverlay();
  overlayTitle.textContent = t("overlay.title.gameover");
  overlayText.textContent = t("overlay.text.gameover", {
    score: world.score,
    wave: world.wave,
    kills: world.kills,
    credits: world.runCreditsEarned,
  });
  overlayButton.textContent = t("ui.tryAgain");
  if (overlayMetaButton) overlayMetaButton.classList.remove("hidden");
  const runEntry = buildRunResultEntry("death");
  showScoreEntry(runEntry);
  clearActiveRunCheats();
  overlay.classList.add("visible");
  renderMetaUpgrades();
}

function createAssetStore(manifest) {
  return {
    images: new Map(),
    audio: new Map(),
    musicNodes: new Map(),
    loading: null,
    loadImage(key, src) {
      return new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          this.images.set(key, image);
          resolve();
        };
        image.onerror = () => resolve();
        image.src = src;
      });
    },
    loadAudio(key, src) {
      return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = src;
        const done = () => {
          this.audio.set(key, audio);
          cleanup();
          resolve();
        };
        const fail = () => {
          cleanup();
          resolve();
        };
        const cleanup = () => {
          audio.removeEventListener("canplaythrough", done);
          audio.removeEventListener("error", fail);
        };
        audio.addEventListener("canplaythrough", done, { once: true });
        audio.addEventListener("error", fail, { once: true });
        audio.load();
      });
    },
    async loadAll() {
      if (this.loading) return this.loading;
      const tasks = [];
      for (const [key, src] of Object.entries(manifest.images)) tasks.push(this.loadImage(key, src));
      for (const [key, src] of Object.entries(manifest.audio)) tasks.push(this.loadAudio(key, src));
      this.loading = Promise.all(tasks);
      await this.loading;
    },
    getImage(key) {
      return this.images.get(key) || null;
    },
    drawImage(ctx2d, key, x, y, w, h, options = {}) {
      const image = this.getImage(key);
      if (!image) return false;
      ctx2d.save();
      ctx2d.translate(x, y);
      if (options.rotation) ctx2d.rotate(options.rotation);
      ctx2d.globalAlpha = options.alpha ?? 1;
      ctx2d.drawImage(image, -w / 2, -h / 2, w, h);
      ctx2d.restore();
      return true;
    },
    playAudio(key, volume = 1, loop = false, options = {}) {
      const source = this.audio.get(key);
      if (!source) return false;
      const node = source.cloneNode();
      node.volume = volume;
      node.loop = loop;
       node.playbackRate = options.playbackRate ?? 1;
      node.play().catch(() => {});
      return node;
    },
    playMusic(key, volume = 1, options = {}) {
      const existing = this.musicNodes.get(key);
      if (existing) {
        existing.loop = options.loop ?? true;
        existing.volume = volume;
        existing.onended = options.onended || null;
        if (existing.ended || (Number.isFinite(existing.duration) && existing.duration > 0 && existing.currentTime >= existing.duration - 0.02)) {
          existing.currentTime = 0;
        }
        existing.play().catch(() => {});
        return existing;
      }
      const source = this.audio.get(key);
      if (!source) return false;
      const node = source.cloneNode();
      node.loop = options.loop ?? true;
      node.volume = volume;
      node.onended = options.onended || null;
      node.play().catch(() => {});
      this.musicNodes.set(key, node);
      return node;
    },
    stopMusic(except = null) {
      for (const [key, node] of this.musicNodes.entries()) {
        if (key === except) continue;
        node.pause();
        node.currentTime = 0;
      }
    },
    setMusicVolume(volume) {
      for (const node of this.musicNodes.values()) node.volume = volume;
    },
  };
}

const assets = createAssetStore(assetManifest);

function audioManager() {
  return {
    ctx: null,
    master: null,
    music: null,
    sfx: null,
    unlocked: false,
    mode: "",
    musicTimer: 0,
    step: 0,
    noise: null,
    recentSfx: new Map(),
    battleTracks: [...battleTrackKeys],
    battlePlaylist: [],
    battlePlaylistIndex: 0,
    currentBattleTrack: null,
    lastBattleTrack: null,
    volumes: { master: 0.7, music: 0.68, sfx: 0.82 },
    ensure() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.master.gain.value = this.volumes.master * 0.3;
      this.music.gain.value = this.volumes.music;
      this.sfx.gain.value = this.volumes.sfx;
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise();
    },
    setVolumes(next) {
      this.volumes = { ...this.volumes, ...next };
      if (!this.master) return;
      this.master.gain.value = this.volumes.master * 0.3;
      this.music.gain.value = this.volumes.music;
      this.sfx.gain.value = this.volumes.sfx;
      assets.setMusicVolume(this.volumes.master * this.volumes.music);
    },
    makeNoise() {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const ch = buffer.getChannelData(0);
      for (let i = 0; i < ch.length; i += 1) ch[i] = Math.random() * 2 - 1;
      return buffer;
    },
    async unlock() {
      this.ensure();
      if (!this.ctx) return;
      await this.ctx.resume();
      this.unlocked = this.ctx.state === "running";
    },
    shuffleBattlePlaylist() {
      const next = shuffle([...this.battleTracks]);
      if (next.length > 1 && this.lastBattleTrack && next[0] === this.lastBattleTrack) {
        [next[0], next[1]] = [next[1], next[0]];
      }
      this.battlePlaylist = next;
      this.battlePlaylistIndex = 0;
    },
    resetBattlePlaylist() {
      this.currentBattleTrack = null;
      this.shuffleBattlePlaylist();
    },
    isMusicNodePlaying(key) {
      const node = key ? assets.musicNodes.get(key) : null;
      return Boolean(node && !node.paused && !node.ended);
    },
    playNextBattleTrack() {
      if (!this.battleTracks.length) return false;
      if (!this.battlePlaylist.length || this.battlePlaylistIndex >= this.battlePlaylist.length) this.shuffleBattlePlaylist();
      const total = this.battlePlaylist.length;
      for (let attempt = 0; attempt < total; attempt += 1) {
        const key = this.battlePlaylist[this.battlePlaylistIndex];
        this.battlePlaylistIndex += 1;
        this.currentBattleTrack = key;
        this.lastBattleTrack = key;
        assets.stopMusic(key);
        const node = assets.playMusic(key, this.volumes.master * this.volumes.music, {
          loop: false,
          onended: () => {
            if (this.mode !== "battle" || this.currentBattleTrack !== key) return;
            this.currentBattleTrack = null;
            this.playNextBattleTrack();
          },
        });
        if (node) return true;
      }
      this.currentBattleTrack = null;
      return false;
    },
    setMode(mode) {
      const menuTrack = "menu_music";
      if (this.mode === mode) {
        if (mode === "menu" && this.isMusicNodePlaying(menuTrack)) return;
        if (mode === "battle" && this.currentBattleTrack && this.isMusicNodePlaying(this.currentBattleTrack)) return;
      }
      this.mode = mode;
      this.musicTimer = 0;
      this.step = 0;
      if (mode === "battle") {
        assets.stopMusic();
        if (this.playNextBattleTrack()) return;
        return;
      }
      this.currentBattleTrack = null;
      assets.stopMusic(menuTrack);
      if (assets.playMusic(menuTrack, this.volumes.master * this.volumes.music, { loop: true })) return;
    },
    midi(n) { return 440 * 2 ** ((n - 69) / 12); },
    tone(freq, dur, type, vol, opts = {}) {
      if (!this.unlocked || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.slideTo), now + dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      let node = osc;
      if (opts.filter) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = opts.filter.type || "lowpass";
        filter.frequency.setValueAtTime(opts.filter.frequency || 1200, now);
        filter.Q.value = opts.filter.q || 0.7;
        node.connect(filter);
        node = filter;
      }
      node.connect(gain);
      gain.connect(opts.bus === "music" ? this.music : this.sfx);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    },
    burst(dur, vol, opts = {}) {
      if (!this.unlocked || !this.ctx || !this.noise) return;
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = this.noise;
      filter.type = opts.type || "bandpass";
      filter.frequency.setValueAtTime(opts.frequency || 1400, now);
      filter.Q.value = opts.q || 1;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(opts.bus === "music" ? this.music : this.sfx);
      src.start(now);
      src.stop(now + dur);
    },
    kick(freq = 54, dur = 0.18, vol = 0.08, bus = "music") {
      this.tone(freq, dur, "sine", vol, { slideTo: 30, filter: { frequency: 180 }, bus });
      this.burst(0.02, vol * 0.32, { frequency: 140, q: 0.8, bus });
    },
    hat(bus = "music", vol = 0.018) {
      this.burst(0.03, vol, { frequency: 5200, q: 1.8, bus });
    },
    playAssetSfx(key, volume, options = {}) {
      const now = performance.now();
      const minInterval = options.minInterval ?? 0;
      const last = this.recentSfx.get(key) || 0;
      if (minInterval > 0 && now - last < minInterval) return true;
      const playbackRate = options.playbackRate
        ?? (options.playbackRateRange
          ? rand(options.playbackRateRange[0], options.playbackRateRange[1])
          : 1);
      const node = assets.playAudio(key, volume, false, { playbackRate });
      if (!node) return false;
      if (minInterval > 0) this.recentSfx.set(key, now);
      return true;
    },
    shoot() {
      if (this.playAssetSfx("gun_pistol", this.volumes.master * this.volumes.sfx, {
        playbackRateRange: [0.98, 1.03],
      })) return;
      this.tone(920, 0.06, "square", 0.036, { slideTo: 380, filter: { frequency: 2600 }, bus: "sfx" });
      this.tone(180, 0.08, "triangle", 0.012, { slideTo: 120, filter: { frequency: 420 }, bus: "sfx" });
      this.burst(0.06, 0.026, { frequency: 3200, q: 1.3, bus: "sfx" });
    },
    weapon(kind) {
      if (kind === "shotgun") {
        if (this.playAssetSfx("gun_shotgun", this.volumes.master * this.volumes.sfx, {
          playbackRateRange: [0.98, 1.02],
        })) return;
        this.tone(140, 0.16, "sawtooth", 0.04, { slideTo: 70, filter: { frequency: 980 }, bus: "sfx" });
        this.burst(0.1, 0.04, { frequency: 1600, q: 0.8, bus: "sfx" });
        return;
      }
      if (kind === "rail") {
        if (this.playAssetSfx("gun_rail", this.volumes.master * this.volumes.sfx, {
          playbackRateRange: [0.99, 1.01],
        })) return;
        this.tone(420, 0.18, "sawtooth", 0.035, { slideTo: 1200, filter: { frequency: 1800 }, bus: "sfx" });
        this.tone(120, 0.22, "triangle", 0.014, { slideTo: 60, filter: { frequency: 300 }, bus: "sfx" });
        return;
      }
      if (kind === "smg") {
        if (this.playAssetSfx("gun_smg", this.volumes.master * this.volumes.sfx * 0.9, {
          playbackRateRange: [0.985, 1.015],
          minInterval: 90,
        })) return;
        this.tone(980, 0.045, "square", 0.026, { slideTo: 420, filter: { frequency: 2900 }, bus: "sfx" });
        this.burst(0.04, 0.018, { frequency: 3600, q: 1.5, bus: "sfx" });
        return;
      }
      this.shoot();
    },
    droneBeam() {
      if (this.playAssetSfx("drone_beam", this.volumes.master * this.volumes.sfx * 0.82, {
        playbackRateRange: [0.98, 1.02],
        minInterval: 90,
      })) return;
      this.tone(680, 0.08, "sawtooth", 0.018, { slideTo: 620, filter: { frequency: 1900 }, bus: "sfx" });
      this.burst(0.04, 0.012, { frequency: 2600, q: 1.2, bus: "sfx" });
    },
    dash() { this.tone(300, 0.16, "sawtooth", 0.03, { slideTo: 160, filter: { frequency: 900 }, bus: "sfx" }); },
    pickup(type) {
      if (assets.playAudio("pickup", this.volumes.master * this.volumes.sfx * 0.9)) return;
      const high = type === "med" ? 659.25 : 988;
      this.tone(type === "med" ? 523.25 : 784, 0.12, "triangle", 0.03, { bus: "sfx" });
      this.tone(high, 0.18, "triangle", 0.02, { bus: "sfx" });
    },
    attack(kind) {
      if (kind === "monster" || kind === "abomination") {
        if (assets.playAudio("monster_attack", this.volumes.master * this.volumes.sfx)) return;
        this.tone(140, 0.24, "sawtooth", 0.04, { slideTo: 70, filter: { frequency: 700 }, bus: "sfx" });
        this.burst(0.08, 0.018, { frequency: 500, q: 0.7, bus: "sfx" });
        return;
      }
      if (kind === "criminal" || kind === "warlord") {
        if (assets.playAudio("enemy_attack", this.volumes.master * this.volumes.sfx)) return;
        this.tone(760, 0.07, "square", 0.024, { slideTo: 260, filter: { frequency: 2200 }, bus: "sfx" });
        this.burst(0.035, 0.016, { frequency: 2400, q: 1.4, bus: "sfx" });
        return;
      }
      this.tone(180, 0.15, "square", 0.026, { slideTo: 90, filter: { frequency: 850 }, bus: "sfx" });
    },
    death(kind) {
      if (kind === "monster" || kind === "abomination") {
        if (assets.playAudio("monster_death", this.volumes.master * this.volumes.sfx)) return;
        this.tone(190, 0.28, "triangle", 0.028, { slideTo: 60, filter: { frequency: 600 }, bus: "sfx" });
        this.burst(0.12, 0.016, { frequency: 360, q: 0.8, bus: "sfx" });
        return;
      }
      if (assets.playAudio("enemy_death", this.volumes.master * this.volumes.sfx)) return;
      this.tone(240, 0.16, "triangle", 0.02, { slideTo: 120, filter: { frequency: 1000 }, bus: "sfx" });
    },
    explosion() {
      if (assets.playAudio("explosion", this.volumes.master * this.volumes.sfx)) return;
      this.burst(0.35, 0.05, { frequency: 160, q: 0.6, bus: "sfx" });
      this.tone(90, 0.32, "sawtooth", 0.03, { slideTo: 45, filter: { frequency: 280 }, bus: "sfx" });
    },
    techpriestWaveCharge() {
      this.tone(
        180,
        0.38,
        "sawtooth",
        0.026,
        {
          slideTo: 520,
          filter: {
            type: "bandpass",
            frequency: 1100,
            q: 1.3,
          },
          bus: "sfx",
        },
      );
      this.tone(
        92,
        0.42,
        "triangle",
        0.02,
        {
          slideTo: 145,
          filter: {
            type: "lowpass",
            frequency: 320,
            q: 0.9,
          },
          bus: "sfx",
        },
      );
      this.burst(
        0.08,
        0.013,
        {
          frequency: 2100,
          q: 2.1,
          bus: "sfx",
        },
      );
    },
    techpriestWaveImpact() {
      this.burst(
        0.3,
        0.045,
        {
          frequency: 170,
          q: 0.65,
          bus: "sfx",
        },
      );
      this.tone(
        105,
        0.34,
        "sawtooth",
        0.038,
        {
          slideTo: 42,
          filter: {
            type: "lowpass",
            frequency: 420,
            q: 0.9,
          },
          bus: "sfx",
        },
      );
      this.tone(
        860,
        0.15,
        "square",
        0.017,
        {
          slideTo: 260,
          filter: {
            type: "bandpass",
            frequency: 2200,
            q: 1.3,
          },
          bus: "sfx",
        },
      );
    },
    wave(bossWave) {
      this.tone(392, 0.2, "triangle", 0.03, { bus: "sfx" });
      this.tone(523.25, 0.28, "triangle", 0.028, { bus: "sfx" });
      if (bossWave) this.tone(196, 0.36, "sawtooth", 0.04, { slideTo: 110, filter: { frequency: 900 }, bus: "sfx" });
    },
    tick(dt) {
      if (!this.unlocked || !this.ctx) return;
      if (this.mode === "battle") {
        if (this.currentBattleTrack && this.isMusicNodePlaying(this.currentBattleTrack)) return;
        if (this.playNextBattleTrack()) return;
      } else if (this.isMusicNodePlaying("menu_music") || assets.playMusic("menu_music", this.volumes.master * this.volumes.music, { loop: true })) {
        return;
      }
      this.musicTimer -= dt;
      if (this.musicTimer > 0) return;
      if (this.mode === "battle") {
        const p = [{ b: 33, l: 57, i: 0.2 }, { b: 33, l: 60, i: 0.2 }, { b: 36, l: 62, i: 0.2 }, { b: 31, l: 55, i: 0.2 }, { b: 33, l: 64, i: 0.2 }, { b: 36, l: 67, i: 0.2 }, { b: 40, l: 69, i: 0.2 }, { b: 31, l: 62, i: 0.2 }];
        const n = p[this.step % p.length];
        this.kick(this.midi(n.b), 0.16, 0.055, "music");
        this.tone(this.midi(n.b + 12), 0.18, "triangle", 0.022, { filter: { frequency: 520 }, bus: "music" });
        this.tone(this.midi(n.l), 0.1, "sawtooth", 0.016, { filter: { frequency: 1900 }, bus: "music" });
        if (this.step % 2 === 0) this.hat("music", 0.016);
        if (this.step % 4 === 2) this.burst(0.05, 0.012, { frequency: 2600, q: 1.5, bus: "music" });
        this.musicTimer = n.i;
      } else {
        const p = [{ b: 40, l: 64, i: 0.44 }, { b: 38, l: 62, i: 0.44 }, { b: 35, l: 59, i: 0.48 }, { b: 33, l: 57, i: 0.48 }];
        const n = p[this.step % p.length];
        this.kick(this.midi(n.b - 12), 0.22, 0.04, "music");
        this.tone(this.midi(n.b), 0.42, "triangle", 0.018, { filter: { frequency: 480 }, bus: "music" });
        this.tone(this.midi(n.l), 0.34, "sawtooth", 0.012, { filter: { frequency: 1100 }, bus: "music" });
        if (this.step % 2 === 1) this.burst(0.05, 0.008, { frequency: 1400, q: 0.7, bus: "music" });
        this.musicTimer = n.i;
      }
      this.step += 1;
    },
  };
}

const audio = audioManager();

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function angleDelta(a, b) {
  let delta = (a - b) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}

function countActiveThreatUnits() {
  const swarmPacks = new Set();
  let count = 0;

  for (const foe of world.foes) {
    if (!foe || foe.hp <= 0) continue;

    if (foe.id === "swarm" && foe.packId) {
      swarmPacks.add(foe.packId);
    } else {
      count += 1;
    }
  }

  return count + swarmPacks.size;
}

function enemiesRemainingForDisplay() {
  const activeThreats = countActiveThreatUnits();

  if (!world.currentWave || world.state !== "playing") {
    return activeThreats;
  }

  const remainingSpawnSlots = Math.max(
    0,
    world.currentWave.regularTotal - world.currentWave.regularSpawned,
  );

  return remainingSpawnSlots + activeThreats;
}

function layoutX(value) { return value / BASE_WORLD_WIDTH * world.width; }
function layoutY(value) { return value / BASE_WORLD_HEIGHT * world.height; }
function layoutW(value) { return value / BASE_WORLD_WIDTH * world.width; }
function layoutH(value) { return value / BASE_WORLD_HEIGHT * world.height; }
function layoutPoint(point) { return { x: layoutX(point.x), y: layoutY(point.y) }; }

function circleRect(circle, rect) {
  const nx = clamp(circle.x, rect.x - rect.w / 2, rect.x + rect.w / 2);
  const ny = clamp(circle.y, rect.y - rect.h / 2, rect.y + rect.h / 2);
  const dx = circle.x - nx;
  const dy = circle.y - ny;
  const overlap = circle.radius - Math.hypot(dx, dy);
  return { hit: overlap > 0, overlap, dx, dy, nx, ny };
}

function addDecal(x, y, radius, color, alpha = 0.22) {
  world.decals.push({ x, y, radius, color, alpha, maxAlpha: alpha, life: 2.4, maxLife: 2.4 });
  if (world.decals.length > 80) world.decals.shift();
}

function spawnDeathEffect(foe) {
  const keyByKind = {
    animal: "effect_hellhound_death",
    monster: "effect_orb_death",
    criminal: "effect_tank_death",
  };
  const assetKey = keyByKind[foe.kind];
  if (!assetKey || !assets.getImage(assetKey)) return;
  const life = 2.15;
  const scale = foe.kind === "monster" ? 2.7 : foe.kind === "criminal" ? 2.9 : 2.45;
  world.deathEffects.push({
    x: foe.x,
    y: foe.y,
    rotation: foe.angle || rand(0, TAU),
    assetKey,
    variant: foe.kind,
    w: foe.radius * scale,
    h: foe.radius * scale,
    life,
    maxLife: life,
    pulse: Math.random() * TAU,
    emitTimer: 0.05,
  });
  if (world.deathEffects.length > 32) world.deathEffects.shift();
}

function pushParticle(props) {
  const life = props.life ?? 0.6;
  world.particles.push({
    drag: 0.97,
    gravity: 0,
    alpha: 1,
    size: 4,
    sizeEnd: props.size ?? 4,
    rotation: 0,
    spin: 0,
    ...props,
    life,
    maxLife: props.maxLife ?? life,
  });
}

function pushBlastGlow(x, y, radius, color = "rgba(255, 153, 79, 0.42)", life = 0.45) {
  world.blastGlows.push({ x, y, radius, color, life, maxLife: life });
}

function solidPlacementOpen(x, y, w, h, padding = 18) {
  return !world.destructibles.some((solid) => (
    !solid.destroyed
    && Math.abs(solid.x - x) < (solid.w + w) * 0.5 + padding
    && Math.abs(solid.y - y) < (solid.h + h) * 0.5 + padding
  ));
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function spawnSecondaryFlames(x, y, count = 4, spread = 26) {
  for (let i = 0; i < count; i += 1) {
    const life = rand(1.5, 2.4);
    world.fireZones.push({
      x: x + rand(-spread, spread),
      y: y + rand(-spread, spread),
      radius: rand(11, 18),
      pulse: Math.random() * TAU,
      emitTimer: rand(0.02, 0.08),
      life,
      maxLife: life,
    });
  }
}

function spawnObjectDebris(solid, amount, palette) {
  const image = solid.assetKey ? assets.getImage(solid.assetKey) : null;
  const displayScale = 1.9;
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(90, solid.explosive ? 360 : 220);
    const width = rand(Math.max(7, solid.w * 0.16), Math.max(11, solid.w * 0.34));
    const height = rand(Math.max(6, solid.h * 0.16), Math.max(10, solid.h * 0.34));
    const life = rand(0.55, solid.explosive ? 1.2 : 0.95);
    const debris = {
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(18, 74),
      gravity: rand(140, 260),
      drag: 0.965,
      life,
      maxLife: life,
      rotation: rand(0, TAU),
      spin: rand(-8, 8),
      w: width,
      h: height,
      color: pick(palette),
      assetKey: solid.assetKey || null,
      useImage: Boolean(image),
    };
    if (image) {
      debris.sw = Math.max(10, Math.floor(image.width * rand(0.18, 0.36)));
      debris.sh = Math.max(10, Math.floor(image.height * rand(0.18, 0.36)));
      debris.sx = Math.floor(rand(0, Math.max(1, image.width - debris.sw)));
      debris.sy = Math.floor(rand(0, Math.max(1, image.height - debris.sh)));
      debris.drawW = width * displayScale;
      debris.drawH = height * displayScale;
    }
    world.objectDebris.push(debris);
  }
}

function burst(x, y, color, amount = 8, scale = 1) {
  for (let i = 0; i < amount; i += 1) {
    const a = Math.random() * TAU;
    const s = rand(40, 180) * scale;
    pushParticle({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.25, 0.85),
      color,
      size: rand(2, 6),
      sizeEnd: 0,
      type: "ember",
    });
  }
}

function bloodSpray(x, y, color, amount = 18, scale = 1) {
  for (let i = 0; i < amount; i += 1) {
    const a = Math.random() * TAU;
    const s = rand(70, 250) * scale;
    pushParticle({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      gravity: rand(120, 240),
      life: rand(0.4, 1.15),
      color,
      size: rand(3, 8),
      sizeEnd: rand(1, 3),
      type: "blood",
    });
  }
}

function emitConeParticles(x, y, angle, count, spread, speedMin, speedMax, factory) {
  for (let i = 0; i < count; i += 1) {
    const dir = angle + rand(-spread, spread);
    const speed = rand(speedMin, speedMax);
    pushParticle({
      x,
      y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      ...factory(dir, speed, i),
    });
  }
}

function spawnMuzzleFlash(weaponId, x, y, angle) {
  const profiles = {
    pistol: {
      life: 0.1,
      size: 25,
      width: 0.31,
      coreColor: "#fff0bd",
      bloomColor: "#ffb347",
      smokeColor: "rgba(110, 116, 126, 0.55)",
      rays: 4,
      glow: 48,
      additive: 0.46,
      shape: "streak",
    },
    smg: {
      life: 0.085,
      size: 22,
      width: 0.24,
      coreColor: "#fff2cf",
      bloomColor: "#ff9a2f",
      smokeColor: "rgba(96, 104, 112, 0.42)",
      rays: 4,
      glow: 46,
      additive: 0.42,
      shape: "compact_streak",
    },
    shotgun: {
      life: 0.16,
      size: 40,
      width: 0.48,
      coreColor: "#fff2c8",
      bloomColor: "#ff8a36",
      smokeColor: "rgba(128, 120, 104, 0.58)",
      rays: 6,
      glow: 80,
      additive: 0.68,
      shape: "shotgun_burst",
    },
    rail: {
      life: 0.16,
      size: 30,
      width: 0.14,
      coreColor: "#eafcff",
      bloomColor: "#5cecff",
      smokeColor: "rgba(88, 205, 214, 0.22)",
      rays: 5,
      glow: 54,
      additive: 0.36,
      shape: "plasma",
    },
    enemy_cannon: {
      life: 0.12,
      size: 28,
      width: 0.22,
      coreColor: "#eaf8ff",
      bloomColor: "#7fc9ff",
      smokeColor: "rgba(90, 150, 190, 0.34)",
      rays: 4,
      glow: 44,
      additive: 0.38,
      shape: "burst",
    },
    enemy_orb: {
      life: 0.13,
      size: 26,
      width: 0.26,
      coreColor: "#efffc2",
      bloomColor: "#93ff67",
      smokeColor: "rgba(120, 180, 90, 0.28)",
      rays: 5,
      glow: 46,
      additive: 0.42,
      shape: "burst",
    },
  };
  const profile = profiles[weaponId] || profiles.pistol;
  world.muzzleFlashes.push({
    weaponId,
    x,
    y,
    angle,
    life: profile.life,
    maxLife: profile.life,
    size: profile.size,
    width: profile.width,
    coreColor: profile.coreColor,
    bloomColor: profile.bloomColor,
    smokeColor: profile.smokeColor,
    rays: profile.rays,
    glow: profile.glow,
    additive: profile.additive,
    shape: profile.shape || "streak",
  });
}

function spawnEnemyShotEffect(kind, x, y, angle) {
  if (kind === "criminal") {
    spawnMuzzleFlash("enemy_cannon", x, y, angle);
    emitConeParticles(x, y, angle, 4, 0.16, 90, 220, () => ({
      life: rand(0.12, 0.28),
      size: rand(4, 8),
      sizeEnd: rand(8, 16),
      color: "rgba(130, 210, 255, 0.36)",
      type: "smoke",
      drag: 0.92,
    }));
    return;
  }

  if (kind === "monster") {
    spawnMuzzleFlash("enemy_orb", x, y, angle);
    emitConeParticles(x, y, angle, 5, 0.22, 120, 260, () => ({
      life: rand(0.1, 0.24),
      size: rand(3, 7),
      sizeEnd: 0,
      color: "#b9ff6a",
      type: "spark",
      drag: 0.9,
    }));
  }
}

function spawnWeaponDischarge(weapon, muzzle, angle) {
  const smokeBase = weapon.id === "shotgun" ? 4 : weapon.id === "rail" ? 3 : 2;
  emitConeParticles(muzzle.x, muzzle.y, angle, smokeBase, weapon.id === "shotgun" ? 0.28 : 0.14, 16, 58, () => ({
    life: rand(0.2, weapon.id === "shotgun" ? 0.56 : 0.42),
    size: rand(8, weapon.id === "shotgun" ? 14 : 10),
    sizeEnd: rand(18, weapon.id === "shotgun" ? 34 : 22),
    color: weapon.id === "rail" ? "rgba(102, 240, 255, 0.42)" : "rgba(98, 102, 110, 0.48)",
    type: "smoke",
    drag: 0.94,
  }));

  if (weapon.id === "pistol") {
    emitConeParticles(muzzle.x, muzzle.y, angle, 4, 0.12, 180, 360, () => ({
      life: rand(0.08, 0.16),
      size: rand(10, 16),
      sizeEnd: 0,
      color: "#ffbf68",
      type: "spark",
      drag: 0.91,
    }));
    pushParticle({
      x: muzzle.x + Math.cos(angle) * 5,
      y: muzzle.y + Math.sin(angle) * 5,
      life: 0.08,
      size: 8,
      sizeEnd: 26,
      color: "rgba(255, 216, 128, 0.4)",
      type: "flare",
      alpha: 0.82,
    });
  } else if (weapon.id === "smg") {
    emitConeParticles(muzzle.x, muzzle.y, angle, 7, 0.18, 240, 430, () => ({
      life: rand(0.06, 0.12),
      size: rand(11, 18),
      sizeEnd: 0,
      color: "#ff9d43",
      type: "spark",
      drag: 0.9,
    }));
    pushParticle({
      x: muzzle.x,
      y: muzzle.y,
      life: 0.08,
      size: 9,
      sizeEnd: 28,
      color: "rgba(255, 157, 67, 0.42)",
      type: "flare",
      alpha: 0.84,
    });
  } else if (weapon.id === "shotgun") {
    emitConeParticles(muzzle.x, muzzle.y, angle, 10, 0.26, 190, 350, () => ({
      life: rand(0.08, 0.18),
      size: rand(12, 20),
      sizeEnd: 0,
      color: pick(["#ff8a36", "#ffb347", "#ffe0a3"]),
      type: "spark",
      drag: 0.89,
    }));
    pushParticle({
      x: muzzle.x,
      y: muzzle.y,
      life: 0.18,
      size: 14,
      sizeEnd: 58,
      color: "rgba(255, 186, 88, 0.5)",
      type: "ring",
      lineWidth: 5,
    });
    pushParticle({
      x: muzzle.x + Math.cos(angle) * 6,
      y: muzzle.y + Math.sin(angle) * 6,
      life: 0.09,
      size: 18,
      sizeEnd: 40,
      color: "rgba(255, 228, 167, 0.68)",
      type: "flare",
      alpha: 0.92,
    });
  } else if (weapon.id === "rail") {
    emitConeParticles(muzzle.x, muzzle.y, angle, 6, 0.08, 140, 280, () => ({
      life: rand(0.08, 0.18),
      size: rand(8, 14),
      sizeEnd: 0,
      color: pick(["#86f7ff", "#5cecff", "#effcff"]),
      type: "spark",
      drag: 0.92,
    }));
    pushParticle({
      x: muzzle.x,
      y: muzzle.y,
      life: 0.18,
      size: 10,
      sizeEnd: 36,
      color: "rgba(106, 247, 255, 0.48)",
      type: "ring",
      lineWidth: 2.5,
    });
    pushParticle({
      x: muzzle.x + Math.cos(angle) * 9,
      y: muzzle.y + Math.sin(angle) * 9,
      life: 0.1,
      size: 12,
      sizeEnd: 28,
      color: "rgba(213, 251, 255, 0.82)",
      type: "flare",
      alpha: 0.96,
    });
  }
}

function spawnImpactFlash(x, y, color = "#ffe6b1", power = 1, kind = "bullet") {
  const sparkCount = kind === "rocket" ? 6 : kind === "cannon" ? 4 : kind === "plasmaOrb" ? 5 : kind === "shotgun" ? 5 : kind === "needle" ? 2 : 3;
  const ringColor = kind === "rocket"
    ? "rgba(194, 255, 121, 0.76)"
    : kind === "plasmaOrb"
    ? "rgba(160, 247, 255, 0.82)"
    : kind === "cannon"
      ? "rgba(255, 197, 124, 0.72)"
    : kind === "shotgun"
      ? "rgba(255, 201, 132, 0.76)"
      : "rgba(255, 231, 188, 0.66)";
  pushParticle({
    x,
    y,
    life: kind === "rocket" ? 0.16 : kind === "plasmaOrb" ? 0.14 : 0.1,
    size: (kind === "rocket" ? 14 : kind === "plasmaOrb" ? 12 : 10) * power,
    sizeEnd: (kind === "rocket" ? 30 : kind === "plasmaOrb" ? 24 : 28) * power,
    color: kind === "rocket" ? "rgba(246, 255, 223, 0.94)" : kind === "plasmaOrb" ? "rgba(231, 252, 255, 0.96)" : "rgba(255, 244, 226, 0.86)",
    type: "flare",
    alpha: 0.94,
  });
  pushParticle({
    x,
    y,
    life: 0.15,
    size: (kind === "rocket" ? 6 : kind === "plasmaOrb" ? 4 : 5) * power,
    sizeEnd: (kind === "rocket" ? 22 : kind === "plasmaOrb" ? 16 : 18) * power,
    color: ringColor,
    type: "ring",
    lineWidth: kind === "rocket" ? 3 : kind === "plasmaOrb" ? 2.6 : 2.4,
  });
  for (let i = 0; i < sparkCount; i += 1) {
    const a = Math.random() * TAU;
    const speed = rand(kind === "rocket" ? 95 : 80, kind === "rocket" ? 220 : kind === "plasmaOrb" ? 210 : 190) * power;
    pushParticle({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: rand(kind === "rocket" ? 0.1 : kind === "plasmaOrb" ? 0.08 : 0.06, kind === "rocket" ? 0.2 : kind === "plasmaOrb" ? 0.18 : 0.14),
      size: rand(kind === "rocket" ? 8 : kind === "plasmaOrb" ? 7 : 8, kind === "rocket" ? 14 : kind === "plasmaOrb" ? 12 : 14) * power,
      sizeEnd: 0,
      color,
      type: kind === "rocket" || kind === "plasmaOrb" ? "flare" : "spark",
      drag: 0.9,
    });
  }
}

function applyFoeKnockback(foe, force, angle) {
  if (!foe || force <= 0) return;
  foe.knockbackX = (foe.knockbackX || 0) + Math.cos(angle) * force;
  foe.knockbackY = (foe.knockbackY || 0) + Math.sin(angle) * force;
}

function spawnBarrelExplosionEffect(solid) {
  addDecal(solid.x, solid.y, 38, "rgba(255, 118, 33, 0.26)", 0.26);
  pushBlastGlow(solid.x, solid.y, 62, "rgba(255, 133, 58, 0.56)", 0.58);
  pushBlastGlow(solid.x, solid.y, 112, "rgba(255, 196, 94, 0.32)", 0.36);
  spawnSecondaryFlames(solid.x, solid.y, 5, 24);
  spawnObjectDebris(solid, 12, ["#8a2a1b", "#535e6b", "#24282d", "#d0a34f"]);
  pushParticle({
    x: solid.x,
    y: solid.y,
    life: 0.34,
    size: 18,
    sizeEnd: 96,
    color: "rgba(255, 171, 71, 0.86)",
    type: "ring",
    lineWidth: 6,
  });
  pushParticle({
    x: solid.x,
    y: solid.y,
    life: 0.28,
    size: 26,
    sizeEnd: 132,
    color: "rgba(255, 228, 186, 0.72)",
    type: "shockwave",
    lineWidth: 10,
    alpha: 0.72,
  });
  for (let i = 0; i < 22; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(120, 360);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.14, 0.32),
      size: rand(12, 22),
      sizeEnd: rand(4, 10),
      color: pick(["#fff1a8", "#ffb347", "#ff7a2f", "#ff5b1f"]),
      type: "flare",
      drag: 0.88,
    });
  }
  for (let i = 0; i < 18; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(180, 520);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.08, 0.18),
      size: rand(14, 24),
      sizeEnd: 0,
      color: pick(["#ff9a2f", "#ffc04d", "#ffe0a3"]),
      type: "spark",
      drag: 0.9,
    });
  }
  for (let i = 0; i < 10; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(36, 110);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(8, 28),
      gravity: rand(20, 60),
      life: rand(0.45, 0.85),
      size: rand(16, 24),
      sizeEnd: rand(34, 50),
      color: "rgba(70, 68, 66, 0.56)",
      type: "smoke",
      drag: 0.94,
    });
  }
}

function spawnBoxBreakEffect(solid) {
  addDecal(solid.x, solid.y, Math.max(solid.w, solid.h) * 0.42, "rgba(54, 34, 22, 0.18)", 0.16);
  spawnObjectDebris(solid, solid.type === "longcrate" ? 11 : 8, ["#9b6a3c", "#c48a52", "#6f4727", "#e0c38b"]);
  for (let i = 0; i < 12; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(80, 240);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(10, 40),
      gravity: rand(110, 190),
      life: rand(0.28, 0.7),
      size: rand(6, 13),
      sizeEnd: rand(4, 7),
      color: pick(["#9b6a3c", "#c48a52", "#6f4727"]),
      type: "debris",
      rotation: rand(0, TAU),
      spin: rand(-10, 10),
      stretch: rand(0.4, 0.8),
      drag: 0.95,
    });
  }
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(34, 110);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(4, 16),
      gravity: rand(18, 48),
      life: rand(0.24, 0.5),
      size: rand(10, 16),
      sizeEnd: rand(18, 32),
      color: "rgba(156, 118, 82, 0.34)",
      type: "smoke",
      drag: 0.93,
    });
  }
}

function spawnConcreteBreakEffect(solid) {
  addDecal(solid.x, solid.y, Math.max(solid.w, solid.h) * 0.48, "rgba(28, 30, 34, 0.24)", 0.18);
  spawnObjectDebris(solid, solid.type === "wall" ? 10 : 12, ["#c9ced6", "#8f98a6", "#5f6874", "#2d3138"]);
  for (let i = 0; i < 14; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(90, 230);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(6, 24),
      gravity: rand(140, 220),
      life: rand(0.32, 0.82),
      size: rand(7, 15),
      sizeEnd: rand(4, 9),
      color: pick(["#c9ced6", "#8f98a6", "#5f6874"]),
      type: "debris",
      rotation: rand(0, TAU),
      spin: rand(-8, 8),
      stretch: rand(0.6, 1.1),
      drag: 0.95,
    });
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.random() * TAU;
    const speed = rand(30, 90);
    pushParticle({
      x: solid.x,
      y: solid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(3, 14),
      gravity: rand(10, 36),
      life: rand(0.28, 0.55),
      size: rand(12, 18),
      sizeEnd: rand(24, 38),
      color: "rgba(162, 170, 182, 0.34)",
      type: "smoke",
      drag: 0.92,
    });
  }
}

function spawnGibs(foe) {
  const spriteKey = foe.boss ? `boss_${foe.bossId}` : `enemy_${foe.kind}`;
  const sprite = assets.getImage(spriteKey) || (foe.boss ? assets.getImage("boss") : null);
  const count = foe.boss ? 14 : foe.kind === "monster" ? 10 : 7;
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * TAU;
    const speed = rand(80, foe.boss ? 300 : 220);
    const life = rand(0.8, foe.boss ? 1.8 : 1.35);
    const gib = {
      x: foe.x,
      y: foe.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - rand(20, 90),
      gravity: rand(140, 260),
      life,
      maxLife: life,
      size: rand(foe.boss ? 8 : 4, foe.boss ? 16 : 10),
      color: foe.blood || foe.color,
      flesh: foe.flesh || foe.color,
      spin: rand(-7, 7),
      rotation: rand(0, TAU),
    };
    if (sprite) {
      gib.useImage = true;
      gib.spriteKey = spriteKey;
      gib.sw = Math.max(12, Math.floor(sprite.width * rand(0.14, foe.boss ? 0.28 : 0.22)));
      gib.sh = Math.max(12, Math.floor(sprite.height * rand(0.14, foe.boss ? 0.28 : 0.22)));
      gib.sx = Math.floor(rand(0, Math.max(1, sprite.width - gib.sw)));
      gib.sy = Math.floor(rand(0, Math.max(1, sprite.height - gib.sh)));
      gib.drawW = gib.size * rand(1.2, 1.8);
      gib.drawH = gib.size * rand(1.2, 1.8);
    }
    world.gibs.push(gib);
  }
  const smokeCount = foe.boss ? 10 : foe.kind === "monster" ? 7 : 5;
  for (let i = 0; i < smokeCount; i += 1) {
    const a = Math.random() * TAU;
    const speed = rand(24, foe.boss ? 84 : 56);
    pushParticle({
      x: foe.x,
      y: foe.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - rand(18, 46),
      gravity: rand(8, 26),
      life: rand(0.34, foe.boss ? 0.92 : 0.66),
      size: rand(12, foe.boss ? 26 : 18),
      sizeEnd: rand(24, foe.boss ? 54 : 36),
      color: foe.kind === "animal"
        ? "rgba(78, 62, 58, 0.34)"
        : foe.kind === "swarm"
          ? "rgba(124, 255, 72, 0.26)"
          : "rgba(62, 68, 76, 0.44)",
      type: "smoke",
      drag: 0.93,
    });
  }
  const oilCount = foe.kind === "animal" ? 4 : foe.boss ? 14 : 9;
  for (let i = 0; i < oilCount; i += 1) {
    const a = Math.random() * TAU;
    const speed = rand(40, foe.boss ? 220 : 150);
    pushParticle({
      x: foe.x,
      y: foe.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - rand(8, 34),
      gravity: rand(80, 170),
      life: rand(0.34, foe.boss ? 1.04 : 0.76),
      size: rand(4, foe.boss ? 10 : 7),
      sizeEnd: rand(2, 4),
      color: foe.kind === "animal"
        ? "rgba(94, 32, 28, 0.48)"
        : foe.kind === "swarm"
          ? pick(["rgba(91, 255, 55, 0.42)", "rgba(156, 255, 47, 0.36)", "rgba(34, 54, 24, 0.5)"])
          : pick(["rgba(14, 18, 24, 0.68)", "rgba(24, 30, 38, 0.72)", "rgba(40, 52, 64, 0.6)"]),
      type: "oil",
      drag: 0.94,
    });
  }
}

function activateNextAnnouncement() {
  if (world.banner || world.synergyToast || world.bossWarning) return;
  const next = world.bannerQueue.shift();
  if (!next) return;

  if (next.kind === "synergy") {
    world.synergyToast = {
      id: next.id,
      title: next.title,
      subtitle: next.subtitle,
      timer: next.duration,
      total: next.duration,
      accent: next.accent,
    };
    return;
  }

  if (next.kind === "boss") {
    world.bossWarning = {
      title: next.title,
      subtitle: next.subtitle,
      bossName: next.bossName,
      timer: next.duration,
      total: next.duration,
      accent: next.accent,
    };
    return;
  }

  world.banner = {
    title: next.title,
    subtitle: next.subtitle,
    timer: next.duration,
    total: next.duration,
    accent: next.accent,
  };
}

function queueAnnouncement(entry) {
  world.bannerQueue.push(entry);
  activateNextAnnouncement();
}

function clearAnnouncements() {
  world.banner = null;
  world.bannerQueue = [];
  world.synergyToast = null;
  world.bossWarning = null;
  world.pendingSynergyAnnouncements = [];
}

function syncCheatToastDom() {
  if (!cheatToastRoot) return;

  if (!world.cheatToast || world.cheatToastTimer <= 0) {
    cheatToastRoot.classList.remove("visible");
    cheatToastRoot.textContent = "";
    return;
  }

  cheatToastRoot.textContent = world.cheatToast;
  cheatToastRoot.classList.add("visible");
}

function showCheatToast(message) {
  world.cheatToast = message;
  world.cheatToastTimer = 2.4;
  syncCheatToastDom();

  if (cheatToastTimeout) window.clearTimeout(cheatToastTimeout);
  cheatToastTimeout = window.setTimeout(() => {
    if (world.cheatToast !== message) return;
    world.cheatToast = null;
    world.cheatToastTimer = 0;
    syncCheatToastDom();
  }, 2400);
}

function banner(title, subtitle, duration, accent = "#ff5b2e") {
  queueAnnouncement({
    kind: "banner",
    title,
    subtitle,
    duration,
    accent,
  });
}

function queueBossDefeated(bossName) {
  queueAnnouncement({
    kind: "banner",
    title: t("bossDefeated.title"),
    subtitle: bossName || t("boss.unknown"),
    duration: 2.4,
    accent: "#ff9d43",
  });
}

function addScreenShake(amount) {
  world.screenShake = Math.max(world.screenShake, amount);
}

function defaultActiveCheats() {
  return {
    godMode: false,
    forceTechpriest: false,
    armoryDrop: false,
    swarmHell: false,
  };
}

function defaultNextRunCheats() {
  return {
    godMode: false,
    forceTechpriest: false,
    armoryDrop: false,
    swarmHell: false,
  };
}

function markRunCheated() {
  if (!world.cheatsUsed) {
    restoreRunAchievementSnapshot();
  }

  world.cheatsUsed = true;

  if (world.runStatsCounted) {
    metaState.totalRuns = Math.max(0, (metaState.totalRuns || 0) - 1);
    world.runStatsCounted = false;
    saveMetaProgress();
    renderMetaUpgrades();
  }
}

function applyNextRunCheats() {
  const next = world.nextRunCheats || {};

  world.activeCheats = {
    godMode: Boolean(next.godMode),
    forceTechpriest: Boolean(next.forceTechpriest),
    armoryDrop: Boolean(next.armoryDrop),
    swarmHell: Boolean(next.swarmHell),
  };

  world.cheatsUsed = false;
  if (
    world.activeCheats.godMode
    || world.activeCheats.forceTechpriest
    || world.activeCheats.armoryDrop
    || world.activeCheats.swarmHell
  ) {
    markRunCheated();
  }

  world.nextRunCheats = defaultNextRunCheats();
}

function clearActiveRunCheats() {
  world.cheatsUsed = false;
  world.activeCheats = defaultActiveCheats();
  world.runStatsCounted = false;
}

function addCheatCredits(amount = 1000) {
  const credits = Math.max(0, Math.floor(Number(amount) || 0));
  if (!credits) return;

  metaState.credits += credits;
  metaState.totalEarnedCredits += credits;
  saveMetaProgress();
  renderMetaUpgrades();
}

function spawnArmoryCheatPickups() {
  if (!world.activeCheats?.armoryDrop) return;

  const weaponIds = ["shotgun", "smg", "rail"];
  const spacing = 58;
  const startX = player.x - ((weaponIds.length - 1) * spacing) / 2;
  const y = player.y + 82;

  for (let i = 0; i < weaponIds.length; i += 1) {
    const weaponId = weaponIds[i];
    if (!weapons[weaponId]) continue;

    world.pickups.push({
      x: startX + i * spacing,
      y,
      radius: 13,
      type: `weapon-${weaponId}`,
      life: 22,
      pulse: Math.random() * TAU,
    });
  }

  world.activeCheats.armoryDrop = false;
}

function cheatKillAll() {
  markRunCheated();

  for (const foe of world.foes || []) {
    foe.hp = 0;
    foe.hitFlash = Math.max(foe.hitFlash || 0, 0.25);
  }

  showCheatToast("PURGE PROTOCOL / KILLALL");
}

function cheatHealMe() {
  markRunCheated();
  player.health = player.maxHealth;
  player.hitFlash = 0.18;
  syncHud();
  showCheatToast("MEDICAL OVERRIDE / HEALME");
}

function cheatNuke() {
  markRunCheated();

  const radius = 520;
  const damage = 9999;

  pushBlastGlow(player.x, player.y, radius, "rgba(116, 255, 77, 0.28)", 0.45);
  burst(player.x, player.y, "#9cff2f", 26, 1.2);
  addScreenShake(0.45);

  for (const foe of world.foes || []) {
    const distance = Math.hypot(foe.x - player.x, foe.y - player.y);
    if (distance > radius) continue;

    applyDamageToFoe(foe, damage * (1 - (distance / radius) * 0.35), {
      source: "cheat_nuke",
    });
    foe.hitFlash = Math.max(foe.hitFlash || 0, 0.35);
  }

  showCheatToast("NUCLEAR PURGE / NUKE");
}

function syncPointerWorld() {
  world.pointer.x = world.camera.x + world.pointerScreen.x;
  world.pointer.y = world.camera.y + world.pointerScreen.y;
}

function updateCamera() {
  world.camera.width = canvas.width;
  world.camera.height = canvas.height;
  world.camera.x = clamp(player.x - world.camera.width / 2, 0, Math.max(0, world.width - world.camera.width));
  world.camera.y = clamp(player.y - world.camera.height / 2, 0, Math.max(0, world.height - world.camera.height));
  syncPointerWorld();
}

function computeNormalViewportSize() {
  const aspect = DEFAULT_CANVAS_WIDTH / DEFAULT_CANVAS_HEIGHT;
  const safeWidth = Math.max(760, window.innerWidth - 24);
  const safeHeight = Math.max(460, window.innerHeight - 28);

  let width = Math.min(DEFAULT_CANVAS_WIDTH, safeWidth);
  let height = width / aspect;

  if (height > Math.min(DEFAULT_CANVAS_HEIGHT, safeHeight)) {
    height = Math.min(DEFAULT_CANVAS_HEIGHT, safeHeight);
    width = height * aspect;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

function applyGameViewportSize(width, height) {
  canvas.width = width;
  canvas.height = height;

  fullscreenRoot?.style.setProperty("--game-viewport-width", `${width}px`);
  fullscreenRoot?.style.setProperty("--game-viewport-height", `${height}px`);

  world.camera.width = canvas.width;
  world.camera.height = canvas.height;

  updateCamera();
}

function resizeGameViewportForFullscreen() {
  const fullscreen = document.fullscreenElement === fullscreenRoot;

  if (fullscreen) {
    const rect = gameFrame?.getBoundingClientRect();
    const nextWidth = Math.max(DEFAULT_CANVAS_WIDTH, Math.floor(rect?.width || window.innerWidth));
    const nextHeight = Math.max(DEFAULT_CANVAS_HEIGHT, Math.floor(rect?.height || window.innerHeight));

    world.isGameFullscreen = true;
    world.canvasUiScale = 0.78;
    world.waveBannerScale = 1.02;

    applyGameViewportSize(nextWidth, nextHeight);
    return;
  }

  const normalSize = computeNormalViewportSize();

  world.isGameFullscreen = false;
  world.canvasUiScale = normalSize.width < DEFAULT_CANVAS_WIDTH || normalSize.height < DEFAULT_CANVAS_HEIGHT
    ? 0.88
    : 1;
  world.waveBannerScale = normalSize.width < DEFAULT_CANVAS_WIDTH || normalSize.height < DEFAULT_CANVAS_HEIGHT
    ? 0.94
    : 1;

  applyGameViewportSize(normalSize.width, normalSize.height);
}

function moveVector() {
  const left = world.keys.has("a") || world.keys.has("arrowleft");
  const right = world.keys.has("d") || world.keys.has("arrowright");
  const up = world.keys.has("w") || world.keys.has("arrowup");
  const down = world.keys.has("s") || world.keys.has("arrowdown");
  const x = (right ? 1 : 0) - (left ? 1 : 0);
  const y = (down ? 1 : 0) - (up ? 1 : 0);
  if (!x && !y) return { x: 0, y: 0, active: false };
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, active: true };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeMetaState(data = {}) {
  const base = createDefaultMetaState();
  const levels = { ...base.metaUpgradeLevels };
  if (data.metaUpgradeLevels && typeof data.metaUpgradeLevels === "object") {
    for (const id of Object.keys(levels)) {
      const maxLevel = metaUpgrades[id].maxLevel;
      levels[id] = clamp(Number(data.metaUpgradeLevels[id]) || 0, 0, maxLevel);
    }
  }
  const unlocked = Object.keys(levels).filter((id) => levels[id] > 0);
  return {
    credits: Math.max(0, Math.floor(Number(data.credits) || 0)),
    totalEarnedCredits: Math.max(0, Math.floor(Number(data.totalEarnedCredits) || 0)),
    unlockedMetaUpgrades: unlocked,
    metaUpgradeLevels: levels,
    totalRuns: Math.max(0, Math.floor(Number(data.totalRuns) || 0)),
    totalKills: Math.max(0, Math.floor(Number(data.totalKills) || 0)),
    bestWaveEver: Math.max(0, Math.floor(Number(data.bestWaveEver) || 0)),
    bestScoreEver: Math.max(0, Math.floor(Number(data.bestScoreEver) || 0)),
  };
}

function loadMetaProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_PROGRESS_KEY) || "{}");
    return normalizeMetaState(parsed);
  } catch {
    return createDefaultMetaState();
  }
}

function saveMetaProgress() {
  metaState.unlockedMetaUpgrades = Object.keys(metaState.metaUpgradeLevels).filter((id) => metaState.metaUpgradeLevels[id] > 0);
  localStorage.setItem(META_PROGRESS_KEY, JSON.stringify(metaState));
}

function getMetaUpgradeLevel(id) {
  return metaState.metaUpgradeLevels[id] || 0;
}

function getMetaUpgradeCost(id) {
  const upgrade = metaUpgrades[id];
  if (!upgrade) return Infinity;
  const level = getMetaUpgradeLevel(id);
  if (level >= upgrade.maxLevel) return Infinity;
  return Math.round(upgrade.baseCost * (1 + level * 0.6) + level * upgrade.costScale);
}

function canBuyMetaUpgrade(id) {
  const upgrade = metaUpgrades[id];
  if (!upgrade) return false;
  const level = getMetaUpgradeLevel(id);
  if (level >= upgrade.maxLevel) return false;
  return metaState.credits >= getMetaUpgradeCost(id);
}

function renderMetaStats() {
  if (!metaStatsGrid) return;
  const stats = [
    [t("meta.totalRuns"), metaState.totalRuns],
    [t("meta.totalKills"), metaState.totalKills],
    [t("meta.bestWave"), metaState.bestWaveEver],
    [t("meta.bestScore"), metaState.bestScoreEver],
    [t("meta.totalCredits"), metaState.totalEarnedCredits],
    [t("meta.balance"), metaState.credits],
  ];
  metaStatsGrid.innerHTML = stats.map(([label, value]) => (
    `<div class="meta-stat-card"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`
  )).join("");
}

function renderMetaUpgrades() {
  if (metaCreditsValue) metaCreditsValue.textContent = metaState.credits;
  if (metaEarnedValue) metaEarnedValue.textContent = metaState.totalEarnedCredits;
  if (metaTeaserCredits) metaTeaserCredits.textContent = metaState.credits;
  renderMetaStats();
  if (!metaUpgradeList) return;
  if (metaUpgradeTabs) {
    metaUpgradeTabs.querySelectorAll("[data-meta-tab]").forEach((button) => {
      const isActive = button.dataset.metaTab === activeMetaUpgradeTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }
  const visibleUpgrades = Object.values(metaUpgrades).filter((upgrade) => {
    const category = upgrade.category || "general";
    return category === activeMetaUpgradeTab;
  });
  metaUpgradeList.innerHTML = visibleUpgrades.map((upgrade) => {
    const level = getMetaUpgradeLevel(upgrade.id);
    const cost = getMetaUpgradeCost(upgrade.id);
    const maxed = level >= upgrade.maxLevel;
    const disabled = !canBuyMetaUpgrade(upgrade.id);
    return (
      `<article class="meta-upgrade-card${maxed ? " is-maxed" : ""}">`
      + `<div class="meta-upgrade-head"><strong>${escapeHtml(metaUpgradeTitle(upgrade))}</strong><span class="meta-upgrade-level">${escapeHtml(t("meta.level", { level, max: upgrade.maxLevel }))}</span></div>`
      + `<p>${escapeHtml(metaUpgradeDescription(upgrade))}</p>`
      + `<div class="meta-upgrade-foot">`
      + `<span class="meta-upgrade-cost">${escapeHtml(maxed ? t("meta.max") : t("meta.cost", { cost }))}</span>`
      + `<button class="action action-small${maxed ? " action-maxed" : " action-ghost"}" type="button" data-meta-upgrade-id="${upgrade.id}" ${disabled ? "disabled" : ""}>${escapeHtml(maxed ? t("meta.complete") : t("meta.buy"))}</button>`
      + `</div>`
      + `</article>`
    );
  }).join("");
}

function openMetaOverlay() {
  if (!["menu", "gameover"].includes(world.state)) return;
  closeLeaderboardOverlay();
  closeControlsOverlay();
  if (metaOverlay) metaOverlay.classList.add("visible");
  renderMetaUpgrades();
}

function closeMetaOverlay() {
  if (metaOverlay) metaOverlay.classList.remove("visible");
}

function isActiveRunState(state = world.state) {
  return ["playing", "intermission", "wave_clear", "perk_select"].includes(state);
}

function isPauseAllowed() {
  return isActiveRunState(world.state);
}

function openPauseMenu() {
  if (!isPauseAllowed()) return;
  world.stateBeforePause = world.state;
  world.pauseOpenedAt = performance.now();
  world.state = "paused";
  world.pointer.down = false;
  pauseOverlay?.classList.add("visible");
}

function closePauseMenu() {
  pauseOverlay?.classList.remove("visible");

  if (world.state === "paused") {
    world.state = world.stateBeforePause || "playing";
  }

  world.stateBeforePause = null;
}

function forceClosePauseMenu() {
  pauseOverlay?.classList.remove("visible");
  if (world.state === "paused") {
    world.state = world.stateBeforePause || "menu";
  }
  world.stateBeforePause = null;
}

function abortRunToSummary() {
  if (world.state !== "paused" && !isActiveRunState(world.state)) return;

  forceClosePauseMenu();

  finalizeRunMetaProgress();

  world.state = "gameover";
  world.resultOverlayKind = "aborted";
  world.pointer.down = false;
  world.enemyShots = [];
  world.bullets = [];
  world.grenades = [];
  clearAnnouncements();

  audio.setMode("menu");
  closeWaveBonusSelection();
  hideWaveClearOverlay();
  hideDeathSequenceOverlay();
  closeMetaOverlay();

  overlayTitle.textContent = t("overlay.title.aborted");
  overlayText.textContent = t("overlay.text.aborted", {
    score: world.score,
    wave: world.wave,
    kills: world.kills,
    credits: world.runCreditsEarned,
  });

  overlayButton.textContent = t("ui.tryAgain");
  if (overlayMetaButton) overlayMetaButton.classList.remove("hidden");

  const runEntry = buildRunResultEntry("aborted");
  showScoreEntry(runEntry);
  clearActiveRunCheats();

  overlay.classList.add("visible");
  renderMetaUpgrades();
}

function returnToMainMenuFromRun() {
  if (world.state === "paused" || isActiveRunState(world.state)) {
    finalizeRunMetaProgress();
  }

  forceClosePauseMenu();

  world.pointer.down = false;
  world.enemyShots = [];
  world.bullets = [];
  clearAnnouncements();

  closeWaveBonusSelection();
  hideWaveClearOverlay();
  hideDeathSequenceOverlay();
  hideScoreEntry();
  closeMetaOverlay();

  overlay.classList.remove("visible");

  audio.setMode("menu");
  clearActiveRunCheats();
  showMainMenu();
  renderMetaUpgrades();
}

function returnToMainMenuFromResults() {
  if (world.state !== "gameover") return;

  hideScoreEntry();
  closeMetaOverlay();
  overlay.classList.remove("visible");
  world.pointer.down = false;
  world.resultOverlayKind = null;
  audio.setMode("menu");
  clearActiveRunCheats();
  showMainMenu();
  renderMetaUpgrades();
}

function toggleMainMenuAudioSettings() {
  if (!mainMenuAudioPanel || !mainMenuAudioButton) return;

  const isOpen = !mainMenuAudioPanel.classList.contains("hidden");

  mainMenuAudioPanel.classList.toggle("hidden", isOpen);
  mainMenuAudioButton.setAttribute("aria-expanded", String(!isOpen));

  if (mainMenuAudioState) {
    mainMenuAudioState.textContent = !isOpen ? t("mainMenu.open") : t("mainMenu.closed");
  }
}

function syncMainMenuAudioState() {
  if (!mainMenuAudioPanel || !mainMenuAudioState) return;
  const isOpen = !mainMenuAudioPanel.classList.contains("hidden");
  mainMenuAudioState.textContent = isOpen ? t("mainMenu.open") : t("mainMenu.closed");
}

function showMainMenu() {
  clearActiveRunCheats();
  world.state = "menu";
  world.grenades = [];
  forceClosePauseMenu();
  world.resultOverlayKind = null;
  clearAnnouncements();
  mainMenuOverlay?.classList.add("visible");
  document.body.classList.add("has-main-menu");
  audio.setMode("menu");
  closeMetaOverlay();
  closeLeaderboardOverlay();
  closeControlsOverlay();
  closeWaveBonusSelection();
  hideWaveClearOverlay();
  hideDeathSequenceOverlay();
  if (overlay) overlay.classList.remove("visible");
}

function hideMainMenu() {
  mainMenuOverlay?.classList.remove("visible");
  document.body.classList.remove("has-main-menu");
}

function openControlsOverlay() {
  closeMetaOverlay();
  closeLeaderboardOverlay();
  controlsOverlay?.classList.add("visible");
}

function closeControlsOverlay() {
  controlsOverlay?.classList.remove("visible");
}

function exitToProjectPage() {
  const url = "https://darthlocius.itch.io/block-zero";
  try {
    window.open(url, "_top");
  } catch {
    window.location.href = url;
  }
}

function buyMetaUpgrade(id) {
  const upgrade = metaUpgrades[id];
  if (!upgrade || !canBuyMetaUpgrade(id)) return false;
  const cost = getMetaUpgradeCost(id);
  metaState.credits -= cost;
  metaState.metaUpgradeLevels[id] = getMetaUpgradeLevel(id) + 1;
  metaState.unlockedMetaUpgrades = Object.keys(metaState.metaUpgradeLevels).filter((key) => metaState.metaUpgradeLevels[key] > 0);
  saveMetaProgress();
  renderMetaUpgrades();
  syncHud();
  return true;
}

function getMetaMaxHealthBonus() { return getMetaUpgradeLevel("max_health") * 10; }
function getMetaMoveSpeedMultiplier() { return 1 + getMetaUpgradeLevel("move_speed") * 0.04; }
function getMetaDamageTakenMultiplier() { return 1 - getMetaUpgradeLevel("damage_resistance") * 0.04; }
function getMetaPickupLuckBonus() { return getMetaUpgradeLevel("pickup_luck") * 0.06; }
function getMetaWeaponDamageMultiplier() { return 1 + getMetaUpgradeLevel("weapon_mastery") * 0.05; }
function getMetaExecutionBonusMultiplier() { return 1 + getMetaUpgradeLevel("crit_protocol") * 0.05; }
function getMetaArmoryDamageMultiplier() { return 1 + getMetaUpgradeLevel("armory_damage") * 0.04; }
function getMetaArmoryFireRateMultiplier() { return 1 - getMetaUpgradeLevel("armory_fire_rate") * 0.03; }
function getMetaArmoryProjectileSpeedMultiplier() { return 1 + getMetaUpgradeLevel("armory_projectile_speed") * 0.04; }
function getMetaArmoryRangeMultiplier() { return 1 + getMetaUpgradeLevel("armory_range") * 0.06; }
function getMetaArmorySpreadMultiplier() { return 1 - getMetaUpgradeLevel("armory_stability") * 0.05; }
function getMetaArmoryPierceBonus(weaponId) {
  if (weaponId === "shotgun") return 0;
  return getMetaUpgradeLevel("armory_pierce");
}
function getMetaHealingMultiplier() { return 1 + getMetaUpgradeLevel("recovery") * 0.1; }
function getMetaPerkBiasFactor() { return 1 + getMetaUpgradeLevel("perk_bias") * 0.08; }
function getMetaRerollCapacity() { return getMetaUpgradeLevel("reroll_protocol"); }
function hasExpandedSelection() { return getMetaUpgradeLevel("expanded_selection") > 0; }
function hasSynergyScanner() { return getMetaUpgradeLevel("synergy_scanner") > 0; }
function getWaveBonusChoiceCount() { return hasExpandedSelection() ? 4 : 3; }

function calculateRunCredits() {
  const waveCredits = world.wave * 12;
  const killCredits = Math.floor(world.kills * 0.45);
  const scoreCredits = Math.floor(world.score / 180);
  const newBestWave = world.wave > metaState.bestWaveEver ? 18 : 0;
  const newBestScore = world.score > metaState.bestScoreEver ? 24 : 0;
  return Math.max(8, waveCredits + killCredits + scoreCredits + newBestWave + newBestScore);
}

function finalizeRunMetaProgress() {
  if (world.runMetaAwarded) return;
  if (world.cheatsUsed) {
    world.runMetaAwarded = true;
    world.runCreditsEarned = 0;
    renderMetaUpgrades();
    return;
  }
  const earned = calculateRunCredits();
  world.runMetaAwarded = true;
  world.runCreditsEarned = earned;
  metaState.credits += earned;
  metaState.totalEarnedCredits += earned;
  metaState.totalKills += world.kills;
  metaState.bestWaveEver = Math.max(metaState.bestWaveEver, world.wave);
  metaState.bestScoreEver = Math.max(metaState.bestScoreEver, world.score);
  saveMetaProgress();
  renderMetaUpgrades();
}

function buildRunResultEntry(endReason) {
  world.runEndReason = endReason;
  return {
    score: world.score,
    kills: world.kills,
    wave: world.wave,
    creditsEarned: world.runCreditsEarned,
    creditsTotal: metaState.credits,
    weapon: player.weapon,
    weaponsUsed: Array.isArray(world.weaponsUsed) ? [...world.weaponsUsed] : [player.weapon],
    synergies: [...world.activeSynergies],
    duration: Math.round(world.runDuration || 0),
    maxCombo: Number((world.maxCombo || world.combo || 1).toFixed(1)),
    endReason,
    cheatsUsed: Boolean(world.cheatsUsed),
  };
}

function formatRunDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function runEndReasonLabel(reason) {
  if (reason === "aborted") return t("summary.resultAborted");
  if (reason === "victory") return t("summary.resultVictory");
  return t("summary.resultDeath");
}

function renderRunSummary(entry = null) {
  if (!runSummaryPanel) return;
  if (!entry) {
    runSummaryPanel.classList.add("hidden");
    return;
  }
  runSummaryPanel.classList.remove("hidden");
  const duration = formatRunDuration(entry.duration);
  const maxCombo = Number(entry.maxCombo || 1).toFixed(1);
  const weapon = entry.weapon ? weaponLabel(entry.weapon) : t("leaderboard.unknown");
  const synergies = Array.isArray(entry.synergies) ? entry.synergies : [];

  if (runSummaryResult) runSummaryResult.textContent = runEndReasonLabel(entry.endReason);
  if (runSummaryDuration) runSummaryDuration.textContent = duration;
  if (runSummaryWave) runSummaryWave.textContent = entry.wave;
  if (runSummaryKills) runSummaryKills.textContent = entry.kills;
  if (runSummaryScore) runSummaryScore.textContent = entry.score;
  if (runSummaryMaxCombo) runSummaryMaxCombo.textContent = `x${maxCombo}`;
  if (runSummaryWeapon) runSummaryWeapon.textContent = weapon;
  if (runSummaryCreditsEarned) runSummaryCreditsEarned.textContent = entry.creditsEarned;
  if (runSummaryCreditsTotal) runSummaryCreditsTotal.textContent = entry.creditsTotal;

  if (runSummarySynergies) {
    const cheatNotice = entry.cheatsUsed
      ? `<span class="summary-cheat-warning">${escapeHtml(t("run.cheatsUsed"))}</span>`
      : "";
    runSummarySynergies.innerHTML = synergies.length
      ? `${cheatNotice}${synergies.map((id) => `<span class="summary-synergy-chip">${escapeHtml(synergyTitle(id))}</span>`).join("")}`
      : `${cheatNotice}<span class="summary-synergy-empty">${escapeHtml(t("leaderboard.none"))}</span>`;
  }
}

function currentWeapon() {
  const base = weapons[player.weapon] || weapons.pistol;
  const mods = world.waveBonusModifiers;
  const pellets = base.pellets + (base.id === "shotgun" ? mods.shotgunPelletsBonus : 0);
  const pierce = base.id === "rail"
    ? 2 + mods.plasmaPierceBonus
    : (base.id === "pistol" || base.id === "smg" ? mods.flatPierceBonus : 0);
  return {
    ...base,
    label: weaponLabel(base.id),
    pellets,
    damage: base.damage
      * getMetaWeaponDamageMultiplier()
      * getMetaArmoryDamageMultiplier()
      * mods.globalDamageMul
      * (base.id === "rail" ? mods.plasmaDamageMul : 1),
    speed: base.speed
      * getMetaArmoryProjectileSpeedMultiplier()
      * mods.projectileSpeedMul,
    spread: base.spread
      * getMetaArmorySpreadMultiplier()
      * mods.spreadMul
      * (base.id === "smg" ? mods.smgSpreadMul : 1),
    pierce: pierce + getMetaArmoryPierceBonus(base.id),
    rangeMul: getMetaArmoryRangeMultiplier(),
  };
}
function fireRate() {
  const weapon = currentWeapon();
  return weapon.fireRate
    * getMetaArmoryFireRateMultiplier()
    * (world.buffs.rapid > 0 ? 0.55 : 1)
    * world.waveBonusModifiers.fireRateMul
    * (weapon.id === "pistol" ? world.waveBonusModifiers.pistolFireRateMul : 1)
    * (weapon.id === "rail" ? world.waveBonusModifiers.railFireRateMul : 1);
}
function moveSpeed() {
  return player.baseSpeed
    * getMetaMoveSpeedMultiplier()
    * (world.buffs.speed > 0 ? 1.35 : 1)
    * world.waveBonusModifiers.moveSpeedMul;
}

function formatLeaderboardDate(timestamp) {
  const value = Number(timestamp) || 0;
  if (!value) return t("leaderboard.unknown");

  try {
    return new Intl.DateTimeFormat(getLanguage() === "ru" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return t("leaderboard.unknown");
  }
}

function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => (
    b.score - a.score
    || b.kills - a.kills
    || b.wave - a.wave
    || a.timestamp - b.timestamp
  )).slice(0, 100);
}

function loadLeaderboard() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return sortLeaderboard(parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        ...entry,
        name: typeof entry.name === "string" ? entry.name.trim() : "",
        score: Number(entry.score) || 0,
        kills: Number(entry.kills) || 0,
        wave: Number(entry.wave) || 0,
        creditsEarned: Number(entry.creditsEarned) || 0,
        creditsTotal: Number(entry.creditsTotal) || 0,
        weapon: typeof entry.weapon === "string" ? entry.weapon : "",
        synergies: Array.isArray(entry.synergies) ? entry.synergies.filter((id) => typeof id === "string") : [],
        duration: Number(entry.duration) || 0,
        maxCombo: Number(entry.maxCombo) || 1,
        endReason: typeof entry.endReason === "string" ? entry.endReason : "death",
        weaponsUsed: Array.isArray(entry.weaponsUsed)
          ? entry.weaponsUsed.filter((id) => typeof id === "string")
          : (entry.weapon ? [entry.weapon] : []),
        timestamp: Number(entry.timestamp) || 0,
      })));
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  world.leaderboard = sortLeaderboard(entries);
  if (world.selectedLeaderboardIndex >= world.leaderboard.length) {
    world.selectedLeaderboardIndex = Math.max(0, world.leaderboard.length - 1);
  }
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(world.leaderboard));
  renderLeaderboard();
}

function renderLeaderboardDetails(entry, index) {
  if (!leaderboardDetails) return;

  if (!entry) {
    leaderboardDetails.innerHTML = `
      <div class="leaderboard-empty-report">
        <div class="leaderboard-empty-icon">◆</div>
        <p>${escapeHtml(t("leaderboard.selectEntry"))}</p>
      </div>
    `;
    return;
  }

  const rank = index + 1;
  const name = displayLeaderboardName(entry.name);
  const date = formatLeaderboardDate(entry.timestamp);
  const weapon = entry.weapon ? weaponLabel(entry.weapon) : t("leaderboard.unknown");
  const creditsEarned = Number(entry.creditsEarned) || 0;
  const duration = formatRunDuration(entry.duration);
  const maxCombo = Number(entry.maxCombo || 1).toFixed(1);
  const result = runEndReasonLabel(entry.endReason);
  const rawWeaponsUsed = Array.isArray(entry.weaponsUsed) && entry.weaponsUsed.length
    ? entry.weaponsUsed.filter((id) => typeof id === "string")
    : (entry.weapon ? [entry.weapon] : []);
  const uniqueWeaponsUsed = [...new Set(rawWeaponsUsed)];
  const weaponsUsedLabels = uniqueWeaponsUsed.map((id) => weaponLabel(id));
  const hasDistinctWeaponsList = uniqueWeaponsUsed.length > 1
    || (uniqueWeaponsUsed.length === 1 && entry.weapon && uniqueWeaponsUsed[0] !== entry.weapon);
  const weaponsUsed = weaponsUsedLabels.join(", ");
  const synergyChips = Array.isArray(entry.synergies) && entry.synergies.length
    ? entry.synergies.map((id) => `<span class="leaderboard-synergy-chip">${escapeHtml(synergyTitle(id))}</span>`).join("")
    : `<span class="leaderboard-synergy-empty">${escapeHtml(t("leaderboard.none"))}</span>`;

  leaderboardDetails.innerHTML = `
    <div class="leaderboard-report-head">
      <span class="leaderboard-report-kicker">${escapeHtml(t("leaderboard.reportTitle"))}</span>
      <div class="leaderboard-report-rank${rank <= 3 ? ` top-${rank}` : ""}">
        #${rank}
      </div>
    </div>

    <div class="leaderboard-detail-main leaderboard-report-main">
      <h3>${escapeHtml(name)}</h3>
      <p>${escapeHtml(t("leaderboard.recordedAt", { date }))}</p>
    </div>

    <div class="leaderboard-report-score">
      <span>${escapeHtml(t("summary.score"))}</span>
      <strong>${entry.score}</strong>
    </div>

    <div class="leaderboard-detail-grid">
      <div><span>${escapeHtml(t("summary.result"))}</span><strong>${escapeHtml(result)}</strong></div>
      <div><span>${escapeHtml(t("summary.wave"))}</span><strong>${entry.wave}</strong></div>
      <div><span>${escapeHtml(t("summary.kills"))}</span><strong>${entry.kills}</strong></div>
      <div><span>${escapeHtml(t("summary.duration"))}</span><strong>${escapeHtml(duration)}</strong></div>
      <div><span>${escapeHtml(t("summary.maxCombo"))}</span><strong>x${maxCombo}</strong></div>
      <div><span>${escapeHtml(t("summary.creditsEarned"))}</span><strong>${creditsEarned}</strong></div>
      <div><span>${escapeHtml(t("ui.weapon"))}</span><strong>${escapeHtml(weapon)}</strong></div>
      ${hasDistinctWeaponsList
        ? `<div><span>${escapeHtml(t("leaderboard.weaponsUsed"))}</span><strong>${escapeHtml(weaponsUsed)}</strong></div>`
        : ""}
    </div>
    <div class="leaderboard-synergy-block">
      <span>${escapeHtml(t("leaderboard.synergies"))}</span>
      <div class="leaderboard-synergy-list">${synergyChips}</div>
    </div>
  `;
}

function renderLeaderboard() {
  const entries = world.leaderboard || [];
  const countKey = entries.length === 1 ? "leaderboard.countOne" : "leaderboard.count";

  if (leaderboardCount) {
    leaderboardCount.textContent = t(countKey, { count: entries.length });
  }

  if (leaderboardOverlayCount) {
    leaderboardOverlayCount.textContent = entries.length;
  }

  if (leaderboardBestScore) {
    leaderboardBestScore.textContent = entries[0]?.score || 0;
  }

  if (!leaderboardFullBody) return;

  if (entries.length === 0) {
    leaderboardFullBody.innerHTML = `<div class="leaderboard-empty">${escapeHtml(t("leaderboard.empty"))}</div>`;
    renderLeaderboardDetails(null, -1);
    return;
  }

  if (
    typeof world.selectedLeaderboardIndex !== "number"
    || world.selectedLeaderboardIndex < 0
    || world.selectedLeaderboardIndex >= entries.length
  ) {
    world.selectedLeaderboardIndex = 0;
  }

  leaderboardFullBody.innerHTML = entries.map((entry, index) => {
    const selected = world.selectedLeaderboardIndex === index;
    const synergyCount = Array.isArray(entry.synergies) ? entry.synergies.length : 0;
    const rank = index + 1;
    const rankClass = rank === 1
      ? " rank-gold"
      : rank === 2
        ? " rank-silver"
        : rank === 3
          ? " rank-bronze"
          : "";
    return (
      `<button class="leaderboard-full-row leaderboard-full-entry${selected ? " selected" : ""}${rankClass}" type="button" data-leaderboard-index="${index}">`
      + `<span class="leaderboard-rank"><span class="leaderboard-rank-badge">${rank}</span></span>`
      + `<span class="leaderboard-name">${escapeHtml(displayLeaderboardName(entry.name))}</span>`
      + `<span>${entry.score}</span>`
      + `<span>${entry.kills}</span>`
      + `<span>${entry.wave}</span>`
      + `<span>${synergyCount}</span>`
      + `<span>${escapeHtml(formatLeaderboardDate(entry.timestamp))}</span>`
      + `</button>`
    );
  }).join("");

  renderLeaderboardDetails(entries[world.selectedLeaderboardIndex], world.selectedLeaderboardIndex);
}

function selectLeaderboardEntry(index) {
  const numericIndex = Number(index);
  if (!Number.isFinite(numericIndex)) return;
  if (numericIndex < 0 || numericIndex >= world.leaderboard.length) return;

  world.selectedLeaderboardIndex = numericIndex;
  renderLeaderboard();
}

function openLeaderboardOverlay() {
  closeControlsOverlay();
  closeMetaOverlay();
  renderLeaderboard();
  leaderboardOverlay?.classList.add("visible");
}

function closeLeaderboardOverlay() {
  leaderboardOverlay?.classList.remove("visible");
}

function showScoreEntry(entry) {
  if (entry?.cheatsUsed) {
    world.pendingLeaderboardEntry = null;
    scoreEntryPanel.classList.add("hidden");
    playerNameInput.value = localStorage.getItem(LEADERBOARD_NAME_KEY) || "";
    renderRunSummary(entry);
    saveScoreStatus.textContent = t("run.cheatsUsed");
    return;
  }

  world.pendingLeaderboardEntry = entry;
  scoreEntryPanel.classList.remove("hidden");
  playerNameInput.value = localStorage.getItem(LEADERBOARD_NAME_KEY) || "";
  renderRunSummary(entry);
  saveScoreStatus.textContent = t("leaderboard.scoreStatus", entry);
}

function hideScoreEntry() {
  world.pendingLeaderboardEntry = null;
  scoreEntryPanel.classList.add("hidden");
  saveScoreStatus.textContent = "";
  renderRunSummary(null);
}

function saveLeaderboardEntry() {
  if (!world.pendingLeaderboardEntry) return;
  if (world.pendingLeaderboardEntry.cheatsUsed) {
    world.pendingLeaderboardEntry = null;
    saveScoreStatus.textContent = t("run.cheatsUsed");
    return;
  }
  const name = (playerNameInput.value || "").trim();
  localStorage.setItem(LEADERBOARD_NAME_KEY, name);
  saveLeaderboard([
    ...world.leaderboard,
    { ...world.pendingLeaderboardEntry, name, timestamp: Date.now() },
  ]);
  saveScoreStatus.textContent = t("leaderboard.saved");
  world.pendingLeaderboardEntry = null;
}

function playerDirectionIndex(angle) {
  const profile = animationProfiles.topdown_octant;
  const segment = TAU / profile.directions.length;
  const normalized = (angle + TAU + segment / 2 + profile.offset) % TAU;
  return Math.floor(normalized / segment) % profile.directions.length;
}

function playerAnimationState(isMoving) {
  if (player.health <= 0 || world.state === "gameover") return "death";
  if (player.shootAnimTimer > 0) return "shoot";
  if (isMoving || player.dashDuration > 0) return "walk";
  return "idle";
}

function updateActorFacing(actor, angle, profileKey = "topdown_octant") {
  const profile = animationProfiles[profileKey];
  if (!profile) return;

  const segment = TAU / profile.directions.length;
  const desiredIndex = playerDirectionIndex(angle);
  if (typeof actor.facingIndex !== "number") {
    actor.facingIndex = desiredIndex;
  } else {
    const currentCenter = actor.facingIndex * segment;
    const holdRange = segment / 2 + profile.hysteresis;
    if (Math.abs(angleDelta(angle, currentCenter)) > holdRange) {
      actor.facingIndex = desiredIndex;
    }
  }

  const verticalSample = Math.sin(angle);
  if (!actor.facingVertical) {
    actor.facingVertical = verticalSample >= 0 ? "down" : "up";
  } else if (Math.abs(verticalSample) > profile.verticalThreshold) {
    actor.facingVertical = verticalSample >= 0 ? "down" : "up";
  }

  actor.facingName = profile.directions[actor.facingIndex];
}

function playerFrameFor(state) {
  const layout = playerSpritesheetMeta.layouts[state];
  if (!layout) return { sx: 0, sy: 0, sw: playerSpritesheetMeta.frameWidth, sh: playerSpritesheetMeta.frameHeight };
  const direction = typeof player.facingIndex === "number" ? player.facingIndex : playerDirectionIndex(player.angle);
  const frameRate = state === "walk" ? 12 : state === "shoot" ? 20 : state === "death" ? 10 : 7;
  const frame = state === "death"
    ? Math.min(layout.rowCount - 1, Math.floor(player.animTime * frameRate))
    : Math.floor(player.animTime * frameRate) % layout.rowCount;
  return {
    sx: direction * playerSpritesheetMeta.frameWidth,
    sy: (layout.rowStart + frame) * playerSpritesheetMeta.frameHeight,
    sw: playerSpritesheetMeta.frameWidth,
    sh: playerSpritesheetMeta.frameHeight,
  };
}

function enemyAnimationState(foe, moving) {
  if (foe.attackAnimTimer > 0) return "attack";
  return moving ? "walk" : "walk";
}

function enemyFrameFor(foe, meta, state) {
  const layout = meta.layouts[state];
  if (!layout) return null;
  const direction = typeof foe.facingIndex === "number" ? foe.facingIndex : 0;
  const frameRate = state === "attack" ? 18 : 10;
  const frame = Math.floor(foe.animTime * frameRate) % layout.rowCount;
  return {
    sx: direction * meta.frameWidth,
    sy: (layout.rowStart + frame) * meta.frameHeight,
    sw: meta.frameWidth,
    sh: meta.frameHeight,
  };
}

function syncHud() {
  const healthCurrent = Math.max(0, Math.ceil(player.health));
  const healthRatio = clamp(player.health / player.maxHealth, 0, 1);
  healthValue.textContent = `${healthCurrent} / ${player.maxHealth}`;
  if (healthBarFill) healthBarFill.style.width = `${healthRatio * 100}%`;
  if (healthBar) healthBar.classList.toggle("low-hp", healthRatio <= 0.35);
  if (healthBarGloss) healthBarGloss.style.opacity = healthRatio <= 0.35 ? "0.72" : "0.9";
  scoreValue.textContent = world.score;
  waveValue.textContent = world.wave || 1;
  comboValue.textContent = `x${world.combo.toFixed(1)}`;
  weaponValue.textContent = currentWeapon().label;
  const grenadeHudVisible = isActiveRunState(world.state)
    || (
      world.state === "paused"
      && isActiveRunState(world.stateBeforePause)
    );
  grenadeHud?.classList.toggle("hidden", !grenadeHudVisible);
  if (grenadeValue) {
    grenadeValue.textContent = `×${world.grenadeCount}`;
  }
  grenadeHud?.classList.toggle("is-empty", world.grenadeCount <= 0);
  grenadeHud?.classList.toggle("is-pulsing", world.grenadeHudPulse > 0);
  grenadeHud?.classList.toggle(
    "is-empty-pulsing",
    world.grenadeHudEmptyPulse > 0,
  );
  grenadeHud?.setAttribute(
    "aria-label",
    t("ui.grenadesCount", {
      count: world.grenadeCount,
      max: world.grenadeMax,
    }),
  );
  if (waveBonusBadge) {
    const activeBonus = currentWaveBonusData();
    if (activeBonus) {
      waveBonusBadge.textContent = `${bonusTitle(activeBonus)} · ${t("boost.untilWaveEnd")}`;
      waveBonusBadge.style.setProperty("--bonus-accent", activeBonus.borderColor || activeBonus.color);
      waveBonusBadge.classList.remove("hidden");
    } else {
      waveBonusBadge.textContent = "";
      waveBonusBadge.classList.add("hidden");
    }
  }
  if (synergyPanel) {
    const visibleSynergies = world.activeSynergies.slice(0, 3).map((id) => synergies[id]).filter(Boolean);
    const overflow = Math.max(0, world.activeSynergies.length - visibleSynergies.length);
    synergyPanel.innerHTML = visibleSynergies.length
      ? `<span class="synergy-panel-title">${escapeHtml(t("synergy.panelTitle"))}</span><div class="synergy-panel-list">${visibleSynergies.map((synergy) => `<span class="synergy-chip">${escapeHtml(synergyTitle(synergy))}</span>`).join("")}${overflow > 0 ? `<span class="synergy-chip synergy-chip-more">+${overflow}</span>` : ""}</div>`
      : `<span class="synergy-panel-title">${escapeHtml(t("synergy.panelTitle"))}</span><span class="synergy-panel-empty">${escapeHtml(t("synergy.none"))}</span>`;
  }
  if (metaTeaserCredits) metaTeaserCredits.textContent = metaState.credits;
  syncBuffs();
}

function syncBuffs() {
  const chips = [];
  if (world.buffs.rapid > 0) chips.push(`<span class="boost-chip rapid">${escapeHtml(t("boost.timer", { label: t("boost.rapid"), seconds: world.buffs.rapid.toFixed(1) }))}</span>`);
  if (world.buffs.speed > 0) chips.push(`<span class="boost-chip speed">${escapeHtml(t("boost.timer", { label: t("boost.speed"), seconds: world.buffs.speed.toFixed(1) }))}</span>`);
  if (world.buffs.armor > 0) chips.push(`<span class="boost-chip armor">${escapeHtml(t("boost.timer", { label: t("boost.armor"), seconds: world.buffs.armor.toFixed(1) }))}</span>`);
  if (world.buffs.drone > 0) chips.push(`<span class="boost-chip" style="border-color:#ff5cf4;color:#ffd2fd;background:rgba(255,92,244,0.16)">${escapeHtml(t("boost.timer", { label: t("boost.drone"), seconds: world.buffs.drone.toFixed(1) }))}</span>`);
  boostsBar.innerHTML = chips.length ? chips.join("") : `<span class="boost-chip empty">${escapeHtml(t("boost.none"))}</span>`;
}

function refreshLocalizedUi() {
  syncHud();
  syncMainMenuAudioState();
  renderLeaderboard();
  renderMetaUpgrades();
  if (world.state === "menu") {
    overlayTitle.textContent = t("overlay.title.menu");
    overlayText.textContent = t("overlay.text.menu");
    overlayButton.textContent = t("ui.toBattle");
  } else if (world.state === "gameover") {
    const aborted = world.resultOverlayKind === "aborted";
    overlayTitle.textContent = t(aborted ? "overlay.title.aborted" : "overlay.title.gameover");
    overlayText.textContent = t(aborted ? "overlay.text.aborted" : "overlay.text.gameover", {
      score: world.score,
      wave: world.wave,
      kills: world.kills,
      credits: world.runCreditsEarned,
    });
    overlayButton.textContent = t("ui.tryAgain");
    if (world.pendingLeaderboardEntry) {
      saveScoreStatus.textContent = t("leaderboard.scoreStatus", world.pendingLeaderboardEntry);
      renderRunSummary(world.pendingLeaderboardEntry);
    }
  }
  if (world.state === "perk_select") renderWaveBonusSelection();
  if (synergyGuideOverlay?.classList.contains("visible")) {
    renderSynergyGuide();
  }
  if (achievementsOverlay?.classList.contains("visible")) {
    renderAchievementsOverlay();
  }
  if (world.synergyToast) {
    world.synergyToast.title = synergyTitle(world.synergyToast.id);
    world.synergyToast.subtitle = t("synergy.toast");
  }
}

addLanguageChangeListener(refreshLocalizedUi);

function generateTerrain() {
  world.terrain = { puddles: [], cracks: [], trash: [], glows: [], windows: [], stains: [] };
  world.decals = [];
  const areaScale = (world.width * world.height) / (BASE_WORLD_WIDTH * BASE_WORLD_HEIGHT);
  const buildingColumnsLeft = [layoutX(38), layoutX(78), layoutX(118)];
  const buildingColumnsRight = [world.width - layoutW(120), world.width - layoutW(84), world.width - layoutW(48)];
  for (let i = 0; i < Math.round(18 * areaScale); i += 1) {
    world.terrain.puddles.push({
      x: rand(layoutX(180), layoutX(790)),
      y: rand(layoutY(60), layoutY(550)),
      rx: rand(layoutW(16), layoutW(42)),
      ry: rand(layoutH(8), layoutH(18)),
      tint: pick(["#13263a", "#173347", "#0b2430"]),
    });
  }
  for (let i = 0; i < Math.round(22 * areaScale); i += 1) {
    world.terrain.cracks.push({
      x: rand(layoutX(160), layoutX(820)),
      y: rand(layoutY(40), layoutY(560)),
      len: rand(layoutW(14), layoutW(48)),
      angle: rand(0, TAU),
    });
  }
  for (let i = 0; i < Math.round(36 * areaScale); i += 1) {
    world.terrain.trash.push({
      x: rand(layoutX(90), layoutX(860)),
      y: rand(layoutY(30), layoutY(570)),
      size: rand(layoutW(3), layoutW(10)),
      angle: rand(0, TAU),
      color: pick(["#2a313b", "#3d444d", "#5b351e"]),
    });
  }
  for (let i = 0; i < Math.round(12 * WORLD_SCALE); i += 1) {
    world.terrain.glows.push({
      x: pick([layoutX(120), layoutX(190), layoutX(740), layoutX(820), layoutX(420), layoutX(540)]),
      y: layoutY(80) + i * layoutH(32) + rand(-layoutH(10), layoutH(12)),
      w: rand(layoutW(18), layoutW(34)),
      h: rand(layoutH(8), layoutH(14)),
      color: pick(["rgba(255, 83, 43, 0.2)", "rgba(41, 211, 194, 0.17)", "rgba(255, 61, 110, 0.18)"]),
    });
  }
  const windowRows = Math.round(10 * WORLD_SCALE);
  for (let row = 0; row < windowRows; row += 1) {
    for (const x of buildingColumnsLeft) world.terrain.windows.push({ x, y: layoutY(44) + row * layoutH(52) });
    for (const x of buildingColumnsRight) world.terrain.windows.push({ x, y: layoutY(36) + row * layoutH(48) });
  }
  for (let i = 0; i < Math.round(10 * areaScale); i += 1) {
    world.terrain.stains.push({
      x: rand(layoutX(200), layoutX(780)),
      y: rand(layoutY(60), layoutY(560)),
      radius: rand(layoutW(12), layoutW(26)),
      color: pick(["rgba(77, 14, 17, 0.18)", "rgba(59, 44, 18, 0.16)", "rgba(10, 10, 10, 0.18)"]),
    });
  }
}

function makeSolid(type, x, y) {
  const s = solids[type];
  return {
    ...s,
    type,
    x,
    y,
    maxHp: s.hp,
    hp: s.hp,
    flash: 0,
    destroyed: false,
    tint: type === "barrel" ? pick(["#8f2d1f", "#56616f", "#6a4b2d"]) : null,
  };
}

function countActiveDestructiblesByTypes(types) {
  return world.destructibles.filter((solid) => !solid.destroyed && types.includes(solid.type)).length;
}

function canSpawnCoverType(type) {
  if (WOODEN_CRATE_TYPES.includes(type)) {
    return countActiveDestructiblesByTypes(WOODEN_CRATE_TYPES) < MAX_ACTIVE_WOODEN_CRATES;
  }
  if (CONCRETE_COVER_TYPES.includes(type)) {
    return countActiveDestructiblesByTypes(CONCRETE_COVER_TYPES) < MAX_ACTIVE_CONCRETE_BLOCKS;
  }
  return true;
}

function spawnWaveBarrels(count) {
  const activeBarrels = countActiveDestructiblesByTypes(["barrel"]);
  const targetCount = Math.min(count, Math.max(0, MAX_ACTIVE_BARRELS - activeBarrels));
  if (targetCount <= 0) return;

  const barrel = solids.barrel;
  let placed = 0;
  for (const point of shuffle(barrelSpawnPoints.map(layoutPoint))) {
    if (placed >= targetCount) break;
    if (Math.hypot(player.x - point.x, player.y - point.y) < 110) continue;
    if (!solidPlacementOpen(point.x, point.y, barrel.w, barrel.h, 22)) continue;
    world.destructibles.push(makeSolid("barrel", point.x, point.y));
    placed += 1;
  }
  for (let attempts = 0; placed < targetCount && attempts < 30; attempts += 1) {
    const x = rand(layoutX(170), world.width - layoutX(140));
    const y = rand(layoutY(80), world.height - layoutY(80));
    if (Math.hypot(player.x - x, player.y - y) < 110) continue;
    if (!solidPlacementOpen(x, y, barrel.w, barrel.h, 24)) continue;
    world.destructibles.push(makeSolid("barrel", x, y));
    placed += 1;
  }
}

function spawnWaveCoverObjects(count = 2 + Math.floor(Math.random() * 2)) {
  let placed = 0;
  for (let typeAttempts = 0; placed < count && typeAttempts < count * 8; typeAttempts += 1) {
    const availableTypes = ["crate", "crate", "barricade", "wall"].filter(canSpawnCoverType);
    if (!availableTypes.length) break;

    const type = pick(availableTypes);
    const solid = solids[type];
    for (let attempts = 0; attempts < 70; attempts += 1) {
      const x = rand(layoutX(150), world.width - layoutX(150));
      const y = rand(layoutY(80), world.height - layoutY(80));
      if (Math.hypot(player.x - x, player.y - y) < 150) continue;
      if (!solidPlacementOpen(x, y, solid.w, solid.h, 26)) continue;
      world.destructibles.push(makeSolid(type, x, y));
      placed += 1;
      break;
    }
  }

  return placed;
}

function generateSolids() {
  world.destructibles = [
    makeSolid("barrel", layoutX(338), layoutY(108)),
    makeSolid("barricade", layoutX(500), layoutY(136)),
    makeSolid("wall", layoutX(808), layoutY(154)),
    makeSolid("crate", layoutX(258), layoutY(278)),
    makeSolid("longcrate", layoutX(392), layoutY(388)),
    makeSolid("barrel", layoutX(216), layoutY(454)),
    makeSolid("crate", world.width * 0.68, world.height * 0.24),
    makeSolid("wall", world.width * 0.78, world.height * 0.38),
    makeSolid("barricade", world.width * 0.84, world.height * 0.52),
    makeSolid("barrel", world.width * 0.88, world.height * 0.2),
    makeSolid("longcrate", world.width * 0.68, world.height * 0.78),
    makeSolid("crate", world.width * 0.84, world.height * 0.86),
  ];
}

function menuOverlay() {
  showMainMenu();
  hideScoreEntry();
  renderMetaUpgrades();
}

function resetGame() {
  clearActiveRunCheats();
  world.bullets = [];
  world.grenades = [];
  world.grenadeCount = GRENADE_CONFIG.maxCharges;
  world.grenadeMax = GRENADE_CONFIG.maxCharges;
  world.grenadeCooldown = 0;
  world.grenadeHudPulse = 0;
  world.grenadeHudEmptyPulse = 0;
  world.enemyShots = [];
  world.foes = [];
  world.particles = [];
  world.pickups = [];
  world.weaponPickupPromptTarget = null;
  world.weaponPickupTarget = null;
  world.weaponPickupHoldTime = 0;
  world.weaponPickupHoldProgress = 0;
  world.gibs = [];
  world.muzzleFlashes = [];
  world.deathEffects = [];
  world.blastGlows = [];
  world.fireZones = [];
  world.objectDebris = [];
  world.hunterDrones = [];
  world.droneSwarmPhase = 0;
  world.droneBeamSoundCooldown = 0;
  world.score = 0;
  world.combo = 1;
  world.comboTimer = 0;
  world.wave = 0;
  world.techpriestEligibleMisses = 0;
  world.techpriestSpawnedThisRun = 0;
  world.kills = 0;
  world.runCreditsEarned = 0;
  world.runDuration = 0;
  world.maxCombo = 1;
  world.weaponsUsed = ["pistol"];
  world.runEndReason = "";
  world.runMetaAwarded = false;
  world.runStatsCounted = false;
  world.runSwarmKills = 0;
  world.runBarrelsDestroyed = 0;
  world.runSynergiesActivated = 0;
  world.runClearedWaves = 0;
  world.damageTakenThisWave = 0;
  world.stateBeforePause = null;
  world.pauseOpenedAt = 0;
  world.resultOverlayKind = null;
  world.waveClearTimer = 0;
  world.waveClearPendingPerk = false;
  world.screenShake = 0;
  world.shakeX = 0;
  world.shakeY = 0;
  world.shakeRot = 0;
  world.currentWave = null;
  world.intermissionTimer = 0;
  clearAnnouncements();
  world.buffs = { rapid: 0, speed: 0, armor: 0, drone: 0 };
  world.activeWaveBonus = null;
  world.pendingWaveBonuses = [];
  world.perkRerollCapacity = getMetaRerollCapacity();
  world.perkRerollsLeft = world.perkRerollCapacity;
  world.waveBonusExpiresOnWave = 0;
  world.acquiredRunBonuses = [];
  world.buildTagsCounter = {};
  world.runBonusHistory = [];
  world.activeSynergies = [];
  world.expandedPerkSynergyId = null;
  world.synergyCounters = {
    bulletStormShots: 0,
  };
  world.deathSequenceTimer = 0;
  world.deathSequenceReadyForClick = false;
  world.deathOverlayAlpha = 0;
  resetWaveBonusModifiers();
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.maxHealth = player.baseMaxHealth + getMetaMaxHealthBonus();
  player.health = player.maxHealth;
  player.weapon = "pistol";
  resetRunAchievementStats();
  world.achievementStateSnapshot = cloneAchievementState();
  player.fireCooldown = 0;
  player.dashCooldown = 0;
  player.dashDuration = 0;
  player.hitFlash = 0;
  player.armorFlash = 0;
  player.traumaArmorTimer = 0;
  player.invulnTimer = 0;
  player.animTime = 0;
  player.shootAnimTimer = 0;
  player.deathAnimTimer = 0;
  player.facingIndex = 2;
  player.facingName = "down";
  player.facingVertical = "down";
  closeWaveBonusSelection();
  hideWaveClearOverlay();
  hideDeathSequenceOverlay();
  closeMetaOverlay();
  closeAchievementsOverlay();
  generateTerrain();
  generateSolids();
  updateCamera();
  syncHud();
  renderMetaUpgrades();
}

async function startGame() {
  hideMainMenu();
  overlay.classList.remove("visible");
  await assets.loadAll();
  await audio.unlock();
  audio.resetBattlePlaylist();
  audio.setMode("battle");
  resetGame();
  applyNextRunCheats();
  spawnArmoryCheatPickups();
  if (!world.cheatsUsed) {
    metaState.totalRuns += 1;
    world.runStatsCounted = true;
    saveMetaProgress();
  }
  hideScoreEntry();
  world.state = "intermission";
  world.intermissionTimer = 2.6;
  banner(t("banner.operationStart.title"), t("banner.operationStart.subtitle"), 2.4, "#29d3c2");
  closeWaveBonusSelection();
  hideWaveClearOverlay();
  hideDeathSequenceOverlay();
  closeMetaOverlay();
  closeLeaderboardOverlay();
  closeAchievementsOverlay();
  closeControlsOverlay();
  renderMetaUpgrades();
}

function endGame() {
  startDeathSequence();
}

function maybePickup(x, y, guaranteed = false) {
  const pickupChance = Math.min(0.58, 0.2 + world.waveBonusModifiers.pickupChanceBonus + getMetaPickupLuckBonus());
  if (!guaranteed && Math.random() > pickupChance) return;
  const roll = Math.random();
  let type = "med";
  if (world.waveBonusModifiers.medkitBias > 0 && Math.random() < world.waveBonusModifiers.medkitBias) type = "med";
  else if (world.wave >= 2 && roll > (0.91 - world.waveBonusModifiers.weaponDropBonus)) type = `weapon-${pick(["smg", "shotgun", "rail"])}`;
  else if (roll > 0.74) type = "armor";
  else if (roll > 0.54) type = "speed";
  else if (roll > 0.34) type = "rapid";
  if (!type.startsWith("weapon-") && type !== "armor" && world.wave >= 3 && Math.random() > 0.93) type = "drone";
  world.pickups.push({ x, y, radius: 13, type, life: 14, pulse: Math.random() * TAU });
}

function awardKill(foe) {
  world.kills += 1;
  trackEnemyKilledForAchievements(foe);
  const comboGain = foe.comboGain ?? (foe.boss ? 0.9 : 0.2);
  world.combo = Math.min(6, Number((world.combo + comboGain).toFixed(2)));
  world.maxCombo = Math.max(world.maxCombo || 1, world.combo);
  world.comboTimer = 4.8;
  world.score += Math.round(foe.reward * world.combo);
  if (world.waveBonusModifiers.killHealChance > 0 && Math.random() < world.waveBonusModifiers.killHealChance) {
    player.health = Math.min(player.maxHealth, player.health + world.waveBonusModifiers.killHealAmount);
    burst(player.x, player.y, "#9dffc2", 6, 0.72);
    syncHud();
  }
  spawnDeathEffect(foe);
  burst(foe.x, foe.y, foe.blood || foe.color, foe.boss ? 18 : 11, foe.boss ? 1.3 : 1);
  bloodSpray(foe.x, foe.y, foe.blood || "#b81224", foe.boss ? 28 : 16, foe.boss ? 1.35 : 1);
  spawnGibs(foe);
  addDecal(foe.x, foe.y, foe.radius + 8, foe.blood || foe.color, foe.boss ? 0.26 : 0.19);
  audio.death(foe.kind || foe.id);
  if (foe.boss) {
    maybePickup(foe.x - 20, foe.y, true);
    maybePickup(foe.x + 24, foe.y + 8, true);
    world.pickups.push({ x: foe.x, y: foe.y - 18, radius: 16, type: `weapon-${pick(["smg", "shotgun", "rail"])}`, life: 18, pulse: Math.random() * TAU });
    queueBossDefeated(bossDisplayName(foe));
    addScreenShake(0.4);
  } else {
    if (foe.id === "techpriest") {
      maybePickup(foe.x, foe.y, true);

      if (Math.random() < 0.65) {
        maybePickup(foe.x + rand(-18, 18), foe.y + rand(-18, 18), true);
      }

      if (world.wave >= 5 && Math.random() < 0.35) {
        world.pickups.push({
          x: foe.x + rand(-24, 24),
          y: foe.y + rand(-24, 24),
          radius: 13,
          type: `weapon-${pick(["smg", "shotgun", "rail"])}`,
          life: 16,
          pulse: Math.random() * TAU,
        });
      }

      addScreenShake(0.16);
    }

    const pickupChanceMul = foe.pickupChanceMul ?? 1;
    if (Math.random() < pickupChanceMul) {
      maybePickup(foe.x, foe.y);
    }
    if (hasSynergy("scavenger_loop")) {
      if (Math.random() < 0.08 * pickupChanceMul) {
        maybePickup(foe.x + rand(-8, 8), foe.y + rand(-8, 8), true);
      }
      if (Math.random() < 0.12) {
        player.health = Math.min(player.maxHealth, player.health + 3);
        burst(player.x, player.y, "#a8ffd4", 5, 0.62);
        syncHud();
      }
    }
    addScreenShake(0.075);
  }
}

function damagePlayer(amount, options = {}) {
  if (world.activeCheats?.godMode) return false;
  if (player.dashDuration > 0 || player.invulnTimer > 0) return;
  const actual = (world.buffs.armor > 0 ? amount * 0.62 : amount)
    * world.waveBonusModifiers.incomingDamageMul
    * (player.traumaArmorTimer > 0 ? world.waveBonusModifiers.traumaGelReduction : 1)
    * getMetaDamageTakenMultiplier()
    * (options.explosive ? world.waveBonusModifiers.incomingExplosionDamageMul : 1);
  if (player.health - actual <= 0 && world.waveBonusModifiers.secondWind && !world.waveBonusModifiers.secondWindUsed) {
    world.waveBonusModifiers.secondWindUsed = true;
    player.health = Math.max(25, player.health);
    player.hitFlash = 0.46;
    player.invulnTimer = 0.5;
    addScreenShake(0.34);
    burst(player.x, player.y, "#ff93b2", 12, 1.15);
    banner(t("banner.secondWind.title"), t("banner.secondWind.subtitle"), 1.4, "#ff92ae");
    syncHud();
    return;
  }
  player.health -= actual;
  trackPlayerDamagedForAchievements(actual);
  player.hitFlash = 0.36;
  if (world.buffs.armor > 0) player.armorFlash = 0.22;
  if (world.waveBonusModifiers.traumaGel) player.traumaArmorTimer = 1.9;
  player.invulnTimer = 0.5;
  world.combo = 1;
  world.comboTimer = 0;
  addScreenShake(0.28);
  burst(player.x, player.y, "#ff3d6e", 10);
  if (player.health <= 0) {
    player.health = 0;
    player.animTime = 0;
    player.deathAnimTimer = 0.8;
    syncHud();
    endGame();
  }
}

function applyDamageToFoe(foe, amount, options = {}) {
  if (!foe || foe.hp <= 0 || amount <= 0) return 0;

  let damage = amount;

  if (foe.id === "techpriest") {
    if ((foe.shieldHp || 0) > 0) {
      const absorbed = Math.min(foe.shieldHp, damage);
      foe.shieldHp -= absorbed;
      foe.shieldFlash = 0.18;
      damage -= absorbed;

      if (foe.shieldHp <= 0) {
        foe.shieldHp = 0;
        foe.shieldBreakTimer = 0.75;
        foe.slowTimer = Math.max(foe.slowTimer || 0, 0.65);
        burst(foe.x, foe.y, "#8ef3ff", 10, 0.9);
        pushBlastGlow(foe.x, foe.y, 120, "rgba(142, 243, 255, 0.32)", 0.36);
        addScreenShake(0.12);
      }

      if (damage <= 0) return 0;
    }

    damage *= 1 - (foe.armorReduction || 0);
  }

  foe.hp -= damage;
  return damage;
}

function updateParticles(dt) {
  world.particles = world.particles.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.gravity) p.vy += p.gravity * dt;
    p.life -= dt;
    p.vx *= p.drag ?? 0.97;
    p.vy *= p.drag ?? 0.97;
    p.rotation += (p.spin || 0) * dt;
    return p.life > 0;
  });
}

function updateBlastGlows(dt) {
  world.blastGlows = world.blastGlows.filter((glow) => {
    glow.life -= dt;
    return glow.life > 0;
  });
}

function updateFireZones(dt) {
  world.fireZones = world.fireZones.filter((fire) => {
    fire.life -= dt;
    fire.pulse += dt * 7.4;
    fire.emitTimer -= dt;
    while (fire.emitTimer <= 0) {
      fire.emitTimer += rand(0.03, 0.07);
      pushParticle({
        x: fire.x + rand(-fire.radius * 0.45, fire.radius * 0.45),
        y: fire.y + rand(-fire.radius * 0.24, fire.radius * 0.24),
        vx: rand(-18, 18),
        vy: rand(-110, -52),
        life: rand(0.16, 0.32),
        size: rand(10, 18),
        sizeEnd: rand(2, 6),
        color: pick(["#fff0ad", "#ffbf47", "#ff7a2f", "#ff4e1f"]),
        type: "flare",
        drag: 0.9,
      });
      if (Math.random() > 0.35) {
        pushParticle({
          x: fire.x + rand(-fire.radius * 0.3, fire.radius * 0.3),
          y: fire.y + rand(-fire.radius * 0.18, fire.radius * 0.18),
          vx: rand(-10, 10),
          vy: rand(-46, -20),
          life: rand(0.3, 0.58),
          size: rand(10, 16),
          sizeEnd: rand(18, 30),
          color: "rgba(68, 66, 63, 0.42)",
          type: "smoke",
          drag: 0.94,
        });
      }
    }
    return fire.life > 0;
  });
}

function updateObjectDebris(dt) {
  world.objectDebris = world.objectDebris.filter((debris) => {
    debris.x += debris.vx * dt;
    debris.y += debris.vy * dt;
    debris.vy += debris.gravity * dt;
    debris.vx *= debris.drag;
    debris.vy *= debris.drag;
    debris.rotation += debris.spin * dt;
    debris.life -= dt;
    return debris.life > 0;
  });
}

function createHunterDroneSwarm() {
  const offsets = [-Math.PI / 2, Math.PI * 5 / 6, Math.PI / 6];
  const swarm = offsets.map((orbitOffset, slot) => (
    {
      slot,
      x: player.x + Math.cos(orbitOffset) * 70,
      y: player.y - 22 + Math.sin(orbitOffset) * 44,
      orbit: 0,
      orbitOffset,
      pulse: rand(0, TAU),
      bob: 0,
      tilt: 0,
      enginePulse: 0,
      beamAlpha: 0,
      beamJitter: 0,
      target: null,
      lastTarget: null,
      retargetCooldown: rand(0.04, 0.12),
      fireOffset: rand(0, 0.18),
    }
  ));
  console.log("[drone] swarm created", swarm.length);
  return swarm;
}

function ensureHunterDrone() {
  if (world.buffs.drone <= 0 && !world.waveBonusModifiers.hunterProtocol) {
    world.hunterDrones = [];
    return [];
  }
  if (!Array.isArray(world.hunterDrones) || world.hunterDrones.length !== 3) {
    world.hunterDrones = createHunterDroneSwarm();
  }
  return world.hunterDrones;
}

function findHunterDroneTarget(drone, assignedTargets, rangeLimit = 520) {
  let fallbackTarget = null;
  let fallbackDistance = rangeLimit;
  let freeTarget = null;
  let freeDistance = rangeLimit;
  for (const foe of world.foes) {
    if (foe.hp <= 0) continue;
    const distance = Math.hypot(foe.x - drone.x, foe.y - drone.y);
    if (distance >= rangeLimit) continue;
    if (distance < fallbackDistance) {
      fallbackDistance = distance;
      fallbackTarget = foe;
    }
    if (!assignedTargets.has(foe) && distance < freeDistance) {
      freeDistance = distance;
      freeTarget = foe;
    }
  }
  return freeTarget || fallbackTarget;
}

function isValidHunterDroneTarget(target, drone, rangeLimit = 520) {
  if (!target || target.hp <= 0) return false;
  const distance = Math.hypot(target.x - drone.x, target.y - drone.y);
  return distance < rangeLimit;
}

function updateHunterDrone(dt) {
  const drones = ensureHunterDrone();
  if (!drones.length) return;
  const hunterSwarm = hasSynergy("hunter_swarm");
  const assignedTargets = new Set();
  world.droneSwarmPhase = (world.droneSwarmPhase + dt * 1.2) % TAU;
  world.droneBeamSoundCooldown = Math.max(0, world.droneBeamSoundCooldown - dt);

  for (const drone of drones) {
    drone.orbit = world.droneSwarmPhase;
    drone.pulse += dt * (8.6 + drone.slot * 0.45);
    drone.enginePulse = 0.62 + (Math.sin(drone.pulse * 1.35 + drone.slot) + 1) * 0.26;
    drone.tilt = Math.sin(drone.pulse * 0.34) * 0.055 + Math.cos(world.droneSwarmPhase + drone.orbitOffset) * 0.035;
    drone.bob = Math.sin(world.droneSwarmPhase * 1.2 + drone.orbitOffset) * 3.2 + Math.cos(drone.pulse * 0.24) * 1.4;
    const orbitAngle = drone.orbit + drone.orbitOffset;
    const targetX = player.x + Math.cos(orbitAngle) * 74;
    const targetY = player.y + Math.sin(orbitAngle) * 48 - 24 + drone.bob;
    drone.x += (targetX - drone.x) * Math.min(1, dt * 9.2);
    drone.y += (targetY - drone.y) * Math.min(1, dt * 9.2);
    drone.retargetCooldown = Math.max(0, (drone.retargetCooldown || 0) - dt);

    if (Math.random() > 0.68) {
      for (const side of [-1, 1]) {
        pushParticle({
          x: drone.x + side * 6,
          y: drone.y + 6,
          vx: side * rand(-5, 5),
          vy: rand(24, 52),
          life: rand(0.06, 0.13),
          size: rand(3, 6),
          sizeEnd: 0,
          color: pick(["#9ff7ff", "#ff5cf4", "#effcff"]),
          type: "flare",
          drag: 0.88,
        });
      }
    }

    let target = null;

    if (isValidHunterDroneTarget(drone.target, drone)) {
      target = drone.target;
    } else {
      if (drone.target && drone.target.hp <= 0) {
        drone.lastTarget = drone.target;
        drone.retargetCooldown = Math.max(
          drone.retargetCooldown || 0,
          hunterSwarm ? 0.14 : 0.24,
        );
      }

      drone.target = null;

      if ((drone.retargetCooldown || 0) <= 0) {
        target = findHunterDroneTarget(drone, assignedTargets);
      }
    }

    if (target) {
      assignedTargets.add(target);
      drone.target = target;
      const oldBeamDamage = (world.waveBonusModifiers.hunterProtocol ? 170 : 120)
        * world.waveBonusModifiers.hunterDamageMul
        * (hunterSwarm ? 1.28 : 1);
      const beamDamage = oldBeamDamage * 0.3;
      target.hp -= beamDamage * dt;
      target.hitFlash = Math.max(target.hitFlash, 0.15);
      drone.beamAlpha = Math.min(1, Math.max(drone.beamAlpha, 0.22) + dt * (hunterSwarm ? 12 : 9));
      drone.beamJitter = (hunterSwarm ? 4.8 : 3.8) + Math.sin(drone.pulse * 0.9) * 1.6;
      if (world.droneBeamSoundCooldown <= 0 && (drone.beamAlpha < 0.5 + drone.fireOffset || Math.random() > 0.82)) {
        audio.droneBeam();
        world.droneBeamSoundCooldown = hunterSwarm ? 0.11 : 0.14;
      }
      if (Math.random() > 0.68) {
        pushParticle({
          x: target.x + rand(-6, 6),
          y: target.y + rand(-6, 6),
          vx: rand(-12, 12),
          vy: rand(-12, 12),
          life: rand(0.07, 0.14),
          size: rand(5, 8),
          sizeEnd: 0,
          color: pick(["#ff5cf4", "#9ff7ff", "#effcff"]),
          type: "spark",
          drag: 0.88,
        });
      }
      if (Math.random() > 0.84) {
        pushParticle({
          x: target.x + rand(-3, 3),
          y: target.y + rand(-3, 3),
          life: rand(0.07, 0.12),
          size: rand(3, 5),
          sizeEnd: rand(11, 17),
          color: "rgba(159, 247, 255, 0.62)",
          type: "ring",
          lineWidth: 1.3,
        });
      }
    } else {
      drone.target = null;
      drone.beamAlpha = Math.max(0, drone.beamAlpha - dt * 6);
      drone.beamJitter = Math.max(0, drone.beamJitter - dt * 16);
    }
  }
}

function updateGibs(dt) {
  world.gibs = world.gibs.filter((gib) => {
    gib.x += gib.vx * dt;
    gib.y += gib.vy * dt;
    gib.vy += gib.gravity * dt;
    gib.vx *= 0.98;
    gib.rotation += gib.spin * dt;
    gib.life -= dt;
    return gib.life > 0;
  });
}

function updateMuzzleFlashes(dt) {
  world.muzzleFlashes = world.muzzleFlashes.filter((flash) => {
    flash.life -= dt;
    return flash.life > 0;
  });
}

function updateTimers(dt) {
  updateCamera();
  if (world.state === "playing") {
    world.runDuration += dt;
  }
  world.comboTimer = Math.max(0, world.comboTimer - dt);
  if (world.comboTimer === 0) world.combo = 1;
  world.screenShake = Math.max(0, world.screenShake - dt * 1.28);
  if (world.screenShake > 0) {
    const power = world.screenShake * world.screenShake;
    world.shakeX = rand(-1, 1) * 17 * power;
    world.shakeY = rand(-1, 1) * 14 * power;
    world.shakeRot = rand(-1, 1) * 0.03 * power;
  } else {
    world.shakeX = 0;
    world.shakeY = 0;
    world.shakeRot = 0;
  }
  world.radar.ping = (world.radar.ping + dt * 0.65) % 1;
  player.shootAnimTimer = Math.max(0, player.shootAnimTimer - dt);
  player.deathAnimTimer = Math.max(0, player.deathAnimTimer - dt);
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.traumaArmorTimer = Math.max(0, player.traumaArmorTimer - dt);
  if (player.health <= 0 || world.state === "gameover") {
    player.animTime += dt;
  }
  if (world.banner) {
    world.banner.timer -= dt;
    if (world.banner.timer <= 0) {
      world.banner = null;
      activateNextAnnouncement();
    }
  } else {
    activateNextAnnouncement();
  }
  if (world.synergyToast) {
    world.synergyToast.timer -= dt;
    if (world.synergyToast.timer <= 0) {
      world.synergyToast = null;
      activateNextAnnouncement();
    }
  } else {
    activateNextAnnouncement();
  }
  if (world.bossWarning) {
    world.bossWarning.timer -= dt;
    if (world.bossWarning.timer <= 0) {
      world.bossWarning = null;
      activateNextAnnouncement();
    }
  } else {
    activateNextAnnouncement();
  }
  if (world.cheatToastTimer > 0) {
    world.cheatToastTimer = Math.max(0, world.cheatToastTimer - dt);
    if (world.cheatToastTimer <= 0) {
      world.cheatToast = null;
    }
    syncCheatToastDom();
  }
  for (const key of Object.keys(world.buffs)) world.buffs[key] = Math.max(0, world.buffs[key] - dt);
  for (const solid of world.destructibles) solid.flash = Math.max(0, solid.flash - dt);
  world.decals = world.decals.filter((decal) => {
    decal.life -= dt;
    decal.alpha = Math.max(0, decal.maxAlpha * (decal.life / decal.maxLife));
    return decal.life > 0;
  });
  world.deathEffects = world.deathEffects.filter((effect) => {
    effect.life -= dt;
    effect.pulse += dt * 6;
    effect.emitTimer -= dt;
    while (effect.emitTimer <= 0 && effect.life > 0) {
      effect.emitTimer += effect.variant === "monster" ? 0.08 : effect.variant === "criminal" ? 0.1 : 0.12;
      if (effect.variant === "animal") {
        pushParticle({
          x: effect.x + rand(-effect.w * 0.18, effect.w * 0.18),
          y: effect.y + rand(-effect.h * 0.08, effect.h * 0.08),
          vx: rand(-10, 10),
          vy: rand(-42, -18),
          life: rand(0.16, 0.28),
          size: rand(6, 10),
          sizeEnd: rand(12, 20),
          color: pick(["rgba(255, 154, 62, 0.28)", "rgba(255, 104, 42, 0.22)", "rgba(68, 62, 58, 0.24)"]),
          type: Math.random() > 0.6 ? "flare" : "smoke",
          drag: 0.92,
        });
      } else if (effect.variant === "monster") {
        pushParticle({
          x: effect.x + rand(-effect.w * 0.14, effect.w * 0.14),
          y: effect.y + rand(-effect.h * 0.14, effect.h * 0.14),
          vx: rand(-18, 18),
          vy: rand(-18, 18),
          life: rand(0.05, 0.1),
          size: rand(6, 10),
          sizeEnd: 0,
          color: pick(["rgba(159,247,255,0.68)", "rgba(239,252,255,0.58)", "rgba(127,208,255,0.56)"]),
          type: "spark",
          drag: 0.86,
        });
      } else if (effect.variant === "criminal") {
        pushParticle({
          x: effect.x + rand(-effect.w * 0.18, effect.w * 0.18),
          y: effect.y + rand(-effect.h * 0.06, effect.h * 0.06),
          vx: rand(-12, 12),
          vy: rand(6, 24),
          life: rand(0.18, 0.32),
          size: rand(4, 7),
          sizeEnd: rand(8, 13),
          color: pick(["rgba(20, 24, 31, 0.5)", "rgba(35, 42, 51, 0.46)", "rgba(71, 18, 16, 0.24)"]),
          type: "oil",
          drag: 0.94,
        });
      }
    }
    return effect.life > 0;
  });
  updateMuzzleFlashes(dt);
}

export {
  canvas,
  ctx,
  fullscreenRoot,
  gameFrame,
  fullscreenButton,
  mainMenuOverlay,
  mainMenuStartButton,
  mainMenuControlsButton,
  mainMenuUpgradesButton,
  mainMenuSynergyGuideButton,
  mainMenuAchievementsButton,
  mainMenuHallButton,
  mainMenuFullscreenButton,
  mainMenuFullscreenState,
  mainMenuAudioButton,
  mainMenuAudioPanel,
  mainMenuAudioState,
  mainMenuExitButton,
  controlsOverlay,
  closeControlsButton,
  healthValue,
  healthBar,
  healthBarFill,
  healthBarGloss,
  scoreValue,
  waveValue,
  comboValue,
  weaponValue,
  boostsBar,
  waveBonusBadge,
  leaderboardCount,
  leaderboardBody,
  openLeaderboardButton,
  closeLeaderboardButton,
  leaderboardOverlay,
  leaderboardFullBody,
  startButton,
  menuMetaButton,
  overlay,
  overlayTitle,
  overlayText,
  overlayButton,
  overlayMetaButton,
  audioPrompt,
  perkOverlay,
  perkSynergyGuideButton,
  perkSynergyPanel,
  perkControls,
  perkChoices,
  metaOverlay,
  metaSynergyGuideButton,
  closeMetaButton,
  synergyGuideOverlay,
  closeSynergyGuideButton,
  backSynergyGuideButton,
  achievementsOverlay,
  closeAchievementsButton,
  backAchievementsButton,
  metaCreditsValue,
  metaEarnedValue,
  metaStatsGrid,
  metaUpgradeList,
  metaUpgradeTabs,
  metaTeaserCredits,
  runSummaryPanel,
  runSummaryWave,
  runSummaryKills,
  runSummaryScore,
  runSummaryCreditsEarned,
  runSummaryCreditsTotal,
  scoreEntryPanel,
  playerNameInput,
  saveScoreButton,
  saveScoreStatus,
  pauseOverlay,
  resumeRunButton,
  abortRunButton,
  pauseMainMenuButton,
  masterVolume,
  musicVolume,
  sfxVolume,
  BASE_WORLD_WIDTH,
  BASE_WORLD_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  TAU,
  GRENADE_CONFIG,
  enemies,
  bosses,
  solids,
  barrelSpawnPoints,
  buffs,
  weapons,
  waveBonuses,
  synergies,
  metaUpgrades,
  assetManifest,
  playerSpritesheetMeta,
  enemySpritesheetMeta,
  animationProfiles,
  player,
  world,
  metaState,
  assets,
  audio,
  clamp,
  rand,
  pick,
  dist,
  angleDelta,
  bossDisplayName,
  countActiveThreatUnits,
  enemiesRemainingForDisplay,
  layoutX,
  layoutY,
  layoutW,
  layoutH,
  layoutPoint,
  circleRect,
  addDecal,
  spawnDeathEffect,
  pushParticle,
  pushBlastGlow,
  solidPlacementOpen,
  shuffle,
  spawnSecondaryFlames,
  spawnObjectDebris,
  burst,
  bloodSpray,
  emitConeParticles,
  spawnMuzzleFlash,
  spawnEnemyShotEffect,
  spawnWeaponDischarge,
  spawnImpactFlash,
  applyFoeKnockback,
  spawnBarrelExplosionEffect,
  spawnBoxBreakEffect,
  spawnConcreteBreakEffect,
  spawnGibs,
  banner,
  queueSynergyToast,
  queueBossWarning,
  queueBossDefeated,
  addScreenShake,
  showCheatToast,
  markRunCheated,
  addCheatCredits,
  cheatKillAll,
  cheatHealMe,
  cheatNuke,
  syncPointerWorld,
  updateCamera,
  resizeGameViewportForFullscreen,
  moveVector,
  currentWeapon,
  fireRate,
  moveSpeed,
  loadLeaderboard,
  saveLeaderboard,
  saveMetaProgress,
  renderLeaderboard,
  openLeaderboardOverlay,
  closeLeaderboardOverlay,
  selectLeaderboardEntry,
  renderMetaUpgrades,
  setMetaUpgradeTab,
  showScoreEntry,
  hideScoreEntry,
  saveLeaderboardEntry,
  openMetaOverlay,
  closeMetaOverlay,
  showMainMenu,
  hideMainMenu,
  openPauseMenu,
  closePauseMenu,
  abortRunToSummary,
  returnToMainMenuFromRun,
  returnToMainMenuFromResults,
  toggleMainMenuAudioSettings,
  syncMainMenuAudioState,
  isActiveRunState,
  isPauseAllowed,
  openControlsOverlay,
  closeControlsOverlay,
  exitToProjectPage,
  getMetaUpgradeLevel,
  getMetaUpgradeCost,
  canBuyMetaUpgrade,
  buyMetaUpgrade,
  getMetaExecutionBonusMultiplier,
  getMetaHealingMultiplier,
  currentWaveBonusData,
  recomputeActiveSynergies,
  hasSynergy,
  buildWaveBonusChoices,
  renderPerkSynergies,
  togglePerkSynergyDescription,
  renderWaveBonusSelection,
  openSynergyGuideOverlay,
  closeSynergyGuideOverlay,
  openAchievementsOverlay,
  closeAchievementsOverlay,
  startWaveClearSequence,
  updateWaveClear,
  openWaveBonusSelection,
  closeWaveBonusSelection,
  expireWaveBonusIfNeeded,
  rerollWaveBonusChoices,
  chooseWaveBonus,
  confirmDeathSequence,
  updateDeathSequence,
  playerDirectionIndex,
  playerAnimationState,
  updateActorFacing,
  playerFrameFor,
  enemyAnimationState,
  enemyFrameFor,
  syncBuffs,
  syncHud,
  generateTerrain,
  makeSolid,
  spawnWaveBarrels,
  spawnWaveCoverObjects,
  generateSolids,
  menuOverlay,
  resetGame,
  startGame,
  endGame,
  maybePickup,
  awardKill,
  finalizeRunMetaProgress,
  renderRunSummary,
  damagePlayer,
  applyDamageToFoe,
  trackPlayerDamagedForAchievements,
  trackBarrelDestroyedForAchievements,
  trackWaveStartedForAchievements,
  trackWaveClearedForAchievements,
  trackWeaponChangedForAchievements,
  trackSynergyActivatedForAchievements,
  updateParticles,
  updateBlastGlows,
  updateFireZones,
  updateObjectDebris,
  ensureHunterDrone,
  updateHunterDrone,
  updateGibs,
  updateMuzzleFlashes,
  updateTimers,
};
