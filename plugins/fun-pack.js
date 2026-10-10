function pick(a) {
  return a[Math.floor(Math.random() * a.length)];
}

const FACTS = [
  'Honey never spoils.',
  'Octopuses have three hearts.',
  'Bananas are berries; strawberries are not.',
  'A day on Venus is longer than its year.',
  'Sharks existed before trees.',
  'Your brain uses about 20% of your body energy.',
  'Wombat poop is cube-shaped.',
  'The Eiffel Tower can grow taller in summer heat.',
  'A group of flamingos is called a flamboyance.',
  'There are more possible chess games than atoms in the observable universe.',
];

const JOKES = [
  'Why did the developer go broke? Because he used up all his cache.',
  'I told my computer I needed a break… it said it would go to sleep.',
  'Why do Java developers wear glasses? Because they cannot C#.',
  'There are 10 kinds of people: those who understand binary and those who do not.',
  'I would tell you a UDP joke, but you might not get it.',
];

const QUOTES = [
  ['The only way to do great work is to love what you do.', 'Steve Jobs'],
  ['In the middle of difficulty lies opportunity.', 'Einstein'],
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['Stay hungry, stay foolish.', 'Stewart Brand'],
  ['Action is the foundational key to all success.', 'Picasso'],
];

const TIPS = [
  'Drink water. Seriously.',
  'Ship small. Ship often.',
  'Sleep is a feature, not a bug.',
  'If it is scary, do it in small steps.',
  'Clear desk, clearer mind.',
  'Read one page more than yesterday.',
];

