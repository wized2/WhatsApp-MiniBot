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

/**
 * Multi-strategy media pull used by many Baileys bots:
 * 1) downloadMediaMessage (handles keys / reupload)
 * 2) downloadContentFromMessage on the media node
 * 3) optional directPath via getUrlFromDirectPath when exposed
 */
async function downloadMedia(sock, m) {
  const baileys = require('baileys');
  const downloadMediaMessage = baileys.downloadMediaMessage;
  const downloadContentFromMessage = baileys.downloadContentFromMessage;
  const getUrlFromDirectPath = baileys.getUrlFromDirectPath;

  // Refresh CDN URL / media keys (critical for channel posts)
  let base = m;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (typeof sock.updateMediaMessage === 'function') {
        const updated = await sock.updateMediaMessage(base);
        if (updated && updated.message) base = updated;
      }
    } catch (e) {
      console.warn('[cfwd] updateMediaMessage try', attempt + 1, e.message || e);
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  const target = messageForDownload(base);
  const msg = unwrapMessage(target.message);
  const kind = mediaKind(msg);
  const node = mediaNode(msg);
  if (!kind || !node) {
    console.warn('[cfwd] no media node on message');
    return null;
  }

  // 1) Full helper
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
      if (buf && buf.length) {
        console.log('[cfwd] media via downloadMediaMessage', kind, buf.length);
        return { buffer: Buffer.from(buf), kind, node: msg };
      }
    } catch (e) {
      console.warn('[cfwd] downloadMediaMessage', e.message || e);
    }
  }

  // 2) Stream from node
  if (typeof downloadContentFromMessage === 'function') {
    try {
      const typeMap = {
        image: 'image',
        video: 'video',
        document: 'document',
        audio: 'audio',
        sticker: 'sticker',
        ptv: 'video',
      };
      const stream = await downloadContentFromMessage(node, typeMap[kind] || 'document');
      const buffer = await streamToBuffer(stream);
      if (buffer.length) {
        console.log('[cfwd] media via downloadContentFromMessage', kind, buffer.length);
        return { buffer, kind, node: msg };
      }
    } catch (e) {
      console.warn('[cfwd] downloadContentFromMessage', e.message || e);
    }
  }

  // 3) directPath URL (some channel payloads)
  if (node.directPath && typeof getUrlFromDirectPath === 'function') {
    try {
      const url = getUrlFromDirectPath(node.directPath);
      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const buffer = Buffer.from(ab);
          if (buffer.length) {
            console.log('[cfwd] media via directPath', kind, buffer.length);
            return { buffer, kind, node: msg };
          }
        }
      }
    } catch (e) {
      console.warn('[cfwd] directPath', e.message || e);
    }
  }

  console.warn('[cfwd] all media download strategies failed', kind);
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

async function sendMediaPayload(sock, to, dl, caption) {
  const { buffer, kind, node } = dl;
  if (kind === 'image' && node.imageMessage) {
    return sendWithRetry(sock, to, {
      image: buffer,
      caption: caption || undefined,
      mimetype: node.imageMessage.mimetype || 'image/jpeg',
    });
  }
  if ((kind === 'video' || kind === 'ptv') && (node.videoMessage || node.ptvMessage)) {
    const meta = node.videoMessage || node.ptvMessage;
    return sendWithRetry(sock, to, {
      video: buffer,
      caption: caption || undefined,
      mimetype: meta.mimetype || 'video/mp4',
      ptv: kind === 'ptv',
    });
  }
  if (kind === 'document' && node.documentMessage) {
    return sendWithRetry(sock, to, {
      document: buffer,
      mimetype: node.documentMessage.mimetype || 'application/octet-stream',
      fileName: node.documentMessage.fileName || 'file',
      caption: caption || undefined,
    });
  }
  if (kind === 'audio' && node.audioMessage) {
    await sendWithRetry(sock, to, {
      audio: buffer,
      mimetype: node.audioMessage.mimetype || 'audio/ogg; codecs=opus',
      ptt: !!node.audioMessage.ptt,
    });
    if (caption) return sendWithRetry(sock, to, { text: caption });
    return;
  }
  if (kind === 'sticker' && node.stickerMessage) {
    await sendWithRetry(sock, to, { sticker: buffer });
    if (caption) return sendWithRetry(sock, to, { text: caption });
    return;
  }
  return sendWithRetry(sock, to, {
    document: buffer,
    fileName: 'attachment',
    mimetype: 'application/octet-stream',
    caption: caption || undefined,
  });
}

