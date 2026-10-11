const sessions = new Map();

function setSession(jid, options, ttlMs = 180000) {
  sessions.set(String(jid), {
    options,
    expires: Date.now() + ttlMs,
    byId: Object.fromEntries(
      options.map((o, i) => [String(o.id || 'opt_' + (i + 1)), o])
    ),
  });
}

function consumeSession(jid, choice) {
  const key = String(jid);
  const s = sessions.get(key);
  if (!s) return null;
  if (Date.now() > s.expires) {
    sessions.delete(key);
    return null;
  }
  const raw = String(choice || '').trim();
  if (s.byId && s.byId[raw]) {
    sessions.delete(key);
    return s.byId[raw];
  }
  const n = parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 1 && n <= s.options.length) {
    sessions.delete(key);
    return s.options[n - 1];
  }
  return null;
}

function peekSession(jid) {
  const s = sessions.get(String(jid));
  if (!s || Date.now() > s.expires) {
    if (s) sessions.delete(String(jid));
    return null;
  }
  return s;
}

async function sendMenu(ctx, title, options, opts) {
  const { sendInteractiveMenu } = require('./nativeInteractive');
  return sendInteractiveMenu(ctx, title, options, opts || {});
}

module.exports = { setSession, consumeSession, peekSession, sendMenu, sessions };
