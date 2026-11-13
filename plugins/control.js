const { isOwner } = require('../lib/owner');
const botState = require('../lib/botState');
const engine = require('../lib/cfwdEngine');

function ago(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 90) return s + 's';
  if (s < 5400) return Math.round(s / 60) + 'm';
  return Math.round(s / 3600) + 'h';
}

function statusText() {
  const st = botState.getState();
  const e = engine.status();
  return (
    `*Bot:* ${st.idle ? 'IDLE (.stop)' : 'running'}${st.idle ? ' for ' + ago(st.since) : ''}\n` +
    `*Channels watched:* ${e.channels}\n` +
    `*Queue:* ${e.pending} pending\n` +
    Object.entries(e.scans || {}).map(([j, x]) => `· ${j.slice(0, 12)}… scan ${ago(x.at)} ago: ${x.err ? 'ERR ' + x.err : x.count + ' fetched'}`).join('\n') + '\n' +
    `*Failed (last):* ${e.failed.length}${e.failed.length ? '\n' + e.failed.map((f) => '· ' + f.to + ': ' + f.error).join('\n') : ''}`
  );
}

module.exports = [
  {
    name: 'stop',
    pattern: 'stop',
    aliases: ['idle', 'pause'],
    desc: 'Stop all bot work and go idle (owner)',
    category: 'owner',
    async handler(ctx) {
      if (!isOwner(ctx)) return;
      const changed = botState.setIdle(true, ctx.sender || 'owner');
      engine.flush();
      await ctx.reply(changed ? 'Idle. No forwarding, polling, moderation or games. `.start` to resume.' : 'Already idle.');
    },
  },
  {
    name: 'start',
    pattern: 'start',
    aliases: ['resume', 'wake'],
    desc: 'Resume from idle; `.start fresh` skips posts made while idle (owner)',
    category: 'owner',
    async handler(ctx) {
      if (!isOwner(ctx)) return;
      const fresh = (ctx.args[0] || '').toLowerCase() === 'fresh';
      if (fresh) engine.skipToNow();
      const changed = botState.setIdle(false, ctx.sender || 'owner');
      await ctx.reply(
        (changed ? 'Running again. ' : 'Already running. ') +
          (fresh ? 'Skipped posts made while idle.' : 'Posts missed while idle will be caught up.')
      );
    },
  },
  {
    name: 'status',
    pattern: 'status',
    aliases: ['botstatus'],
    desc: 'Bot and forward queue status (owner)',
    category: 'owner',
    async handler(ctx) {
      if (!isOwner(ctx)) return;
      await ctx.reply(statusText());
    },
  },
];
