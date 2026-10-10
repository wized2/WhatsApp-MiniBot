#!/usr/bin/env node
/**
 * MiniBot — KataBump / VPS single-file runner
 * ============================================
 * Edit CONFIG below (or set env vars). Then:
 *   node katabump.js
 *
 * - Uses phone for BOTH owner + pairing
 * - Auto git-pull from GitHub every 5 minutes; restarts on code change
 * - Binds 0.0.0.0 + PORT for hosting panels
 */

// ─────────────── CONFIG (edit here) ───────────────
const CONFIG = {
  // International digits, no +  (used for owner AND pairing)
  phone: process.env.PHONE || process.env.OWNER || '923073477752',

  // HTTP port for pair site / health
  port: Number(process.env.PORT) || 20299,

  // GitHub repo to auto-update from (empty = disable auto-update)
  repoUrl: process.env.REPO_URL || 'https://github.com/wized2/WhatsApp-MiniBot.git',
  branch: process.env.BRANCH || 'main',

  // Check for updates every N minutes
  updateEveryMin: Number(process.env.UPDATE_EVERY_MIN || 5),

  // Working directory name under /tmp (or cwd)
  dirName: process.env.BOT_DIR || 'WhatsApp-MiniBot-run',
};
// ───────────────────────────────────────────────────

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.env.RUN_ROOT || '/tmp', CONFIG.dirName);
const PHONE = String(CONFIG.phone).replace(/\D/g, '');
const PORT = CONFIG.port;

function log(...a) {
  console.log(new Date().toISOString().slice(11, 19), ...a);
}

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd || ROOT,
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
  });
}

function ensureRepo() {
  if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
    log('cloning', CONFIG.repoUrl);
    fs.mkdirSync(path.dirname(ROOT), { recursive: true });
    if (fs.existsSync(ROOT)) fs.rmSync(ROOT, { recursive: true, force: true });
    sh(`git clone --depth 1 -b ${CONFIG.branch} "${CONFIG.repoUrl}" "${ROOT}"`, {
      cwd: path.dirname(ROOT),
    });
  }
  // Patch config.js phone/port without destroying other keys
  const cfgPath = path.join(ROOT, 'config.js');
  if (fs.existsSync(cfgPath)) {
    let t = fs.readFileSync(cfgPath, 'utf8');
    t = t.replace(/ownerNumber:\s*['"][^'"]*['"]/, `ownerNumber: '${PHONE}'`);
    t = t.replace(/pairNumber:\s*['"][^'"]*['"]/, `pairNumber: '${PHONE}'`);
    t = t.replace(/port:\s*Number\(process\.env\.PORT\)\s*\|\|\s*\d+/, `port: Number(process.env.PORT) || ${PORT}`);
    fs.writeFileSync(cfgPath, t);
  }
  if (!fs.existsSync(path.join(ROOT, 'node_modules', 'baileys'))) {
    log('npm install…');
    sh('npm install --omit=dev', { cwd: ROOT });
  }
}

function gitHead() {
  try {
    return sh('git rev-parse HEAD', { silent: true }).trim();
  } catch {
    return '';
  }
}

function pullIfChanged() {
  if (!CONFIG.repoUrl) return false;
  try {
    const before = gitHead();
    sh('git fetch --depth 1 origin ' + CONFIG.branch, { silent: true });
    sh('git reset --hard origin/' + CONFIG.branch, { silent: true });
    const after = gitHead();
    if (before && after && before !== after) {
      log('update detected', before.slice(0, 7), '→', after.slice(0, 7));
      try {
        sh('npm install --omit=dev', { cwd: ROOT });
      } catch (e) {
        log('npm install after update failed', e.message);
      }
      return true;
    }
  } catch (e) {
    log('update check failed', e.message);
  }
  return false;
}

let child = null;
let shuttingDown = false;

function startBot() {
  if (child) {
    try {
      child.kill('SIGTERM');
    } catch (_) {}
    child = null;
  }
  log('starting bot · phone', PHONE, '· port', PORT);
  child = spawn('node', ['index.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      PHONE,
      OWNER: PHONE,
      PAIR_NUMBER: PHONE,
    },
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    log('bot exited', code, signal || '');
    child = null;
    if (!shuttingDown) {
      setTimeout(startBot, 3000);
    }
  });
}

function main() {
  log('MiniBot runner · auto-update every', CONFIG.updateEveryMin, 'min');
  ensureRepo();
  pullIfChanged();
  startBot();

  setInterval(() => {
    if (pullIfChanged()) {
      log('restarting for new code…');
      startBot();
    }
  }, Math.max(1, CONFIG.updateEveryMin) * 60 * 1000);

  process.on('SIGINT', () => {
    shuttingDown = true;
    if (child) child.kill('SIGTERM');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    shuttingDown = true;
    if (child) child.kill('SIGTERM');
    process.exit(0);
  });
}

main();
