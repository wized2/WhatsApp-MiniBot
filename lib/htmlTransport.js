/**
 * In-chat HTML mini-app transport.
 * Primary wire = GamesWhats (works on stock WhatsApp + Business Android):
 *   unifiedResponse.data = base64(JSON) string
 *   messageSecret = base64 string
 * Fallback = protobuf bytes Buffer (some forks encode either way)
 * Always stores message for getMessage retries ("Waiting for this message").
 */
const { randomBytes } = require('crypto');
const { generateWAMessageFromContent, proto } = require('baileys');
const config = require('../config');
const msgStore = require('./msgStore');

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

function buildContent(jid, html, title, mode) {
  const responseId = `app-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const botJid = config.richBotJid || '867051314767696@bot';
  const unified = buildUnified(responseId, html);
  const json = JSON.stringify(unified);

  // GamesWhats: base64 string. Alt: raw Buffer bytes.
  const data =
    mode === 'buffer'
      ? Buffer.from(json, 'utf8')
      : Buffer.from(json, 'utf8').toString('base64');

  const messageSecret =
    mode === 'buffer' ? randomBytes(32) : randomBytes(32).toString('base64');

  return {
    responseId,
    content: {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        messageSecret,
        botMetadata: {
          // Empty disclaimer = fewer client filters on stock WA
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
                messageText: String(title || 'Mini App').slice(0, 80),
              },
            ],
            unifiedResponse: { data },
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
    },
  };
}

async function relayOnce(sock, jid, html, title, mode) {
  const userJid = sock.user?.id;
  if (!userJid) throw new Error('WhatsApp session not authenticated yet');

  let payload = html;
  if (payload.length > 120000) payload = payload.slice(0, 120000);

  const { content, responseId } = buildContent(jid, payload, title, mode);
  const msg = generateWAMessageFromContent(jid, content, { userJid });
  msgStore.put({ key: msg.key, message: msg.message });
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  console.log('[htmlApp]', mode, title, 'id=', msg.key.id, 'rid=', responseId);
  return msg;
}

/**
 * Send HTML mini-app. Tries GamesWhats base64 first (best stock WA compat),
 * then Buffer encoding if relay throws.
 */
async function sendHtmlApp(sock, jid, html, title = 'Mini App') {
  try {
    return await relayOnce(sock, jid, html, title, 'b64');
  } catch (e1) {
    console.warn('[htmlApp] b64 failed', e1.message || e1);
    try {
      return await relayOnce(sock, jid, html, title, 'buffer');
    } catch (e2) {
      console.error('[htmlApp] both failed', e2.message || e2);
      try {
        await sock.sendMessage(jid, {
          text:
            `🎮 *${title}*\n\n` +
            `HTML card failed on this client.\n` +
            `Use latest *WhatsApp / WhatsApp Business* Android.\n` +
            `(${e2.message || 'relay error'})`,
        });
      } catch (_) {}
      throw e2;
    }
  }
}

module.exports = { sendHtmlApp };
