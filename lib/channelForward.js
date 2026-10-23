const fs = require('fs');
const path = require('path');
const { extractText } = require('./pluginLoader');

const STORE = path.join(__dirname, '..', 'data', 'channel-forwards.json');

function loadRules() {
  try {
    const raw = fs.readFileSync(STORE, 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveRules(rules) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(rules, null, 2));
}

function isChannelJid(jid) {
  return typeof jid === 'string' && jid.endsWith('@newsletter');
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
    throw new Error(
      'Could not resolve channel id from link. Follow the channel on the bot number and try again, or use .cfwd last after a post.'
    );
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
  for (let i = 0; i < 8; i++) {
    if (msg?.ephemeralMessage?.message) {
      msg = msg.ephemeralMessage.message;
      continue;
    }
    if (msg?.viewOnceMessage?.message) {
      msg = msg.viewOnceMessage.message;
      continue;
    }
    if (msg?.viewOnceMessageV2?.message) {
      msg = msg.viewOnceMessageV2.message;
      continue;
    }
    if (msg?.documentWithCaptionMessage?.message) {
      msg = msg.documentWithCaptionMessage.message;
      continue;
    }
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

/** Remove most emoji / symbol pictographs (safe for Urdu/Arabic letters). */
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

/**
 * stripLines: drop whole lines that contain any phrase (case-insensitive)
 * stripPhrases: remove phrase substrings anywhere
 * stripEmojis: remove emoji
 */
function applyStrips(text, rule) {
  let out = String(text || '');

  if (rule.stripEmojis) {
    out = stripEmojis(out);
  }

  const phrases = []
    .concat(rule.stripPhrases || [])
    .concat(rule.stripNames || [])
    .concat(rule.channelName ? [rule.channelName] : [])
    .map((p) => String(p || '').trim())
    .filter(Boolean);

  if (phrases.length && rule.stripLines !== false) {
    // default: remove entire lines that contain a phrase
    const lines = out.split(/\r?\n/);
    const kept = lines.filter((line) => {
      const low = line.toLowerCase();
      for (const p of phrases) {
        if (low.includes(p.toLowerCase())) return false;
      }
      return true;
    });
    out = kept.join('\n');
  } else if (phrases.length) {
    for (const p of phrases) {
      const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      out = out.replace(re, '');
    }
  }

  if (rule.stripUrls) {
    out = out.replace(/https?:\/\/\S+/gi, '');
  }

  // collapse extra blank lines
  out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return out;
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

async function downloadMedia(sock, m) {
  try {
    const { downloadMediaMessage } = require('baileys');
    return await downloadMediaMessage(
      m,
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    );
  } catch (e) {
    console.warn('[cfwd] media download', e.message || e);
    return null;
  }
}

async function processMessage(sock, m, config) {
  const from = m.key?.remoteJid;
  if (!from || !isChannelJid(from)) return false;
  if (m.key?.fromMe) return false;

  const rules = loadRules().filter((r) => r.enabled !== false && r.from === from);
  if (!rules.length) {
    if (config.channelForwardLog) console.log('[cfwd] channel msg (no rule)', from);
    return false;
  }

  const baseText = getCaptionOrText(m.message);
  const msg = unwrapMessage(m.message);

  for (const rule of rules) {
    try {
      const to = rule.to;
      if (!to) continue;
      const text = transformText(baseText, rule);
      let sentMedia = false;

      if (rule.includeMedia !== false) {
        const buf = await downloadMedia(sock, m);
        if (buf && msg.imageMessage) {
          await sock.sendMessage(to, { image: buf, caption: text || undefined });
          sentMedia = true;
        } else if (buf && msg.videoMessage) {
          await sock.sendMessage(to, { video: buf, caption: text || undefined });
          sentMedia = true;
        } else if (buf && msg.documentMessage) {
          await sock.sendMessage(to, {
            document: buf,
            mimetype: msg.documentMessage.mimetype,
            fileName: msg.documentMessage.fileName || 'file',
            caption: text || undefined,
          });
          sentMedia = true;
        } else if (buf && msg.audioMessage) {
          await sock.sendMessage(to, {
            audio: buf,
            mimetype: msg.audioMessage.mimetype,
            ptt: !!msg.audioMessage.ptt,
          });
          if (text) await sock.sendMessage(to, { text });
          sentMedia = true;
        } else if (buf && msg.stickerMessage) {
          await sock.sendMessage(to, { sticker: buf });
          if (text) await sock.sendMessage(to, { text });
          sentMedia = true;
        }
      }

      if (!sentMedia) {
        if (text) await sock.sendMessage(to, { text });
        else if (config.channelForwardLog) {
          console.log('[cfwd] skip empty after strip', from, '→', to);
        }
      }
    } catch (e) {
      console.error('[cfwd] send failed', rule.from, '→', rule.to, e.message || e);
    }
  }
  return true;
}

module.exports = {
  STORE,
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
};
