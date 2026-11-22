// player.js: Rook, the thief.
// Walks with WASD or arrows, sneaks with Shift, tosses a coin with a mouse
// click to pull a guard away, drops smoke with Space. Loot is lifted by
// walking over it; the main prize opens the way out.

import { TUNING } from './config.js';
import { moveCircle, pointInRect } from './world.js';
import { sendGuardToCoin } from './guards.js';

export function createPlayer(level) {
  return {
    x: level.playerStart[0],
    y: level.playerStart[1],
    radius: TUNING.playerRadius,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    stepPhase: 0,
    coins: 3, // distraction coins
    smoke: 2, // smoke pellets
    lootValue: 0,
    lootTaken: [],
    hasMain: false,
  };
}

export function updatePlayer(player, input, solids, guards, smokeClouds, dt, onSpend) {
  const axis = input.axis();
  player.moving = axis.x !== 0 || axis.y !== 0;
  player.sneaking = input.sneaking() && player.moving;
  const speed = player.sneaking ? TUNING.sneakSpeed : TUNING.playerSpeed;
  if (player.moving) {
    const moved = moveCircle(
      player.x, player.y,
      axis.x * speed * dt, axis.y * speed * dt,
      player.radius, solids,
    );
    player.x = moved.x;
    player.y = moved.y;
    player.facing = Math.atan2(axis.y, axis.x);
    player.stepPhase += dt * (player.sneaking ? 6 : 10);
  }

  const click = input.consumeClick();
  if (click && player.coins > 0) {
    player.coins -= 1;
    onSpend('coin');
    sendGuardToCoin(guards, click.x, click.y);
    return { threwCoin: { x: click.x, y: click.y } };
  }
  if (input.wasPressed('space') && player.smoke > 0) {
    player.smoke -= 1;
    onSpend('smoke');
    smokeClouds.push({ x: player.x, y: player.y, r: 74, t: TUNING.smokeSeconds });
    return { smoked: true };
  }
  return null;
}

export function collectLoot(player, loot, onCollect) {
  for (const item of loot) {
    if (item.taken) continue;
    if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + 16) {
      item.taken = true;
      player.lootValue += item.value;
      player.lootTaken.push(item.name);
      if (item.main) player.hasMain = true;
      onCollect(item);
    }
  }
}

export function atExit(player, exit) {
  return pointInRect(player.x, player.y, exit);
}
