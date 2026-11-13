const fs = require('fs');
const path = require('path');
const { extractText } = require('./pluginLoader');

/** Prefer env FORWARDS_JSON (root backup file), else data/channel-forwards.json */
function storePath() {
  if (process.env.FORWARDS_JSON) return path.resolve(process.env.FORWARDS_JSON);
  return path.join(__dirname, '..', 'data', 'channel-forwards.json');
}

function loadRules() {
  try {
    const p = storePath();
    if (!fs.existsSync(p)) return [];
    const list = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('[cfwd] loadRules', e.message);
    return [];
  }
}

function saveRules(rules) {
  const p = storePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rules, null, 2));
  fs.renameSync(tmp, p);
}

function settingsPath() {
  if (process.env.CFWD_SETTINGS_JSON) return path.resolve(process.env.CFWD_SETTINGS_JSON);
  // Sibling of forwards file
  const base = storePath();
  return path.join(path.dirname(base), 'cfwd-settings.json');
}

const DEFAULT_SETTINGS = {
  // Strip WhatsApp channel/group/invite links from forwarded text, and skip
  // posts that are only a link (no other text and no media).
  stripLinks: false,
};

function loadSettings() {
  try {
    const p = settingsPath();
    if (!fs.existsSync(p)) return { ...DEFAULT_SETTINGS };
    const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...(obj && typeof obj === 'object' ? obj : {}) };
  } catch (e) {
    console.warn('[cfwd] loadSettings', e.message);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  const p = settingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(merged, null, 2));
  fs.renameSync(tmp, p);
  return merged;
}

/** WhatsApp channel / group / invite / wa.me URLs */
const WA_LINK_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:chat\.)?whatsapp\.com\/(?:channel|invite|g)\/[\w\-/=?&%.]+|(?:https?:\/\/)?(?:www\.)?wa\.me\/[\w\-/=?&%.]+|(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[\w\-]+(?:\/\d+)?/gi;

function stripWaLinks(text) {
  let out = String(text || '');
  out = out.replace(WA_LINK_RE, '');
  // Collapse leftover empty lines / extra spaces
  out = out
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join('\n')
    .trim();
  return out;
}

/** True when text is empty or only whitespace/punctuation after link strip. */
function isLinkOnlyText(text) {
  const stripped = stripWaLinks(text);
  if (!stripped) return true;
  // Only punctuation / bullets left
  const core = stripped.replace(/[\s\p{P}\p{S}]+/gu, '');
  return core.length === 0;
}

/** Count WhatsApp channel/group/invite links in text. */
function countWaLinks(text) {
  const s = String(text || '');
  const re = new RegExp(WA_LINK_RE.source, 'gi');
  const m = s.match(re);
  return m ? m.length : 0;
}

/**
 * Detect channel promo / “join us” posts (intro blurbs + group/channel links).
 * Tuned for Urdu + English channel bios that are not real news items.
 */
function isPromoInviteMessage(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;

  const linkCount = countWaLinks(raw);
  const plain = plainForMatch(raw).toLowerCase();

  // Strong invite / follow / share language (EN + Urdu)
  const promoRe =
    /\b(join|follow|subscribe|share|invite|whatsapp group|whatsapp channel|channel link|group link|click (here|the )?link|link in bio|to the point|100%\s*non[- ]?political)\b|جوائن|جوائین|فالو|شیئر|شئیر|چینل کا لنک|گروپ کا لنک|گروپ کو بھی|چینل کے لنک|ہمارے (گروپ|چینل)|لنک\s*:|چینل ایڈمن|غیر سیاسی|اب آپ کی جیب|وقت ضائع|مستند ٹو دی پوائنٹ|کم شئیر|ویڈیوز اور تصاویر بہت کم|جیب میں/i;

  const promoHits = (raw.match(promoRe) || []).length;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Brand / official channel bio markers
  const brandHit =
    /مرغوب|margob|marghob|margub|آفیشل|آفیشیل|official/.test(plain) &&
    (linkCount >= 1 || promoHits >= 1 || /چینل|channel|گروپ|group/.test(plain));

  // Score: higher = more likely spam bio
  let score = 0;
  score += linkCount * 3;
  score += Math.min(promoHits, 8) * 2;
  if (brandHit) score += 4;
  if (lines.length >= 8 && linkCount >= 1) score += 2;
  if (lines.length >= 12) score += 1;
  // repeated footer noise
  if (lines.length) {
    const norm = lines.map((l) => plainForMatch(l).toLowerCase());
    const uniq = new Set(norm);
    if (uniq.size <= 4 && lines.length >= 5) score += 2;
    const footerDup = norm.filter((l) => l && norm.filter((x) => x === l).length >= 3);
    if (footerDup.length) score += 2;
  }

  if (linkCount >= 2) return true;
  if (linkCount >= 1 && promoHits >= 1) return true;
  if (brandHit && (linkCount >= 1 || promoHits >= 2)) return true;
  if (score >= 8) return true;
  if (promoHits >= 3 && lines.length >= 4) return true;

  const stripped = stripWaLinks(stripHardcodedNames(raw));
  if (stripped) {
    const strippedPromo = (stripped.match(promoRe) || []).length;
    const core = stripped.replace(/[\s\p{P}\p{S}]+/gu, '');
    if (linkCount >= 1 && core.length < 100 && strippedPromo >= 1) return true;
    if (linkCount >= 1 && strippedPromo >= 2 && core.length < 280) return true;
    // After cleaning links+brand, almost nothing left → was a promo shell
    if (linkCount >= 1 && core.length < 40) return true;
  }

  return false;
}

/** Skip forwarding this text post under global stripLinks mode. */
function shouldSkipAsLinkSpam(text, hasMedia) {
  if (hasMedia) return false; // still allow media; caption is cleaned separately
  if (isLinkOnlyText(text)) return true;
  if (isPromoInviteMessage(text)) return true;
  return false;
}


function isChannelJid(jid) {
  if (typeof jid !== 'string') return false;
  return jid.endsWith('@newsletter') || jid.includes('@newsletter');
}

function parseChannelLink(input) {
  const s = String(input || '').trim();
  if (!s) return null;
  if (isChannelJid(s)) return { inviteCode: null, postId: null, jid: s };
  const m = s.match(
    /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]+)(?:\/(\d+))?/i
  );
  if (!m) return null;
  return { inviteCode: m[1], postId: m[2] || null, jid: null };
}

