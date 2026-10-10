const { sendHtmlApp } = require('../lib/htmlTransport');

/** Smartphone home launcher — swipe pages, clock widget, real offline apps */
function buildPhoneHtml() {
  // Keep payload tight for WA WebView limits
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;height:100%;font-family:-apple-system,system-ui,sans-serif;background:#0a0a12;color:#f8fafc;overflow:hidden}
.phone{max-width:420px;margin:0 auto;height:100%;display:flex;flex-direction:column;position:relative;background:linear-gradient(165deg,#1e1b4b 0%,#0f172a 45%,#020617 100%)}
.sb{display:flex;justify-content:space-between;padding:8px 14px 4px;font-size:11px;font-weight:700;opacity:.9}
.home{flex:1;display:flex;flex-direction:column;min-height:0}
.widget{margin:6px 12px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(8px)}
.clk{font-size:34px;font-weight:200;letter-spacing:1px;line-height:1}
.clk-sub{font-size:11px;color:#94a3b8;margin-top:2px}
.pages{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}
.pages::-webkit-scrollbar{display:none}
.page{min-width:100%;scroll-snap-align:start;padding:8px 12px 4px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px 6px;align-content:start}
.ic{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.ic .b{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.ic .b:active{transform:scale(.92)}
.ic span{font-size:9px;color:#e2e8f0;text-align:center;max-width:64px;line-height:1.15;font-weight:600}
.dots{display:flex;justify-content:center;gap:5px;padding:6px}
.dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.25)}
.dots i.on{background:#fff;width:14px;border-radius:4px}
.dock{margin:4px 12px 12px;padding:10px 8px;border-radius:22px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-around}
.app{position:absolute;inset:0;background:#0f172a;z-index:50;display:none;flex-direction:column}
.app.on{display:flex}
.ah{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#1e293b;border-bottom:1px solid rgba(255,255,255,.06)}
.ah button{background:none;border:0;color:#38bdf8;font-size:15px;font-weight:700;padding:4px 6px}
.ah h3{margin:0;font-size:14px;flex:1}
.ab{flex:1;overflow:auto;padding:12px;font-size:13px}
input,textarea,select{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#1e293b;color:#f1f5f9;margin:4px 0 8px;font-size:14px}
button.p{width:100%;padding:11px;border:0;border-radius:12px;background:#3b82f6;color:#fff;font-weight:700;font-size:13px;margin-top:4px}
button.p:active{filter:brightness(1.15)}
.out{background:#020617;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;margin-top:8px;word-break:break-word;min-height:36px;white-space:pre-wrap}
.row{display:flex;gap:6px}.row>*{flex:1}
.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.pad button{padding:14px 0;border:0;border-radius:12px;background:#1e293b;color:#f8fafc;font-size:16px;font-weight:600}
.pad button.op{background:#334155;color:#fbbf24}
.pad button.eq{background:#3b82f6}
.disp{background:#020617;border-radius:12px;padding:14px;font-size:26px;text-align:right;margin-bottom:8px;min-height:48px;word-break:break-all}
.todo li{list-style:none;padding:8px 10px;background:#1e293b;border-radius:10px;margin:4px 0;display:flex;justify-content:space-between;align-items:center}
.todo li.done{opacity:.45;text-decoration:line-through}
</style></head><body><div class="phone">
<div class="sb"><span id="sbTime">00:00</span><span>MiniOS · 5G</span></div>
<div class="home" id="home">
  <div class="widget"><div class="clk" id="bigTime">00:00</div><div class="clk-sub" id="bigDate">—</div></div>
  <div class="pages" id="pages">
    <div class="page" id="p0"></div>
    <div class="page" id="p1"></div>
    <div class="page" id="p2"></div>
  </div>
  <div class="dots"><i class="on" id="d0"></i><i id="d1"></i><i id="d2"></i></div>
  <div class="dock" id="dock"></div>
</div>
<div class="app" id="appView"><div class="ah"><button id="btnBack">‹ Home</button><h3 id="appTitle">App</h3></div><div class="ab" id="appBody"></div></div>
</div>
<script>
const APPS=[
{id:'calc',n:'Calc',e:'🔢',c:'#0ea5e9',p:0},
{id:'notes',n:'Notes',e:'📝',c:'#eab308',p:0},
{id:'todo',n:'Tasks',e:'✅',c:'#22c55e',p:0},
{id:'timer',n:'Timer',e:'⏱️',c:'#f97316',p:0},
{id:'stopw',n:'Stopwatch',e:'⏲️',c:'#a855f7',p:0},
{id:'dice',n:'Dice',e:'🎲',c:'#ef4444',p:0},
{id:'coin',n:'Coin',e:'🪙',c:'#f59e0b',p:0},
{id:'rps',n:'RPS',e:'✊',c:'#6366f1',p:0},
{id:'bmi',n:'BMI',e:'⚖️',c:'#14b8a6',p:1},
{id:'age',n:'Age',e:'🎂',c:'#ec4899',p:1},
{id:'unit',n:'Units',e:'📐',c:'#06b6d4',p:1},
{id:'fx',n:'FX',e:'💱',c:'#84cc16',p:1},
{id:'emi',n:'EMI',e:'🏦',c:'#8b5cf6',p:1},
{id:'pass',n:'Password',e:'🔐',c:'#64748b',p:1},
{id:'rand',n:'Random',e:'🎯',c:'#f43f5e',p:1},
{id:'word',n:'Words',e:'📄',c:'#3b82f6',p:1},
{id:'b64',n:'Base64',e:'🧩',c:'#10b981',p:2},
{id:'morse',n:'Morse',e:'📡',c:'#0ea5e9',p:2},
{id:'color',n:'Colors',e:'🎨',c:'#e11d48',p:2},
{id:'cal',n:'Calendar',e:'📅',c:'#2563eb',p:2},
{id:'world',n:'Clocks',e:'🌍',c:'#059669',p:2},
{id:'flash',n:'Flash',e:'💡',c:'#fbbf24',p:2},
{id:'mirror',n:'Mirror',e:'🪞',c:'#94a3b8',p:2},
{id:'about',n:'About',e:'ℹ️',c:'#475569',p:2}
];
const DOCK=['calc','notes','todo','timer'];
function tick(){
  const d=new Date();
  const t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  sbTime.textContent=t;bigTime.textContent=t;
  bigDate.textContent=d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
}
setInterval(tick,1000);tick();
function icon(a){
  const el=document.createElement('div');el.className='ic';
  el.innerHTML='<div class="b" style="background:'+a.c+'">'+a.e+'</div><span>'+a.n+'</span>';
  el.onclick=()=>openApp(a.id);return el;
}
APPS.forEach(a=>{const pg=document.getElementById('p'+a.p);if(pg)pg.appendChild(icon(a))});
DOCK.forEach(id=>{const a=APPS.find(x=>x.id===id);if(a)dock.appendChild(icon(a))});
const pages=document.getElementById('pages');
pages.onscroll=()=>{const i=Math.round(pages.scrollLeft/pages.clientWidth);[0,1,2].forEach(n=>{document.getElementById('d'+n).className=n===i?'on':''})};

function openApp(id){
  const a=APPS.find(x=>x.id===id);if(!a)return;
  appTitle.textContent=a.n;appBody.innerHTML='';appView.classList.add('on');
  const ui=UI[id];if(ui)ui(appBody);
}
btnBack.onclick=()=>appView.classList.remove('on');

const UI={
calc(el){
  el.innerHTML='<div class="disp" id="cd">0</div><div class="pad" id="cp"></div>';
  let cur='0',op=null,prev=null;
  const keys=['C','←','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','=','='];
  const pad=document.getElementById('cp');
  ['C','←','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','±','='].forEach(k=>{
    const b=document.createElement('button');b.textContent=k;
    if('÷×−+%'.includes(k))b.className='op';if(k==='=')b.className='eq';
    b.onclick=()=>{
      if(k==='C'){cur='0';op=null;prev=null}
      else if(k==='←'){cur=cur.length>1?cur.slice(0,-1):'0'}
      else if(k==='±'){cur=String(-(+cur))}
      else if(k==='%'){cur=String(+cur/100)}
      else if('÷×−+'.includes(k)){prev=+cur;op=k;cur='0'}
      else if(k==='='){
        const n=+cur;if(op==='+')cur=String(prev+n);if(op==='−')cur=String(prev-n);
        if(op==='×')cur=String(prev*n);if(op==='÷')cur=String(n?prev/n:'Err');op=null
      } else {
        if(k==='.'&&cur.includes('.'))return;
        cur=(cur==='0'&&k!=='.')?k:cur+k;
      }
      cd.textContent=cur;
    };
    pad.appendChild(b);
  });
},
notes(el){
  const k='mb_notes';el.innerHTML='<textarea id="nt" rows="12" placeholder="Type notes…">'+(localStorage.getItem(k)||'')+'</textarea><button class="p" id="sv">Save</button><div class="out" id="o"></div>';
  sv.onclick=()=>{localStorage.setItem(k,nt.value);o.textContent='Saved locally in this mini-app'};
},
todo(el){
  const k='mb_todo';let items=JSON.parse(localStorage.getItem(k)||'[]');
  function ren(){
    el.innerHTML='<div class="row"><input id="ti" placeholder="New task…"/><button class="p" id="ad" style="flex:0 0 70px">Add</button></div><ul class="todo" id="ul"></ul>';
    items.forEach((it,i)=>{
      const li=document.createElement('li');if(it.d)li.className='done';
      li.innerHTML='<span>'+it.t+'</span><span>✕</span>';
      li.querySelector('span').onclick=()=>{it.d=!it.d;save();ren()};
      li.querySelectorAll('span')[1].onclick=()=>{items.splice(i,1);save();ren()};
      ul.appendChild(li);
    });
    ad.onclick=()=>{if(!ti.value.trim())return;items.push({t:ti.value.trim(),d:0});save();ren()};
  }
  function save(){localStorage.setItem(k,JSON.stringify(items))}
  ren();
},
timer(el){
  el.innerHTML='<label>Minutes</label><input id="m" type="number" value="5"/><button class="p" id="st">Start</button><div class="out" id="o" style="font-size:28px;text-align:center">05:00</div>';
  let t=null,left=300;
  st.onclick=()=>{
    if(t){clearInterval(t);t=null;st.textContent='Start';return}
    left=Math.max(1,+m.value||5)*60;st.textContent='Stop';
    t=setInterval(()=>{left--;const mm=String(Math.floor(left/60)).padStart(2,'0'),ss=String(left%60).padStart(2,'0');o.textContent=mm+':'+ss;if(left<=0){clearInterval(t);t=null;o.textContent='Done ⏰';st.textContent='Start'}},1000);
  };
},
stopw(el){
  el.innerHTML='<div class="out" id="o" style="font-size:28px;text-align:center">00:00.0</div><div class="row"><button class="p" id="st">Start</button><button class="p" id="rs" style="background:#475569">Reset</button></div>';
  let t=null,ms=0;
  st.onclick=()=>{if(t){clearInterval(t);t=null;st.textContent='Start';return}st.textContent='Stop';const t0=Date.now()-ms;t=setInterval(()=>{ms=Date.now()-t0;const s=Math.floor(ms/1000),m=Math.floor(s/60);o.textContent=String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+'.'+Math.floor((ms%1000)/100)},100)};
  rs.onclick=()=>{clearInterval(t);t=null;ms=0;o.textContent='00:00.0';st.textContent='Start'};
},
dice(el){el.innerHTML='<div class="out" id="o" style="font-size:48px;text-align:center">🎲</div><button class="p" id="g">Roll</button>';g.onclick=()=>o.textContent='🎲 '+ (1+Math.floor(Math.random()*6))},
coin(el){el.innerHTML='<div class="out" id="o" style="font-size:40px;text-align:center">🪙</div><button class="p" id="g">Flip</button>';g.onclick=()=>o.textContent=Math.random()<.5?'Heads':'Tails'},
rps(el){
  el.innerHTML='<div class="row"><button class="p" data-m="rock">✊</button><button class="p" data-m="paper">✋</button><button class="p" data-m="scissors">✌️</button></div><div class="out" id="o"></div>';
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{
    const you=b.dataset.m,ai=['rock','paper','scissors'][Math.floor(Math.random()*3)];
    let r='Draw';if(you===ai)r='Draw';else if((you==='rock'&&ai==='scissors')||(you==='paper'&&ai==='rock')||(you==='scissors'&&ai==='paper'))r='You win';else r='You lose';
    o.textContent='You: '+you+'\\nBot: '+ai+'\\n'+r;
  });
},
bmi(el){
  el.innerHTML='<label>Height (cm)</label><input id="h" type="number" value="170"/><label>Weight (kg)</label><input id="w" type="number" value="65"/><button class="p" id="g">Calculate</button><div class="out" id="o"></div>';
  g.onclick=()=>{const m=+h.value/100,b=(+w.value)/(m*m);let c='Normal';if(b<18.5)c='Underweight';else if(b>=25&&b<30)c='Overweight';else if(b>=30)c='Obese';o.textContent='BMI '+b.toFixed(1)+'\\n'+c};
},
age(el){
  el.innerHTML='<label>Birth date</label><input id="d" type="date"/><button class="p" id="g">Age</button><div class="out" id="o"></div>';
  g.onclick=()=>{if(!d.value)return;const b=new Date(d.value),n=new Date();let y=n.getFullYear()-b.getFullYear(),m=n.getMonth()-b.getMonth(),dd=n.getDate()-b.getDate();if(dd<0){m--;dd+=30}if(m<0){y--;m+=12}o.textContent=y+' years, '+m+' months, '+dd+' days'};
},
unit(el){
  el.innerHTML='<label>Value</label><input id="v" type="number" value="1"/><label>Convert</label><select id="t"><option value="km_mi">km → miles</option><option value="mi_km">miles → km</option><option value="kg_lb">kg → lb</option><option value="lb_kg">lb → kg</option><option value="c_f">°C → °F</option><option value="f_c">°F → °C</option></select><button class="p" id="g">Convert</button><div class="out" id="o"></div>';
  const f={km_mi:x=>x*0.621371,mi_km:x=>x*1.60934,kg_lb:x=>x*2.20462,lb_kg:x=>x/2.20462,c_f:x=>x*9/5+32,f_c:x=>(x-32)*5/9};
  g.onclick=()=>o.textContent=f[t.value](+v.value).toFixed(4);
},
fx(el){
  el.innerHTML='<label>Amount PKR</label><input id="a" type="number" value="1000"/><button class="p" id="g">Approx convert</button><div class="out" id="o"></div><p style="color:#64748b;font-size:11px">Offline approx rates — not live market.</p>';
  g.onclick=()=>{const p=+a.value;o.textContent='USD ~ '+(p/278).toFixed(2)+'\\nEUR ~ '+(p/300).toFixed(2)+'\\nGBP ~ '+(p/350).toFixed(2)+'\\nAED ~ '+(p/75.7).toFixed(2)};
},
emi(el){
  el.innerHTML='<label>Loan</label><input id="p" type="number" value="500000"/><label>Annual % interest</label><input id="r" type="number" value="14"/><label>Months</label><input id="n" type="number" value="36"/><button class="p" id="g">EMI</button><div class="out" id="o"></div>';
  g.onclick=()=>{const P=+p.value,R=(+r.value)/12/100,N=+n.value;const e=P*R*Math.pow(1+R,N)/(Math.pow(1+R,N)-1);o.textContent='Monthly EMI: '+e.toFixed(0)+'\\nTotal: '+(e*N).toFixed(0)};
},
pass(el){
  el.innerHTML='<label>Length</label><input id="l" type="number" value="16"/><button class="p" id="g">Generate</button><div class="out" id="o"></div>';
  g.onclick=()=>{const c='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%',n=+l.value||16;let s='';for(let i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];o.textContent=s};
},
rand(el){
  el.innerHTML='<label>Min</label><input id="a" type="number" value="1"/><label>Max</label><input id="b" type="number" value="100"/><button class="p" id="g">Pick</button><div class="out" id="o" style="font-size:28px;text-align:center"></div>';
  g.onclick=()=>{const lo=+a.value,hi=+b.value;o.textContent=String(Math.floor(Math.random()*(hi-lo+1))+lo)};
},
word(el){
  el.innerHTML='<textarea id="t" rows="8" placeholder="Paste text…"></textarea><button class="p" id="g">Count</button><div class="out" id="o"></div>';
  g.onclick=()=>{const s=t.value,w=s.trim()?s.trim().split(/\\s+/).length:0;o.textContent='Chars: '+s.length+'\\nWords: '+w+'\\nLines: '+(s?s.split('\\n').length:0)};
},
b64(el){
  el.innerHTML='<textarea id="t" rows="4"></textarea><div class="row"><button class="p" id="e">Encode</button><button class="p" id="d">Decode</button></div><div class="out" id="o"></div>';
  e.onclick=()=>{try{o.textContent=btoa(unescape(encodeURIComponent(t.value)))}catch(err){o.textContent='Error'}};
  d.onclick=()=>{try{o.textContent=decodeURIComponent(escape(atob(t.value)))}catch(err){o.textContent='Invalid Base64'}};
},
morse(el){
  const M={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
  el.innerHTML='<input id="t" placeholder="Hello"/><button class="p" id="g">To Morse</button><div class="out" id="o"></div>';
  g.onclick=()=>o.textContent=t.value.toUpperCase().split('').map(c=>c===' '?' / ': (M[c]||c)).join(' ');
},
color(el){
  el.innerHTML='<input id="c" type="color" value="#3b82f6" style="height:48px;padding:0"/><div class="out" id="o"></div>';
  function up(){o.textContent=c.value+'\\nRGB preview active';el.style.background=c.value+'22'}
  c.oninput=up;up();
},
cal(el){
  const n=new Date(),y=n.getFullYear(),m=n.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let h='<div style="font-weight:700;margin-bottom:8px">'+n.toLocaleString([],{month:'long',year:'numeric'})+'</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;font-size:11px">';
  'SMTWTFS'.split('').forEach(d=>h+='<div style="color:#64748b">'+d+'</div>');
  for(let i=0;i<first;i++)h+='<div></div>';
  for(let d=1;d<=days;d++){const on=d===n.getDate()?'background:#3b82f6;border-radius:8px':'';h+='<div style="padding:6px 0;'+on+'">'+d+'</div>'}
  h+='</div>';el.innerHTML=h;
},
world(el){
  const zs=[['Pakistan','Asia/Karachi'],['London','Europe/London'],['New York','America/New_York'],['Dubai','Asia/Dubai'],['Tokyo','Asia/Tokyo']];
  function ren(){el.innerHTML=zs.map(([n,z])=>'<div style="padding:8px;background:#1e293b;border-radius:10px;margin:4px 0;display:flex;justify-content:space-between"><span>'+n+'</span><b>'+new Date().toLocaleTimeString([],{timeZone:z,hour:'2-digit',minute:'2-digit'})+'</b></div>').join('')}
  ren();setInterval(ren,1000);
},
flash(el){
  let on=0;el.innerHTML='<button class="p" id="g">Toggle Flash</button>';
  g.onclick=()=>{on=!on;document.body.style.background=on?'#fff':'#0a0a12';document.body.style.color=on?'#000':'#f8fafc';g.textContent=on?'Turn off':'Toggle Flash'};
},
mirror(el){el.innerHTML='<div class="out" style="text-align:center;padding:40px;font-size:18px;color:#94a3b8">Camera is not available inside WhatsApp mini-apps.\\nUse your phone camera app.</div>'},
about(el){el.innerHTML='<div class="out"><b>MiniOS Phone</b>\\nIn-chat smartphone launcher\\nOffline apps · no internet needed\\nSwipe pages · open icons\\n\\nMiniBot HTML suite</div>'}
};
</script></body></html>`;
}

module.exports = {
  name: 'phone',
  pattern: 'phone',
  aliases: ['mobile', 'launcher', 'os', 'home'],
  desc: 'Smartphone launcher with apps (calculator, notes, tools, games)',
  category: 'apps',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, buildPhoneHtml(), 'Phone');
  },
};
