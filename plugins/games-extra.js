/** Extra aliases routed via games-pack; kept for backward compatibility */
module.exports = {
  name: 'games-extra',
  pattern: 'moregames',
  aliases: ['game', 'play'],
  desc: 'Games list',
  category: 'games',
  async handler({ reply }) {
    await reply('Type *.games* for the full list.');
  },
};
