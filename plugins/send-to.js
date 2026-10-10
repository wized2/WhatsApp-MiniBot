const { matchPlugin } = require('../lib/pluginLoader');
const { isOwner } = require('../lib/owner');

module.exports = {
  name: 'send',
  pattern: 'send',
  aliases: ['sendto', 'sendgame', 'sg'],
  desc: 'Send text or game to a chat id (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, cmd, args, sock, config: cfg } = ctx;

    if (!isOwner(ctx)) {
      const who = String(ctx.sender || ctx.jid || '')
        .split('@')[0]
        .split(':')[0];
      return reply(
        'Owner only.\nYour id: ' +
          who +
          '\nConfigured: ' +
          String((cfg && cfg.ownerNumber) || '') +
          '\nTip: set ownerNumber in config.js to your full number (e.g. 92307...).'
      );
    }

    if (cmd === 'sendgame' || cmd === 'sg') {
      const target = args[0];
      const game = (args[1] || '').toLowerCase();
      if (!target || !game) {
        return reply('Usage: .sendgame <chatId> <game>\nGet id with .id in that chat');
      }
      if (!target.includes('@')) {
        return reply('Chat id must look like 923xx@s.whatsapp.net or 120xx@g.us');
      }
      const plugins = ctx.plugins || [];
      const hit = matchPlugin(plugins, (cfg.prefix || '.') + game, cfg.prefix || '.');
      if (!hit || hit.cmd === 'games') {
        return reply('Unknown game. Type .games');
      }
      await reply('Sending ' + game + ' -> ' + target);
      const subCtx = {
        ...ctx,
        jid: target,
        reply: async (content) => {
          if (typeof content === 'string') return sock.sendMessage(target, { text: content });
          return sock.sendMessage(target, content);
        },
      };
      await hit.plugin.handler(subCtx);
      return;
    }

    const target = args[0];
    const text = args.slice(1).join(' ').trim();
    if (!target || !text) {
      return reply('Usage: .send <chatId> <message>\nGet id with .id');
    }
    if (!target.includes('@')) {
      return reply('Chat id must include @ (from .id)');
    }
    await sock.sendMessage(target, { text });
    await reply('Sent to ' + target);
  },
};
