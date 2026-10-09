module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'commands'],
  desc: 'List commands',
  category: 'main',
  async handler({ reply, plugins, config }) {
    const by = {};
    for (const p of plugins) {
      const c = p.category || 'general';
      (by[c] ||= []).push(p);
    }
    let text = `*${config.botName}* · ${config.tagline || ''}\nPrefix: \`${config.prefix}\`\n\n`;
    for (const [cat, list] of Object.entries(by)) {
      text += `*${cat}*\n`;
      for (const p of list) {
        const names = [p.pattern, ...(p.aliases || [])].filter(Boolean);
        // avoid dumping 20 game aliases in menu
        const shown = p.file === 'games-pack.js' ? ['.games', '.snake', '.tetris', '…'] : names.map((n) => config.prefix + n);
        text += `• ${shown.join(' ')} — ${p.desc || ''}\n`;
      }
      text += '\n';
    }
    text += `_Anyone can use commands (public)._`;
    await reply(text.trim());
  },
};
