const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode');
const config = require('./config');
const { loadPlugins, matchPlugin } = require('./lib/pluginLoader');
const { startPairServer } = require('./lib/pairServer');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const sessionDir = path.resolve(config.sessionDir);
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

const plugins = loadPlugins(path.join(__dirname, 'plugins'));
const state = {
  connected: false,
  user: null,
  lastQrDataUrl: null,
  pairingCode: null,
  message: 'Starting…',
  updatedAt: Date.now(),
  requestPairingCode: null,
};

startPairServer(config, state);

async function startBot() {
  const { state: authState, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: 'silent' })),
    },
    browser: [config.botName, 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  state.requestPairingCode = async (number) => {
    // Baileys expects digits only
    const code = await sock.requestPairingCode(number);
    // Pretty form: ABCD-EFGH when 8 chars
    const pretty =
      String(code).length === 8
        ? `${String(code).slice(0, 4)}-${String(code).slice(4)}`
        : String(code);
    state.pairingCode = pretty;
    state.message = `Pairing code for ${number}`;
    state.updatedAt = Date.now();
    console.log('[pair] code', pretty);
    return pretty;
  };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        state.lastQrDataUrl = await qrcode.toDataURL(qr);
        state.message = 'Scan QR or request a pairing code on the web panel';
        state.updatedAt = Date.now();
        console.log('[pair] QR updated — open the pairing site');
      } catch (e) {
        console.error('[pair] QR render failed', e.message);
      }
    }

    if (connection === 'open') {
      state.connected = true;
      state.user = sock.user || null;
      state.message = 'Connected';
      state.pairingCode = null;
      state.updatedAt = Date.now();
      console.log('[bot] connected as', sock.user?.id || '?');
    }

    if (connection === 'close') {
      state.connected = false;
      state.user = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      state.message = shouldReconnect ? 'Disconnected — reconnecting…' : 'Logged out — delete session and pair again';
      state.updatedAt = Date.now();
      console.log('[bot] close', code, shouldReconnect ? 'reconnect' : 'stop');
      if (shouldReconnect) setTimeout(() => startBot().catch(console.error), 2000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      try {
        if (!m.message || m.key.fromMe) continue;
        const jid = m.key.remoteJid;
        if (!jid || jid === 'status@broadcast') continue;

        const text =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          m.message.imageMessage?.caption ||
          '';

        const hit = matchPlugin(plugins, text, config.prefix);
        if (!hit) continue;

        const ctx = {
          sock,
          m,
          jid,
          text,
          arg: hit.arg,
          cmd: hit.cmd,
          config,
          plugins,
          reply: async (content) => {
            if (typeof content === 'string') {
              return sock.sendMessage(jid, { text: content }, { quoted: m });
            }
            return sock.sendMessage(jid, content, { quoted: m });
          },
        };

        await hit.plugin.handler(ctx);
      } catch (e) {
        console.error('[msg]', e);
      }
    }
  });

  // Shared helpers for plugins
  sock.__minibot = { config, plugins };
}

startBot().catch((e) => {
  console.error('Fatal', e);
  process.exit(1);
});
