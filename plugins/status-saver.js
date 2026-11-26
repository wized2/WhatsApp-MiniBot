const { isOwner } = require('../lib/owner');
const ss = require('../lib/statusSaver');

module.exports = {
  name: 'ss',
  pattern: 'ss',
  aliases: ['statussaver', 'statussave'],
  desc: 'Save contacts\' statuses to a number, group or channel (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, args, sock, jid } = ctx;
    if (!isOwner(ctx)) return reply('Owner only.');
    const cfg = ss.load();
    const sub = String(args[0] || '').toLowerCase();

    if (!sub || sub === 'status') {
      const st = ss.stats();
      return reply(
        '*Status saver*\n' +
          'State: ' + (cfg.enabled ? 'ON' : 'OFF') + '\n' +
          'Sends to: ' + (cfg.target ? cfg.label + ' (' + cfg.target + ')' : 'not set') + '\n' +
          'From: ' + (cfg.only.length ? cfg.only.map((n) => '+' + n).join(', ') : 'everyone') + '\n' +
          'Saved: ' + st.saved + ' · failed: ' + st.failed + (st.lastError ? '\nLast error: ' + st.lastError : '') + '\n\n' +
          '.ss <number | group link | channel link | here>  set target and turn on\n' +
          '.ss off / .ss on\n' +
          '.ss only <numbers>  only those contacts\n' +
          '.ss all  everyone'
      );
    }
    if (sub === 'off') { cfg.enabled = false; ss.save(cfg); return reply('Status saver OFF.'); }
    if (sub === 'on') {
      if (!cfg.target) return reply('Set a target first: .ss <number | group link | channel link>');
      cfg.enabled = true; ss.save(cfg); return reply('Status saver ON → ' + cfg.label);
    }
    if (sub === 'all') { cfg.only = []; ss.save(cfg); return reply('Saving statuses from everyone.'); }
    if (sub === 'only') {
      const nums = args.slice(1).map(ss.digits).filter((n) => n.length >= 7);
      if (!nums.length) return reply('Usage: .ss only 923001234567 923331112222');
      cfg.only = nums; ss.save(cfg);
      return reply('Only saving statuses from: ' + nums.map((n) => '+' + n).join(', '));
    }
    try {
      const t = await ss.resolveTarget(sock, args.join(' '), jid);
      cfg.target = t.jid; cfg.label = t.label; cfg.enabled = true;
      ss.save(cfg);
      return reply('Status saver ON → ' + t.label + '\nNew statuses from your contacts will be sent there.');
    } catch (e) {
      return reply('Could not set target: ' + (e.message || e));
    }
  },
};
