const config = require('../config');
const { loadPlugins, matchPlugin } = require('../lib/pluginLoader');
const path = require('path');

function isOwner(m, jid) {
  const owner = String(config.ownerNumber || '').replace(/\D/g, '');
  if (!owner) return true; // if unset, allow
  const candidates = [
    m.key.participant,
    m.participant,
    jid,
    m.key.remoteJid,
  ]
    .filter(Boolean)
    .map((x) => String(x).split('@')[0].split(':')[0].replace(/\D/g, ''));
  return candidates.some((c) => c.endsWith(owner) || owner.endsWith(c));
}

module.exports = {
  name: 'send',
  pattern: 'send',
  aliases: ['sendto', 'sendgame', 'sg'],
  desc: 'Send text/game to chat id (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, cmd, arg, args, sock, m, jid, config: cfg } = ctx;
    if (!isOwner(m, jid)) {
      return reply('⛔ Owner only.');
    }

    // .sendgame <jid> <game>
    if (cmd === 'sendgame' || cmd === 'sg') {
      const target = args[0];
      const game = (args[1] || '').toLowerCase();
      if (!target || !game) {
        return reply('Usage: .sendgame <chatId> <game>\nGet id with .id in that chat');
      }
      if (!target.includes('@')) {
        return reply('Chat id must look like 923xx@s.whatsapp.net or 120xx@g.us');
      }
      // Re-run game plugin handler with overridden jid
      const plugins = ctx.plugins || [];
      const hit = matchPlugin(plugins, (cfg.prefix || '.') + game, cfg.prefix || '.');
      if (!hit || hit.cmd === 'games' || hit.cmd === 'games2') {
        return reply('Unknown game. Try .snake .dino .ttt …');
      }
      await reply(`📤 Sending *${game}* → \`${target}\``);
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

    // .send <jid> <message…>
    const target = args[0];
    const text = args.slice(1).join(' ').trim();
    if (!target || !text) {
      return reply('Usage: .send <chatId> <message>\nGet id with .id');
    }
    if (!target.includes('@')) {
      return reply('Chat id must include @ (from .id)');
    }
    await sock.sendMessage(target, { text });
    await reply(`✅ Sent to \`${target}\``);
  },
};
