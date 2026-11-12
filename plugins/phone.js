/**
 * In-chat "phone" launcher — CFWD builder + calc + calendar + tools.
 */
const { sendHtmlApp } = require('../lib/htmlTransport');

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
.btn{flex:1;border:0;border-radius:12px;padding:11px;font-weight:700;font-size:13px;cursor:pointer}
.btn-g{background:#25D366;color:#042}
.btn-s{background:#243044;color:#e8eef8}
.out{margin-top:12px;background:#0a101a;border:1px solid #2a3a50;border-radius:12px;padding:12px;font-family:ui-monospace,monospace;font-size:12px;white-space:pre-wrap;word-break:break-all}
.back{margin:0 0 10px;background:transparent;border:1px solid #345;color:#9ab;border-radius:10px;padding:8px 12px}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:10px}
.cal div{text-align:center;padding:8px 0;font-size:12px;border-radius:8px}
.cal .hd{opacity:.55;font-weight:600}
.cal .today{background:#25D366;color:#042;font-weight:700}
.cal .mute{opacity:.35}
.ckey{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.ckey button{padding:14px 0;border:0;border-radius:12px;background:#1a2740;color:#e8eef8;font-size:16px;font-weight:600}
.ckey button.op{background:#2a3f5f}
.ckey button.eq{background:#25D366;color:#042}
.disp{background:#0a101a;border:1px solid #2a3a50;border-radius:12px;padding:14px;font-size:22px;text-align:right;min-height:52px;font-family:ui-monospace,monospace}
</style></head><body>
<div id="home">
  <div class="top"><h1>Phone</h1><p>Tools · CFWD · calc · calendar</p></div>
  <div class="grid">
    <div class="app" onclick="show('cfwd')"><div class="ic">📡</div><div class="lb">CFWD Builder</div></div>
    <div class="app" onclick="show('strip')"><div class="ic">🧹</div><div class="lb">Strip Helper</div></div>
    <div class="app" onclick="show('calc')"><div class="ic">🧮</div><div class="lb">Calculator</div></div>
    <div class="app" onclick="show('cal')"><div class="ic">📅</div><div class="lb">Calendar</div></div>
    <div class="app" onclick="show('admin')"><div class="ic">🔐</div><div class="lb">Admin cmds</div></div>
    <div class="app" onclick="show('ids')"><div class="ic">🪪</div><div class="lb">ID tips</div></div>
  </div>
</div>

<div id="cfwd" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>CFWD add</h1><p>Build a ready .cfwd add line</p></div>
  <label>Channel link or JID</label>
  <input id="ch" placeholder="https://whatsapp.com/channel/… or 123@newsletter"/>
  <label>Group JID</label>
  <input id="gp" placeholder="120363…@g.us"/>
  <label>Footer (optional)</label>
  <input id="ft" placeholder="Dark News"/>
  <div class="row">
    <button class="btn btn-g" onclick="buildAdd()">Build command</button>
    <button class="btn btn-s" onclick="copyOut('out1')">Copy</button>
  </div>
  <div class="out" id="out1">Your command appears here</div>
</div>

<div id="strip" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>Strip helper</h1><p>Emoji / name / phrase strip commands</p></div>
  <label>Channel JID or link</label>
  <input id="sch" placeholder="channel jid or link"/>
  <label>Channel display name to strip</label>
  <input id="sname" placeholder="PAKISTAN EXPRESS LIVE"/>
  <label>Extra phrase</label>
  <input id="sph" placeholder="optional phrase"/>
  <div class="row">
    <button class="btn btn-g" onclick="buildStrip()">Build</button>
    <button class="btn btn-s" onclick="copyOut('out2')">Copy all</button>
  </div>
  <div class="out" id="out2"></div>
</div>

<div id="calc" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>Calculator</h1><p>Basic arithmetic</p></div>
  <div class="disp" id="cdisp">0</div>
  <div class="ckey">
    <button onclick="c('C')">C</button><button onclick="c('⌫')">⌫</button><button onclick="c('%')">%</button><button class="op" onclick="c('/')">÷</button>
    <button onclick="c('7')">7</button><button onclick="c('8')">8</button><button onclick="c('9')">9</button><button class="op" onclick="c('*')">×</button>
    <button onclick="c('4')">4</button><button onclick="c('5')">5</button><button onclick="c('6')">6</button><button class="op" onclick="c('-')">−</button>
    <button onclick="c('1')">1</button><button onclick="c('2')">2</button><button onclick="c('3')">3</button><button class="op" onclick="c('+')">+</button>
    <button onclick="c('0')">0</button><button onclick="c('.')">.</button><button class="eq" onclick="c('=')" style="grid-column:span 2">=</button>
  </div>
</div>

<div id="cal" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>Calendar</h1><p id="calTitle">…</p></div>
  <div class="row">
    <button class="btn btn-s" onclick="calShift(-1)">‹ Prev</button>
    <button class="btn btn-s" onclick="calShift(1)">Next ›</button>
  </div>
  <div class="cal" id="calGrid"></div>
  <div class="out" id="calOut" style="margin-top:12px"></div>
</div>

<div id="admin" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>Admin</h1><p>Password-gated (default 0980)</p></div>
  <label>Password</label>
  <input id="pw" type="password" value="0980"/>
  <div class="row">
    <button class="btn btn-s" onclick="adm('refresh')">refresh</button>
    <button class="btn btn-s" onclick="adm('update')">update</button>
    <button class="btn btn-s" onclick="adm('restart')">restart</button>
  </div>
  <div class="out" id="out3"></div>
</div>

<div id="ids" class="panel">
  <button class="back" onclick="showHome()">← Home</button>
  <div class="top"><h1>ID tips</h1></div>
  <div class="out">• Group JID: send .chatid in the group
• Channel JID: open channel → share link, or .cfwd resolve &lt;link&gt;
• Hub pattern: sources → hub@newsletter → group (ocfwd)
• Group admin: .kick .warn .del .approveall .tagall
• Games: .games</div>
</div>

<script>
function show(id){
  document.getElementById('home').style.display='none';
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on')});
  document.getElementById(id).classList.add('on');
  if(id==='cal')renderCal();
}
function showHome(){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on')});
  document.getElementById('home').style.display='block';
}
function buildAdd(){
  var ch=(document.getElementById('ch').value||'').trim();
  var gp=(document.getElementById('gp').value||'').trim();
  var ft=(document.getElementById('ft').value||'').trim();
  var cmd='.cfwd add '+ch+' '+gp+(ft?(' '+ft):'');
  document.getElementById('out1').textContent=cmd;
}
function buildStrip(){
  var ch=(document.getElementById('sch').value||'').trim();
  var name=(document.getElementById('sname').value||'').trim();
  var ph=(document.getElementById('sph').value||'').trim();
  var lines=[];
  if(name) lines.push('.cfwd strip name '+ch+' '+name);
  if(ph) lines.push('.cfwd strip add '+ch+' '+ph);
  document.getElementById('out2').textContent=lines.join('\\n')||'Fill name or phrase';
}
function copyOut(id){
  var t=document.getElementById(id).textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(t);
}
function adm(cmd){
  var pw=(document.getElementById('pw').value||'').trim();
  document.getElementById('out3').textContent='.'+cmd+' '+pw;
  if(navigator.clipboard) navigator.clipboard.writeText('.'+cmd+' '+pw);
}
/* calculator */
var cexpr='';
function c(k){
  if(k==='C'){cexpr='';}
  else if(k==='⌫'){cexpr=cexpr.slice(0,-1)}
  else if(k==='='){
    try{
      var e=cexpr.replace(/×/g,'*').replace(/÷/g,'/').replace(/%/g,'/100');
      if(!/^[-+*/().\\d\\s]+$/.test(e)) throw 0;
      // eslint-disable-next-line no-new-func
      cexpr=String(Function('"use strict";return ('+e+')')());
    }catch(err){cexpr='Error'}
  } else { if(cexpr==='Error')cexpr=''; cexpr+=k; }
  document.getElementById('cdisp').textContent=cexpr||'0';
}
/* calendar */
var calDate=new Date();
function calShift(d){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+d,1);renderCal()}
function renderCal(){
  var y=calDate.getFullYear(), m=calDate.getMonth();
  var names=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calTitle').textContent=names[m]+' '+y;
  var first=new Date(y,m,1).getDay();
  var days=new Date(y,m+1,0).getDate();
  var today=new Date();
  var html=['Su','Mo','Tu','We','Th','Fr','Sa'].map(function(h){return '<div class="hd">'+h+'</div>'}).join('');
  for(var i=0;i<first;i++) html+='<div class="mute">·</div>';
  for(var d=1;d<=days;d++){
    var isT=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+='<div class="'+(isT?'today':'')+'">'+d+'</div>';
  }
  document.getElementById('calGrid').innerHTML=html;
  document.getElementById('calOut').textContent='Today: '+today.toDateString()+'\\nUnix: '+Math.floor(Date.now()/1000);
}
</script>
</body></html>`;
}

/** Safe math eval for .calc command */
function safeCalc(expr) {
  let e = String(expr || '');
  e = e
    .replace(/[×xX]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/,/g, '')
    .replace(/=/g, '');
  e = e.replace(/[^0-9+\-*/%().^\s]/g, '').replace(/\s+/g, '');
  if (!e) throw new Error('empty expression');
  if (!/[0-9]/.test(e)) throw new Error('no numbers');
  const cleaned = e.replace(/\^/g, '**');
  // eslint-disable-next-line no-new-func
  const val = Function('"use strict";return (' + cleaned + ')')();
  if (typeof val !== 'number' || !Number.isFinite(val)) throw new Error('bad result');
  return val;
}

module.exports = [
  {
    name: 'phone',
    pattern: 'phone',
    aliases: ['mobile', 'launcher', 'cfwdphone'],
    desc: 'HTML phone: CFWD builder, calc, calendar',
    category: 'tools',
    async handler(ctx) {
      const { sock, reply, m } = ctx;
      const jid = ctx.jid || m?.key?.remoteJid;
      try {
        if (!jid) throw new Error('no chat jid');
        await sendHtmlApp(sock, jid, phoneHtml(), 'Phone');
      } catch (e) {
        await reply(
          'Phone UI failed (' +
            (e.message || e) +
            ').\nTry: `.calc 2+2` · `.calendar` · `.cfwd list`'
        );
      }
    },
  },
  {
    name: 'calc',
    pattern: 'calc',
    aliases: ['calculate', 'math'],
    desc: 'Calculator — `.calc 2+2*3`',
    category: 'tools',
    async handler(ctx) {
      const expr = ctx.arg || ctx.args.join(' ');
      if (!expr) return ctx.reply('Usage: `.calc 12*5+3`');
      try {
        const v = safeCalc(expr);
        await ctx.reply(`🧮 \`${expr}\` = *${v}*`);
      } catch (e) {
        await ctx.reply('Calc error: ' + (e.message || e) + '\nTry: `.calc 2+2` or `.calc (10+5)/3`');
      }
    },
  },
  {
    name: 'calendar',
    pattern: 'calendar',
    aliases: ['cal', 'date', 'today'],
    desc: 'Show today’s date / month overview',
    category: 'tools',
    async handler(ctx) {
      const now = new Date();
      // Asia/Karachi friendly string
      const local = now.toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const y = now.getFullYear();
      const m = now.getMonth();
      const days = new Date(y, m + 1, 0).getDate();
      const names = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      await ctx.reply(
        `📅 *${local}*\n` +
          `Month: ${names[m]} ${y} (${days} days)\n` +
          `Unix: ${Math.floor(Date.now() / 1000)}\n` +
          `Open \`.phone\` → Calendar for a full month grid.`
      );
    },
  },
];
