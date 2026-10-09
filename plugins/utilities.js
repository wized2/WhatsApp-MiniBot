const crypto = require('crypto');
const { style } = require('../lib/stylish');

module.exports = {
  name: 'utils',
  pattern: 'utils',
  aliases: [
    'uuid', 'base64', 'b64', 'decode64', 'hash', 'md5', 'sha256',
    'password', 'pass', 'pick', 'choose', 'time', 'now', 'timestamp',
    'upper', 'lower', 'reverse', 'count', 'bin', 'hex',
  ],
  desc: 'Utilities (.utils for list)',
  category: 'utilities',
  async handler({ reply, cmd, arg, args, text, config }) {
    const p = config.prefix || '.';
    const body = (arg || '').trim();

    if (cmd === 'utils') {
      return reply(
        `╭──━ ${style('UTILITIES')} ━──╮\n` +
          `│ ${p}uuid\n` +
          `│ ${p}base64 <text>\n` +
          `│ ${p}decode64 <b64>\n` +
          `│ ${p}hash <text>   (sha256)\n` +
          `│ ${p}md5 <text>\n` +
          `│ ${p}password [len]\n` +
          `│ ${p}pick a, b, c\n` +
          `│ ${p}time\n` +
          `│ ${p}upper / ${p}lower <text>\n` +
          `│ ${p}reverse <text>\n` +
          `│ ${p}count <text>\n` +
          `│ ${p}bin / ${p}hex <number>\n` +
          `╰────────────────╯`
      );
    }

    if (cmd === 'uuid') {
      return reply('`' + crypto.randomUUID() + '`');
    }
    if (cmd === 'base64' || cmd === 'b64') {
      if (!body) return reply(`Usage: ${p}base64 hello`);
      return reply(Buffer.from(body, 'utf8').toString('base64'));
    }
    if (cmd === 'decode64') {
      if (!body) return reply(`Usage: ${p}decode64 aGVsbG8=`);
      try {
        return reply(Buffer.from(body, 'base64').toString('utf8'));
      } catch {
        return reply('Invalid base64');
      }
    }
    if (cmd === 'hash' || cmd === 'sha256') {
      if (!body) return reply(`Usage: ${p}hash text`);
      return reply(crypto.createHash('sha256').update(body).digest('hex'));
    }
    if (cmd === 'md5') {
      if (!body) return reply(`Usage: ${p}md5 text`);
      return reply(crypto.createHash('md5').update(body).digest('hex'));
    }
    if (cmd === 'password' || cmd === 'pass') {
      const len = Math.min(64, Math.max(8, parseInt(args[0], 10) || 16));
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
      let out = '';
      const bytes = crypto.randomBytes(len);
      for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
      return reply('`' + out + '`');
    }
    if (cmd === 'pick' || cmd === 'choose') {
      const parts = body.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return reply(`Usage: ${p}pick tea, coffee, juice`);
      return reply('→ ' + parts[Math.floor(Math.random() * parts.length)]);
    }
    if (cmd === 'time' || cmd === 'now' || cmd === 'timestamp') {
      const d = new Date();
      return reply(
        `🕒 ${d.toUTCString()}\n` +
          `Unix: ${Math.floor(d.getTime() / 1000)}\n` +
          `ISO: ${d.toISOString()}`
      );
    }
    if (cmd === 'upper') return reply(body ? body.toUpperCase() : `Usage: ${p}upper text`);
    if (cmd === 'lower') return reply(body ? body.toLowerCase() : `Usage: ${p}lower text`);
    if (cmd === 'reverse') return reply(body ? [...body].reverse().join('') : `Usage: ${p}reverse text`);
    if (cmd === 'count') {
      if (!body) return reply(`Usage: ${p}count your text here`);
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      return reply(`Chars: ${body.length}\nWords: ${words}\nLines: ${body.split('\n').length}`);
    }
    if (cmd === 'bin') {
      const n = Number(body);
      if (!Number.isFinite(n)) return reply(`Usage: ${p}bin 42`);
      return reply((n >>> 0).toString(2));
    }
    if (cmd === 'hex') {
      const n = Number(body);
      if (!Number.isFinite(n)) return reply(`Usage: ${p}hex 255`);
      return reply((n >>> 0).toString(16));
    }

    return reply(`Unknown util. Try ${p}utils`);
  },
};
