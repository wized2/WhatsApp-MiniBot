#!/usr/bin/env node
/**
 * Channel Forward — KataBump / VPS single-file runner
 * ====================================================
 * Branch: feature/channel-forward
 *
 *   node katabump.js
 *   (or paste this file as index.js on KataBump)
 *
 * IMPORTANT: no shell ${} templates — KataBump/sh can mangle $ vars.
 */

// ─────────────── CONFIG (edit here) ───────────────
const CONFIG = {
  phone: process.env.PHONE || process.env.OWNER || '923073477752',
  port: Number(process.env.PORT) || 20299,
  repoUrl: process.env.REPO_URL || 'https://github.com/wized2/WhatsApp-MiniBot.git',
  branch: process.env.BRANCH || 'feature/channel-forward',
  updateEveryMin: Number(process.env.UPDATE_EVERY_MIN || 5),
  dirName: process.env.BOT_DIR || 'WhatsApp-ChannelFwd-run',
};
// ───────────────────────────────────────────────────

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.env.RUN_ROOT || '/tmp', CONFIG.dirName);
const PHONE = String(CONFIG.phone).replace(/\D/g, '');
const PORT = CONFIG.port;
const BRANCH = String(CONFIG.branch);
const REPO = String(CONFIG.repoUrl);

function log() {
  var a = Array.prototype.slice.call(arguments);
  console.log.apply(console, [new Date().toISOString().slice(11, 19)].concat(a));
}

function sh(cmd, opts) {
  opts = opts || {};
  return execSync(cmd, {
    cwd: opts.cwd || ROOT,
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: Object.assign({}, process.env, opts.env || {}),
    encoding: 'utf8',
  });
}

function q(s) {
  // safe single-quoted shell string
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

function ensureRepo() {
  var pkg = path.join(ROOT, 'package.json');
  if (!fs.existsSync(pkg)) {
    log('cloning', REPO, '@', BRANCH);
    fs.mkdirSync(path.dirname(ROOT), { recursive: true });
    if (fs.existsSync(ROOT)) fs.rmSync(ROOT, { recursive: true, force: true });
    var cloneCmd =
      'git clone --depth 1 -b ' + q(BRANCH) + ' ' + q(REPO) + ' ' + q(ROOT);
    sh(cloneCmd, { cwd: path.dirname(ROOT) });
  } else {
    try {
      var cur = sh('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
      if (cur !== BRANCH) {
        log('switching branch', cur, '->', BRANCH);
        sh('git fetch --depth 1 origin ' + q(BRANCH), { silent: true });
        sh('git checkout -B ' + q(BRANCH) + ' origin/' + BRANCH, { silent: true });
      }
    } catch (e) {
      log('branch ensure', e.message);
    }
  }

  var cfgPath = path.join(ROOT, 'config.js');
  if (fs.existsSync(cfgPath)) {
    var t = fs.readFileSync(cfgPath, 'utf8');
    t = t.replace(/ownerNumber:\s*['"][^'"]*['"]/, "ownerNumber: '" + PHONE + "'");
    t = t.replace(/pairNumber:\s*['"][^'"]*['"]/, "pairNumber: '" + PHONE + "'");
    t = t.replace(
      /port:\s*Number\(process\.env\.PORT\)\s*\|\|\s*\d+/,
      'port: Number(process.env.PORT) || ' + PORT
    );
    fs.writeFileSync(cfgPath, t);
  }

  if (!fs.existsSync(path.join(ROOT, 'node_modules', 'baileys'))) {
    log('npm install...');
    sh('npm install --omit=dev', { cwd: ROOT });
  }
}

function gitHead() {
  try {
    return sh('git rev-parse HEAD', { silent: true }).trim();
  } catch (e) {
    return '';
  }
}

function pullIfChanged() {
  if (!REPO) return false;
  try {
    var before = gitHead();
    sh('git fetch --depth 1 origin ' + q(BRANCH), { silent: true });
    sh('git reset --hard origin/' + BRANCH, { silent: true });
    var after = gitHead();
    if (before && after && before !== after) {
      log('update detected', before.slice(0, 7), '->', after.slice(0, 7));
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

var child = null;
var shuttingDown = false;

function startBot() {
  if (child) {
    try {
      child.kill('SIGTERM');
    } catch (e) {}
    child = null;
  }
  log('starting channel-forward · phone', PHONE, '· port', PORT, '· branch', BRANCH);
  child = spawn(process.execPath, ['index.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT),
      PHONE: PHONE,
      OWNER: PHONE,
      PAIR_NUMBER: PHONE,
    }),
    stdio: 'inherit',
  });
  child.on('exit', function (code, signal) {
    log('bot exited', code, signal || '');
    child = null;
    if (!shuttingDown) {
      setTimeout(startBot, 3000);
    }
  });
}

function main() {
  log('ChannelFwd runner · branch', BRANCH, '· update every', CONFIG.updateEveryMin, 'min');
  ensureRepo();
  pullIfChanged();
  startBot();

  setInterval(function () {
    if (pullIfChanged()) {
      log('restarting for new code...');
      startBot();
    }
  }, Math.max(1, CONFIG.updateEveryMin) * 60 * 1000);

  process.on('SIGINT', function () {
    shuttingDown = true;
    if (child) child.kill('SIGTERM');
    process.exit(0);
  });
  process.on('SIGTERM', function () {
    shuttingDown = true;
    if (child) child.kill('SIGTERM');
    process.exit(0);
  });
}

main();
