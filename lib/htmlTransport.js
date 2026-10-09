/**
 * In-chat HTML via AI rich response (Android WebView).
 * Wire format aligned with GamesWhats + Baileys 7 rich utils:
 *   botForwardedMessage → richResponseMessage → unifiedResponse.data (Buffer JSON)
 *   primitive GenAIaeacdsnwHtmlPrimitive
 */
const { randomBytes, randomUUID } = require('crypto');
const { generateWAMessageFromContent } = require('baileys');
const config = require('../config');
const msgStore = require('./msgStore');

function verificationMetadata() {
  const signature = randomBytes(64);
  const cert = (len = 685) => {
    const c = randomBytes(len);
    c[0] = 48;
    c[1] = 130;
    return c;
  };
  return {
    proofs: [
      {
        certificateChain: [cert(), cert(892)],
        version: 1,
        useCase: 1,
        signature,
      },
    ],
  };
}

/**
 * @param {import('baileys').WASocket} sock
 * @param {string} jid
 * @param {string} html
 * @param {string} title
 */
async function sendHtmlApp(sock, jid, html, title = 'Mini App') {
  const userJid = sock.user?.id;
  if (!userJid) throw new Error('WhatsApp session not authenticated yet');

  // Keep payload small — huge HTML causes client download stalls
  if (html.length > 180000) {
    html = html.slice(0, 180000);
  }

  const responseId = randomUUID();
  const botJid = config.richBotJid || '867051314767696@bot';

  const unified = {
    response_id: responseId,
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
  };

  // protobuf bytes field — Buffer, NOT base64 string
  const dataBuf = Buffer.from(JSON.stringify(unified), 'utf8');

  const messageContent = {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      messageSecret: randomBytes(32),
      botMetadata: {
        messageDisclaimerText: String(title).slice(0, 60),
        botResponseId: responseId,
        verificationMetadata: verificationMetadata(),
      },
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1, // STANDARD
          submessages: [
            {
              messageType: 2, // TEXT
              messageText: String(title).slice(0, 80),
            },
          ],
          unifiedResponse: {
            data: dataBuf,
          },
          contextInfo: {
            mentionedJid: [],
            groupMentions: [],
            statusAttributions: [],
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid },
            forwardOrigin: 4, // META_AI origin
          },
        },
      },
    },
  };

  try {
    const msg = generateWAMessageFromContent(jid, messageContent, { userJid });
    msgStore.put({ key: msg.key, message: msg.message });
    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    console.log('[htmlApp] ok', title, 'bytes=', dataBuf.length, '→', jid);
    return msg;
  } catch (err) {
    console.error('[htmlApp] fail', title, err?.message || err);
    // Fast text fallback so user always gets *something*
    await sock.sendMessage(jid, {
      text:
        `🎮 *${title}*\n\n` +
        `HTML surface failed (${err?.message || 'error'}).\n` +
        `Use Android WhatsApp (latest). Try again or .games for list.`,
    });
    throw err;
  }
}

module.exports = { sendHtmlApp };
