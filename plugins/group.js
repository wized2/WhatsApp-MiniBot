/**
 * Basic group moderation commands (Baileys).
 * .del .kick .add .warn .unwarn .warns .promote .demote
 * .approve .approveall .reject .tagall .mute .unmute .link .revoke
 */
const {
  assertGroupAdmin,
  getTargets,
  toUserJid,
  bare,
  addWarn,
  clearWarns,
  getWarns,
  listGroupWarns,
  MAX_WARNS,
  isGroupJid,
} = require('../lib/groupHelpers');

function mentionText(jids) {
  return (jids || []).map((j) => '@' + bare(j)).join(' ');
}

async function deleteQuoted(sock, m, jid) {
  const ctx =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo ||
    m.message?.contextInfo;
  if (!ctx || !ctx.stanzaId) return false;
  const key = {
    remoteJid: jid,
    fromMe: !!ctx.participant ? false : !!m.key?.fromMe,
    id: ctx.stanzaId,
    participant: ctx.participant || undefined,
  };
  // Prefer participant from context when present
  if (ctx.participant) {
    key.fromMe = false;
    key.participant = ctx.participant;
  }
  try {
    await sock.sendMessage(jid, { delete: key });
    return true;
  } catch (e) {
    console.warn('[del]', e.message || e);
    return false;
  }
}

