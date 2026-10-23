#!/usr/bin/env node
/**
 * Channel Forward — KataBump runner (safe layout)
 * ================================================
 * Place this file at the HOST ROOT (e.g. /home/container/index.js).
 *
 * Layout after start:
 *   ./index.js          ← this runner (you)
 *   ./forwards.json     ← YOUR config (rules, strips, footers) — BACK UP THIS
 *   ./session/          ← WhatsApp auth (survives updates)
 *   ./bot/              ← cloned app code (safe to replace on update)
 *
 * Update only refreshes ./bot — never deletes session/ or forwards.json.
 */

var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var execSync = require('child_process').execSync;

// ─────────────── CONFIG ───────────────
var CONFIG = {
  phone: process.env.PHONE || process.env.OWNER || '923073477752',
  port: Number(process.env.PORT) || 20003,
  repoUrl: process.env.REPO_URL || 'https://github.com/wized2/WhatsApp-MiniBot.git',
  branch: process.env.BRANCH || 'feature/channel-forward',
  updateEveryMin: Number(process.env.UPDATE_EVERY_MIN || 5),
  // subdir under script root for bot source
  botDirName: process.env.BOT_DIR_NAME || 'bot',
  forwardsFileName: process.env.FORWARDS_FILE || 'forwards.json',
  sessionDirName: process.env.SESSION_DIR_NAME || 'session',
};
// ───────────────────────────────────────

// Script root = directory containing this file (KataBump host root)
var SCRIPT_ROOT = path.dirname(process.argv[1] ? path.resolve(process.argv[1]) : process.cwd());
// When required oddly, fall back
try {
  if (require.main && require.main.filename) {
    SCRIPT_ROOT = path.dirname(require.main.filename);
  }
} catch (e) {}

var BOT = path.join(SCRIPT_ROOT, CONFIG.botDirName);
var FORWARDS_JSON = path.join(SCRIPT_ROOT, CONFIG.forwardsFileName);
var SESSION_DIR = path.join(SCRIPT_ROOT, CONFIG.sessionDirName);
var PHONE = String(CONFIG.phone).replace(/\D/g, '');
var PORT = CONFIG.port;
var BRANCH = String(CONFIG.branch);
var REPO = String(CONFIG.repoUrl);

function log() {
  var a = Array.prototype.slice.call(arguments);
  console.log.apply(console, [new Date().toISOString().slice(11, 19)].concat(a));
}

function sh(cmd, opts) {
  opts = opts || {};
  return execSync(cmd, {
    cwd: opts.cwd || BOT,
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: Object.assign({}, process.env, opts.env || {}),
    encoding: 'utf8',
  });
}

