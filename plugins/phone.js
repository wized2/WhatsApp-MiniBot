/**
 * In-chat "phone" launcher — CFWD command builder + quick tools.
 * Uses html mini-app transport (same as main branch games/phone).
 */
const { sendHtmlApp } = require('../lib/htmlTransport');
const { isOwner } = require('../lib/owner');

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function phoneHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0b1220;color:#e8eef8;min-height:100vh}
.top{padding:14px 16px;background:linear-gradient(135deg,#122,#1a3a2a);border-bottom:1px solid #234}
.top h1{font-size:17px;font-weight:700}
.top p{font-size:11px;opacity:.7;margin-top:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px}
.app{background:#152033;border:1px solid #243044;border-radius:16px;padding:14px 10px;text-align:center;cursor:pointer}
.app:active{transform:scale(.98)}
.app .ic{font-size:22px;margin-bottom:6px}
.app .lb{font-size:12px;font-weight:600}
.panel{display:none;padding:14px}
.panel.on{display:block}
label{display:block;font-size:11px;opacity:.75;margin:10px 0 4px}
input,textarea{width:100%;background:#0e1726;border:1px solid #2a3a50;color:#e8eef8;border-radius:10px;padding:10px;font-size:13px}
textarea{min-height:72px;font-family:ui-monospace,monospace}
.row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
btn,.btn{flex:1;border:0;border-radius:12px;padding:11px;font-weight:700;font-size:13px;cursor:pointer}
.btn-g{background:#25D366;color:#042}
.btn-s{background:#243044;color:#e8eef8}
.out{margin-top:12px;background:#0a101a;border:1px solid #2a3a50;border-radius:12px;padding:12px;font-family:ui-monospace,monospace;font-size:12px;white-space:pre-wrap;word-break:break-all}
.back{margin:10px 14px;background:transparent;border:1px solid #345;color:#9ab;border-radius:10px;padding:8px 12px}
.chk{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px}
</style></head><body>
<div id="home">
  <div class="top"><h1>Phone</h1><p>CFWD tools · copy-ready commands</p></div>
  <div class="grid">
    <div class="app" onclick="show('cfwd')"><div class="ic">📡</div><div class="lb">CFWD Builder</div></div>
    <div class="app" onclick="show('strip')"><div class="ic">🧹</div><div class="lb">Strip Helper</div></div>
    <div class="app" onclick="show('admin')"><div class="ic">🔐</div><div class="lb">Admin cmds</div></div>
    <div class="app" onclick="show('ids')"><div class="ic">🪪</div><div class="lb">ID tips</div></div>
  </div>
</div>

<div id="cfwd" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>CFWD add</h1><p>Build a ready \`.cfwd add\` line</p></div>
  <div style="padding:0 14px 18px">
    <label>Channel link or JID</label>
    <input id="ch" placeholder="https://whatsapp.com/channel/… or 123@newsletter"/>
    <label>Group JID</label>
    <input id="gp" placeholder="120363…@g.us"/>
    <label>Footer (optional)</label>
    <input id="ft" placeholder="Dark News"/>
    <div class="row">
      <button class="btn btn-g" onclick="buildAdd()">Build command</button>
      <button class="btn btn-s" onclick="copyOut()">Copy</button>
    </div>
    <div class="out" id="out1">Your command appears here</div>
  </div>
</div>

<div id="strip" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>Strip helper</h1><p>Emoji / name / phrase strip commands</p></div>
  <div style="padding:0 14px 18px">
    <label>Channel JID or link</label>
    <input id="sch" placeholder="channel jid or link"/>
    <label>Channel display name to strip</label>
    <input id="sname" placeholder="PAKISTAN EXPRESS LIVE"/>
    <label>Extra phrase</label>
    <input id="sph" placeholder="optional phrase"/>
    <div class="row">
      <button class="btn btn-g" onclick="buildStrip()">Build</button>
      <button class="btn btn-s" onclick="copyOut2()">Copy all</button>
    </div>
    <div class="out" id="out2"></div>
  </div>
</div>

<div id="admin" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>Admin</h1><p>Password-gated (default 0980)</p></div>
  <div style="padding:0 14px 18px">
    <label>Password</label>
    <input id="pw" type="password" value="0980"/>
    <div class="row">
      <button class="btn btn-s" onclick="adm('refresh')">refresh</button>
      <button class="btn btn-s" onclick="adm('update')">update</button>
      <button class="btn btn-s" onclick="adm('restart')">restart</button>
    </div>
    <div class="out" id="out3"></div>
  </div>
</div>

<div id="ids" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>IDs</h1></div>
  <div style="padding:14px;font-size:13px;line-height:1.5;opacity:.9">
    <p><b>.id</b> in a group → group JID</p>
    <p style="margin-top:8px"><b>.cfwd resolve &lt;channel-link&gt;</b> → channel JID</p>
    <p style="margin-top:8px"><b>.cfwd last</b> → last channel the bot saw</p>
    <p style="margin-top:8px">Owner-only commands need your number in config <code>ownerNumber</code>.</p>
  </div>
</div>

<script>
function show(id){document.getElementById('home').style.display='none';
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.getElementById(id).classList.add('on');}
function showHome(){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.getElementById('home').style.display='block';}
function buildAdd(){
  var ch=(document.getElementById('ch').value||'').trim();
  var gp=(document.getElementById('gp').value||'').trim();
  var ft=(document.getElementById('ft').value||'').trim();
  if(!ch||!gp){document.getElementById('out1').textContent='Need channel + group JID';return;}
  var cmd='.cfwd add '+ch+' '+gp+(ft?(' '+ft):'');
  document.getElementById('out1').textContent=cmd;
}
function copyOut(){
  var t=document.getElementById('out1').textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(t);
}
function buildStrip(){
  var ch=(document.getElementById('sch').value||'').trim();
  var name=(document.getElementById('sname').value||'').trim();
  var ph=(document.getElementById('sph').value||'').trim();
  if(!ch){document.getElementById('out2').textContent='Need channel';return;}
  var lines=['.cfwd strip emoji '+ch+' on'];
  if(name) lines.push('.cfwd strip name '+ch+' '+name);
  if(ph) lines.push('.cfwd strip add '+ch+' '+ph);
  document.getElementById('out2').textContent=lines.join('\\n');
}
function copyOut2(){
  var t=document.getElementById('out2').textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(t);
}
function adm(cmd){
  var pw=(document.getElementById('pw').value||'').trim();
  document.getElementById('out3').textContent='.'+cmd+' '+pw;
  if(navigator.clipboard) navigator.clipboard.writeText('.'+cmd+' '+pw);
}
</script>
</body></html>`;
}

module.exports = [
  {
    name: 'phone',
    pattern: 'phone',
    aliases: ['mobile', 'launcher', 'cfwdphone'],
    desc: 'HTML phone with CFWD command builder',
    category: 'tools',
    async handler(ctx) {
      const { sock, reply, m } = ctx;
      const jid = ctx.jid || m?.key?.remoteJid;
      try {
        if (!jid) throw new Error('no chat jid');
        await sendHtmlApp(sock, jid, phoneHtml(), 'Phone · CFWD');
      } catch (e) {
        await reply(
          'Phone UI failed (' +
            (e.message || e) +
            ').\nQuick builder text:\n' +
            '`.cfwd add <channelJid|link> <groupJid> [footer]`\n' +
            '`.cfwd resolve <channel-link>`\n' +
            '`.restart 0980` · `.update 0980` · `.refresh 0980`'
        );
      }
    },
  },
];
