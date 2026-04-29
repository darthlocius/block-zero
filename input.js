import {
  canvas,
  fullscreenRoot,
  gameFrame,
  fullscreenButton,
  world,
  assets,
  startButton,
  menuMetaButton,
  overlayButton,
  overlayMetaButton,
  closeMetaButton,
  audioPrompt,
  perkSynergyPanel,
  perkChoices,
  metaUpgradeList,
  saveScoreButton,
  playerNameInput,
  masterVolume,
  musicVolume,
  sfxVolume,
  audio,
  startGame,
  saveLeaderboardEntry,
  chooseWaveBonus,
  togglePerkSynergyDescription,
  confirmDeathSequence,
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
  audio.setVolumes({
    master: Number(masterVolume.value) / 100,
    music: Number(musicVolume.value) / 100,
    sfx: Number(sfxVolume.value) / 100,
  });
}

function syncCurrentMusic() {
  const musicMode = world.state === "playing" || world.state === "intermission" || world.state === "wave_clear" || world.state === "perk_select" ? "battle" : "menu";
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
    if (world.state === "death_sequence" && world.deathSequenceReadyForClick) {
      event.preventDefault();
      confirmDeathSequence();
      return;
    }
    if (event.key === "Escape") {
      closeMetaOverlay();
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "f" && !isTextInputTarget(event.target)) {
      event.preventDefault();
      toggleGameFullscreen();
      return;
    }
    world.keys.add(key);
    if (key === "shift") dash();
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    world.keys.delete(event.key.toLowerCase());
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
    });
  });
  document.addEventListener("fullscreenchange", syncFullscreenUi);
  window.addEventListener("resize", () => {
    if (document.fullscreenElement === fullscreenRoot) {
      requestAnimationFrame(resizeGameViewportForFullscreen);
    }
  });
  syncFullscreenUi();

  startButton.addEventListener("click", startGame);
  overlayButton.addEventListener("click", startGame);
  menuMetaButton?.addEventListener("click", openMetaOverlay);
  overlayMetaButton?.addEventListener("click", openMetaOverlay);
  closeMetaButton?.addEventListener("click", closeMetaOverlay);
  perkChoices?.addEventListener("click", (event) => {
    const card = event.target.closest("[data-bonus-id]");
    if (!card) return;
    chooseWaveBonus(card.dataset.bonusId);
  });
  perkSynergyPanel?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-perk-synergy-id]");
    if (!chip) return;
    event.preventDefault();
    event.stopPropagation();
    togglePerkSynergyDescription(chip.dataset.perkSynergyId);
  });
  metaUpgradeList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meta-upgrade-id]");
    if (!button) return;
    buyMetaUpgrade(button.dataset.metaUpgradeId);
  });
  saveScoreButton.addEventListener("click", saveLeaderboardEntry);
  playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveLeaderboardEntry();
    }
  });
  masterVolume.addEventListener("input", applyVolumeSettings);
  musicVolume.addEventListener("input", applyVolumeSettings);
  sfxVolume.addEventListener("input", applyVolumeSettings);
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
