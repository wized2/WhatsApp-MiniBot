const express = require('express');
const path = require('path');

/**
 * Lightweight pairing dashboard.
 * State is shared with index.js via the `state` object.
 */
function startPairServer(config, state) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/status', (_req, res) => {
    res.json({
      botName: config.botName,
      connected: !!state.connected,
      user: state.user || null,
      lastQrDataUrl: state.lastQrDataUrl || null,
      pairingCode: state.pairingCode || null,
      pairNumber: config.pairNumber,
      message: state.message || '',
      updatedAt: state.updatedAt || null,
    });
  });

  app.post('/api/request-code', async (req, res) => {
    try {
      const number = String(req.body?.number || config.pairNumber || '').replace(/\D/g, '');
      if (!number || number.length < 10) {
        return res.status(400).json({ ok: false, error: 'Valid number required (country code + number)' });
      }
      if (typeof state.requestPairingCode !== 'function') {
        return res.status(503).json({ ok: false, error: 'Socket not ready yet' });
      }
      const code = await state.requestPairingCode(number);
      state.pairingCode = code;
      state.updatedAt = Date.now();
      res.json({ ok: true, code, number });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message || String(e) });
    }
  });

  const server = app.listen(config.port, config.host, () => {
    console.log(`[pair] http://127.0.0.1:${config.port}`);
  });

  return server;
}

module.exports = { startPairServer };
