const fs = require('fs');
const path = require('path');

function loadPlugins(dir) {
  const plugins = [];
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs)) return plugins;

  for (const file of fs.readdirSync(abs)) {
    if (!file.endsWith('.js')) continue;
    const full = path.join(abs, file);
    try {
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

  // Normalize full-width / fancy dots people sometimes paste
  if (raw.charAt(0) === '．') raw = '.' + raw.slice(1);

  if (!raw.startsWith(prefix)) return null;
  const body = raw.slice(prefix.length).trim();
  const [cmd, ...rest] = body.split(/\s+/);
  const arg = rest.join(' ').trim();
  const key = (cmd || '').toLowerCase();
  if (!key) return null;

  for (const p of plugins) {
    const names = [p.pattern, ...(p.aliases || [])]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (names.includes(key)) return { plugin: p, cmd: key, arg, body };
  }
  return null;
}

/** Unwrap ephemeral / view-once / edited wrappers and read text */
function extractText(message) {
  if (!message) return '';
  let msg = message;

  for (let i = 0; i < 6; i++) {
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
    msg.listResponseMessage?.title ||
    msg.templateButtonReplyMessage?.selectedDisplayText ||
    msg.interactiveResponseMessage?.body?.text ||
    ''
  );
}

module.exports = { loadPlugins, matchPlugin, extractText };
