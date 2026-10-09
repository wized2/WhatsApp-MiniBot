/** Simple number-guess mini game (works on all clients) */
const sessions = new Map();

module.exports = {
  name: 'guess',
  pattern: 'guess',
  aliases: ['number'],
  desc: 'Guess number 1–50 · .guess start | .guess 12',
  category: 'games',
  async handler({ reply, jid, arg }) {
    const key = jid;
    const a = (arg || '').trim().toLowerCase();

    if (!a || a === 'start' || a === 'new') {
      const secret = 1 + Math.floor(Math.random() * 50);
      sessions.set(key, { secret, tries: 0 });
      await reply(
        '🎮 *Guess the number*\n\nI picked a number between *1* and *50*.\nReply with:\n`.guess 23`',
      );
      return;
    }

    if (a === 'stop' || a === 'end') {
      sessions.delete(key);
      await reply('Game stopped.');
      return;
    }

    const n = parseInt(a, 10);
    if (!sessions.has(key)) {
      await reply('No active game. Start with `.guess start`');
      return;
    }
    if (Number.isNaN(n)) {
      await reply('Send a number, e.g. `.guess 18`');
      return;
    }

    const s = sessions.get(key);
    s.tries += 1;
    if (n === s.secret) {
      sessions.delete(key);
      await reply(`✅ *Correct!* ${n} in ${s.tries} tries.`);
      return;
    }
    if (n < s.secret) await reply(`⬆️ Higher than ${n} · tries: ${s.tries}`);
    else await reply(`⬇️ Lower than ${n} · tries: ${s.tries}`);
  },
};
