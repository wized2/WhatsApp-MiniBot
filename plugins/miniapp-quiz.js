const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

function quizHtml(topic, questions) {
  return shell(topic, `.opt{display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border:0;border-radius:12px;background:#1f2c34;color:#fff}`,
`<div id="q" style="margin:8px 0"></div><div id="opts"></div><div id="m" style="font-size:12px;opacity:.75"></div>
<script>
const QS=${JSON.stringify(questions)};let i=0,score=0;
function show(){
  if(i>=QS.length){document.getElementById('q').textContent='Score '+score+'/'+QS.length;document.getElementById('opts').innerHTML='';return}
  const cur=QS[i];document.getElementById('q').textContent=(i+1)+'. '+cur.q;document.getElementById('m').textContent=(i+1)+'/'+QS.length;
  const box=document.getElementById('opts');box.innerHTML='';
  cur.a.forEach((label,idx)=>{const b=document.createElement('button');b.className='opt';b.textContent=label;
    b.onclick=()=>{if(idx===cur.c)score++;i++;setTimeout(show,200)};box.appendChild(b)});
}
show();
<\/script>`);
}

const BANKS = {
  js: { title: 'JS Quiz', q: [
    { q: 'typeof null?', a: ['"null"', '"object"', '"undefined"'], c: 1 },
    { q: 'Add to end of array?', a: ['push', 'pop', 'shift'], c: 0 },
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
  desc: 'Quiz mini-app (.quiz js|wa)',
  category: 'mini-apps',
  async handler({ sock, jid, arg, args }) {
    const key = ((args && args[0]) || arg || 'js').toString().trim().toLowerCase() || 'js';
    const bank = BANKS[key] || BANKS.js;
    await sendHtmlApp(sock, jid, quizHtml(bank.title, bank.q), bank.title);
  },
};
