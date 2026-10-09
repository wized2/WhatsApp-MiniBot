const fs = require('fs');
const path = require('path');

function loadPlugins(dir) {
  const plugins = [];
  if (!fs.existsSync(dir)) return plugins;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    try {
      const full = path.join(dir, file);
      delete require.cache[require.resolve(full)];
      const mod = require(full);
      if (!mod || typeof mod.handler !== 'function') {
        console.warn('[plugins] skip (no handler):', file);
        continue;
      }
      plugins.push({
        name: mod.name || file.replace(/\.js$/, ''),
        pattern: mod.pattern,
        aliases: mod.aliases || [],
        desc: mod.desc || '',
        category: mod.category || 'general',
        handler: mod.handler,
        file,
      });
      console.log('[plugins] loaded', file);
    } catch (e) {
      console.error('[plugins] failed', file, e.message);
    }
  }
  return plugins;
}

function matchPlugin(plugins, text, prefix) {
  let raw = String(text || '').trim();
  if (!raw) return null;

  // strip zero-width / bidi marks WhatsApp sometimes injects
  raw = raw.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
  if (raw.charAt(0) === '．') raw = '.' + raw.slice(1);

  const pfx = prefix || '.';
  if (!raw.startsWith(pfx)) return null;
  const body = raw.slice(pfx.length).trim();
  const [cmd, ...rest] = body.split(/\s+/);
  const arg = rest.join(' ').trim();
  const key = (cmd || '').toLowerCase();
  if (!key) return null;

  for (const p of plugins) {
    const names = [p.pattern, ...(p.aliases || [])]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (names.includes(key)) return { plugin: p, cmd: key, arg, args: rest, body };
  }
  return null;
}

function extractText(message) {
  if (!message) return '';
  let msg = message;

  for (let i = 0; i < 8; i++) {
    if (msg.ephemeralMessage?.message) {
      msg = msg.ephemeralMessage.message;
      continue;
    }
    if (msg.viewOnceMessage?.message) {
      msg = msg.viewOnceMessage.message;
      continue;
    }
    if (msg.viewOnceMessageV2?.message) {
      msg = msg.viewOnceMessageV2.message;
      continue;
    }
    if (msg.viewOnceMessageV2Extension?.message) {
      msg = msg.viewOnceMessageV2Extension.message;
      continue;
    }
    if (msg.documentWithCaptionMessage?.message) {
      msg = msg.documentWithCaptionMessage.message;
      continue;
    }
    if (msg.editedMessage?.message) {
      msg = msg.editedMessage.message;
      continue;
    }
    break;
  }

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.title ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedDisplayText ||
    msg.templateButtonReplyMessage?.selectedId ||
    msg.interactiveResponseMessage?.body?.text ||
    msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    ''
  );
}

module.exports = { loadPlugins, matchPlugin, extractText };
