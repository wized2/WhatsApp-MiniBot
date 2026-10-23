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

function applyStrips(text, rule) {
  let out = String(text || '');
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
        const low = line.toLowerCase();
        return !phrases.some((p) => low.includes(p.toLowerCase()));
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

function transformText(text, rule) {
  let out = applyStrips(text, rule);
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

async function downloadMedia(sock, m) {
  const baileys = require('baileys');
  const downloadMediaMessage = baileys.downloadMediaMessage;
  const downloadContentFromMessage = baileys.downloadContentFromMessage;
  const target = messageForDownload(m);
  const msg = unwrapMessage(target.message);
  const kind = mediaKind(msg);

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
      console.log('[cfwd] media ok downloadMediaMessage', kind, buf.length);
      return { buffer: Buffer.from(buf), kind, node: msg };
    }
  } catch (e) {
    console.warn('[cfwd] downloadMediaMessage', e.message || e);
  }

  try {
    const node =
      msg.imageMessage ||
      msg.videoMessage ||
      msg.documentMessage ||
      msg.audioMessage ||
      msg.stickerMessage ||
      msg.ptvMessage;
    if (node && kind && downloadContentFromMessage) {
      const typeMap = {
        image: 'image',
        video: 'video',
        document: 'document',
        audio: 'audio',
        sticker: 'sticker',
        ptv: 'video',
      };
      const stream = await downloadContentFromMessage(node, typeMap[kind] || 'document');
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      if (buffer.length) {
        console.log('[cfwd] media ok downloadContentFromMessage', kind, buffer.length);
        return { buffer, kind, node: msg };
      }
    }
  } catch (e) {
    console.warn('[cfwd] downloadContentFromMessage', e.message || e);
  }

  console.warn('[cfwd] media download failed', kind || 'unknown');
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

// Dedup recent channel messages (avoid double forward on notify+append)
const recentIds = new Map();
function seenRecently(id) {
  if (!id) return false;
  const now = Date.now();
  for (const [k, t] of recentIds) {
    if (now - t > 10 * 60 * 1000) recentIds.delete(k);
  }
  if (recentIds.has(id)) return true;
  recentIds.set(id, now);
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
  if (seenRecently(msgId)) {
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

  console.log(
    '[cfwd] forward',
    from,
    '→',
    rules.map((r) => r.to).join(','),
    'textLen=',
    (baseText || '').length,
    'media=',
    kind || 'none'
  );

  await enqueue(async () => {
    for (const rule of rules) {
      try {
        const to = rule.to;
        if (!to) continue;
        const text = transformText(baseText, rule);
        let sentMedia = false;

        if (rule.includeMedia !== false && kind) {
          const dl = await downloadMedia(sock, m);
          if (dl && dl.buffer && dl.buffer.length) {
            await sendMediaPayload(sock, to, dl, text);
            sentMedia = true;
            console.log('[cfwd] sent media', dl.kind, from, '→', to, dl.buffer.length);
          } else {
            console.warn('[cfwd] media download empty', from, kind);
          }
        }

        if (!sentMedia) {
          if (text) await sendWithRetry(sock, to, { text });
          else console.log('[cfwd] empty after strip', from, '→', to);
          if (kind) console.warn('[cfwd] text-only fallback', from, '→', to);
        }
      } catch (e) {
        console.error('[cfwd] send failed', rule.from, '→', rule.to, e.message || e);
      }
    }
  });

  return true;
}

module.exports = {
  storePath,
  STORE: null,
  loadRules,
  saveRules,
  isChannelJid,
  parseChannelLink,
  resolveChannelFromLink,
  processMessage,
  transformText,
  applyStrips,
  stripEmojis,
  getCaptionOrText,
  toBoldLine,
  mediaKind,
};
