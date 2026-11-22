// main.js: the heist itself — game loop, alarm, lockdown, scoring, and the
// screenshot scenes (?shot=start|play|vault|caught) the maker uses for the
// entry's screenshots. Pure browser code; no network anywhere.

import { LEVELS, TUNING, VIEW_W, VIEW_H } from './config.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { rectsOf, updateLasers, createLasers, laserTouchesPlayer } from './world.js';
import { createGuards, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { createPlayer, updatePlayer, collectLoot, atExit } from './player.js';
import { drawWorld, drawHud, drawOverlay } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1);

const game = {
  state: 'title', // title | intro | play | caught | levelclear | win
  levelIndex: 0,
  level: LEVELS[0],
  solids: [],
  guards: [],
  cameras: [],
  lasers: [],
  player: null,
  smoke: [],
  coinFlight: null,
  alarm: 0,
  lockdown: false,
  lockdownTimer: 0,
  unseenTimer: 0,
  score: 0,
  toolsSpent: 0,
  time: 0,
  levelTime: 0,
  timeTaken: 0,
  timeLeft: 0,
  spotted: false,
  caughtFlash: 0,
};

function loadLevel(index) {
  const level = LEVELS[index];
  game.levelIndex = index;
  game.level = level;
  game.solids = rectsOf(level);
  game.guards = createGuards(level.guards);
  game.cameras = createCameras(level.cameras);
  game.lasers = createLasers(level.lasers);
  game.player = createPlayer(level);
  game.smoke = [];
  game.coinFlight = null;
  game.alarm = 0;
  game.lockdown = false;
  game.lockdownTimer = 0;
  game.unseenTimer = 0;
  game.levelTime = 0;
  game.spotted = false;
  // Par time counts down as a soft clock; running out only costs the bonus.
  game.timeLeft = level.par;
}

function startGame() {
  game.score = 0;
  game.toolsSpent = 0;
  game.timeTaken = 0;
  loadLevel(0);
  game.state = 'intro';
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'win';
    audio.win();
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.state = 'intro';
}

function restartLevel() {
  loadLevel(game.levelIndex);
  game.state = 'intro';
}

function onSpend(kind) {
  const cost = kind === 'coin' ? TUNING.coinCost : TUNING.smokeCost;
  game.toolsSpent += cost;
  game.score = Math.max(0, game.score - cost);
  if (kind === 'coin') audio.coin();
  if (kind === 'smoke') audio.smoke();
}

function onCollect(item) {
  game.score += item.value;
  if (item.main) audio.mainLoot();
  else audio.pickup();
}

function update(dt) {
  game.time += dt;
  if (game.state !== 'play') return;

  game.levelTime += dt;
  game.timeTaken += dt;
  game.timeLeft = Math.max(0, game.level.par - game.levelTime);

  const p = game.player;

  // Tools + movement.
  const tool = updatePlayer(p, input, game.solids, game.guards, game.smoke, dt, onSpend);
  if (tool && tool.threwCoin) {
    game.coinFlight = { from: { x: p.x, y: p.y }, to: tool.threwCoin, t: 0.45 };
  }
  if (game.coinFlight) {
    game.coinFlight.t -= dt;
    if (game.coinFlight.t <= 0) game.coinFlight = null;
  }

  // Smoke clouds fade.
  for (const s of game.smoke) s.t -= dt;
  game.smoke = game.smoke.filter((s) => s.t > 0);

  updateGuards(game.guards, p, game.solids, game.smoke, dt, game.lockdown);
  updateCameras(game.cameras, p, game.solids, game.smoke, game.time);
  updateLasers(game.lasers, dt);

  // Lasers bite.
  for (const l of game.lasers) {
    if (l.hitCooldown <= 0 && laserTouchesPlayer(l, p.x, p.y, p.radius)) {
      l.hitCooldown = TUNING.laserCooldown;
      game.alarm = Math.min(100, game.alarm + TUNING.laserPenalty);
      audio.laser();
    }
  }

  // Alarm: climb while watched, fall while hidden.
  const watchedByGuard = game.guards.some((g) => g.seesPlayer);
  const watchedByCamera = game.cameras.some((c) => c.seesPlayer);
  const watched = watchedByGuard || watchedByCamera;
  if (watched) {
    const rate = (watchedByGuard ? TUNING.alarmGuardRate : 0) +
      (watchedByCamera ? TUNING.alarmCameraRate : 0);
    const factor = p.sneaking ? TUNING.alarmSneakFactor : 1;
    game.alarm = Math.min(100, game.alarm + rate * factor * dt);
    game.unseenTimer = 0;
    if (!game.spotted) {
      game.spotted = true;
      audio.spotted();
    }
  } else {
    game.spotted = false;
    game.unseenTimer += dt;
    game.alarm = Math.max(0, game.alarm - TUNING.alarmDecay * dt);
  }

  // Lockdown at full alarm: guards chase until you stay unseen for a while.
  if (game.alarm >= 100 && !game.lockdown) {
    game.lockdown = true;
    game.lockdownTimer = TUNING.lockdownSeconds;
    audio.startAlarm();
  }
  if (game.lockdown) {
    audio.setAlarmLevel(game.alarm);
    if (game.unseenTimer >= TUNING.lockdownSeconds) {
      game.lockdown = false;
      game.alarm = 55;
      audio.stopAlarm();
    }
  }

  // Loot + exit.
  collectLoot(p, game.level.loot, onCollect);
  if (p.hasMain && atExit(p, game.level.exit)) {
    audio.stopAlarm();
    audio.levelClear();
    game.state = 'levelclear';
    return;
  }

  // Caught: a guard closes in.
  for (const g of game.guards) {
    if (Math.hypot(g.x - p.x, g.y - p.y) < TUNING.catchRadius) {
      audio.stopAlarm();
      audio.caught();
      game.state = 'caught';
      return;
    }
  }
}

