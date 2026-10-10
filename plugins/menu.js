module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Menu',
  category: 'main',
  async handler({ reply }) {
    await reply(
`+-- MiniBot --+
| .phone
| .utils
| .games
| .ping
| .id
| .fact .joke .quote
| .coin .dice .choose
| .password .time
| .ship .love .rate
| .send .sendgame
+--------------+`
    );
  },
};
