/** Mini quiz app — multi-step in chat */
const quizzes = {
  js: {
    title: 'JavaScript Quiz',
    q: [
      { q: 'What is `typeof null`?', a: ['object', 'null', 'undefined'], correct: 0 },
      { q: 'Which creates a Promise?', a: ['new Promise()', 'Promise.new()', 'promise()'], correct: 0 },
      { q: 'Array method to transform items?', a: ['map', 'forEach', 'filter'], correct: 0 },
    ],
  },
  wa: {
    title: 'WhatsApp Bot Quiz',
    q: [
      { q: 'Baileys connects via…', a: ['WhatsApp Web multi-device', 'SMS gateway', 'Email'], correct: 0 },
      { q: 'Pairing code is for…', a: ['Linking without QR scan camera', 'Encrypting media', 'Group invites'], correct: 0 },
    ],
  },
};

const sessions = new Map();

module.exports = {
  name: 'quiz',
  pattern: 'quiz',
  aliases: ['trivia'],
  desc: 'Mini quiz app · .quiz js | .quiz wa | .quiz 1',
  category: 'mini-apps',
  async handler({ reply, jid, arg }) {
    const a = (arg || '').trim().toLowerCase();

    if (!a || a === 'list') {
      await reply(
        '🧠 *Quiz mini-app*\n\n' +
          'Start:\n• `.quiz js` — JavaScript\n• `.quiz wa` — WhatsApp bots\n\n' +
          'Answer with `.quiz 1` / `.quiz 2` / `.quiz 3`',
      );
      return;
    }

    if (quizzes[a]) {
      const pack = quizzes[a];
      sessions.set(jid, { id: a, i: 0, score: 0 });
      const cur = pack.q[0];
      await reply(
        `🧠 *${pack.title}* (1/${pack.q.length})\n\n${cur.q}\n\n` +
          cur.a.map((x, i) => `${i + 1}) ${x}`).join('\n') +
          `\n\nReply: \`.quiz 1\``,
      );
      return;
    }

    const n = parseInt(a, 10);
    if (!sessions.has(jid) || Number.isNaN(n)) {
      await reply('Start with `.quiz js` or `.quiz wa`');
      return;
    }

    const s = sessions.get(jid);
    const pack = quizzes[s.id];
    const cur = pack.q[s.i];
    const pick = n - 1;
    if (pick < 0 || pick >= cur.a.length) {
      await reply('Pick a valid option number.');
      return;
    }

    if (pick === cur.correct) {
      s.score += 1;
      await reply('✅ Correct!');
    } else {
      await reply(`❌ Nope — answer was *${cur.a[cur.correct]}*`);
    }

    s.i += 1;
    if (s.i >= pack.q.length) {
      sessions.delete(jid);
      await reply(`🏁 *Done!* Score: ${s.score}/${pack.q.length}`);
      return;
    }

    const next = pack.q[s.i];
    await reply(
      `🧠 *${pack.title}* (${s.i + 1}/${pack.q.length})\n\n${next.q}\n\n` +
        next.a.map((x, i) => `${i + 1}) ${x}`).join('\n') +
        `\n\nReply: \`.quiz 1\``,
    );
  },
};
