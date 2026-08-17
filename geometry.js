// Pure geometry helpers that can run without the browser game bootstrap.

function segmentRectIntersection(x1, y1, x2, y2, rect) {
  if (!rect || rect.destroyed) return null;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const halfWidth = Math.max(0, rect.w || 0) * 0.5;
  const halfHeight = Math.max(0, rect.h || 0) * 0.5;
  const left = rect.x - halfWidth;
  const right = rect.x + halfWidth;
  const top = rect.y - halfHeight;
  const bottom = rect.y + halfHeight;
  let tMin = 0;
  let tMax = 1;

  for (const [origin, delta, min, max] of [
    [x1, dx, left, right],
    [y1, dy, top, bottom],
  ]) {
    if (Math.abs(delta) < 1e-8) {
      if (origin < min || origin > max) return null;
      continue;
    }

    const inverse = 1 / delta;
    let near = (min - origin) * inverse;
    let far = (max - origin) * inverse;
    if (near > far) [near, far] = [far, near];
    tMin = Math.max(tMin, near);
    tMax = Math.min(tMax, far);
    if (tMin > tMax) return null;
  }

  return {
    x: x1 + dx * tMin,
    y: y1 + dy * tMin,
    t: tMin,
    solid: rect,
  };
}

export { segmentRectIntersection };
