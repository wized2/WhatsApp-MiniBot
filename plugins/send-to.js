const { isOwner } = require('../lib/owner');

module.exports = {
  name: 'send',
  pattern: 'send',
  aliases: ['sendto'],
  desc: 'Send text to a chat id (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, args, sock, config: cfg, text } = ctx;

    if (!isOwner(ctx)) {
      return reply('Owner only.');
    }

    const target = args[0];
    if (!target || !target.includes('@')) {
      return reply('Usage: .send <chatId> <text>\nGet id with .id in that chat');
    }
    // rest of message after target
    const body = String(text || '')
      .replace(/^\S+\s+\S+\s+/, '') // strip ".send <target> "
      .trim();
    if (!body) {
      return reply('Usage: .send <chatId> <text>');
    }
    try {
      await sock.sendMessage(target, { text: body });
      return reply('Sent to `' + target + '`');
    } catch (e) {
      return reply('Send failed: ' + (e.message || e));
    }
  },
};
