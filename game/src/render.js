// render.js: everything the eye sees — the night museum, the sweeping cones,
// the glow of the loot and the alarm meter. All art is drawn with canvas
// primitives; there are no image files and no network requests.

import { VIEW_W, VIEW_H, HUD_H, TUNING } from './config.js';
import { conePolygon } from './world.js';

const FLOOR_A = '#241d18';
const FLOOR_B = '#2b231c';
const WALL = '#4a3f35';
const WALL_TOP = '#6b5b4a';
const GOLD = '#f2c14e';
const RED = '#e5484d';
const AMBER = '#f5a524';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, poly, color, edge) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFloor(ctx, time) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  // Checkerboard marble, faint.
  const s = 60;
  for (let y = 0; y < (VIEW_H - HUD_H) / s; y++) {
    for (let x = 0; x < VIEW_W / s; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = FLOOR_B;
        ctx.fillRect(x * s, HUD_H + y * s, s, s);
      }
    }
  }
  // A deep-red carpet runner down the middle of the gallery.
  ctx.fillStyle = 'rgba(122, 32, 38, 0.55)';
  ctx.fillRect(430, HUD_H, 100, VIEW_H - HUD_H);
  ctx.fillStyle = 'rgba(242, 193, 78, 0.25)';
  ctx.fillRect(430, HUD_H, 3, VIEW_H - HUD_H);
  ctx.fillRect(527, HUD_H, 3, VIEW_H - HUD_H);
  // Moonlight shafts from the high windows.
  ctx.fillStyle = 'rgba(150, 180, 220, 0.05)';
  for (let i = 0; i < 4; i++) {
    const x = 120 + i * 220 + Math.sin(time * 0.1 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(x, HUD_H);
    ctx.lineTo(x + 90, HUD_H);
    ctx.lineTo(x + 200, VIEW_H);
    ctx.lineTo(x + 110, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = WALL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = WALL_TOP;
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }
  // Outer frame.
  ctx.fillStyle = WALL;
  ctx.fillRect(0, HUD_H, VIEW_W, 14);
  ctx.fillRect(0, VIEW_H - 14, VIEW_W, 14);
  ctx.fillRect(0, HUD_H, 14, VIEW_H - HUD_H);
  ctx.fillRect(VIEW_W - 14, HUD_H, 14, VIEW_H - HUD_H);
}

function drawCover(ctx, level, time) {
  for (const c of level.cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#3a2f28';
      roundRect(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(140, 190, 220, 0.20)';
      roundRect(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 3);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      roundRect(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.stroke();
      // A small relic inside the case.
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'statue') {
      ctx.fillStyle = '#5c5348';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a6f60';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b231c';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 8, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#4d3b28';
      roundRect(ctx, c.x, c.y, c.w, c.h, 3);
      ctx.fill();
      ctx.strokeStyle = '#6e5738';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.h / 2);
      ctx.lineTo(c.x + c.w, c.y + c.h / 2);
      ctx.stroke();
    }
  }
}

function drawExit(ctx, level, open, time) {
  const e = level.exit;
  const glow = open ? 0.5 + 0.3 * Math.sin(time * 5) : 0.18;
  ctx.fillStyle = `rgba(80, 200, 120, ${glow})`;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#7be495' : '#4a7a58';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? '#bff5cf' : '#9fc7ab';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('EXIT', 0, 4);
  ctx.restore();
  ctx.textAlign = 'left';
}

function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const pulse = 0.55 + 0.3 * Math.sin(time * 3 + item.x);
    const size = item.main ? 15 : 10;
    // Glow halo.
    const g = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 44);
    g.addColorStop(0, `rgba(242, 193, 78, ${pulse * 0.55})`);
    g.addColorStop(1, 'rgba(242, 193, 78, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 44, 0, Math.PI * 2);
    ctx.fill();
    // The gem itself.
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = item.main ? '#8fe3ff' : GOLD;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeStyle = '#fff8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.restore();
    if (item.main) {
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name.toUpperCase(), item.x, item.y - 28);
      ctx.textAlign = 'left';
    }
  }
}

