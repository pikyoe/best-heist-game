// guards.js: the night watch — patrol routes, suspicion, lockdown chases.
// A guard walks its waypoints, pauses, and turns its head. When it sees the
// thief its cone burns red and the alarm climbs; at full alarm every guard
// runs the thief down. A thrown coin pulls the nearest guard to investigate.

import { TUNING } from './config.js';
import { angleDiff, lineOfSight, moveCircle } from './world.js';

export function createGuards(defs) {
  return defs.map((d) => {
    // Start partway along the route so guards are spread out.
    const leg = Math.floor(d.phase * d.path.length) % d.path.length;
    const start = d.path[leg];
    return {
      path: d.path,
      speed: d.speed,
      x: start[0],
      y: start[1],
      leg,
      facing: 0,
      pause: d.phase * TUNING.guardPause,
      state: 'patrol', // patrol | investigate | chase | search | return
      investigate: null,
      investigateTimer: 0,
      chaseTimer: 0,
      searchTimer: 0,
      lastSeen: null,
      returnTarget: null,
      seesPlayer: false,
      alertFlash: 0,
    };
  });
}

function guardTarget(g) {
  return g.path[(g.leg + 1) % g.path.length];
}

function turnToward(g, targetAngle, dt, rate) {
  const d = angleDiff(targetAngle, g.facing);
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  g.facing += step;
}

export function updateGuards(guards, player, solids, smoke, dt, lockdown) {
  for (const g of guards) {
    g.alertFlash = Math.max(0, g.alertFlash - dt);
    const dxp = player.x - g.x;
    const dyp = player.y - g.y;
    const dist = Math.hypot(dxp, dyp);
    const inSmoke = smoke.some((s) => Math.hypot(player.x - s.x, player.y - s.y) < s.r);
    const angleTo = Math.atan2(dyp, dxp);
    const inCone = Math.abs(angleDiff(angleTo, g.facing)) < TUNING.guardFov / 2;
    const seen = !inSmoke && dist < TUNING.guardRange && inCone &&
      lineOfSight(g.x, g.y, player.x, player.y, solids);
    g.seesPlayer = seen;
    if (seen) {
      g.alertFlash = 0.4;
      // Remember where the thief was last seen; the chase goes there,
      // it does not home in on the thief's live position.
      g.lastSeen = { x: player.x, y: player.y };
    }

    if (lockdown) {
      // Lockdown: run to the thief's last seen position. A guard that is
      // already searching the spot keeps searching — unless it sees the
      // thief again, in which case the chase resumes at once.
      if (g.state !== 'search' || seen) {
        if (g.state !== 'chase') g.chaseTimer = TUNING.lockdownSeconds;
        g.state = 'chase';
      }
    }

    if (g.state === 'chase') {
      const target = g.lastSeen || { x: player.x, y: player.y };
      const tx = target.x - g.x;
      const ty = target.y - g.y;
      const td = Math.hypot(tx, ty);
      if (td > 8) {
        const a = Math.atan2(ty, tx);
        turnToward(g, a, dt, 6);
        const step = Math.min(TUNING.guardChaseSpeed * dt, td);
        const moved = moveCircle(g.x, g.y, Math.cos(a) * step, Math.sin(a) * step, 12, solids);
        g.x = moved.x;
        g.y = moved.y;
      } else if (!seen) {
        // Arrived where the thief was last seen and lost the trail: search.
        g.state = 'search';
        g.searchTimer = 2.0;
      }
      if (!lockdown) {
        g.chaseTimer -= dt;
        if (g.chaseTimer <= 0 && g.state === 'chase') {
          g.state = 'return';
          g.returnTarget = { x: g.path[g.leg][0], y: g.path[g.leg][1] };
        }
      }
      continue;
    }

    if (g.state === 'search') {
      g.searchTimer -= dt;
      g.facing += dt * 2.4; // sweep the area with the eyes
      if (g.searchTimer <= 0) {
        g.state = 'return';
        g.returnTarget = { x: g.path[g.leg][0], y: g.path[g.leg][1] };
      }
      continue;
    }

    if (g.state === 'investigate') {
      const t = g.investigate;
      const dx = t.x - g.x;
      const dy = t.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const a = Math.atan2(dy, dx);
        turnToward(g, a, dt, 5);
        const step = Math.min(g.speed * 1.5 * dt, d);
        const moved = moveCircle(g.x, g.y, Math.cos(a) * step, Math.sin(a) * step, 12, solids);
        g.x = moved.x;
        g.y = moved.y;
      } else {
        g.investigateTimer -= dt;
        // Look around while checking the noise.
        g.facing += Math.sin(g.investigateTimer * 3) * dt * 1.2;
        if (g.investigateTimer <= 0) {
          g.state = 'return';
          g.returnTarget = { x: g.path[g.leg][0], y: g.path[g.leg][1] };
        }
      }
      continue;
    }

    if (g.state === 'return') {
      const t = g.returnTarget;
      const dx = t.x - g.x;
      const dy = t.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const a = Math.atan2(dy, dx);
        turnToward(g, a, dt, 5);
        const step = Math.min(g.speed * dt, d);
        const moved = moveCircle(g.x, g.y, Math.cos(a) * step, Math.sin(a) * step, 12, solids);
        g.x = moved.x;
        g.y = moved.y;
      } else {
        g.state = 'patrol';
        g.pause = 0.4;
      }
      continue;
    }

    // Patrol: walk the waypoints, pausing and looking around at each one.
    if (g.pause > 0) {
      g.pause -= dt;
      g.facing += Math.sin((g.pause + 1) * 2.2) * dt * 0.7;
      continue;
    }
    const target = guardTarget(g);
    const dx = target[0] - g.x;
    const dy = target[1] - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) {
      g.leg = (g.leg + 1) % g.path.length;
      g.pause = TUNING.guardPause;
      continue;
    }
    const a = Math.atan2(dy, dx);
    turnToward(g, a, dt, 4.5);
    const step = Math.min(g.speed * dt, d);
    const moved = moveCircle(g.x, g.y, Math.cos(a) * step, Math.sin(a) * step, 12, solids);
    g.x = moved.x;
    g.y = moved.y;
  }
}

export function sendGuardToCoin(guards, x, y) {
  let best = null;
  let bestDist = TUNING.coinHearing;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist && g.state !== 'chase') {
      best = g;
      bestDist = d;
    }
  }
  if (best) {
    best.state = 'investigate';
    best.investigate = { x, y };
    best.investigateTimer = 2.2;
  }
  return best !== null;
}
