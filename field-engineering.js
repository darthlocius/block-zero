// Dependency-free permanent Field Engineering formulas shared by engineering devices.

const FIELD_ENGINEERING_CONFIG = Object.freeze({
  maxLevel: 5,
  heavyCaliberDamagePerLevel: 0.06,
  overdriveMotorsFireRatePerLevel: 0.04,
  rapidRedeploymentCooldownPerLevel: 0.04,
});

function normalizeFieldEngineeringLevel(level) {
  let numericLevel;
  try {
    numericLevel = Number(level);
  } catch {
    return 0;
  }
  if (!Number.isFinite(numericLevel)) return 0;
  return Math.min(
    FIELD_ENGINEERING_CONFIG.maxLevel,
    Math.max(0, Math.floor(numericLevel)),
  );
}

function getFieldEngineeringDamageMultiplier(level) {
  return 1 + FIELD_ENGINEERING_CONFIG.heavyCaliberDamagePerLevel
    * normalizeFieldEngineeringLevel(level);
}

function getFieldEngineeringFireRateMultiplier(level) {
  return 1 + FIELD_ENGINEERING_CONFIG.overdriveMotorsFireRatePerLevel
    * normalizeFieldEngineeringLevel(level);
}

function getFieldEngineeringCooldownMultiplier(level) {
  return 1 - FIELD_ENGINEERING_CONFIG.rapidRedeploymentCooldownPerLevel
    * normalizeFieldEngineeringLevel(level);
}

function getFieldEngineeringShotInterval(baseShotInterval, level) {
  return baseShotInterval / getFieldEngineeringFireRateMultiplier(level);
}

function getFieldEngineeringCooldown(baseCooldown, level) {
  return baseCooldown * getFieldEngineeringCooldownMultiplier(level);
}

export {
  FIELD_ENGINEERING_CONFIG,
  normalizeFieldEngineeringLevel,
  getFieldEngineeringDamageMultiplier,
  getFieldEngineeringFireRateMultiplier,
  getFieldEngineeringCooldownMultiplier,
  getFieldEngineeringShotInterval,
  getFieldEngineeringCooldown,
};
