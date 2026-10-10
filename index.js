const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode');
const config = require('./config');
const { loadPlugins, matchPlugin, extractText } = require('./lib/pluginLoader');
const { startPairServer } = require('./lib/pairServer');
const msgStore = require('./lib/msgStore');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('baileys');

const sessionDir = path.resolve(config.sessionDir);
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

let plugins = loadPlugins(path.join(__dirname, 'plugins'));

function reloadPlugins(reason) {
  try {
    const next = loadPlugins(path.join(__dirname, 'plugins'));
    plugins = next;
    console.log('[plugins] hot-reload', reason || '', 'count=', plugins.length);
  } catch (e) {
    console.error('[plugins] hot-reload failed', e.message);
  }
}

// Hot-swap plugins without restarting the socket
try {
  const pluginsDir = path.join(__dirname, 'plugins');
  let timer = null;
  fs.watch(pluginsDir, { persistent: false }, (event, file) => {
    if (!file || !String(file).endsWith('.js')) return;
    clearTimeout(timer);
    timer = setTimeout(() => reloadPlugins(event + ':' + file), 400);
  });
  console.log('[plugins] watching', pluginsDir);
} catch (e) {
  console.warn('[plugins] watch unavailable', e.message);
}


const state = {
  connected: false,
  user: null,
  lastQrDataUrl: null,
  pairingCode: null,
  message: 'Starting…',
  updatedAt: Date.now(),
  socketReady: false,
  registered: false,
  lastError: null,
  requestPairingCode: null,
};

startPairServer(config, state);

function normalizePhone(input) {
  let n = String(input || '').replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.length < 10 || n.length > 15) {
    throw new Error('Phone must be country code + number, digits only (10–15 digits). Example: 923001234567');
  }
  return n;
}

function formatPairCode(code) {
  const c = String(code || '').replace(/\W/g, '').toUpperCase();
  if (c.length === 8) return c.slice(0, 4) + '-' + c.slice(4);
  return c;
}

let sockRef = null;
let pairingInFlight = null;
let waitedForQr = false;

function clearSessionFiles() {
  try {
    for (const f of fs.readdirSync(sessionDir)) {
      fs.unlinkSync(path.join(sessionDir, f));
    }
    console.log('[pair] cleared session folder');
  } catch (e) {
    console.warn('[pair] clear session', e.message);
  }
}

