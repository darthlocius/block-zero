// Narrow run-device router for the shared Field Engineering Q slot.

import { ENGINEERING_DEVICE_IDS } from "./engineering-loadout.js";
import {
  beginManticorePlacement,
  cancelManticorePlacement,
  releaseManticorePlacement,
} from "./manticore.js";
import {
  beginTurretPlacement,
  cancelTurretPlacement,
  releaseTurretPlacement,
} from "./turret.js";

function selectedEngineeringDevice(worldState) {
  return worldState?.engineeringLoadout?.runDevice || null;
}

function hasActiveEngineeringPlacement(worldState) {
  const deviceId = selectedEngineeringDevice(worldState);
  if (deviceId === ENGINEERING_DEVICE_IDS.BASTION_7) {
    return Boolean(worldState?.turretAbility?.placement?.active);
  }
  if (deviceId === ENGINEERING_DEVICE_IDS.MANTICORE_4) {
    return Boolean(worldState?.manticoreAbility?.placement?.active);
  }
  return false;
}

function beginEngineeringPlacement(worldState, point, context = {}) {
  const deviceId = selectedEngineeringDevice(worldState);
  if (deviceId === ENGINEERING_DEVICE_IDS.BASTION_7) {
    return beginTurretPlacement(worldState?.turretAbility, point, context);
  }
  if (deviceId === ENGINEERING_DEVICE_IDS.MANTICORE_4) {
    return beginManticorePlacement(worldState?.manticoreAbility, point, context);
  }
  return false;
}

function releaseEngineeringPlacement(worldState, point, context = {}) {
  const deviceId = selectedEngineeringDevice(worldState);
  if (deviceId === ENGINEERING_DEVICE_IDS.BASTION_7) {
    return releaseTurretPlacement(worldState?.turretAbility, point, context);
  }
  if (deviceId === ENGINEERING_DEVICE_IDS.MANTICORE_4) {
    return releaseManticorePlacement(worldState?.manticoreAbility, point, context);
  }
  return { deployed: false, reason: "unknown_device" };
}

function cancelEngineeringPlacement(worldState) {
  const deviceId = selectedEngineeringDevice(worldState);
  if (deviceId === ENGINEERING_DEVICE_IDS.BASTION_7) {
    return cancelTurretPlacement(worldState?.turretAbility);
  }
  if (deviceId === ENGINEERING_DEVICE_IDS.MANTICORE_4) {
    return cancelManticorePlacement(worldState?.manticoreAbility);
  }
  return false;
}

export {
  selectedEngineeringDevice,
  hasActiveEngineeringPlacement,
  beginEngineeringPlacement,
  releaseEngineeringPlacement,
  cancelEngineeringPlacement,
};
