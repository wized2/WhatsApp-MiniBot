const { sendHtmlApp } = require('../lib/htmlTransport');

function quizHtml(topic, questions) {
  const data = JSON.stringify(questions);
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation}
body{margin:0;background:#0b141a;color:#e9edef;font-family:system-ui,sans-serif}
.wrap{padding:12px;max-width:400px;margin:0 auto}
h3{margin:0 0 8px;font-size:16px}
.q{font-size:14px;margin:10px 0;line-height:1.4}
.opt{display:block;width:100%;text-align:left;margin:6px 0;padding:10px 12px;border:0;border-radius:12px;background:#1f2c34;color:#e9edef;font-size:13px}
.opt:active{opacity:.85}
.opt.ok{background:#14532d}
.opt.bad{background:#7f1d1d}
.meta{font-size:12px;opacity:.75;margin-top:8px}
</style></head>
<body><div class="wrap">
<h3 id="t">Quiz</h3>
<div class="q" id="q"></div>
<div id="opts"></div>
<div class="meta" id="m"></div>
<script>
const QS=${data};
let i=0,score=0;
document.getElementById('t').textContent=${JSON.stringify(topic)};
function show(){
  if(i>=QS.length){
    document.getElementById('q').textContent='Done! Score '+score+'/'+QS.length;
    document.getElementById('opts').innerHTML='';
    document.getElementById('m').textContent='Tap command again for a new quiz';
    return;
  }
  const cur=QS[i];
  document.getElementById('q').textContent=(i+1)+'. '+cur.q;
  document.getElementById('m').textContent='Question '+(i+1)+'/'+QS.length;
  const box=document.getElementById('opts');
  box.innerHTML='';
  cur.a.forEach((label,idx)=>{
    const b=document.createElement('button');
    b.className='opt';
    b.textContent=label;
    b.onclick=()=>{
      if(idx===cur.c){score++;b.classList.add('ok')}else{b.classList.add('bad')}
      setTimeout(()=>{i++;show()},350);
    };
    box.appendChild(b);
  });
}
show();
<\/script></div></body></html>`;
}

const BANKS = {
  js: {
    title: 'JavaScript Quiz',
    questions: [
      { q: 'typeof null ?', a: ['"null"', '"object"', '"undefined"', '"number"'], c: 1 },
      { q: 'Array method to add at end?', a: ['push', 'pop', 'shift', 'slice'], c: 0 },
      { q: 'const cannot be…', a: ['reassigned', 'used in functions', 'an object', 'exported'], c: 0 },
    ],
  },
  wa: {
    title: 'WhatsApp Quiz',
    questions: [
      { q: 'Baileys connects via…', a: ['Official Cloud API only', 'WhatsApp Web multi-device', 'SMS gateway', 'Email'], c: 1 },
      { q: 'Pairing code links a…', a: ['Browser session', 'Phone number to MD session', 'SIM card', 'Email'], c: 1 },
      { q: 'In-chat HTML games use…', a: ['Raw .html files', 'External browser only', 'Rich HTML primitive', 'PDF'], c: 2 },
    ],
  },
};

module.exports = {
  name: 'quiz',
  pattern: 'quiz',
  aliases: ['q'],
  desc: 'In-chat quiz mini-app (.quiz js | .quiz wa)',
  category: 'mini-apps',
  async handler({ sock, jid, args, reply }) {
    const key = (args[0] || 'js').toLowerCase();
    const bank = BANKS[key] || BANKS.js;
    const html = quizHtml(bank.title, bank.questions);
    await sendHtmlApp(sock, jid, html, bank.title);
  },
};
