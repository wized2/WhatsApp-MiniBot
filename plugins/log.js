const { isOwner } = require('../lib/owner');
const bb = require('../lib/blackbox');

module.exports = {
  name: 'log',
  pattern: 'log',
  aliases: ['events', 'why'],
  desc: 'Recent important bot events: why it stopped (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, args } = ctx;
    if (!isOwner(ctx)) return reply('Owner only.');
    const n = Math.max(5, Math.min(40, Number(args[0]) || 20));
    const ev = bb.recent(n);
    if (!ev.length) return reply('No events recorded yet.');
    const now = Date.now();
    const ago = (t) => { const s = Math.round((now - t) / 1000); return s < 90 ? s + 's' : s < 5400 ? Math.round(s / 60) + 'm' : (s / 3600).toFixed(1) + 'h'; };
    return reply('*Recent events* (newest last)\n' + ev.map((e) => ago(e.at) + ' ago · ' + e.m + (e.n > 1 ? ' ×' + e.n : '')).join('\n'));
  },
};
