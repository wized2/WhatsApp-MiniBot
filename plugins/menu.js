module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Show commands',
  category: 'main',
  async handler({ reply, config }) {
    const p = config.prefix || '.';
    const text =
      `*${config.botName || 'MiniBot'}*\n` +
      `${config.tagline || 'Channel forward'}\n\n` +
      `*Main*\n` +
      `${p}menu — this help\n` +
      `${p}ping — latency\n` +
      `${p}id — chat / group id\n\n` +
      `*Channel forward (owner)*\n` +
      `${p}cfwd help — full guide\n` +
      `${p}cfwd resolve <channel-link>\n` +
      `${p}cfwd add <link|jid> <groupJid> [footer]\n` +
      `${p}cfwd footer <link|jid> <text>\n` +
      `${p}phone — CFWD builder mini-app
${p}restart/update/refresh <pw>
${p}cfwd list · ${p}cfwd remove · ${p}cfwd last\n\n` +
      `*Owner*\n` +
      `${p}send <chatId> <text> — send a message to a jid`;
    await reply(text);
  },
};
