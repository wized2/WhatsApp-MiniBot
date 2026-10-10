const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

function quizHtml(topic, questions) {
  return shell(topic,
`.opt{display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border:0;border-radius:12px;background:#1a2430;color:#fff}`,
`<div id="q" style="margin:8px 0"></div><div id="opts"></div><p id="m" class="score"></p>
<script>
const QS=${JSON.stringify(questions)};let i,score;
function show(){
  if(!window.__gameRunning)return;
  if(i>=QS.length){showEnd('Done!','Score '+score+'/'+QS.length);return}
  const cur=QS[i];document.getElementById('q').textContent=(i+1)+'. '+cur.q;
  document.getElementById('m').textContent=(i+1)+'/'+QS.length;
  const box=document.getElementById('opts');box.innerHTML='';
  cur.a.forEach((label,idx)=>{const b=document.createElement('button');b.className='opt';b.textContent=label;
    b.onclick=()=>{if(idx===cur.c)score++;i++;setTimeout(show,200)};box.appendChild(b)});
}
window.onGameStart=function(){i=0;score=0;show()};
<\/script>`,
{ hint: 'Answer all questions' });
}

const BANKS = {
  js: { title: 'JS Quiz', q: [
    { q: 'typeof null?', a: ['"null"', '"object"', '"undefined"'], c: 1 },
    { q: 'Add to end of array?', a: ['push', 'pop', 'shift'], c: 0 },
    { q: 'const can be reassigned?', a: ['Yes', 'No', 'Only in loops'], c: 1 },
  ]},
  wa: { title: 'WhatsApp Quiz', q: [
    { q: 'Baileys uses?', a: ['Cloud API only', 'WhatsApp Web MD', 'SMS'], c: 1 },
    { q: 'In-chat HTML is?', a: ['Raw file', 'Rich HTML primitive', 'PDF'], c: 1 },
  ]},
};

module.exports = {
  name: 'quiz',
  pattern: 'quiz',
  aliases: ['q'],
  desc: 'Quiz mini-app',
  category: 'mini-apps',
  async handler({ sock, jid, arg, args }) {
    const key = ((args && args[0]) || arg || 'js').toString().trim().toLowerCase() || 'js';
    const bank = BANKS[key] || BANKS.js;
    await sendHtmlApp(sock, jid, quizHtml(bank.title, bank.q), bank.title);
  },
};
