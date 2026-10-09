const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const G = {};

G.snake = shell('Snake', `canvas{display:block;margin:0 auto;background:#111;width:100%;max-width:320px}
.row{display:flex;justify-content:center;flex-wrap:wrap;gap:4px;margin-top:6px}`,
`<canvas id="c" width="320" height="320"></canvas>
<div class="row">
<button id="u">▲</button></div><div class="row">
<button id="l">◀</button><button id="r">▶</button></div><div class="row">
<button id="d">▼</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d'),S=16,N=20;
let snake=[{x:10,y:10}],dir={x:1,y:0},food={x:5,y:5},dead=false,sc=0;
function place(){food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}
function turn(nx,ny){if(dir.x+nx||dir.y+ny){dir={x:nx,y:ny}}}
[['u',0,-1],['d',0,1],['l',-1,0],['r',1,0]].forEach(([id,a,b])=>document.getElementById(id).onclick=()=>turn(a,b));
setInterval(()=>{
  if(dead)return;
  const h={x:(snake[0].x+dir.x+N)%N,y:(snake[0].y+dir.y+N)%N};
  if(snake.some(s=>s.x===h.x&&s.y===h.y)){dead=true;return}
  snake.unshift(h);
  if(h.x===food.x&&h.y===food.y){sc++;place()}else snake.pop();
  x.fillStyle='#111';x.fillRect(0,0,320,320);
  x.fillStyle='#ef4444';x.fillRect(food.x*S,food.y*S,S-1,S-1);
  x.fillStyle='#25D366';snake.forEach(s=>x.fillRect(s.x*S,s.y*S,S-1,S-1));
  x.fillStyle='#fff';x.font='12px system-ui';x.fillText('Score '+sc+(dead?' · Game Over':''),6,14);
},120);
<\/script>`);

G.tetris = shell('Tetris', `canvas{display:block;margin:0 auto;background:#111}
.row{display:flex;justify-content:center;gap:4px;margin-top:6px}`,
`<canvas id="c" width="200" height="400"></canvas>
<div class="row"><button id="L">◀</button><button id="R">▶</button><button id="O">⟳</button><button id="D">▼</button></div>
<script>
const C=document.getElementById('c'),x=C.getContext('2d'),W=10,H=20,S=20;
const SH=[
 [[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]
];
let grid=Array.from({length:H},()=>Array(W).fill(0)),p=null,sc=0,over=false;
function neu(){const s=SH[Math.floor(Math.random()*SH.length)].map(r=>r.slice());p={s,x:3,y:0};if(hit(0,0))over=true}
function hit(dx,dy,s=p.s){for(let y=0;y<s.length;y++)for(let x0=0;x0<s[y].length;x0++)if(s[y][x0]&&(p.y+y+dy>=H||p.x+x0+dx<0||p.x+x0+dx>=W||grid[p.y+y+dy][p.x+x0+dx]))return true;return false}
function merge(){for(let y=0;y<p.s.length;y++)for(let x0=0;x0<p.s[y].length;x0++)if(p.s[y][x0])grid[p.y+y][p.x+x0]=1;
  grid=grid.filter(r=>r.some(v=>!v));while(grid.length<H)grid.unshift(Array(W).fill(0));sc++;neu()}
function rot(){const s=p.s[0].map((_,i)=>p.s.map(r=>r[i]).reverse());if(!hit(0,0,s))p.s=s}
function draw(){x.fillStyle='#111';x.fillRect(0,0,200,400);
  for(let y=0;y<H;y++)for(let x0=0;x0<W;x0++)if(grid[y][x0]){x.fillStyle='#3b82f6';x.fillRect(x0*S,y*S,S-1,S-1)}
  if(p)for(let y=0;y<p.s.length;y++)for(let x0=0;x0<p.s[y].length;x0++)if(p.s[y][x0]){x.fillStyle='#25D366';x.fillRect((p.x+x0)*S,(p.y+y)*S,S-1,S-1)}
  x.fillStyle='#fff';x.font='12px system-ui';x.fillText('Score '+sc+(over?' · Over':''),6,14)}
document.getElementById('L').onclick=()=>{if(!hit(-1,0))p.x--};document.getElementById('R').onclick=()=>{if(!hit(1,0))p.x++};
document.getElementById('D').onclick=()=>{if(!hit(0,1))p.y++;else merge()};document.getElementById('O').onclick=rot;
neu();setInterval(()=>{if(over)return;if(!hit(0,1))p.y++;else merge();draw()},500);draw();
<\/script>`);

