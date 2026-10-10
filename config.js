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
  richBotJid: process.env.RICH_BOT_JID || '867051314767696@bot',
  // MESSAGE_EDIT after rich card (helps stock Android WhatsApp)
  htmlBypassDownload: process.env.HTML_BYPASS_DOWNLOAD !== '0',
};