async function resolveChannelFromLink(sock, input) {
  const parsed = parseChannelLink(input);
  if (!parsed) {
    const bare = String(input || '').trim();
    if (/^[A-Za-z0-9_-]{10,}$/.test(bare) && !bare.includes('@')) {
      return resolveInvite(sock, bare, null);
    }
    throw new Error('Not a channel link. Example: https://whatsapp.com/channel/XXXX');
  }
  if (parsed.jid) {
    return { jid: parsed.jid, inviteCode: null, postId: parsed.postId, meta: null };
  }
  return resolveInvite(sock, parsed.inviteCode, parsed.postId);
}

async function resolveInvite(sock, inviteCode, postId) {
  if (!sock || typeof sock.newsletterMetadata !== 'function') {
    throw new Error('Socket has no newsletterMetadata — update Baileys or pair again.');
  }
  const meta = await sock.newsletterMetadata('invite', inviteCode);
  const jid =
    meta?.id ||
    meta?.jid ||
    meta?.newsletterJid ||
    (typeof meta?.id === 'string' && !meta.id.includes('@')
      ? meta.id + '@newsletter'
      : null);
  if (!jid) {
    throw new Error('Could not resolve channel id from link.');
  }
  const normalized = isChannelJid(jid) ? jid : String(jid).replace(/@.*/, '') + '@newsletter';
  return {
    jid: normalized,
    inviteCode,
    postId: postId || null,
    meta,
    name: meta?.name || meta?.subject || null,
  };
}

function unwrapMessage(message) {
  let msg = message;
  for (let i = 0; i < 12; i++) {
    if (!msg || typeof msg !== 'object') break;
    if (msg.ephemeralMessage?.message) { msg = msg.ephemeralMessage.message; continue; }
    if (msg.viewOnceMessage?.message) { msg = msg.viewOnceMessage.message; continue; }
    if (msg.viewOnceMessageV2?.message) { msg = msg.viewOnceMessageV2.message; continue; }
    if (msg.viewOnceMessageV2Extension?.message) { msg = msg.viewOnceMessageV2Extension.message; continue; }
    if (msg.documentWithCaptionMessage?.message) { msg = msg.documentWithCaptionMessage.message; continue; }
    if (msg.editedMessage?.message) { msg = msg.editedMessage.message; continue; }
    if (msg.groupMentionedMessage?.message) { msg = msg.groupMentionedMessage.message; continue; }
    if (msg.botInvokeMessage?.message) { msg = msg.botInvokeMessage.message; continue; }
    if (msg.associatedChildMessage?.message) { msg = msg.associatedChildMessage.message; continue; }
    break;
  }
  return msg || {};
}

