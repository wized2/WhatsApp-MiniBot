const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Guess Number',
`.row{display:flex;gap:8px}`,
`<p class="hint">Number is 1–50</p>
<div class="row"><input id="n" type="number" min="1" max="50" placeholder="Guess"/><button id="go">Go</button></div>
<p id="m" class="score"></p>
<script>
let secret,tries;
window.onGameStart=function(){secret=1+Math.floor(Math.random()*50);tries=0;document.getElementById('m').textContent='Make a guess';document.getElementById('n').value=''};
document.getElementById('go').onclick=()=>{
  if(!window.__gameRunning)return;
  const v=Number(document.getElementById('n').value);
  if(!v||v<1||v>50){document.getElementById('m').textContent='Enter 1–50';return}
  tries++;
  if(v===secret)showEnd('Correct!','In '+tries+' tries');
  else document.getElementById('m').textContent=v<secret?'Higher ↑':'Lower ↓';
};
<\/script>`,
{ hint: '1 to 50' });

module.exports = {
  name: 'guess',
  pattern: 'guess',
  aliases: ['number'],
  desc: 'Number guess mini-app',
  category: 'games',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, HTML, 'Guess Number');
  },
};
