module.exports = {
  name: 'ping',
  pattern: 'ping',
  aliases: ['speed'],
  desc: 'Latency check',
  category: 'main',
  async handler({ reply }) {
    const t0 = Date.now();
    await reply(`*pong* · ${Date.now() - t0}ms`);
  },
};
