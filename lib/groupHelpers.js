/**
 * Group admin helpers + simple warn store (JSON).
 */
const fs = require('fs');
const path = require('path');

const WARNS_PATH = path.join(__dirname, '..', 'data', 'warns.json');
const MAX_WARNS = 3;

function ensureDataDir() {
  const dir = path.dirname(WARNS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadWarns() {
  try {
    ensureDataDir();
    if (!fs.existsSync(WARNS_PATH)) return {};
    return JSON.parse(fs.readFileSync(WARNS_PATH, 'utf8') || '{}');
  } catch (_) {
    return {};
  }
}

function saveWarns(data) {
  ensureDataDir();
  fs.writeFileSync(WARNS_PATH, JSON.stringify(data, null, 2));
}

function bare(jid) {
  return String(jid || '')
    .split(':')[0]
    .split('@')[0]
    .replace(/\D/g, '');
}

function toUserJid(input) {
  if (!input) return null;
  let s = String(input).trim();
  if (s.startsWith('@')) s = s.slice(1);
  // already a jid
  if (s.includes('@')) {
    if (s.endsWith('@s.whatsapp.net') || s.endsWith('@lid')) return s;
    // newsletter / group not a user
    return null;
  }
  const d = s.replace(/\D/g, '');
  if (d.length < 8) return null;
  return d + '@s.whatsapp.net';
}

/**
 * Collect target JIDs from mentions, quoted participant, or args (numbers).
 */
function getTargets(m, args) {
  const out = [];
  const seen = new Set();
  const add = (j) => {
    const jid = toUserJid(j) || (String(j || '').includes('@') ? String(j) : null);
    if (!jid) return;
    const key = bare(jid) || jid;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(jid);
  };

  const ctx =
    m?.message?.extendedTextMessage?.contextInfo ||
    m?.message?.imageMessage?.contextInfo ||
    m?.message?.videoMessage?.contextInfo ||
    m?.message?.contextInfo ||
    {};

  const mentioned = ctx.mentionedJid || [];
  for (const j of mentioned) add(j);
  if (ctx.participant) add(ctx.participant);
  if (ctx.participantPn) add(ctx.participantPn);

  // quoted key participant
  const q = ctx.quotedMessage ? ctx : null;
  if (ctx.stanzaId && ctx.participant) add(ctx.participant);

  for (const a of args || []) {
    if (!a || a.startsWith('-')) continue;
    add(a);
  }

  return out;
}

function isGroupJid(jid) {
  return String(jid || '').endsWith('@g.us');
}

async function getMetadata(sock, jid) {
  return sock.groupMetadata(jid);
}

function participantRole(meta, userJid) {
  if (!meta || !meta.participants) return { isAdmin: false, isSuper: false, exists: false };
  const b = bare(userJid);
  const p = meta.participants.find((x) => {
    const id = bare(x.id) || bare(x.jid) || bare(x.phoneNumber);
    const lid = bare(x.lid);
    return id === b || lid === b || String(x.id) === String(userJid);
  });
  if (!p) return { isAdmin: false, isSuper: false, exists: false };
  const admin = p.admin === 'admin' || p.admin === 'superadmin' || p.isAdmin || p.isSuperAdmin;
  const superA = p.admin === 'superadmin' || p.isSuperAdmin;
  return { isAdmin: !!admin, isSuper: !!superA, exists: true, raw: p };
}

async function assertGroupAdmin(ctx) {
  const { sock, jid, sender, m, reply } = ctx;
  if (!isGroupJid(jid)) {
    await reply('Group only.');
    return null;
  }
  let meta;
  try {
    meta = await getMetadata(sock, jid);
  } catch (e) {
    await reply('Could not read group info: ' + (e.message || e));
    return null;
  }

  const botId = sock.user?.id || '';
  const botLid = sock.user?.lid || '';
  const botRole = participantRole(meta, botId);
  const botRole2 = botLid ? participantRole(meta, botLid) : { isAdmin: false };
  if (!botRole.isAdmin && !botRole2.isAdmin) {
    await reply('I need to be a *group admin* to do that.');
    return null;
  }

  // sender admin OR owner (fromMe)
  const fromMe = !!(m && m.key && m.key.fromMe);
  const senderRole = participantRole(meta, sender);
  // also try participant from key
  const keyPart = m?.key?.participant || m?.key?.participantPn;
  const senderRole2 = keyPart ? participantRole(meta, keyPart) : { isAdmin: false };

  if (!fromMe && !senderRole.isAdmin && !senderRole2.isAdmin) {
    await reply('Admins only.');
    return null;
  }

  return meta;
}

function warnKey(groupJid, userJid) {
  return `${groupJid}::${bare(userJid) || userJid}`;
}

function addWarn(groupJid, userJid, by, reason) {
  const data = loadWarns();
  const k = warnKey(groupJid, userJid);
  if (!data[k]) data[k] = { count: 0, history: [] };
  data[k].count += 1;
  data[k].history.push({
    at: Date.now(),
    by: String(by || ''),
    reason: String(reason || '').slice(0, 200),
  });
  // keep last 10
  if (data[k].history.length > 10) data[k].history = data[k].history.slice(-10);
  saveWarns(data);
  return data[k];
}

function clearWarns(groupJid, userJid) {
  const data = loadWarns();
  const k = warnKey(groupJid, userJid);
  const prev = data[k];
  delete data[k];
  saveWarns(data);
  return prev || { count: 0, history: [] };
}

function getWarns(groupJid, userJid) {
  const data = loadWarns();
  const k = warnKey(groupJid, userJid);
  return data[k] || { count: 0, history: [] };
}

function listGroupWarns(groupJid) {
  const data = loadWarns();
  const prefix = groupJid + '::';
  const out = [];
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith(prefix) && v.count > 0) {
      out.push({ user: k.slice(prefix.length), count: v.count, history: v.history });
    }
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

module.exports = {
  MAX_WARNS,
  isGroupJid,
  getTargets,
  toUserJid,
  bare,
  assertGroupAdmin,
  participantRole,
  addWarn,
  clearWarns,
  getWarns,
  listGroupWarns,
  getMetadata,
};