function drawLasers(ctx, lasers, time) {
  for (const l of lasers) {
    const flicker = 0.6 + 0.4 * Math.sin(time * 9 + l.x);
    ctx.strokeStyle = `rgba(229, 72, 77, ${flicker})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = RED;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 4, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, guards, solids) {
  for (const g of guards) {
    const alerted = g.seesPlayer || g.state === 'chase';
    const cone = conePolygon(g.x, g.y, g.facing, TUNING.guardFov, TUNING.guardRange, solids);
    drawCone(
      ctx, cone,
      alerted ? 'rgba(229, 72, 77, 0.30)' : 'rgba(245, 165, 36, 0.20)',
      alerted ? 'rgba(229, 72, 77, 0.55)' : 'rgba(245, 165, 36, 0.35)',
    );
    // Body: navy uniform, brass buttons, a cap.
    ctx.fillStyle = '#2e3d55';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alerted ? RED : '#7c8aa5';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 3, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#dfe6f2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 17, g.y + Math.sin(g.facing) * 17);
    ctx.stroke();
    // "!" when the guard has eyes on you.
    if (g.seesPlayer) {
      ctx.fillStyle = RED;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 20);
      ctx.textAlign = 'left';
    }
    // "?" while investigating a coin.
    if (g.state === 'investigate') {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 20);
      ctx.textAlign = 'left';
    }
  }
}

function drawCameras(ctx, cameras, solids) {
  for (const c of cameras) {
    const cone = conePolygon(c.x, c.y, c.angle, TUNING.cameraFov, TUNING.cameraRange, solids);
    drawCone(
      ctx, cone,
      c.seesPlayer ? 'rgba(229, 72, 77, 0.26)' : 'rgba(120, 200, 255, 0.16)',
      c.seesPlayer ? 'rgba(229, 72, 77, 0.5)' : 'rgba(120, 200, 255, 0.3)',
    );
    // Wall mount + lens.
    ctx.fillStyle = '#3a3f46';
    ctx.fillRect(c.x - 7, c.y - 7, 14, 14);
    ctx.fillStyle = c.seesPlayer ? RED : '#59c2ff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (c.seesPlayer) {
      ctx.fillStyle = RED;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REC', c.x, c.y - 14);
      ctx.textAlign = 'left';
    }
  }
}

function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    const alpha = Math.min(0.75, (s.t / TUNING.smokeSeconds) * 0.75 + 0.2);
    const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
    g.addColorStop(0, `rgba(200, 200, 210, ${alpha})`);
    g.addColorStop(1, 'rgba(200, 200, 210, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak.
  ctx.save();
  ctx.translate(player.x, player.y + bob * 0.3);
  ctx.rotate(player.facing + Math.PI / 2);
  ctx.fillStyle = player.sneaking ? '#4a3a5e' : '#1f2a24';
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8dcc8';
  ctx.beginPath();
  ctx.arc(0, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Sneak ring.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(150, 120, 220, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCoinFlight(ctx, coin, time) {
  if (!coin) return;
  const p = 1 - coin.t / 0.45;
  const x = coin.from.x + (coin.to.x - coin.from.x) * p;
  const y = coin.from.y + (coin.to.y - coin.from.y) * p - Math.sin(p * Math.PI) * 26;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff2c4';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawWorld(ctx, game, time) {
  const { level, guards, cameras, lasers, player, smoke } = game;
  drawFloor(ctx, time);
  drawExit(ctx, level, player.hasMain, time);
  drawCover(ctx, level, time);
  drawLoot(ctx, level, time);
  drawLasers(ctx, lasers, time);
  drawCameras(ctx, cameras, game.solids);
  drawGuards(ctx, guards, game.solids);
  drawSmoke(ctx, smoke);
  drawCoinFlight(ctx, game.coinFlight, time);
  drawPlayer(ctx, player, time);
  drawWalls(ctx, level);
}

function alarmColor(alarm) {
  if (alarm < 35) return '#57c785';
  if (alarm < 70) return AMBER;
  return RED;
}

export function drawHud(ctx, game) {
  const { alarm, player, levelIndex, score, timeLeft, state } = game;
  ctx.fillStyle = '#14100d';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#2a211a';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  // Title + level.
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('VELVET VAULT', 14, 21);
  ctx.fillStyle = '#cbb89a';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Floor ${levelIndex + 1} of 3 — ${game.level.name}`, 14, 40);

  // Alarm meter.
  const mx = 330;
  const mw = 300;
  ctx.fillStyle = '#e8dcc8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('ALARM', mx, 17);
  ctx.fillStyle = '#241a12';
  roundRect(ctx, mx, 24, mw, 16, 4);
  ctx.fill();
  const w = Math.max(0, Math.min(1, alarm / 100)) * mw;
  ctx.fillStyle = alarmColor(alarm);
  if (w > 0) {
    roundRect(ctx, mx, 24, w, 16, 4);
    ctx.fill();
  }
  ctx.strokeStyle = '#6b5b4a';
  ctx.lineWidth = 1;
  roundRect(ctx, mx, 24, mw, 16, 4);
  ctx.stroke();
  if (game.lockdown) {
    ctx.fillStyle = RED;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('LOCKDOWN — BREAK LINE OF SIGHT!', mx, 51);
  } else if (alarm >= 70) {
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('THEY ARE ONTO YOU', mx, 51);
  }

  // Loot + tools + time.
  ctx.fillStyle = '#e8dcc8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`LOOT $${score.toLocaleString('en-US')}`, VIEW_W - 14, 21);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#cbb89a';
  const obj = player.hasMain
    ? 'Main prize lifted — reach the EXIT'
    : `Lift the ${game.level.loot.find((l) => l.main).name}`;
  ctx.fillText(obj, VIEW_W - 14, 40);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cbb89a';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Coins ${player.coins}  •  Smoke ${player.smoke}  •  ${Math.max(0, Math.ceil(timeLeft))}s`, 660, 21);
}

