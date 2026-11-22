// cameras.js: the wall-mounted security cameras.
// Each one sweeps its cone back and forth. It cannot chase you, but while
// its lens holds you the alarm climbs — and smoke blinds it like anything else.

import { TUNING } from './config.js';
import { angleDiff, lineOfSight } from './world.js';

export function createCameras(defs) {
  return defs.map((d) => ({
    x: d.x,
    y: d.y,
    base: d.base,
    sweep: d.sweep,
    speed: d.speed,
    phase: d.phase,
    angle: d.base,
    seesPlayer: false,
    alertFlash: 0,
  }));
}

export function updateCameras(cameras, player, solids, smoke, time) {
  for (const c of cameras) {
    c.angle = c.base + Math.sin(time * c.speed + c.phase) * c.sweep;
    c.alertFlash = Math.max(0, c.alertFlash - 0.016);
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dist = Math.hypot(dx, dy);
    const inSmoke = smoke.some((s) => Math.hypot(player.x - s.x, player.y - s.y) < s.r);
    const angleTo = Math.atan2(dy, dx);
    const inCone = Math.abs(angleDiff(angleTo, c.angle)) < TUNING.cameraFov / 2;
    const seen = !inSmoke && dist < TUNING.cameraRange && inCone &&
      lineOfSight(c.x, c.y, player.x, player.y, solids);
    c.seesPlayer = seen;
    if (seen) c.alertFlash = 0.4;
  }
}