function q(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

function ensureForwardsJson() {
  if (!fs.existsSync(FORWARDS_JSON)) {
    // migrate from older locations if present
    var candidates = [
      path.join(SCRIPT_ROOT, 'WhatsApp-ChannelFwd-data', 'data', 'channel-forwards.json'),
      path.join('/tmp', 'WhatsApp-ChannelFwd-data', 'data', 'channel-forwards.json'),
      path.join(BOT, 'data', 'channel-forwards.json'),
      path.join(SCRIPT_ROOT, 'data', 'channel-forwards.json'),
    ];
    var migrated = false;
    for (var i = 0; i < candidates.length; i++) {
      try {
        if (fs.existsSync(candidates[i])) {
          fs.copyFileSync(candidates[i], FORWARDS_JSON);
          log('migrated rules from', candidates[i], '→', FORWARDS_JSON);
          migrated = true;
          break;
        }
      } catch (e) {}
    }
    if (!migrated) {
      fs.writeFileSync(FORWARDS_JSON, '[]\n');
      log('created empty', FORWARDS_JSON);
    }
  }
}

function migrateSession() {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  var olds = [
    path.join(SCRIPT_ROOT, 'WhatsApp-ChannelFwd-data', 'session'),
    path.join('/tmp', 'WhatsApp-ChannelFwd-data', 'session'),
    path.join(BOT, 'session'),
    path.join('/tmp', 'WhatsApp-ChannelFwd-run', 'session'),
  ];
  try {
    var existing = fs.readdirSync(SESSION_DIR);
    if (existing && existing.length) return;
  } catch (e) {}
  for (var i = 0; i < olds.length; i++) {
    try {
      if (!fs.existsSync(olds[i])) continue;
      var files = fs.readdirSync(olds[i]);
      if (!files.length) continue;
      log('migrating session from', olds[i]);
      for (var j = 0; j < files.length; j++) {
        var from = path.join(olds[i], files[j]);
        var to = path.join(SESSION_DIR, files[j]);
        if (!fs.existsSync(to)) {
          fs.copyFileSync(from, to);
        }
      }
      return;
    } catch (e) {
      log('session migrate skip', e.message);
    }
  }
}

function ensureBot() {
  var pkg = path.join(BOT, 'package.json');
  if (!fs.existsSync(pkg)) {
    log('cloning bot into', BOT);
    fs.mkdirSync(SCRIPT_ROOT, { recursive: true });
    if (fs.existsSync(BOT)) {
      // only remove bot code dir, never session/forwards
      try {
        fs.rmSync(BOT, { recursive: true, force: true });
      } catch (e) {}
    }
    sh(
      'git clone --depth 1 -b ' + q(BRANCH) + ' ' + q(REPO) + ' ' + q(BOT),
      { cwd: SCRIPT_ROOT }
    );
  } else {
    try {
      var cur = sh('git rev-parse --abbrev-ref HEAD', { silent: true, cwd: BOT }).trim();
      if (cur !== BRANCH) {
        log('bot branch', cur, '->', BRANCH);
        sh('git fetch --depth 1 origin ' + q(BRANCH), { silent: true, cwd: BOT });
        sh('git checkout -B ' + q(BRANCH) + ' origin/' + BRANCH, { silent: true, cwd: BOT });
      }
    } catch (e) {
      log('branch ensure', e.message);
    }
  }

  // Patch bot config phone/port (does not touch forwards.json)
  var cfgPath = path.join(BOT, 'config.js');
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

  if (!fs.existsSync(path.join(BOT, 'node_modules', 'baileys'))) {
    log('npm install in bot/ …');
    sh('npm install --omit=dev', { cwd: BOT });
  }
}

function gitHead() {
  try {
    return sh('git rev-parse HEAD', { silent: true, cwd: BOT }).trim();
  } catch (e) {
    return '';
  }
}

function pullBotIfChanged() {
  try {
    var before = gitHead();
    sh('git fetch --depth 1 origin ' + q(BRANCH), { silent: true, cwd: BOT });
    sh('git reset --hard origin/' + BRANCH, { silent: true, cwd: BOT });
    var after = gitHead();
    if (before && after && before !== after) {
      log('bot code updated', before.slice(0, 7), '->', after.slice(0, 7));
      try {
        sh('npm install --omit=dev', { cwd: BOT });
      } catch (e) {
        log('npm after update', e.message);
      }
      // re-patch phone/port after hard reset
      ensureBot();
      return true;
    }
  } catch (e) {
    log('update check', e.message);
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
  log('start · phone', PHONE, '· port', PORT);
  log('  bot    ', BOT);
  log('  session', SESSION_DIR);
  log('  rules  ', FORWARDS_JSON);
  child = spawn(process.execPath, ['index.js'], {
    cwd: BOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT),
      PHONE: PHONE,
      OWNER: PHONE,
      PAIR_NUMBER: PHONE,
      SESSION_DIR: SESSION_DIR,
      FORWARDS_JSON: FORWARDS_JSON,
    }),
    stdio: 'inherit',
  });
  child.on('exit', function (code, signal) {
    log('bot exited', code, signal || '');
    child = null;
    if (!shuttingDown) setTimeout(startBot, 3000);
  });
}

function main() {
  log('ChannelFwd runner · branch', BRANCH);
  log('script root', SCRIPT_ROOT);
  ensureForwardsJson();
  migrateSession();
  ensureBot();
  pullBotIfChanged();
  startBot();

  setInterval(function () {
    if (pullBotIfChanged()) {
      log('restarting bot for code update (session + forwards.json kept)');
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
