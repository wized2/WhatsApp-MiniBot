const crypto = require('crypto');
const { style } = require('../lib/stylish');

function num(s, d = NaN) {
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? n : d;
}

module.exports = {
  name: 'utils',
  pattern: 'utils',
  aliases: [
    // meta
    'tools', 'util',
    // random / fun
    'uuid', 'random', 'rand', 'flip', 'yesno', '8ball', 'ship', 'love', 'zodiac', 'decide',
    // text
    'base64', 'b64', 'decode64', 'hash', 'md5', 'sha256', 'upper', 'lower', 'title', 'reverse',
    'count', 'words', 'repeat', 'trim', 'nospaces', 'slug', 'morse', 'unmorse',
    // numbers / money
    'percent', 'pct', 'discount', 'tip', 'splitbill', 'emi', 'interest', 'gst', 'vat',
    'bmi', 'age', 'days', 'hours',
    // units
    'c2f', 'f2c', 'kg2lb', 'lb2kg', 'cm2in', 'in2cm', 'km2mi', 'mi2km',
    // time / id
    'time', 'now', 'timestamp', 'password', 'pass', 'otp', 'pick', 'choose',
    // convert
    'bin', 'hex', 'roman', 'unroman', 'readtime',
  ],
  desc: 'Everyday tools (.utils list)',
  category: 'utilities',
  async handler({ reply, cmd, arg, args, config }) {
    const p = config.prefix || '.';
    const body = (arg || '').trim();
    const a0 = args[0], a1 = args[1], a2 = args[2];

    if (cmd === 'utils' || cmd === 'tools' || cmd === 'util') {
      return reply(
        `╭──━ ${style('UTILITIES')} ━──╮\n` +
          `*Fun*\n` +
          `│ ${p}flip  ${p}yesno  ${p}8ball\n` +
          `│ ${p}ship a, b  ${p}love name\n` +
          `│ ${p}zodiac DD/MM  ${p}decide a|b|c\n` +
          `│ ${p}random min max\n` +
          `*Text*\n` +
          `│ ${p}upper ${p}lower ${p}title ${p}reverse\n` +
          `│ ${p}count ${p}slug ${p}morse ${p}nospaces\n` +
          `│ ${p}base64 ${p}decode64 ${p}hash\n` +
          `*Money / math*\n` +
          `│ ${p}percent x of y  ${p}discount price %\n` +
          `│ ${p}tip bill %  ${p}splitbill total n\n` +
          `│ ${p}emi P R Y  ${p}gst amount %\n` +
          `*Health / date*\n` +
          `│ ${p}bmi kg cm  ${p}age YYYY-MM-DD\n` +
          `│ ${p}days YYYY-MM-DD\n` +
          `*Units*\n` +
          `│ ${p}c2f ${p}f2c ${p}kg2lb ${p}lb2kg\n` +
          `│ ${p}cm2in ${p}in2cm ${p}km2mi ${p}mi2km\n` +
          `*Other*\n` +
          `│ ${p}password [n]  ${p}otp  ${p}uuid\n` +
          `│ ${p}time  ${p}pick a, b  ${p}roman n\n` +
          `╰────────────────╯`
      );
    }

    // —— fun ——
    if (cmd === 'flip') return reply(Math.random() < 0.5 ? '🟢 Heads' : '🔴 Tails');
    if (cmd === 'yesno') return reply(Math.random() < 0.5 ? '✅ Yes' : '❌ No');
    if (cmd === '8ball') {
      const a = ['Yes.', 'No.', 'Maybe.', 'Ask again.', 'Absolutely.', 'Doubtful.', 'Sure thing.', 'Not now.'];
      return reply('🎱 ' + a[Math.floor(Math.random() * a.length)]);
    }
    if (cmd === 'decide') {
      const parts = body.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return reply(`Usage: ${p}decide tea | coffee | juice`);
      return reply('👉 ' + parts[Math.floor(Math.random() * parts.length)]);
    }
    if (cmd === 'ship' || cmd === 'love') {
      const parts = body.split(/[,&x+/]/i).map((s) => s.trim()).filter(Boolean);
      if (!parts.length) return reply(`Usage: ${p}ship Ali, Sara`);
      const s = (parts.join('|') + 'love').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      const pct = Math.abs(s) % 101;
      const label = pct > 80 ? '🔥 Strong' : pct > 50 ? '💛 Good' : pct > 25 ? '💙 Okay' : '🧊 Low';
      return reply(`💘 ${parts.join(' + ')}\n${pct}% · ${label}`);
    }
    if (cmd === 'zodiac') {
      // DD/MM or DD-MM
      const m = body.match(/(\d{1,2})[\/\-.](\d{1,2})/);
      if (!m) return reply(`Usage: ${p}zodiac 15/08`);
      const d = +m[1], mo = +m[2];
      const z = [
        [20, 'Capricorn'], [19, 'Aquarius'], [20, 'Pisces'], [20, 'Aries'],
        [21, 'Taurus'], [21, 'Gemini'], [22, 'Cancer'], [22, 'Leo'],
        [23, 'Virgo'], [23, 'Libra'], [22, 'Scorpio'], [22, 'Sagittarius'], [20, 'Capricorn'],
      ];
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return reply('Invalid date');
      const sign = d < z[mo - 1][0] ? z[mo - 1][1] : z[mo][1];
      return reply(`✨ ${sign}`);
    }
    if (cmd === 'random' || cmd === 'rand') {
      let min = 1, max = 100;
      if (a0 !== undefined) min = num(a0, 1);
      if (a1 !== undefined) max = num(a1, 100);
      if (min > max) [min, max] = [max, min];
      const n = Math.floor(min + Math.random() * (max - min + 1));
      return reply(`🎲 ${n}  _(range ${min}–${max})_`);
    }

    // —— text ——
    if (cmd === 'uuid') return reply('`' + crypto.randomUUID() + '`');
    if (cmd === 'base64' || cmd === 'b64') {
      if (!body) return reply(`Usage: ${p}base64 hello`);
      return reply(Buffer.from(body, 'utf8').toString('base64'));
    }
    if (cmd === 'decode64') {
      if (!body) return reply(`Usage: ${p}decode64 aGVsbG8=`);
      try { return reply(Buffer.from(body, 'base64').toString('utf8')); }
      catch { return reply('Invalid base64'); }
    }
    if (cmd === 'hash' || cmd === 'sha256') {
      if (!body) return reply(`Usage: ${p}hash text`);
      return reply(crypto.createHash('sha256').update(body).digest('hex'));
    }
    if (cmd === 'md5') {
      if (!body) return reply(`Usage: ${p}md5 text`);
      return reply(crypto.createHash('md5').update(body).digest('hex'));
    }
    if (cmd === 'upper') return reply(body ? body.toUpperCase() : `Usage: ${p}upper text`);
    if (cmd === 'lower') return reply(body ? body.toLowerCase() : `Usage: ${p}lower text`);
    if (cmd === 'title') {
      if (!body) return reply(`Usage: ${p}title my text`);
      return reply(body.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()));
    }
    if (cmd === 'reverse') return reply(body ? [...body].reverse().join('') : `Usage: ${p}reverse text`);
    if (cmd === 'count' || cmd === 'words') {
      if (!body) return reply(`Usage: ${p}count your text`);
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      const vowels = (body.match(/[aeiouáéíóú]/gi) || []).length;
      return reply(`Chars: ${body.length}\nWords: ${words}\nVowels: ${vowels}\nLines: ${body.split('\n').length}`);
    }
    if (cmd === 'repeat') {
      const n = Math.min(50, Math.max(1, num(a0, 2)));
      const t = args.slice(1).join(' ') || body.replace(/^\d+\s*/, '');
      if (!t) return reply(`Usage: ${p}repeat 3 hello`);
      return reply(Array(n).fill(t).join('\n'));
    }
    if (cmd === 'trim') return reply(body.trim());
    if (cmd === 'nospaces') return reply(body.replace(/\s+/g, ''));
    if (cmd === 'slug') {
      if (!body) return reply(`Usage: ${p}slug My Title Here`);
      return reply(body.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
    if (cmd === 'morse') {
      const M = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.', ' ':'/' };
      if (!body) return reply(`Usage: ${p}morse HELLO`);
      return reply(body.toUpperCase().split('').map((c) => M[c] || c).join(' '));
    }
    if (cmd === 'unmorse') {
      const M = { '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','/':' ' };
      if (!body) return reply(`Usage: ${p}unmorse .... . .-.. .-.. ---`);
      return reply(body.trim().split(/\s+/).map((c) => M[c] || c).join(''));
    }
    if (cmd === 'readtime') {
      if (!body) return reply(`Usage: ${p}readtime long text…`);
      const w = body.trim().split(/\s+/).filter(Boolean).length;
      const min = Math.max(1, Math.round(w / 200));
      return reply(`📖 ~${min} min read (${w} words)`);
    }

    // —— money / math ——
    if (cmd === 'percent' || cmd === 'pct') {
      // "10 of 200" or "10% of 200"
      const m = body.match(/([\d.]+)\s*%?\s*(?:of\s*)?([\d.]+)/i);
      if (!m) return reply(`Usage: ${p}percent 10 of 200`);
      const x = num(m[1]), y = num(m[2]);
      return reply(`${x}% of ${y} = *${((x / 100) * y).toFixed(2)}*\n${x} is *${((x / y) * 100).toFixed(2)}%* of ${y}`);
    }
    if (cmd === 'discount') {
      const price = num(a0), pct = num(a1);
      if (!Number.isFinite(price) || !Number.isFinite(pct)) return reply(`Usage: ${p}discount 1500 20`);
      const off = (price * pct) / 100;
      return reply(`Price: ${price}\nDiscount ${pct}%: −${off.toFixed(2)}\n*Pay: ${(price - off).toFixed(2)}*`);
    }
    if (cmd === 'tip') {
      const bill = num(a0), pct = num(a1, 10);
      if (!Number.isFinite(bill)) return reply(`Usage: ${p}tip 1200 10`);
      const t = (bill * pct) / 100;
      return reply(`Bill: ${bill}\nTip ${pct}%: ${t.toFixed(2)}\n*Total: ${(bill + t).toFixed(2)}*`);
    }
    if (cmd === 'splitbill') {
      const total = num(a0), n = num(a1, 2);
      if (!Number.isFinite(total) || n < 1) return reply(`Usage: ${p}splitbill 3000 4`);
      return reply(`Total ${total} ÷ ${n} = *${(total / n).toFixed(2)}* each`);
    }
    if (cmd === 'emi') {
      // P principal, R annual %, Y years
      const P = num(a0), R = num(a1), Y = num(a2);
      if (![P, R, Y].every(Number.isFinite)) return reply(`Usage: ${p}emi 500000 12 2\n(P rate% years)`);
      const r = R / 12 / 100, n = Y * 12;
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      return reply(`EMI: *${emi.toFixed(2)}*/mo\nTotal: ${(emi * n).toFixed(2)}\nInterest: ${(emi * n - P).toFixed(2)}`);
    }
    if (cmd === 'interest') {
      const P = num(a0), R = num(a1), T = num(a2);
      if (![P, R, T].every(Number.isFinite)) return reply(`Usage: ${p}interest 10000 10 2\n(P rate% years simple)`);
      const i = (P * R * T) / 100;
      return reply(`Simple interest: *${i.toFixed(2)}*\nAmount: ${(P + i).toFixed(2)}`);
    }
    if (cmd === 'gst' || cmd === 'vat') {
      const amount = num(a0), pct = num(a1, 18);
      if (!Number.isFinite(amount)) return reply(`Usage: ${p}gst 1000 18`);
      const g = (amount * pct) / 100;
      return reply(`Amount: ${amount}\nGST/VAT ${pct}%: ${g.toFixed(2)}\n*Total: ${(amount + g).toFixed(2)}*`);
    }

    // —— health / date ——
    if (cmd === 'bmi') {
      const kg = num(a0), cm = num(a1);
      if (!Number.isFinite(kg) || !Number.isFinite(cm)) return reply(`Usage: ${p}bmi 70 175\n(kg cm)`);
      const m = cm / 100;
      const bmi = kg / (m * m);
      let cat = 'Normal';
      if (bmi < 18.5) cat = 'Underweight';
      else if (bmi >= 25 && bmi < 30) cat = 'Overweight';
      else if (bmi >= 30) cat = 'Obese';
      return reply(`BMI: *${bmi.toFixed(1)}* · ${cat}`);
    }
    if (cmd === 'age') {
      const d = new Date(body);
      if (Number.isNaN(d.getTime())) return reply(`Usage: ${p}age 2000-05-15`);
      const now = new Date();
      let y = now.getFullYear() - d.getFullYear();
      let m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
      if (m < 0) m += 12;
      return reply(`🎂 ${y} years · ${m} months`);
    }
    if (cmd === 'days') {
      const d = new Date(body);
      if (Number.isNaN(d.getTime())) return reply(`Usage: ${p}days 2026-12-31`);
      const diff = Math.ceil((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
      if (diff === 0) return reply('That’s *today*');
      if (diff > 0) return reply(`📅 ${diff} day(s) left`);
      return reply(`📅 ${Math.abs(diff)} day(s) ago`);
    }
    if (cmd === 'hours') {
      const n = num(a0);
      if (!Number.isFinite(n)) return reply(`Usage: ${p}hours 90`);
      return reply(`${n} hours = *${(n / 24).toFixed(2)}* days · *${(n * 60).toFixed(0)}* minutes`);
    }

    // —— units ——
    if (cmd === 'c2f') { const c = num(a0); if (!Number.isFinite(c)) return reply(`Usage: ${p}c2f 37`); return reply(`${c}°C = *${((c * 9) / 5 + 32).toFixed(1)}°F*`); }
    if (cmd === 'f2c') { const f = num(a0); if (!Number.isFinite(f)) return reply(`Usage: ${p}f2c 98.6`); return reply(`${f}°F = *${(((f - 32) * 5) / 9).toFixed(1)}°C*`); }
    if (cmd === 'kg2lb') { const k = num(a0); if (!Number.isFinite(k)) return reply(`Usage: ${p}kg2lb 70`); return reply(`${k} kg = *${(k * 2.20462).toFixed(2)} lb*`); }
    if (cmd === 'lb2kg') { const l = num(a0); if (!Number.isFinite(l)) return reply(`Usage: ${p}lb2kg 154`); return reply(`${l} lb = *${(l / 2.20462).toFixed(2)} kg*`); }
    if (cmd === 'cm2in') { const c = num(a0); if (!Number.isFinite(c)) return reply(`Usage: ${p}cm2in 180`); return reply(`${c} cm = *${(c / 2.54).toFixed(2)} in*`); }
    if (cmd === 'in2cm') { const i = num(a0); if (!Number.isFinite(i)) return reply(`Usage: ${p}in2cm 70`); return reply(`${i} in = *${(i * 2.54).toFixed(2)} cm*`); }
    if (cmd === 'km2mi') { const k = num(a0); if (!Number.isFinite(k)) return reply(`Usage: ${p}km2mi 10`); return reply(`${k} km = *${(k * 0.621371).toFixed(2)} mi*`); }
    if (cmd === 'mi2km') { const m = num(a0); if (!Number.isFinite(m)) return reply(`Usage: ${p}mi2km 6`); return reply(`${m} mi = *${(m / 0.621371).toFixed(2)} km*`); }

    // —— other ——
    if (cmd === 'password' || cmd === 'pass') {
      const len = Math.min(64, Math.max(8, parseInt(a0, 10) || 16));
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
      let out = '';
      const bytes = crypto.randomBytes(len);
      for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
      return reply('`' + out + '`');
    }
    if (cmd === 'otp') {
      const n = String(Math.floor(100000 + Math.random() * 900000));
      return reply('🔐 OTP: *' + n + '*');
    }
    if (cmd === 'pick' || cmd === 'choose') {
      const parts = body.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return reply(`Usage: ${p}pick tea, coffee, juice`);
      return reply('→ ' + parts[Math.floor(Math.random() * parts.length)]);
    }
    if (cmd === 'time' || cmd === 'now' || cmd === 'timestamp') {
      const d = new Date();
      return reply(`🕒 ${d.toUTCString()}\nUnix: ${Math.floor(d.getTime() / 1000)}\nISO: ${d.toISOString()}`);
    }
    if (cmd === 'bin') {
      const n = num(body);
      if (!Number.isFinite(n)) return reply(`Usage: ${p}bin 42`);
      return reply((n >>> 0).toString(2));
    }
    if (cmd === 'hex') {
      const n = num(body);
      if (!Number.isFinite(n)) return reply(`Usage: ${p}hex 255`);
      return reply((n >>> 0).toString(16));
    }
    if (cmd === 'roman') {
      let n = Math.floor(num(body));
      if (!Number.isFinite(n) || n < 1 || n > 3999) return reply(`Usage: ${p}roman 2024`);
      const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
      let out = '';
      for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
      return reply(out);
    }
    if (cmd === 'unroman') {
      const R = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
      const s = body.toUpperCase().replace(/\s/g, '');
      if (!s) return reply(`Usage: ${p}unroman MCMXCIV`);
      let n = 0;
      for (let i = 0; i < s.length; i++) {
        const v = R[s[i]] || 0, next = R[s[i + 1]] || 0;
        n += v < next ? -v : v;
      }
      return reply(String(n));
    }

    return reply(`Unknown util. Try ${p}utils`);
  },
};
