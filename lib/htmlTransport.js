/**
 * In-chat HTML mini-app (GenAIaeacdsnwHtmlPrimitive).
 *
 * Research (elaina-baileys / @yudzxml/baileys MessageBuilder 4.7):
 *  - Android-only WebView primitive
 *  - Stock WA often sticks on "Waiting for this message" until a
 *    protocolMessage type=14 (MESSAGE_EDIT) forces re-render (bypassDownload)
 *  - getMessage MUST return the full original message on retry (never {})
 *
 * Wire (GamesWhats + elaina):
 *  botForwardedMessage → richResponseMessage → unifiedResponse.data (base64 JSON)
 *  then optional MESSAGE_EDIT with same body
 */
const { randomBytes, randomUUID } = require('crypto');
const { generateWAMessageFromContent } = require('baileys');
const config = require('../config');
const msgStore = require('./msgStore');

function botJid() {
  return config.richBotJid || '867051314767696@bot';
}

function verificationMetadata() {
  const signature = randomBytes(64);
  const cert = (len) => {
    const c = randomBytes(len);
    c[0] = 48;
    c[1] = 130;
    return c;
  };
  return {
    proofs: [
      {
        certificateChain: [cert(685), cert(892)],
        version: 1,
        useCase: 1,
        signature,
      },
    ],
  };
}

function buildUnified(responseId, html) {
  return {
    response_id: responseId,
    sections: [
      {
        view_model: {
          primitive: {
            __typename: 'GenAIaeacdsnwHtmlPrimitive',
            payload: html,
            trusted_sources: [],
          },
          __typename: 'GenAISingleLayoutViewModel',
        },
      },
    ],
  };
}

function buildRichContent(html, title, responseId, { forwarded = true } = {}) {
  const dataB64 = Buffer.from(JSON.stringify(buildUnified(responseId, html)), 'utf8').toString('base64');

  const contextInfo = forwarded
    ? {
        mentionedJid: [],
        groupMentions: [],
        statusAttributions: [],
        forwardingScore: 1,
        isForwarded: true,
        forwardedAiBotMessageInfo: { botJid: botJid() },
        forwardOrigin: 4,
      }
    : {
        mentionedJid: [],
        groupMentions: [],
        statusAttributions: [],
      };

  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      messageSecret: randomBytes(32).toString('base64'),
      botMetadata: {
        messageDisclaimerText: String(title || '').slice(0, 60),
        botResponseId: responseId,
        verificationMetadata: verificationMetadata(),
      },
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: String(title || 'App').slice(0, 80) }],
          unifiedResponse: { data: dataB64 },
          contextInfo,
        },
      },
    },
  };
}

async function relay(sock, jid, content, messageId) {
  const userJid = sock.user?.id;
  if (!userJid) throw new Error('WhatsApp session not authenticated');

  const msg = generateWAMessageFromContent(jid, content, {
    userJid,
    messageId,
  });

  // Store at SEND time (critical for retries — see Baileys #1767 / evolution #2705)
  msgStore.put({
    key: { remoteJid: jid, fromMe: true, id: msg.key.id },
    message: msg.message,
  });

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

/**
 * MESSAGE_EDIT (protocol type 14) — forces Android clients to re-pull/re-render
 * the rich card. This is the proven "bypassDownload" fix from elaina/yudzxml.
 */
async function relayEdit(sock, jid, originalId, originalMessage) {
  const userJid = sock.user?.id;
  const editContent = {
    botForwardedMessage: {
      message: {
        protocolMessage: {
          key: {
            remoteJid: jid,
            fromMe: true,
            id: originalId,
          },
          type: 14, // MESSAGE_EDIT
          editedMessage: originalMessage,
        },
      },
    },
  };

  const editMsg = generateWAMessageFromContent(jid, editContent, { userJid });
  msgStore.put({
    key: { remoteJid: jid, fromMe: true, id: editMsg.key.id },
    message: editMsg.message,
  });
  // Also keep original id pointing at full body for retries of the first bubble
  msgStore.put({
    key: { remoteJid: jid, fromMe: true, id: originalId },
    message: originalMessage,
  });

  await sock.relayMessage(jid, editMsg.message, { messageId: editMsg.key.id });
  return editMsg;
}

/**
 * Send in-chat HTML mini-app (no document attachment).
 * @param {boolean} [opts.bypassDownload=true] send MESSAGE_EDIT follow-up
 * @param {boolean} [opts.forwarded=true] Meta-AI forward envelope
 */
async function sendHtmlApp(sock, jid, html, title = 'Mini App', opts = {}) {
  const bypassDownload = opts.bypassDownload !== false && config.htmlBypassDownload !== false;
  const forwarded = opts.forwarded !== false;

  if (typeof html !== 'string' || !html.trim()) {
    throw new Error('html required');
  }
  // Keep payload reasonable — huge cards increase stuck-download risk
  if (html.length > 110000) {
    html = html.slice(0, 110000);
  }
  title = String(title || 'Mini App').slice(0, 80);
  const responseId = randomUUID();

  // Attempt 1: GamesWhats / elaina envelope (forwarded Meta-AI style)
  let msg;
  try {
    const content = buildRichContent(html, title, responseId, { forwarded: true });
    msg = await relay(sock, jid, content);
    console.log('[htmlApp] rich ok', title, msg.key.id);
  } catch (e1) {
    console.warn('[htmlApp] forwarded rich failed', e1.message || e1);
    // Attempt 2: same body without forward flags (some consumer builds prefer this)
    const content2 = buildRichContent(html, title, responseId + '-nf', { forwarded: false });
    msg = await relay(sock, jid, content2);
    console.log('[htmlApp] non-forward rich ok', title, msg.key.id);
  }

  // Critical for stock WhatsApp Android: force re-render via MESSAGE_EDIT
  if (bypassDownload && msg?.key?.id && msg.message) {
    try {
      await new Promise((r) => setTimeout(r, 120));
      await relayEdit(sock, jid, msg.key.id, msg.message);
      console.log('[htmlApp] edit re-render ok', msg.key.id);
    } catch (e) {
      console.warn('[htmlApp] edit re-render failed', e.message || e);
    }
  }

  return msg;
}

module.exports = { sendHtmlApp };
