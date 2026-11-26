/**
 * Black box: remembers the important events (disconnects, reconnects, watchdog actions, give-ups,
 * crashes, skips) in a small file that survives restarts, so "it just stopped" always has a trail.
 * Installed once at start: it listens to console lines, nothing else has to change.
 */
const store = require('./jsonStore');

const FILE = 'blackbox.json';
const MAX = 300;
const KEEP = /^\[(bot|watchdog|cleanup|reconnect|poll-dead)\]|gave up|^\[cfwd\] (fetch|offline|dropped|skip|cursor|unstuck|retry in)|^\[(uncaughtException|unhandledRejection)\]|^\[cfwd-poll\]/;
let events = null;
let writer = null;

function load() {
  if (events) return events;
  const raw = store.readJson(FILE, []);
  events = Array.isArray(raw) ? raw : [];
  writer = store.debouncedWriter(FILE, () => events, 1500);
  return events;
}

function record(kind, text) {
  load();
  const t = String(text).slice(0, 300);
  const last = events[events.length - 1];
  if (last && last.k === kind && last.m === t) {
    last.n = (last.n || 1) + 1;
    last.at = Date.now();
  } else {
    events.push({ at: Date.now(), k: kind, m: t });
    if (events.length > MAX) events.splice(0, events.length - MAX);
  }
  writer.save();
}

function fmt(args) {
  return args.map((a) => (a && a.stack) || (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch (_) { return String(a); } })())).join(' ');
}

function install() {
  load();
  record('start', 'process started (previous event ' + (events.length ? Math.round((Date.now() - events[events.length - 1].at) / 60000) + ' min before)' : 'none') + ')');
  for (const [name, kind] of [['log', 'info'], ['warn', 'warn'], ['error', 'error']]) {
    const orig = console[name].bind(console);
    console[name] = (...a) => {
      orig(...a);
      try {
        const line = fmt(a);
        if (KEEP.test(line)) record(kind, line);
      } catch (_) {}
    };
  }
  process.on('exit', (code) => { try { record('exit', 'process exit code ' + code); writer.flush(); } catch (_) {} });
}

function recent(n) {
  load();
  return events.slice(-(n || 20));
}

function flush() { load(); writer.flush(); }

module.exports = { install, record, recent, flush };
