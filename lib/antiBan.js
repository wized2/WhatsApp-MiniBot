/**
 * Lightweight anti-ban helpers:
 * - per-chat rate limit
 * - global send queue with jitter
 * - API command cooldown
 * - truncate long group replies
 */

const perChat = new Map(); // jid -> { count, windowStart }
const apiCool = new Map(); // key -> lastTs
let lastSend = 0;
let queue = Promise.resolve();

const CFG = {
  maxPerMinute: 12,
  minGapMs: 450,
  maxGapMs: 1400,
  apiCooldownMs: 2500,
  groupMaxChars: 3500,
};

function allowCommand(jid) {
  const now = Date.now();
  let s = perChat.get(jid);
  if (!s || now - s.windowStart > 60000) {
    s = { count: 0, windowStart: now };
    perChat.set(jid, s);
  }
  if (s.count >= CFG.maxPerMinute) {
    return { ok: false, waitMs: 60000 - (now - s.windowStart) };
  }
  s.count += 1;
  return { ok: true };
}

function allowApi(key) {
  const now = Date.now();
  const last = apiCool.get(key) || 0;
  if (now - last < CFG.apiCooldownMs) {
    return { ok: false, waitMs: CFG.apiCooldownMs - (now - last) };
  }
  apiCool.set(key, now);
  return { ok: true };
}

function jitter() {
  return CFG.minGapMs + Math.floor(Math.random() * (CFG.maxGapMs - CFG.minGapMs));
}

function enqueueSend(fn) {
  queue = queue.then(async () => {
    const gap = jitter();
    const wait = Math.max(0, lastSend + gap - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      return await fn();
    } finally {
      lastSend = Date.now();
    }
  }).catch((e) => {
    console.error('[antiBan queue]', e.message || e);
  });
  return queue;
}

function softText(text, isGroup) {
  let t = String(text || '');
  if (isGroup && t.length > CFG.groupMaxChars) {
    t = t.slice(0, CFG.groupMaxChars - 20) + '\n… (trimmed)';
  }
  return t;
}

function isGroup(jid) {
  return String(jid || '').endsWith('@g.us');
}

module.exports = {
  CFG,
  allowCommand,
  allowApi,
  enqueueSend,
  softText,
  isGroup,
  jitter,
};
