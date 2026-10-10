const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');
const { style } = require('../lib/stylish');

const G = {};
const T = {};
function add(id, title, css, body, hint) {
  G[id] = shell(title, css, body, { hint: hint || 'Tap Start' });
  T[id] = title;
}

add('dodge', 'Dodge', `canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="280"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px,e,sc,dead,raf;
c.onpointermove=e0=>{const r=c.getBoundingClientRect();px=(e0.clientX-r.left)*(c.width/r.width)-15};
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.fillStyle='#0d1117';x.fillRect(0,0,280,280);
  if(!dead){x.fillStyle='#25D366';x.fillRect(px,250,30,12);
    e.forEach(o=>{o.y+=o.s;x.fillStyle='#ef4444';x.fillRect(o.x,o.y,14,14);
      if(o.y>240&&o.y<262&&o.x>px-10&&o.x<px+30){dead=true;showEnd('Hit!','Score '+sc)}});
    e=e.filter(o=>o.y<300);sc++;
    if(sc%40===0)e.push({x:Math.random()*260,y:-10,s:1.5+Math.random()*1.5})}
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){px=125;e=[];sc=0;dead=false;cancelAnimationFrame(raf);loop()};
<\/script>`, 'Move · avoid blocks');

add('bubblepop', 'Bubble Pop', `canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="280"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let bubbles,sc,iv;
c.onclick=e=>{if(!window.__gameRunning)return;const r=c.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(c.width/r.width),my=(e.clientY-r.top)*(c.height/r.height);
  bubbles=bubbles.filter(b=>{if(Math.hypot(mx-b.x,my-b.y)<b.r){sc++;return false}return true})};
function draw(){
  if(!window.__gameRunning)return;
  x.fillStyle='#0d1117';x.fillRect(0,0,280,280);
  bubbles.forEach(b=>{b.y-=b.v;x.beginPath();x.fillStyle='hsla('+b.x+',70%,55%,.85)';x.arc(b.x,b.y,b.r,0,6.28);x.fill()});
  bubbles=bubbles.filter(b=>b.y>-30);
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  requestAnimationFrame(draw);
}
window.onGameStart=function(){bubbles=[];sc=0;clearInterval(iv);
  iv=setInterval(()=>{if(window.__gameRunning)bubbles.push({x:30+Math.random()*220,y:280,r:12+Math.random()*14,v:1+Math.random()*1.5})},550);
  draw();
  setTimeout(()=>{if(window.__gameRunning){clearInterval(iv);showEnd('Time!','Popped '+sc)}},20000);
};
<\/script>`, '20s · pop bubbles');

add('maze', 'Mini Maze', `canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="280"></canvas>
<div class="row" style="justify-content:center"><button id="u">▲</button></div>
<div class="row" style="justify-content:center"><button id="l">◀</button><button id="r">▶</button></div>
<div class="row" style="justify-content:center"><button id="d">▼</button></div>
<script>
const N=8,S=35,c=document.getElementById('c'),x=c.getContext('2d');
let wall,p;
function draw(){
  x.fillStyle='#0d1117';x.fillRect(0,0,280,280);
  for(let i=0;i<N*N;i++){const y=i/N|0,x0=i%N;if(wall.has(i)){x.fillStyle='#1e293b';x.fillRect(x0*S,y*S,S-1,S-1)}}
  x.fillStyle='#eab308';x.fillRect((N-1)*S+6,(N-1)*S+6,S-12,S-12);
  x.fillStyle='#25D366';x.fillRect((p%N)*S+6,(p/N|0)*S+6,S-12,S-12);
}
function move(dx,dy){
  if(!window.__gameRunning)return;
  const x0=p%N,y0=p/N|0,nx=x0+dx,ny=y0+dy;
  if(nx<0||ny<0||nx>=N||ny>=N)return;
  const ni=ny*N+nx;if(wall.has(ni))return;p=ni;draw();
  if(p===N*N-1)showEnd('Escaped!','Maze complete');
}
[['u',0,-1],['d',0,1],['l',-1,0],['r',1,0]].forEach(([id,a,b])=>document.getElementById(id).onclick=()=>move(a,b));
window.onGameStart=function(){wall=new Set();for(let i=0;i<18;i++)wall.add(Math.floor(Math.random()*N*N));
  wall.delete(0);wall.delete(N*N-1);p=0;draw()};
<\/script>`, 'Reach the gold');

