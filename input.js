import {
  canvas,
  fullscreenRoot,
  gameFrame,
  fullscreenButton,
  mainMenuStartButton,
  mainMenuOverlay,
  mainMenuControlsButton,
  mainMenuUpgradesButton,
  mainMenuSynergyGuideButton,
  mainMenuAchievementsButton,
  mainMenuHallButton,
  mainMenuFullscreenButton,
  mainMenuFullscreenState,
  mainMenuAudioButton,
  mainMenuExitButton,
  engineeringLoadoutOverlay,
  engineeringLoadoutBeginButton,
  engineeringLoadoutButtons,
  controlsOverlay,
  closeControlsButton,
  player,
  world,
  assets,
  startButton,
  menuMetaButton,
  openLeaderboardButton,
  overlayButton,
  overlayMetaButton,
  resultsMainMenuButton,
  closeMetaButton,
  metaSynergyGuideButton,
  perkSynergyGuideButton,
  synergyGuideOverlay,
  closeSynergyGuideButton,
  backSynergyGuideButton,
  achievementsOverlay,
  closeAchievementsButton,
  backAchievementsButton,
  closeLeaderboardButton,
  audioPrompt,
  perkSynergyPanel,
  perkControls,
  perkChoices,
  leaderboardOverlay,
  leaderboardFullBody,
  metaOverlay,
  metaUpgradeList,
  metaUpgradeTabs,
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
  showCheatToast,
  addCheatCredits,
  cheatKillAll,
  cheatHealMe,
  cheatNuke,
  markRunCheated,
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
  selectPreferredEngineeringDevice,
  openEngineeringLoadoutPopup,
  closeEngineeringLoadoutPopup,
  isActiveRunState,
  isPauseAllowed,
  openLeaderboardOverlay,
  closeLeaderboardOverlay,
  openControlsOverlay,
  closeControlsOverlay,
  exitToProjectPage,
  openMetaOverlay,
  closeMetaOverlay,
  openSynergyGuideOverlay,
  closeSynergyGuideOverlay,
  openAchievementsOverlay,
  closeAchievementsOverlay,
  buyMetaUpgrade,
  setMetaUpgradeTab,
  syncPointerWorld,
  resizeGameViewportForFullscreen,
  switchToPistolSlot,
  switchToWeaponSlot,
} from "./game.js";
import { shoot, dash } from "./bullet.js";
import { forceSpawnTechpriestNow } from "./enemy.js";
import { throwGrenade } from "./grenade.js";
import { setLanguage, t } from "./i18n.js";
import {
  beginEngineeringPlacement,
  cancelEngineeringPlacement,
  hasActiveEngineeringPlacement,
  releaseEngineeringPlacement,
} from "./engineering-device-control.js";

// Input wiring and audio UI controls.

function pointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  world.pointerScreen.x = (event.clientX - rect.left) * scaleX;
  world.pointerScreen.y = (event.clientY - rect.top) * scaleY;
  syncPointerWorld();
}

function engineeringPlacementContext() {
  return {
    player,
    worldWidth: world.width,
    worldHeight: world.height,
    solids: world.destructibles,
    actors: world.foes,
  };
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

let cheatBuffer = "";
const CHEAT_BUFFER_LIMIT = 24;

const CHEAT_CODE_MAP = {
  KeyA: "A",
  KeyB: "B",
  KeyC: "C",
  KeyD: "D",
  KeyE: "E",
  KeyF: "F",
  KeyG: "G",
  KeyH: "H",
  KeyI: "I",
  KeyJ: "J",
  KeyK: "K",
  KeyL: "L",
  KeyM: "M",
  KeyN: "N",
  KeyO: "O",
  KeyP: "P",
  KeyQ: "Q",
  KeyR: "R",
  KeyS: "S",
  KeyT: "T",
  KeyU: "U",
  KeyV: "V",
  KeyW: "W",
  KeyX: "X",
  KeyY: "Y",
  KeyZ: "Z",
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
};

const CONTROL_CODE_TO_KEY = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  Space: " ",
  ShiftLeft: "shift",
  ShiftRight: "shift",
};

function normalizedControlKey(event) {
  return CONTROL_CODE_TO_KEY[event.code] || event.key.toLowerCase();
}