module.exports = [
  {
    name: 'fact', pattern: 'fact', aliases: ['facts'], desc: 'Random fun fact', category: 'fun',
    async handler({ reply }) { await reply('💡 *Fact*\n' + pick(FACTS)); },
  },
  {
    name: 'joke', pattern: 'joke', aliases: ['jokes'], desc: 'Random joke', category: 'fun',
    async handler({ reply }) { await reply('😄 ' + pick(JOKES)); },
  },
  {
    name: 'quote', pattern: 'quote', aliases: ['quotes'], desc: 'Motivational quote', category: 'fun',
    async handler({ reply }) {
      const [q, a] = pick(QUOTES);
      await reply(`_"${q}"_\n— *${a}*`);
    },
  },
  {
    name: 'coin', pattern: 'coin', aliases: ['flip'], desc: 'Flip a coin', category: 'fun',
    async handler({ reply }) { await reply(Math.random() < 0.5 ? '🪙 *Heads*' : '🪙 *Tails*'); },
  },
  {
    name: 'dice', pattern: 'dice', aliases: ['roll'], desc: 'Roll dice', category: 'fun',
    async handler({ reply, arg }) {
      const n = Math.min(6, Math.max(1, parseInt(arg, 10) || 1));
      const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
      await reply('🎲 ' + rolls.join(' · ') + (n > 1 ? `\nSum: ${rolls.reduce((a, b) => a + b, 0)}` : ''));
    },
  },
  {
    name: 'choose', pattern: 'choose', aliases: ['pick', 'decide'], desc: 'Pick from options', category: 'fun',
    async handler({ reply, arg }) {
      const parts = String(arg || '').split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return reply('Usage: `.choose pizza, burger, pasta`');
      await reply('🎯 *' + pick(parts) + '*');
    },
  },
  {
    name: 'rate', pattern: 'rate', desc: 'Rate something 0-100', category: 'fun',
    async handler({ reply, arg }) {
      await reply(`📊 *${String(arg || 'this').trim()}*\n${Math.floor(Math.random() * 101)}/100`);
    },
  },
  {
    name: 'ship', pattern: 'ship', aliases: ['compat'], desc: 'Compatibility score', category: 'fun',
    async handler({ reply, arg }) {
      const parts = String(arg || '').split(/[,&+|]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return reply('Usage: `.ship A, B`');
      await reply(`💕 ${parts[0]} + ${parts[1]}\n*${Math.floor(Math.random() * 101)}%* match`);
    },
  },
  {
    name: 'love', pattern: 'love', aliases: ['lovecalc'], desc: 'Love calculator', category: 'fun',
    async handler({ reply, arg }) {
      const parts = String(arg || '').split(/[,&+]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return reply('Usage: `.love A, B`');
      await reply(`❤️ ${parts[0]} × ${parts[1]}\n*${Math.floor(Math.random() * 101)}%*`);
    },
  },
  {
    name: 'password', pattern: 'password', aliases: ['passgen', 'genpass'], desc: 'Generate password', category: 'tools',
    async handler({ reply, arg }) {
      const n = Math.min(64, Math.max(8, parseInt(arg, 10) || 16));
      const c = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
      let s = '';
      for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
      await reply('🔐 `' + s + '`');
    },
  },
  {
    name: 'uuid', pattern: 'uuid', aliases: ['guid'], desc: 'Random UUID', category: 'tools',
    async handler({ reply }) {
      const u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        const v = ch === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      await reply('`' + u + '`');
    },
  },
  {
    name: 'time', pattern: 'time', aliases: ['clock', 'date'], desc: 'Current PKT time', category: 'tools',
    async handler({ reply }) {
      await reply('🕐 ' + new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) + ' (PKT)');
    },
  },
  {
    name: 'reverse', pattern: 'reverse', aliases: ['rev'], desc: 'Reverse text', category: 'fun',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.reverse text`');
      await reply(String(arg).split('').reverse().join(''));
    },
  },
  {
    name: 'mock', pattern: 'mock', aliases: ['spongebob'], desc: 'Mocking text', category: 'fun',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.mock text`');
      await reply([...String(arg)].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(''));
    },
  },
  {
    name: 'emoji', pattern: 'emoji', aliases: ['emojify'], desc: 'Emoji shower', category: 'fun',
    async handler({ reply }) {
      const e = '😀😎🔥✨🎉💯🚀🌈🍕🐱🐶⭐💡🎯🏆❤️';
      let s = '';
      for (let i = 0; i < 12; i++) s += e[Math.floor(Math.random() * e.length)] + ' ';
      await reply(s.trim());
    },
  },
  {
    name: 'yesno', pattern: 'yesno', aliases: ['yn'], desc: 'Yes or no', category: 'fun',
    async handler({ reply, arg }) {
      await reply((Math.random() < 0.5 ? '✅ *Yes*' : '❌ *No*') + (arg ? `\n_${arg}_` : ''));
    },
  },
  {
    name: 'number', pattern: 'number', aliases: ['num', 'randint'], desc: 'Random number', category: 'fun',
    async handler({ reply, arg }) {
      const parts = String(arg || '1 100').trim().split(/\s+/).map(Number);
      let lo = 1;
      let hi = 100;
      if (parts.length >= 2 && !parts.some(isNaN)) {
        lo = parts[0];
        hi = parts[1];
      } else if (parts.length === 1 && !isNaN(parts[0])) hi = parts[0];
      if (lo > hi) [lo, hi] = [hi, lo];
      await reply(String(Math.floor(Math.random() * (hi - lo + 1)) + lo));
    },
  },
  {
    name: 'wisdom', pattern: 'wisdom', aliases: ['advice'], desc: 'Random advice', category: 'fun',
    async handler({ reply }) { await reply('🧠 ' + pick(TIPS)); },
  },
  {
    name: 'zalgo', pattern: 'zalgo', desc: 'Spooky text', category: 'fun',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.zalgo text`');
      const marks = ['\u0300', '\u0301', '\u0302', '\u0303', '\u0308', '\u030B', '\u0336'];
      let out = '';
      for (const ch of String(arg)) {
        out += ch;
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) out += pick(marks);
      }
      await reply(out.slice(0, 400));
    },
  },
  {
    name: 'ascii', pattern: 'ascii', desc: 'ASCII box', category: 'fun',
    async handler({ reply, arg }) {
      const t = String(arg || 'HI').slice(0, 16).toUpperCase();
      const line = '═'.repeat(t.length + 2);
      await reply('```\n╔' + line + '╗\n║ ' + t + ' ║\n╚' + line + '╝\n```');
    },
  },
  {
    name: 'say', pattern: 'say', aliases: ['echo'], desc: 'Echo text', category: 'fun',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.say hello`');
      await reply(String(arg));
    },
  },
  {
    name: 'count', pattern: 'count', aliases: ['len'], desc: 'Count characters/words', category: 'tools',
    async handler({ reply, arg }) {
      const s = String(arg || '');
      const words = s.trim() ? s.trim().split(/\s+/).length : 0;
      await reply(`Chars: *${s.length}*\nWords: *${words}*`);
    },
  },
  {
    name: 'upper', pattern: 'upper', aliases: ['toupper'], desc: 'UPPERCASE', category: 'tools',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.upper text`');
      await reply(String(arg).toUpperCase());
    },
  },
  {
    name: 'lower', pattern: 'lower', aliases: ['tolower'], desc: 'lowercase', category: 'tools',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.lower text`');
      await reply(String(arg).toLowerCase());
    },
  },
  {
    name: 'title', pattern: 'title', aliases: ['titlecase'], desc: 'Title Case', category: 'tools',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.title text`');
      await reply(String(arg).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
    },
  },
  {
    name: 'binary', pattern: 'binary', aliases: ['bin'], desc: 'Text to binary', category: 'tools',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.binary hi`');
      await reply([...String(arg)].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ').slice(0, 500));
    },
  },
  {
    name: 'unbinary', pattern: 'unbinary', aliases: ['frombin'], desc: 'Binary to text', category: 'tools',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.unbinary 01101000`');
      try {
        const s = String(arg).trim().split(/\s+/).map((b) => String.fromCharCode(parseInt(b, 2))).join('');
        await reply(s || '?');
      } catch {
        await reply('Invalid binary');
      }
    },
  },
  {
    name: 'hash', pattern: 'hash', aliases: ['djb2'], desc: 'Simple hash of text', category: 'tools',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.hash text`');
      let h = 5381;
      for (const c of String(arg)) h = ((h << 5) + h) ^ c.charCodeAt(0);
      await reply('#' + (h >>> 0).toString(16));
    },
  },
  {
    name: 'palindrome', pattern: 'palindrome', aliases: ['pal'], desc: 'Check palindrome', category: 'fun',
    async handler({ reply, arg }) {
      if (!arg) return reply('Usage: `.palindrome text`');
      const s = String(arg).toLowerCase().replace(/[^a-z0-9]/g, '');
      await reply(s && s === [...s].reverse().join('') ? '✅ Palindrome' : '❌ Not a palindrome');
    },
  },
  {
    name: 'motivate', pattern: 'motivate', aliases: ['motivation'], desc: 'Motivation boost', category: 'fun',
    async handler({ reply }) {
      await reply('🔥 ' + pick([
        'You do not have to be perfect. You have to start.',
        'One focused hour beats a distracted day.',
        'Progress > motivation. Do the next small step.',
        'Future you is watching. Make them proud.',
      ]));
    },
  },
];