function getCaptionOrText(message) {
  const text = extractText(message);
  if (text) return text;
  const msg = unwrapMessage(message);
  return (
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.extendedTextMessage?.text ||
    msg.conversation ||
    ''
  );
}

function toBoldLine(label) {
  let s = String(label || '').trim();
  if (!s) return '';
  if (/^\*[^*]+\*$/.test(s)) return s;
  s = s.replace(/^\*+|\*+$/g, '');
  return `*${s}*`;
}

function stripEmojis(text) {
  return String(text || '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/[\u{20E3}]/gu, '')
    .replace(/[\u{E0020}-\u{E007F}]/gu, '');
}

/** Always removed from every forward (any WA formatting). */
const HARDCODED_STRIP_PHRASES = [
  'مرغوب بن یوسف',
  'مرغوب بن يوسف',
  'مرغوب بن یوسف آفیشل',
  'مرغوب بن يوسف آفیشل',
  'مرغوب بن یوسف آفیشیل',
  'margob bin yousuf',
  'margob bin yousaf',
  'margob bin yusuf',
  'marghob bin yousuf',
  'margub bin yousuf',
  'margob bin yousuf official',
  'margob bin yousaf official',
  'margob official',
  'pakistan news & updates',
  'pakistan news and updates',
];

/** Strip * _ ~ ` formatting around letters for matching. */
function plainForMatch(s) {
  return String(s || '')
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove hardcoded brand/name tokens in any mix of bold/italic/strike/plain
 * and drop whole lines that are only that brand.
 */
function stripHardcodedNames(text) {
  let out = String(text || '');
  // Build flexible regex per phrase: allow optional WA format chars between letters
  for (const phrase of HARDCODED_STRIP_PHRASES) {
    const chars = [...phrase];
    const body = chars
      .map((ch) => {
        if (/\s/.test(ch)) return '[\\s*_~`|\\-–—]*';
        // escape regex special
        const e = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return e + '[*_~`]*';
      })
      .join('');
    try {
      const re = new RegExp(body, 'gi');
      out = out.replace(re, ' ');
    } catch (_) {
      // fallback plain
      out = out.split(phrase).join(' ');
    }
  }
  // Drop lines that are empty or only separators / leftover brand crumbs
  out = out
    .split(/\r?\n/)
    .map((line) => {
      let L = line.replace(/[ \t]{2,}/g, ' ').trim();
      // dangling separators after name removal: "📍 |" or "| official"
      L = L.replace(/^\s*[|•·]+\s*/g, '').replace(/\s*[|•·]+\s*$/g, '');
      L = L.replace(/\s*[|•·]\s*/g, ' ');
      L = L.replace(/(?:^|\s)(?:official|آفیشل|آفیشیل)(?=\s|$)/gi, ' ');
      // orphan WA format markers
      L = L.replace(/(^|[\s])[*_~`]{1,3}(?=[\s]|$)/g, ' ');
      L = L.replace(/[ \t]{2,}/g, ' ').trim();
      L = L.replace(/^\s*[|•·\-–—:]+\s*$/g, '').trim();
      return L;
    })
    .filter((line) => {
      const p = plainForMatch(line).toLowerCase();
      if (!p) return false;
      if (/^(official|آفیشل|آفیشیل|updates?)$/i.test(p)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return out;
}

function applyStrips(text, rule) {
  let out = String(text || '');
  // Always: hardcoded channel brand / person name (any format)
  out = stripHardcodedNames(out);

  if (rule.stripEmojis) out = stripEmojis(out);

  const phrases = []
    .concat(rule.stripPhrases || [])
    .concat(rule.stripNames || [])
    .concat(rule.channelName ? [rule.channelName] : [])
    .map((p) => String(p || '').trim())
    .filter(Boolean);

  if (phrases.length && rule.stripLines !== false) {
    const lines = out.split(/\r?\n/);
    out = lines
      .filter((line) => {
        const low = plainForMatch(line).toLowerCase();
        return !phrases.some((p) => low.includes(String(p).toLowerCase()));
      })
      .join('\n');
  } else if (phrases.length) {
    for (const p of phrases) {
      const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      out = out.replace(re, '');
    }
  }
  if (rule.stripUrls) out = out.replace(/https?:\/\/\S+/gi, '');
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function transformText(text, rule, settings) {
  let out = applyStrips(text, rule);
  const st = settings || loadSettings();
  if (st.stripLinks) out = stripWaLinks(out);
  if (Array.isArray(rule.replace) && rule.replace.length) {
    for (const pair of rule.replace) {
      if (!pair || pair.from == null) continue;
      out = out.split(String(pair.from)).join(String(pair.to ?? ''));
    }
  }
  if (rule.prefix) out = String(rule.prefix) + out;
  const footerRaw =
    rule.footer != null ? rule.footer : rule.footerText != null ? rule.footerText : null;
  if (footerRaw != null && String(footerRaw).length) {
    const bold = rule.footerBold !== false;
    const line = bold ? toBoldLine(footerRaw) : String(footerRaw).trim();
    out = out.replace(/\s+$/g, '');
    out = out ? out + '\n\n' + line : line;
  } else if (rule.suffix) {
    out = out + String(rule.suffix);
  }
  return out.trim();
}



function mediaKind(msg) {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.imageMessage) return 'image';
  if (msg.videoMessage) return 'video';
  if (msg.documentMessage) return 'document';
  if (msg.audioMessage) return 'audio';
  if (msg.stickerMessage) return 'sticker';
  if (msg.ptvMessage) return 'ptv';
  return null;
}

function mediaNode(msg) {
  if (!msg) return null;
  return (
    msg.imageMessage ||
    msg.videoMessage ||
    msg.documentMessage ||
    msg.audioMessage ||
    msg.stickerMessage ||
    msg.ptvMessage ||
    null
  );
}

/** WAMessage shape downloadMediaMessage expects (media on message root). */
function messageForDownload(m) {
  const top = m.message || {};
  if (mediaKind(top)) return m;
  const inner = unwrapMessage(top);
  if (mediaKind(inner)) {
    return {
      key: m.key,
      message: inner,
      messageTimestamp: m.messageTimestamp,
      pushName: m.pushName,
    };
  }
  return m;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toBase64(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try {
    return Buffer.from(v).toString('base64');
  } catch (_) {
    return '';
  }
}

function hasMediaKey(node) {
  const k = node && node.mediaKey;
  if (!k) return false;
  return typeof k === 'string' ? k.length > 0 : k.length > 0;
}

async function fetchPlain(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Channel (newsletter) media is NOT end-to-end encrypted: the node has url/directPath
 * but no mediaKey, so Baileys' keyed download helpers always throw for it.
 * Strategy: plain HTTPS fetch first (with sha256 check), keyed helpers only when a key exists.
 * Returns { buffer, kind, node } or null.
 */
async function downloadMedia(sock, m) {
  const baileys = require('baileys');
  const target = messageForDownload(m);
  const msg = unwrapMessage(target.message);
  const kind = mediaKind(msg);
  const node = mediaNode(msg);
  if (!kind || !node) {
    console.warn('[cfwd] no media node on message');
    return null;
  }
  const done = (buffer) => ({ buffer, kind, node: msg });
  const wantSha = toBase64(node.fileSha256);

  if (!hasMediaKey(node)) {
    const urls = [];
    if (node.directPath) {
      try {
        urls.push(baileys.getUrlFromDirectPath(node.directPath));
      } catch (_) {
        urls.push('https://mmg.whatsapp.net' + node.directPath);
      }
    }
    if (node.url) urls.push(node.url);
    for (let attempt = 0; attempt < 3; attempt++) {
      for (const u of urls) {
        try {
          const buffer = await fetchPlain(u);
          if (!buffer.length) continue;
          if (wantSha) {
            const got = require('crypto').createHash('sha256').update(buffer).digest('base64');
            if (got !== wantSha) {
              console.warn('[cfwd] media sha mismatch, retrying');
              continue;
            }
          }
          console.log('[cfwd] media via plain fetch', kind, buffer.length);
          return done(buffer);
        } catch (e) {
          console.warn('[cfwd] plain media fetch', e.message || e);
        }
      }
      await sleep(700 * (attempt + 1));
    }
    return null;
  }

  // Keyed (encrypted) media: refresh CDN info once, then the stock helpers.
  let base = m;
  try {
    if (typeof sock.updateMediaMessage === 'function') {
      const updated = await sock.updateMediaMessage(base);
      if (updated && updated.message) base = updated;
    }
  } catch (e) {
    console.warn('[cfwd] updateMediaMessage', e.message || e);
  }
  const t2 = messageForDownload(base);
  try {
    const buf = await baileys.downloadMediaMessage(t2, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage ? sock.updateMediaMessage.bind(sock) : undefined,
    });
    if (buf && buf.length) return done(Buffer.from(buf));
  } catch (e) {
    console.warn('[cfwd] downloadMediaMessage', e.message || e);
  }
  try {
    const typeMap = { image: 'image', video: 'video', document: 'document', audio: 'audio', sticker: 'sticker', ptv: 'video' };
    const stream = await baileys.downloadContentFromMessage(node, typeMap[kind] || 'document');
    const buffer = await streamToBuffer(stream);
    if (buffer.length) return done(buffer);
  } catch (e) {
    console.warn('[cfwd] downloadContentFromMessage', e.message || e);
  }
  return null;
}

async function sendWithRetry(sock, jid, content, tries) {
  tries = tries || 3;
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await sock.sendMessage(jid, content);
    } catch (e) {
      last = e;
      console.warn('[cfwd] send try', i + 1, e.message || e);
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw last;
}

async function sendMediaPayload(sock, to, dl, caption, extra) {
  const { buffer, kind, node } = dl;
  const send = (_s, _t, content) => sendWithRetry(sock, to, extra ? { ...content, ...extra } : content);
  if (kind === 'image' && node.imageMessage) {
    return send(sock, to, {
      image: buffer,
      caption: caption || undefined,
      mimetype: node.imageMessage.mimetype || 'image/jpeg',
    });
  }
  if ((kind === 'video' || kind === 'ptv') && (node.videoMessage || node.ptvMessage)) {
    const meta = node.videoMessage || node.ptvMessage;
    return send(sock, to, {
      video: buffer,
      caption: caption || undefined,
      mimetype: meta.mimetype || 'video/mp4',
      ptv: kind === 'ptv',
    });
  }
  if (kind === 'document' && node.documentMessage) {
    return send(sock, to, {
      document: buffer,
      mimetype: node.documentMessage.mimetype || 'application/octet-stream',
      fileName: node.documentMessage.fileName || 'file',
      caption: caption || undefined,
    });
  }
  if (kind === 'audio' && node.audioMessage) {
    await send(sock, to, {
      audio: buffer,
      mimetype: node.audioMessage.mimetype || 'audio/ogg; codecs=opus',
      ptt: !!node.audioMessage.ptt,
    });
    if (caption) return send(sock, to, { text: caption });
    return;
  }
  if (kind === 'sticker' && node.stickerMessage) {
    await send(sock, to, { sticker: buffer });
    if (caption) return send(sock, to, { text: caption });
    return;
  }
  return send(sock, to, {
    document: buffer,
    fileName: 'attachment',
    mimetype: 'application/octet-stream',
    caption: caption || undefined,
  });
}


function normalizeChannelJid(jid) {
  const s = String(jid || '').trim();
  if (!s) return s;
  const base = s.split(':')[0]; // strip device suffix
  if (base.includes('@newsletter')) return base;
  if (/^\d+$/.test(base)) return base + '@newsletter';
  return s;
}

/**
 * Download channel media (plain fetch) and re-send it as a normal group/channel message.
 * Returns false when the media could not be fetched so the caller can retry later
 * instead of silently dropping the attachment.
 */
async function deliverMedia(sock, to, m, text, extra) {
  const kind = mediaKind(unwrapMessage(m.message));
  if (!kind) return false;
  for (let i = 0; i < 2; i++) {
    try {
      const dl = await downloadMedia(sock, m);
      if (dl && dl.buffer && dl.buffer.length) {
        await sendMediaPayload(sock, to, dl, text, extra);
        console.log('[cfwd] sent media', kind, to, dl.buffer.length);
        return true;
      }
    } catch (e) {
      console.warn('[cfwd] media send try', i + 1, e.message || e);
    }
    await sleep(800 * (i + 1));
  }
  return false;
}

/** Back-compat entry point (index.js): everything goes through the durable engine. */
function processMessage(sock, m, config) {
  return require('./cfwdEngine').handleMessage(sock, m, config);
}

module.exports = {
  processMessage,
  storePath,
  loadRules,
  saveRules,
  loadSettings,
  saveSettings,
  isChannelJid,
  parseChannelLink,
  resolveChannelFromLink,
  transformText,
  applyStrips,
  stripEmojis,
  stripWaLinks,
  stripHardcodedNames,
  HARDCODED_STRIP_PHRASES,
  isLinkOnlyText,
  isPromoInviteMessage,
  shouldSkipAsLinkSpam,
  countWaLinks,
  getCaptionOrText,
  toBoldLine,
  mediaKind,
  mediaNode,
  unwrapMessage,
  downloadMedia,
  deliverMedia,
  sendMediaPayload,
  sendWithRetry,
  normalizeChannelJid,
  sleep,
};
