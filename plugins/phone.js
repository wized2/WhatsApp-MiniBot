const { sendHtmlApp } = require('../lib/htmlTransport');

function buildPhoneHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;margin:0;padding:0}
html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#000;color:#fff;overflow:hidden}
.phone{max-width:420px;margin:0 auto;height:100%;display:flex;flex-direction:column;position:relative;
background:linear-gradient(160deg,#312e81 0%,#1e3a5f 35%,#0f172a 70%,#020617 100%)}
.sb{display:flex;justify-content:space-between;align-items:center;padding:10px 16px 2px;font-size:12px;font-weight:700}
.sb .r{display:flex;gap:6px;align-items:center;font-size:11px;opacity:.9}
.batt{width:22px;height:10px;border:1.5px solid #fff;border-radius:3px;position:relative}
.batt:after{content:'';position:absolute;right:-3px;top:2px;width:2px;height:4px;background:#fff;border-radius:0 1px 1px 0}
.batt i{display:block;height:100%;width:70%;background:#4ade80;border-radius:1px}
.home{flex:1;display:flex;flex-direction:column;min-height:0;padding-bottom:4px}
.widget{margin:8px 14px;padding:14px 16px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px)}
.clk{font-size:42px;font-weight:200;letter-spacing:1px;line-height:1}
.clk-sub{font-size:12px;color:#cbd5e1;margin-top:4px}
.wrow{display:flex;gap:8px;margin:0 14px 6px}
.w2{flex:1;padding:10px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);font-size:11px}
.w2 b{display:block;font-size:16px;font-weight:700;margin-top:2px}
.search{margin:0 14px 8px;padding:8px 12px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);font-size:12px;color:#94a3b8}
.pages{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.pages::-webkit-scrollbar{display:none}
.page{min-width:100%;scroll-snap-align:start;padding:4px 10px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px 4px;align-content:start}
.ic{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer}
.ic .b{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 6px 16px rgba(0,0,0,.3)}
.ic .b:active{transform:scale(.9)}
.ic span{font-size:9px;font-weight:600;text-align:center;max-width:70px;line-height:1.15;color:#f1f5f9}
.dots{display:flex;justify-content:center;gap:5px;padding:6px}
.dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.25);transition:.2s}
.dots i.on{background:#fff;width:16px;border-radius:4px}
.dock{margin:2px 12px 14px;padding:12px 10px;border-radius:24px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-around;backdrop-filter:blur(16px)}
.app{position:absolute;inset:0;background:#0b1220;z-index:50;display:none;flex-direction:column}
.app.on{display:flex;animation:up .18s ease}
@keyframes up{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
.ah{display:flex;align-items:center;gap:6px;padding:12px;background:#111827;border-bottom:1px solid rgba(255,255,255,.06)}
.ah button{background:none;border:0;color:#38bdf8;font-size:15px;font-weight:700;padding:4px 8px}
.ah h3{margin:0;font-size:14px;flex:1}
.ab{flex:1;overflow:auto;padding:12px;font-size:13px}
input,textarea,select{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#1e293b;color:#f1f5f9;margin:4px 0 8px;font-size:14px}
button.p{width:100%;padding:11px;border:0;border-radius:12px;background:#3b82f6;color:#fff;font-weight:700;font-size:13px;margin-top:4px}
button.p.sec{background:#334155}
button.p:active{filter:brightness(1.12)}
.out{background:#020617;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;margin-top:8px;word-break:break-word;min-height:36px;white-space:pre-wrap}
.row{display:flex;gap:6px}.row>*{flex:1}
.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.pad button{padding:14px 0;border:0;border-radius:12px;background:#1e293b;color:#f8fafc;font-size:16px;font-weight:600}
.pad button.op{background:#334155;color:#fbbf24}.pad button.eq{background:#3b82f6}
.disp{background:#020617;border-radius:12px;padding:14px;font-size:26px;text-align:right;margin-bottom:8px;min-height:48px;word-break:break-all}
.todo li{list-style:none;padding:8px 10px;background:#1e293b;border-radius:10px;margin:4px 0;display:flex;justify-content:space-between;align-items:center}
.todo li.done{opacity:.45;text-decoration:line-through}
.chip{display:inline-block;padding:6px 10px;border-radius:20px;background:#1e293b;margin:3px;font-size:12px;cursor:pointer}
</style></head><body><div class="phone">
<div class="sb"><span id="sbTime">00:00</span><div class="r"><span>5G</span><div class="batt"><i></i></div></div></div>
<div class="home" id="home">
  <div class="widget"><div class="clk" id="bigTime">00:00</div><div class="clk-sub" id="bigDate">—</div></div>
  <div class="wrow"><div class="w2">Steps today<b id="wSteps">—</b></div><div class="w2">Focus timer<b id="wFocus">25:00</b></div></div>
  <div class="search" id="searchHint">Search apps… (swipe pages)</div>
  <div class="pages" id="pages">
    <div class="page" id="p0"></div><div class="page" id="p1"></div>
    <div class="page" id="p2"></div><div class="page" id="p3"></div>
  </div>
  <div class="dots"><i class="on" id="d0"></i><i id="d1"></i><i id="d2"></i><i id="d3"></i></div>
  <div class="dock" id="dock"></div>
</div>
<div class="app" id="appView"><div class="ah"><button id="btnBack">‹ Home</button><h3 id="appTitle">App</h3></div><div class="ab" id="appBody"></div></div>
</div>
<script>
const APPS=[
{id:'calc',n:'Calc',e:'🔢',c:'#0ea5e9',p:0},{id:'notes',n:'Notes',e:'📝',c:'#eab308',p:0},
{id:'todo',n:'Tasks',e:'✅',c:'#22c55e',p:0},{id:'timer',n:'Timer',e:'⏱️',c:'#f97316',p:0},
{id:'stopw',n:'Stopwatch',e:'⏲️',c:'#a855f7',p:0},{id:'focus',n:'Focus',e:'🧠',c:'#8b5cf6',p:0},
{id:'alarm',n:'Alarm',e:'⏰',c:'#ef4444',p:0},{id:'cal',n:'Calendar',e:'📅',c:'#2563eb',p:0},
{id:'dice',n:'Dice',e:'🎲',c:'#dc2626',p:1},{id:'coin',n:'Coin',e:'🪙',c:'#f59e0b',p:1},
{id:'rps',n:'RPS',e:'✊',c:'#6366f1',p:1},{id:'luck',n:'Lucky',e:'🍀',c:'#16a34a',p:1},
{id:'8ball',n:'8-Ball',e:'🎱',c:'#1e293b',p:1},{id:'spin',n:'Spinner',e:'🎡',c:'#db2777',p:1},
{id:'memory',n:'Memory',e:'🃏',c:'#7c3aed',p:1},{id:'quiz',n:'Quiz',e:'❓',c:'#0891b2',p:1},
{id:'bmi',n:'BMI',e:'⚖️',c:'#14b8a6',p:2},{id:'age',n:'Age',e:'🎂',c:'#ec4899',p:2},
{id:'unit',n:'Units',e:'📐',c:'#06b6d4',p:2},{id:'fx',n:'FX',e:'💱',c:'#84cc16',p:2},
{id:'emi',n:'EMI',e:'🏦',c:'#8b5cf6',p:2},{id:'pct',n:'Percent',e:'%',c:'#64748b',p:2},
{id:'fuel',n:'Fuel',e:'⛽',c:'#ea580c',p:2},{id:'gpa',n:'GPA',e:'🎓',c:'#0284c7',p:2},
{id:'pass',n:'Password',e:'🔐',c:'#475569',p:3},{id:'rand',n:'Random',e:'🎯',c:'#f43f5e',p:3},
{id:'word',n:'Words',e:'📄',c:'#3b82f6',p:3},{id:'b64',n:'Base64',e:'🧩',c:'#10b981',p:3},
{id:'morse',n:'Morse',e:'📡',c:'#0ea5e9',p:3},{id:'roman',n:'Roman',e:'🏛️',c:'#a16207',p:3},
{id:'color',n:'Colors',e:'🎨',c:'#e11d48',p:3},{id:'world',n:'Clocks',e:'🌍',c:'#059669',p:3},
{id:'flash',n:'Flash',e:'💡',c:'#fbbf24',p:3},{id:'counter',n:'Counter',e:'🔢',c:'#6366f1',p:3},
{id:'habit',n:'Habits',e:'🔥',c:'#f97316',p:3},{id:'about',n:'About',e:'ℹ️',c:'#334155',p:3}
];
const DOCK=['calc','notes','todo','focus'];
function tick(){const d=new Date();const t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
sbTime.textContent=t;bigTime.textContent=t;
bigDate.textContent=d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
wSteps.textContent=(3200+Math.floor(d.getHours()*180+d.getMinutes()*2)).toLocaleString()}
setInterval(tick,1000);tick();
function icon(a){const el=document.createElement('div');el.className='ic';
el.innerHTML='<div class="b" style="background:'+a.c+'">'+a.e+'</div><span>'+a.n+'</span>';
el.onclick=()=>openApp(a.id);return el}
APPS.forEach(a=>{const pg=document.getElementById('p'+a.p);if(pg)pg.appendChild(icon(a))});
DOCK.forEach(id=>{const a=APPS.find(x=>x.id===id);if(a)dock.appendChild(icon(a))});
const pages=document.getElementById('pages');
pages.onscroll=()=>{const i=Math.round(pages.scrollLeft/pages.clientWidth);[0,1,2,3].forEach(n=>{const d=document.getElementById('d'+n);if(d)d.className=n===i?'on':''})};
function openApp(id){const a=APPS.find(x=>x.id===id);if(!a)return;appTitle.textContent=a.n;appBody.innerHTML='';appView.classList.add('on');const ui=UI[id];if(ui)ui(appBody)}
btnBack.onclick=()=>appView.classList.remove('on');
function box(el,html,bind){el.innerHTML=html;if(bind)bind()}
const UI={
calc(el){el.innerHTML='<div class="disp" id="cd">0</div><div class="pad" id="cp"></div>';let cur='0',op=null,prev=null;
['C','←','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','±','='].forEach(k=>{const b=document.createElement('button');b.textContent=k;
if('÷×−+%'.includes(k))b.className='op';if(k==='=')b.className='eq';
b.onclick=()=>{if(k==='C'){cur='0';op=null;prev=null}else if(k==='←'){cur=cur.length>1?cur.slice(0,-1):'0'}
else if(k==='±'){cur=String(-(+cur))}else if(k==='%'){cur=String(+cur/100)}
else if('÷×−+'.includes(k)){prev=+cur;op=k;cur='0'}else if(k==='='){const n=+cur;if(op==='+')cur=String(prev+n);if(op==='−')cur=String(prev-n);if(op==='×')cur=String(prev*n);if(op==='÷')cur=String(n?prev/n:'Err');op=null}
else{if(k==='.'&&cur.includes('.'))return;cur=(cur==='0'&&k!=='.')?k:cur+k}cd.textContent=cur};
cp.appendChild(b)})},
notes(el){const k='mb_notes';el.innerHTML='<textarea id="nt" rows="12" placeholder="Notes…">'+(localStorage.getItem(k)||'')+'</textarea><button class="p" id="sv">Save</button><div class="out" id="o"></div>';
sv.onclick=()=>{localStorage.setItem(k,nt.value);o.textContent='Saved'}},
todo(el){const k='mb_todo';let items=JSON.parse(localStorage.getItem(k)||'[]');
function ren(){el.innerHTML='<div class="row"><input id="ti" placeholder="New task…"/><button class="p" id="ad" style="flex:0 0 70px">Add</button></div><ul class="todo" id="ul"></ul>';
items.forEach((it,i)=>{const li=document.createElement('li');if(it.d)li.className='done';li.innerHTML='<span>'+it.t+'</span><span>✕</span>';
li.children[0].onclick=()=>{it.d=!it.d;save();ren()};li.children[1].onclick=()=>{items.splice(i,1);save();ren()};ul.appendChild(li)});
ad.onclick=()=>{if(!ti.value.trim())return;items.push({t:ti.value.trim(),d:0});save();ren()}}
function save(){localStorage.setItem(k,JSON.stringify(items))}ren()},
timer(el){el.innerHTML='<label>Minutes</label><input id="m" type="number" value="5"/><button class="p" id="st">Start</button><div class="out" id="o" style="font-size:28px;text-align:center">05:00</div>';
let t=null,left=300;st.onclick=()=>{if(t){clearInterval(t);t=null;st.textContent='Start';return}left=Math.max(1,+m.value||5)*60;st.textContent='Stop';
t=setInterval(()=>{left--;const mm=String(Math.floor(left/60)).padStart(2,'0'),ss=String(left%60).padStart(2,'0');o.textContent=mm+':'+ss;if(left<=0){clearInterval(t);t=null;o.textContent='Done ⏰';st.textContent='Start'}},1000)}},
stopw(el){el.innerHTML='<div class="out" id="o" style="font-size:28px;text-align:center">00:00.0</div><div class="row"><button class="p" id="st">Start</button><button class="p sec" id="rs">Reset</button></div>';
let t=null,ms=0;st.onclick=()=>{if(t){clearInterval(t);t=null;st.textContent='Start';return}st.textContent='Stop';const t0=Date.now()-ms;t=setInterval(()=>{ms=Date.now()-t0;const s=Math.floor(ms/1000),m=Math.floor(s/60);o.textContent=String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+'.'+Math.floor((ms%1000)/100)},100)};
rs.onclick=()=>{clearInterval(t);t=null;ms=0;o.textContent='00:00.0';st.textContent='Start'}},
focus(el){let left=25*60,t=null;el.innerHTML='<div class="out" id="o" style="font-size:36px;text-align:center">25:00</div><div class="row"><button class="p" id="st">Start</button><button class="p sec" id="rs">Reset</button></div><p style="color:#94a3b8;font-size:11px;margin-top:8px">Pomodoro 25 min focus</p>';
function show(){o.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');wFocus.textContent=o.textContent}
st.onclick=()=>{if(t){clearInterval(t);t=null;st.textContent='Start';return}st.textContent='Pause';t=setInterval(()=>{left--;show();if(left<=0){clearInterval(t);t=null;o.textContent='Break time ☕';st.textContent='Start'}},1000)};
rs.onclick=()=>{clearInterval(t);t=null;left=25*60;show();st.textContent='Start'};show()},
alarm(el){el.innerHTML='<label>Set time</label><input id="t" type="time"/><button class="p" id="st">Arm</button><div class="out" id="o">No alarm</div>';
let iv=null;st.onclick=()=>{if(!t.value)return;o.textContent='Armed for '+t.value;if(iv)clearInterval(iv);
iv=setInterval(()=>{const n=new Date(),hh=String(n.getHours()).padStart(2,'0'),mm=String(n.getMinutes()).padStart(2,'0');
if(hh+':'+mm===t.value){o.textContent='ALARM ⏰ '+t.value;clearInterval(iv)}},1000)}},
cal(el){const n=new Date(),y=n.getFullYear(),m=n.getMonth();const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
let h='<div style="font-weight:700;margin-bottom:8px">'+n.toLocaleString([],{month:'long',year:'numeric'})+'</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;font-size:11px">';
'S M T W T F S'.split(' ').forEach(d=>h+='<div style="color:#64748b">'+d+'</div>');
for(let i=0;i<first;i++)h+='<div></div>';for(let d=1;d<=days;d++){const on=d===n.getDate()?'background:#3b82f6;border-radius:8px':'';h+='<div style="padding:6px 0;'+on+'">'+d+'</div>'}h+='</div>';el.innerHTML=h},
dice(el){el.innerHTML='<label>Dice count</label><input id="n" type="number" value="1" min="1" max="6"/><div class="out" id="o" style="font-size:40px;text-align:center">🎲</div><button class="p" id="g">Roll</button>';
g.onclick=()=>{const c=Math.min(6,Math.max(1,+n.value||1));const r=[];for(let i=0;i<c;i++)r.push(1+Math.floor(Math.random()*6));o.textContent=r.map(x=>'🎲'+x).join(' ')+'\\nSum '+r.reduce((a,b)=>a+b,0)}},
coin(el){el.innerHTML='<div class="out" id="o" style="font-size:40px;text-align:center">🪙</div><button class="p" id="g">Flip</button>';g.onclick=()=>o.textContent=Math.random()<.5?'Heads':'Tails'},
rps(el){el.innerHTML='<div class="row"><button class="p" data-m="rock">✊</button><button class="p" data-m="paper">✋</button><button class="p" data-m="scissors">✌️</button></div><div class="out" id="o"></div>';
el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const you=b.dataset.m,ai=['rock','paper','scissors'][Math.floor(Math.random()*3)];
let r='Draw';if((you==='rock'&&ai==='scissors')||(you==='paper'&&ai==='rock')||(you==='scissors'&&ai==='paper'))r='You win';else if(you!==ai)r='You lose';
o.textContent='You: '+you+'\\nBot: '+ai+'\\n'+r})},
luck(el){el.innerHTML='<button class="p" id="g">Today\\'s luck</button><div class="out" id="o"></div>';
g.onclick=()=>{const s=1+Math.floor(Math.random()*100);const m=s>80?'Great day':s>50?'Good vibes':s>25?'Okay-ish':'Careful today';o.textContent='Luck score: '+s+'/100\\n'+m}},
'8ball'(el){const a=['Yes','No','Maybe','Ask again','Definitely','Doubtful','Absolutely','Not now','Looks good','Can\\'t say'];
el.innerHTML='<input id="q" placeholder="Ask a question…"/><button class="p" id="g">Shake</button><div class="out" id="o" style="font-size:18px;text-align:center"></div>';
g.onclick=()=>o.textContent='🎱 '+a[Math.floor(Math.random()*a.length)]},
spin(el){el.innerHTML='<label>Options (comma)</label><input id="o" value="A, B, C, D"/><button class="p" id="g">Spin</button><div class="out" id="r" style="font-size:22px;text-align:center"></div>';
g.onclick=()=>{const p=o.value.split(',').map(s=>s.trim()).filter(Boolean);r.textContent=p.length?p[Math.floor(Math.random()*p.length)]:'?'}},
memory(el){const em=['🍎','🍋','🍇','🍉','🍓','🍒','🥝','🍑'];let cards=[...em,...em].sort(()=>Math.random()-.5),open=[],lock=0,matched=0;
el.innerHTML='<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px"></div><div class="out" id="o">Match pairs</div>';
cards.forEach((c,i)=>{const b=document.createElement('button');b.className='p';b.style.padding='16px 0';b.style.fontSize='20px';b.textContent='❓';b.onclick=()=>{
if(lock||b.dataset.m)return;b.textContent=c;open.push({b,c});if(open.length===2){lock=1;if(open[0].c===open[1].c){open[0].b.dataset.m=1;open[1].b.dataset.m=1;matched++;open=[];lock=0;if(matched===8)o.textContent='You win! 🎉'}
else{setTimeout(()=>{open[0].b.textContent='❓';open[1].b.textContent='❓';open=[];lock=0},500)}}};g.appendChild(b)})},
quiz(el){const Q=[{q:'Capital of Pakistan?',a:['Karachi','Islamabad','Lahore','Peshawar'],c:1},{q:'2+2×2=?',a:['6','8','4','2'],c:0},{q:'HTML stands for?',a:['Hyper Text','High Tool','Hyperlinks','Home Tool'],c:0},{q:'Earth is a…',a:['Star','Planet','Moon','Comet'],c:1}];
let i=0,sc=0;function show(){if(i>=Q.length){el.innerHTML='<div class="out">Score '+sc+'/'+Q.length+'</div><button class="p" id="r">Again</button>';r.onclick=()=>{i=0;sc=0;show()};return}
const x=Q[i];el.innerHTML='<div class="out">'+x.q+'</div>'+x.a.map((t,n)=>'<button class="p sec" data-n="'+n+'" style="margin-top:6px">'+t+'</button>').join('');
el.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{if(+b.dataset.n===x.c)sc++;i++;show()})}show()},
bmi(el){el.innerHTML='<label>Height cm</label><input id="h" type="number" value="170"/><label>Weight kg</label><input id="w" type="number" value="65"/><button class="p" id="g">Calc</button><div class="out" id="o"></div>';
g.onclick=()=>{const m=+h.value/100,b=(+w.value)/(m*m);let c='Normal';if(b<18.5)c='Underweight';else if(b>=25&&b<30)c='Overweight';else if(b>=30)c='Obese';o.textContent='BMI '+b.toFixed(1)+'\\n'+c}},
age(el){el.innerHTML='<label>Birth date</label><input id="d" type="date"/><button class="p" id="g">Age</button><div class="out" id="o"></div>';
g.onclick=()=>{if(!d.value)return;const b=new Date(d.value),n=new Date();let y=n.getFullYear()-b.getFullYear(),m=n.getMonth()-b.getMonth(),dd=n.getDate()-b.getDate();if(dd<0){m--;dd+=30}if(m<0){y--;m+=12}o.textContent=y+' years, '+m+' months, '+dd+' days'}},
unit(el){el.innerHTML='<label>Value</label><input id="v" type="number" value="1"/><select id="t"><option value="km_mi">km→mi</option><option value="mi_km">mi→km</option><option value="kg_lb">kg→lb</option><option value="lb_kg">lb→kg</option><option value="c_f">°C→°F</option><option value="f_c">°F→°C</option><option value="m_ft">m→ft</option></select><button class="p" id="g">Convert</button><div class="out" id="o"></div>';
const f={km_mi:x=>x*0.621371,mi_km:x=>x*1.60934,kg_lb:x=>x*2.20462,lb_kg:x=>x/2.20462,c_f:x=>x*9/5+32,f_c:x=>(x-32)*5/9,m_ft:x=>x*3.28084};
g.onclick=()=>o.textContent=f[t.value](+v.value).toFixed(4)},
fx(el){el.innerHTML='<label>Amount PKR</label><input id="a" type="number" value="1000"/><button class="p" id="g">Approx</button><div class="out" id="o"></div><p style="color:#64748b;font-size:11px">Offline approx rates</p>';
g.onclick=()=>{const p=+a.value;o.textContent='USD ~'+(p/278).toFixed(2)+'\\nEUR ~'+(p/300).toFixed(2)+'\\nGBP ~'+(p/350).toFixed(2)+'\\nAED ~'+(p/75.7).toFixed(2)+'\\nINR ~'+(p/3.3).toFixed(2)}},
emi(el){el.innerHTML='<label>Loan</label><input id="p" type="number" value="500000"/><label>Rate %/yr</label><input id="r" type="number" value="14"/><label>Months</label><input id="n" type="number" value="36"/><button class="p" id="g">EMI</button><div class="out" id="o"></div>';
g.onclick=()=>{const P=+p.value,R=(+r.value)/12/100,N=+n.value;const e=P*R*Math.pow(1+R,N)/(Math.pow(1+R,N)-1);o.textContent='Monthly: '+e.toFixed(0)+'\\nTotal: '+(e*N).toFixed(0)+'\\nInterest: '+(e*N-P).toFixed(0)}},
pct(el){el.innerHTML='<label>X</label><input id="a" type="number" value="15"/><label>of Y</label><input id="b" type="number" value="200"/><button class="p" id="g">Calc</button><div class="out" id="o"></div>';
g.onclick=()=>o.textContent=(+a.value)+'% of '+(+b.value)+' = '+(((+a.value)/100)*(+b.value)).toFixed(2)+'\\n'+(+a.value)+' is '+(((+a.value)/(+b.value))*100).toFixed(1)+'% of '+(+b.value)},
fuel(el){el.innerHTML='<label>Distance km</label><input id="d" type="number" value="100"/><label>Km per liter</label><input id="k" type="number" value="12"/><label>Price / liter</label><input id="p" type="number" value="280"/><button class="p" id="g">Cost</button><div class="out" id="o"></div>';
g.onclick=()=>{const lit=(+d.value)/(+k.value||1);o.textContent='Fuel: '+lit.toFixed(2)+' L\\nCost: '+(lit*(+p.value)).toFixed(0)}},
gpa(el){el.innerHTML='<label>Marks (comma, out of 100)</label><input id="m" value="80,75,90,70"/><button class="p" id="g">Average</button><div class="out" id="o"></div>';
g.onclick=()=>{const a=m.value.split(',').map(Number).filter(x=>!isNaN(x));const avg=a.reduce((x,y)=>x+y,0)/a.length;let g='F';if(avg>=90)g='A+';else if(avg>=80)g='A';else if(avg>=70)g='B';else if(avg>=60)g='C';else if(avg>=50)g='D';o.textContent='Avg '+avg.toFixed(1)+'\\nGrade '+g}},
pass(el){el.innerHTML='<label>Length</label><input id="l" type="number" value="16"/><button class="p" id="g">Generate</button><div class="out" id="o"></div>';
g.onclick=()=>{const c='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%',n=+l.value||16;let s='';for(let i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];o.textContent=s}},
rand(el){el.innerHTML='<label>Min</label><input id="a" type="number" value="1"/><label>Max</label><input id="b" type="number" value="100"/><button class="p" id="g">Pick</button><div class="out" id="o" style="font-size:28px;text-align:center"></div>';
g.onclick=()=>o.textContent=String(Math.floor(Math.random()*(+b.value-+a.value+1))+ +a.value)},
word(el){el.innerHTML='<textarea id="t" rows="8" placeholder="Paste text…"></textarea><button class="p" id="g">Count</button><div class="out" id="o"></div>';
g.onclick=()=>{const s=t.value,w=s.trim()?s.trim().split(/\\s+/).length:0;o.textContent='Chars: '+s.length+'\\nWords: '+w+'\\nLines: '+(s?s.split('\\n').length:0)}},
b64(el){el.innerHTML='<textarea id="t" rows="4"></textarea><div class="row"><button class="p" id="e">Encode</button><button class="p sec" id="d">Decode</button></div><div class="out" id="o"></div>';
e.onclick=()=>{try{o.textContent=btoa(unescape(encodeURIComponent(t.value)))}catch(err){o.textContent='Error'}};
d.onclick=()=>{try{o.textContent=decodeURIComponent(escape(atob(t.value)))}catch(err){o.textContent='Invalid'}}},
morse(el){const M={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
el.innerHTML='<input id="t" placeholder="Hello"/><button class="p" id="g">To Morse</button><div class="out" id="o"></div>';
g.onclick=()=>o.textContent=t.value.toUpperCase().split('').map(c=>c===' '?' / ':(M[c]||c)).join(' ')},
roman(el){el.innerHTML='<label>Number 1–3999</label><input id="n" type="number" value="2026"/><button class="p" id="g">To Roman</button><div class="out" id="o"></div>';
g.onclick=()=>{let num=+n.value;if(num<1||num>3999){o.textContent='Out of range';return}const v=[1000,900,500,400,100,90,50,40,10,9,5,4,1],s=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];let r='';
for(let i=0;i<v.length;i++){while(num>=v[i]){r+=s[i];num-=v[i]}}o.textContent=r}},
color(el){el.innerHTML='<input id="c" type="color" value="#3b82f6" style="height:48px;padding:0"/><div class="out" id="o"></div>';
function up(){const hex=c.value;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);o.textContent=hex+'\\nRGB('+r+', '+g+', '+b+')';el.style.background=hex+'22'}c.oninput=up;up()},
world(el){const zs=[['Pakistan','Asia/Karachi'],['London','Europe/London'],['New York','America/New_York'],['Dubai','Asia/Dubai'],['Tokyo','Asia/Tokyo'],['Istanbul','Europe/Istanbul']];
function ren(){el.innerHTML=zs.map(([n,z])=>'<div style="padding:8px;background:#1e293b;border-radius:10px;margin:4px 0;display:flex;justify-content:space-between"><span>'+n+'</span><b>'+new Date().toLocaleTimeString([],{timeZone:z,hour:'2-digit',minute:'2-digit'})+'</b></div>').join('')}ren();setInterval(ren,1000)},
flash(el){let on=0;el.innerHTML='<button class="p" id="g">Toggle Flash</button>';g.onclick=()=>{on=!on;document.body.style.background=on?'#fff':'#000';g.textContent=on?'Turn off':'Toggle Flash'}},
counter(el){let n=0;el.innerHTML='<div class="out" id="o" style="font-size:40px;text-align:center">0</div><div class="row"><button class="p" id="m">−</button><button class="p" id="p">+</button></div><button class="p sec" id="r">Reset</button>';
m.onclick=()=>{n--;o.textContent=n};p.onclick=()=>{n++;o.textContent=n};r.onclick=()=>{n=0;o.textContent=n}},
habit(el){const k='mb_hab';let h=JSON.parse(localStorage.getItem(k)||'{"water":0,"read":0,"walk":0}');
function ren(){el.innerHTML='<div class="out">Today</div>'+Object.keys(h).map(x=>'<button class="p sec" data-x="'+x+'" style="margin-top:6px">'+x+': '+h[x]+' ✓</button>').join('')+'<button class="p" id="rs" style="margin-top:10px">Reset day</button>';
el.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{h[b.dataset.x]++;localStorage.setItem(k,JSON.stringify(h));ren()});
rs.onclick=()=>{h={water:0,read:0,walk:0};localStorage.setItem(k,JSON.stringify(h));ren()}}ren()},
about(el){el.innerHTML='<div class="out"><b>MiniOS Phone</b>\\nSwipe 4 pages of apps\\nDock shortcuts\\nClock + widgets\\nAll offline · works in WhatsApp\\n\\nMiniBot HTML suite</div>'}
};
</script></body></html>`;
}

module.exports = {
  name: 'phone',
  pattern: 'phone',
  aliases: ['mobile', 'launcher', 'os', 'home'],
  desc: 'Smartphone launcher with 40+ offline apps',
  category: 'apps',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, buildPhoneHtml(), 'Phone');
  },
};
