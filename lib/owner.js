/** Resolve whether a message is from the configured owner. */

function digits(x) {
  return String(x || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function bare(x) {
  return String(x || '')
    .split(':')[0]
    .trim();
}

function collectCandidates(m, jid, sender, sock) {
  const out = new Set();
  const add = (v) => {
    if (v == null || v === '') return;
    const s = String(v);
    out.add(s);
    out.add(bare(s));
    const d = digits(s);
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
    // baileys sometimes nests
    if (sock.user.id) add(sock.user.id.split(':')[0] + '@s.whatsapp.net');
  }
  try {
    const ctx =
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.contextInfo ||
      {};
    add(ctx.participant);
    add(ctx.remoteJid);
    add(ctx.participantPn);
  } catch (_) {}

  return out;
}

/**
 * Accepts either full handler ctx OR legacy (sender, config) mistake — both work.
 */
function isOwner(ctxOrSender, maybeConfig) {
  // Full ctx object (correct)
  let m, jid, sender, sock, cfg;
  if (ctxOrSender && typeof ctxOrSender === 'object' && !Array.isArray(ctxOrSender)) {
    m = ctxOrSender.m;
    jid = ctxOrSender.jid;
    sender = ctxOrSender.sender;
    sock = ctxOrSender.sock;
    cfg = ctxOrSender.config || maybeConfig;
    // fromMe = message from the linked device (YOU chat / same phone)
    if (m && m.key && m.key.fromMe) return true;
  } else {
    // Legacy wrong call: isOwner(sender, config)
    sender = ctxOrSender;
    cfg = maybeConfig;
  }

  const owners = [
    cfg && cfg.ownerNumber,
    cfg && cfg.pairNumber,
    process.env.PHONE,
    process.env.OWNER,
    process.env.PAIR_NUMBER,
  ]
    .map(digits)
    .filter(Boolean);

  const candidates = collectCandidates(m, jid, sender, sock);

  // Also treat bot's own LID as owner when comparing sender LID
  if (sock && sock.user && sock.user.lid) {
    const myLid = bare(sock.user.lid);
    for (const c of candidates) {
      if (bare(c) === myLid || String(c).includes(myLid.replace('@lid', ''))) {
        return true;
      }
    }
  }

  if (!owners.length) return true;

  for (const c of candidates) {
    const d = digits(c);
    if (!d) continue;
    for (const o of owners) {
      if (d === o || d.endsWith(o) || o.endsWith(d)) return true;
      if (d.length >= 10 && o.length >= 10 && d.slice(-10) === o.slice(-10)) return true;
    }
  }

  // DM "chat with self" / note: remoteJid is owner phone
  const jidD = digits(jid);
  if (jid && !String(jid).endsWith('@g.us') && !String(jid).endsWith('@newsletter')) {
    for (const o of owners) {
      if (jidD && (jidD === o || jidD.slice(-10) === o.slice(-10))) return true;
    }
  }

  // Sender string alone (group participant or DM)
  const senderD = digits(sender);
  for (const o of owners) {
    if (senderD && (senderD === o || senderD.slice(-10) === o.slice(-10))) return true;
  }

  return false;
}

module.exports = { isOwner, digits };