add('aim', 'Aim Trainer', `canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="280"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let tx,ty,sc,t0,over;
function place(){tx=30+Math.random()*220;ty=30+Math.random()*220}
c.onclick=e=>{if(!window.__gameRunning||over)return;
  const r=c.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(c.width/r.width),my=(e.clientY-r.top)*(c.height/r.height);
  if(Math.hypot(mx-tx,my-ty)<24){sc++;place()}};
function loop(){
  if(!window.__gameRunning){requestAnimationFrame(loop);return}
  const left=Math.max(0,15-((Date.now()-t0)/1000));
  if(left<=0&&!over){over=true;showEnd('Done','Hits '+sc)}
  x.fillStyle='#0d1117';x.fillRect(0,0,280,280);
  if(!over){x.fillStyle='#ef4444';x.beginPath();x.arc(tx,ty,18,0,6.28);x.fill()}
  x.fillStyle='#fff';x.fillText(sc+' hits · '+left.toFixed(1)+'s',8,14);
  requestAnimationFrame(loop);
}
window.onGameStart=function(){sc=0;over=false;t0=Date.now();place();loop()};
<\/script>`, '15s · tap targets');

add('wordguess', 'Word Guess',
`#w{letter-spacing:8px;font-size:22px;text-align:center;margin:12px;font-weight:700}`,
`<div id="w"></div><input id="g" maxlength="1" placeholder="Letter"/><button id="ok" style="width:100%">Guess</button><p id="m" class="score"></p>
<script>
const words=['APPLE','HOUSE','PLANE','ROBOT','MUSIC','CLOUD','LIGHT','TIGER','SMILE','DREAM'];
let word,got,hp;
function show(){document.getElementById('w').textContent=word.split('').map(c=>got.has(c)?c:'_').join(' ')}
window.onGameStart=function(){
  word=words[Math.floor(Math.random()*words.length)];got=new Set([word[0]]);hp=7;
  document.getElementById('m').textContent='Starts with '+word[0]+' · lives '+hp;
  show();
};
document.getElementById('ok').onclick=()=>{
  if(!window.__gameRunning)return;
  const ch=(document.getElementById('g').value||'').toUpperCase()[0];document.getElementById('g').value='';
  if(!ch)return;if(word.includes(ch))got.add(ch);else hp--;
  show();document.getElementById('m').textContent='Lives '+hp;
  if([...word].every(c=>got.has(c)))showEnd('You Win!',word);
  if(hp<=0)showEnd('Lost',word);
};
<\/script>`, 'First letter shown');

add('mathduel', 'Speed Math',
`#q{font-size:24px;text-align:center;margin:12px}`,
`<div id="q"></div><div class="grid2" id="o"></div><p id="m" class="score"></p>
<script>
let sc,ans,t0;
function round(){
  if(!window.__gameRunning)return;
  if((Date.now()-t0)/1000>25){showEnd('Time!','Score '+sc);return}
  const a=1+Math.floor(Math.random()*12),b=1+Math.floor(Math.random()*12);
  ans=a+b;document.getElementById('q').textContent=a+' + '+b;
  const opts=new Set([ans]);while(opts.size<4)opts.add(ans+Math.floor(Math.random()*9)-4);
  const box=document.getElementById('o');box.innerHTML='';
  [...opts].sort(()=>Math.random()-0.5).forEach(v=>{const b=document.createElement('button');b.textContent=v;
    b.onclick=()=>{if(v===ans)sc++;document.getElementById('m').textContent='Score '+sc;round()};box.appendChild(b)});
}
window.onGameStart=function(){sc=0;t0=Date.now();document.getElementById('m').textContent='25 seconds';round()};
<\/script>`, '25s · add fast');

