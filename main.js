import {
  audio,
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
} from "./game.js";
import { updatePlayer, updatePickups } from "./player.js";
import { beginWave, updateWave, updateFoes, cleanupDeadFoes } from "./enemy.js";
import { updateShots } from "./bullet.js";
import { updateGrenades } from "./grenade.js";
import { render } from "./render.js";
import { initInput, syncCurrentMusic, applyVolumeSettings } from "./input.js";
import { t, updateStaticTranslations } from "./i18n.js";
import { BUILD_LABEL } from "./version.js";

// Main loop bootstrap that composes the gameplay modules.

function syncBuildVersion() {
  const buildVersion = document.getElementById("buildVersion");
  if (!buildVersion) return;

  buildVersion.textContent = BUILD_LABEL;
  buildVersion.title = `Block Zero ${BUILD_LABEL}`;
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
