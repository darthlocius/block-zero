import {
  canvas,
  fullscreenRoot,
  gameFrame,
  fullscreenButton,
  mainMenuStartButton,
  mainMenuControlsButton,
  mainMenuUpgradesButton,
  mainMenuHallButton,
  mainMenuFullscreenButton,
  mainMenuFullscreenState,
  mainMenuAudioButton,
  mainMenuExitButton,
  controlsOverlay,
  closeControlsButton,
  world,
  assets,
  startButton,
  menuMetaButton,
  openLeaderboardButton,
  overlayButton,
  overlayMetaButton,
  closeMetaButton,
  closeLeaderboardButton,
  audioPrompt,
  perkSynergyPanel,
  perkControls,
  perkChoices,
  leaderboardOverlay,
  leaderboardFullBody,
  metaOverlay,
  metaUpgradeList,
  saveScoreButton,
  playerNameInput,
  resumeRunButton,
  abortRunButton,
  pauseMainMenuButton,
  masterVolume,
  musicVolume,
  sfxVolume,
  audio,
  startGame,
  saveLeaderboardEntry,
  selectLeaderboardEntry,
  chooseWaveBonus,
  rerollWaveBonusChoices,
  togglePerkSynergyDescription,
  confirmDeathSequence,
  openPauseMenu,
  closePauseMenu,
  abortRunToSummary,
  returnToMainMenuFromRun,
  returnToMainMenuFromResults,
  toggleMainMenuAudioSettings,
  syncMainMenuAudioState,
  isPauseAllowed,
  openLeaderboardOverlay,
  closeLeaderboardOverlay,
  openControlsOverlay,
  closeControlsOverlay,
  exitToProjectPage,
  openMetaOverlay,
  closeMetaOverlay,
  buyMetaUpgrade,
  syncPointerWorld,
  resizeGameViewportForFullscreen,
} from "./game.js";
import { shoot, dash } from "./bullet.js";
import { setLanguage, t } from "./i18n.js";

// Input wiring and audio UI controls.

function pointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  world.pointerScreen.x = (event.clientX - rect.left) * scaleX;
  world.pointerScreen.y = (event.clientY - rect.top) * scaleY;
  syncPointerWorld();
}

function applyVolumeSettings() {
  if (!masterVolume || !musicVolume || !sfxVolume) return;
  audio.setVolumes({
    master: Number(masterVolume.value) / 100,
    music: Number(musicVolume.value) / 100,
    sfx: Number(sfxVolume.value) / 100,
  });
}

function syncCurrentMusic() {
  const musicMode = world.state === "playing" || world.state === "intermission" || world.state === "wave_clear" || world.state === "perk_select" || world.state === "paused" ? "battle" : "menu";
  audio.setMode(musicMode);
}

function hideAudioPrompt() {
  if (!audioPrompt) return;
  audioPrompt.classList.add("is-hidden");
}

function isTextInputTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable]")) || Boolean(target.isContentEditable);
}

function isGameFullscreen() {
  return document.fullscreenElement === fullscreenRoot;
}