add('taprace', 'Tap Race',
`#bar{height:16px;background:#1a2430;border-radius:8px;overflow:hidden;margin:12px 0}
#fill{height:100%;width:0;background:#25D366}`,
`<div id="bar"><div id="fill"></div></div>
<button id="t" style="width:100%;height:64px">TAP</button><p id="m" class="score"></p>
<script>
let n,on;
window.onGameStart=function(){n=0;on=false;document.getElementById('fill').style.width='0';document.getElementById('m').textContent='Tap as fast as you can'};
document.getElementById('t').onclick=()=>{
  if(!window.__gameRunning)return;
  if(!on){on=true;n=0;const t0=Date.now();
    const iv=setInterval(()=>{
      const p=Math.min(1,(Date.now()-t0)/5000);
      document.getElementById('fill').style.width=(p*100)+'%';
      if(p>=1){clearInterval(iv);on=false;showEnd('Done!',n+' taps · '+((n/5)|0)+'/s')}
    },40)}
  if(on)n++;
};
<\/script>`, '5 second rush');

add('pattern', 'Pattern Memory',
`.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pad{height:52px;border-radius:12px;border:0;background:#1a2430}`,
`<div class="grid" id="g"></div><p id="m" class="score"></p>
<script>
let seq,player,lock,pads;
async function flash(i){pads[i].style.background='#3b82f6';await new Promise(r=>setTimeout(r,280));pads[i].style.background='#1a2430'}
async function next(){seq.push(Math.floor(Math.random()*9));lock=true;document.getElementById('m').textContent='Watch';
  for(const i of seq){await flash(i);await new Promise(r=>setTimeout(r,100))}player=[];lock=false;document.getElementById('m').textContent='Your turn · L'+seq.length}
window.onGameStart=function(){
  seq=[];player=[];lock=true;
  const g=document.getElementById('g');g.innerHTML='';pads=[];
  for(let i=0;i<9;i++){const b=document.createElement('button');b.className='pad';
    b.onclick=async()=>{if(!window.__gameRunning||lock)return;await flash(i);player.push(i);
      if(player[player.length-1]!==seq[player.length-1]){showEnd('Wrong','Level '+(seq.length-1));return}
      if(player.length===seq.length)setTimeout(next,400)};
    g.appendChild(b);pads.push(b)}
  setTimeout(next,400);
};
<\/script>`, 'Repeat the flashes');

add('platform', 'Runner',
`canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="180"></canvas><button id="j" style="width:100%">Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let py,vy,sc,obs,dead,raf;
document.getElementById('j').onclick=()=>{if(window.__gameRunning&&!dead&&py>=140)vy=-7.5};
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.fillStyle='#0d1117';x.fillRect(0,0,280,180);
  x.fillStyle='#334155';x.fillRect(0,156,280,24);
  x.fillStyle='#ef4444';x.fillRect(obs,136,16,20);
  x.fillStyle='#25D366';x.fillRect(36,py,14,14);
  if(!dead){vy+=0.38;py+=vy;if(py>140){py=140;vy=0}
    obs-=2.2+sc*0.015;if(obs<-20){obs=300;sc++}
    if(obs<50&&obs>22&&py>128){dead=true;showEnd('Crashed','Score '+sc)}}
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){py=140;vy=0;sc=0;obs=280;dead=false;cancelAnimationFrame(raf);loop()};
<\/script>`, 'Starts slow · speeds up');

