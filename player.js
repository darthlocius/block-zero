import {
  player,
  world,
  buffs,
  banner,
  currentWeapon,
  getMetaHealingMultiplier,
  moveSpeed,
  moveVector,
  audio,
  dist,
  updateCamera,
  updateActorFacing,
  playerAnimationState,
  syncHud,
} from "./game.js";
import { moveActor } from "./collision.js";
import { shoot } from "./bullet.js";
import { t } from "./i18n.js";

// Player movement, pickups, and weapon handling.

function applyPickup(pickup) {
  if (pickup.type.startsWith("weapon-")) {
    player.weapon = pickup.type.replace("weapon-", "");
    banner(currentWeapon().label.toUpperCase(), t("banner.weaponPickup.subtitle"), 1.3, "#86f7ff");
  } else if (pickup.type === "med") {
    player.health = Math.min(player.maxHealth, player.health + 32 * getMetaHealingMultiplier());
    banner(t("banner.medkit.title"), t("banner.medkit.subtitle"), 1.2, "#7cff93");
    syncHud();
  } else {
    world.buffs[pickup.type] = Math.max(world.buffs[pickup.type], buffs[pickup.type].duration);
    banner(t(`boost.${pickup.type}`).toUpperCase(), t("banner.boostPickup.subtitle"), 1.2, buffs[pickup.type].color);
  }
  audio.pickup(pickup.type);
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
  world.pickups = world.pickups.filter((pickup) => {
    pickup.life -= dt;
    pickup.pulse += dt * (pickup.type.startsWith("weapon-") ? 2.4 : 3.5);
    if (dist(pickup, player) <= pickup.radius + player.radius) {
      applyPickup(pickup);
      return false;
    }
    return pickup.life > 0;
  });
}

export {
  applyPickup,
  updatePlayer,
  updatePickups,
};
