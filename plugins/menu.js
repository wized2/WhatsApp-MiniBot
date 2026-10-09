module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'start'],
  desc: 'Show all commands',
  category: 'main',
  async handler({ reply, config, plugins }) {
    const groups = {};
    for (const p of plugins) {
      const c = p.category || 'general';
      if (!groups[c]) groups[c] = [];
      groups[c].push(p);
    }

    let text = `*${config.botName}*\n${config.tagline || ''}\n\n`;
    text += `Prefix: \`${config.prefix}\`\n\n`;

    for (const [cat, list] of Object.entries(groups)) {
      text += `*${cat.toUpperCase()}*\n`;
      for (const p of list) {
        text += `• ${config.prefix}${p.pattern}`;
        if (p.desc) text += ` — ${p.desc}`;
        text += '\n';
      }
      text += '\n';
    }

    text += `_Mini games & apps run as interactive text / cards in chat._`;
    await reply(text.trim());
  },
};
