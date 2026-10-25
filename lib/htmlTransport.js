/**
 * In-chat HTML mini-app transport (Android WhatsApp + WhatsApp Business).
 * Wire matches GamesWhats exactly; plus MESSAGE_EDIT re-render + retry store.
 */
const { randomBytes } = require('crypto');
const { generateWAMessageFromContent } = require('baileys');
const config = require('../config');
const msgStore = require('./msgStore');

const BOT_JID = () => config.richBotJid || '867051314767696@bot';

function buildPayload(responseId, html) {
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

/** GamesWhats exact content shape */
function gamesWhatsContent(html, title, responseId, dataMode) {
  const json = JSON.stringify(buildPayload(responseId, html));
  // GamesWhats uses base64 STRING. Some builds accept raw UTF-8 bytes in the proto bytes field.
  const data =
    dataMode === 'bytes'
      ? Buffer.from(json, 'utf8')
      : Buffer.from(json, 'utf8').toString('base64');

  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      messageSecret: randomBytes(32).toString('base64'),
      botMetadata: {
        messageDisclaimerText: '',
        botResponseId: responseId,
      },
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [
            {
              messageType: 2,
              messageText: String(title || 'Game').slice(0, 80),
            },
          ],
          unifiedResponse: { data },
          contextInfo: {
            mentionedJid: [],
            groupMentions: [],
            statusAttributions: [],
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: BOT_JID() },
            forwardOrigin: 4,
          },
        },
      },
    },
  };
}

/** Same HTML but with embedded_screens (elaina proven shape) */
function embeddedContent(html, title, responseId) {
  const payload = {
    response_id: responseId,
    sections: [
      {
        __typename: 'GenAIUnifiedResponseSection',
        view_model: {
          __typename: 'GenAISingleLayoutViewModel',
          primitive: {
            __typename: 'GenAIaeacdsnwHtmlPrimitive',
            payload: String(title || 'App').slice(0, 40),
            trusted_sources: [],
          },
        },
      },
    ],
    embedded_screens: [
      {
        id: responseId,
        title: String(title || 'App').slice(0, 40),
        content: [
          {
            __typename: 'FOAEmbeddedScreenContentTabbed',
            tabs: [
              {
                id: 'tab0',
                tab_header: String(title || 'Play').slice(0, 24),
                sections: [
                  {
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                      __typename: 'GenAISingleLayoutViewModel',
                      primitive: {
                        __typename: 'GenAIaeacdsnwHtmlPrimitive',
                        payload: html,
                        trusted_sources: [],
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      messageSecret: randomBytes(32).toString('base64'),
      botMetadata: {
        messageDisclaimerText: '',
        botResponseId: responseId,
      },
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: String(title || 'App').slice(0, 80) }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify(payload), 'utf8').toString('base64'),
          },
          contextInfo: {
            mentionedJid: [],
            groupMentions: [],
            statusAttributions: [],
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: BOT_JID() },
            forwardOrigin: 4,
          },
        },
      },
    },
  };
}

function storeFull(msg, jid) {
  if (!msg?.message || !msg?.key?.id) return;
  const key = { remoteJid: jid, fromMe: true, id: msg.key.id };
  msgStore.put({ key, message: msg.message });
}

async function relay(sock, jid, content) {
  const userJid = sock.user?.id;
  if (!userJid) throw new Error('not authenticated');

  const msg = generateWAMessageFromContent(jid, content, { userJid });
  storeFull(msg, jid);

  // Prefer AI flag when available (some forks)
  try {
    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id, AI: true });
  } catch {
    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  }
  // Re-store after relay (key may be normalized)
  storeFull(msg, jid);
  return msg;
}

async function sendMessageEdit(sock, jid, originalId, originalMessage) {
  const userJid = sock.user?.id;
  const content = {
    botForwardedMessage: {
      message: {
        protocolMessage: {
          key: { remoteJid: jid, fromMe: true, id: originalId },
          type: 14,
          editedMessage: originalMessage,
        },
      },
    },
  };
  const editMsg = generateWAMessageFromContent(jid, content, { userJid });
  storeFull(editMsg, jid);
  // Keep original id mapped to full body for peer retries
  msgStore.put({
    key: { remoteJid: jid, fromMe: true, id: originalId },
    message: originalMessage,
  });
  await sock.relayMessage(jid, editMsg.message, { messageId: editMsg.key.id });
  return editMsg;
}

/**
 * Deliver in-chat HTML to any Android WhatsApp (consumer + Business).
 * Strategy:
 *  1) GamesWhats base64 (proven)
 *  2) MESSAGE_EDIT re-render (stock WA stuck-download fix)
 *  3) If first path throws → embedded_screens → bytes mode
 */
async function sendHtmlApp(sock, jid, html, title = 'Mini App') {
  if (typeof html !== 'string' || !html.trim()) throw new Error('html required');
  // Consumer clients choke more on huge cards
  if (html.length > 90000) html = html.slice(0, 90000);
  title = String(title || 'Mini App').slice(0, 80);
  const responseId = `game-${Date.now()}-${randomBytes(4).toString('hex')}`;

  let msg;
  const errors = [];

  // Path A — exact GamesWhats
  try {
    msg = await relay(sock, jid, gamesWhatsContent(html, title, responseId, 'b64'));
    console.log('[htmlApp] gameswhats', title, msg.key.id);
  } catch (e) {
    errors.push('gw:' + (e.message || e));
  }

  // Path B — embedded screens
  if (!msg) {
    try {
      msg = await relay(sock, jid, embeddedContent(html, title, responseId + '-e'));
      console.log('[htmlApp] embedded', title, msg.key.id);
    } catch (e) {
      errors.push('emb:' + (e.message || e));
    }
  }

  // Path C — bytes unifiedResponse
  if (!msg) {
    try {
      msg = await relay(sock, jid, gamesWhatsContent(html, title, responseId + '-b', 'bytes'));
      console.log('[htmlApp] bytes', title, msg.key.id);
    } catch (e) {
      errors.push('bytes:' + (e.message || e));
      throw new Error('htmlApp failed: ' + errors.join(' | '));
    }
  }

  // MESSAGE_EDIT — critical for stock WhatsApp Android re-render
  if (config.htmlBypassDownload !== false && msg?.key?.id && msg.message) {
    try {
      await new Promise((r) => setTimeout(r, 250));
      await sendMessageEdit(sock, jid, msg.key.id, msg.message);
      console.log('[htmlApp] edit-ok', msg.key.id);
    } catch (e) {
      console.warn('[htmlApp] edit-fail', e.message || e);
    }
  }

  return msg;
}

module.exports = { sendHtmlApp };
