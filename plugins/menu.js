const { buildMenu } = require('../lib/stylish');

module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'commands', 'list'],
  desc: 'Sleek command menu',
  category: 'main',
  async handler({ reply, plugins, config }) {
    const text = buildMenu({
      botName: config.botName || 'MiniBot',
      tagline: config.tagline || 'Plugins · Games · Utilities',
      prefix: config.prefix || '.',
      plugins,
    });
    await reply(text);
  },
};
