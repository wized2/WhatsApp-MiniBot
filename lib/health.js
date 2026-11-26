/**
 * Shared health facts for the watchdog, the /health endpoint and the host runner.
 * Plain counters and timestamps only, no dependencies.
 */
const h = {
  startedAt: Date.now(),
  connected: false,
  registered: false,
  loggedOut: false,
  openAt: 0,
  closeAt: 0,
  scanOkAt: 0,
  scanFails: 0,
  liveAt: 0,
  inboundAt: 0,
  sendOkAt: 0,
  reconnects: 0,
  lastClose: '',
};

function noteOpen() {
  h.connected = true;
  h.loggedOut = false;
  h.openAt = Date.now();
  h.scanFails = 0;
}

function noteClose(reason) {
  h.connected = false;
  h.closeAt = Date.now();
  h.reconnects += 1;
  h.lastClose = String(reason || '');
}

function noteLoggedOut() {
  h.loggedOut = true;
}

function setRegistered(v) {
  h.registered = !!v;
}

/** A channel fetch came back without an error (even if it had no new posts). */
function noteScanOk() {
  h.scanOkAt = Date.now();
  h.scanFails = 0;
}

function noteScanFail() {
  h.scanFails += 1;
}

/** A channel post arrived on the live feed. */
function noteLive() {
  h.liveAt = Date.now();
}

/** Any message event arrived from WhatsApp (proves the receive side is alive). */
function noteInbound() {
  h.inboundAt = Date.now();
}

function noteSendOk() {
  h.sendOkAt = Date.now();
}

function snapshot(extra) {
  const now = Date.now();
  const ago = (t) => (t ? Math.round((now - t) / 1000) : null);
  return Object.assign(
    {
      ok: h.connected,
      connected: h.connected,
      registered: h.registered,
      loggedOut: h.loggedOut,
      uptimeS: Math.round((now - h.startedAt) / 1000),
      lastOpenAgoS: ago(h.openAt),
      lastCloseAgoS: ago(h.closeAt),
      lastScanOkAgoS: ago(h.scanOkAt),
      scanFails: h.scanFails,
      lastLiveAgoS: ago(h.liveAt),
      lastSendOkAgoS: ago(h.sendOkAt),
      reconnects: h.reconnects,
      lastClose: h.lastClose,
      rssMb: Math.round(process.memoryUsage().rss / 1048576),
    },
    extra || {}
  );
}

/** Raw timestamps for the watchdog. */
function raw() {
  return { ...h };
}

function _reset() {
  Object.assign(h, {
    startedAt: Date.now(),
    connected: false,
    registered: false,
    loggedOut: false,
    openAt: 0,
    closeAt: 0,
    scanOkAt: 0,
    scanFails: 0,
    liveAt: 0,
    inboundAt: 0,
    sendOkAt: 0,
    reconnects: 0,
    lastClose: '',
  });
}

module.exports = {
  noteOpen,
  noteClose,
  noteLoggedOut,
  setRegistered,
  noteScanOk,
  noteScanFail,
  noteLive,
  noteInbound,
  noteSendOk,
  snapshot,
  raw,
  _reset,
};
