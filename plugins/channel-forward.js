const {
  loadRules,
  saveRules,
  isChannelJid,
} = require('../lib/channelForward');
const { isOwner } = require('../lib/owner');

function usage() {
  return (
    `*Channel forward*\n` +
    `Relay channel posts → a group (edit optional).\n\n` +
    `How to get a channel id (you cannot post there):\n` +
    `1. Follow the channel on the bot number\n` +
    `2. \`.cfwd log on\` — next posts print the id in server logs\n` +
    `3. Or \`.cfwd last\` after a channel post arrives\n\n` +
    `Commands (owner):\n` +
    `• \`.cfwd list\`\n` +
    `• \`.cfwd add <channelJid> <groupJid> [prefix]\`\n` +
    `• \`.cfwd remove <channelJid>\`\n` +
    `• \`.cfwd log on|off\`\n` +
    `• \`.cfwd last\` — last seen channel jid\n` +
    `• \`.cfwd help\`\n\n` +
    `Group id: run \`.id\` inside the target group.`
  );
}

// Module-level last seen channel (also set from index)
const seen = { lastChannelJid: null, lastAt: 0 };

function noteChannel(jid) {
  if (isChannelJid(jid)) {
    seen.lastChannelJid = jid;
    seen.lastAt = Date.now();
  }
}

module.exports = [
  {
    name: 'cfwd',
    pattern: 'cfwd',
    aliases: ['channelfwd', 'forwardchannel', 'cf'],
    desc: 'Channel → group auto-forward (owner)',
    category: 'owner',
    async handler(ctx) {
      const { arg, args, reply, sender, config } = ctx;
      if (!isOwner(sender, config)) {
        await reply('Owner only.');
        return;
      }
      const sub = (args[0] || '').toLowerCase();
      if (!sub || sub === 'help') {
        await reply(usage());
        return;
      }
      if (sub === 'list') {
        const rules = loadRules();
        if (!rules.length) {
          await reply('No forward rules. Use `.cfwd add …`');
          return;
        }
        const lines = rules.map(
          (r, i) =>
            `${i + 1}. \`${r.from}\`\n   → \`${r.to}\`${r.prefix ? `\n   prefix: ${r.prefix}` : ''}${r.enabled === false ? ' (disabled)' : ''}`
        );
        await reply('*Forward rules*\n' + lines.join('\n'));
        return;
      }
      if (sub === 'log') {
        const on = String(args[1] || '').toLowerCase();
        config.channelForwardLog = on === 'on' || on === '1' || on === 'true';
        await reply(
          config.channelForwardLog
            ? 'Channel jid logging ON — watch server console when a channel posts.'
            : 'Channel jid logging OFF.'
        );
        return;
      }
      if (sub === 'last') {
        if (!seen.lastChannelJid) {
          await reply('No channel message seen yet. Follow the channel, wait for a post, try again.');
          return;
        }
        await reply(
          `Last channel jid:\n\`${seen.lastChannelJid}\`\n(${Math.round((Date.now() - seen.lastAt) / 1000)}s ago)`
        );
        return;
      }
      if (sub === 'add') {
        const from = args[1];
        const to = args[2];
        const prefix = args.slice(3).join(' ') || '';
        if (!from || !to) {
          await reply('Usage: `.cfwd add <channelJid> <groupJid> [prefix]`');
          return;
        }
        if (!isChannelJid(from)) {
          await reply('Channel jid should end with `@newsletter`');
          return;
        }
        if (!String(to).endsWith('@g.us') && !String(to).endsWith('@s.whatsapp.net')) {
          await reply('Target should be a group `@g.us` (or a DM jid).');
          return;
        }
        const rules = loadRules().filter((r) => !(r.from === from && r.to === to));
        rules.push({
          from,
          to,
          prefix,
          includeMedia: true,
          enabled: true,
        });
        saveRules(rules);
        await reply(`Added forward:\n\`${from}\`\n→ \`${to}\`${prefix ? `\nprefix: ${prefix}` : ''}`);
        return;
      }
      if (sub === 'remove' || sub === 'rm' || sub === 'del') {
        const from = args[1];
        if (!from) {
          await reply('Usage: `.cfwd remove <channelJid>`');
          return;
        }
        const before = loadRules();
        const rules = before.filter((r) => r.from !== from);
        saveRules(rules);
        await reply(`Removed ${before.length - rules.length} rule(s) for \`${from}\``);
        return;
      }
      await reply(usage());
    },
  },
];

module.exports.noteChannel = noteChannel;
module.exports.seen = seen;