G.pong = shell('Pong', `canvas{display:block;margin:0 auto;background:#111;width:100%;max-width:360px}`,
`<canvas id="c" width="360" height="220"></canvas>
<p style="font-size:12px;opacity:.7">Drag / touch to move paddle</p>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px=150,bx=180,by=110,vx=3,vy=2,sc=0;
c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)*(c.width/r.width)-30});
function loop(){
  x.fillStyle='#111';x.fillRect(0,0,360,220);
  x.fillStyle='#25D366';x.fillRect(px,200,60,8);
  x.fillStyle='#fff';x.beginPath();x.arc(bx,by,6,0,6.28);x.fill();
  bx+=vx;by+=vy;
  if(bx<6||bx>354)vx*=-1;if(by<6)vy*=-1;
  if(by>194&&bx>px&&bx<px+60){vy=-Math.abs(vy);sc++}
  if(by>220){bx=180;by=110;vy=2;sc=0}
  x.fillText('Score '+sc,8,14);
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

G.breakout = shell('Breakout', `canvas{display:block;margin:0 auto;background:#111;width:100%;max-width:360px}`,
`<canvas id="c" width="360" height="280"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px=150,bx=180,by=200,vx=2.5,vy=-2.5,br=[];
for(let r=0;r<4;r++)for(let c0=0;c0<8;c0++)br.push({x:c0*44+8,y:r*18+30,a:1});
c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)*(c.width/r.width)-30});
function loop(){
  x.fillStyle='#111';x.fillRect(0,0,360,280);
  x.fillStyle='#25D366';x.fillRect(px,260,60,8);
  br.forEach(b=>{if(!b.a)return;x.fillStyle='#3b82f6';x.fillRect(b.x,b.y,40,14);
    if(bx>b.x&&bx<b.x+40&&by>b.y&&by<b.y+14){b.a=0;vy*=-1}});
  x.fillStyle='#fff';x.beginPath();x.arc(bx,by,5,0,6.28);x.fill();
  bx+=vx;by+=vy;if(bx<5||bx>355)vx*=-1;if(by<5)vy*=-1;
  if(by>255&&bx>px&&bx<px+60)vy=-Math.abs(vy);
  if(by>280){bx=180;by=200;vy=-2.5}
  requestAnimationFrame(loop);
}
loop();
<\/script>`);

G.flappy = shell('Flappy', `canvas{display:block;margin:0 auto;background:#87ceeb;width:100%;max-width:320px}`,
`<canvas id="c" width="320" height="400"></canvas>
<button id="j" style="width:100%;margin-top:6px">Tap / Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=200,vy=0,pipes=[{x:320,g:150}],sc=0,dead=false;
function jump(){if(!dead)vy=-6}
document.getElementById('j').onclick=jump;c.onclick=jump;
setInterval(()=>{
  if(dead)return;
  y+=vy;vy+=0.35;
  pipes.forEach(p=>p.x-=2);
  if(pipes[0].x<-40){pipes.shift();pipes.push({x:320,g:80+Math.random()*180});sc++}
  const p=pipes[0];
  if(p.x<60&&p.x>20&&(y<p.g||y>p.g+90))dead=true;
  if(y>400||y<0)dead=true;
  x.fillStyle='#87ceeb';x.fillRect(0,0,320,400);
  x.fillStyle='#166534';pipes.forEach(p=>{x.fillRect(p.x,0,36,p.g);x.fillRect(p.x,p.g+90,36,400)});
  x.fillStyle='#eab308';x.fillRect(40,y,20,20);
  x.fillStyle='#000';x.fillText('Score '+sc+(dead?' · Dead':''),8,16);
},20);
<\/script>`);

G.memory = shell('Memory', `.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.card{aspect-ratio:1;border:0;border-radius:12px;background:#1f2c34;color:#e9edef;font-size:22px}`,
`<div class="grid" id="g"></div><p id="m" style="font-size:12px;opacity:.8"></p>
<script>
const icons=['🍎','🍌','🍇','🍉','🍒','🥝','🍑','🍋',...['🍎','🍌','🍇','🍉','🍒','🥝','🍑','🍋']].sort(()=>Math.random()-0.5);
let open=[],lock=false,done=0;
const g=document.getElementById('g');
icons.forEach((ic,i)=>{
  const b=document.createElement('button');b.className='card';b.dataset.i=i;b.textContent='❓';
  b.onclick=()=>{
    if(lock||b.dataset.on)return;b.textContent=ic;b.dataset.on=1;open.push(b);
    if(open.length===2){
      lock=true;
      const [a,c]=open;
      if(a.textContent===c.textContent){done++;open=[];lock=false;if(done===8)document.getElementById('m').textContent='Cleared!'}
      else setTimeout(()=>{a.textContent='❓';c.textContent='❓';delete a.dataset.on;delete c.dataset.on;open=[];lock=false},500);
    }
  };
  g.appendChild(b);
});
<\/script>`);

G.mines = shell('Minesweeper', `.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:3px}
.cell{aspect-ratio:1;border:0;border-radius:8px;background:#1f2c34;color:#e9edef;font-size:12px;font-weight:700}`,
`<div class="grid" id="g"></div>
<script>
const W=8,H=8,M=10,g=document.getElementById('g');
const board=Array.from({length:H},()=>Array(W).fill(0));
const mine=new Set();
while(mine.size<M)mine.add(Math.floor(Math.random()*W*H));
mine.forEach(i=>{const y=i/W|0,x=i%W;board[y][x]=-1;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<H&&nx>=0&&nx<W&&board[ny][nx]>=0)board[ny][nx]++}});
const cells=[];
function open(y,x){
  const i=y*W+x,b=cells[i];if(b.disabled)return;b.disabled=true;
  if(board[y][x]===-1){b.textContent='💣';b.style.background='#7f1d1d';return}
  b.textContent=board[y][x]||'';b.style.background='#14532d';
  if(!board[y][x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<H&&nx>=0&&nx<W)open(ny,nx)}
}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const b=document.createElement('button');b.className='cell';
  b.onclick=()=>open(y,x);g.appendChild(b);cells.push(b);
}
<\/script>`);

G.react = shell('Reaction', ``,
`<p id="s" style="font-size:14px">Tap START, wait for green, then tap fast.</p>
<button id="b" style="width:100%;height:120px;font-size:18px;background:#1f2c34;color:#fff">START</button>
<script>
let t0=0,mode='idle';
const b=document.getElementById('b'),s=document.getElementById('s');
b.onclick=()=>{
  if(mode==='idle'){mode='wait';b.style.background='#7f1d1d';b.textContent='Wait…';s.textContent='Wait for green…';
    setTimeout(()=>{mode='go';t0=performance.now();b.style.background='#25D366';b.textContent='TAP!'},1000+Math.random()*2000)}
  else if(mode==='wait'){mode='idle';b.style.background='#1f2c34';b.textContent='START';s.textContent='Too early!'}
  else if(mode==='go'){const ms=(performance.now()-t0)|0;mode='idle';b.style.background='#1f2c34';b.textContent='START';s.textContent='Reaction: '+ms+' ms'}
};
<\/script>`);

G.rps = shell('Rock Paper Scissors', `.row{display:flex;gap:8px;justify-content:center}button{flex:1;height:64px;font-size:22px}`,
`<div class="row"><button data-c="🪨">🪨</button><button data-c="📄">📄</button><button data-c="✂️">✂️</button></div>
<p id="o" style="text-align:center;margin-top:12px">Pick one</p>
<script>
const beats={'🪨':'✂️','📄':'🪨','✂️':'📄'};
document.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  const you=b.dataset.c,bot=['🪨','📄','✂️'][Math.floor(Math.random()*3)];
  let r=you===bot?'Draw':beats[you]===bot?'You win':'Bot wins';
  document.getElementById('o').textContent=you+' vs '+bot+' · '+r;
});
<\/script>`);

G.simon = shell('Simon', `.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:240px;margin:0 auto}
.pad{height:80px;border:0;border-radius:16px;opacity:.85}`,
`<div class="grid">
<button class="pad" id="0" style="background:#22c55e"></button>
<button class="pad" id="1" style="background:#ef4444"></button>
<button class="pad" id="2" style="background:#eab308"></button>
<button class="pad" id="3" style="background:#3b82f6"></button>
</div><p id="m" style="text-align:center">Watch · then repeat</p>
<script>
let seq=[],player=[],lock=false;
const m=document.getElementById('m');
async function flash(i){const el=document.getElementById(i);el.style.opacity=1;await new Promise(r=>setTimeout(r,350));el.style.opacity=.5}
async function play(){lock=true;for(const i of seq){await flash(i);await new Promise(r=>setTimeout(r,150))}lock=false;player=[];m.textContent='Your turn · level '+seq.length}
function next(){seq.push(Math.floor(Math.random()*4));play()}
for(let i=0;i<4;i++)document.getElementById(i).onclick=async()=>{
  if(lock)return;await flash(i);player.push(i);
  if(player[player.length-1]!==seq[player.length-1]){m.textContent='Wrong! Score '+ (seq.length-1);seq=[];setTimeout(next,800);return}
  if(player.length===seq.length){m.textContent='Good!';setTimeout(next,600)}
};
document.getElementById(0).style.opacity=.5;document.getElementById(1).style.opacity=.5;document.getElementById(2).style.opacity=.5;document.getElementById(3).style.opacity=.5;
next();
<\/script>`);

G.2048 = shell('2048', `.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:280px;margin:8px auto}
.cell{aspect-ratio:1;background:#1f2c34;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px}
.row{display:flex;justify-content:center;gap:4px}`,
`<div class="grid" id="g"></div>
<div class="row"><button id="u">▲</button></div>
<div class="row"><button id="l">◀</button><button id="r">▶</button></div>
<div class="row"><button id="d">▼</button></div>
<script>
let b=Array(16).fill(0);
function spawn(){const e=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(!e.length)return;b[e[Math.floor(Math.random()*e.length)]]=Math.random()<0.9?2:4}
function slide(line){const a=line.filter(Boolean);for(let i=0;i<a.length-1;i++)if(a[i]===a[i+1]){a[i]*=2;a[i+1]=0}const c=a.filter(Boolean);while(c.length<4)c.push(0);return c}
function move(dir){
  let n=b.slice();
  for(let i=0;i<4;i++){
    let line;
    if(dir==='l')line=slide([0,1,2,3].map(x=>n[i*4+x]));
    if(dir==='r')line=slide([3,2,1,0].map(x=>n[i*4+x])).reverse();
    if(dir==='u')line=slide([0,1,2,3].map(y=>n[y*4+i]));
    if(dir==='d')line=slide([3,2,1,0].map(y=>n[y*4+i])).reverse();
    if(dir==='l'||dir==='r')line.forEach((v,x)=>n[i*4+x]=v);
    else line.forEach((v,y)=>n[y*4+i]=v);
  }
  if(n.some((v,i)=>v!==b[i])){b=n;spawn();draw()}
}
function draw(){const g=document.getElementById('g');g.innerHTML='';b.forEach(v=>{const d=document.createElement('div');d.className='cell';d.textContent=v||'';d.style.background=v?'#14532d':'#1f2c34';g.appendChild(d)})}
[['l','l'],['r','r'],['u','u'],['d','d']].forEach(([id,dir])=>document.getElementById(id).onclick=()=>move(dir));
spawn();spawn();draw();
<\/script>`);

G.paint = shell('Paint', `canvas{display:block;margin:0 auto;background:#fff;width:100%;max-width:360px;border-radius:12px}
.row{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}`,
`<canvas id="c" width="360" height="280"></canvas>
<div class="row">
<button data-c="#000">Blk</button><button data-c="#ef4444">Red</button><button data-c="#25D366">Grn</button>
<button data-c="#3b82f6">Blu</button><button id="clr">Clear</button>
</div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');let draw=false,col='#000';
x.lineWidth=3;x.lineCap='round';
function pos(e){const r=c.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}}
c.onpointerdown=e=>{draw=true;const p=pos(e);x.beginPath();x.moveTo(p.x,p.y)};
c.onpointerup=()=>draw=false;c.onpointermove=e=>{if(!draw)return;const p=pos(e);x.strokeStyle=col;x.lineTo(p.x,p.y);x.stroke()};
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>col=b.dataset.c);
document.getElementById('clr').onclick=()=>x.clearRect(0,0,360,280);
<\/script>`);

G.timer = shell('Timer', `input{width:100%;padding:10px;border-radius:12px;border:0;background:#1f2c34;color:#fff;font-size:18px;margin:6px 0}
#disp{font-size:40px;text-align:center;margin:12px 0}`,
`<div id="disp">00:00</div>
<input id="sec" type="number" placeholder="Seconds" value="60"/>
<button id="go" style="width:100%">Start</button>
<script>
let t=null,left=0;
const disp=document.getElementById('disp');
function show(){const m=String(Math.floor(left/60)).padStart(2,'0');const s=String(left%60).padStart(2,'0');disp.textContent=m+':'+s}
document.getElementById('go').onclick=()=>{
  clearInterval(t);left=Math.max(1,Number(document.getElementById('sec').value)||60);show();
  t=setInterval(()=>{left--;show();if(left<=0){clearInterval(t);disp.textContent='Done!'}},1000);
};
<\/script>`);

G.calc = shell('Calculator', `.disp{background:#1f2c34;padding:12px;border-radius:12px;font-size:22px;text-align:right;margin-bottom:8px;min-height:40px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}button{padding:14px 0;font-size:16px;background:#1f2c34;color:#fff}`,
`<div class="disp" id="d">0</div><div class="grid" id="g"></div>
<script>
const keys=['C','←','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','='];
let cur='0';const d=document.getElementById('d'),g=document.getElementById('g');
keys.slice(0,19).forEach(k=>{
  const b=document.createElement('button');b.textContent=k;
  b.onclick=()=>{
    if(k==='C')cur='0';
    else if(k==='←')cur=cur.length>1?cur.slice(0,-1):'0';
    else if(k==='='){try{cur=String(Function('return '+cur)())}catch(e){cur='Err'}}
    else cur=(cur==='0'&&k!=='.')?k:cur+k;
    d.textContent=cur;
  };
  g.appendChild(b);
});
<\/script>`);

G.dice = shell('Dice', `#face{font-size:72px;text-align:center;margin:20px}`,
`<div id="face">🎲</div><button id="r" style="width:100%">Roll</button>
<p id="m" style="text-align:center"></p>
<script>
const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
document.getElementById('r').onclick=()=>{
  let n=0;const t=setInterval(()=>{document.getElementById('face').textContent=faces[Math.floor(Math.random()*6)];if(++n>12){clearInterval(t);
    const v=1+Math.floor(Math.random()*6);document.getElementById('face').textContent=faces[v-1];document.getElementById('m').textContent='You rolled '+v}},50);
};
<\/script>`);

G.coin = shell('Coin Flip', `#face{font-size:64px;text-align:center;margin:24px}`,
`<div id="face">🪙</div><button id="r" style="width:100%">Flip</button>
<p id="m" style="text-align:center"></p>
<script>
document.getElementById('r').onclick=()=>{
  const v=Math.random()<0.5?'Heads':'Tails';
  document.getElementById('face').textContent=v==='Heads'?'🟢':'🔴';
  document.getElementById('m').textContent=v;
};
<\/script>`);

G.typing = shell('Typing Test', `textarea{width:100%;height:80px;border-radius:12px;border:0;background:#1f2c34;color:#fff;padding:10px}
#src{opacity:.85;font-size:13px;margin-bottom:8px}`,
`<div id="src"></div><textarea id="t" placeholder="Type here…"></textarea>
<p id="m"></p>
<script>
const samples=['The quick brown fox jumps over the lazy dog','WhatsApp mini apps run HTML inside the chat bubble','Practice typing every day to improve speed and accuracy'];
const src=samples[Math.floor(Math.random()*samples.length)];
document.getElementById('src').textContent=src;
const t0=Date.now();
document.getElementById('t').oninput=e=>{
  const v=e.target.value;if(v===src){const s=(Date.now()-t0)/1000;const wpm=((src.split(' ').length/s)*60)|0;document.getElementById('m').textContent='Done! ~'+wpm+' WPM'};
};
<\/script>`);

G.whack = shell('Whack-a-Mole', `.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hole{aspect-ratio:1;border:0;border-radius:50%;background:#1f2c34;font-size:28px}`,
`<div class="grid" id="g"></div><p id="m">Score 0</p>
<script>
let sc=0,cur=-1;
const g=document.getElementById('g'),holes=[];
for(let i=0;i<9;i++){const b=document.createElement('button');b.className='hole';b.textContent='';
  b.onclick=()=>{if(i===cur){sc++;document.getElementById('m').textContent='Score '+sc;cur=-1;b.textContent=''}};
  g.appendChild(b);holes.push(b)}
setInterval(()=>{holes.forEach(h=>h.textContent='');cur=Math.floor(Math.random()*9);holes[cur].textContent='🐹'},800);
<\/script>`);

G.sudoku = shell('Sudoku Mini', `.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-width:240px;margin:0 auto}
input{aspect-ratio:1;text-align:center;font-size:18px;border:0;border-radius:8px;background:#1f2c34;color:#fff}`,
`<div class="grid" id="g"></div><button id="c" style="width:100%;margin-top:8px">Check</button><p id="m"></p>
<script>
// Simple 4x4 puzzle
const puzzle=[1,0,0,4, 0,0,1,0, 0,4,0,0, 2,0,0,3];
const sol=[1,3,2,4, 4,2,1,3, 3,4,1,2, 2,1,4,3];
const g=document.getElementById('g'),inputs=[];
puzzle.forEach((v,i)=>{const inp=document.createElement('input');inp.maxLength=1;
  if(v){inp.value=v;inp.disabled=true;inp.style.opacity='.7'}
  g.appendChild(inp);inputs.push(inp)});
document.getElementById('c').onclick=()=>{
  const ok=inputs.every((el,i)=>Number(el.value)===sol[i]);
  document.getElementById('m').textContent=ok?'Solved!':'Not yet';
};
<\/script>`);

G.lights = shell('Lights Out', `.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:200px;margin:0 auto}
.cell{aspect-ratio:1;border:0;border-radius:12px}`,
`<div class="grid" id="g"></div><p id="m">Turn all lights off</p>
<script>
let state=Array(9).fill(0).map(()=>Math.random()<.5?1:0);
const g=document.getElementById('g'),btns=[];
function render(){btns.forEach((b,i)=>{b.style.background=state[i]?'#eab308':'#1f2c34'});
  if(state.every(v=>!v))document.getElementById('m').textContent='Cleared!'}
function toggle(i){state[i]^=1;[i-1,i+1,i-3,i+3].forEach(j=>{if(j>=0&&j<9&&Math.abs((j%3)-(i%3))<=1)state[j]^=1});render()}
for(let i=0;i<9;i++){const b=document.createElement('button');b.className='cell';b.onclick=()=>toggle(i);g.appendChild(b);btns.push(b)}
render();
<\/script>`);

// Titles for sendHtmlApp
const TITLES = {
  snake: 'Snake', tetris: 'Tetris', pong: 'Pong', breakout: 'Breakout', flappy: 'Flappy',
  memory: 'Memory', mines: 'Minesweeper', react: 'Reaction', rps: 'RPS', simon: 'Simon',
  '2048': '2048', paint: 'Paint', timer: 'Timer', calc: 'Calculator', dice: 'Dice',
  coin: 'Coin Flip', typing: 'Typing Test', whack: 'Whack-a-Mole', sudoku: 'Sudoku Mini', lights: 'Lights Out',
};

const ALIASES = Object.keys(G);

module.exports = {
  name: 'games-pack',
  pattern: 'games',
  aliases: ALIASES,
  desc: 'In-chat HTML games (.games list · .snake .tetris …)',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'games') {
      const list = ALIASES.map((a) => `• .${a}`).join('\n');
      return reply(`🎮 *HTML Games* (in-chat)\n\n${list}\n\nAlso: .ttt .guess .dino .quiz`);
    }
    const html = G[cmd];
    if (!html) return reply('Unknown game. Use .games');
    await sendHtmlApp(sock, jid, html, TITLES[cmd] || cmd);
  },
};