async function toggleGameFullscreen() {
  if (!fullscreenRoot) return;

  try {
    if (!document.fullscreenElement) {
      await fullscreenRoot.requestFullscreen();
    } else if (document.fullscreenElement === fullscreenRoot) {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn("[fullscreen] failed", error);
  }
}

function syncFullscreenUi() {
  const active = isGameFullscreen();
  document.body.classList.toggle("is-game-fullscreen", active);
  if (fullscreenButton) {
    fullscreenButton.textContent = active ? "⤢" : "⛶";
    fullscreenButton.setAttribute("aria-label", active ? t("ui.exitFullscreen") : t("ui.fullscreen"));
    fullscreenButton.title = active ? t("ui.exitFullscreen") : t("ui.fullscreen");
  }
  if (mainMenuFullscreenState) {
    mainMenuFullscreenState.textContent = active ? t("mainMenu.on") : t("mainMenu.off");
  }
  mainMenuFullscreenButton?.setAttribute(
    "aria-label",
    active ? t("mainMenu.fullscreenOn") : t("mainMenu.fullscreenOff"),
  );
  mainMenuFullscreenButton?.setAttribute(
    "title",
    active ? t("mainMenu.fullscreenOn") : t("mainMenu.fullscreenOff"),
  );
  requestAnimationFrame(resizeGameViewportForFullscreen);
}

async function resumeAutoplayMusic() {
  await assets.loadAll();
  await audio.unlock();
  syncCurrentMusic();
  hideAudioPrompt();
}

function initInput() {
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();

      if (controlsOverlay?.classList.contains("visible")) {
        closeControlsOverlay();
        return;
      }
      if (leaderboardOverlay?.classList.contains("visible")) {
        closeLeaderboardOverlay();
        return;
      }
      if (metaOverlay?.classList.contains("visible")) {
        closeMetaOverlay();
        return;
      }
      if (world.state === "death_sequence" && world.deathSequenceReadyForClick) {
        confirmDeathSequence();
        return;
      }
      if (world.state === "gameover") {
        returnToMainMenuFromResults();
        return;
      }
      if (world.state === "paused") {
        closePauseMenu();
        return;
      }
      if (isPauseAllowed()) {
        openPauseMenu();
        return;
      }
      return;
    }
    if (world.state === "death_sequence" && world.deathSequenceReadyForClick) {
      event.preventDefault();
      confirmDeathSequence();
      return;
    }
    const key = event.key.toLowerCase();
    const textInput = isTextInputTarget(event.target);
    world.keys.add(key);
    if (event.code === "KeyE" && !textInput) world.keys.add("interact");
    if (key === "shift") dash();
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    world.keys.delete(event.key.toLowerCase());
    if (event.code === "KeyE") world.keys.delete("interact");
  });

  canvas.addEventListener("mousemove", pointer);
  canvas.addEventListener("mousedown", (event) => {
    pointer(event);
    world.pointer.down = true;
    shoot();
  });
  window.addEventListener("mouseup", () => {
    world.pointer.down = false;
  });
  window.addEventListener("pointerdown", () => {
    if (world.state === "death_sequence" && world.deathSequenceReadyForClick) confirmDeathSequence();
  });
  window.addEventListener("pointerdown", resumeAutoplayMusic, { once: true });
  window.addEventListener("keydown", resumeAutoplayMusic, { once: true });

  fullscreenButton?.addEventListener("click", toggleGameFullscreen);
  document.querySelectorAll("[data-language-option]").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.languageOption);
      syncFullscreenUi();
      syncMainMenuAudioState();
    });
  });
  document.addEventListener("fullscreenchange", syncFullscreenUi);
  window.addEventListener("resize", () => {
    if (document.fullscreenElement === fullscreenRoot) {
      requestAnimationFrame(resizeGameViewportForFullscreen);
    }
  });
  syncFullscreenUi();

  mainMenuStartButton?.addEventListener("click", startGame);
  mainMenuControlsButton?.addEventListener("click", openControlsOverlay);
  mainMenuUpgradesButton?.addEventListener("click", openMetaOverlay);
  mainMenuHallButton?.addEventListener("click", openLeaderboardOverlay);
  mainMenuAudioButton?.addEventListener("click", toggleMainMenuAudioSettings);
  mainMenuFullscreenButton?.addEventListener("click", toggleGameFullscreen);
  mainMenuExitButton?.addEventListener("click", exitToProjectPage);
  closeControlsButton?.addEventListener("click", closeControlsOverlay);
  resumeRunButton?.addEventListener("click", closePauseMenu);
  abortRunButton?.addEventListener("click", abortRunToSummary);
  pauseMainMenuButton?.addEventListener("click", returnToMainMenuFromRun);
  startButton?.addEventListener("click", startGame);
  overlayButton?.addEventListener("click", startGame);
  menuMetaButton?.addEventListener("click", openMetaOverlay);
  openLeaderboardButton?.addEventListener("click", openLeaderboardOverlay);
  overlayMetaButton?.addEventListener("click", openMetaOverlay);
  closeMetaButton?.addEventListener("click", closeMetaOverlay);
  closeLeaderboardButton?.addEventListener("click", closeLeaderboardOverlay);
  perkChoices?.addEventListener("click", (event) => {
    const card = event.target.closest("[data-bonus-id]");
    if (!card) return;
    chooseWaveBonus(card.dataset.bonusId);
  });
  perkControls?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-perk-reroll]");
    if (!button) return;
    event.preventDefault();
    rerollWaveBonusChoices();
  });
  perkSynergyPanel?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-perk-synergy-id]");
    if (!chip) return;
    event.preventDefault();
    event.stopPropagation();
    togglePerkSynergyDescription(chip.dataset.perkSynergyId);
  });
  leaderboardFullBody?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-leaderboard-index]");
    if (!row) return;
    selectLeaderboardEntry(row.dataset.leaderboardIndex);
  });
  metaUpgradeList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meta-upgrade-id]");
    if (!button) return;
    buyMetaUpgrade(button.dataset.metaUpgradeId);
  });
  saveScoreButton?.addEventListener("click", saveLeaderboardEntry);
  playerNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveLeaderboardEntry();
    }
  });
  masterVolume?.addEventListener("input", applyVolumeSettings);
  musicVolume?.addEventListener("input", applyVolumeSettings);
  sfxVolume?.addEventListener("input", applyVolumeSettings);
}

export {
  pointer,
  applyVolumeSettings,
  syncCurrentMusic,
  isGameFullscreen,
  toggleGameFullscreen,
  syncFullscreenUi,
  resumeAutoplayMusic,
  initInput,
};