function handleKeys() {
  if (input.wasPressed('m')) {
    const muted = audio.toggleMute();
    document.getElementById('mute-note').textContent = muted ? 'Muted (M)' : '';
  }
  if (game.state === 'title' && (input.wasPressed('enter') || input.consumeClick())) {
    audio.unlock();
    startGame();
  } else if (game.state === 'intro' && (input.wasPressed('enter') || input.consumeClick())) {
    audio.unlock();
    game.state = 'play';
  } else if (game.state === 'levelclear' && (input.wasPressed('enter') || input.consumeClick())) {
    nextLevel();
  } else if (game.state === 'caught' && input.wasPressed('r')) {
    restartLevel();
  } else if (game.state === 'win' && input.wasPressed('r')) {
    startGame();
  } else if (game.state === 'play' && input.wasPressed('r')) {
    restartLevel();
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawWorld(ctx, game, game.time);
  drawHud(ctx, game);
  if (game.state !== 'play') drawOverlay(ctx, game);
  // Score shown in the HUD is loot minus tool costs.
  // (The HUD reads game.score; toolsSpent is folded in at the win screen.)
}

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0);
  frame.last = now;
  handleKeys();
  update(dt);
  render();
  input.endFrame();
  requestAnimationFrame(frame);
}

// --- Screenshot scenes ----------------------------------------------------
// ?shot=start  — the title screen over floor 1, guards on patrol.
// ?shot=play   — mid-heist: thief crossing the gallery, a guard's cone sweeping
//                close by, a camera watching, the Star Sapphire glowing, alarm 38.
// ?shot=vault  — floor 3, the Gilded Scepter in sight, lasers live, alarm 12.
// ?shot=caught — lockdown: alarm 100, red cones, a guard closing in.
// Each scene is staged from a fixed seed so the shot is reproducible.

function stageShot(name) {
  const rng = makeRng(seed * 7919 + name.length * 131);
  if (name === 'start') {
    loadLevel(0);
    game.state = 'title';
    game.time = 2.5;
  } else if (name === 'play') {
    loadLevel(0);
    game.state = 'play';
    game.time = 6;
    game.player.x = 470;
    game.player.y = 300;
    game.player.facing = 0.4;
    game.alarm = 38;
    game.score = 350; // the Moonlit Portrait already lifted
    game.level.loot[1].taken = true;
    game.player.lootValue = 350;
    game.player.lootTaken.push('Moonlit Portrait');
    // A guard rounds the corner, cone sweeping toward the thief.
    game.guards[0].x = 330;
    game.guards[0].y = 300;
    game.guards[0].facing = 0.2;
    game.guards[0].state = 'patrol';
    game.guards[0].pause = 0;
    game.guards[0].seesPlayer = true; // staged: the guard has eyes on Rook
    game.guards[0].alertFlash = 0.4;
    // Second guard lower down, cone visible.
    game.guards[1].x = 700;
    game.guards[1].y = 470;
    game.guards[1].facing = -Math.PI / 2;
    // The camera up top watches the Star.
    game.cameras[0].angle = Math.PI + 0.3;
  } else if (name === 'vault') {
    loadLevel(2);
    game.state = 'play';
    game.time = 9;
    game.player.x = 600;
    game.player.y = 330;
    game.player.facing = 0.1;
    game.player.sneaking = true;
    game.alarm = 12;
    game.score = 900;
    game.level.loot[1].taken = true;
    game.level.loot[3].taken = true;
    game.player.lootValue = 900;
    game.guards[3].x = 480;
    game.guards[3].y = 330;
    game.guards[3].facing = 0;
    game.guards[0].x = 200;
    game.guards[0].y = 200;
    game.guards[0].facing = Math.PI / 2;
    game.cameras[0].angle = Math.PI + 0.5;
    game.cameras[1].angle = Math.PI - 0.4;
  } else if (name === 'caught') {
    loadLevel(0);
    game.state = 'play';
    game.time = 12;
    game.player.x = 470;
    game.player.y = 300;
    game.alarm = 100;
    game.lockdown = true;
    game.score = 350;
    game.level.loot[1].taken = true;
    game.guards[0].x = 380;
    game.guards[0].y = 300;
    game.guards[0].facing = 0;
    game.guards[0].state = 'chase';
    game.guards[1].x = 620;
    game.guards[1].y = 420;
    game.guards[1].facing = -2.2;
    game.guards[1].state = 'chase';
    game.cameras[0].angle = Math.PI + 0.2;
  }
  void rng;
}

// Debug handle for play-testing (read-only inspection from the console).
window.__velvet = game;

if (shot) {
  stageShot(shot);
  // Freeze the staged scene's simulation so the screenshot is stable, but
  // keep the cones sweeping: render loop runs, update() is skipped.
  const frozenUpdate = update;
  void frozenUpdate;
  game.state = game.state === 'title' ? 'title' : 'play';
  // In shot mode the loop renders without advancing gameplay.
  const shotFrame = (now) => {
    game.time += 0.016;
    updateCameras(game.cameras, game.player, game.solids, game.smoke, game.time);
    render();
    requestAnimationFrame(shotFrame);
    void now;
  };
  // Prime one frame immediately so the first paint is the staged scene.
  updateCameras(game.cameras, game.player, game.solids, game.smoke, game.time);
  render();
  requestAnimationFrame(shotFrame);
} else {
  loadLevel(0);
  requestAnimationFrame(frame);
}
