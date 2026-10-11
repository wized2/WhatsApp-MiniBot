/**
 * Native WhatsApp interactive messages (buttons + lists).
 * Uses interactiveMessage / nativeFlowMessage via Baileys proto.
 * Falls back to plain text menu if the client rejects native payloads.
 */
const { generateWAMessageFromContent, proto } = require('baileys');
const { setSession } = require('./interactive');

async function sendNativeButtons(sock, jid, { text, footer, buttons, quoted }) {
  const flowButtons = (buttons || []).slice(0, 3).map((b) => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: String(b.text || b.label || b.id),
      id: String(b.id),
    }),
  }));

  const content = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text: String(text || ''),
          }),
          footer: footer
            ? proto.Message.InteractiveMessage.Footer.create({ text: String(footer) })
            : undefined,
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: flowButtons,
          }),
        }),
      },
    },
  };

  const msg = generateWAMessageFromContent(jid, content, {});
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

async function sendNativeList(sock, jid, { text, footer, buttonText, title, sections, quoted }) {
  const params = {
    title: String(title || buttonText || 'Menu'),
    sections: (sections || []).map((sec) => ({
      title: String(sec.title || ''),
      rows: (sec.rows || []).map((r) => ({
        header: r.header ? String(r.header) : '',
        title: String(r.title || r.label || r.id),
        description: r.description ? String(r.description) : '',
        id: String(r.id || r.rowId),
      })),
    })),
  };

  const content = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text: String(text || ''),
          }),
          footer: footer
            ? proto.Message.InteractiveMessage.Footer.create({ text: String(footer) })
            : undefined,
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
              {
                name: 'single_select',
                buttonParamsJson: JSON.stringify(params),
              },
            ],
          }),
        }),
      },
    },
  };

  const msg = generateWAMessageFromContent(jid, content, {});
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

/**
 * High-level menu: native list when possible, else numbered text + session.
 * options: [{ id, label, description?, run }]
 */
async function sendInteractiveMenu(ctx, title, options, opts = {}) {
  const { sock, jid, reply } = ctx;
  const rows = options.map((o, i) => ({
    id: o.id || 'opt_' + (i + 1),
    title: o.label,
    description: o.description || '',
  }));

  // Keep session for numbered fallback and for when button id arrives as text
  setSession(
    jid,
    options.map((o, i) => ({
      ...o,
      id: o.id || 'opt_' + (i + 1),
    }))
  );

  try {
    if (options.length <= 3 && opts.preferButtons) {
      await sendNativeButtons(sock, jid, {
        text: title,
        footer: opts.footer || 'MiniBot',
        buttons: options.map((o, i) => ({
          id: o.id || 'opt_' + (i + 1),
          text: o.label,
        })),
      });
      return { mode: 'buttons' };
    }

    await sendNativeList(sock, jid, {
      text: title,
      footer: opts.footer || 'MiniBot',
      title: opts.listTitle || 'Options',
      buttonText: opts.buttonText || 'Open menu',
      sections: [{ title: opts.sectionTitle || 'Choose', rows }],
    });
    return { mode: 'list' };
  } catch (e) {
    console.warn('[nativeInteractive] fallback text', e.message || e);
    const lines = [title, ''];
    options.forEach((o, i) => lines.push(i + 1 + ') ' + o.label));
    lines.push('', 'Reply with a number');
    await reply(lines.join('\n'));
    return { mode: 'text' };
  }
}

module.exports = {
  sendNativeButtons,
  sendNativeList,
  sendInteractiveMenu,
};
