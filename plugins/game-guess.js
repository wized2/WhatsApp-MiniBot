const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Guess the number', `input{flex:1;border:0;border-radius:12px;padding:10px;background:#1f2c34;color:#fff}
.row{display:flex;gap:8px}`,
`<p style="font-size:13px;opacity:.8">Pick 1–50</p>
<div class="row"><input id="n" type="number" min="1" max="50"/><button id="go">Guess</button></div>
<div id="m" style="margin-top:10px">Make a guess</div>
<script>
let secret=1+Math.floor(Math.random()*50),tries=0;
document.getElementById('go').onclick=()=>{
  const v=Number(document.getElementById('n').value);if(!v||v<1||v>50){document.getElementById('m').textContent='Enter 1–50';return}
  tries++;
  if(v===secret)document.getElementById('m').textContent='Correct in '+tries+' tries!';
  else document.getElementById('m').textContent=v<secret?'Higher ↑':'Lower ↓';
};
<\/script>`);

module.exports = {
  name: 'guess',
  pattern: 'guess',
  aliases: ['number'],
  desc: 'Number guess mini-app',
  category: 'games',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, HTML, 'Guess the number');
  },
};
