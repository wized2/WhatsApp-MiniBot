/**
 * Backfill loop: every few seconds scan channels for posts the live feed missed
 * and drain the retry queue. Pauses while the bot is idle (.stop).
 * Self-protecting: a scan that hangs is abandoned after SCAN_MAX_MS, and a socket that is
 * closed without WhatsApp saying so is reported through opts.onDead so it gets replaced.
 */
const engine = require('./cfwdEngine');
const botState = require('./botState');

const SCAN_MS = 5000;
const QUEUE_MS = 5000;
const SCAN_MAX_MS = 120000;

let scanTimer = null;
let queueTimer = null;
let scanning = false;
let scanStartedAt = 0;
let sockRef = null;
let configRef = null;
let onDead = null;

function withTimeout(p, ms, label) {
  let t;
  return Promise.race([
    p,
    new Promise((_, rej) => {
      t = setTimeout(() => rej(new Error(label + ' timed out')), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

async function tick() {
  if (!sockRef || botState.isIdle()) return;
  if (engine.sockClosed(sockRef)) {
    if (onDead) {
      const cb = onDead;
      onDead = null; // report once per socket
      cb('socket closed without a close event');
    }
    return;
  }
  if (scanning) {
    // a scan that never finished must not block scanning forever
    if (Date.now() - scanStartedAt < SCAN_MAX_MS) return;
    console.warn('[cfwd-poll] scan stuck for', Math.round((Date.now() - scanStartedAt) / 1000), 's, resetting');
  }
  scanning = true;
  scanStartedAt = Date.now();
  const mine = scanStartedAt;
  try {
    await withTimeout(engine.scan(sockRef, configRef || {}), SCAN_MAX_MS, 'scan');
  } catch (e) {
    console.error('[cfwd-poll]', e.message || e);
  } finally {
    if (scanStartedAt === mine) scanning = false;
  }
}

function startChannelPoll(sock, config, opts) {
  stopChannelPoll();
  sockRef = sock;
  configRef = config;
  onDead = (opts && opts.onDead) || null;
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
  onDead = null;
  scanning = false;
  scanStartedAt = 0;
  engine.flush();
}

function refreshSubscriptions() {
  engine.forceResubscribe();
}

module.exports = { startChannelPoll, stopChannelPoll, refreshSubscriptions, tick };
