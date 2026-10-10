/** Resolve whether a message is from the configured owner. */
function digits(x) {
  return String(x || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function collectCandidates(m, jid, sender, sock) {
  const out = new Set();
  const add = (v) => {
    if (v == null || v === '') return;
    out.add(String(v));
    const d = digits(v);
    if (d) out.add(d);
  };

  add(sender);
  add(jid);
  if (m && m.key) {
    add(m.key.participant);
    add(m.key.participantAlt);
    add(m.key.participantPn);
    add(m.key.remoteJid);
    add(m.key.remoteJidAlt);
    add(m.key.senderLid);
    add(m.key.senderPn);
    add(m.key.participantLid);
  }
  add(m && m.participant);
  add(m && m.sender);
  if (sock && sock.user) {
    add(sock.user.id);
    add(sock.user.lid);
    add(sock.user.phone);
  }
  // nested message contextInfo participant (quoted / mentions)
  try {
    const ctx =
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.contextInfo ||
      {};
    add(ctx.participant);
    add(ctx.remoteJid);
  } catch (_) {}

  return out;
}

function isOwner(ctx) {
  const { m, jid, sender, sock, config: cfg } = ctx || {};
  if (m && m.key && m.key.fromMe) return true;

  const owners = [
    cfg && cfg.ownerNumber,
    cfg && cfg.pairNumber,
    process.env.PHONE,
    process.env.OWNER,
    process.env.PAIR_NUMBER,
  ]
    .map(digits)
    .filter(Boolean);

  if (!owners.length) return true; // no owner configured → open

  const candidates = collectCandidates(m, jid, sender, sock);
  for (const c of candidates) {
    const d = digits(c);
    if (!d) continue;
    for (const o of owners) {
      if (d === o || d.endsWith(o) || o.endsWith(d)) return true;
      // last 10 digits (local form)
      if (d.length >= 10 && o.length >= 10 && d.slice(-10) === o.slice(-10)) return true;
    }
  }

  // DM with bot: if chat jid is the owner number, treat as owner
  const jidD = digits(jid);
  for (const o of owners) {
    if (jidD && (jidD === o || jidD.slice(-10) === o.slice(-10))) {
      // only if not a group
      if (jid && !String(jid).endsWith('@g.us')) return true;
    }
  }

  return false;
}

module.exports = { isOwner, digits };
