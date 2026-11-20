/**
 * Self-healing watchdog. Every 30 s it looks at the health facts and, when the forwarder has
 * gone quiet without WhatsApp telling us (a half-open connection), it fixes it by itself:
 *   1. connected but no successful channel fetch for a few minutes -> drop the socket and reconnect
 *   2. offline for too long, memory too high, or repeated stale reconnects -> restart the process
 *      (only when a supervisor such as katabump.js will start it again), otherwise reconnect in-process
 * It never acts while the bot is idle (.stop), logged out, or has no channel rules.
 */
const DEFAULTS = {
  intervalMs: 30000,
  scanStaleMs: 4 * 60 * 1000, // connected, but no successful channel fetch this long
  deadMs: 8 * 60 * 1000, // not connected this long
  cooldownMs: 3 * 60 * 1000, // minimum time between watchdog reconnects
  escalateWithinMs: 15 * 60 * 1000, // a 2nd stale reconnect within this window restarts the process
  maxRssMb: 0, // 0 = off
};

/** Pure decision. `s` is a plain snapshot, `c` the config, `now` ms. */
function decide(s, c, now) {
  if (s.loggedOut || s.idle) return { action: 'none' };
  if (c.maxRssMb && s.rssMb > c.maxRssMb) {
    return { action: 'restart', reason: 'memory ' + s.rssMb + ' MB' };
  }
  if (!s.connected) {
    const since = s.disconnectedSince || 0;
    if (s.registered && since && now - since > c.deadMs) {
      return { action: 'restart', reason: 'offline for ' + Math.round((now - since) / 1000) + ' s' };
    }
    return { action: 'none' };
  }
  if (s.channels > 0) {
    const ref = Math.max(s.lastScanOk || 0, s.connectedSince || 0);
    if (ref && now - ref > c.scanStaleMs) {
      return { action: 'reconnect', reason: 'no successful channel fetch for ' + Math.round((now - ref) / 1000) + ' s' };
    }
  }
  return { action: 'none' };
}

function startWatchdog(opts) {
  const c = Object.assign({}, DEFAULTS, opts.config || {});
  const log = opts.log || (() => {});
  const now = opts.now || (() => Date.now());
  let lastAct = 0;
  let lastStale = 0;

  function check() {
    let snap;
    try {
      snap = opts.snapshot();
    } catch (e) {
      return;
    }
    const t = now();
    const d = decide(snap, c, t);
    if (d.action === 'none') return d;
    if (t - lastAct < c.cooldownMs && d.action === 'reconnect') return { action: 'cooldown' };

    if (d.action === 'reconnect') {
      const escalate = lastStale && t - lastStale < c.escalateWithinMs && opts.supervised;
      lastStale = t;
      lastAct = t;
      if (escalate) {
        log('[watchdog] stale again (' + d.reason + ') -> restarting process');
        opts.restartProcess(d.reason);
        return { action: 'restart', reason: d.reason };
      }
      log('[watchdog] ' + d.reason + ' -> reconnecting');
      opts.reconnect(d.reason);
      return d;
    }

    // restart
    lastAct = t;
    if (opts.supervised) {
      log('[watchdog] ' + d.reason + ' -> restarting process');
      opts.restartProcess(d.reason);
    } else {
      log('[watchdog] ' + d.reason + ' -> reconnecting in-process');
      opts.reconnect(d.reason);
    }
    return d;
  }

  const timer = setInterval(check, c.intervalMs);
  if (timer.unref) timer.unref();
  return { check, stop: () => clearInterval(timer), config: c };
}

module.exports = { decide, startWatchdog, DEFAULTS };
