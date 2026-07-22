import {
  player,
  world,
  clamp,
  circleRect,
  burst,
  addDecal,
  spawnBarrelExplosionEffect,
  spawnBoxBreakEffect,
  spawnConcreteBreakEffect,
  spawnImpactFlash,
  audio,
  maybePickup,
  damagePlayer,
  applyDamageToFoe,
  addScreenShake,
  trackBarrelDestroyedForAchievements,
} from "./game.js";

// Collision resolution for actors, shots, and destructible solids.

function moveActor(actor, vx, vy, dt) {
  actor.x += vx * dt;
  resolveSolids(actor);
  actor.y += vy * dt;
  resolveSolids(actor);
  actor.x = clamp(actor.x, actor.radius + 6, world.width - actor.radius - 6);
  actor.y = clamp(actor.y, actor.radius + 6, world.height - actor.radius - 6);
}

function applyExplosionDamage(x, y, radius, damage, sourceSolid = null) {
  for (const foe of world.foes) {
    const d = Math.hypot(foe.x - x, foe.y - y);
    if (d >= radius) continue;
    applyDamageToFoe(foe, damage * (1 - d / radius), { source: "explosion" });
  }
  const playerDistance = Math.hypot(player.x - x, player.y - y);
  if (playerDistance < radius) damagePlayer(damage * 0.34 * (1 - playerDistance / radius), { explosive: true });
  for (const solid of world.destructibles) {
    if (solid.destroyed || solid === sourceSolid) continue;
    const d = Math.hypot(solid.x - x, solid.y - y);
    if (d >= radius) continue;
    damageSolid(solid, damage * 0.7 * (1 - d / radius), solid.x, solid.y);
  }
}

function resolveSolids(actor) {
  for (const solid of world.destructibles) {
    if (solid.destroyed) continue;
    const hit = circleRect(actor, solid);
    if (!hit.hit) continue;
    const len = Math.hypot(hit.dx, hit.dy) || 1;
    actor.x += hit.dx / len * (hit.overlap + 0.5);
    actor.y += hit.dy / len * (hit.overlap + 0.5);
  }
}

function damageSolid(solid, amount, x, y) {
  if (solid.destroyed) return;
  solid.hp -= amount;
  solid.flash = 0.18;
  if (solid.type === "barrel") burst(x, y, "#ff9d43", 5, 0.75);
  else if (solid.type === "crate" || solid.type === "longcrate") burst(x, y, "#b47c48", 4, 0.55);
  else burst(x, y, "#b9c2d0", 4, 0.6);
  if (solid.hp > 0) return;
  solid.destroyed = true;
  if (solid.type === "barrel") {
    trackBarrelDestroyedForAchievements();
  }
  world.score += solid.reward;
  addDecal(solid.x, solid.y, Math.max(solid.w, solid.h) * 0.55, "rgba(18, 18, 18, 0.32)", 0.18);
  if (solid.type === "barrel") spawnBarrelExplosionEffect(solid);
  else if (solid.type === "crate" || solid.type === "longcrate") spawnBoxBreakEffect(solid);
  else spawnConcreteBreakEffect(solid);
  if (solid.explosive) {
    audio.explosion();
    addScreenShake(0.38);
    applyExplosionDamage(solid.x, solid.y, 144, 76, solid);
  } else audio.death("criminal");
  maybePickup(solid.x, solid.y, solid.type === "crate" || solid.type === "wall" || solid.type === "longcrate");
}

function projectileHitsSolids(shot, scale = 1) {
  for (const solid of world.destructibles) {
    if (solid.destroyed) continue;
    const hit = circleRect(shot, solid);
    if (!hit.hit) continue;
    spawnImpactFlash(
      hit.nx,
      hit.ny,
      shot.style === "rocket" ? "#cfff8f" : shot.style === "cannon" ? "#9fd7ff" : shot.style === "plasmaOrb" ? "#8eeeff" : shot.style === "shell" ? "#ffd193" : shot.style === "needle" ? "#ffd69e" : "#ffe6bc",
      shot.style === "rocket" ? 1.12 : shot.style === "cannon" ? 0.98 : shot.style === "plasmaOrb" ? 1.08 : shot.style === "shell" ? 1.02 : shot.style === "needle" ? 0.72 : 0.9,
      shot.style === "rocket" ? "rocket" : shot.style === "cannon" ? "cannon" : shot.style === "plasmaOrb" ? "plasmaOrb" : (shot.weaponId || shot.style || "bullet")
    );
    damageSolid(solid, shot.damage * scale, hit.nx, hit.ny);
    return true;
  }
  return false;
}

export {
  moveActor,
  applyExplosionDamage,
  resolveSolids,
  damageSolid,
  projectileHitsSolids,
};
