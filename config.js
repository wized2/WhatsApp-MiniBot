/** Bot configuration — edit freely */
module.exports = {
  botName: 'MiniBot',

  // Owner number in international format without + (e.g. 923001234567)
  ownerNumber: '923073477752',

  prefix: '.',

  // Hosting platforms (KataBump, Railway, etc.) inject PORT.
  // Always bind 0.0.0.0 inside the container — never the public IP.
  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0',

  pairNumber: '923073477752',

  sessionDir: './session',

  publicUrl: process.env.PUBLIC_URL || '',

  themeColor: '#25D366',
  tagline: 'Plugins · Mini-apps · Games inside WhatsApp',

  // Rich HTML mini-app envelope (internal WA field — not your account JID)
  richBotJid: process.env.RICH_BOT_JID || '867051314767696@bot',
};
