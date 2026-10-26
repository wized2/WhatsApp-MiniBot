const {
  loadRules,
  saveRules,
  loadSettings,
  saveSettings,
  isChannelJid,
  parseChannelLink,
  resolveChannelFromLink,
  toBoldLine,
} = require('../lib/channelForward');
const { isOwner } = require('../lib/owner');

function usage() {
  return (
    `*Channel forward*
` +
    `Relay channel posts → group. Strip emoji / channel name. Footer optional.

` +
    `*Setup*
` +
    `· \`.cfwd resolve <channel-link>\`
` +
    `· \`.cfwd add <link|jid> <groupJid> [footer]\`
` +
    `· \`.cfwd footer <link|jid> <text>\`

` +
    `*Strip (per channel)*
` +
    `· \`.cfwd strip emoji <jid|link> on|off\`
` +
    `· \`.cfwd strip name <jid|link> PAKISTAN EXPRESS LIVE\`
` +
    `· \`.cfwd strip add <jid|link> <phrase>\` — drop lines containing phrase
` +
    `· \`.cfwd strip rm <jid|link> <phrase>\`
` +
    `· \`.cfwd strip list <jid|link>\`

` +
    `*Global (all rules)*
` +
    `· \`.cfwd striplinks on|off\` — strip WhatsApp channel/group links; skip link-only posts

` +
    `· \`.cfwd list\` · \`.cfwd remove\` · \`.cfwd last\``
  );
}

const seen = { lastChannelJid: null, lastAt: 0 };

