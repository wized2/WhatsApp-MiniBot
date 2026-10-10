const sessions = new Map(); // jid -> { options: [{id,label,run}], expires }

function setSession(jid, options, ttlMs = 120000) {
  sessions.set(jid, { options, expires: Date.now() + ttlMs });
}

function consumeSession(jid, choice) {
  const s = sessions.get(jid);
  if (!s) return null;
  if (Date.now() > s.expires) {
    sessions.delete(jid);
    return null;
  }
  const n = parseInt(String(choice).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > s.options.length) return null;
  const opt = s.options[n - 1];
  sessions.delete(jid);
  return opt;
}

function peekSession(jid) {
  const s = sessions.get(jid);
  if (!s || Date.now() > s.expires) {
    if (s) sessions.delete(jid);
    return null;
  }
  return s;
}

/**
 * Send an interactive-style menu (numbered). Works on all WhatsApp clients.
 * options: [{ label, run(ctx) }]
 */
async function sendMenu(ctx, title, options) {
  const lines = [title, ''];
  options.forEach((o, i) => lines.push((i + 1) + ') ' + o.label));
  lines.push('', 'Reply with a number (1-' + options.length + ')');
  setSession(ctx.jid, options);
  await ctx.reply(lines.join('\n'));
}

module.exports = { setSession, consumeSession, peekSession, sendMenu, sessions };
