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

function transformText(text, rule) {
  let out = String(text || '');
  if (rule.stripUrls) {
    out = out.replace(/https?:\/\/\S+/gi, '').trim();
  }
  if (Array.isArray(rule.replace) && rule.replace.length) {
    for (const pair of rule.replace) {
      if (!pair || pair.from == null) continue;
      out = out.split(String(pair.from)).join(String(pair.to ?? ''));
    }
  }
  if (rule.prefix) out = String(rule.prefix) + out;
  if (rule.suffix) out = out + String(rule.suffix);
  return out.trim();
}

/**
 * Process one inbound message. Returns true if a forward was attempted.
 */
async function downloadMedia(sock, m) {
  try {
    const { downloadMediaMessage } = require('baileys');
    const buffer = await downloadMediaMessage(
      m,
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage },
    );
    return buffer;
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
    if (config.channelForwardLog) {
      console.log('[cfwd] channel msg (no rule)', from);
    }
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
          console.log('[cfwd] skip empty', from, '→', to);
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
  processMessage,
  transformText,
  getCaptionOrText,
};