export function drawOverlay(ctx, game) {
  const { state, levelIndex, score, timeTaken, level } = game;
  ctx.textAlign = 'center';
  if (state === 'title') {
    ctx.fillStyle = 'rgba(10, 8, 6, 0.82)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('VELVET VAULT', VIEW_W / 2, 200);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('A midnight heist in three wings of the Meridian Museum', VIEW_W / 2, 236);
    ctx.fillStyle = '#cbb89a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('WASD / arrows — move      Shift — sneak      Click — toss a coin', VIEW_W / 2, 300);
    ctx.fillText('Space — smoke pellet      R — restart      M — mute', VIEW_W / 2, 324);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Read the cones. Lift the prize. Vanish through the exit.', VIEW_W / 2, 368);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Press ENTER or click to begin', VIEW_W / 2, 430);
  } else if (state === 'intro') {
    ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(level.name, VIEW_W / 2, 240);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(level.sub, VIEW_W / 2, 276);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press ENTER or click to start the floor', VIEW_W / 2, 330);
  } else if (state === 'caught') {
    ctx.fillStyle = 'rgba(60, 6, 8, 0.78)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 250);
    ctx.fillStyle = '#f3d9d9';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('The night watch closed in. The vault keeps its secrets — this time.', VIEW_W / 2, 288);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press R to try the floor again', VIEW_W / 2, 340);
  } else if (state === 'levelclear') {
    ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = '#7be495';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText('CLEAN GETAWAY', VIEW_W / 2, 240);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Floor ${levelIndex + 1} cleared — loot so far $${score.toLocaleString('en-US')}`, VIEW_W / 2, 278);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press ENTER for the next floor', VIEW_W / 2, 330);
  } else if (state === 'win') {
    ctx.fillStyle = 'rgba(10, 8, 6, 0.85)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 38px system-ui, sans-serif';
    ctx.fillText('THE VAULT IS YOURS', VIEW_W / 2, 220);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(`Total loot $${score.toLocaleString('en-US')}  •  ${Math.round(timeTaken)}s across three floors`, VIEW_W / 2, 262);
    ctx.fillText('Rook slips into the night. The Meridian Museum never saw a thing.', VIEW_W / 2, 292);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press R to run the heist again', VIEW_W / 2, 350);
  }
  ctx.textAlign = 'left';
}
