// Velvet Vault — the hand-in program (Node 22, standard library only).
//
// The game lives in game/ as plain static files: game/index.html opens in a
// desktop browser and plays offline, no network request anywhere. This program
// copies game/ and screenshots/ beside it into the output directory and writes
// /output/dossier.json, the summary the judge reads, using the vendored
// make.fun library (vendor/makefun-game.ts, the kit's copy, unchanged).
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, mirrored here so a bad entry fails loudly at home
// instead of quietly on the platform: at most 4 screenshots, each at most
// 256 KiB; game/ at most 993 files and 48 MiB in all; every path short.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    total += 1;
    if (statSync(full).isDirectory()) total += countEntries(full);
  }
  return total;
}

function assertCaps() {
  const gameDir = join(repoRoot, 'game');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(gameDir)) throw new Error('game/ is missing');
  if (countEntries(gameDir) > CAPS.game_max_files) {
    throw new Error('game/ holds more than 993 files and directories');
  }
  if (existsSync(shotsDir)) {
    const shots = readdirSync(shotsDir).filter((n) => !n.startsWith('.'));
    if (shots.length > CAPS.screenshots.max) throw new Error('more than 4 screenshots');
    for (const name of shots) {
      const bytes = statSync(join(shotsDir, name)).size;
      if (bytes > CAPS.screenshots.max_bytes) throw new Error(`screenshot ${name} is over 256 KiB`);
    }
  }
}

assertCaps();

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, CAPS));

console.log(`Velvet Vault handed in: ${outDir}`);
