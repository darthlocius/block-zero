import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AVAILABLE_ENGINEERING_DEVICE_IDS,
  DEFAULT_ENGINEERING_DEVICE_ID,
  ENGINEERING_DEVICE_IDS,
  ENGINEERING_LOADOUT_STORAGE_KEY,
  KNOWN_ENGINEERING_DEVICE_IDS,
  clearEngineeringRunDevice,
  createEngineeringLoadoutState,
  isEngineeringDeviceAvailable,
  loadPreferredEngineeringDevice,
  lockEngineeringDeviceForRun,
  normalizeEngineeringDeviceId,
  savePreferredEngineeringDevice,
  setPreferredEngineeringDevice,
} from "../engineering-loadout.js";

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage",
);
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inputSource = readFileSync(new URL("../input.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

function setLocalStorage(value) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value,
  });
}

afterEach(() => {
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(
      globalThis,
      "localStorage",
      originalLocalStorageDescriptor,
    );
  } else {
    delete globalThis.localStorage;
  }
});

test("Bastion-7 is known and officially available", () => {
  assert.equal(KNOWN_ENGINEERING_DEVICE_IDS.includes(ENGINEERING_DEVICE_IDS.BASTION_7), true);
  assert.equal(AVAILABLE_ENGINEERING_DEVICE_IDS.includes(ENGINEERING_DEVICE_IDS.BASTION_7), true);
  assert.equal(isEngineeringDeviceAvailable(ENGINEERING_DEVICE_IDS.BASTION_7), true);
});

test("Manticore-4 is known and officially available", () => {
  assert.equal(KNOWN_ENGINEERING_DEVICE_IDS.includes(ENGINEERING_DEVICE_IDS.MANTICORE_4), true);
  assert.equal(AVAILABLE_ENGINEERING_DEVICE_IDS.includes(ENGINEERING_DEVICE_IDS.MANTICORE_4), true);
  assert.equal(isEngineeringDeviceAvailable(ENGINEERING_DEVICE_IDS.MANTICORE_4), true);
});

test("Bastion-7 remains the default engineering device", () => {
  assert.equal(DEFAULT_ENGINEERING_DEVICE_ID, ENGINEERING_DEVICE_IDS.BASTION_7);
});