/**
 * Prefer re-download + caption (so strip/footer apply). Fallback: native forward
 * so media still arrives when CDN keys are awkward on channels.
 */
async function deliverMedia(sock, to, m, text) {
  const msg0 = unwrapMessage(m.message);
  const kind = mediaKind(msg0);
  if (!kind) return false;

  // Multiple download attempts (channel CDN is flaky)
  for (let i = 0; i < 3; i++) {
    try {
      const dl = await downloadMedia(sock, m);
      if (dl && dl.buffer && dl.buffer.length) {
        await sendMediaPayload(sock, to, dl, text);
        console.log('[cfwd] sent media buffer', kind, to, dl.buffer.length, 'try', i + 1);
        return true;
      }
    } catch (e) {
      console.warn('[cfwd] download try', i + 1, e.message || e);
    }
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }

  // Native forward
  try {
    await sendWithRetry(sock, to, { forward: m });
    console.log('[cfwd] sent media via forward', kind, to);
    if (text) {
      try { await sendWithRetry(sock, to, { text }); } catch (_) {}
    }
    return true;
  } catch (e) {
    console.warn('[cfwd] forward failed', e.message || e);
  }

  // relayMessage last resort (some builds accept channel keys this way)
  try {
    if (typeof sock.relayMessage === 'function' && m.message) {
      await sock.relayMessage(to, m.message, { messageId: m.key?.id });
      console.log('[cfwd] sent media via relayMessage', kind, to);
      if (text) {
        try { await sendWithRetry(sock, to, { text }); } catch (_) {}
      }
      return true;
    }
  } catch (e) {
    console.warn('[cfwd] relayMessage', e.message || e);
  }

  return false;
}

// Dedup (memory + disk) so poll + upsert never double-send
const recentIds = new Map();
const SEEN_TTL_MS = 15 * 60 * 1000;
function seenStorePath() {
  if (process.env.FORWARDS_JSON) {
    return require('path').join(require('path').dirname(process.env.FORWARDS_JSON), 'cfwd-seen.json');
  }
  return require('path').join(__dirname, '..', 'data', 'cfwd-seen.json');
}
function loadSeenDisk() {
  try {
    const raw = fs.readFileSync(seenStorePath(), 'utf8');
    const obj = JSON.parse(raw);
    const now = Date.now();
    for (const [k, ts] of Object.entries(obj || {})) {
      if (now - Number(ts) < SEEN_TTL_MS) recentIds.set(k, Number(ts));
    }
  } catch (_) {}
}
function saveSeenDisk() {
  try {
    const now = Date.now();
    const obj = {};
    for (const [k, ts] of recentIds) {
      if (now - ts < SEEN_TTL_MS) obj[k] = ts;
    }
    const p = seenStorePath();
    fs.mkdirSync(require('path').dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(obj));
  } catch (_) {}
}
loadSeenDisk();
function pruneSeen() {
  const now = Date.now();
  for (const [k, ts] of recentIds) {
    if (now - ts > SEEN_TTL_MS) recentIds.delete(k);
  }
}
function isSeen(id) {
  if (!id) return false;
  pruneSeen();
  return recentIds.has(id);
}
function markSeen(id) {
  if (!id) return;
  recentIds.set(id, Date.now());
  saveSeenDisk();
}
/** @deprecated use isSeen/markSeen — kept for callers */
function seenRecently(id) {
  if (isSeen(id)) return true;
  markSeen(id);
  return false;
}

