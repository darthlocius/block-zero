// Dependency-free permanent meta-upgrade registry and persistence helpers.

const META_PROGRESS_KEY = "block-zero-meta-v1";

const metaUpgrades = Object.freeze({
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
  field_heavy_caliber: {
    id: "field_heavy_caliber",
    category: "field_engineering",
    title: "Heavy Caliber",
    description: "Increases Bastion-7 damage by 6% per level.",
    maxLevel: 5,
    baseCost: 180,
    costScale: 115,
  },
  field_overdrive_motors: {
    id: "field_overdrive_motors",
    category: "field_engineering",
    title: "Overdrive Motors",
    description: "Increases Bastion-7 fire rate by 4% per level.",
    maxLevel: 5,
    baseCost: 220,
    costScale: 140,
  },
  field_rapid_redeployment: {
    id: "field_rapid_redeployment",
    category: "field_engineering",
    title: "Rapid Redeployment",
    description: "Reduces Bastion-7 cooldown by 4% per level.",
    maxLevel: 5,
    baseCost: 170,
    costScale: 110,
  },
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createDefaultMetaState(registry = metaUpgrades) {
  const levels = {};
  for (const id of Object.keys(registry)) levels[id] = 0;
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

function normalizeMetaState(data = {}, registry = metaUpgrades) {
  const base = createDefaultMetaState(registry);
  const levels = { ...base.metaUpgradeLevels };
  if (data.metaUpgradeLevels && typeof data.metaUpgradeLevels === "object") {
    for (const id of Object.keys(levels)) {
      const maxLevel = registry[id].maxLevel;
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

function getMetaUpgradeLevelForState(state, id) {
  return Number(state?.metaUpgradeLevels?.[id]) || 0;
}

function calculateMetaUpgradeCost(upgrade, level) {
  if (!upgrade || level >= upgrade.maxLevel) return Infinity;
  return Math.round(upgrade.baseCost * (1 + level * 0.6) + level * upgrade.costScale);
}

function getMetaUpgradeCostForState(state, id, registry = metaUpgrades) {
  return calculateMetaUpgradeCost(registry[id], getMetaUpgradeLevelForState(state, id));
}

function canPurchaseMetaUpgrade(state, id, registry = metaUpgrades) {
  const upgrade = registry[id];
  if (!upgrade) return false;
  const level = getMetaUpgradeLevelForState(state, id);
  return level < upgrade.maxLevel
    && Number(state?.credits) >= getMetaUpgradeCostForState(state, id, registry);
}

function purchaseMetaUpgrade(state, id, registry = metaUpgrades) {
  if (!canPurchaseMetaUpgrade(state, id, registry)) {
    return { purchased: false, cost: 0 };
  }
  const cost = getMetaUpgradeCostForState(state, id, registry);
  state.credits -= cost;
  state.metaUpgradeLevels[id] = getMetaUpgradeLevelForState(state, id) + 1;
  state.unlockedMetaUpgrades = Object.keys(state.metaUpgradeLevels)
    .filter((key) => state.metaUpgradeLevels[key] > 0);
  return { purchased: true, cost };
}

export {
  META_PROGRESS_KEY,
  metaUpgrades,
  createDefaultMetaState,
  normalizeMetaState,
  calculateMetaUpgradeCost,
  getMetaUpgradeLevelForState,
  getMetaUpgradeCostForState,
  canPurchaseMetaUpgrade,
  purchaseMetaUpgrade,
};
