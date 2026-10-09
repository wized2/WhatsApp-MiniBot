/**
 * In-chat HTML mini-app transport (GenAI rich response).
 *
 * Compatible WhatsApp clients render self-contained HTML/CSS/JS inside the
 * message bubble (canvas games, quizzes, etc.) — not as raw text or a browser tab.
 *
 * Structure (internal, may change with WA versions):
 *   botForwardedMessage → richResponseMessage → unifiedResponse.data (base64 JSON)
 *     → GenAISingleLayoutViewModel → GenAIaeacdsnwHtmlPrimitive.payload = HTML
 */
const { randomBytes } = require('crypto');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const config = require('../config');

/**
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {string} jid
 * @param {string} html  full self-contained HTML document
 * @param {string} title short label shown as text submessage
 */
async function sendHtmlApp(sock, jid, html, title = 'Mini App') {
  const userJid = sock.user?.id;
  if (!userJid) throw new Error('WhatsApp session not authenticated yet');

  const responseId = `app-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const payload = {
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

  const botJid = config.richBotJid || '867051314767696@bot';

  const messageContent = {
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
          submessages: [{ messageType: 2, messageText: String(title).slice(0, 80) }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify(payload), 'utf8').toString('base64'),
          },
          contextInfo: {
            mentionedJid: [],
            groupMentions: [],
            statusAttributions: [],
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid },
            forwardOrigin: 4,
          },
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(jid, messageContent, { userJid });
  await sock.relayMessage(jid, msg.message, {});
  return msg;
}

module.exports = { sendHtmlApp };
