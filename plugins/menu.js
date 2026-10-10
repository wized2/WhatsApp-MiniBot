module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Menu',
  category: 'main',
  async handler({ reply }) {
    await reply(
`+-- MiniBot --+
| .phone  multi-page apps
| .hub    90+ tools
| .utils  quick tools
| .games  70+ games
| .ping .id
| .fact .joke .quote
| .coin .dice .choose
| .truth .rather .roast
| .send .sendgame
+--------------+
.hub = offline toolkit
.games = full list`
    );
  },
};
