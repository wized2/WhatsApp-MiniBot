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
| .send .sendgame
+--------------+
Type .games for full game list
Type .utils for tools`
    );
  },
};
