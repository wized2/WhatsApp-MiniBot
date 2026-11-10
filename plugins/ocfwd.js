const {
  loadRules,
  saveRules,
  isChannelJid,
  parseChannelLink,
  resolveChannelFromLink,
} = require('../lib/channelForward');
const { isOwner } = require('../lib/owner');

function usage() {
  return (
    `*Original channel forward (ocfwd)*\n` +
    `Forwards channel posts into a group as a *real WhatsApp forward*\n` +
    `(channel name tag + Join button), so members can open your channel.\n\n` +
    `· \`.ocfwd add <channelJid|link> <groupJid>\`\n` +
    `· \`.ocfwd list\`\n` +
    `· \`.ocfwd remove <channelJid|link>\`\n\n` +
    `Tip: hub channel → group with ocfwd; source channels → hub with normal \`.cfwd add\`.`
  );
}

async function resolveFromArg(sock, token) {
  if (isChannelJid(token)) return { jid: token, name: null };
  if (parseChannelLink(token) || /^[A-Za-z0-9_-]{10,}$/.test(token)) {
    return resolveChannelFromLink(sock, token);
  }
  return null;
}

module.exports = [
  {
    name: 'ocfwd',
    pattern: 'ocfwd',
    aliases: ['originalfwd', 'ofwd'],
    desc: 'Original WA channel→group forward with Join button (owner)',
    category: 'owner',
    async handler(ctx) {
      const { args, reply, sock } = ctx;
      if (!isOwner(ctx)) {
        await reply('Owner only.');
        return;
      }
      const sub = (args[0] || '').toLowerCase();
      if (!sub || sub === 'help') {
        await reply(usage());
        return;
      }
      if (sub === 'list') {
        const rules = loadRules().filter(
          (r) => String(r.mode || '').toLowerCase() === 'ocfwd' || r.nativeForward === true
        );
        if (!rules.length) {
          await reply('No ocfwd rules. Use `.ocfwd add <channel> <groupJid>`');
          return;
        }
        const lines = rules.map(
          (r, i) => `${i + 1}. \`${r.from}\`\n   → \`${r.to}\`${r.enabled === false ? ' (off)' : ''}`
        );
        await reply(`*ocfwd rules (${rules.length})*\n\n` + lines.join('\n\n'));
        return;
      }
      if (sub === 'add') {
        const fromTok = args[1];
        const to = String(args[2] || '').trim();
        if (!fromTok || !to) {
          await reply(
            'Usage:\n`.ocfwd add <channelJid|link> <groupJid>`\n\n' +
              'Example:\n`.ocfwd add 120363…@newsletter 120363…@g.us`'
          );
          return;
        }
        if (!to.endsWith('@g.us')) {
          await reply('ocfwd target must be a group `@g.us` (Join button is for groups).');
          return;
        }
        try {
          const resolved = await resolveFromArg(sock, fromTok);
          if (!resolved?.jid || !isChannelJid(resolved.jid)) {
            await reply('Source must be a channel jid or whatsapp.com/channel/… link.');
            return;
          }
          const from = resolved.jid;
          const rules = loadRules().filter((r) => !(r.from === from && r.to === to));
          rules.push({
            from,
            to,
            mode: 'ocfwd',
            nativeForward: true,
            includeMedia: true,
            enabled: true,
          });
          saveRules(rules);
          let msg =
            `Added *ocfwd* (original forward):\n\`${from}\`\n→ \`${to}\`\n\n` +
            `Posts appear in the group with the channel tag and Join button.`;
          if (resolved.name) msg += `\nChannel: ${resolved.name}`;
          await reply(msg);
        } catch (e) {
          await reply('Add failed: ' + (e.message || e));
        }
        return;
      }
      if (sub === 'remove' || sub === 'rm' || sub === 'del') {
        const fromTok = args[1];
        if (!fromTok) {
          await reply('Usage: `.ocfwd remove <channelJid|link>`');
          return;
        }
        try {
          const resolved = await resolveFromArg(sock, fromTok);
          const from = resolved?.jid || fromTok;
          const before = loadRules();
          const rules = before.filter(
            (r) =>
              !(
                r.from === from &&
                (String(r.mode || '').toLowerCase() === 'ocfwd' || r.nativeForward === true)
              )
          );
          saveRules(rules);
          await reply(`Removed ${before.length - rules.length} ocfwd rule(s) for \`${from}\``);
        } catch (e) {
          await reply('Remove failed: ' + (e.message || e));
        }
        return;
      }
      await reply(usage());
    },
  },
];
