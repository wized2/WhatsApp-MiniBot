const { isOwner } = require('../lib/owner');
const antiNsfw = require('../lib/antiNsfw');

module.exports = {
  name: 'antinsfw',
  pattern: 'antinsfw',
  aliases: ['anti-nsfw', 'nsfwguard'],
  desc: 'Toggle / status group anti-NSFW (owner)',
  category: 'owner',
  async handler(ctx) {
    const { arg, reply, config } = ctx;
    if (!isOwner(ctx)) return reply('Owner only.');

    const a = String(arg || '').trim().toLowerCase();
    if (a === 'on' || a === 'enable' || a === '1') {
      antiNsfw.setEnabled(config, true);
      return reply('Anti-NSFW *enabled* (groups). Skips bot, admins, news-like captions.');
    }
    if (a === 'off' || a === 'disable' || a === '0') {
      antiNsfw.setEnabled(config, false);
      return reply('Anti-NSFW *disabled*.');
    }

    const s = antiNsfw.status(config);
    const pause =
      s.quotaPausedUntil && s.quotaPausedUntil > Date.now()
        ? `\nQuota pause until: ${new Date(s.quotaPausedUntil).toISOString()}`
        : '';
    return reply(
      `*Anti-NSFW*\n` +
        `enabled: ${s.enabled}\n` +
        `deleteOn: ${s.deleteOn}\n` +
        `used today: ${s.usedToday}/${s.budget}\n` +
        `day: ${s.day || '—'}` +
        pause +
        `\n\nUsage: \`.antinsfw on|off|status\``
    );
  },
};
