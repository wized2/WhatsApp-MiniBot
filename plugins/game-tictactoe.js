/** Tic-tac-toe vs bot */
const games = new Map();

function empty() {
  return [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' '],
  ];
}

function boardText(b) {
  const cell = (r, c) => (b[r][c] === ' ' ? '·' : b[r][c]);
  return (
    `\`\`\`\n` +
    `${cell(0, 0)} | ${cell(0, 1)} | ${cell(0, 2)}\n` +
    `---------\n` +
    `${cell(1, 0)} | ${cell(1, 1)} | ${cell(1, 2)}\n` +
    `---------\n` +
    `${cell(2, 0)} | ${cell(2, 1)} | ${cell(2, 2)}\n` +
    `\`\`\``
  );
}

function winner(b) {
  const lines = [
    [b[0][0], b[0][1], b[0][2]],
    [b[1][0], b[1][1], b[1][2]],
    [b[2][0], b[2][1], b[2][2]],
    [b[0][0], b[1][0], b[2][0]],
    [b[0][1], b[1][1], b[2][1]],
    [b[0][2], b[1][2], b[2][2]],
    [b[0][0], b[1][1], b[2][2]],
    [b[0][2], b[1][1], b[2][0]],
  ];
  for (const L of lines) {
    if (L[0] !== ' ' && L[0] === L[1] && L[1] === L[2]) return L[0];
  }
  if (b.flat().every((x) => x !== ' ')) return 'draw';
  return null;
}

function botMove(b) {
  // win / block / center / corner / side
  const tryPlace = (mark) => {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (b[r][c] !== ' ') continue;
        b[r][c] = mark;
        const w = winner(b);
        b[r][c] = ' ';
        if (w === mark) return [r, c];
      }
    }
    return null;
  };
  let m = tryPlace('O') || tryPlace('X');
  if (m) return m;
  if (b[1][1] === ' ') return [1, 1];
  for (const [r, c] of [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
    [0, 1],
    [1, 0],
    [1, 2],
    [2, 1],
  ]) {
    if (b[r][c] === ' ') return [r, c];
  }
  return null;
}

module.exports = {
  name: 'ttt',
  pattern: 'ttt',
  aliases: ['tictactoe', 'xo'],
  desc: 'Tic-tac-toe · .ttt start | .ttt 5 (cell 1-9)',
  category: 'games',
  async handler({ reply, jid, arg }) {
    const key = jid;
    const a = (arg || '').trim().toLowerCase();

    if (!a || a === 'start' || a === 'new') {
      games.set(key, empty());
      await reply(
        `❌⭕ *Tic-tac-toe*\nYou are *X*. Pick a cell *1–9*:\n\n1 2 3\n4 5 6\n7 8 9\n\n\`${boardText(empty())}\`\n\nExample: \`.ttt 5\``,
      );
      return;
    }

    if (!games.has(key)) {
      await reply('Start with `.ttt start`');
      return;
    }

    const n = parseInt(a, 10);
    if (Number.isNaN(n) || n < 1 || n > 9) {
      await reply('Pick cell 1–9, e.g. `.ttt 3`');
      return;
    }

    const b = games.get(key);
    const r = Math.floor((n - 1) / 3);
    const c = (n - 1) % 3;
    if (b[r][c] !== ' ') {
      await reply('Cell taken. Try another.');
      return;
    }

    b[r][c] = 'X';
    let w = winner(b);
    if (w) {
      games.delete(key);
      await reply(`${boardText(b)}\n\n${w === 'draw' ? '🤝 Draw!' : '🏆 You win!'}`);
      return;
    }

    const mv = botMove(b);
    if (mv) b[mv[0]][mv[1]] = 'O';
    w = winner(b);
    if (w) {
      games.delete(key);
      await reply(
        `${boardText(b)}\n\n${w === 'draw' ? '🤝 Draw!' : w === 'O' ? '🤖 Bot wins!' : '🏆 You win!'}`,
      );
      return;
    }

    await reply(`${boardText(b)}\n\nYour turn · \`.ttt <1-9>\``);
  },
};
