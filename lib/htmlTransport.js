/**
 * In-chat HTML mini-app via WhatsApp GenAI rich-response envelope.
 * Falls back to a short text + document if relay fails.
 */
const { randomBytes } = require('crypto');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const config = require('../config');

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

  try {
    const msg = generateWAMessageFromContent(jid, messageContent, { userJid });
    await sock.relayMessage(jid, msg.message, {});
    console.log('[htmlApp] relayed', title, '→', jid);
    return msg;
  } catch (err) {
    console.error('[htmlApp] relay failed', title, err.message || err);
    // Fallback: tell user + send as document so they still get something
    try {
      await sock.sendMessage(jid, {
        text:
          `🎮 *${title}*\n\n` +
          `In-chat HTML surface failed on this client/session.\n` +
          `Open the attached HTML file in a browser to play.`,
      });
      await sock.sendMessage(jid, {
        document: Buffer.from(html, 'utf8'),
        mimetype: 'text/html',
        fileName: `${String(title).replace(/\s+/g, '_').slice(0, 40)}.html`,
      });
    } catch (e2) {
      console.error('[htmlApp] fallback failed', e2.message || e2);
      throw err;
    }
  }
}

module.exports = { sendHtmlApp };
