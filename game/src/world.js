// world.js: the museum floor itself — walls, cover, lasers, line of sight.
// Geometry helpers live here: circle-vs-rectangle movement, segment-vs-wall
// sight checks, and ray casts that shape the guards' vision cones.

import { VIEW_W, VIEW_H } from './config.js';

export function rectsOf(level) {
  // Every solid rectangle: the outer walls plus interior walls and cover.
  const solids = [
    { x: 0, y: 0, w: VIEW_W, h: 14 },
    { x: 0, y: VIEW_H - 14, w: VIEW_W, h: 14 },
    { x: 0, y: 0, w: 14, h: VIEW_H },
    { x: VIEW_W - 14, y: 0, w: 14, h: VIEW_H },
    ...level.walls,
    ...level.cover,
  ];
  return solids;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Move a circle against the solid rectangles, sliding along them.
export function moveCircle(x, y, dx, dy, radius, solids) {
  let nx = x + dx;
  let ny = y + dy;
  for (const r of solids) {
    if (nx + radius > r.x && nx - radius < r.x + r.w && ny + radius > r.y && ny - radius < r.y + r.h) {
      const pushLeft = nx + radius - r.x;
      const pushRight = r.x + r.w - (nx - radius);
      const pushUp = ny + radius - r.y;
      const pushDown = r.y + r.h - (ny - radius);
      const m = Math.min(pushLeft, pushRight, pushUp, pushDown);
      if (m === pushLeft) nx = r.x - radius;
      else if (m === pushRight) nx = r.x + r.w + radius;
      else if (m === pushUp) ny = r.y - radius;
      else ny = r.y + r.h + radius;
    }
  }
  nx = Math.max(14 + radius, Math.min(VIEW_W - 14 - radius, nx));
  ny = Math.max(14 + radius, Math.min(VIEW_H - 14 - radius, ny));
  return { x: nx, y: ny };
}

// Liang–Barsky: does segment (x1,y1)-(x2,y2) cross rectangle r?
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function lineOfSight(x1, y1, x2, y2, solids) {
  for (const r of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

// Distance from (ox,oy) along direction (dx,dy) to the nearest solid, capped.
export function rayDistance(ox, oy, dx, dy, maxDist, solids) {
  let best = maxDist;
  for (const r of solids) {
    const t = rayRect(ox, oy, dx, dy, r);
    if (t !== null && t < best) best = t;
  }
  return best;
}

function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return null;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return null;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

// A vision cone clipped by walls: sample rays across the field of view and
// join their endpoints into a polygon.
export function conePolygon(ox, oy, facing, fov, range, solids, steps = 18) {
  const pts = [{ x: ox, y: oy }];
  for (let i = 0; i <= steps; i++) {
    const a = facing - fov / 2 + (fov * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = rayDistance(ox, oy, dx, dy, range, solids);
    pts.push({ x: ox + dx * d, y: oy + dy * d });
  }
  return pts;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Lasers: beams that slide along one axis. Touching one spikes the alarm.
export function createLasers(defs) {
  return defs.map((d) => ({
    ...d,
    x: d.x1,
    y: d.y1,
    dir: 1,
    hitCooldown: 0,
  }));
}

export function updateLasers(lasers, dt) {
  for (const l of lasers) {
    if (l.axis === 'y') {
      l.y += l.dir * l.speed * dt;
      if (l.y >= l.max) { l.y = l.max; l.dir = -1; }
      if (l.y <= l.min) { l.y = l.min; l.dir = 1; }
      l.x1 = l.x; l.x2 = l.x; l.y1 = l.y - 40; l.y2 = l.y + 40;
    } else {
      l.x += l.dir * l.speed * dt;
      if (l.x >= l.max) { l.x = l.max; l.dir = -1; }
      if (l.x <= l.min) { l.x = l.min; l.dir = 1; }
      l.x1 = l.x - 40; l.x2 = l.x + 40; l.y1 = l.y; l.y2 = l.y;
    }
    l.hitCooldown = Math.max(0, l.hitCooldown - dt);
  }
}

export function laserTouchesPlayer(laser, px, py, radius) {
  // Distance from the player point to the beam segment.
  const x1 = laser.x1;
  const y1 = laser.y1;
  const x2 = laser.x2;
  const y2 = laser.y2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy) < radius + 3;
}
