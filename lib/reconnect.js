/**
 * Reconnect scheduler that never gives up.
 * - exponential backoff (2s … 60s) with jitter
 * - a failed start (network down, version lookup failed, …) schedules another attempt
 * - code 440 (session opened elsewhere) waits at least 30 s so two copies do not fight
 * - only one attempt can be waiting at a time
 */
const DELAYS = [2000, 4000, 8000, 15000, 30000, 60000];

function backoffMs(attempt, statusCode) {
  const base = DELAYS[Math.min(Math.max(attempt, 0), DELAYS.length - 1)];
  return statusCode === 440 ? Math.max(base, 30000) : base;
}

function createReconnector(opts) {
  const start = opts.start;
  const log = opts.log || (() => {});
  const jitter = opts.jitter !== false;
  const stableMs = opts.stableMs == null ? 30000 : opts.stableMs;
  const timers = opts.timers || { setTimeout, clearTimeout };

  let attempt = 0;
  let timer = null;
  let stableTimer = null;

  async function run() {
    try {
      await start();
    } catch (e) {
      log('[reconnect] start failed: ' + ((e && e.message) || e));
      schedule(undefined, 'start failed');
    }
  }

  function schedule(statusCode, reason) {
    if (timer) return false;
    const base = backoffMs(attempt, statusCode);
    attempt += 1;
    const wait = jitter ? Math.round(base * (0.85 + Math.random() * 0.3)) : base;
    log('[reconnect] attempt ' + attempt + ' in ' + wait + 'ms (' + (reason || statusCode || 'closed') + ')');
    timer = timers.setTimeout(() => {
      timer = null;
      run();
    }, wait);
    return true;
  }

  /** The socket opened: forget past failures once it has stayed up for a while. */
  function opened() {
    if (stableTimer) timers.clearTimeout(stableTimer);
    stableTimer = timers.setTimeout(() => {
      attempt = 0;
      stableTimer = null;
    }, stableMs);
  }

  function cancel() {
    if (timer) timers.clearTimeout(timer);
    if (stableTimer) timers.clearTimeout(stableTimer);
    timer = stableTimer = null;
  }

  return {
    schedule,
    opened,
    cancel,
    startNow: run,
    get attempts() {
      return attempt;
    },
    get pending() {
      return !!timer;
    },
  };
}

module.exports = { createReconnector, backoffMs, DELAYS };
