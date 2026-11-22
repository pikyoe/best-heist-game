// Velvet Vault — a midnight heist.
// config.js: tuning constants and the three museum wings (levels).
// Every number here is the game's own design: patrol routes, camera sweeps,
// loot placement and alarm rates were tuned by hand for this game.

export const VIEW_W = 960;
export const VIEW_H = 600;
export const HUD_H = 54;

export const TUNING = {
  playerSpeed: 165, // px per second, walking
  sneakSpeed: 95, // px per second while Shift is held
  playerRadius: 12,
  guardSpeed: 52, // patrol
  guardChaseSpeed: 118, // lockdown chase
  guardPause: 1.1, // seconds a guard waits at each waypoint
  guardRange: 225, // vision range, px
  guardFov: 1.22, // radians, about 70 degrees
  cameraRange: 250,
  cameraFov: 0.85, // about 49 degrees
  alarmGuardRate: 34, // alarm points per second while a guard watches you
  alarmCameraRate: 22, // alarm points per second while a camera watches you
  alarmDecay: 5, // alarm points per second while nobody sees you
  alarmSneakFactor: 0.45, // sneaking slows how fast the alarm climbs
  lockdownSeconds: 8, // survive this long unseen to break a lockdown
  laserPenalty: 22, // alarm points when a laser beam touches you
  laserCooldown: 1.0, // seconds between laser hits
  coinCost: 25, // score cost of throwing a distraction coin
  smokeCost: 50, // score cost of a smoke pellet
  smokeSeconds: 3.2, // how long a smoke cloud blocks vision
  coinHearing: 320, // guards within this range investigate a coin
  catchRadius: 26, // a guard this close catches you
  timeBonusPar: [150, 180, 210], // par seconds per level, for the bonus
};

