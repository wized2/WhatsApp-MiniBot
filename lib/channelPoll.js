/**
 * Backfill loop: every few seconds scan channels for posts the live feed missed
 * and drain the retry queue. Pauses while the bot is idle (.stop).
 */
const engine = require('./cfwdEngine');
const botState = require('./botState');

const SCAN_MS = 5000;
const QUEUE_MS = 5000;

let scanTimer = null;
let queueTimer = null;
let scanning = false;
let sockRef = null;
let configRef = null;

async function tick() {
  if (scanning || !sockRef || botState.isIdle()) return;
  scanning = true;
  try {
    await engine.scan(sockRef, configRef || {});
  } catch (e) {
    console.error('[cfwd-poll]', e.message || e);
  } finally {
    scanning = false;
  }
}

function startChannelPoll(sock, config) {
  stopChannelPoll();
  sockRef = sock;
  configRef = config;
  engine.forceResubscribe();
  console.log('[cfwd-poll] scan every', SCAN_MS, 'ms');
  scanTimer = setInterval(() => tick(), SCAN_MS);
  queueTimer = setInterval(() => {
    if (sockRef) engine.processQueue(sockRef).catch((e) => console.error('[cfwd-poll] queue', e.message || e));
  }, QUEUE_MS);
  setTimeout(() => tick(), 800);
}

function stopChannelPoll() {
  if (scanTimer) clearInterval(scanTimer);
  if (queueTimer) clearInterval(queueTimer);
  scanTimer = queueTimer = null;
  sockRef = null;
  scanning = false;
  engine.flush();
}

function refreshSubscriptions() {
  engine.forceResubscribe();
}

module.exports = { startChannelPoll, stopChannelPoll, refreshSubscriptions, tick };