let chain = Promise.resolve();
function enqueue(fn) {
  chain = chain.then(fn).catch((e) => console.error('[cfwd queue]', e.message || e));
  return chain;
}

async function processMessage(sock, m, config) {
  const from = m.key?.remoteJid;
  if (!from || !isChannelJid(from)) return false;

  const msgId = (m.key?.id || '') + '@' + from;
  if (isSeen(msgId)) {
    if (config?.channelForwardLog) console.log('[cfwd] skip dup', msgId);
    return false;
  }

  let rules = loadRules().filter((r) => r.enabled !== false && r.from === from);
  if (!rules.length) {
    rules = loadRules().filter(
      (r) =>
        r.enabled !== false &&
        String(r.from).replace(/:.*/, '') === String(from).replace(/:.*/, '')
    );
  }
  if (!rules.length) {
    if (config?.channelForwardLog) console.log('[cfwd] no rule for', from);
    return false;
  }

  const baseText = getCaptionOrText(m.message);
  const msg = unwrapMessage(m.message);
  const kind = mediaKind(msg);
  const settings = loadSettings();

  // Global: skip link-only + channel/group promo-invite posts (text only)
  if (settings.stripLinks && shouldSkipAsLinkSpam(baseText, !!kind)) {
    console.log(
      '[cfwd] skip link/promo spam',
      from,
      'links=',
      countWaLinks(baseText),
      (baseText || '').slice(0, 100).replace(/\n/g, ' ')
    );
    markSeen(msgId);
    return true;
  }

  console.log(
    '[cfwd] forward',
    from,
    '→',
    rules.map((r) => r.to).join(','),
    'textLen=',
    (baseText || '').length,
    'media=',
    kind || 'none',
    'stripLinks=',
    !!settings.stripLinks
  );

  await enqueue(async () => {
    let anyOk = false;
    let mediaExpected = !!(kind && rules.some((r) => r.includeMedia !== false));
    let mediaOk = false;

    for (const rule of rules) {
      try {
        const to = rule.to;
        if (!to) continue;
        const text = transformText(baseText, rule, settings);
        let sentMedia = false;

        // After strip: nothing left and no media → do not send empty shell
        if (settings.stripLinks && !kind && !(text && text.trim())) {
          console.log('[cfwd] skip empty after link-strip', from, '→', to);
          anyOk = true;
          continue;
        }

        if (rule.includeMedia !== false && kind) {
          sentMedia = await deliverMedia(sock, to, m, text);
          if (sentMedia) mediaOk = true;
        }

        if (!sentMedia) {
          if (text) {
            await sendWithRetry(sock, to, { text });
            anyOk = true;
            if (kind) console.warn('[cfwd] text-only fallback (media failed)', from, '→', to);
          } else if (kind) {
            // last ditch: forward without caption transform
            try {
              await sendWithRetry(sock, to, { forward: m });
              sentMedia = true;
              mediaOk = true;
              anyOk = true;
              console.log('[cfwd] raw forward fallback', from, '→', to);
            } catch (e) {
              console.warn('[cfwd] raw forward', e.message || e);
            }
          } else {
            console.log('[cfwd] empty after strip', from, '→', to);
          }
        } else {
          anyOk = true;
        }
      } catch (e) {
        console.error('[cfwd] send failed', rule.from, '→', rule.to, e.message || e);
      }
    }

    // If media was expected but never arrived, do not mark seen — poll/retry can try again
    if (anyOk && (!mediaExpected || mediaOk)) {
      markSeen(msgId);
    } else if (mediaExpected && !mediaOk) {
      console.warn('[cfwd] defer seen — media missing', msgId);
    }
  });

  return true;
}

module.exports = {
  storePath,
  STORE: null,
  loadRules,
  saveRules,
  loadSettings,
  saveSettings,
  isChannelJid,
  parseChannelLink,
  resolveChannelFromLink,
  processMessage,
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
};
