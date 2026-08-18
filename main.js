import {
  audio,
  player,
  world,
  assets,
  menuOverlay,
  loadLeaderboard,
  renderLeaderboard,
  resetGame,
  syncHud,
  updateTimers,
  updateParticles,
  updateObjectDebris,
  updateFireZones,
  updateBlastGlows,
  updateHunterDrone,
  updateGibs,
  updateWaveClear,
  updateDeathSequence,
  getMetaArmoryDamageMultiplier,
  getMetaUpgradeLevel,
} from "./game.js";
import { updatePlayer, updatePickups } from "./player.js";
import { beginWave, updateWave, updateFoes, cleanupDeadFoes } from "./enemy.js";
import { projectile, updateShots } from "./bullet.js";
import { updateGrenades } from "./grenade.js";
import { firstSolidIntersection } from "./collision.js";
import { render } from "./render.js";
import { initInput, syncCurrentMusic, applyVolumeSettings } from "./input.js";
import { t, updateStaticTranslations } from "./i18n.js";
import { BUILD_LABEL } from "./version.js";
import { getTurretLoopPlaybackRate, updateTurretAbility } from "./turret.js";

// Main loop bootstrap that composes the gameplay modules.

function syncBuildVersion() {
  const buildVersion = document.getElementById("buildVersion");
  if (!buildVersion) return;

  buildVersion.textContent = BUILD_LABEL;
  buildVersion.title = `Block Zero ${BUILD_LABEL}`;
}

function bastion7HasLineOfSight(origin, target) {
  return !firstSolidIntersection(
    origin.x,
    origin.y,
    target.x,
    target.y,
    world.destructibles,
  );
}

function spawnBastion7Shot(shot) {
  projectile(
    shot.origin,
    shot.angle,
    shot.speed,
    shot.damage,
    shot.color,
    shot.style,
    true,
    shot.radius,
    {
      life: shot.life,
      source: shot.source,
    },
  );
}

function signalBastion7Ready() {
  audio.turretReady();
}

const bastion7Context = {
  player,
  pointer: world.pointer,
  worldWidth: world.width,
  worldHeight: world.height,
  solids: world.destructibles,
  actors: world.foes,
  targets: world.foes,
  combatEnabled: false,
  wave: 1,
  heavyCaliberLevel: 0,
  overdriveMotorsLevel: 0,
  rapidRedeploymentLevel: 0,
  armoryDamageMultiplier: 1,
  isVisible: bastion7HasLineOfSight,
  onShot: spawnBastion7Shot,
  onReady: signalBastion7Ready,
};

function updateBastion7(dt, combatEnabled) {
  bastion7Context.pointer = world.pointer;
  bastion7Context.worldWidth = world.width;
  bastion7Context.worldHeight = world.height;
  bastion7Context.solids = world.destructibles;
  bastion7Context.actors = world.foes;
  bastion7Context.targets = world.foes;
  bastion7Context.combatEnabled = combatEnabled;
  bastion7Context.wave = world.wave;
  bastion7Context.heavyCaliberLevel = getMetaUpgradeLevel("field_heavy_caliber");
  bastion7Context.overdriveMotorsLevel = getMetaUpgradeLevel("field_overdrive_motors");
  bastion7Context.rapidRedeploymentLevel = getMetaUpgradeLevel("field_rapid_redeployment");
  bastion7Context.armoryDamageMultiplier = getMetaArmoryDamageMultiplier();
  updateTurretAbility(world.turretAbility, dt, bastion7Context);
  const activeTurret = world.turretAbility.active;
  audio.setBastion7Firing(
    Boolean(combatEnabled && activeTurret?.firing),
    !combatEnabled || !activeTurret,
    getTurretLoopPlaybackRate(bastion7Context.overdriveMotorsLevel),
  );
}

function update(dt) {
  if (world.state === "paused") {
    syncHud();
    return;
  }

  if (world.state === "menu" || world.state === "gameover") {
    updateTimers(dt);
    syncHud();
    return;
  }

  if (world.state === "wave_clear") {
    updateBastion7(dt, false);
    updateGrenades(dt);
    updateParticles(dt);
    updateObjectDebris(dt);
    updateFireZones(dt);
    updateBlastGlows(dt);
    updateGibs(dt);
    updateHunterDrone(dt);
    updateWaveClear(dt);
    syncHud();
    return;
  }

  if (world.state === "perk_select") {
    updateGrenades(dt);
    updateParticles(dt);
    updateObjectDebris(dt);
    updateFireZones(dt);
    updateBlastGlows(dt);
    updateGibs(dt);
    updateHunterDrone(dt);
    syncHud();
    return;
  }

  if (world.state === "death_sequence") {
    updateDeathSequence(dt);
    syncHud();
    return;
  }

  updateTimers(dt);

  if (world.state === "intermission") {
    updatePlayer(dt, true);
    updateBastion7(dt, false);
    updateShots(dt);
    updateGrenades(dt);
    updatePickups(dt);
    updateHunterDrone(dt);
    updateParticles(dt);
    updateObjectDebris(dt);
    updateFireZones(dt);
    updateBlastGlows(dt);
    updateGibs(dt);
    world.intermissionTimer -= dt;
    if (world.intermissionTimer <= 0) beginWave();
    else if (world.banner) world.banner.subtitle = t("intermission.countdown", { seconds: Math.ceil(world.intermissionTimer) });
    syncHud();
    return;
  }

  updatePlayer(dt, true);
  updateWave(dt);
  updateFoes(dt);
  updateBastion7(dt, true);
  updateShots(dt);
  updateGrenades(dt);
  updateHunterDrone(dt);
  cleanupDeadFoes();
  updatePickups(dt);
  updateParticles(dt);
  updateObjectDebris(dt);
  updateFireZones(dt);
  updateBlastGlows(dt);
  updateGibs(dt);
  syncHud();
}

function tick(time) {
  const dt = Math.min(0.033, (time - world.lastTime) / 1000 || 0);
  world.lastTime = time;
  audio.tick(dt);
  update(dt);
  render();
  requestAnimationFrame(tick);
}

function bootstrap() {
  syncBuildVersion();
  updateStaticTranslations();
  initInput();
  menuOverlay();
  world.leaderboard = loadLeaderboard();
  renderLeaderboard();
  resetGame();
  audio.preloadBastion7Loop();
  assets.loadAll().then(() => {
    syncCurrentMusic();
  });
  syncCurrentMusic();
  applyVolumeSettings();
  render();
  requestAnimationFrame(tick);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
