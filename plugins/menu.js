const { buildMenu } = require('../lib/stylish');

module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'commands', 'list'],
  desc: 'Command menu',
  category: 'main',
  async handler({ reply, plugins, config }) {
    await reply(
      buildMenu({
        botName: config.botName || 'MiniBot',
        tagline: config.tagline || 'Games · Utils · Tools',
        prefix: config.prefix || '.',
        plugins,
      })
    );
  },
};