function isGameplayControlEvent(event) {
  return Boolean(CONTROL_CODE_TO_KEY[event.code]) || event.code === "KeyE";
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

function getCheatChar(event) {
  return CHEAT_CODE_MAP[event.code] || "";
}

function shouldIgnoreCheatInput(event) {
  if (event.ctrlKey || event.altKey || event.metaKey) return true;
  return isTextInputTarget(event.target);
}

function menuCheatOverlaysClosed() {
  return !controlsOverlay?.classList.contains("visible")
    && !leaderboardOverlay?.classList.contains("visible")
    && !metaOverlay?.classList.contains("visible")
    && !synergyGuideOverlay?.classList.contains("visible")
    && !achievementsOverlay?.classList.contains("visible");
}

function canEnterMenuCheats() {
  return world.state === "menu"
    && mainMenuOverlay?.classList.contains("visible")
    && menuCheatOverlaysClosed();
}

function canEnterPauseCheats() {
  return world.state === "paused"
    && pauseOverlay?.classList.contains("visible")
    && isActiveRunState(world.stateBeforePause);
}

const MENU_CHEATS = {
  GODMODE: () => {
    world.nextRunCheats.godMode = true;
    showCheatToast("GODMODE ENABLED / NEXT RUN");
  },
  RICHMAN: () => {
    addCheatCredits(1000);
    showCheatToast("RICHMAN / +1000 CREDITS");
  },
  TECHPRIEST: () => {
    world.nextRunCheats.forceTechpriest = true;
    showCheatToast("TECHPRIEST FORCED / NEXT RUN");
  },
  ARMORY: () => {
    world.nextRunCheats.armoryDrop = true;
    showCheatToast("ARMORY DROP / NEXT RUN");
  },
  SWARMHELL: () => {
    world.nextRunCheats.swarmHell = true;
    showCheatToast("SWARMHELL / NEXT RUN");
  },
};

const PAUSE_CHEATS = {
  KILLALL: () => cheatKillAll(),
  HEALME: () => cheatHealMe(),
  TECHNOW: () => {
    markRunCheated();
    if (forceSpawnTechpriestNow()) {
      showCheatToast("TECH-PRIEST SUMMONED / TECHNOW");
    } else {
      showCheatToast("TECHNOW FAILED / INVALID WAVE");
    }
  },
  NUKE: () => cheatNuke(),
};

function tryActivateCheat(buffer, table) {
  for (const [code, activate] of Object.entries(table)) {
    if (buffer.endsWith(code)) {
      activate();
      return true;
    }
  }
  return false;
}

function handleCheatInput(event) {
  if (shouldIgnoreCheatInput(event)) return false;

  const allowMenuCodes = canEnterMenuCheats();
  const allowPauseCodes = canEnterPauseCheats();
  if (!allowMenuCodes && !allowPauseCodes) return false;

  const char = getCheatChar(event);
  if (!char) return false;

  cheatBuffer = `${cheatBuffer}${char}`.slice(-CHEAT_BUFFER_LIMIT);

  if (allowMenuCodes && tryActivateCheat(cheatBuffer, MENU_CHEATS)) {
    cheatBuffer = "";
    return true;
  }

  if (allowPauseCodes && tryActivateCheat(cheatBuffer, PAUSE_CHEATS)) {
    cheatBuffer = "";
    return true;
  }

  return false;
}

function initInput() {
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();

      if (cancelEngineeringPlacement(world)) {
        return;
      }

      if (engineeringLoadoutOverlay?.classList.contains("visible")) {
        closeEngineeringLoadoutPopup();
        return;
      }

      if (achievementsOverlay?.classList.contains("visible")) {
        closeAchievementsOverlay();
        return;
      }
      if (synergyGuideOverlay?.classList.contains("visible")) {
        closeSynergyGuideOverlay();
        return;
      }
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
    if (handleCheatInput(event)) {
      event.preventDefault();
      return;
    }
    const textInput = isTextInputTarget(event.target);

    if (textInput) {
      return;
    }

    if (
      event.code === "KeyQ"
      && world.state === "playing"
    ) {
      event.preventDefault();

      if (
        !event.repeat
        && !event.ctrlKey
        && !event.altKey
        && !event.metaKey
      ) {
        beginEngineeringPlacement(
          world,
          world.pointer,
          engineeringPlacementContext(),
        );
      }

      return;
    }

    if (
      world.state === "playing"
      && ["Digit1", "Digit2", "Digit3"].includes(event.code)
    ) {
      event.preventDefault();

      if (
        !event.repeat
        && !event.ctrlKey
        && !event.altKey
        && !event.metaKey
      ) {
        if (event.code === "Digit1") switchToPistolSlot();
        if (event.code === "Digit2") switchToWeaponSlot(0);
        if (event.code === "Digit3") switchToWeaponSlot(1);
      }

      return;
    }

    if (
      event.code === "KeyG"
      && world.state === "playing"
    ) {
      event.preventDefault();

      if (
        !event.repeat
        && !event.ctrlKey
        && !event.altKey
        && !event.metaKey
      ) {
        throwGrenade();
      }

      return;
    }

    const key = normalizedControlKey(event);

    world.keys.add(key);

    if (event.code === "KeyE") {
      world.keys.add("interact");
    }

    if (key === "shift") {
      dash();
    }

    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "KeyQ") {
      if (
        !hasActiveEngineeringPlacement(world)
        && isTextInputTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      if (world.state === "playing") {
        const result = releaseEngineeringPlacement(
          world,
          world.pointer,
          engineeringPlacementContext(),
        );
        if (
          result.deployed
          && world.engineeringLoadout.runDevice === "bastion7"
        ) {
          audio.turretDeploy();
        }
      } else {
        cancelEngineeringPlacement(world);
      }
      return;
    }

    const key = normalizedControlKey(event);
    world.keys.delete(key);

    if (event.code === "KeyE") {
      world.keys.delete("interact");
    }
  });

  canvas.addEventListener("mousemove", pointer);
  canvas.addEventListener("mousedown", (event) => {
    pointer(event);
    if (event.button === 2 && cancelEngineeringPlacement(world)) {
      event.preventDefault();
      return;
    }
    if (event.button !== 0) return;
    world.pointer.down = true;
    shoot();
  });
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
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
    requestAnimationFrame(resizeGameViewportForFullscreen);
  });
  syncFullscreenUi();
  requestAnimationFrame(resizeGameViewportForFullscreen);

  mainMenuStartButton?.addEventListener("click", openEngineeringLoadoutPopup);
  mainMenuControlsButton?.addEventListener("click", openControlsOverlay);
  mainMenuUpgradesButton?.addEventListener("click", openMetaOverlay);
  mainMenuSynergyGuideButton?.addEventListener("click", openSynergyGuideOverlay);
  mainMenuAchievementsButton?.addEventListener("click", openAchievementsOverlay);
  mainMenuHallButton?.addEventListener("click", openLeaderboardOverlay);
  mainMenuAudioButton?.addEventListener("click", toggleMainMenuAudioSettings);
  mainMenuFullscreenButton?.addEventListener("click", toggleGameFullscreen);
  mainMenuExitButton?.addEventListener("click", exitToProjectPage);
  for (const button of engineeringLoadoutButtons) {
    button.addEventListener("click", () => {
      selectPreferredEngineeringDevice(button.dataset.engineeringDevice);
    });
  }
  engineeringLoadoutBeginButton?.addEventListener("click", startGame);
  engineeringLoadoutOverlay?.addEventListener("click", (event) => {
    if (event.target === engineeringLoadoutOverlay) {
      closeEngineeringLoadoutPopup();
    }
  });
  closeControlsButton?.addEventListener("click", closeControlsOverlay);
  resumeRunButton?.addEventListener("click", closePauseMenu);
  abortRunButton?.addEventListener("click", abortRunToSummary);
  pauseMainMenuButton?.addEventListener("click", returnToMainMenuFromRun);
  startButton?.addEventListener("click", startGame);
  overlayButton?.addEventListener("click", startGame);
  menuMetaButton?.addEventListener("click", openMetaOverlay);
  openLeaderboardButton?.addEventListener("click", openLeaderboardOverlay);
  overlayMetaButton?.addEventListener("click", openMetaOverlay);
  resultsMainMenuButton?.addEventListener("click", returnToMainMenuFromResults);
  metaSynergyGuideButton?.addEventListener("click", openSynergyGuideOverlay);
  perkSynergyGuideButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openSynergyGuideOverlay();
  });
  closeMetaButton?.addEventListener("click", closeMetaOverlay);
  closeSynergyGuideButton?.addEventListener("click", closeSynergyGuideOverlay);
  backSynergyGuideButton?.addEventListener("click", closeSynergyGuideOverlay);
  synergyGuideOverlay?.addEventListener("click", (event) => {
    if (event.target === synergyGuideOverlay) {
      closeSynergyGuideOverlay();
    }
  });
  closeAchievementsButton?.addEventListener("click", closeAchievementsOverlay);
  backAchievementsButton?.addEventListener("click", closeAchievementsOverlay);
  achievementsOverlay?.addEventListener("click", (event) => {
    if (event.target === achievementsOverlay) {
      closeAchievementsOverlay();
    }
  });
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
  metaUpgradeTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meta-tab]");
    if (!button) return;
    setMetaUpgradeTab(button.dataset.metaTab);
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
