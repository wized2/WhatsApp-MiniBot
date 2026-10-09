const express = require('express');
const path = require('path');
const fs = require('fs');

function startPairServer(config, state) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/status', (_req, res) => {
    res.json({
      botName: config.botName,
      connected: !!state.connected,
      registered: !!state.registered,
      socketReady: !!state.socketReady,
      user: state.user || null,
      lastQrDataUrl: state.lastQrDataUrl || null,
      pairingCode: state.pairingCode || null,
      pairNumber: config.pairNumber,
      message: state.message || '',
      lastError: state.lastError || null,
      updatedAt: state.updatedAt || null,
    });
  });

  app.post('/api/request-code', async (req, res) => {
    try {
      const number = String(req.body?.number || config.pairNumber || '').replace(/\D/g, '');
      if (!number || number.length < 10) {
        return res.status(400).json({
          ok: false,
          error: 'Use country code + number, digits only. Example: 923001234567',
        });
      }
      if (typeof state.requestPairingCode !== 'function') {
        return res.status(503).json({ ok: false, error: 'Bot still starting — wait 3–5 seconds' });
      }
      if (state.connected || state.registered) {
        return res.status(400).json({
          ok: false,
          error: 'Already linked. Delete the session/ folder and restart to get a new code.',
        });
      }
      if (!state.socketReady) {
        return res.status(503).json({
          ok: false,
          error: 'WhatsApp handshake not ready. Wait until status says Ready, then try again.',
        });
      }

      const code = await state.requestPairingCode(number);
      res.json({
        ok: true,
        code,
        number,
        hint: 'WhatsApp → Linked devices → Link a device → Link with phone number instead. Enter within ~1 minute.',
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message || String(e) });
    }
  });

  app.post('/api/clear-session', (_req, res) => {
    try {
      const sessionDir = path.resolve(config.sessionDir || './session');
      if (fs.existsSync(sessionDir)) {
        for (const f of fs.readdirSync(sessionDir)) {
          fs.unlinkSync(path.join(sessionDir, f));
        }
      }
      state.pairingCode = null;
      state.lastQrDataUrl = null;
      state.message = 'Session cleared — restart the bot (npm start) to pair again';
      state.updatedAt = Date.now();
      res.json({ ok: true, message: 'Session cleared. Restart: npm start' });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message || String(e) });
    }
  });

  const server = app.listen(config.port, config.host, () => {
    console.log('[pair] http://127.0.0.1:' + config.port);
  });

  return server;
}

module.exports = { startPairServer };
