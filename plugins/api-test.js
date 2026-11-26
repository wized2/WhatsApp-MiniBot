const { isOwner } = require('../lib/owner');
const { sendHtmlApp } = require('../lib/htmlTransport');

const TESTS = [
  { name: 'JokeAPI', url: 'https://v2.jokeapi.dev/joke/Any?safe-mode&type=single', pick: (j) => j.joke },
  { name: 'Official Joke API', url: 'https://official-joke-api.appspot.com/random_joke', pick: (j) => j.setup + ' ' + j.punchline },
];

async function probe(t) {
  const t0 = Date.now();
  try {
    const res = await fetch(t.url, { signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } });
    const ms = Date.now() - t0;
    if (!res.ok) return { ok: false, name: t.name, ms, err: 'HTTP ' + res.status };
    const j = await res.json();
    return { ok: true, name: t.name, ms, joke: String(t.pick(j) || '').slice(0, 300) };
  } catch (e) {
    const c = e && e.cause && (e.cause.code || e.cause.message);
    return { ok: false, name: t.name, ms: Date.now() - t0, err: (e && e.name === 'TimeoutError' ? 'timeout (12s)' : (c || e.message || String(e))) };
  }
}

function cardHtml(server) {
  const srv = JSON.stringify(server).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0b1220;color:#e8eef8}
.top{padding:14px 16px;background:linear-gradient(135deg,#122,#1a3a2a);border-bottom:1px solid #234}
.top h1{font-size:17px}.top p{font-size:11px;opacity:.7;margin-top:3px}.b{padding:14px}
.box{background:#152033;border:1px solid #243044;border-radius:14px;padding:12px;margin-bottom:12px;font-size:13px;line-height:1.5}
.box h2{font-size:12px;opacity:.65;margin-bottom:6px;font-weight:600}.ok{color:#7dffa6}.bad{color:#ff8a80}
button{width:100%;border:0;border-radius:12px;padding:13px;font-weight:700;font-size:14px;background:#25D366;color:#042}
#out{white-space:pre-wrap;word-break:break-word}</style></head><body>
<div class="top"><h1>Internet test</h1><p>Does this mini app have internet access?</p></div>
<div class="b">
<div class="box"><h2>BOT SERVER (checked when sent)</h2><div id="srv"></div></div>
<div class="box"><h2>THIS MINI APP (live, inside WhatsApp)</h2><div id="out">Tap the button to call the joke API from here.</div></div>
<button id="go">Test from mini app</button></div>
<script>
var S=${srv};
document.getElementById('srv').innerHTML=S.map(function(r){return r.ok?'<span class="ok">✅ '+r.name+' · '+r.ms+'ms</span>':'<span class="bad">❌ '+r.name+' · '+r.err+'</span>'}).join('<br>');
var out=document.getElementById('out');
function show(c,t){out.className=c;out.textContent=t}
document.getElementById('go').onclick=function(){
  show('','Testing…');
  var t0=Date.now(),done=false;
  var timer=setTimeout(function(){if(!done){done=true;show('bad','❌ No answer in 10s (no internet, or requests blocked here)')}},10000);
  try{
    if(typeof fetch!=='function'){clearTimeout(timer);done=true;return show('bad','❌ fetch() is not available in this mini app')}
    fetch('https://v2.jokeapi.dev/joke/Any?safe-mode&type=single').then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){
      if(done)return;done=true;clearTimeout(timer);
      show('ok','✅ Internet works inside the mini app ('+(Date.now()-t0)+'ms)\\n\\n😄 '+(j.joke||j.setup+' '+j.delivery))
    }).catch(function(e){if(done)return;done=true;clearTimeout(timer);show('bad','❌ Blocked or failed: '+(e&&e.message||e))});
  }catch(e){clearTimeout(timer);done=true;show('bad','❌ Error: '+(e&&e.message||e))}
};
</script></body></html>`;
}

module.exports = {
  name: 'api',
  pattern: 'api',
  aliases: ['nettest', 'internet'],
  desc: 'Test the bot server internet access with a joke API (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply, sock, jid, args } = ctx;
    if (!isOwner(ctx)) return reply('Owner only.');
    if (typeof fetch !== 'function') return reply('This Node version has no fetch (need Node 18+).');
    const res = await Promise.all(TESTS.map(probe));
    if (String(args[0] || '').toLowerCase() !== 'text') {
      try {
        await sendHtmlApp(sock, jid, cardHtml(res), 'Internet test');
        return;
      } catch (e) {
        console.warn('[api] card failed, sending text', e.message || e);
      }
    }
    const up = res.filter((r) => r.ok);
    const lines = res.map((r) => (r.ok ? '✅ ' + r.name + ' · ' + r.ms + 'ms' : '❌ ' + r.name + ' · ' + r.err + ' (' + r.ms + 'ms)'));
    let out = (up.length ? '*Internet: OK*' : '*Internet: NO ACCESS*') + '\n' + lines.join('\n');
    if (up.length) out += '\n\n😄 ' + up[0].joke;
    else out += '\n\nThe server could not reach the outside web (blocked network, DNS or firewall).';
    return reply(out);
  },
  _probe: probe,
  _card: cardHtml,
};
