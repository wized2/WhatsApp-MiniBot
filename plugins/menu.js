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
      `${p}id — chat / group id\n` +
      `${p}phone — tools mini-app (CFWD, calc, calendar)\n` +
      `${p}calc <expr> — calculator\n` +
      `${p}calendar — today’s date\n` +
      `${p}games — 8 mini games\n` +
      `${p}dice · ${p}coin · ${p}rps rock|paper|scissors\n\n` +
      `*Group (admin)*\n` +
      `${p}del — delete (reply)\n` +
      `${p}kick · ${p}add · ${p}promote · ${p}demote\n` +
      `${p}warn · ${p}unwarn · ${p}warns\n` +
      `${p}approve · ${p}approveall · ${p}reject\n` +
      `${p}tagall · ${p}mute · ${p}unmute\n` +
      `${p}link · ${p}revoke · ${p}groupinfo\n\n` +
      `*Channel forward (owner)*\n` +
      `${p}cfwd help — full guide\n` +
      `${p}cfwd resolve <channel-link>\n` +
      `${p}cfwd add <link|jid> <groupJid> [footer]\n` +
      `${p}cfwd list · ${p}cfwd remove · ${p}cfwd last\n` +
      `${p}ocfwd — original channel forward mode\n\n` +
      `*Owner*\n` +
      `${p}restart/update/refresh <pw>\n` +
      `${p}send <chatId> <text>\n` +
      `${p}vv — unlock view-once (owner)\n` +
      `${p}antinsfw on|off`;
    await reply(text);
  },
};