module.exports = [
  {
    name: 'del',
    pattern: 'del',
    aliases: ['delete', 'd', 'unsend'],
    desc: 'Delete a message (reply to it). Admin.',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const ok = await deleteQuoted(sock, m, jid);
      if (!ok) return reply('Reply to the message you want to delete.');
    },
  },
  {
    name: 'kick',
    pattern: 'kick',
    aliases: ['remove', 'ban'],
    desc: 'Remove member(s). Reply / mention / number.',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, args, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const targets = getTargets(m, args);
      if (!targets.length) return reply('Usage: `.kick @user` or reply to their message.');
      try {
        const res = await sock.groupParticipantsUpdate(jid, targets, 'remove');
        const ok = (res || []).filter((r) => !r.status || String(r.status).startsWith('2'));
        await reply(`Removed ${ok.length || targets.length} member(s).\n${mentionText(targets)}`, {
          // mentions via plain text; WA shows numbers
        });
      } catch (e) {
        await reply('Kick failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'add',
    pattern: 'add',
    aliases: ['addmember'],
    desc: 'Add member by number. Admin.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, args, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const targets = [];
      for (const a of args) {
        const j = toUserJid(a);
        if (j) targets.push(j);
      }
      if (!targets.length) return reply('Usage: `.add 923001234567`');
      try {
        const res = await sock.groupParticipantsUpdate(jid, targets, 'add');
        const lines = (res || []).map((r) => {
          const st = String(r.status || '');
          const who = bare(r.jid) || r.jid;
          if (st === '200' || st.startsWith('2')) return `✓ ${who}`;
          return `✗ ${who} (${st || 'failed'})`;
        });
        await reply('Add result:\n' + (lines.join('\n') || 'done'));
      } catch (e) {
        await reply('Add failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'promote',
    pattern: 'promote',
    aliases: ['admin'],
    desc: 'Promote to admin. Reply / mention.',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, args, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const targets = getTargets(m, args);
      if (!targets.length) return reply('Usage: `.promote @user`');
      try {
        await sock.groupParticipantsUpdate(jid, targets, 'promote');
        await reply('Promoted: ' + mentionText(targets));
      } catch (e) {
        await reply('Promote failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'demote',
    pattern: 'demote',
    aliases: ['unadmin'],
    desc: 'Demote admin. Reply / mention.',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, args, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const targets = getTargets(m, args);
      if (!targets.length) return reply('Usage: `.demote @user`');
      try {
        await sock.groupParticipantsUpdate(jid, targets, 'demote');
        await reply('Demoted: ' + mentionText(targets));
      } catch (e) {
        await reply('Demote failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'warn',
    pattern: 'warn',
    aliases: ['warning'],
    desc: 'Warn a member (auto-kick at 3).',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, args, sender, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const targets = getTargets(m, args);
      if (!targets.length) return reply('Usage: `.warn @user [reason]`');
      // reason = args after numbers/mentions
      const reason = args
        .filter((a) => !/^\d{8,}$/.test(String(a).replace(/\D/g, '')) && !String(a).startsWith('@'))
        .join(' ')
        .trim();
      const lines = [];
      for (const t of targets) {
        const w = addWarn(jid, t, sender, reason);
        lines.push(`@${bare(t)} → warn ${w.count}/${MAX_WARNS}${reason ? ' (' + reason + ')' : ''}`);
        if (w.count >= MAX_WARNS) {
          try {
            await sock.groupParticipantsUpdate(jid, [t], 'remove');
            clearWarns(jid, t);
            lines.push(`  ↳ auto-kicked (reached ${MAX_WARNS})`);
          } catch (e) {
            lines.push('  ↳ kick failed: ' + (e.message || e));
          }
        }
      }
      await reply(lines.join('\n'));
    },
  },
  {
    name: 'unwarn',
    pattern: 'unwarn',
    aliases: ['delwarn', 'resetwarn'],
    desc: 'Clear warns for a member.',
    category: 'group',
    async handler(ctx) {
      const { m, jid, args, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const targets = getTargets(m, args);
      if (!targets.length) return reply('Usage: `.unwarn @user`');
      for (const t of targets) clearWarns(jid, t);
      await reply('Warns cleared for ' + mentionText(targets));
    },
  },
  {
    name: 'warns',
    pattern: 'warns',
    aliases: ['warnings', 'listwarn'],
    desc: 'Show warns for a user or the group.',
    category: 'group',
    async handler(ctx) {
      const { m, jid, args, reply } = ctx;
      if (!isGroupJid(jid)) return reply('Group only.');
      const targets = getTargets(m, args);
      if (targets.length) {
        const lines = targets.map((t) => {
          const w = getWarns(jid, t);
          return `@${bare(t)}: ${w.count}/${MAX_WARNS}`;
        });
        return reply(lines.join('\n'));
      }
      const list = listGroupWarns(jid);
      if (!list.length) return reply('No active warns in this group.');
      const lines = list.slice(0, 20).map((x) => `@${x.user}: ${x.count}/${MAX_WARNS}`);
      await reply('Active warns:\n' + lines.join('\n'));
    },
  },
  {
    name: 'approve',
    pattern: 'approve',
    aliases: ['accept'],
    desc: 'Approve pending join request(s).',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, args, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      let targets = getTargets(m, args);
      if (!targets.length) {
        // try list pending
        try {
          const pending = await sock.groupRequestParticipantsList(jid);
          targets = (pending || []).map((p) => p.jid || p.id).filter(Boolean);
        } catch (_) {}
      }
      if (!targets.length) return reply('No pending requests (or pass numbers).\nUsage: `.approve @user` or `.approveall`');
      try {
        const res = await sock.groupRequestParticipantsUpdate(jid, targets, 'approve');
        await reply(`Approved ${targets.length}.\n` + mentionText(targets));
        console.log('[approve]', res);
      } catch (e) {
        await reply('Approve failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'approveall',
    pattern: 'approveall',
    aliases: ['acceptall'],
    desc: 'Approve all pending join requests.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      try {
        const pending = await sock.groupRequestParticipantsList(jid);
        const targets = (pending || []).map((p) => p.jid || p.id).filter(Boolean);
        if (!targets.length) return reply('No pending join requests.');
        await sock.groupRequestParticipantsUpdate(jid, targets, 'approve');
        await reply(`Approved all (${targets.length}).`);
      } catch (e) {
        await reply('Approveall failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'reject',
    pattern: 'reject',
    aliases: ['rejectall', 'deny'],
    desc: 'Reject pending join request(s).',
    category: 'group',
    async handler(ctx) {
      const { sock, m, jid, args, reply, cmd } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      let targets = getTargets(m, args);
      if (!targets.length || cmd === 'rejectall') {
        try {
          const pending = await sock.groupRequestParticipantsList(jid);
          targets = (pending || []).map((p) => p.jid || p.id).filter(Boolean);
        } catch (_) {}
      }
      if (!targets.length) return reply('No pending requests.');
      try {
        await sock.groupRequestParticipantsUpdate(jid, targets, 'reject');
        await reply(`Rejected ${targets.length}.`);
      } catch (e) {
        await reply('Reject failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'tagall',
    pattern: 'tagall',
    aliases: ['everyone', 'all', 'hidetag'],
    desc: 'Mention all members (optional text).',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, arg, reply, cmd } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      const members = (meta.participants || [])
        .map((p) => p.id || p.jid)
        .filter(Boolean);
      if (!members.length) return reply('No members found.');
      const text =
        (arg && String(arg).trim()) ||
        (cmd === 'hidetag' ? ' ' : 'Hey everyone');
      try {
        await sock.sendMessage(jid, {
          text: text + (cmd === 'hidetag' ? '' : ''),
          mentions: members,
        });
      } catch (e) {
        await reply('Tagall failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'mute',
    pattern: 'mute',
    aliases: ['close'],
    desc: 'Only admins can send messages.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      try {
        await sock.groupSettingUpdate(jid, 'announcement');
        await reply('Group muted — only admins can send.');
      } catch (e) {
        await reply('Mute failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'unmute',
    pattern: 'unmute',
    aliases: ['open'],
    desc: 'Everyone can send messages.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      try {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        await reply('Group unmuted — everyone can send.');
      } catch (e) {
        await reply('Unmute failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'link',
    pattern: 'link',
    aliases: ['invite', 'grouplink', 'glink'],
    desc: 'Get group invite link.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      try {
        const code = await sock.groupInviteCode(jid);
        await reply('https://chat.whatsapp.com/' + code);
      } catch (e) {
        await reply('Link failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'revoke',
    pattern: 'revoke',
    aliases: ['resetlink'],
    desc: 'Revoke / reset group invite link.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, reply } = ctx;
      const meta = await assertGroupAdmin(ctx);
      if (!meta) return;
      try {
        const code = await sock.groupRevokeInvite(jid);
        await reply('Link revoked.\nNew: https://chat.whatsapp.com/' + code);
      } catch (e) {
        await reply('Revoke failed: ' + (e.message || e));
      }
    },
  },
  {
    name: 'groupinfo',
    pattern: 'groupinfo',
    aliases: ['ginfo', 'infogrup'],
    desc: 'Show group metadata summary.',
    category: 'group',
    async handler(ctx) {
      const { sock, jid, reply } = ctx;
      if (!isGroupJid(jid)) return reply('Group only.');
      try {
        const meta = await sock.groupMetadata(jid);
        const admins = (meta.participants || []).filter(
          (p) => p.admin === 'admin' || p.admin === 'superadmin'
        );
        await reply(
          `*${meta.subject || 'Group'}*\n` +
            `ID: ${meta.id}\n` +
            `Members: ${(meta.participants || []).length}\n` +
            `Admins: ${admins.length}\n` +
            `Desc: ${(meta.desc || '—').slice(0, 200)}`
        );
      } catch (e) {
        await reply('Info failed: ' + (e.message || e));
      }
    },
  },
];
