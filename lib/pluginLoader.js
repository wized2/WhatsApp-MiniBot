const fs = require('fs');
const path = require('path');

/**
 * Load every *.js file in plugins/ that exports { pattern, handler }
 */
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
  const raw = String(text || '').trim();
  if (!raw.startsWith(prefix)) return null;
  const body = raw.slice(prefix.length).trim();
  const [cmd, ...rest] = body.split(/\s+/);
  const arg = rest.join(' ').trim();
  const key = (cmd || '').toLowerCase();

  for (const p of plugins) {
    const names = [p.pattern, ...(p.aliases || [])]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (names.includes(key)) return { plugin: p, cmd: key, arg, body };
  }
  return null;
}

module.exports = { loadPlugins, matchPlugin };