function noteChannel(jid) {
  if (isChannelJid(jid)) {
    seen.lastChannelJid = jid;
    seen.lastAt = Date.now();
  }
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
    name: 'cfwd',
    pattern: 'cfwd',
    aliases: ['channelfwd', 'forwardchannel', 'cf'],
    desc: 'Channel → group auto-forward (owner)',
    category: 'owner',
    async handler(ctx) {
      const { arg, args, reply, sender, config, sock } = ctx;
      if (!isOwner(ctx)) {
        await reply(
          'Owner only.\nYour sender: `' +
            String(sender || '') +
            '`\nSet ownerNumber in config to your phone (e.g. 92307…).'
        );
        return;
      }
      const sub = (args[0] || '').toLowerCase();
      if (!sub || sub === 'help') {
        await reply(usage());
        return;
      }
      if (sub === 'list') {
        const rules = loadRules();
        const st = loadSettings();
        if (!rules.length) {
          await reply(
            'No forward rules. Use `.cfwd add …`\n' +
              `Global strip links: *${st.stripLinks ? 'on' : 'off'}*`
          );
          return;
        }
        const lines = rules.map((r, i) => {
          let s = `${i + 1}. \`${r.from}\`\n   → \`${r.to}\``;
          if (r.footer) s += `\n   footer: ${toBoldLine(r.footer)}`;
          if (r.prefix) s += `\n   prefix: ${r.prefix}`;
          if (r.enabled === false) s += ' (disabled)';
          return s;
        });
        await reply(
          '*Forward rules*\n' +
            lines.join('\n') +
            `\n\nGlobal strip links: *${st.stripLinks ? 'on' : 'off'}*\n` +
            'Toggle: `.cfwd striplinks on|off`'
        );
        return;
      }
      if (sub === 'resolve' || sub === 'id' || sub === 'link') {
        const link = args.slice(1).join(' ').trim() || arg.replace(/^(resolve|id|link)\s+/i, '').trim();
        if (!link) {
          await reply('Usage: `.cfwd resolve https://whatsapp.com/channel/XXXX`');
          return;
        }
        try {
          const r = await resolveChannelFromLink(sock, link);
          noteChannel(r.jid);
          let text = `Channel id:\n\`${r.jid}\``;
          if (r.name) text += `\nName: ${r.name}`;
          if (r.inviteCode) text += `\nInvite: \`${r.inviteCode}\``;
          if (r.postId) text += `\nPost id: ${r.postId}`;
          text += `\n\nAdd:\n.cfwd add ${r.jid} <groupJid> Dark News`;
          await reply(text);
        } catch (e) {
          await reply('Resolve failed: ' + (e.message || e));
        }
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
          await reply('No channel message seen yet. Follow the channel, wait for a post, or `.cfwd resolve <link>`.');
          return;
        }
        await reply(
          `Last channel jid:\n\`${seen.lastChannelJid}\`\n(${Math.round((Date.now() - seen.lastAt) / 1000)}s ago)`
        );
        return;
      }
      if (sub === 'footer' || sub === 'brand') {
        const fromTok = args[1];
        const footer = args.slice(2).join(' ').trim();
        if (!fromTok || !footer) {
          await reply('Usage: `.cfwd footer <channelJid|link> Dark News`');
          return;
        }
        try {
          const resolved = await resolveFromArg(sock, fromTok);
          if (!resolved?.jid) {
            await reply('Need a channel jid or whatsapp.com/channel/… link');
            return;
          }
          const rules = loadRules();
          let n = 0;
          for (const r of rules) {
            if (r.from === resolved.jid) {
              r.footer = footer;
              r.footerBold = true;
              n += 1;
            }
          }
          if (!n) {
            await reply('No rule for that channel. Add one first with `.cfwd add`.');
            return;
          }
          saveRules(rules);
          await reply(`Footer set for \`${resolved.jid}\`:\n\n${toBoldLine(footer)}`);
        } catch (e) {
          await reply('Failed: ' + (e.message || e));
        }
        return;
      }

      if (sub === 'striplinks' || sub === 'links' || sub === 'striplink') {
        const val = (args[1] || '').toLowerCase();
        if (val !== 'on' && val !== 'off' && val !== '1' && val !== '0' && val !== 'true' && val !== 'false') {
          const st = loadSettings();
          await reply(
            `Global strip WhatsApp links: *${st.stripLinks ? 'on' : 'off'}*\n\n` +
              '`.cfwd striplinks on` — remove channel/group links; skip link-only and join/follow promo posts\n' +
              '`.cfwd striplinks off` — keep links as in the original'
          );
          return;
        }
        const on = val === 'on' || val === '1' || val === 'true';
        const st = saveSettings({ ...loadSettings(), stripLinks: on });
        await reply(
          on
            ? 'Strip links *on* for all rules.\nWA channel/group URLs removed; link-only and join/share promo posts are not forwarded.'
            : 'Strip links *off*. Links are kept as posted.'
        );
        return;
      }

      if (sub === 'strip') {
        const action = (args[1] || '').toLowerCase();
        const targetTok = args[2];
        if (!action || action === 'help') {
          await reply(
            '*Strip help*\n' +
              '`.cfwd strip emoji <channel> on|off`\n' +
              '`.cfwd strip name <channel> CHANNEL NAME HERE`\n' +
              '`.cfwd strip add <channel> phrase to remove`\n' +
              '`.cfwd strip rm <channel> phrase`\n' +
              '`.cfwd strip list <channel>`\n\n' +
              'Phrases remove *whole lines* that contain them (e.g. channel brand).'
          );
          return;
        }
        if (!targetTok && action !== 'help') {
          await reply('Usage: `.cfwd strip <emoji|name|add|rm|list> <channelJid|link> …`');
          return;
        }
        try {
          const resolved = await resolveFromArg(sock, targetTok);
          if (!resolved?.jid) {
            await reply('Need channel jid or whatsapp.com/channel/… link');
            return;
          }
          const from = resolved.jid;
          const rules = loadRules();
          const matched = rules.filter((r) => r.from === from);
          if (!matched.length) {
            await reply('No rule for that channel. `.cfwd add` first.');
            return;
          }
          if (action === 'list') {
            const r0 = matched[0];
            const phrases = [].concat(r0.stripPhrases || []).concat(r0.stripNames || []);
            if (r0.channelName) phrases.push(r0.channelName);
            await reply(
              `Strip for \`${from}\`\n` +
                `emoji: ${r0.stripEmojis ? 'on' : 'off'}\n` +
                `phrases/lines:\n` +
                (phrases.length ? phrases.map((x) => '· ' + x).join('\n') : '(none)')
            );
            return;
          }
          if (action === 'emoji') {
            const on = String(args[3] || '').toLowerCase();
            const val = on === 'on' || on === '1' || on === 'true';
            for (const r of matched) r.stripEmojis = val;
            saveRules(rules);
            await reply(`Emoji strip ${val ? 'ON' : 'OFF'} for \`${from}\``);
            return;
          }
          if (action === 'name' || action === 'add') {
            const phrase = args.slice(3).join(' ').trim();
            if (!phrase) {
              await reply('Usage: `.cfwd strip name <channel> PAKISTAN EXPRESS LIVE`');
              return;
            }
            for (const r of matched) {
              if (!Array.isArray(r.stripPhrases)) r.stripPhrases = [];
              if (!r.stripPhrases.some((x) => String(x).toLowerCase() === phrase.toLowerCase())) {
                r.stripPhrases.push(phrase);
              }
              r.stripLines = true;
              if (action === 'name') r.channelName = phrase;
            }
            saveRules(rules);
            await reply(`Will drop lines containing:\n${phrase}\n\n(channel \`${from}\`)`);
            return;
          }
          if (action === 'rm' || action === 'remove' || action === 'del') {
            const phrase = args.slice(3).join(' ').trim();
            if (!phrase) {
              await reply('Usage: `.cfwd strip rm <channel> phrase`');
              return;
            }
            for (const r of matched) {
              const low = phrase.toLowerCase();
              r.stripPhrases = (r.stripPhrases || []).filter((x) => String(x).toLowerCase() !== low);
              r.stripNames = (r.stripNames || []).filter((x) => String(x).toLowerCase() !== low);
              if (r.channelName && String(r.channelName).toLowerCase() === low) delete r.channelName;
            }
            saveRules(rules);
            await reply(`Removed strip phrase: ${phrase}`);
            return;
          }
          await reply('Unknown strip action. `.cfwd strip help`');
        } catch (e) {
          await reply('Strip failed: ' + (e.message || e));
        }
        return;
      }

      if (sub === 'add') {
        const fromTok = args[1];
        const to = args[2];
        const footer = args.slice(3).join(' ').trim();
        if (!fromTok || !to) {
          await reply(
            'Usage:\n`.cfwd add <channelJid|link> <groupJid> [footer]`\n\n' +
              'Example:\n`.cfwd add https://whatsapp.com/channel/XXXX 120363…@g.us Dark News`'
          );
          return;
        }
        if (!String(to).endsWith('@g.us') && !String(to).endsWith('@s.whatsapp.net')) {
          await reply('Target should be a group `@g.us` (run `.id` in the group).');
          return;
        }
        try {
          const resolved = await resolveFromArg(sock, fromTok);
          if (!resolved?.jid || !isChannelJid(resolved.jid)) {
            await reply('Could not get channel jid. Use a full channel link or `…@newsletter` id.');
            return;
          }
          const from = resolved.jid;
          const rules = loadRules().filter((r) => !(r.from === from && r.to === to));
          const rule = {
            from,
            to,
            includeMedia: true,
            enabled: true,
            footerBold: true,
          };
          if (footer) rule.footer = footer;
          rules.push(rule);
          saveRules(rules);
          let msg = `Added forward:\n\`${from}\`\n→ \`${to}\``;
          if (resolved.name) msg += `\nChannel: ${resolved.name}`;
          if (footer) msg += `\nFooter (new line, bold):\n${toBoldLine(footer)}`;
          await reply(msg);
        } catch (e) {
          await reply('Add failed: ' + (e.message || e));
        }
        return;
      }
      if (sub === 'remove' || sub === 'rm' || sub === 'del') {
        const fromTok = args[1];
        if (!fromTok) {
          await reply('Usage: `.cfwd remove <channelJid|link>`');
          return;
        }
        try {
          const resolved = await resolveFromArg(sock, fromTok);
          const from = resolved?.jid || fromTok;
          const before = loadRules();
          const rules = before.filter((r) => r.from !== from);
          saveRules(rules);
          await reply(`Removed ${before.length - rules.length} rule(s) for \`${from}\``);
        } catch (e) {
          await reply('Remove failed: ' + (e.message || e));
        }
        return;
      }
      await reply(usage());
    },
  },
];

module.exports.noteChannel = noteChannel;
module.exports.seen = seen;
