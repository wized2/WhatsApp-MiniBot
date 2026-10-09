const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');
const { style } = require('../lib/stylish');

const G = {};
const T = {};
function add(id, title, css, body) {
  G[id] = shell(title, css, body);
  T[id] = title;
}

// —— many compact games ——
add('dodge', 'Dodge',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="300"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px=140,py=260,e=[],sc=0,dead=false;
c.onpointermove=e0=>{const r=c.getBoundingClientRect();px=(e0.clientX-r.left)*(c.width/r.width)-15};
setInterval(()=>{if(!dead)e.push({x:Math.random()*280,y:-10,s:2+Math.random()*2})},400);
function loop(){
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  if(!dead){py=260;x.fillStyle='#25D366';x.fillRect(px,py,30,14);
    e.forEach(o=>{o.y+=o.s;x.fillStyle='#ef4444';x.fillRect(o.x,o.y,16,16);
      if(o.y>py-12&&o.y<py+14&&o.x>px-12&&o.x<px+30)dead=true});
    e=e.filter(o=>o.y<320);sc++;
  }
  x.fillStyle='#fff';x.font='12px system-ui';x.fillText(dead?'Over '+sc:'Score '+sc,8,14);
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

add('bounce', 'Bounce',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="300"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let bx=150,by=150,vx=3,vy=2.5,px=120;
c.onpointermove=e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)*(c.width/r.width)-30};
function loop(){
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  x.fillStyle='#25D366';x.fillRect(px,280,60,8);
  bx+=vx;by+=vy;
  if(bx<8||bx>292)vx*=-1;if(by<8)vy*=-1;
  if(by>272&&bx>px&&bx<px+60)vy=-Math.abs(vy);
  if(by>300){bx=150;by=100;vy=2.5}
  x.fillStyle='#fff';x.beginPath();x.arc(bx,by,8,0,6.28);x.fill();
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

add('stack', 'Stack Jump',
`canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="320"></canvas><button id="j" style="width:100%">Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=260,vy=0,plat=[{x:40,y:300,w:200}],sc=0,cam=0;
document.getElementById('j').onclick=()=>{if(y>=260-cam||Math.abs(vy)<0.1)vy=-9};
function loop(){
  x.fillStyle='#0d1117';x.fillRect(0,0,280,320);
  vy+=0.35;y+=vy;
  plat.forEach(p=>{
    x.fillStyle='#3b82f6';x.fillRect(p.x,p.y-cam,p.w,10);
    if(vy>0&&y-cam+16>=p.y-cam&&y-cam+16<=p.y-cam+12&&150>p.x&&150<p.x+p.w){vy=-8;sc++}
  });
  if(y-cam>340){y=260;cam=0;plat=[{x:40,y:300,w:200}];sc=0;vy=0}
  if(plat[plat.length-1].y-cam<280)plat.push({x:20+Math.random()*120,y:plat[plat.length-1].y-70,w:80+Math.random()*80});
  cam=Math.min(cam,y-180);
  x.fillStyle='#25D366';x.fillRect(142,y-cam,16,16);
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

add('snake2', 'Neon Snake',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="300"></canvas>
<div class="row"><button id="u">▲</button></div><div class="row"><button id="l">◀</button><button id="r">▶</button></div><div class="row"><button id="d">▼</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d'),N=15,S=20;
let s=[{x:7,y:7}],d={x:1,y:0},f={x:3,y:3},dead=false,sc=0;
function place(){f={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}
[['u',0,-1],['d',0,1],['l',-1,0],['r',1,0]].forEach(([id,a,b])=>document.getElementById(id).onclick=()=>{if(d.x+a||d.y+b)d={x:a,y:b}});
setInterval(()=>{
  if(dead)return;
  const h={x:(s[0].x+d.x+N)%N,y:(s[0].y+d.y+N)%N};
  if(s.some(o=>o.x===h.x&&o.y===h.y)){dead=true;return}
  s.unshift(h);if(h.x===f.x&&h.y===f.y){sc++;place()}else s.pop();
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  x.fillStyle='#f43f5e';x.fillRect(f.x*S,f.y*S,S-2,S-2);
  s.forEach((o,i)=>{x.fillStyle=i?`hsl(${140+i*3},80%,50%)`:'#25D366';x.fillRect(o.x*S,o.y*S,S-2,S-2)});
  x.fillStyle='#fff';x.fillText('Score '+sc+(dead?' · Over':''),6,12);
},110);
<\/script>`);

add('pairs', 'Pairs Fast',
`.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.card{aspect-ratio:1;border:0;border-radius:12px;background:#1a2430;font-size:20px;color:#fff}`,
`<div class="grid" id="g"></div><p class="score" id="m">Matches 0</p>
<script>
const ic=['🌟','🎯','🎵','🎨','🌈','🔥','💎','🍀'];const deck=[...ic,...ic].sort(()=>Math.random()-0.5);
let open=[],lock=false,m=0;
const g=document.getElementById('g');
deck.forEach((v,i)=>{
  const b=document.createElement('button');b.className='card';b.textContent='·';
  b.onclick=()=>{if(lock||b.dataset.on)return;b.textContent=v;b.dataset.on=1;open.push(b);
    if(open.length===2){lock=true;const[a,c]=open;if(a.textContent===c.textContent){m++;document.getElementById('m').textContent='Matches '+m+(m===8?' · Clear!':'');open=[];lock=false}
    else setTimeout(()=>{a.textContent='·';c.textContent='·';delete a.dataset.on;delete c.dataset.on;open=[];lock=false},400)}}
  g.appendChild(b);
});
<\/script>`);

add('tapcolor', 'Tap Color',
`.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.cell{height:72px;border:0;border-radius:16px}`,
`<p id="ask" style="text-align:center;font-weight:700"></p><div class="grid" id="g"></div><p class="score" id="m">Score 0</p>
<script>
const C=[{n:'RED',c:'#ef4444'},{n:'GREEN',c:'#22c55e'},{n:'BLUE',c:'#3b82f6'},{n:'PINK',c:'#ec4899'}];
let t=0,sc=0;
function round(){t=Math.floor(Math.random()*4);document.getElementById('ask').textContent='Tap '+C[t].n;document.getElementById('ask').style.color=C[Math.floor(Math.random()*4)].c}
const g=document.getElementById('g');
C.forEach((col,i)=>{const b=document.createElement('button');b.className='cell';b.style.background=col.c;
  b.onclick=()=>{sc+=i===t?1:-1;if(sc<0)sc=0;document.getElementById('m').textContent='Score '+sc;round()};g.appendChild(b)});
round();
<\/script>`);

add('hold', 'Hold Release',
`#b{width:100%;height:100px;font-size:16px}`,
`<p class="hint">Hold when green · release near 3.00s</p>
<button id="b" class="sec">Start</button><p id="m" class="score"></p>
<script>
let t0=0,mode='idle';const b=document.getElementById('b');
b.onpointerdown=()=>{if(mode==='idle'){mode='wait';b.style.background='#7f1d1d';b.textContent='Wait…';
  setTimeout(()=>{mode='hold';t0=performance.now();b.style.background='#25D366';b.textContent='HOLD'},600+Math.random()*1500)}
  else if(mode==='hold'){}};
b.onpointerup=()=>{if(mode==='hold'){const s=((performance.now()-t0)/1000).toFixed(2);mode='idle';b.className='sec';b.style.background='';b.textContent='Start';
  document.getElementById('m').textContent='Held '+s+'s · '+(Math.abs(s-3)<0.25?'Perfect!':'Target 3.00s')}};
<\/script>`);

add('traffic', 'Traffic Light',
`#light{width:80px;height:80px;border-radius:50%;margin:16px auto;background:#333}`,
`<div id="light"></div><button id="go" style="width:100%">Go on GREEN</button><p id="m" class="score"></p>
<script>
let col='red',t0=0;
function cycle(){col=col==='red'?'green':col==='green'?'yellow':'red';
  document.getElementById('light').style.background=col==='red'?'#ef4444':col==='green'?'#22c55e':'#eab308';
  t0=Date.now();setTimeout(cycle,col==='green'?2000:col==='yellow'?700:1500+Math.random()*1500)}
document.getElementById('go').onclick=()=>{const dt=Date.now()-t0;
  document.getElementById('m').textContent=col==='green'?'Good! '+dt+'ms':col==='yellow'?'Risky': 'Red light! 🚫'};
cycle();
<\/script>`);

add('bubblepop', 'Bubble Pop',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="300"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let bubbles=[],sc=0;
function spawn(){bubbles.push({x:30+Math.random()*240,y:300,r:12+Math.random()*16,v:1+Math.random()*2})}
setInterval(spawn,500);
c.onclick=e=>{const r=c.getBoundingClientRect();const mx=(e.clientX-r.left)*(c.width/r.width),my=(e.clientY-r.top)*(c.height/r.height);
  bubbles=bubbles.filter(b=>{if(Math.hypot(mx-b.x,my-b.y)<b.r){sc++;return false}return true})};
function loop(){
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  bubbles.forEach(b=>{b.y-=b.v;x.beginPath();x.fillStyle='hsla('+(b.x)+',70%,60%,.85)';x.arc(b.x,b.y,b.r,0,6.28);x.fill()});
  bubbles=bubbles.filter(b=>b.y>-30);
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

add('ruler', 'Estimate Length',
`#bar{height:24px;background:#25D366;border-radius:8px;margin:20px 0}`,
`<p class="hint">Guess the bar width (px approx)</p><div id="bar"></div>
<input id="g" type="number" placeholder="Your guess"/><button id="ok" style="width:100%">Check</button><p id="m"></p>
<script>
let w=40+Math.floor(Math.random()*200);
document.getElementById('bar').style.width=w+'px';
document.getElementById('ok').onclick=()=>{
  const g=Number(document.getElementById('g').value);
  document.getElementById('m').textContent='Real '+w+'px · you '+g+' · off '+Math.abs(w-g);
  w=40+Math.floor(Math.random()*200);document.getElementById('bar').style.width=w+'px';
};
<\/script>`);

add('sequence', 'Number Sequence',
`#q{font-size:20px;text-align:center;margin:12px}`,
`<div id="q"></div><input id="a" type="number" placeholder="Next number?"/><button id="ok" style="width:100%">OK</button><p id="m" class="score"></p>
<script>
let sc=0,seq=[],ans=0;
function round(){
  const start=1+Math.floor(Math.random()*5),step=1+Math.floor(Math.random()*4);
  seq=[start,start+step,start+2*step,start+3*step];ans=start+4*step;
  document.getElementById('q').textContent=seq.join(', ')+', ?';
}
document.getElementById('ok').onclick=()=>{
  const v=Number(document.getElementById('a').value);
  if(v===ans){sc++;document.getElementById('m').textContent='Score '+sc+' · Correct!'}
  else document.getElementById('m').textContent='Was '+ans+' · Score '+sc;
  document.getElementById('a').value='';round();
};
round();
<\/script>`);

add('oddone', 'Odd One Out',
`.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}button{font-size:28px;height:72px;background:#1a2430;color:#fff}`,
`<div class="grid" id="g"></div><p id="m" class="score">Score 0</p>
<script>
const sets=[['🍎','🍎','🍎','🍏'],['🐶','🐶','🐱','🐶'],['⭐','☆','⭐','⭐'],['🔺','🔺','🔻','🔺']];
let sc=0;
function round(){
  const s=sets[Math.floor(Math.random()*sets.length)].slice();
  const odd=s.findIndex((v,i,a)=>a.filter(x=>x===v).length===1);
  const g=document.getElementById('g');g.innerHTML='';
  s.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v;
    b.onclick=()=>{if(i===odd)sc++;else sc=Math.max(0,sc-1);document.getElementById('m').textContent='Score '+sc;round()};
    g.appendChild(b)});
}
round();
<\/script>`);

add('memorynum', 'Memory Digits',
``,
`<p class="hint">Remember the number</p><div id="n" style="font-size:28px;text-align:center;margin:16px;letter-spacing:4px">----</div>
<input id="a" placeholder="Type it"/><button id="ok" style="width:100%">Check</button><p id="m"></p>
<script>
let secret='',level=3;
function show(){
  secret=''+Math.floor(Math.pow(10,level-1)+Math.random()*(Math.pow(10,level)-Math.pow(10,level-1)));
  document.getElementById('n').textContent=secret;document.getElementById('a').value='';
  setTimeout(()=>document.getElementById('n').textContent='•'.repeat(level),1200);
}
document.getElementById('ok').onclick=()=>{
  if(document.getElementById('a').value===secret){level=Math.min(8,level+1);document.getElementById('m').textContent='Yes! Level '+level}
  else{document.getElementById('m').textContent='No · was '+secret;level=Math.max(3,level-1)}
  show();
};
show();
<\/script>`);

add('stopwatch', 'Stopwatch',
`#t{font-size:40px;text-align:center;margin:16px;font-variant-numeric:tabular-nums}`,
`<div id="t">0.00</div><div class="row"><button id="s" style="flex:1">Start</button><button id="r" class="sec" style="flex:1">Reset</button></div>
<script>
let t0=0,acc=0,run=false,iv;
const el=document.getElementById('t');
function show(){const v=run?acc+(performance.now()-t0):acc;el.textContent=(v/1000).toFixed(2)}
document.getElementById('s').onclick=()=>{
  if(!run){run=true;t0=performance.now();iv=setInterval(show,30);document.getElementById('s').textContent='Stop'}
  else{run=false;acc+=performance.now()-t0;clearInterval(iv);document.getElementById('s').textContent='Start';show()}
};
document.getElementById('r').onclick=()=>{run=false;acc=0;clearInterval(iv);document.getElementById('s').textContent='Start';show()};
<\/script>`);

add('metronome', 'Metronome',
``,
`<p class="hint">BPM</p><input id="b" type="number" value="100"/><button id="t" style="width:100%">Start / Stop</button>
<div id="dot" style="width:48px;height:48px;border-radius:50%;background:#1a2430;margin:20px auto"></div>
<script>
let on=false,iv;
document.getElementById('t').onclick=()=>{
  on=!on;clearInterval(iv);
  if(on){const bpm=Math.max(40,Math.min(220,Number(document.getElementById('b').value)||100));
    iv=setInterval(()=>{const d=document.getElementById('dot');d.style.background='#25D366';setTimeout(()=>d.style.background='#1a2430',80)},60000/bpm)}
};
<\/script>`);

add('counter', 'Tally Counter',
`#n{font-size:48px;text-align:center;margin:16px}`,
`<div id="n">0</div><div class="row"><button id="p" style="flex:1">+1</button><button id="m" class="sec" style="flex:1">−1</button><button id="r" class="sec" style="flex:1">Reset</button></div>
<script>
let n=0;const el=document.getElementById('n');
document.getElementById('p').onclick=()=>{n++;el.textContent=n};
document.getElementById('m').onclick=()=>{n--;el.textContent=n};
document.getElementById('r').onclick=()=>{n=0;el.textContent=n};
<\/script>`);

add('luck', 'Lucky Number',
``,
`<button id="g" style="width:100%;height:80px;font-size:18px">Reveal luck</button><p id="m" style="text-align:center;font-size:22px;margin-top:16px"></p>
<script>
document.getElementById('g').onclick=()=>{
  const n=1+Math.floor(Math.random()*99);
  const msg=n>80?'🔥 Hot':n>50?'✨ Good':n>20?'🌙 Okay':'🧊 Cold';
  document.getElementById('m').textContent=n+' · '+msg;
};
<\/script>`);

add('rps5', 'RPS Streak',
`.row{display:flex;gap:8px}button{flex:1;font-size:22px;height:56px;background:#1a2430;color:#fff}`,
`<div class="row"><button data-c="🪨">🪨</button><button data-c="📄">📄</button><button data-c="✂️">✂️</button></div>
<p id="m" class="score">Streak 0</p>
<script>
let st=0;const beats={'🪨':'✂️','📄':'🪨','✂️':'📄'};
document.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  const you=b.dataset.c,bot=['🪨','📄','✂️'][Math.floor(Math.random()*3)];
  let r;if(you===bot)r='Draw';else if(beats[you]===bot){st++;r='Win'}else{st=0;r='Lose'}
  document.getElementById('m').textContent=you+' vs '+bot+' · '+r+' · streak '+st;
});
<\/script>`);

add('maze', 'Mini Maze',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="300"></canvas>
<div class="row"><button id="u">▲</button></div><div class="row"><button id="l">◀</button><button id="r">▶</button></div><div class="row"><button id="d">▼</button></div>
<script>
const N=10,S=30,c=document.getElementById('c'),x=c.getContext('2d');
// simple random maze walls as blocked cells
const wall=new Set();
for(let i=0;i<30;i++)wall.add(Math.floor(Math.random()*N*N));
wall.delete(0);wall.delete(N*N-1);
let p=0;
function draw(){
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  for(let i=0;i<N*N;i++){
    const y=i/N|0,x0=i%N;
    if(wall.has(i)){x.fillStyle='#1e293b';x.fillRect(x0*S,y*S,S-1,S-1)}
  }
  x.fillStyle='#eab308';x.fillRect(9*S+4,9*S+4,S-8,S-8);
  x.fillStyle='#25D366';x.fillRect((p%N)*S+4,(p/N|0)*S+4,S-8,S-8);
}
function move(dx,dy){
  const x0=p%N,y0=p/N|0,nx=x0+dx,ny=y0+dy;
  if(nx<0||ny<0||nx>=N||ny>=N)return;
  const ni=ny*N+nx;if(wall.has(ni))return;p=ni;
  if(p===N*N-1){wall.clear();p=0;for(let i=0;i<30;i++)wall.add(Math.floor(Math.random()*N*N));wall.delete(0);wall.delete(N*N-1)}
  draw();
}
[['u',0,-1],['d',0,1],['l',-1,0],['r',1,0]].forEach(([id,a,b])=>document.getElementById(id).onclick=()=>move(a,b));
draw();
<\/script>`);

add('platform', 'Platformer Lite',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="200"></canvas><button id="j" style="width:100%">Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px=40,py=140,vy=0,sc=0,obs=300;
document.getElementById('j').onclick=()=>{if(py>=140)vy=-8};
function loop(){
  x.fillStyle='#0d1117';x.fillRect(0,0,300,200);
  x.fillStyle='#334155';x.fillRect(0,160,300,40);
  x.fillStyle='#ef4444';x.fillRect(obs,140,18,20);
  x.fillStyle='#25D366';x.fillRect(px,py,16,16);
  vy+=0.4;py+=vy;if(py>140){py=140;vy=0}
  obs-=3+sc*0.02;if(obs<-20){obs=320;sc++}
  if(obs<px+16&&obs+18>px&&py>130){sc=0;obs=320}
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

add('quizmath', 'Speed Math',
`#q{font-size:24px;text-align:center;margin:12px}.grid2 button{font-size:16px}`,
`<div id="q"></div><div class="grid2" id="o"></div><p id="m" class="score">Score 0 · 30s</p>
<script>
let sc=0,ans=0,t0=Date.now();
function round(){
  if((Date.now()-t0)/1000>30){document.getElementById('q').textContent='Done! '+sc;document.getElementById('o').innerHTML='';return}
  const a=1+Math.floor(Math.random()*15),b=1+Math.floor(Math.random()*15);
  ans=a+b;document.getElementById('q').textContent=a+' + '+b;
  const opts=new Set([ans]);while(opts.size<4)opts.add(ans+Math.floor(Math.random()*9)-4);
  const box=document.getElementById('o');box.innerHTML='';
  [...opts].sort(()=>Math.random()-0.5).forEach(v=>{const b=document.createElement('button');b.textContent=v;
    b.onclick=()=>{if(v===ans)sc++;document.getElementById('m').textContent='Score '+sc+' · '+Math.max(0,30-((Date.now()-t0)/1000)|0)+'s';round()};box.appendChild(b)});
}
round();
<\/script>`);

add('wordguess', 'Word Guess',
`#w{letter-spacing:8px;font-size:22px;text-align:center;margin:12px;font-weight:700}`,
`<div id="w"></div><input id="g" maxlength="1" placeholder="Letter"/><button id="ok" style="width:100%">Guess</button><p id="m"></p>
<script>
const words=['APPLE','HOUSE','PLANE','ROBOT','MUSIC','CLOUD','LIGHT','TIGER'];
let word=words[Math.floor(Math.random()*words.length)],got=new Set(),hp=7;
function show(){document.getElementById('w').textContent=word.split('').map(c=>got.has(c)?c:'_').join(' ')}
show();
document.getElementById('ok').onclick=()=>{
  const ch=(document.getElementById('g').value||'').toUpperCase()[0];document.getElementById('g').value='';
  if(!ch)return;if(word.includes(ch))got.add(ch);else hp--;
  show();
  if([...word].every(c=>got.has(c)))document.getElementById('m').textContent='Win! 🎉';
  else if(hp<=0)document.getElementById('m').textContent='Lost · '+word;
  else document.getElementById('m').textContent='Lives '+hp;
};
<\/script>`);

add('pattern', 'Pattern Memory',
`.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pad{height:56px;border-radius:12px;border:0;background:#1a2430}`,
`<div class="grid" id="g"></div><p id="m" class="score">Watch…</p>
<script>
let seq=[],player=[],lock=true;
const g=document.getElementById('g'),pads=[];
for(let i=0;i<9;i++){const b=document.createElement('button');b.className='pad';
  b.onclick=async()=>{if(lock)return;b.style.background='#25D366';await new Promise(r=>setTimeout(r,150));b.style.background='#1a2430';
    player.push(i);if(player[player.length-1]!==seq[player.length-1]){document.getElementById('m').textContent='Wrong · score '+(seq.length-1);seq=[];player=[];setTimeout(next,600);return}
    if(player.length===seq.length){document.getElementById('m').textContent='Good · L'+seq.length;setTimeout(next,400)}};
  g.appendChild(b);pads.push(b)}
async function flash(i){pads[i].style.background='#3b82f6';await new Promise(r=>setTimeout(r,280));pads[i].style.background='#1a2430'}
async function next(){seq.push(Math.floor(Math.random()*9));lock=true;document.getElementById('m').textContent='Watch';for(const i of seq){await flash(i);await new Promise(r=>setTimeout(r,100))}player=[];lock=false;document.getElementById('m').textContent='Your turn'}
next();
<\/script>`);

add('gravity', 'Gravity Balls',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="300"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let balls=[];
c.onclick=e=>{const r=c.getBoundingClientRect();balls.push({x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height),vy:0,vx:(Math.random()-0.5)*2})};
function loop(){
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  balls.forEach(b=>{b.vy+=0.25;b.y+=b.vy;b.x+=b.vx;if(b.y>290){b.y=290;b.vy*=-0.7}if(b.x<5||b.x>295)b.vx*=-1;
    x.beginPath();x.fillStyle='#25D366';x.arc(b.x,b.y,8,0,6.28);x.fill()});
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

add('drawpad', 'Sketch Pad',
`canvas{width:100%;max-width:320px;background:#fff}`,
`<canvas id="c" width="320" height="280"></canvas>
<div class="row"><button data-c="#111">Ink</button><button data-c="#ef4444">Red</button><button data-c="#25D366">Green</button><button id="clr" class="sec">Clear</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');let draw=false,col='#111';x.lineWidth=3;x.lineCap='round';
function pos(e){const r=c.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}}
c.onpointerdown=e=>{draw=true;const p=pos(e);x.beginPath();x.moveTo(p.x,p.y)};
c.onpointerup=()=>draw=false;
c.onpointermove=e=>{if(!draw)return;const p=pos(e);x.strokeStyle=col;x.lineTo(p.x,p.y);x.stroke()};
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>col=b.dataset.c);
document.getElementById('clr').onclick=()=>x.clearRect(0,0,320,280);
<\/script>`);

const ALIASES = Object.keys(G);

module.exports = {
  name: 'games-extra',
  pattern: 'games2',
  aliases: ALIASES,
  desc: 'More HTML games',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'games2') {
      const list = ALIASES.map((a) => `.${a}`).join(' · ');
      return reply(`╭──━ ${style('MORE GAMES')} ━──╮\n${list}\n╰── .games for pack 1 ──╯`);
    }
    const html = G[cmd];
    if (!html) return reply('Unknown. Try .games2');
    await sendHtmlApp(sock, jid, html, T[cmd] || cmd);
  },
};