async function startBot() {
  const { state: authState, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  // Custom browser labels produce DEAD pairing codes WhatsApp rejects.

  // Retry counter — without this, peers stay on "Waiting for this message"
  const msgRetryCounterCache = {
    get: (k) => msgRetryCounterCache._m.get(k),
    set: (k, v) => { msgRetryCounterCache._m.set(k, v); return true; },
    del: (k) => msgRetryCounterCache._m.delete(k),
    flushAll: () => msgRetryCounterCache._m.clear(),
    _m: new Map(),
  };

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: 'silent' })),
    },
    browser: Browsers.macOS('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    // Critical: answer retry requests so peers don't stick on "Waiting for this message"
    getMessage: msgStore.getMessage,
    msgRetryCounterCache,
  });

  sockRef = sock;
  waitedForQr = false;
  pairingInFlight = null;
  state.socketReady = false;
  state.registered = !!sock.authState.creds.registered;
  state.lastError = null;
  state.message = state.registered ? 'Session found — connecting…' : 'Waiting for WhatsApp handshake…';
  state.updatedAt = Date.now();

  state.requestPairingCode = async (rawNumber) => {
    if (!sockRef) throw new Error('Socket not ready');
    if (sockRef.authState.creds.registered) {
      throw new Error('Already linked. Delete the session/ folder and restart to re-pair.');
    }

    const number = normalizePhone(rawNumber);

    const deadline = Date.now() + 45000;
    while (!waitedForQr && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!waitedForQr) {
      throw new Error('WhatsApp handshake not ready yet. Wait a few seconds and try again.');
    }

    if (pairingInFlight) return pairingInFlight;

    pairingInFlight = (async () => {
      try {
        state.message = 'Requesting code for ' + number + '…';
        state.updatedAt = Date.now();
        const code = await sockRef.requestPairingCode(number);
        const pretty = formatPairCode(code);
        state.pairingCode = pretty;
        state.message =
          'Enter ' + pretty + ' on your phone within ~1 minute. WhatsApp → Linked devices → Link a device → Link with phone number instead';
        state.updatedAt = Date.now();
        state.lastError = null;
        console.log('[pair] REAL code for', number, '→', pretty);
        return pretty;
      } catch (e) {
        state.lastError = e.message || String(e);
        state.message = 'Pairing failed: ' + state.lastError;
        state.updatedAt = Date.now();
        console.error('[pair] requestPairingCode error', e);
        throw e;
      } finally {
        pairingInFlight = null;
      }
    })();

    return pairingInFlight;
  };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      waitedForQr = true;
      state.socketReady = true;
      try {
        state.lastQrDataUrl = await qrcode.toDataURL(qr);
        if (!state.pairingCode) {
          state.message =
            'Ready. Scan QR, or enter your number and tap Get code (enter the code in WhatsApp within 1 minute).';
        }
        state.updatedAt = Date.now();
        console.log('[pair] handshake OK — QR available');
      } catch (e) {
        console.error('[pair] QR render failed', e.message);
      }
    }

    if (connection === 'open') {
      state.connected = true;
      state.registered = true;
      state.user = sock.user || null;
      state.pairingCode = null;
      state.lastQrDataUrl = null;
      state.message = 'Connected';
      state.lastError = null;
      state.updatedAt = Date.now();
      console.log('[bot] connected as', sock.user?.id || '?');
    }

    if (connection === 'close') {
      state.connected = false;
      state.user = null;
      state.socketReady = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || String(statusCode || 'unknown');
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      state.lastError = reason;
      state.message = loggedOut
        ? 'Logged out — delete session/ and pair again'
        : 'Disconnected (' + (statusCode || '?') + ') — reconnecting…';
      state.updatedAt = Date.now();
      console.log('[bot] close', statusCode, reason);

      if (
        statusCode === DisconnectReason.loggedOut ||
        statusCode === 401 ||
        statusCode === 405
      ) {
        clearSessionFiles();
      }

      if (!loggedOut) {
        setTimeout(() => startBot().catch(console.error), 2500);
      }
    }
  });

  sock.ev.on('messages.upsert', async (upsert) => {
    const { messages, type } = upsert;
    // Baileys may deliver as notify OR append depending on sync path
    if (type !== 'notify' && type !== 'append') return;

    for (const m of messages) {
      try {
        if (!m.message) continue;
        msgStore.put(m);
        if (m.key.remoteJid === 'status@broadcast') continue;
        if (m.message.protocolMessage) continue;
        if (m.message.reactionMessage) continue;

        // Chat JID (DM or group). Public — anyone can run commands.
        const jid = m.key.remoteJid;
        if (!jid) continue;

        const text = extractText(m.message).trim();
        if (!text) continue;

        const sender = m.key.participant || m.participant || jid;
        console.log(
          '[msg]',
          type,
          jid,
          'from',
          sender,
          JSON.stringify(text.slice(0, 80)),
          'fromMe=',
          !!m.key.fromMe
        );

        const hit = matchPlugin(plugins, text, config.prefix);
        if (!hit) continue;

        console.log('[cmd]', hit.cmd, '→', hit.plugin.file, 'by', sender);

        const ctx = {
          sock,
          m,
          jid,
          sender,
          text,
          arg: hit.arg,
          args: hit.args || [],
          cmd: hit.cmd,
          config,
          plugins,
          reply: async (content) => {
            try {
              let sent;
              if (typeof content === 'string') {
                sent = await sock.sendMessage(jid, { text: content }, { quoted: m });
              } else {
                sent = await sock.sendMessage(jid, content, { quoted: m });
              }
              if (sent) msgStore.put(sent);
              return sent;
            } catch (err) {
              console.error('[reply]', err.message || err);
              if (typeof content === 'string') {
                const sent = await sock.sendMessage(jid, { text: content });
                if (sent) msgStore.put(sent);
                return sent;
              }
              throw err;
            }
          },
        };

        await hit.plugin.handler(ctx);
      } catch (e) {
        console.error('[msg]', e);
      }
    }
  });

  sock.__minibot = { config, plugins };
}

startBot().catch((e) => {
  console.error('Fatal', e);
  process.exit(1);
});