add('oddone', 'Odd One Out',
`.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}button{font-size:28px;height:68px;background:#1a2430;color:#fff}`,
`<div class="grid" id="g"></div><p id="m" class="score"></p>
<script>
const sets=[['🍎','🍎','🍎','🍏'],['🐶','🐶','🐱','🐶'],['⭐','☆','⭐','⭐'],['🔺','🔺','🔻','🔺'],['🔵','🔵','🔵','🟢']];
let sc;
function round(){
  if(!window.__gameRunning)return;
  const s=sets[Math.floor(Math.random()*sets.length)].slice();
  const odd=s.findIndex((v,i,a)=>a.filter(x=>x===v).length===1);
  const g=document.getElementById('g');g.innerHTML='';
  s.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v;
    b.onclick=()=>{if(i===odd)sc++;else sc=Math.max(0,sc-1);document.getElementById('m').textContent='Score '+sc;
      if(sc>=8)showEnd('Great!','Score '+sc);else round()};g.appendChild(b)});
}
window.onGameStart=function(){sc=0;document.getElementById('m').textContent='Score 0 · get 8';round()};
<\/script>`, 'Find the different one');

add('counter', 'Tally',
`#n{font-size:48px;text-align:center;margin:16px}`,
`<div id="n">0</div><div class="row"><button id="p" style="flex:1">+1</button><button id="m" class="sec" style="flex:1">−1</button><button id="r" class="sec" style="flex:1">0</button></div>
<script>
let n;
window.onGameStart=function(){n=0;document.getElementById('n').textContent='0'};
document.getElementById('p').onclick=()=>{if(!window.__gameRunning)return;n++;document.getElementById('n').textContent=n};
document.getElementById('m').onclick=()=>{if(!window.__gameRunning)return;n--;document.getElementById('n').textContent=n};
document.getElementById('r').onclick=()=>{n=0;document.getElementById('n').textContent=n};
<\/script>`, 'Count anything');

add('luck', 'Lucky Number', ``,
`<button id="g" style="width:100%;height:80px;font-size:16px">Reveal</button><p id="m" style="text-align:center;font-size:22px;margin-top:16px"></p>
<script>
window.onGameStart=function(){document.getElementById('m').textContent=''};
document.getElementById('g').onclick=()=>{
  if(!window.__gameRunning)return;
  const n=1+Math.floor(Math.random()*99);
  const msg=n>80?'🔥 Hot':n>50?'✨ Good':n>20?'🌙 Okay':'🧊 Cold';
  document.getElementById('m').textContent=n+' · '+msg;
};
<\/script>`, 'Your luck today');

add('drawpad', 'Sketch',
`canvas{width:100%;max-width:300px;background:#fff}`,
`<canvas id="c" width="300" height="240"></canvas>
<div class="row"><button data-c="#111">Ink</button><button data-c="#ef4444">Red</button><button data-c="#25D366">Green</button><button id="clr" class="sec">Clear</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');let draw=false,col='#111';x.lineWidth=3;x.lineCap='round';
function pos(e){const r=c.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}}
c.onpointerdown=e=>{if(!window.__gameRunning)return;draw=true;const p=pos(e);x.beginPath();x.moveTo(p.x,p.y)};
c.onpointerup=()=>draw=false;
c.onpointermove=e=>{if(!draw)return;const p=pos(e);x.strokeStyle=col;x.lineTo(p.x,p.y);x.stroke()};
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>col=b.dataset.c);
document.getElementById('clr').onclick=()=>x.clearRect(0,0,300,240);
window.onGameStart=function(){x.clearRect(0,0,300,240)};
<\/script>`, 'Draw on the pad');


