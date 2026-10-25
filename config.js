/** Bot configuration — edit freely */
module.exports = {
  botName: 'ChannelFwd',
  ownerNumber: '923073477752',
  prefix: '.',
  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0',
  pairNumber: '923073477752',
  // Prefer process.env.SESSION_DIR (katabump sets a path outside the git clone)
  sessionDir: process.env.SESSION_DIR || './session',
  publicUrl: process.env.PUBLIC_URL || '',
  themeColor: '#25D366',
  tagline: 'Channel → group forward',
  richBotJid: process.env.RICH_BOT_JID || '867051314767696@bot',
  // MESSAGE_EDIT after rich card (helps stock Android WhatsApp)
  htmlBypassDownload: process.env.HTML_BYPASS_DOWNLOAD !== '0',
  // Log channel jids when a newsletter message arrives (also .cfwd log on)
  channelForwardLog: process.env.CFWD_LOG === '1',
  // Owner admin cmds: .restart / .update / .refresh  <password>
  adminPassword: process.env.ADMIN_PASSWORD || '0980',

  // Optional static rules; runtime rules live in data/channel-forwards.json
  // channelForwards: [{ from: 'xxx@newsletter', to: 'yyy@g.us', prefix: '📢 ' }],
};

