/**
 * Group anti-NSFW via nsfw-categorize.it (free remote API).
 * Skips: bot/fromMe, group admins, news-like captions (EN + Urdu / long text).
 */
const crypto = require('crypto');

const API_UPLOAD = 'https://nsfw-categorize.it/api/upload';

const DEFAULTS = {
  enabled: true,
  // delete when classification is porn, or nsfw, or either
  deleteOn: 'either', // 'porn' | 'nsfw' | 'either'
  minConfidence: 70,
  minFileBytes: 35 * 1024,
  maxFileBytes: 8 * 1024 * 1024,
  dailyBudget: 180,
  newsMinChars: 90,
  adminCacheMs: 8 * 60 * 1000,
  userCooldownMs: 25 * 1000,
  fastMode: true,
};

// English news-ish markers
const EN_NEWS = [
  /\bbreaking\b/i,
  /\bnews\b/i,
  /\breport(ed|s|ing)?\b/i,
  /\baccording to\b/i,
  /\bsources?\b/i,
  /\bofficials?\b/i,
  /\bgovernment\b/i,
  /\bpolice\b/i,
  /\bministry\b/i,
  /\bparliament\b/i,
  /\belection\b/i,
  /\bcounter-?terror/i,
  /\bupdate[sd]?\b/i,
  /\bheadline\b/i,
  /\bpress release\b/i,
  /\bweather (alert|update|forecast)\b/i,
  /\bdeath toll\b/i,
  /\bcasualt(y|ies)\b/i,
  /\bprotest(ers|s)?\b/i,
  /\bstatement said\b/i,
  /\bin a statement\b/i,
  /\bthe incident\b/i,
  /\balleged(ly)?\b/i,
];

// Urdu / Arabic-script news markers (no word-boundary reliance)
const UR_NEWS = [
  'خبریں',
  'خبر',
  'تازہ',
  'تازه',
  'بریکنگ',
  'بریکنگ نیوز',
  'نیوز',
  'رپورٹ',
  'اپ ڈیٹ',
  'اپڈیٹ',
  'ذرائع',
  'ذریعہ',
  'حکومت',
  'حکومتی',
  'پولیس',
  'وزیر',
  'وزارت',
  'پارلیمان',
  'انتخابات',
  'الیکشن',
  'پریس ریلیز',
  'مطلع کیا',
  'بتایا گیا',
  'کے مطابق',
  'کے مطابق',
  'واقعہ',
  'ہلاکت',
  'زخمی',
  'احتجاج',
  'عہدیدار',
  'فوج',
  'سکیورٹی',
  'سیکیورٹی',
  'موسمیاتی',
  'محکمہ',
];

const adminCache = new Map(); // jid -> { at, admins: Set }
const userCool = new Map(); // participantKey -> ts
let dayKey = '';
let dayCount = 0;
let quotaExhaustedUntil = 0;

function cfgOf(config) {
  const c = (config && config.antiNsfw) || {};
  return { ...DEFAULTS, ...c };
}

function digits(x) {
  return String(x || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function bareJid(x) {
  return String(x || '').split(':')[0].trim();
}

function unwrapMessage(message) {
  let msg = message;
  for (let i = 0; i < 12; i++) {
    if (!msg || typeof msg !== 'object') break;
    if (msg.ephemeralMessage?.message) {
      msg = msg.ephemeralMessage.message;
      continue;
    }
    if (msg.viewOnceMessage?.message) {
      msg = msg.viewOnceMessage.message;
      continue;
    }
    if (msg.viewOnceMessageV2?.message) {
      msg = msg.viewOnceMessageV2.message;
      continue;
    }
    if (msg.viewOnceMessageV2Extension?.message) {
      msg = msg.viewOnceMessageV2Extension.message;
      continue;
    }
    if (msg.documentWithCaptionMessage?.message) {
      msg = msg.documentWithCaptionMessage.message;
      continue;
    }
    break;
  }
  return msg || {};
}

function getImageNode(message) {
  const inner = unwrapMessage(message);
  if (inner.imageMessage) return inner.imageMessage;
  return null;
}

function getCaption(node, message) {
  const c = (node && node.caption) || '';
  if (c) return String(c);
  const inner = unwrapMessage(message);
  return String(inner.imageMessage?.caption || '');
}

/**
 * News-like captions: long text OR strong EN/Urdu news signals.
 */
function isNewsLikeCaption(caption, minChars) {
  const t = String(caption || '').trim();
  if (!t) return false;

  // Long captions are almost always news/forwards/articles in WA groups
  if (t.length >= (minChars || DEFAULTS.newsMinChars)) return true;

  // Multi-paragraph / many lines
  const lines = t.split(/\n+/).filter((l) => l.trim().length > 20);
  if (lines.length >= 3) return true;

  let hits = 0;
  for (const re of EN_NEWS) {
    if (re.test(t)) hits += 1;
  }
  for (const u of UR_NEWS) {
    if (t.includes(u)) hits += 1;
  }

  // One strong hit on medium text, or 2+ hits
  if (hits >= 2) return true;
  if (hits >= 1 && t.length >= 40) return true;
  return false;
}

function rollDay() {
  const k = new Date().toISOString().slice(0, 10);
  if (k !== dayKey) {
    dayKey = k;
    dayCount = 0;
  }
}

function budgetOk(cfg) {
  rollDay();
  if (Date.now() < quotaExhaustedUntil) return false;
  return dayCount < (cfg.dailyBudget || DEFAULTS.dailyBudget);
}

function noteApiUse() {
  rollDay();
  dayCount += 1;
}

function markQuotaExhausted() {
  // free tier resets ~24h after last counted call — pause until next UTC midnight + 1h buffer
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 1, 0, 0));
  quotaExhaustedUntil = next.getTime();
  console.warn('[antiNsfw] free quota exhausted; pausing until', next.toISOString());
}