add('frog', 'Hop',
`canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="200"></canvas><button id="j" style="width:100%">Hop</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y,vy,cars,sc,dead,raf;
document.getElementById('j').onclick=()=>{if(window.__gameRunning&&!dead&&y>=160)vy=-8};
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.fillStyle='#0f172a';x.fillRect(0,0,280,200);
  x.fillStyle='#1e293b';x.fillRect(0,80,280,40);
  cars.forEach(c0=>{c0.x+=c0.v;if(c0.x>300)c0.x=-40;if(c0.x<-40)c0.x=300;
    x.fillStyle='#ef4444';x.fillRect(c0.x,c0.y,28,14);
    if(Math.abs(c0.x-20)<24&&Math.abs(c0.y-y)<16){dead=true;showEnd('Squished','Score '+sc)}});
  if(!dead){vy+=0.4;y+=vy;if(y>160){y=160;vy=0}if(y<20){y=160;sc++;setStat('Score '+sc)}}
  x.fillStyle='#22c55e';x.fillRect(20,y,14,14);
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){y=160;vy=0;sc=0;dead=false;cars=[{x:0,y:90,v:2},{x:200,y:110,v:-2.5}];setStat('Score 0');cancelAnimationFrame(raf);loop()};
<\/script>`, 'Cross the road');

add('match3', 'Match Color',
`.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.c{aspect-ratio:1;border:0;border-radius:10px}`,
`<div class="grid" id="g"></div>
<script>
const cols=['#ef4444','#22c55e','#3b82f6','#eab308'];
let board,sel,sc;
function draw(){const g=document.getElementById('g');g.innerHTML='';
  board.forEach((c,i)=>{const b=document.createElement('button');b.className='c';b.style.background=c;
    b.onclick=()=>{if(!window.__gameRunning)return;if(sel<0){sel=i;b.style.outline='2px solid #fff'}
      else{const j=sel;sel=-1;[board[i],board[j]]=[board[j],board[i]];
        // simple clear matches of 3 in row
        for(let r=0;r<4;r++){const row=board.slice(r*4,r*4+4);if(row.every(x=>x===row[0])){sc+=3;for(let k=0;k<4;k++)board[r*4+k]=cols[Math.floor(Math.random()*4)]}}
        setStat('Score '+sc);if(sc>=15)showEnd('Nice!','Score '+sc);draw()}}};
    g.appendChild(b)})}
window.onGameStart=function(){board=Array.from({length:16},()=>cols[Math.floor(Math.random()*4)]);sel=-1;sc=0;setStat('Score 0');draw()};
<\/script>`, 'Swap · match 3');

add('bounce2', 'Keep Up',
`canvas{width:100%;max-width:280px}`,
`<canvas id="c" width="280" height="240"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let bx,by,vx,vy,px,sc,raf;
c.onpointermove=e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)*(c.width/r.width)-28};
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.fillStyle='#0f172a';x.fillRect(0,0,280,240);
  x.fillStyle='#10b981';x.fillRect(px,220,56,8);
  bx+=vx;by+=vy;vy+=0.15;
  if(bx<8||bx>272)vx*=-1;if(by<8)vy=Math.abs(vy);
  if(by>212&&bx>px&&bx<px+56){vy=-6-Math.random();sc++;setStat('Score '+sc)}
  if(by>250)showEnd('Dropped','Score '+sc);
  x.fillStyle='#f8fafc';x.beginPath();x.arc(bx,by,8,0,6.28);x.fill();
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){bx=140;by=80;vx=2;vy=1;px=110;sc=0;setStat('Score 0');cancelAnimationFrame(raf);loop()};
<\/script>`, 'Keep the ball up');


const ALIASES = Object.keys(G);
module.exports = {
  name: 'games-extra',
  pattern: 'games2',
  aliases: ALIASES,
  desc: 'More HTML games',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'games2') {
      const names = ALIASES.map((a) => '.' + a);
      let text = '┏ ' + style('MORE GAMES') + '\n';
      for (let i = 0; i < names.length; i += 3) text += '┃ ' + names.slice(i, i + 3).join(' ') + '\n';
      text += '┗ .games for pack 1';
      return reply(text);
    }
    if (!G[cmd]) return reply('Unknown. .games2');
    await sendHtmlApp(sock, jid, G[cmd], T[cmd] || cmd);
  },
};
