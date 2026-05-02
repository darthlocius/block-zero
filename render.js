import {
  canvas,
  ctx,
  assets,
  player,
  world,
  TAU,
  clamp,
  rand,
  currentWeapon,
  layoutX,
  layoutY,
  layoutW,
  layoutH,
  enemySpritesheetMeta,
  enemyAnimationState,
  moveVector,
  playerAnimationState,
  playerFrameFor,
  enemyFrameFor,
} from "./game.js";
import { t } from "./i18n.js";

// Canvas rendering for the world, actors, effects, and HUD.

const RADAR_ENEMY_RANGE = 520;

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hashTerrainTile(tileX, tileY) {
  let hash = Math.imul(tileX, 374761393) ^ Math.imul(tileY, 668265263);
  hash = (hash ^ (hash >>> 13)) >>> 0;
  hash = Math.imul(hash, 1274126177) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

function terrainVariants() {
  const variants = [
    assets.getImage("terrain_01"),
    assets.getImage("terrain_02"),
    assets.getImage("terrain_03"),
    assets.getImage("terrain_04"),
  ].filter(Boolean);
  const fallback = assets.getImage("terrain");
  return variants.length ? variants : (fallback ? [fallback] : []);
}

function drawProceduralTerrainDetails() {
  for (const w of world.terrain.windows) {
    const glow = 0.42 + Math.sin(world.lastTime * 0.002 + w.y * 0.04) * 0.15;
    ctx.fillStyle = `rgba(255, 179, 77, ${glow})`;
    ctx.fillRect(w.x, w.y, layoutW(18), layoutH(14));
  }
  for (const glow of world.terrain.glows) {
    ctx.fillStyle = glow.color;
    ctx.fillRect(glow.x, glow.y, glow.w, glow.h);
  }
  for (const p of world.terrain.puddles) {
    ctx.fillStyle = p.tint;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(180, 230, 255, 0.06)";
    ctx.beginPath();
    ctx.ellipse(p.x - p.rx * 0.2, p.y - 1, p.rx * 0.52, p.ry * 0.4, 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 2;
  for (const crack of world.terrain.cracks) {
    ctx.beginPath();
    ctx.moveTo(crack.x, crack.y);
    ctx.lineTo(crack.x + Math.cos(crack.angle) * crack.len, crack.y + Math.sin(crack.angle) * crack.len);
    ctx.stroke();
  }
  for (const stain of world.terrain.stains) {
    ctx.fillStyle = stain.color;
    ctx.beginPath();
    ctx.arc(stain.x, stain.y, stain.radius, 0, TAU);
    ctx.fill();
  }
  for (const scrap of world.terrain.trash) {
    ctx.save();
    ctx.translate(scrap.x, scrap.y);
    ctx.rotate(scrap.angle);
    ctx.fillStyle = scrap.color;
    ctx.fillRect(-scrap.size * 0.5, -1.5, scrap.size, 3);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(255, 109, 61, 0.18)";
  ctx.fillRect(0, world.height - layoutH(56), world.width, layoutH(56));
}

function drawTerrain() {
  const camera = world.camera;
  const viewLeft = camera.x;
  const viewTop = camera.y;
  const viewRight = camera.x + camera.width;
  const viewBottom = camera.y + camera.height;
  const variants = terrainVariants();

  if (variants.length) {
    const tileSize = 1024;
    const startX = Math.floor(viewLeft / tileSize) * tileSize;
    const startY = Math.floor(viewTop / tileSize) * tileSize;
    const endX = Math.min(world.width, viewRight + tileSize);
    const endY = Math.min(world.height, viewBottom + tileSize);
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        const tileX = Math.floor(x / tileSize);
        const tileY = Math.floor(y / tileSize);
        const hash = hashTerrainTile(tileX, tileY);
        const terrain = variants[hash % variants.length];
        ctx.drawImage(terrain, x, y, tileSize, tileSize);
        const shade = hash % 5;
        if (shade === 1) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.018)";
          ctx.fillRect(x, y, tileSize, tileSize);
        } else if (shade === 3) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.035)";
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
    const vignette = ctx.createRadialGradient(
      camera.x + camera.width / 2,
      camera.y + camera.height / 2,
      120,
      camera.x + camera.width / 2,
      camera.y + camera.height / 2,
      Math.max(camera.width, camera.height) * 0.78,
    );
    vignette.addColorStop(0, "rgba(8, 10, 14, 0)");
    vignette.addColorStop(1, "rgba(5, 7, 11, 0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(viewLeft, viewTop, camera.width, camera.height);
  } else {
    const g = ctx.createLinearGradient(viewLeft, viewTop, viewRight, viewBottom);
    g.addColorStop(0, "#1d222b");
    g.addColorStop(0.45, "#151920");
    g.addColorStop(1, "#0c0f14");
    ctx.fillStyle = g;
    ctx.fillRect(viewLeft, viewTop, camera.width, camera.height);
    ctx.fillStyle = "#232933";
    ctx.fillRect(0, 0, layoutW(180), world.height);
    ctx.fillRect(layoutX(778), 0, layoutW(182), world.height);
    ctx.fillStyle = "#11151b";
    ctx.fillRect(layoutX(180), 0, layoutW(104), world.height);
    ctx.fillRect(layoutX(676), 0, layoutW(102), world.height);
    ctx.fillStyle = "#1a1f27";
    ctx.fillRect(layoutX(284), 0, layoutW(392), world.height);
    ctx.fillStyle = "#2b323d";
    ctx.fillRect(layoutX(284), 0, layoutW(24), world.height);
    ctx.fillRect(layoutX(652), 0, layoutW(24), world.height);
    ctx.fillStyle = "#f0c86b";
    ctx.fillRect(world.width / 2 - layoutW(3), 0, layoutW(6), world.height);
    for (let y = 0; y < world.height; y += layoutH(48)) {
      ctx.clearRect(world.width / 2 - layoutW(6), y + layoutH(14), layoutW(12), layoutH(24));
    }
    ctx.fillStyle = "#d6d6d6";
    for (let i = 0; i < Math.ceil(world.height / layoutH(72)); i += 1) {
      ctx.fillRect(layoutX(286), layoutY(90) + i * layoutH(72), layoutW(52), layoutH(8));
      ctx.fillRect(layoutX(624), layoutY(58) + i * layoutH(72), layoutW(52), layoutH(8));
    }
    ctx.fillStyle = "#050608";
    ctx.fillRect(layoutX(24), layoutY(24), layoutW(132), layoutH(552));
    ctx.fillRect(layoutX(802), layoutY(24), layoutW(132), layoutH(552));
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(layoutX(184), 0, layoutW(5), world.height);
    ctx.fillRect(layoutX(773), 0, layoutW(5), world.height);
    drawProceduralTerrainDetails();
  }

  for (const d of world.decals) {
    ctx.globalAlpha = d.alpha;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGroundEffects() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const glow of world.blastGlows) {
    const life = glow.life / glow.maxLife;
    const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
    gradient.addColorStop(0, glow.color.replace(/0?\.\d+\)$/u, `${0.45 * life})`));
    gradient.addColorStop(0.45, glow.color.replace(/0?\.\d+\)$/u, `${0.22 * life})`));
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(glow.x, glow.y, glow.radius, 0, TAU);
    ctx.fill();
  }
  for (const fire of world.fireZones) {
    const life = fire.life / fire.maxLife;
    const radius = fire.radius * (0.9 + Math.sin(fire.pulse) * 0.12);
    const gradient = ctx.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, radius * 2.2);
    gradient.addColorStop(0, `rgba(255, 196, 84, ${0.14 * life})`);
    gradient.addColorStop(0.5, `rgba(255, 112, 46, ${0.1 * life})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(fire.x, fire.y, radius * 2.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawDeathEffects() {
  for (const effect of world.deathEffects) {
    const life = effect.life / effect.maxLife;
    const progress = 1 - life;
    const sway = Math.sin(effect.pulse) * 0.04;
    ctx.save();
    ctx.translate(effect.x, effect.y);
    if (effect.variant === "animal") {
      ctx.rotate(effect.rotation + sway);
      assets.drawImage(ctx, effect.assetKey, 0, 0, effect.w * (1 - progress * 0.06), effect.h * (1 - progress * 0.12), {
        alpha: 0.9 * life,
      });
      ctx.globalCompositeOperation = "screen";
      const burn = ctx.createRadialGradient(0, 0, effect.w * 0.08, 0, 0, effect.w * 0.85);
      burn.addColorStop(0, `rgba(255, 232, 168, ${0.16 * life})`);
      burn.addColorStop(0.35, `rgba(255, 128, 52, ${0.14 * life})`);
      burn.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = burn;
      ctx.beginPath();
      ctx.arc(0, 0, effect.w * 0.85, 0, TAU);
      ctx.fill();
    } else if (effect.variant === "monster") {
      ctx.rotate(effect.rotation - sway * 1.4);
      assets.drawImage(ctx, effect.assetKey, 0, 0, effect.w, effect.h, {
        alpha: 0.82 * life,
      });
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(159, 247, 255, ${0.24 * life})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, effect.w * (0.24 + progress * 0.12), 0, TAU);
      ctx.stroke();
    } else {
      ctx.rotate(effect.rotation * (1 - progress * 0.18));
      ctx.scale(1 + progress * 0.22, 1 - progress * 0.14);
      assets.drawImage(ctx, effect.assetKey, 0, 0, effect.w, effect.h, {
        alpha: 0.88 * life,
      });
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = `rgba(24, 18, 18, ${0.1 + progress * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(0, effect.h * 0.16, effect.w * (0.24 + progress * 0.1), effect.h * (0.1 + progress * 0.05), 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawSolids() {
  for (const solid of world.destructibles) {
    if (solid.destroyed) continue;
    const flash = solid.flash > 0 ? 0.28 : 0;
    if (solid.assetKey && assets.drawImage(ctx, solid.assetKey, solid.x, solid.y, solid.w * 1.9, solid.h * 1.9, { alpha: flash > 0 ? 0.92 : 1 })) {
      const hp = solid.hp / solid.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(solid.x - solid.w / 2, solid.y + solid.h / 2 + 8, solid.w, 4);
      ctx.fillStyle = hp > 0.35 ? "#6cf28a" : "#ff9154";
      ctx.fillRect(solid.x - solid.w / 2, solid.y + solid.h / 2 + 8, solid.w * hp, 4);
      continue;
    }
    ctx.save();
    ctx.translate(solid.x, solid.y);
    if (solid.type === "barrel") {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.28 + flash})`;
      ctx.fillRect(-solid.w / 2 + 2, -solid.h / 2 + 5, solid.w - 4, solid.h - 3);
      ctx.fillStyle = flash > 0 ? "#ffd6bf" : solid.tint;
      ctx.fillRect(-solid.w / 2, -solid.h / 2, solid.w, solid.h);
      ctx.fillStyle = "#1c2026";
      ctx.fillRect(-solid.w / 2 + 4, -solid.h / 2 + 5, solid.w - 8, solid.h - 10);
      ctx.fillStyle = "#e7b54d";
      ctx.fillRect(-solid.w / 2 + 3, -4, solid.w - 6, 8);
    } else if (solid.type === "crate") {
      ctx.fillStyle = flash > 0 ? "#fff4db" : "#8b6842";
      ctx.fillRect(-solid.w / 2, -solid.h / 2, solid.w, solid.h);
      ctx.strokeStyle = "#603f21";
      ctx.lineWidth = 3;
      ctx.strokeRect(-solid.w / 2 + 2, -solid.h / 2 + 2, solid.w - 4, solid.h - 4);
      ctx.beginPath();
      ctx.moveTo(-solid.w / 2 + 5, -solid.h / 2 + 5);
      ctx.lineTo(solid.w / 2 - 5, solid.h / 2 - 5);
      ctx.moveTo(solid.w / 2 - 5, -solid.h / 2 + 5);
      ctx.lineTo(-solid.w / 2 + 5, solid.h / 2 - 5);
      ctx.stroke();
    } else if (solid.type === "barricade" || solid.type === "longcrate") {
      ctx.fillStyle = flash > 0 ? "#ffe1c2" : "#995d2d";
      ctx.fillRect(-solid.w / 2, -solid.h / 2, solid.w, solid.h);
      ctx.fillStyle = "#e4bf59";
      ctx.fillRect(-solid.w / 2 + 6, -solid.h / 2 + 5, solid.w - 12, 5);
      ctx.fillRect(-solid.w / 2 + 10, solid.h / 2 - 10, solid.w - 20, 4);
    } else {
      ctx.fillStyle = flash > 0 ? "#fff3d4" : "#4c5562";
      ctx.fillRect(-solid.w / 2, -solid.h / 2, solid.w, solid.h);
      ctx.fillStyle = "#f6bd4e";
      ctx.fillRect(-solid.w / 2 + 8, -solid.h / 2 + 8, solid.w - 16, 12);
      ctx.fillStyle = "#11151c";
      ctx.fillRect(-solid.w / 2 + 10, -solid.h / 2 + 26, solid.w - 20, solid.h - 36);
    }
    const hp = solid.hp / solid.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(-solid.w / 2, solid.h / 2 + 8, solid.w, 4);
    ctx.fillStyle = hp > 0.35 ? "#6cf28a" : "#ff9154";
    ctx.fillRect(-solid.w / 2, solid.h / 2 + 8, solid.w * hp, 4);
    ctx.restore();
  }
}

function drawPickups() {
  const pickupVisualScaleByType = {
    med: 3,
    armor: 3.05,
    speed: 3.08,
    rapid: 3.05,
    drone: 2.8,
  };

  for (const pickup of world.pickups) {
    const bob = Math.sin(pickup.pulse) * 3;
    const size = pickup.radius + 2.6 + Math.sin(pickup.pulse * 1.6) * 1.4;
    const isWeapon = pickup.type.startsWith("weapon-");
    const visualScale = isWeapon ? 2.9 : (pickupVisualScaleByType[pickup.type] || 3);
    const imageKey = pickup.type.startsWith("weapon-")
      ? `weapon_${pickup.type.replace("weapon-", "")}`
      : `pickup_${pickup.type}`;
    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    const shimmer = 0.5 + Math.sin(pickup.pulse * 2.1) * 0.22;
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, size + 18);
    halo.addColorStop(0, `rgba(255, 251, 214, ${0.4 * shimmer})`);
    halo.addColorStop(0.35, `rgba(255, 220, 117, ${0.24 * shimmer})`);
    halo.addColorStop(0.75, `rgba(255, 189, 64, ${0.12 * shimmer})`);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, size + 18, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 230, 144, ${0.42 + shimmer * 0.22})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size + 11, 0, TAU);
    ctx.stroke();
    if (assets.drawImage(ctx, imageKey, 0, 0, size * visualScale, size * visualScale)) {
      ctx.restore();
      continue;
    }
    const glow = { med: "#ff5b5b", rapid: "#ff9d43", speed: "#8af2ff", armor: "#7cff93", drone: "#ff5cf4" };
    ctx.fillStyle = isWeapon ? "rgba(134, 247, 255, 0.22)" : `${glow[pickup.type]}33`;
    ctx.beginPath();
    ctx.arc(0, 0, size + 8, 0, TAU);
    ctx.fill();
    if (isWeapon) {
      const weaponId = pickup.type.replace("weapon-", "");
      ctx.strokeStyle = "#dffcff";
      ctx.lineWidth = 2.5;
      if (weaponId === "smg") {
        ctx.strokeRect(-11, -3, 18, 6);
        ctx.fillStyle = "#7ef6ff";
        ctx.fillRect(6, -2, 7, 4);
        ctx.fillRect(-4, 3, 5, 8);
      } else if (weaponId === "shotgun") {
        ctx.fillStyle = "#c8b087";
        ctx.fillRect(-12, -3, 19, 6);
        ctx.fillStyle = "#8c5b32";
        ctx.fillRect(3, -2, 10, 4);
        ctx.fillRect(-6, 3, 4, 7);
      } else {
        ctx.fillStyle = "#86f7ff";
        ctx.fillRect(-13, -2, 24, 4);
        ctx.fillRect(-3, -6, 8, 12);
        ctx.fillStyle = "#effaff";
        ctx.beginPath();
        ctx.arc(12, 0, 4, 0, TAU);
        ctx.fill();
      }
    } else if (pickup.type === "drone") {
      ctx.strokeStyle = "#ffd2fd";
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -9, 24, 18);
      ctx.fillStyle = "#ff5cf4";
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#9ff7ff";
      ctx.fillRect(-14, -2, 7, 4);
      ctx.fillRect(7, -2, 7, 4);
      ctx.fillRect(-2, -14, 4, 7);
      ctx.fillRect(-2, 7, 4, 7);
    } else if (pickup.type === "med") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-11, -9, 22, 18);
      ctx.fillStyle = "#ff5656";
      ctx.fillRect(-11, -3, 22, 6);
      ctx.fillRect(-3, -11, 6, 22);
    } else if (pickup.type === "rapid") {
      ctx.fillStyle = "#f0b85e";
      ctx.fillRect(-10, -12, 11, 24);
      ctx.fillStyle = "#3b2c1d";
      ctx.fillRect(-7, -10, 5, 20);
      ctx.fillStyle = "#ffe7a2";
      ctx.beginPath();
      ctx.arc(2, -7, 6, 0, TAU);
      ctx.fill();
    } else if (pickup.type === "speed") {
      ctx.fillStyle = "#8af2ff";
      ctx.beginPath();
      ctx.moveTo(-12, 8);
      ctx.lineTo(-2, -8);
      ctx.lineTo(2, -1);
      ctx.lineTo(10, -11);
      ctx.lineTo(3, 9);
      ctx.lineTo(-1, 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#7cff93";
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(11, -7);
      ctx.lineTo(8, 10);
      ctx.lineTo(0, 14);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-11, -7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#173523";
      ctx.fillRect(-2, -5, 4, 12);
    }
    ctx.restore();
  }
}

function drawShot(shot) {
  const angle = Math.atan2(shot.vy, shot.vx);
  const life = shot.maxLife ? clamp(shot.life / shot.maxLife, 0, 1) : 1;
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "screen";
  if (shot.style === "bullet") {
    ctx.strokeStyle = `rgba(255, 183, 92, ${0.24 + life * 0.34})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 239, 192, ${0.38 + life * 0.42})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
    ctx.fillStyle = "#d4a04b";
    ctx.fillRect(-5, -2.5, 10, 5);
    ctx.fillStyle = "#f6e2a7";
    ctx.beginPath();
    ctx.ellipse(6, 0, 5.5, 3.2, 0, 0, TAU);
    ctx.fill();
  } else if (shot.style === "needle") {
    ctx.strokeStyle = `rgba(255, 159, 74, ${0.26 + life * 0.38})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(7, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 242, 202, ${0.4 + life * 0.4})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    ctx.fillStyle = "#ffbf68";
    ctx.fillRect(2, -0.8, 6, 1.6);
    ctx.fillStyle = "#fff1cf";
    ctx.fillRect(6, -0.55, 3, 1.1);
  } else if (shot.style === "shell") {
    ctx.strokeStyle = `rgba(255, 167, 82, ${0.26 + life * 0.32})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-19, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 241, 212, ${0.34 + life * 0.34})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
    ctx.fillStyle = "#ffd89b";
    ctx.beginPath();
    ctx.arc(2, 0, 2.7, 0, TAU);
    ctx.fill();
  } else if (shot.style === "plasmaOrb" || shot.style === "rail") {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
    glow.addColorStop(0, `rgba(240, 252, 255, ${0.82 + life * 0.1})`);
    glow.addColorStop(0.28, `rgba(132, 240, 255, ${0.55 + life * 0.16})`);
    glow.addColorStop(0.62, `rgba(76, 214, 255, ${0.18 + life * 0.1})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(88, 228, 255, ${0.18 + life * 0.12})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-2, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(220, 251, 255, ${0.38 + life * 0.2})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-1, 0);
    ctx.stroke();
    ctx.fillStyle = "#79efff";
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#effcff";
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, TAU);
    ctx.fill();
  } else if (shot.style === "cannon") {
    ctx.strokeStyle = `rgba(110, 199, 255, ${0.2 + life * 0.18})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();
    ctx.fillStyle = "#4a5a6d";
    ctx.fillRect(-4.5, -2.8, 9, 5.6);
    ctx.fillStyle = "#dbeaf6";
    ctx.beginPath();
    ctx.arc(5.2, 0, 2.6, 0, TAU);
    ctx.fill();
  } else if (shot.style === "rocket") {
    const exhaust = ctx.createRadialGradient(-8, 0, 0, -8, 0, 8);
    exhaust.addColorStop(0, `rgba(212, 255, 126, ${0.4 + life * 0.22})`);
    exhaust.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = exhaust;
    ctx.beginPath();
    ctx.arc(-8, 0, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#2e4021";
    ctx.beginPath();
    ctx.moveTo(-6, -2.6);
    ctx.lineTo(3, -2.4);
    ctx.lineTo(8, 0);
    ctx.lineTo(3, 2.4);
    ctx.lineTo(-6, 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b9ff6a";
    ctx.beginPath();
    ctx.arc(1, 0, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#efffcf";
    ctx.beginPath();
    ctx.arc(2.4, 0, 1.4, 0, TAU);
    ctx.fill();
  } else if (shot.style === "acid") {
    ctx.fillStyle = shot.color;
    ctx.beginPath();
    ctx.arc(0, 0, shot.radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.beginPath();
    ctx.arc(-2, -2, shot.radius * 0.35, 0, TAU);
    ctx.fill();
  } else {
    ctx.strokeStyle = "rgba(120, 205, 255, 0.34)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = shot.color;
    ctx.fillRect(-2, -2, 8, 4);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawObjectDebris() {
  for (const debris of world.objectDebris) {
    const alpha = debris.life / debris.maxLife;
    ctx.save();
    ctx.translate(debris.x, debris.y);
    ctx.rotate(debris.rotation);
    ctx.globalAlpha = alpha;
    if (debris.useImage && debris.assetKey) {
      const image = assets.getImage(debris.assetKey);
      if (image) {
        ctx.drawImage(
          image,
          debris.sx,
          debris.sy,
          debris.sw,
          debris.sh,
          -debris.drawW / 2,
          -debris.drawH / 2,
          debris.drawW,
          debris.drawH,
        );
        ctx.restore();
        continue;
      }
    }
    ctx.fillStyle = debris.color;
    ctx.fillRect(-debris.w / 2, -debris.h / 2, debris.w, debris.h);
    ctx.restore();
  }
}

function drawWeaponPickupPrompt() {
  const pickup = world.weaponPickupPromptTarget;
  if (!pickup) return;

  const uiScale = world.canvasUiScale || 1;
  const text = t("pickup.holdToEquipWeapon");
  const x = pickup.x;
  const y = pickup.y - 44;
  const fontSize = Math.max(10, 13 * uiScale);
  const paddingX = 10 * uiScale;
  const h = 28 * uiScale;

  ctx.save();
  ctx.font = `${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = Math.max(142 * uiScale, ctx.measureText(text).width + paddingX * 2);

  roundedRect(x - w / 2, y - h / 2, w, h, 8 * uiScale);
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 211, 106, 0.48)";
  ctx.lineWidth = Math.max(1, uiScale);
  ctx.stroke();

  ctx.fillStyle = "#ffd36a";
  ctx.fillText(text, x, y - 2 * uiScale);

  const progress = clamp(world.weaponPickupHoldProgress || 0, 0, 1);
  const lineWidth = w - paddingX * 2;
  ctx.fillStyle = "rgba(255, 211, 106, 0.24)";
  ctx.fillRect(x - lineWidth / 2, y + h / 2 - 6 * uiScale, lineWidth, 2 * uiScale);
  ctx.fillStyle = "rgba(255, 211, 106, 0.86)";
  ctx.fillRect(x - lineWidth / 2, y + h / 2 - 6 * uiScale, lineWidth * progress, 2 * uiScale);

  ctx.restore();
}

function drawParticles() {
  for (const flash of world.muzzleFlashes) {
    const life = flash.life / flash.maxLife;
    ctx.save();
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.angle);
    ctx.globalCompositeOperation = "screen";
    const glowRadius = (flash.glow || flash.size * 1.4) * (0.9 + (1 - life) * 0.3);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    glow.addColorStop(0, flash.coreColor);
    glow.addColorStop(0.18, flash.bloomColor);
    glow.addColorStop(0.38, flash.bloomColor);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = life;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, TAU);
    ctx.fill();
    if (flash.shape === "plasma") {
      ctx.globalAlpha = life * (flash.additive || 0.36);
      ctx.fillStyle = flash.bloomColor;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.18, 0, flash.size * 0.85, flash.size * 0.34, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = life * 0.24;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.32, 0, flash.size * 1.08, flash.size * 0.52, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = life * 0.72;
      ctx.fillStyle = flash.coreColor;
      ctx.beginPath();
      ctx.arc(flash.size * 0.24, 0, flash.size * 0.22, 0, TAU);
      ctx.fill();
    } else if (flash.shape === "burst") {
      ctx.globalAlpha = life * (flash.additive || 0.32);
      ctx.fillStyle = flash.bloomColor;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.18, 0, flash.size * 0.72, flash.size * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = life * 0.22;
      ctx.beginPath();
      ctx.ellipse(0, 0, flash.size * 0.95, flash.size * 0.7, 0, 0, TAU);
      ctx.fill();
    } else if (flash.shape === "compact_streak") {
      ctx.globalAlpha = life * (flash.additive || 0.32);
      ctx.fillStyle = flash.bloomColor;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.18, 0, flash.size * 0.58, flash.size * 0.24, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = life * 0.7;
      ctx.fillStyle = flash.coreColor;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.28, 0, flash.size * 0.36, flash.size * 0.12, 0, 0, TAU);
      ctx.fill();
    } else if (flash.shape === "shotgun_burst") {
      ctx.globalAlpha = life * (flash.additive || 0.48);
      ctx.fillStyle = flash.bloomColor;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(flash.size * 0.95, -flash.size * 0.34);
      ctx.quadraticCurveTo(flash.size * 0.55, 0, flash.size * 0.95, flash.size * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = life * 0.38;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.32, 0, flash.size * 0.72, flash.size * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = life * 0.75;
      ctx.fillStyle = flash.coreColor;
      ctx.beginPath();
      ctx.ellipse(flash.size * 0.22, 0, flash.size * 0.42, flash.size * 0.18, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.globalAlpha = life * (flash.additive || 0.3);
      ctx.fillStyle = flash.bloomColor;
      ctx.fillRect(-10, -flash.size * 0.5, flash.size + 24, flash.size);
    }
    ctx.globalAlpha = life * 0.5;
    ctx.fillStyle = flash.coreColor;
    ctx.beginPath();
    ctx.ellipse(flash.size * 0.14, 0, flash.size * 0.8, flash.size * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = life;
    ctx.fillStyle = flash.bloomColor;
    for (let i = 0; i < flash.rays; i += 1) {
      const offset = (-flash.rays / 2 + i) * flash.width * 0.7;
      const raySize = flash.size * (1 - Math.abs(offset) * 0.25);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(raySize, -raySize * (flash.width + offset * 0.2));
      ctx.lineTo(raySize * 0.52, 0);
      ctx.lineTo(raySize, raySize * (flash.width + offset * 0.2));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = flash.coreColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(flash.size * 0.72, -flash.size * flash.width * 0.48);
    ctx.lineTo(flash.size * 0.42, 0);
    ctx.lineTo(flash.size * 0.72, flash.size * flash.width * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash.coreColor;
    ctx.beginPath();
    ctx.arc(flash.size * 0.18, 0, 3 + (1 - life) * 2, 0, TAU);
    ctx.fill();
    if (flash.weaponId === "shotgun" || flash.weaponId === "rail") {
      if (flash.weaponId === "shotgun") {
        ctx.strokeStyle = "rgba(255, 226, 173, 0.9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(flash.size + 18, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(172, 243, 255, 0.68)";
        ctx.beginPath();
        ctx.arc(flash.size * 0.28, 0, 6 + (1 - life) * 2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(224, 252, 255, 0.72)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(flash.size * 0.12, 0);
        ctx.lineTo(flash.size * 0.78, 0);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  for (const shot of world.bullets) drawShot(shot);
  for (const shot of world.enemyShots) drawShot(shot);
  drawObjectDebris();
  for (const gib of world.gibs) {
    const alpha = gib.life / gib.maxLife;
    ctx.save();
    ctx.translate(gib.x, gib.y);
    ctx.rotate(gib.rotation);
    ctx.globalAlpha = alpha;
    if (gib.useImage) {
      const image = assets.getImage(gib.spriteKey) || (gib.spriteKey?.startsWith("boss_") ? assets.getImage("boss") : null);
      if (image) {
        ctx.drawImage(
          image,
          gib.sx,
          gib.sy,
          gib.sw,
          gib.sh,
          -gib.drawW / 2,
          -gib.drawH / 2,
          gib.drawW,
          gib.drawH,
        );
      } else {
        ctx.fillStyle = gib.flesh;
        ctx.fillRect(-gib.size * 0.5, -gib.size * 0.35, gib.size, gib.size * 0.7);
        ctx.fillStyle = gib.color;
        ctx.fillRect(-gib.size * 0.2, -gib.size * 0.22, gib.size * 0.7, gib.size * 0.44);
      }
    } else {
      ctx.fillStyle = gib.flesh;
      ctx.fillRect(-gib.size * 0.5, -gib.size * 0.35, gib.size, gib.size * 0.7);
      ctx.fillStyle = gib.color;
      ctx.fillRect(-gib.size * 0.2, -gib.size * 0.22, gib.size * 0.7, gib.size * 0.44);
    }
    ctx.restore();
  }
  for (const p of world.particles) {
    const progress = p.maxLife ? 1 - p.life / p.maxLife : 0;
    const size = p.size + (p.sizeEnd - p.size) * progress;
    ctx.globalAlpha = Math.max(0, (p.alpha ?? 1) * (1 - progress));
    ctx.fillStyle = p.color;
    if (p.type === "blood") {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, size * 0.8, size * 0.55, 0.3, 0, TAU);
      ctx.fill();
    } else if (p.type === "oil") {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, size * 0.85, size * 0.58, 0.22, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(196, 228, 255, 0.18)";
      ctx.beginPath();
      ctx.arc(p.x - size * 0.18, p.y - size * 0.12, Math.max(1, size * 0.16), 0, TAU);
      ctx.fill();
    } else if (p.type === "smoke") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, TAU);
      ctx.fill();
    } else if (p.type === "ring") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.lineWidth || 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, TAU);
      ctx.stroke();
    } else if (p.type === "shockwave") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = (p.lineWidth || 8) * (1 - progress * 0.35);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, TAU);
      ctx.stroke();
    } else if (p.type === "spark") {
      const angle = Math.atan2(p.vy, p.vx);
      const length = size;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.4, size * 0.18);
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(angle) * length * 0.5, p.y - Math.sin(angle) * length * 0.5);
      ctx.lineTo(p.x + Math.cos(angle) * length, p.y + Math.sin(angle) * length);
      ctx.stroke();
    } else if (p.type === "flare" || p.type === "ember") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, size * (p.type === "flare" ? 0.78 : 0.55)), 0, TAU);
      ctx.fill();
    } else if (p.type === "debris") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.fillRect(-size * 0.5, -size * (p.stretch || 0.45), size, size * ((p.stretch || 0.45) * 2));
      ctx.restore();
    } else {
      ctx.fillRect(p.x, p.y, size, size);
    }
  }
  ctx.globalAlpha = 1;
}

function drawFoe(foe) {
  const lookLeft = typeof foe.facingLeft === "boolean" ? foe.facingLeft : player.x < foe.x;
  const meta = enemySpritesheetMeta[foe.kind];
  const sheetKey = foe.kind === "animal" ? "enemy_animal_sheet" : null;
  const sheet = sheetKey ? assets.getImage(sheetKey) : null;
  if (sheet && meta && !foe.boss) {
    const state = enemyAnimationState(foe, Boolean(foe.isMoving));
    const frame = enemyFrameFor(foe, meta, state);
    if (frame) {
      ctx.save();
      ctx.translate(foe.x, foe.y);
      if (lookLeft) ctx.scale(-1, 1);
      if (foe.hitFlash > 0) {
        ctx.globalAlpha = 0.95;
        ctx.filter = "brightness(1.4)";
      }
      ctx.drawImage(
        sheet,
        frame.sx,
        frame.sy,
        frame.sw,
        frame.sh,
        -foe.radius * 1.6,
        -foe.radius * 1.6,
        foe.radius * 3.2,
        foe.radius * 3.2,
      );
      ctx.restore();
      return;
    }
  }

  const spriteKey = foe.boss ? `boss_${foe.bossId}` : `enemy_${foe.kind}`;
  const enemySpriteScale = {
    animal: 2.95,
    monster: 3.15,
    criminal: 3.35,
  };
  const spriteScale = foe.boss ? 3.4 : (enemySpriteScale[foe.kind] || 2.95);
  const sprite = assets.getImage(spriteKey) || (foe.boss ? assets.getImage("boss") : null);
  if (sprite) {
    const drawSize = foe.radius * spriteScale;
    ctx.save();
    ctx.translate(foe.x, foe.y);
    if (lookLeft) ctx.scale(-1, 1);
    if (foe.hitFlash > 0) {
      ctx.globalAlpha = 0.95;
      ctx.filter = "brightness(1.35)";
    }
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
    if (foe.boss) {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(foe.x - 40, foe.y + foe.radius + 12, 80, 6);
      ctx.fillStyle = "#ff4f6d";
      ctx.fillRect(foe.x - 40, foe.y + foe.radius + 12, 80 * (foe.hp / foe.maxHp), 6);
    }
    return;
  }
  ctx.save();
  ctx.translate(foe.x, foe.y);
  if (lookLeft) ctx.scale(-1, 1);
  if (foe.boss) {
    ctx.fillStyle = `${foe.color}2a`;
    ctx.beginPath();
    ctx.arc(0, 0, foe.radius + 15 + Math.sin(foe.pulse) * 2, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = foe.hitFlash > 0 ? "#ffffff" : (foe.flesh || foe.color);
  if (foe.kind === "animal") {
    ctx.beginPath();
    ctx.ellipse(0, 0, foe.radius + 4, foe.radius - 3, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(foe.radius - 2, 0);
    ctx.lineTo(foe.radius + 12, -6);
    ctx.lineTo(foe.radius + 12, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = foe.color;
    ctx.beginPath();
    ctx.arc(foe.radius + 2, -5, 3.3, 0, TAU);
    ctx.arc(foe.radius + 2, 5, 3.3, 0, TAU);
    ctx.fill();
  } else if (foe.kind === "monster") {
    ctx.beginPath();
    ctx.arc(0, 0, foe.radius + 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = foe.color;
    ctx.beginPath();
    ctx.arc(-7, -4, 5, 0, TAU);
    ctx.arc(7, -4, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#1a2412";
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.lineTo(0, 16);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-foe.radius + 2, -foe.radius + 2, foe.radius * 2 - 4, foe.radius * 2 - 4);
    ctx.fillStyle = "#1b2028";
    ctx.fillRect(-foe.radius + 6, -foe.radius + 6, foe.radius * 2 - 12, 12);
    ctx.fillStyle = foe.color;
    ctx.fillRect(-foe.radius + 3, foe.radius - 11, foe.radius * 2 - 6, 8);
    ctx.fillStyle = "#dbe7f2";
    ctx.fillRect(foe.radius - 2, -4, 14, 4);
  }
  if (foe.boss) {
    const hp = foe.hp / foe.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(-40, foe.radius + 12, 80, 6);
    ctx.fillStyle = "#ff4f6d";
    ctx.fillRect(-40, foe.radius + 12, 80 * hp, 6);
  }
  ctx.restore();
}

function drawFoes() {
  for (const foe of world.foes) drawFoe(foe);
}

function drawHunterDrone() {
  const drones = Array.isArray(world.hunterDrones) ? world.hunterDrones : [];
  if (!drones.length) return;

  for (const drone of drones) {
    if (drone.target && drone.beamAlpha > 0) {
      const dx = drone.target.x - drone.x;
      const dy = drone.target.y - drone.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const px = -ny;
      const py = nx;
      const jitter = drone.beamJitter || 0;
      const midX = (drone.x + drone.target.x) * 0.5 + px * Math.sin(drone.pulse * 0.7) * jitter;
      const midY = (drone.y + drone.target.y) * 0.5 + py * Math.cos(drone.pulse * 0.8) * jitter;
      const midX2 = (drone.x + drone.target.x) * 0.5 - px * Math.cos(drone.pulse * 1.1) * jitter * 0.7;
      const midY2 = (drone.y + drone.target.y) * 0.5 - py * Math.sin(drone.pulse * 0.95) * jitter * 0.7;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(255, 92, 244, ${0.2 * drone.beamAlpha})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(drone.x, drone.y);
      ctx.quadraticCurveTo(midX, midY, drone.target.x, drone.target.y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(128, 255, 244, ${0.34 * drone.beamAlpha})`;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(drone.x, drone.y);
      ctx.quadraticCurveTo(midX2, midY2, drone.target.x, drone.target.y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(236, 252, 255, ${0.95 * drone.beamAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drone.x, drone.y);
      ctx.quadraticCurveTo((midX + midX2) / 2, (midY + midY2) / 2, drone.target.x, drone.target.y);
      ctx.stroke();
      const impactRadius = 9 + Math.sin(drone.pulse * 1.6) * 1.4;
      const impactGradient = ctx.createRadialGradient(drone.target.x, drone.target.y, 0, drone.target.x, drone.target.y, impactRadius * 2.05);
      impactGradient.addColorStop(0, `rgba(236, 252, 255, ${0.74 * drone.beamAlpha})`);
      impactGradient.addColorStop(0.35, `rgba(159, 247, 255, ${0.34 * drone.beamAlpha})`);
      impactGradient.addColorStop(0.8, `rgba(255, 92, 244, ${0.12 * drone.beamAlpha})`);
      impactGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = impactGradient;
      ctx.beginPath();
      ctx.arc(drone.target.x, drone.target.y, impactRadius * 2.05, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(236, 252, 255, ${0.42 * drone.beamAlpha})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(drone.target.x, drone.target.y, impactRadius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const drone of drones) {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(drone.tilt || Math.sin(drone.pulse * 0.5) * 0.08);
    const engineGlow = 4 + drone.enginePulse * 2.4;
    for (const side of [-1, 1]) {
      const gradient = ctx.createRadialGradient(side * 9, 11, 0, side * 9, 11, engineGlow * 1.45);
      gradient.addColorStop(0, "rgba(236, 252, 255, 0.5)");
      gradient.addColorStop(0.35, `rgba(159, 247, 255, ${0.24 + drone.enginePulse * 0.12})`);
      gradient.addColorStop(0.75, `rgba(255, 92, 244, ${0.08 + drone.enginePulse * 0.08})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(side * 9, 11 + drone.enginePulse * 2.5, engineGlow * 0.55, engineGlow * 0.9, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(2, 6, 12, 0.42)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 17, 12, 0, 0, TAU);
    ctx.fill();
    const droneSize = 36;
    const drewSprite = assets.drawImage(ctx, "ally_drone", 0, 0, droneSize, droneSize, { alpha: 1 });
    if (!drewSprite) {
      ctx.fillStyle = "rgba(255, 92, 244, 0.16)";
      ctx.beginPath();
      ctx.arc(0, 0, 15 + Math.sin(drone.pulse) * 1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#151a24";
      ctx.fillRect(-10.5, -7.5, 21, 15);
      ctx.strokeStyle = "rgba(236, 252, 255, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-10.5, -7.5, 21, 15);
      ctx.fillStyle = "#ff5cf4";
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#9ff7ff";
      ctx.fillRect(-15, -1.8, 7, 3.6);
      ctx.fillRect(8, -1.8, 7, 3.6);
      ctx.fillRect(-1.8, -14, 3.6, 7);
      ctx.fillRect(-1.8, 7, 3.6, 7);
    }
    ctx.restore();
  }
}

function drawArmorField() {
  const radius = player.radius + 16 + Math.sin(world.lastTime * 0.01) * 2;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius * 1.8);
  glow.addColorStop(0, `rgba(117, 234, 255, ${0.04 + player.armorFlash * 0.18})`);
  glow.addColorStop(0.55, `rgba(88, 208, 255, ${0.08 + player.armorFlash * 0.22})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.8, 0, TAU);
  ctx.fill();
  for (let ring = 0; ring < 2; ring += 1) {
    const r = radius + ring * 8;
    ctx.strokeStyle = `rgba(122, 231, 255, ${0.24 + player.armorFlash * 0.32})`;
    ctx.lineWidth = 2.2 - ring * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = world.lastTime * 0.0011 + ring * 0.24 + TAU / 6 * i;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  for (let i = 0; i < 6; i += 1) {
    const a = world.lastTime * 0.0015 + TAU / 6 * i;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    ctx.strokeStyle = `rgba(196, 248, 255, ${0.18 + player.armorFlash * 0.22})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x * 0.72, y * 0.72);
    ctx.lineTo(x * 1.08, y * 1.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, TAU);
    ctx.fillStyle = `rgba(196, 248, 255, ${0.45 + player.armorFlash * 0.25})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer() {
  if (world.buffs.armor > 0) {
    drawArmorField();
  }
  if (world.buffs.speed > 0) {
    ctx.strokeStyle = "rgba(138, 242, 255, 0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x - 10, player.y, player.radius + 4, 1.1, 5.1);
    ctx.stroke();
  }

  const sheet = assets.getImage("player_sheet");
  const blinkAlpha = player.invulnTimer > 0 && Math.sin(world.lastTime * 0.055) > 0 ? 0.38 : 1;
  if (sheet) {
    const state = playerAnimationState(moveVector().active || player.dashDuration > 0);
    const frame = playerFrameFor(state);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.globalAlpha = blinkAlpha;
    if (player.hitFlash > 0) {
      ctx.globalAlpha *= 0.92;
      ctx.filter = "brightness(1.45)";
    }
    ctx.drawImage(
      sheet,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      -34,
      -34,
      68,
      68,
    );
    ctx.restore();
    return;
  }

  const playerImage = assets.getImage("player");
  if (playerImage) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.globalAlpha = blinkAlpha;
    if (player.hitFlash > 0) ctx.filter = "brightness(1.45)";
    ctx.drawImage(playerImage, -34, -34, 68, 68);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.globalAlpha = blinkAlpha;
  ctx.fillStyle = player.hitFlash > 0 ? "#ffffff" : "#0f1116";
  ctx.beginPath();
  ctx.ellipse(-4, 0, 10, 12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#e5c29b";
  ctx.beginPath();
  ctx.arc(7, 0, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#2d3138";
  ctx.fillRect(-15, -10, 20, 20);
  ctx.fillStyle = "#4f5f72";
  ctx.fillRect(-14, -7, 18, 14);
  ctx.fillStyle = "#11151a";
  ctx.fillRect(-11, -18, 10, 8);
  ctx.strokeStyle = "#c5a27e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-20, -14);
  ctx.moveTo(-6, 4);
  ctx.lineTo(-20, 14);
  ctx.moveTo(-12, -5);
  ctx.lineTo(-18, -18);
  ctx.moveTo(-12, 5);
  ctx.lineTo(-18, 18);
  ctx.stroke();
  ctx.fillStyle = "#202833";
  ctx.fillRect(2, -3, 26, 6);
  ctx.fillStyle = "#4e5d70";
  ctx.fillRect(12, -5, 12, 10);
  ctx.fillStyle = "#d49b56";
  ctx.fillRect(25, -2, 7, 4);
  ctx.restore();
}

function drawRadar() {
  const uiScale = world.canvasUiScale || 1;
  const radius = 76 * uiScale;
  const margin = 32 * uiScale;
  const radarX = canvas.width - radius - margin;
  const radarY = canvas.height - radius - margin - 12 * uiScale;
  const sweep = world.radar.ping * TAU;
  const shouldShowThreat = world.currentWave && world.state === "playing";
  const enemiesRemaining = shouldShowThreat
    ? Math.max(0, world.currentWave.regularTotal - world.currentWave.regularSpawned + world.foes.length)
    : world.foes.length;
  const threatLabel = t("canvas.enemiesRemaining", { count: enemiesRemaining });
  const threatPanelHeight = 24 * uiScale;
  const threatLabelY = radarY - radius - 14 * uiScale;

  if (shouldShowThreat) {
    ctx.save();
    ctx.font = `${Math.max(9, 11 * uiScale)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const threatPanelWidth = Math.max(146 * uiScale, ctx.measureText(threatLabel).width + 24 * uiScale);
    roundedRect(
      radarX - threatPanelWidth / 2,
      threatLabelY - threatPanelHeight / 2,
      threatPanelWidth,
      threatPanelHeight,
      12 * uiScale,
    );
    ctx.fillStyle = "rgba(5, 10, 16, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(112, 255, 179, 0.26)";
    ctx.lineWidth = Math.max(1, uiScale);
    ctx.stroke();
    ctx.fillStyle = "#dfffea";
    ctx.fillText(threatLabel, radarX, threatLabelY + 0.5 * uiScale);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(radarX, radarY);
  ctx.fillStyle = "rgba(8, 20, 14, 0.82)";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();

  const bg = ctx.createRadialGradient(0, 0, 10 * uiScale, 0, 0, radius);
  bg.addColorStop(0, "rgba(46, 255, 167, 0.18)");
  bg.addColorStop(1, "rgba(20, 50, 36, 0.04)");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(112, 255, 179, 0.28)";
  ctx.lineWidth = Math.max(1, uiScale);
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * ring / 3.2, 0, TAU);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-radius + 8 * uiScale, 0);
  ctx.lineTo(radius - 8 * uiScale, 0);
  ctx.moveTo(0, -radius + 8 * uiScale);
  ctx.lineTo(0, radius - 8 * uiScale);
  ctx.stroke();

  const sweepGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  sweepGradient.addColorStop(0, "rgba(123, 255, 185, 0.22)");
  sweepGradient.addColorStop(1, "rgba(123, 255, 185, 0)");
  ctx.fillStyle = sweepGradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius - 2, sweep - 0.35, sweep + 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(154, 255, 199, 0.85)";
  ctx.lineWidth = Math.max(1.5, 2 * uiScale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(sweep) * (radius - 4), Math.sin(sweep) * (radius - 4));
  ctx.stroke();

  for (const foe of world.foes) {
    const dx = foe.x - player.x;
    const dy = foe.y - player.y;
    const range = Math.hypot(dx, dy);
    if (range > RADAR_ENEMY_RANGE) continue;
    const scale = radius / RADAR_ENEMY_RANGE;
    const px = dx * scale;
    const py = dy * scale;
    ctx.fillStyle = foe.boss ? "#ff5d87" : "#7bffac";
    ctx.beginPath();
    ctx.arc(px, py, (foe.boss ? 4 : 2.5) * uiScale, 0, TAU);
    ctx.fill();
  }

  for (const pickup of world.pickups.filter((entry) => entry.type.startsWith("weapon-"))) {
    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const range = Math.hypot(dx, dy);
    if (range > world.radar.range) continue;
    const scale = radius / world.radar.range;
    const px = dx * scale;
    const py = dy * scale;
    ctx.fillStyle = "#86f7ff";
    ctx.beginPath();
    ctx.arc(px, py, 3 * uiScale, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(168, 255, 200, 0.78)";
  ctx.font = `${Math.max(8, 9 * uiScale)}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(t("canvas.motionTracker"), 0, radius + 16 * uiScale);
  ctx.restore();
}

function drawUi() {
  const uiScale = world.canvasUiScale || 1;
  const screenPointer = world.pointerScreen;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(1, 1.5 * uiScale);
  const crosshairSize = 12 * (world.isGameFullscreen ? 0.84 : 1);
  ctx.beginPath();
  ctx.moveTo(screenPointer.x - crosshairSize, screenPointer.y);
  ctx.lineTo(screenPointer.x + crosshairSize, screenPointer.y);
  ctx.moveTo(screenPointer.x, screenPointer.y - crosshairSize);
  ctx.lineTo(screenPointer.x, screenPointer.y + crosshairSize);
  ctx.stroke();
  drawRadar();
}

function drawBanner() {
  if (!world.banner) return;
  const life = world.banner.timer / world.banner.total;
  const alpha = Math.min(1, 1.4 - life);
  const pulse = 1 + Math.sin(world.lastTime * 0.01) * 0.02;
  const bannerScale = world.waveBannerScale || 1;
  const y = world.isGameFullscreen ? canvas.height * 0.3 : 96;
  ctx.save();
  ctx.translate(canvas.width / 2, y);
  ctx.scale(pulse, pulse);
  ctx.globalAlpha = alpha;
  const width = 560 * bannerScale;
  const g = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  g.addColorStop(0, "rgba(10, 12, 18, 0)");
  g.addColorStop(0.18, "rgba(10, 12, 18, 0.72)");
  g.addColorStop(0.5, "rgba(10, 12, 18, 0.92)");
  g.addColorStop(0.82, "rgba(10, 12, 18, 0.72)");
  g.addColorStop(1, "rgba(10, 12, 18, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(-width / 2, -48 * bannerScale, width, 90 * bannerScale);
  ctx.fillStyle = world.banner.accent;
  ctx.fillRect(-width / 2 + 28 * bannerScale, -38 * bannerScale, width - 56 * bannerScale, 3 * bannerScale);
  ctx.fillRect(-width / 2 + 28 * bannerScale, 28 * bannerScale, width - 56 * bannerScale, 3 * bannerScale);
  ctx.textAlign = "center";
  ctx.font = `${30 * bannerScale}px "Russo One", sans-serif`;
  ctx.shadowColor = world.banner.accent;
  ctx.shadowBlur = 24 * bannerScale;
  ctx.fillStyle = "#fef8ee";
  ctx.fillText(world.banner.title, 0, -4 * bannerScale);
  ctx.font = `${15 * bannerScale}px "Space Grotesk", sans-serif`;
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#c7cfdb";
  ctx.fillText(world.banner.subtitle, 0, 22 * bannerScale);
  ctx.restore();
}

function drawSynergyToast() {
  if (!world.synergyToast) return;
  const life = world.synergyToast.timer / world.synergyToast.total;
  const fadeIn = Math.min(1, (1 - life) / 0.18);
  const fadeOut = Math.min(1, life / 0.24);
  const alpha = Math.min(fadeIn, fadeOut);
  const uiScale = world.canvasUiScale || 1;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.34);
  ctx.globalAlpha = alpha;
  const width = 360 * uiScale;
  const height = 82 * uiScale;
  const accent = world.synergyToast.accent || "#9fe7ff";
  const glow = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  glow.addColorStop(0, "rgba(8, 12, 18, 0.1)");
  glow.addColorStop(0.5, "rgba(8, 12, 18, 0.92)");
  glow.addColorStop(1, "rgba(8, 12, 18, 0.1)");
  ctx.fillStyle = glow;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.fillStyle = accent;
  ctx.fillRect(-width / 2 + 24 * uiScale, -height / 2 + 10 * uiScale, width - 48 * uiScale, 3 * uiScale);
  ctx.textAlign = "center";
  ctx.font = `${13 * uiScale}px "Space Grotesk", sans-serif`;
  ctx.fillStyle = "rgba(201, 224, 241, 0.9)";
  ctx.fillText(world.synergyToast.subtitle, 0, -8 * uiScale);
  ctx.font = `${26 * uiScale}px "Russo One", sans-serif`;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18 * uiScale;
  ctx.fillStyle = "#f4fbff";
  ctx.fillText(world.synergyToast.title, 0, 24 * uiScale);
  ctx.restore();
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(world.shakeX, world.shakeY);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(world.shakeRot);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.translate(-world.camera.x, -world.camera.y);
  drawTerrain();
  drawGroundEffects();
  drawDeathEffects();
  drawSolids();
  drawPickups();
  drawWeaponPickupPrompt();
  drawParticles();
  drawFoes();
  drawHunterDrone();
  drawPlayer();
  ctx.restore();
  drawUi();
  drawBanner();
  drawSynergyToast();
}

export {
  render,
};