function senderKey(m, jid) {
  return (
    m.key?.participantPn ||
    m.key?.participant ||
    m.key?.participantLid ||
    m.participant ||
    jid
  );
}

function isBotOwnMessage(m, sock) {
  if (m.key?.fromMe) return true;
  if (!sock?.user) return false;
  const mine = [sock.user.id, sock.user.lid, sock.user.phone]
    .filter(Boolean)
    .map((x) => bareJid(x));
  const cand = [
    m.key?.participant,
    m.key?.participantPn,
    m.key?.participantLid,
    m.key?.remoteJid,
  ]
    .filter(Boolean)
    .map((x) => bareJid(x));
  for (const c of cand) {
    for (const me of mine) {
      if (c && me && (c === me || digits(c) === digits(me))) return true;
    }
  }
  return false;
}

async function loadAdmins(sock, jid, cfg) {
  const hit = adminCache.get(jid);
  if (hit && Date.now() - hit.at < (cfg.adminCacheMs || DEFAULTS.adminCacheMs)) {
    return hit.admins;
  }
  const set = new Set();
  try {
    const meta = await sock.groupMetadata(jid);
    for (const p of meta.participants || []) {
      if (p.admin === 'admin' || p.admin === 'superadmin') {
        set.add(bareJid(p.id));
        set.add(digits(p.id));
        if (p.phoneNumber) {
          set.add(bareJid(p.phoneNumber));
          set.add(digits(p.phoneNumber));
        }
        if (p.lid) {
          set.add(bareJid(p.lid));
        }
      }
    }
  } catch (e) {
    console.warn('[antiNsfw] groupMetadata', jid, e.message || e);
  }
  adminCache.set(jid, { at: Date.now(), admins: set });
  return set;
}

async function isGroupAdmin(sock, m, jid, cfg) {
  const admins = await loadAdmins(sock, jid, cfg);
  if (!admins.size) return false;
  const cands = [
    m.key?.participantPn,
    m.key?.participant,
    m.key?.participantLid,
    m.key?.participantAlt,
    m.participant,
  ]
    .filter(Boolean)
    .flatMap((x) => [bareJid(x), digits(x)]);
  for (const c of cands) {
    if (c && admins.has(c)) return true;
  }
  return false;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function downloadImage(sock, m) {
  const baileys = require('baileys');
  const downloadMediaMessage = baileys.downloadMediaMessage;
  const downloadContentFromMessage = baileys.downloadContentFromMessage;

  const top = m.message || {};
  const inner = unwrapMessage(top);
  const node = inner.imageMessage;
  if (!node) return null;

  const target =
    top.imageMessage
      ? m
      : {
          key: m.key,
          message: { imageMessage: node },
          messageTimestamp: m.messageTimestamp,
        };

  if (typeof downloadMediaMessage === 'function') {
    try {
      const buf = await downloadMediaMessage(
        target,
        'buffer',
        {},
        {
          reuploadRequest: sock.updateMediaMessage
            ? sock.updateMediaMessage.bind(sock)
            : undefined,
        }
      );
      if (buf && buf.length) return Buffer.from(buf);
    } catch (e) {
      console.warn('[antiNsfw] downloadMediaMessage', e.message || e);
    }
  }

  if (typeof downloadContentFromMessage === 'function') {
    try {
      const stream = await downloadContentFromMessage(node, 'image');
      const buffer = await streamToBuffer(stream);
      if (buffer.length) return buffer;
    } catch (e) {
      console.warn('[antiNsfw] downloadContentFromMessage', e.message || e);
    }
  }
  return null;
}

async function classifyImage(buffer, cfg) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  form.append('image', blob, 'image.jpg');

  const url = cfg.fastMode ? `${API_UPLOAD}?fast=1` : API_UPLOAD;
  const headers = {};
  if (cfg.apiKey) headers.NSFWKEY = cfg.apiKey;

  const res = await fetch(url, { method: 'POST', body: form, headers });
  const json = await res.json().catch(() => null);
  if (!json) throw new Error(`HTTP ${res.status} empty body`);

  if (json.status === 'NOQUOTA') {
    markQuotaExhausted();
    return { status: 'NOQUOTA' };
  }
  if (json.status === 'ERR') {
    throw new Error(json.reason || 'API ERR');
  }
  if (json.status !== 'OK') {
    throw new Error(`API status ${json.status}`);
  }

  noteApiUse();
  return {
    status: 'OK',
    nsfw: Boolean(json.data?.nsfw),
    porn: Boolean(json.data?.porn),
    confidence: Number(json.data?.confidence) || 0,
    classification: json.data?.classification || '',
    quota: json.quota ?? json.key_quota,
  };
}

