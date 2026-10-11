module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Menu',
  category: 'main',
  async handler(ctx) {
    const { sendMenu } = require('../lib/interactive');
    await sendMenu(
      ctx,
      'MiniBot — pick a section',
      [
        {
          id: 'm_phone',
          label: 'Phone',
          description: 'Launcher apps',
          async run(c) {
            const phone = require('./phone');
            await phone.handler(c);
          },
        },
        {
          id: 'm_hub',
          label: 'Hub tools',
          description: 'Offline toolkit',
          async run(c) {
            const hub = require('./hub');
            await hub.handler(c);
          },
        },
        {
          id: 'm_games',
          label: 'Games',
          description: 'All mini-games',
          async run(c) {
            const g = require('./games-pack');
            // games-pack may export array
            const mod = Array.isArray(g) ? g.find((x) => x.pattern === 'games') : g;
            if (mod) await mod.handler(c);
            else await c.reply('Use .games');
          },
        },
        {
          id: 'm_api',
          label: 'Online APIs',
          description: 'Weather, rates, …',
          async run(c) {
            const api = require('./api-pack');
            const mod = api.find((x) => x.pattern === 'api');
            if (mod) await mod.handler(c);
          },
        },
        {
          id: 'm_fun',
          label: 'Fun',
          description: 'Jokes and more',
          async run(c) {
            const api = require('./api-pack');
            const mod = api.find((x) => x.pattern === 'fun');
            if (mod) await mod.handler(c);
          },
        },
      ],
      { listTitle: 'MiniBot', buttonText: 'Open menu', footer: 'Native list when supported' }
    );
  },
};
