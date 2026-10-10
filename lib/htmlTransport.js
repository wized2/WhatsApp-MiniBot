/**
 * HTML mini-app delivery — multi-shape cascade for Business + stock WhatsApp.
 *
 * Stock WA often shows "Waiting for this message" for Meta-AI-forward envelopes.
 * We try several wire shapes, always keep getMessage store filled, and finish
 * with a guaranteed document fallback so the user always receives a playable app.
 */
const { randomBytes } = require('crypto');
const { generateWAMessageFromContent } = require('baileys');
const config = require('../config');
const msgStore = require('./msgStore');

const BOT_JID = () => config.richBotJid || '867051314767696@bot';

function clampHtml(html) {
  if (html.length > 100000) return html.slice(0, 100000);
  return html;
}

function unifiedB64(responseId, html) {
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
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

function unifiedBuf(responseId, html) {
  const payload = {
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
  return Buffer.from(JSON.stringify(payload), 'utf8');
}

/** Shape A — exact GamesWhats (best on WA Business) */
function shapeGamesWhats(html, title, responseId) {
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
          submessages: [{ messageType: 2, messageText: title }],
          unifiedResponse: { data: unifiedB64(responseId, html) },
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

/** Shape B — rich response WITHOUT Meta-AI forward flags (stock WA friendlier) */
function shapePlainRich(html, title, responseId) {
  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      messageSecret: randomBytes(32).toString('base64'),
      botMetadata: {
        messageDisclaimerText: String(title).slice(0, 40),
        botResponseId: responseId,
      },
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: title }],
          unifiedResponse: { data: unifiedB64(responseId, html) },
          contextInfo: {
            mentionedJid: [],
            groupMentions: [],
            statusAttributions: [],
            // no isForwarded / forwardOrigin / botJid — stock clients less suspicious
          },
        },
      },
    },
  };
}

/** Shape C — top-level richResponseMessage (no botForwarded wrapper) */
function shapeTopLevelRich(html, title, responseId) {
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
    richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: title }],
      unifiedResponse: { data: unifiedBuf(responseId, html) },
    },
  };
}

/** Shape D — interactive nativeFlow "html" button */
function shapeNativeFlow(html, title) {
  const secret = randomBytes(32);
  return {
    interactiveMessage: {
      body: { text: title },
      nativeFlowMessage: {
        buttons: [
          {
            name: 'html',
            buttonParamsJson: JSON.stringify({
              html,
              title,
              messageSecret: secret.toString('base64'),
            }),
          },
        ],
        messageParamsJson: JSON.stringify({ from: 'minibot', title }),
      },
    },
  };
}

async function relay(sock, jid, content, label) {
  const userJid = sock.user?.id;
  if (!userJid) throw new Error('not authenticated');
  const msg = generateWAMessageFromContent(jid, content, { userJid });
  // Store FULL message for retry / "Waiting for this message"
  msgStore.put({ key: { ...msg.key, remoteJid: jid }, message: msg.message });
  const opts = { messageId: msg.key.id };
  // Some baileys builds accept AI flag for rich envelopes
  try {
    await sock.relayMessage(jid, msg.message, { ...opts, AI: true });
  } catch {
    await sock.relayMessage(jid, msg.message, opts);
  }
  console.log('[htmlApp] relayed', label, msg.key.id);
  return msg;
}

async function sendDocumentFallback(sock, jid, html, title) {
  const fileName = `${String(title).replace(/[^\w\-]+/g, '_').slice(0, 32) || 'app'}.html`;
  const sent = await sock.sendMessage(jid, {
    document: Buffer.from(html, 'utf8'),
    mimetype: 'text/html',
    fileName,
    caption:
      `🎮 *${title}*\n` +
      `Open this file to play (works on all WhatsApp).\n` +
      `_In-chat card needs a compatible Android client._`,
  });
  if (sent) msgStore.put(sent);
  console.log('[htmlApp] document fallback', title);
  return sent;
}

/**
 * Deliver HTML mini-app.
 * Order: plain-rich (stock) → GamesWhats (business) → nativeFlow → document (always works)
 */
async function sendHtmlApp(sock, jid, html, title = 'Mini App') {
  html = clampHtml(html);
  title = String(title || 'Mini App').slice(0, 80);
  const responseId = `app-${Date.now()}-${randomBytes(3).toString('hex')}`;

  const mode = (config.htmlMode || process.env.HTML_MODE || 'auto').toLowerCase();

  // Document-only mode (universal)
  if (mode === 'document') {
    return sendDocumentFallback(sock, jid, html, title);
  }

  const errors = [];

  // 1) Plain rich — no Meta AI forward (helps stock WhatsApp)
  if (mode === 'auto' || mode === 'rich') {
    try {
      return await relay(sock, jid, shapePlainRich(html, title, responseId), 'plain-rich');
    } catch (e) {
      errors.push('plain-rich:' + (e.message || e));
    }

    // 2) GamesWhats exact
    try {
      return await relay(sock, jid, shapeGamesWhats(html, title, responseId + 'b'), 'gameswhats');
    } catch (e) {
      errors.push('gameswhats:' + (e.message || e));
    }

    // 3) Top-level richResponseMessage
    try {
      return await relay(sock, jid, shapeTopLevelRich(html, title, responseId + 'c'), 'toplevel');
    } catch (e) {
      errors.push('toplevel:' + (e.message || e));
    }

    // 4) Native flow html button
    try {
      return await relay(sock, jid, shapeNativeFlow(html, title), 'nativeflow');
    } catch (e) {
      errors.push('nativeflow:' + (e.message || e));
    }
  }

  // 5) Guaranteed path — HTML document (every WA client can open)
  try {
    return await sendDocumentFallback(sock, jid, html, title);
  } catch (e) {
    errors.push('document:' + (e.message || e));
    console.error('[htmlApp] all failed', errors);
    await sock.sendMessage(jid, {
      text: `🎮 *${title}*\nCould not deliver mini-app.\n${errors.slice(-2).join('\n')}`,
    });
    throw new Error(errors.join(' | '));
  }
}

/**
 * Hybrid: try in-chat rich, AND always send document so stock WA users
 * never stay on "Waiting for this message" with nothing playable.
 */
async function sendHtmlAppSafe(sock, jid, html, title = 'Mini App') {
  html = clampHtml(html);
  title = String(title || 'Mini App').slice(0, 80);
  const responseId = `app-${Date.now()}-${randomBytes(3).toString('hex')}`;
  const hybrid = (config.htmlHybrid !== false) && (process.env.HTML_HYBRID !== '0');

  let richOk = false;
  try {
    await relay(sock, jid, shapePlainRich(html, title, responseId), 'plain-rich');
    richOk = true;
  } catch (e) {
    try {
      await relay(sock, jid, shapeGamesWhats(html, title, responseId + 'g'), 'gameswhats');
      richOk = true;
    } catch (e2) {
      console.warn('[htmlApp] rich failed', e2.message || e2);
    }
  }

  // Stock WhatsApp often shows permanent "Waiting…" for AI-forward cards.
  // Always attach a playable HTML document so the user is never stuck.
  if (hybrid || !richOk) {
    try {
      await sendDocumentFallback(sock, jid, html, title);
    } catch (e) {
      if (!richOk) throw e;
    }
  }
}

module.exports = { sendHtmlApp: sendHtmlAppSafe, sendHtmlAppOnly: sendHtmlApp, sendDocumentFallback };
