module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Menu',
  category: 'main',
  async handler({ reply }) {
    await reply(
`+-- MiniBot --+
| .phone  launcher
| .hub    90+ offline tools
| .utils  quick tools
| .games  70+ games
| .apimenu  online APIs
| .funapi   fun APIs
| .weather .pray .rate
| .define .tr .github
| .dog .cat .qr .trivia
| .ping .id .send
+--------------+
.apimenu = interactive API list
Anti-spam rate limit is on`
    );
  },
};
