/**
 * Global on/idle switch. `.stop` makes the bot idle: no forwarding, no polling work,
 * no moderation, no games. Only owner control commands still answer.
 * Persisted so a restart does not silently wake the bot up.
 */
const store = require('./jsonStore');

const FILE = 'bot-state.json';
let state = null;
const listeners = [];

function load() {
  if (state) return state;
  const raw = store.readJson(FILE, {});
  state = {
    idle: raw.idle === true,
    since: Number(raw.since) || 0,
    by: raw.by ? String(raw.by) : '',
  };
  return state;
}

function isIdle() {
  return load().idle;
}

function getState() {
  return { ...load() };
}

function setIdle(idle, by) {
  const s = load();
  const next = !!idle;
  if (s.idle === next) return false;
  s.idle = next;
  s.since = Date.now();
  s.by = by ? String(by) : '';
  try {
    store.writeJson(FILE, s);
  } catch (e) {
    console.warn('[botState] save', e.message);
  }
  for (const fn of listeners) {
    try {
      fn(next);
    } catch (_) {}
  }
  return true;
}

function onChange(fn) {
  listeners.push(fn);
}

function _resetForTests() {
  state = null;
  listeners.length = 0;
}

module.exports = { isIdle, getState, setIdle, onChange, _resetForTests };
