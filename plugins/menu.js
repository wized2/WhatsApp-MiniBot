module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Menu',
  category: 'main',
  async handler({ reply }) {
    await reply(
`+-- MiniBot --+
| .phone   launcher
| .hub     55+ tools
| .utils   quick tools
| .games   all games
| .ping .id
| .fact .joke .quote
| .coin .dice .choose
| .password .time
| .send .sendgame
+--------------+
.hub = full offline toolkit
.games = full game list`
    );
  },
};
