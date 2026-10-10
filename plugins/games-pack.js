const { sendHtmlApp } = require('../lib/htmlTransport');
const { G, TITLES, ORDER } = require('../lib/gameCatalog');

function gamesList() {
  const lines = ['+-- Games (' + ORDER.length + ') --+'];
  for (let i = 0; i < ORDER.length; i += 1) {
    lines.push('| ' + String(i + 1).padStart(2, ' ') + '. .' + ORDER[i]);
  }
  lines.push('+------------------+');
  return lines.join('\n');
}

module.exports = {
  name: 'games',
  pattern: 'games',
  aliases: ORDER,
  desc: 'All HTML games',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'games') return reply(gamesList());
    if (!G[cmd]) return reply(gamesList());
    await sendHtmlApp(sock, jid, G[cmd], TITLES[cmd] || cmd);
  },
};
