/** Bot configuration — edit freely */
module.exports = {
  botName: 'MiniBot',

  ownerNumber: '923073477752',
  prefix: '.',

  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0',

  pairNumber: '923073477752',
  sessionDir: './session',
  publicUrl: process.env.PUBLIC_URL || '',

  themeColor: '#25D366',
  tagline: 'Plugins · Mini-apps · Games inside WhatsApp',

  // Rich HTML envelope bot JID (internal WA field)
  richBotJid: process.env.RICH_BOT_JID || '867051314767696@bot',

  // MESSAGE_EDIT follow-up after rich card (fixes stock WA "Waiting…")
  htmlBypassDownload: process.env.HTML_BYPASS_DOWNLOAD !== '0',
};
