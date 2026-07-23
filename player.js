import {
  player,
  world,
  buffs,
  banner,
  getMetaHealingMultiplier,
  moveSpeed,
  moveVector,
  audio,
  dist,
  updateCamera,
  updateActorFacing,
  playerAnimationState,
  syncHud,
  handleWeaponPickup,
} from "./game.js";
import { moveActor } from "./collision.js";
import { shoot } from "./bullet.js";
import { t } from "./i18n.js";

// Player movement, pickups, and weapon handling.

const WEAPON_INTERACT_RADIUS = 56;
const WEAPON_EQUIP_HOLD_DURATION = 0.35;

function isWeaponPickup(pickup) {
  return pickup.type.startsWith("weapon-");
}

function resetWeaponPickupHold() {
  world.weaponPickupTarget = null;
  world.weaponPickupHoldTime = 0;
  world.weaponPickupHoldProgress = 0;
}

function applyPickup(pickup) {
  if (pickup.type.startsWith("weapon-")) {
    return handleWeaponPickup(pickup);
  } else if (pickup.type === "med") {
    player.health = Math.min(player.maxHealth, player.health + 32 * getMetaHealingMultiplier());
    banner(t("banner.medkit.title"), t("banner.medkit.subtitle"), 1.2, "#7cff93");
    syncHud();
  } else {
    world.buffs[pickup.type] = Math.max(world.buffs[pickup.type], buffs[pickup.type].duration);
    banner(t(`boost.${pickup.type}`).toUpperCase(), t("banner.boostPickup.subtitle"), 1.2, buffs[pickup.type].color);
  }
  audio.pickup(pickup.type);
  return true;
}

function updatePlayer(dt, canShoot) {
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashDuration = Math.max(0, player.dashDuration - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.armorFlash = Math.max(0, player.armorFlash - dt);
  const move = moveVector();
  const speed = player.dashDuration > 0 ? 620 : moveSpeed();
  const vector = player.dashDuration > 0 ? player.dashVector : move;
  moveActor(player, vector.x * speed, vector.y * speed, dt);
  updateCamera();
  player.angle = Math.atan2(world.pointer.y - player.y, world.pointer.x - player.x);
  updateActorFacing(player, player.angle, player.animationProfile);
  const animState = playerAnimationState(move.active);
  if (animState === "shoot" && player.shootAnimTimer === 0) {
    player.animTime = 0;
  } else if (animState === "idle" && !move.active) {
    player.animTime += dt * 0.8;
  } else if (animState === "death") {
    player.animTime += dt;
  } else {
    player.animTime += dt;
  }
  if (canShoot && (world.pointer.down || world.keys.has(" "))) shoot();
}

function updatePickups(dt) {
  let nearestWeaponPickup = null;
  let nearestWeaponDistance = Infinity;

  world.pickups = world.pickups.filter((pickup) => {
    pickup.life -= dt;
    pickup.pulse += dt * (pickup.type.startsWith("weapon-") ? 2.4 : 3.5);

    if (isWeaponPickup(pickup)) {
      if (pickup.life <= 0) return false;
      const distance = dist(pickup, player);
      if (distance <= WEAPON_INTERACT_RADIUS && distance < nearestWeaponDistance) {
        nearestWeaponPickup = pickup;
        nearestWeaponDistance = distance;
      }
      return true;
    }

    if (dist(pickup, player) <= pickup.radius + player.radius) {
      applyPickup(pickup);
      return false;
    }
    return pickup.life > 0;
  });

  world.weaponPickupPromptTarget = nearestWeaponPickup;

  if (!world.keys.has("interact")) {
    world.weaponPickupRequiresRelease = false;
  }

  if (!nearestWeaponPickup) {
    resetWeaponPickupHold();
    return;
  }

  if (world.weaponPickupTarget !== nearestWeaponPickup) {
    world.weaponPickupTarget = nearestWeaponPickup;
    world.weaponPickupHoldTime = 0;
    world.weaponPickupHoldProgress = 0;
  }

  if (!world.keys.has("interact")) {
    world.weaponPickupHoldTime = 0;
    world.weaponPickupHoldProgress = 0;
    return;
  }

  if (world.weaponPickupRequiresRelease) {
    world.weaponPickupHoldTime = 0;
    world.weaponPickupHoldProgress = 0;
    return;
  }

  world.weaponPickupHoldTime += dt;
  world.weaponPickupHoldProgress = Math.min(1, world.weaponPickupHoldTime / WEAPON_EQUIP_HOLD_DURATION);

  if (world.weaponPickupHoldTime >= WEAPON_EQUIP_HOLD_DURATION) {
    const pickupUsed = applyPickup(nearestWeaponPickup);
    if (pickupUsed) {
      world.pickups = world.pickups.filter((pickup) => pickup !== nearestWeaponPickup);
      world.weaponPickupPromptTarget = null;
    }
    world.weaponPickupRequiresRelease = true;
    resetWeaponPickupHold();
  }
}

export {
  applyPickup,
  updatePlayer,
  updatePickups,
};