test("missing preference normalizes to Bastion-7", () => {
  assert.equal(normalizeEngineeringDeviceId(undefined), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("unknown preference normalizes to Bastion-7", () => {
  assert.equal(normalizeEngineeringDeviceId("unknown-device"), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("invalid preference type normalizes to Bastion-7", () => {
  assert.equal(normalizeEngineeringDeviceId({ device: "bastion7" }), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("valid Manticore-4 preference remains Manticore-4", () => {
  assert.equal(
    normalizeEngineeringDeviceId(ENGINEERING_DEVICE_IDS.MANTICORE_4),
    ENGINEERING_DEVICE_IDS.MANTICORE_4,
  );
});

test("valid Bastion-7 preference remains Bastion-7", () => {
  assert.equal(
    normalizeEngineeringDeviceId(ENGINEERING_DEVICE_IDS.BASTION_7),
    ENGINEERING_DEVICE_IDS.BASTION_7,
  );
});

test("new loadout state normalizes preference and leaves run device unlocked", () => {
  assert.deepEqual(createEngineeringLoadoutState(ENGINEERING_DEVICE_IDS.MANTICORE_4), {
    preferredDevice: ENGINEERING_DEVICE_IDS.MANTICORE_4,
    runDevice: null,
  });
});

test("run lock copies preferred device into the run snapshot", () => {
  const state = createEngineeringLoadoutState(ENGINEERING_DEVICE_IDS.MANTICORE_4);
  assert.equal(lockEngineeringDeviceForRun(state), ENGINEERING_DEVICE_IDS.MANTICORE_4);
  assert.equal(state.runDevice, state.preferredDevice);
});

test("changing preference after lock does not change the current run snapshot", () => {
  const state = createEngineeringLoadoutState(
    ENGINEERING_DEVICE_IDS.BASTION_7,
  );
  lockEngineeringDeviceForRun(state);
  setPreferredEngineeringDevice(
    state,
    ENGINEERING_DEVICE_IDS.MANTICORE_4,
  );

  assert.equal(state.preferredDevice, ENGINEERING_DEVICE_IDS.MANTICORE_4);
  assert.equal(state.runDevice, ENGINEERING_DEVICE_IDS.BASTION_7);
});

test("clearing a run snapshot preserves the preferred device", () => {
  const state = createEngineeringLoadoutState(
    ENGINEERING_DEVICE_IDS.MANTICORE_4,
  );
  lockEngineeringDeviceForRun(state);
  clearEngineeringRunDevice(state);

  assert.equal(state.preferredDevice, ENGINEERING_DEVICE_IDS.MANTICORE_4);
  assert.equal(state.runDevice, null);
});

test("a new lock uses the latest preferred device", () => {
  const state = createEngineeringLoadoutState(
    ENGINEERING_DEVICE_IDS.BASTION_7,
  );
  lockEngineeringDeviceForRun(state);
  clearEngineeringRunDevice(state);
  setPreferredEngineeringDevice(
    state,
    ENGINEERING_DEVICE_IDS.MANTICORE_4,
  );

  assert.equal(
    lockEngineeringDeviceForRun(state),
    ENGINEERING_DEVICE_IDS.MANTICORE_4,
  );
});

test("missing persisted preference falls back to Bastion-7", () => {
  let writes = 0;
  setLocalStorage({
    getItem: () => null,
    setItem() {
      writes += 1;
    },
  });
  assert.equal(loadPreferredEngineeringDevice(), DEFAULT_ENGINEERING_DEVICE_ID);
  assert.equal(writes, 0);
});

test("storage read failure falls back to Bastion-7 without throwing", () => {
  setLocalStorage({
    getItem() {
      throw new Error("read failed");
    },
  });

  assert.doesNotThrow(() => loadPreferredEngineeringDevice());
  assert.equal(loadPreferredEngineeringDevice(), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("valid persisted Bastion-7 preference loads", () => {
  setLocalStorage({
    getItem: () => JSON.stringify({ preferredDevice: ENGINEERING_DEVICE_IDS.BASTION_7 }),
  });
  assert.equal(loadPreferredEngineeringDevice(), ENGINEERING_DEVICE_IDS.BASTION_7);
});

test("valid persisted Manticore-4 preference loads", () => {
  setLocalStorage({
    getItem: () => JSON.stringify({ preferredDevice: ENGINEERING_DEVICE_IDS.MANTICORE_4 }),
  });
  assert.equal(loadPreferredEngineeringDevice(), ENGINEERING_DEVICE_IDS.MANTICORE_4);
});

test("malformed persisted JSON falls back without throwing", () => {
  setLocalStorage({ getItem: () => "{malformed" });
  assert.doesNotThrow(() => loadPreferredEngineeringDevice());
  assert.equal(loadPreferredEngineeringDevice(), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("unknown persisted device falls back to Bastion-7", () => {
  setLocalStorage({
    getItem: () => JSON.stringify({ preferredDevice: "unknown-device" }),
  });
  assert.equal(loadPreferredEngineeringDevice(), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("persisted invalid preference type falls back to Bastion-7", () => {
  setLocalStorage({
    getItem: () => JSON.stringify({ preferredDevice: { id: "manticore4" } }),
  });
  assert.equal(loadPreferredEngineeringDevice(), DEFAULT_ENGINEERING_DEVICE_ID);
});

test("save persists only the Bastion-7 preferred device", () => {
  let storedKey = null;
  let storedValue = null;
  setLocalStorage({
    setItem(key, value) {
      storedKey = key;
      storedValue = value;
    },
  });
  const state = createEngineeringLoadoutState(ENGINEERING_DEVICE_IDS.BASTION_7);
  lockEngineeringDeviceForRun(state);

  assert.equal(savePreferredEngineeringDevice(state.preferredDevice), true);
  assert.equal(storedKey, ENGINEERING_LOADOUT_STORAGE_KEY);
  assert.deepEqual(JSON.parse(storedValue), {
    preferredDevice: ENGINEERING_DEVICE_IDS.BASTION_7,
  });
  assert.equal(Object.hasOwn(JSON.parse(storedValue), "runDevice"), false);
});

test("save persists only the Manticore-4 preferred device", () => {
  let storedKey = null;
  let storedValue = null;
  setLocalStorage({
    setItem(key, value) {
      storedKey = key;
      storedValue = value;
    },
  });
  const state = createEngineeringLoadoutState(ENGINEERING_DEVICE_IDS.MANTICORE_4);
  lockEngineeringDeviceForRun(state);

  assert.equal(savePreferredEngineeringDevice(state.preferredDevice), true);
  assert.equal(storedKey, ENGINEERING_LOADOUT_STORAGE_KEY);
  assert.deepEqual(JSON.parse(storedValue), {
    preferredDevice: ENGINEERING_DEVICE_IDS.MANTICORE_4,
  });
  assert.equal(Object.hasOwn(JSON.parse(storedValue), "runDevice"), false);
});

test("storage write failure returns false without throwing", () => {
  setLocalStorage({
    setItem() {
      throw new Error("write failed");
    },
  });

  assert.doesNotThrow(() => savePreferredEngineeringDevice(ENGINEERING_DEVICE_IDS.BASTION_7));
  assert.equal(savePreferredEngineeringDevice(ENGINEERING_DEVICE_IDS.BASTION_7), false);
});

test("engineering selector lives only in the pre-run popup", () => {
  const mainMenuMarkup = indexHtml.match(
    /<nav class="main-menu-actions"[\s\S]*?<\/nav>/,
  )?.[0] || "";
  const popupStart = indexHtml.indexOf('id="engineeringLoadoutOverlay"');
  const popupEnd = indexHtml.indexOf('id="cheatToastRoot"', popupStart);
  const popupMarkup = indexHtml.slice(popupStart, popupEnd);

  assert.doesNotMatch(mainMenuMarkup, /data-engineering-device=/);
  assert.match(popupMarkup, /role="dialog"/);
  assert.match(popupMarkup, /id="engineeringDeviceBastion7"/);
  assert.match(popupMarkup, /id="engineeringDeviceManticore4"/);
  assert.match(popupMarkup, /id="engineeringLoadoutBeginButton"/);
});

test("main menu surrounds the central art with distinct start, arc, and exit regions", () => {
  const mainMenuMarkup = indexHtml.match(
    /<nav class="main-menu-actions"[\s\S]*?<\/nav>/,
  )?.[0] || "";
  const leftArcMarkup = mainMenuMarkup.match(
    /<div class="main-menu-arc main-menu-arc-left">([\s\S]*?)(?=<div class="main-menu-arc main-menu-arc-right">)/,
  )?.[1] || "";
  const rightArcMarkup = mainMenuMarkup.match(
    /<div class="main-menu-arc main-menu-arc-right">([\s\S]*?)(?=<div class="main-menu-exit">)/,
  )?.[1] || "";
  const ids = [...indexHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

  assert.equal((mainMenuMarkup.match(/class="main-menu-start"/g) || []).length, 1);
  assert.match(mainMenuMarkup, /class="main-menu-start">\s*<button id="mainMenuStartButton"/);
  assert.equal((mainMenuMarkup.match(/class="main-menu-exit"/g) || []).length, 1);
  assert.match(mainMenuMarkup, /class="main-menu-exit">\s*<button id="mainMenuExitButton"/);

  for (const id of [
    "mainMenuControlsButton",
    "mainMenuUpgradesButton",
    "mainMenuAchievementsButton",
    "mainMenuAudioButton",
  ]) {
    assert.match(leftArcMarkup, new RegExp(`id="${id}"`));
    assert.doesNotMatch(rightArcMarkup, new RegExp(`id="${id}"`));
  }

  for (const id of [
    "mainMenuFullscreenButton",
    "mainMenuSynergyGuideButton",
    "mainMenuHallButton",
  ]) {
    assert.match(rightArcMarkup, new RegExp(`id="${id}"`));
    assert.doesNotMatch(leftArcMarkup, new RegExp(`id="${id}"`));
  }

  assert.match(rightArcMarkup, /data-i18n="mainMenu.language"/);
  assert.doesNotMatch(mainMenuMarkup, /data-engineering-device=/);
  assert.equal(new Set(ids).size, ids.length);
});

test("pre-run popup keeps open, confirm, and cancel paths distinct", () => {
  assert.match(
    inputSource,
    /mainMenuStartButton\?\.addEventListener\("click", openEngineeringLoadoutPopup\)/,
  );
  assert.match(
    inputSource,
    /engineeringLoadoutBeginButton\?\.addEventListener\("click", startGame\)/,
  );
  assert.match(
    inputSource,
    /engineeringLoadoutOverlay\?\.classList\.contains\("visible"\)[\s\S]*?closeEngineeringLoadoutPopup\(\)/,
  );
});

test("Manticore selector and HUD share a four-opening 2x2 launcher face", () => {
  const sharedLauncherRule = styleSource.match(
    /\.engineering-device-pictogram-manticore::before,\s*\.manticore-hud-tubes\s*\{([\s\S]*?)\n\}/,
  )?.[1] || "";
  const tubeOpenings = sharedLauncherRule.match(/radial-gradient\(circle at/g) || [];

  assert.equal(tubeOpenings.length, 4);
  assert.match(sharedLauncherRule, /border-radius:\s*5px/);
  assert.doesNotMatch(sharedLauncherRule, /box-shadow/);
});