export const LEVELS = [
  {
    name: 'The Meridian Gallery',
    sub: 'Lift the Star Sapphire, then slip out the west door.',
    par: 150,
    playerStart: [70, 520],
    exit: { x: 28, y: 470, w: 46, h: 76, label: 'EXIT' },
    walls: [
      { x: 300, y: 120, w: 16, h: 180 },
      { x: 300, y: 380, w: 16, h: 130 },
      { x: 560, y: 90, w: 16, h: 150 },
      { x: 560, y: 330, w: 16, h: 180 },
      { x: 700, y: 300, w: 140, h: 16 },
    ],
    cover: [
      { x: 130, y: 150, w: 90, h: 46, kind: 'case' },
      { x: 420, y: 420, w: 90, h: 46, kind: 'case' },
      { x: 660, y: 140, w: 60, h: 60, kind: 'statue' },
      { x: 830, y: 430, w: 70, h: 50, kind: 'crate' },
      { x: 180, y: 380, w: 70, h: 50, kind: 'crate' },
    ],
    guards: [
      { path: [[220, 110], [700, 110], [700, 480], [220, 480]], speed: 52, phase: 0 },
      { path: [[860, 120], [860, 480], [640, 480], [640, 120]], speed: 46, phase: 0.5 },
    ],
    cameras: [
      { x: 940, y: 210, base: Math.PI, sweep: 0.7, speed: 0.45, phase: 0 },
    ],
    loot: [
      { x: 880, y: 300, value: 1200, main: true, name: 'Star Sapphire' },
      { x: 175, y: 173, value: 350, name: 'Moonlit Portrait' },
      { x: 465, y: 443, value: 250, name: 'Gold Bar' },
    ],
    lasers: [],
  },
  {
    name: 'The Sunken Vault',
    sub: 'The Tide Crown waits past the laser corridor. Mind the cameras.',
    par: 180,
    playerStart: [70, 520],
    exit: { x: 28, y: 470, w: 46, h: 76, label: 'EXIT' },
    walls: [
      { x: 240, y: 100, w: 16, h: 200 },
      { x: 240, y: 400, w: 16, h: 120 },
      { x: 480, y: 90, w: 16, h: 160 },
      { x: 480, y: 340, w: 16, h: 180 },
      { x: 700, y: 120, w: 16, h: 200 },
      { x: 700, y: 420, w: 16, h: 100 },
    ],
    cover: [
      { x: 120, y: 130, w: 90, h: 46, kind: 'case' },
      { x: 330, y: 300, w: 60, h: 60, kind: 'statue' },
      { x: 560, y: 440, w: 90, h: 46, kind: 'case' },
      { x: 800, y: 150, w: 70, h: 50, kind: 'crate' },
      { x: 560, y: 160, w: 70, h: 50, kind: 'crate' },
      { x: 150, y: 420, w: 70, h: 50, kind: 'crate' },
    ],
    guards: [
      { path: [[180, 110], [420, 110], [420, 480], [180, 480]], speed: 56, phase: 0 },
      { path: [[540, 110], [660, 110], [660, 480], [540, 480]], speed: 50, phase: 0.4 },
      { path: [[780, 120], [880, 120], [880, 480], [780, 480]], speed: 48, phase: 0.7 },
    ],
    cameras: [
      { x: 940, y: 140, base: Math.PI, sweep: 0.8, speed: 0.5, phase: 0 },
      { x: 20, y: 300, base: 0, sweep: 0.7, speed: 0.4, phase: 1.5 },
    ],
    loot: [
      { x: 880, y: 320, value: 2000, main: true, name: 'Tide Crown' },
      { x: 165, y: 153, value: 400, name: 'Pearl Brooch' },
      { x: 605, y: 463, value: 300, name: 'Silver Chalice' },
      { x: 360, y: 330, value: 300, name: 'Jade Figurine' },
    ],
    lasers: [
      { x1: 500, y1: 250, x2: 500, y2: 330, axis: 'y', min: 250, max: 330, speed: 55, phase: 0 },
    ],
  },
  {
    name: 'The Gilded Vault',
    sub: 'The Gilded Scepter. Four guards, three cameras, two lasers. Go quiet.',
    par: 210,
    playerStart: [70, 520],
    exit: { x: 28, y: 470, w: 46, h: 76, label: 'EXIT' },
    walls: [
      { x: 200, y: 100, w: 16, h: 180 },
      { x: 200, y: 380, w: 16, h: 140 },
      { x: 420, y: 90, w: 16, h: 150 },
      { x: 420, y: 340, w: 16, h: 180 },
      { x: 640, y: 100, w: 16, h: 180 },
      { x: 640, y: 380, w: 16, h: 140 },
      { x: 800, y: 280, w: 120, h: 16 },
    ],
    cover: [
      { x: 110, y: 140, w: 90, h: 46, kind: 'case' },
      { x: 280, y: 300, w: 60, h: 60, kind: 'statue' },
      { x: 500, y: 430, w: 90, h: 46, kind: 'case' },
      { x: 720, y: 150, w: 70, h: 50, kind: 'crate' },
      { x: 860, y: 430, w: 70, h: 50, kind: 'crate' },
      { x: 480, y: 160, w: 70, h: 50, kind: 'crate' },
      { x: 120, y: 420, w: 70, h: 50, kind: 'crate' },
    ],
    guards: [
      { path: [[150, 110], [380, 110], [380, 480], [150, 480]], speed: 58, phase: 0 },
      { path: [[470, 110], [600, 110], [600, 480], [470, 480]], speed: 54, phase: 0.3 },
      { path: [[690, 110], [900, 110], [900, 480], [690, 480]], speed: 52, phase: 0.6 },
      { path: [[300, 250], [620, 250], [620, 380], [300, 380]], speed: 48, phase: 0.85 },
    ],
    cameras: [
      { x: 940, y: 120, base: Math.PI, sweep: 0.8, speed: 0.55, phase: 0 },
      { x: 940, y: 480, base: Math.PI, sweep: 0.8, speed: 0.5, phase: 2 },
      { x: 20, y: 220, base: 0, sweep: 0.7, speed: 0.45, phase: 1 },
    ],
    loot: [
      { x: 880, y: 220, value: 3000, main: true, name: 'Gilded Scepter' },
      { x: 155, y: 163, value: 500, name: 'Ruby Tiara' },
      { x: 545, y: 453, value: 400, name: 'Gold Mask' },
      { x: 515, y: 185, value: 400, name: 'Emerald Idol' },
      { x: 310, y: 330, value: 350, name: 'Ivory Dice' },
    ],
    lasers: [
      { x1: 440, y1: 250, x2: 440, y2: 330, axis: 'y', min: 250, max: 330, speed: 65, phase: 0 },
      { x1: 660, y1: 300, x2: 740, y2: 300, axis: 'x', min: 660, max: 740, speed: 70, phase: 1.2 },
    ],
  },
];
