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
    if (msg?.editedMessage?.message) {
      msg = msg.editedMessage.message;
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

// Serial queue so bursts don't drop
let chain = Promise.resolve();
function enqueue(fn) {
  chain = chain.then(fn).catch((e) => console.error('[cfwd queue]', e.message || e));
  return chain;
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

async function processMessage(sock, m, config) {
  const from = m.key?.remoteJid;
  if (!from || !isChannelJid(from)) return false;
  // Allow fromMe=false only; channel posts are not fromMe usually
  // if (m.key?.fromMe) return false;

  const msgId = (m.key?.id || '') + '@' + from;
  if (seenRecently(msgId)) {
    if (config?.channelForwardLog) console.log('[cfwd] skip dup', msgId);
    return false;
  }

  const rules = loadRules().filter((r) => r.enabled !== false && r.from === from);
  if (!rules.length) {
    // Also match without device suffix weirdness
    const rules2 = loadRules().filter(
      (r) => r.enabled !== false && String(r.from).replace(/:.*/, '') === String(from).replace(/:.*/, '')
    );
    if (!rules2.length) {
      if (config?.channelForwardLog) console.log('[cfwd] no rule for', from);
      return false;
    }
    rules.push(...rules2);
  }

  const baseText = getCaptionOrText(m.message);
  const msg = unwrapMessage(m.message);

  console.log(
    '[cfwd] forward',
    from,
    '→',
    rules.map((r) => r.to).join(','),
    'textLen=',
    (baseText || '').length
  );

  await enqueue(async () => {
    for (const rule of rules) {
      try {
        const to = rule.to;
        if (!to) continue;
        const text = transformText(baseText, rule);
        let sentMedia = false;

        if (rule.includeMedia !== false) {
          const hasMedia =
            msg.imageMessage ||
            msg.videoMessage ||
            msg.documentMessage ||
            msg.audioMessage ||
            msg.stickerMessage;
          if (hasMedia) {
            const buf = await downloadMedia(sock, m);
            if (buf && msg.imageMessage) {
              await sendWithRetry(sock, to, { image: buf, caption: text || undefined });
              sentMedia = true;
            } else if (buf && msg.videoMessage) {
              await sendWithRetry(sock, to, { video: buf, caption: text || undefined });
              sentMedia = true;
            } else if (buf && msg.documentMessage) {
              await sendWithRetry(sock, to, {
                document: buf,
                mimetype: msg.documentMessage.mimetype,
                fileName: msg.documentMessage.fileName || 'file',
                caption: text || undefined,
              });
              sentMedia = true;
            } else if (buf && msg.audioMessage) {
              await sendWithRetry(sock, to, {
                audio: buf,
                mimetype: msg.audioMessage.mimetype,
                ptt: !!msg.audioMessage.ptt,
              });
              if (text) await sendWithRetry(sock, to, { text });
              sentMedia = true;
            } else if (buf && msg.stickerMessage) {
              await sendWithRetry(sock, to, { sticker: buf });
              if (text) await sendWithRetry(sock, to, { text });
              sentMedia = true;
            }
          }
        }

        if (!sentMedia) {
          if (text) await sendWithRetry(sock, to, { text });
          else console.log('[cfwd] empty after strip', from, '→', to);
        } else {
          console.log('[cfwd] sent media', from, '→', to);
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
  STORE: null, // dynamic via storePath()
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
