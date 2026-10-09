#!/usr/bin/env node
/**
 * KataBump one-file bootstrap — pulls latest WhatsApp-MiniBot from GitHub and runs it.
 *
 * Usage on KataBump (or any host):
 *   1. Create app with Node
 *   2. Set start command:  node katabump.js
 *   3. Set PORT=20299 (or leave default below)
 *   4. Optional env: REPO_URL, BRANCH, PAIR_NUMBER, OWNER_NUMBER, PUBLIC_URL
 *
 * Session is kept in ./session so redeploys stay linked.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = process.env.REPO_URL || 'https://github.com/wized2/WhatsApp-MiniBot.git';
const BRANCH = process.env.BRANCH || 'main';
const PORT = process.env.PORT || '20299';
const APP_DIR = path.join(__dirname, 'minibot-app');

process.env.PORT = String(PORT);
process.env.HOST = process.env.HOST || '0.0.0.0';

function run(cmd, opts = {}) {
  console.log('[boot]', cmd);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function ensureRepo() {
  if (!fs.existsSync(path.join(APP_DIR, 'package.json'))) {
    run(`git clone --depth 1 --branch ${BRANCH} ${REPO} "${APP_DIR}"`);
  } else {
    try {
      run(`git -C "${APP_DIR}" fetch origin ${BRANCH}`);
      run(`git -C "${APP_DIR}" reset --hard origin/${BRANCH}`);
    } catch (e) {
      console.warn('[boot] git update failed, using existing tree', e.message);
    }
  }
}

function install() {
  run('npm install --omit=dev', { cwd: APP_DIR });
}

// Persist session outside replaceable tree if possible
function linkSession() {
  const persistent = path.join(__dirname, 'session');
  const appSession = path.join(APP_DIR, 'session');
  fs.mkdirSync(persistent, { recursive: true });
  if (fs.existsSync(appSession) && !fs.lstatSync(appSession).isSymbolicLink()) {
    // merge once
    try {
      for (const f of fs.readdirSync(appSession)) {
        const dest = path.join(persistent, f);
        if (!fs.existsSync(dest)) fs.renameSync(path.join(appSession, f), dest);
      }
      fs.rmSync(appSession, { recursive: true, force: true });
    } catch (_) {}
  }
  try {
    if (fs.existsSync(appSession)) fs.rmSync(appSession, { recursive: true, force: true });
    fs.symlinkSync(persistent, appSession, 'junction');
  } catch (e) {
    // fallback: copy path via env
    process.env.SESSION_DIR = persistent;
  }
}

console.log('[boot] MiniBot KataBump launcher');
console.log('[boot] PORT=', PORT, 'REPO=', REPO, 'BRANCH=', BRANCH);
ensureRepo();
install();
linkSession();

const child = spawn(process.execPath, ['index.js'], {
  cwd: APP_DIR,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(PORT),
    HOST: '0.0.0.0',
  },
});

child.on('exit', (code) => {
  console.error('[boot] bot exited', code);
  process.exit(code || 1);
});