function shouldDelete(result, cfg) {
  if (!result || result.status !== 'OK') return false;
  const conf = result.confidence || 0;
  if (conf < (cfg.minConfidence || 0)) return false;
  const mode = cfg.deleteOn || 'either';
  if (mode === 'porn') return result.porn;
  if (mode === 'nsfw') return result.nsfw || result.porn;
  // either
  return result.porn || result.nsfw;
}

/**
 * Process one inbound message. Safe no-op when not applicable.
 */
async function processMessage(sock, m, config) {
  const cfg = cfgOf(config);
  if (!cfg.enabled) return { skipped: 'disabled' };

  const jid = m.key?.remoteJid;
  if (!jid || !String(jid).endsWith('@g.us')) return { skipped: 'not-group' };
  if (isBotOwnMessage(m, sock)) return { skipped: 'self' };

  const node = getImageNode(m.message);
  if (!node) return { skipped: 'not-image' };

  const caption = getCaption(node, m.message);
  if (isNewsLikeCaption(caption, cfg.newsMinChars)) {
    return { skipped: 'news-caption' };
  }

  if (await isGroupAdmin(sock, m, jid, cfg)) {
    return { skipped: 'admin' };
  }

  if (!budgetOk(cfg)) return { skipped: 'budget' };

  const sk = senderKey(m, jid);
  const now = Date.now();
  const last = userCool.get(sk) || 0;
  if (now - last < (cfg.userCooldownMs || DEFAULTS.userCooldownMs)) {
    return { skipped: 'user-cooldown' };
  }

  let buffer;
  try {
    buffer = await downloadImage(sock, m);
  } catch (e) {
    console.warn('[antiNsfw] download', e.message || e);
    return { skipped: 'download-fail' };
  }
  if (!buffer || !buffer.length) return { skipped: 'download-empty' };

  const minB = cfg.minFileBytes || DEFAULTS.minFileBytes;
  const maxB = cfg.maxFileBytes || DEFAULTS.maxFileBytes;
  if (buffer.length < minB) return { skipped: 'too-small' };
  if (buffer.length > maxB) return { skipped: 'too-large' };

  userCool.set(sk, now);

  let result;
  try {
    result = await classifyImage(buffer, cfg);
  } catch (e) {
    console.warn('[antiNsfw] classify', e.message || e);
    return { skipped: 'api-error', error: e.message };
  }

  if (result.status === 'NOQUOTA') return { skipped: 'noquota' };

  if (!shouldDelete(result, cfg)) {
    return { ok: true, action: 'keep', result };
  }

  try {
    await sock.sendMessage(jid, { delete: m.key });
    console.log(
      '[antiNsfw] deleted',
      jid,
      'from',
      sk,
      result.classification,
      result.confidence
    );
    return { ok: true, action: 'deleted', result };
  } catch (e) {
    console.error('[antiNsfw] delete failed', e.message || e);
    return { ok: false, action: 'delete-failed', error: e.message, result };
  }
}

function status(config) {
  const cfg = cfgOf(config);
  rollDay();
  return {
    enabled: cfg.enabled,
    day: dayKey,
    usedToday: dayCount,
    budget: cfg.dailyBudget,
    quotaPausedUntil: quotaExhaustedUntil || null,
    deleteOn: cfg.deleteOn,
  };
}

function setEnabled(config, on) {
  if (!config.antiNsfw) config.antiNsfw = {};
  config.antiNsfw.enabled = Boolean(on);
  return config.antiNsfw.enabled;
}

module.exports = {
  processMessage,
  isNewsLikeCaption,
  status,
  setEnabled,
  DEFAULTS,
};
