/** Tiny atomic JSON files next to the rules file (survives restarts, never half-written). */
const fs = require('fs');
const path = require('path');

function dataDir() {
  if (process.env.FORWARDS_JSON) return path.dirname(path.resolve(process.env.FORWARDS_JSON));
  return path.join(__dirname, '..', 'data');
}

function filePath(name) {
  return path.join(dataDir(), name);
}

function readJson(name, fallback) {
  const p = filePath(name);
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    // Keep the broken file for inspection instead of silently losing state
    try {
      fs.copyFileSync(p, p + '.corrupt-' + Date.now());
    } catch (_) {}
    console.warn('[store] unreadable', name, e.message);
    return fallback;
  }
}

function writeJson(name, obj) {
  const p = filePath(name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, p);
}

/** Debounced writer: call save() freely, disk is hit at most every `ms`. flush() forces it. */
function debouncedWriter(name, getValue, ms) {
  let timer = null;
  const write = () => {
    timer = null;
    try {
      writeJson(name, getValue());
    } catch (e) {
      console.warn('[store] write', name, e.message);
    }
  };
  return {
    save() {
      if (timer) return;
      timer = setTimeout(write, ms || 400);
      if (timer.unref) timer.unref();
    },
    flush() {
      if (timer) clearTimeout(timer);
      write();
    },
  };
}

module.exports = { dataDir, filePath, readJson, writeJson, debouncedWriter };
