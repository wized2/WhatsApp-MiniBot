const { sendHtmlApp } = require('../lib/htmlTransport');

const GUESS_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation}
body{margin:0;background:#0b141a;color:#e9edef;font-family:system-ui,sans-serif}
.wrap{padding:14px;max-width:360px;margin:0 auto}
h3{margin:0 0 6px}
p{font-size:13px;opacity:.8;margin:0 0 10px}
.row{display:flex;gap:8px}
input{flex:1;border:0;border-radius:12px;padding:10px 12px;background:#1f2c34;color:#e9edef;font-size:16px}
button{border:0;border-radius:12px;padding:10px 14px;background:#25D366;color:#062;font-weight:700}
.msg{margin-top:12px;font-size:14px;min-height:20px}
.hist{margin-top:8px;font-size:12px;opacity:.7}
</style></head>
<body><div class="wrap">
<h3>Guess the number</h3>
<p>Pick 1–50. I'll say higher / lower.</p>
<div class="row">
  <input id="n" type="number" min="1" max="50" placeholder="1–50"/>
  <button id="go">Guess</button>
</div>
<div class="msg" id="m">Make a guess</div>
<div class="hist" id="h"></div>
<script>
let secret=1+Math.floor(Math.random()*50),tries=0;
const m=document.getElementById('m'),h=document.getElementById('h');
function reset(){secret=1+Math.floor(Math.random()*50);tries=0;m.textContent='New number — guess!';h.textContent=''}
document.getElementById('go').onclick=()=>{
  const v=Number(document.getElementById('n').value);
  if(!v||v<1||v>50){m.textContent='Enter 1–50';return}
  tries++;
  if(v===secret){m.textContent='Correct in '+tries+' tries!';h.textContent+=' ✓ '+v;return}
  m.textContent=v<secret?'Higher ↑':'Lower ↓';
  h.textContent+=(h.textContent?' · ':'')+v;
};
<\/script>
<button style="margin-top:10px;width:100%" onclick="reset()">New game</button>
</div></body></html>`;

module.exports = {
  name: 'guess',
  pattern: 'guess',
  aliases: ['number'],
  desc: 'In-chat number guess mini-app',
  category: 'games',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, GUESS_HTML, 'Guess the number');
  },
};
