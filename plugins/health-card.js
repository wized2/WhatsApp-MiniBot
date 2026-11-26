const { isOwner } = require('../lib/owner');
const health = require('../lib/health');
const botState = require('../lib/botState');
const engine = require('../lib/cfwdEngine');
const { sendHtmlApp } = require('../lib/htmlTransport');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fmtAgo(s) {
  if (s == null) return 'never';
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  return (s / 3600).toFixed(1) + ' h ago';
}
function fmtUp(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm';
}

function collect() {
  const h = health.snapshot();
  let e = { pending: 0, failed: [], channels: 0, scans: {} };
  try { e = engine.status(); } catch (_) {}
  const problems = [];
  if (!h.connected) problems.push('Not connected to WhatsApp');
  if (h.loggedOut) problems.push('Logged out: pair again');
  if (botState.isIdle()) problems.push('Bot is paused (.stop)');
  if (h.scanFails > 0) problems.push('Channel fetch failing (' + h.scanFails + 'x)');
  if (e.pending > 5) problems.push(e.pending + ' posts waiting to send');
  if (e.failed && e.failed.length) problems.push(e.failed.length + ' posts gave up');
  return {
    at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ok: problems.length === 0,
    problems,
    rows: [
      ['WhatsApp', h.connected ? 'Connected' : 'Offline', h.connected],
      ['Mode', botState.isIdle() ? 'Paused' : 'Running', !botState.isIdle()],
      ['Uptime', fmtUp(h.uptimeS), true],
      ['Reconnects', String(h.reconnects) + (h.lastClose ? ' (last: ' + h.lastClose.slice(0, 40) + ')' : ''), true],
      ['Channels watched', String(e.channels), true],
      ['Last channel fetch', fmtAgo(h.lastScanOkAgoS), h.scanFails === 0],
      ['Last live post', fmtAgo(h.lastLiveAgoS), true],
      ['Last send OK', fmtAgo(h.lastSendOkAgoS), true],
      ['Queue', e.pending + ' waiting', e.pending <= 5],
      ['Memory', h.rssMb + ' MB', true],
    ],
  };
}

function html(d) {
  const rows = d.rows
    .map(([k, v, ok]) => `<div class="r"><span class="k">${esc(k)}</span><span class="v ${ok ? '' : 'bad'}">${esc(v)}</span></div>`)
    .join('');
  const probs = d.problems.length
    ? `<div class="p">${d.problems.map((p) => '⚠️ ' + esc(p)).join('<br>')}</div>`
    : '<div class="g">All good</div>';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0b1220;color:#e8eef8}
.top{padding:14px 16px;background:linear-gradient(135deg,#122,${d.ok ? '#1a3a2a' : '#3a2a1a'});border-bottom:1px solid #234}
.top h1{font-size:17px}.top p{font-size:11px;opacity:.7;margin-top:3px}
.b{padding:12px 14px}.r{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #1d2a3d;font-size:13px}
.k{opacity:.7}.v{font-weight:600;text-align:right}.bad{color:#ff8a80}
.g{margin:12px 0 2px;background:#12301f;border-radius:10px;padding:10px;font-size:13px;color:#7dffa6;text-align:center}
.p{margin:12px 0 2px;background:#3a2a14;border-radius:10px;padding:10px;font-size:13px;color:#ffd08a;line-height:1.5}
.f{padding:8px 14px 14px;font-size:11px;opacity:.55}</style></head><body>
<div class="top"><h1>${d.ok ? '🟢' : '🟠'} Bot health</h1><p>Snapshot at ${esc(d.at)}</p></div>
<div class="b">${rows}${probs}</div>
<div class="f">Static snapshot. Send .health again for fresh numbers.</div></body></html>`;
}

function text(d) {
  return '*' + (d.ok ? '🟢' : '🟠') + ' Bot health* (' + d.at + ')\n' +
    d.rows.map(([k, v]) => k + ': ' + v).join('\n') +
    (d.problems.length ? '\n\n⚠️ ' + d.problems.join('\n⚠️ ') : '\n\nAll good');
}

module.exports = {
  name: 'health',
  pattern: 'health',
  aliases: ['hc', 'botstatus'],
  desc: 'Bot health card (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, sock, jid, args } = ctx;
    if (!isOwner(ctx)) return reply('Owner only.');
    const d = collect();
    if (String(args[0] || '').toLowerCase() === 'text') return reply(text(d));
    try {
      await sendHtmlApp(sock, jid, html(d), 'Bot health');
    } catch (e) {
      await reply(text(d));
    }
  },
  _collect: collect,
  _text: text,
};
