/**
 * .vv — unlock a replied view-once photo / video / voice / image
 * Logic adapted from Endroid-MD (owner-only) for MiniBot/cfwd plugin shape.
 */
const { isOwner } = require('../lib/owner');

function unwrap(msg) {
  let m = msg;
  for (let i = 0; i < 8; i++) {
    if (!m) break;
    if (m.ephemeralMessage?.message) {
      m = m.ephemeralMessage.message;
      continue;
    }
    if (m.viewOnceMessage?.message) {
      m = m.viewOnceMessage.message;
      continue;
    }
    if (m.viewOnceMessageV2?.message) {
      m = m.viewOnceMessageV2.message;
      continue;
    }
    if (m.viewOnceMessageV2Extension?.message) {
      m = m.viewOnceMessageV2Extension.message;
      continue;
    }
    if (m.documentWithCaptionMessage?.message) {
      m = m.documentWithCaptionMessage.message;
      continue;
    }
    break;
  }
  return m || {};
}

function contextInfo(message) {
  if (!message) return null;
  return (
    message.extendedTextMessage?.contextInfo ||
    message.imageMessage?.contextInfo ||
    message.videoMessage?.contextInfo ||
    message.audioMessage?.contextInfo ||
    message.stickerMessage?.contextInfo ||
    message.documentMessage?.contextInfo ||
    message.buttonsResponseMessage?.contextInfo ||
    message.listResponseMessage?.contextInfo ||
    message.templateButtonReplyMessage?.contextInfo ||
    null
  );
}

function detectKind(inner) {
  if (inner.imageMessage) return 'image';
  if (inner.videoMessage) return 'video';
  if (inner.audioMessage) return 'audio';
  if (inner.stickerMessage) return 'sticker';
  if (inner.documentMessage) return 'document';
  if (inner.ptvMessage) return 'video';
  return null;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function downloadQuoted(sock, quotedRoot, quotedKey) {
  const baileys = require('baileys');
  const downloadMediaMessage = baileys.downloadMediaMessage;
  const downloadContentFromMessage = baileys.downloadContentFromMessage;

  const target = {
    key: quotedKey || {
      remoteJid: 'status@broadcast',
      id: 'vv',
      fromMe: false,
    },
    message: quotedRoot,
  };

  // Prefer full helper (handles keys / reupload)
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
      console.warn('[vv] downloadMediaMessage', e.message || e);
    }
  }

  const inner = unwrap(quotedRoot);
  const kind = detectKind(inner);
  const node =
    inner.imageMessage ||
    inner.videoMessage ||
    inner.audioMessage ||
    inner.stickerMessage ||
    inner.documentMessage ||
    inner.ptvMessage;
  if (!kind || !node || typeof downloadContentFromMessage !== 'function') return null;

  const typeMap = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    sticker: 'sticker',
    document: 'document',
  };
  try {
    const stream = await downloadContentFromMessage(node, typeMap[kind] || 'document');
    const buffer = await streamToBuffer(stream);
    if (buffer.length) return buffer;
  } catch (e) {
    console.warn('[vv] downloadContentFromMessage', e.message || e);
  }
  return null;
}

module.exports = {
  name: 'vv',
  pattern: 'vv',
  aliases: ['vv2', 'viewonce', 'reveal'],
  desc: 'Unlock replied view-once media (owner)',
  category: 'owner',
  async handler(ctx) {
    const { sock, m, jid, reply } = ctx;
    if (!isOwner(ctx)) return; // silent like Endroid-MD

    const ctxInfo = contextInfo(m.message);
    const quotedRoot = ctxInfo?.quotedMessage;
    if (!quotedRoot) {
      return reply('Reply to a *view once* photo, video, or voice with `.vv`.');
    }

    const inner = unwrap(quotedRoot);
    const kind = detectKind(inner);
    if (!kind) {
      return reply('That quote has no unlockable media (image / video / audio only).');
    }

    const node =
      inner.imageMessage ||
      inner.videoMessage ||
      inner.audioMessage ||
      inner.stickerMessage ||
      inner.documentMessage ||
      inner.ptvMessage ||
      {};

    // Build a synthetic key for the quoted message when Baileys provides stanza id
    const quotedKey = {
      remoteJid: ctxInfo.remoteJid || m.key.remoteJid,
      id: ctxInfo.stanzaId,
      fromMe: Boolean(ctxInfo.fromMe),
      participant: ctxInfo.participant,
    };

    let buffer;
    try {
      buffer = await downloadQuoted(sock, quotedRoot, quotedKey);
    } catch (e) {
      console.error('[vv]', e);
      return reply(`Failed to download:\n${e.message || e}`);
    }

    if (!buffer || !buffer.length) {
      return reply('Could not download that media (already opened, expired, or blocked).');
    }

    const caption = node.caption || '';
    const mimetype = node.mimetype;

    try {
      if (kind === 'image') {
        await sock.sendMessage(
          jid,
          {
            image: buffer,
            caption: caption || undefined,
            mimetype: mimetype || 'image/jpeg',
          },
          { quoted: m }
        );
      } else if (kind === 'video') {
        await sock.sendMessage(
          jid,
          {
            video: buffer,
            caption: caption || undefined,
            mimetype: mimetype || 'video/mp4',
          },
          { quoted: m }
        );
      } else if (kind === 'audio') {
        await sock.sendMessage(
          jid,
          {
            audio: buffer,
            mimetype: mimetype || 'audio/ogg; codecs=opus',
            ptt: Boolean(node.ptt),
          },
          { quoted: m }
        );
      } else if (kind === 'sticker') {
        await sock.sendMessage(jid, { sticker: buffer }, { quoted: m });
      } else {
        await sock.sendMessage(
          jid,
          {
            document: buffer,
            mimetype: mimetype || 'application/octet-stream',
            fileName: node.fileName || 'file',
            caption: caption || undefined,
          },
          { quoted: m }
        );
      }
    } catch (e) {
      console.error('[vv] send', e);
      return reply(`Downloaded but send failed:\n${e.message || e}`);
    }
  },
};
