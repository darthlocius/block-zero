// Engineering device registry, persisted preference, and run-local loadout snapshot.

import { safeStorageGet, safeStorageSet } from "./storage.js";

const ENGINEERING_DEVICE_IDS = Object.freeze({
  BASTION_7: "bastion7",
  MANTICORE_4: "manticore4",
});

const DEFAULT_ENGINEERING_DEVICE_ID = ENGINEERING_DEVICE_IDS.BASTION_7;

const KNOWN_ENGINEERING_DEVICE_IDS = Object.freeze([
  ENGINEERING_DEVICE_IDS.BASTION_7,
  ENGINEERING_DEVICE_IDS.MANTICORE_4,
]);

const AVAILABLE_ENGINEERING_DEVICE_IDS = Object.freeze([
  ENGINEERING_DEVICE_IDS.BASTION_7,
  ENGINEERING_DEVICE_IDS.MANTICORE_4,
]);

const ENGINEERING_LOADOUT_STORAGE_KEY = "block-zero-engineering-loadout-v1";

function isKnownEngineeringDeviceId(deviceId) {
  return typeof deviceId === "string"
    && KNOWN_ENGINEERING_DEVICE_IDS.includes(deviceId);
}

function isEngineeringDeviceAvailable(
  deviceId,
  availableDeviceIds = AVAILABLE_ENGINEERING_DEVICE_IDS,
) {
  return isKnownEngineeringDeviceId(deviceId)
    && Array.isArray(availableDeviceIds)
    && availableDeviceIds.includes(deviceId);
}

function normalizeEngineeringDeviceId(
  deviceId,
  availableDeviceIds = AVAILABLE_ENGINEERING_DEVICE_IDS,
) {
  return isEngineeringDeviceAvailable(deviceId, availableDeviceIds)
    ? deviceId
    : DEFAULT_ENGINEERING_DEVICE_ID;
}

function loadPreferredEngineeringDevice() {
  const raw = safeStorageGet(ENGINEERING_LOADOUT_STORAGE_KEY, null);
  if (typeof raw !== "string") return DEFAULT_ENGINEERING_DEVICE_ID;

  try {
    const parsed = JSON.parse(raw);
    return normalizeEngineeringDeviceId(parsed?.preferredDevice);
  } catch {
    return DEFAULT_ENGINEERING_DEVICE_ID;
  }
}

function savePreferredEngineeringDevice(deviceId) {
  const preferredDevice = normalizeEngineeringDeviceId(deviceId);
  return safeStorageSet(
    ENGINEERING_LOADOUT_STORAGE_KEY,
    JSON.stringify({ preferredDevice }),
  );
}

function createEngineeringLoadoutState(
  preferredDevice = DEFAULT_ENGINEERING_DEVICE_ID,
  availableDeviceIds = AVAILABLE_ENGINEERING_DEVICE_IDS,
) {
  return {
    preferredDevice: normalizeEngineeringDeviceId(
      preferredDevice,
      availableDeviceIds,
    ),
    runDevice: null,
  };
}

function setPreferredEngineeringDevice(
  state,
  deviceId,
  availableDeviceIds = AVAILABLE_ENGINEERING_DEVICE_IDS,
) {
  if (!state || typeof state !== "object") return DEFAULT_ENGINEERING_DEVICE_ID;
  state.preferredDevice = normalizeEngineeringDeviceId(deviceId, availableDeviceIds);
  return state.preferredDevice;
}

function lockEngineeringDeviceForRun(
  state,
  availableDeviceIds = AVAILABLE_ENGINEERING_DEVICE_IDS,
) {
  if (!state || typeof state !== "object") return null;
  state.runDevice = normalizeEngineeringDeviceId(
    state.preferredDevice,
    availableDeviceIds,
  );
  return state.runDevice;
}

function clearEngineeringRunDevice(state) {
  if (!state || typeof state !== "object") return null;
  state.runDevice = null;
  return state.runDevice;
}

export {
  ENGINEERING_DEVICE_IDS,
  DEFAULT_ENGINEERING_DEVICE_ID,
  KNOWN_ENGINEERING_DEVICE_IDS,
  AVAILABLE_ENGINEERING_DEVICE_IDS,
  ENGINEERING_LOADOUT_STORAGE_KEY,
  isKnownEngineeringDeviceId,
  isEngineeringDeviceAvailable,
  normalizeEngineeringDeviceId,
  loadPreferredEngineeringDevice,
  savePreferredEngineeringDevice,
  createEngineeringLoadoutState,
  setPreferredEngineeringDevice,
  lockEngineeringDeviceForRun,
  clearEngineeringRunDevice,
};
