const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');
const { style } = require('../lib/stylish');

const G = {};
const TITLES = {};
function add(id, title, css, body, opts) {
  G[id] = shell(title, css, body, opts || {});
  TITLES[id] = title;
}

// ——— SNAKE (slow, human-friendly) ———
add('snake', 'Snake',
`canvas{width:100%;max-width:300px}.pad{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;max-width:180px;margin:8px auto}
.pad button{height:40px}`,
`<canvas id="c" width="300" height="300"></canvas>
<div class="pad"><span></span><button id="u">▲</button><span></span>
<button id="l">◀</button><button id="r">▶</button><span></span>
<span></span><button id="d">▼</button><span></span></div>`,
{ hint: 'Swipe / buttons · slow speed' });

// inject snake script via separate approach - body needs script
// Fix: put script in body
G.snake = shell('Snake',
`canvas{width:100%;max-width:300px}.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:160px;margin:8px auto}.pad button{height:40px}`,
`<canvas id="c" width="300" height="300"></canvas>
<div class="pad"><i></i><button id="u">▲</button><i></i>
<button id="l">◀</button><button id="r">▶</button><i></i>
<i></i><button id="d">▼</button><i></i></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d'),N=12,S=25;
let snake,dir,food,dead,sc,iv;
function place(){food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};
  if(snake.some(s=>s.x===food.x&&s.y===food.y))place()}
function turn(nx,ny){if(dir.x+nx||dir.y+ny)dir={x:nx,y:ny}}
[['u',0,-1],['d',0,1],['l',-1,0],['r',1,0]].forEach(([id,a,b])=>document.getElementById(id).onclick=()=>turn(a,b));
function tick(){
  if(!window.__gameRunning||dead)return;
  const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(h.x<0||h.y<0||h.x>=N||h.y>=N||snake.some(s=>s.x===h.x&&s.y===h.y)){
    dead=true;clearInterval(iv);showEnd('Game Over','Score '+sc);return}
  snake.unshift(h);
  if(h.x===food.x&&h.y===food.y){sc++;place()}else snake.pop();
  x.fillStyle='#0d1117';x.fillRect(0,0,300,300);
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){x.strokeStyle='#1a2330';x.strokeRect(i*S,j*S,S,S)}
  x.fillStyle='#f43f5e';x.fillRect(food.x*S+2,food.y*S+2,S-4,S-4);
  snake.forEach((s,i)=>{x.fillStyle=i?'#22c55e':'#4ade80';x.fillRect(s.x*S+2,s.y*S+2,S-4,S-4)});
  x.fillStyle='#fff';x.font='12px system-ui';x.fillText('Score '+sc,8,14);
}
window.onGameStart=function(){
  snake=[{x:3,y:6},{x:2,y:6}];dir={x:1,y:0};dead=false;sc=0;place();
  clearInterval(iv);iv=setInterval(tick,220);tick();
};
<\/script>`,
{ hint: 'Slow pace · use arrows' });

// ——— 2048 colored tiles ———
G['2048'] = shell('2048',
`.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:280px;margin:8px auto}
.cell{aspect-ratio:1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px}
.row{display:flex;justify-content:center;gap:4px}`,
`<div class="grid" id="g"></div>
<div class="row"><button id="u">▲</button></div>
<div class="row"><button id="l">◀</button><button id="r">▶</button></div>
<div class="row"><button id="d">▼</button></div>
<script>
const COL={0:'#1a2430',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
const FG={0:'#fff',2:'#776e65',4:'#776e65'};
let b,won;
function spawn(){const e=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(!e.length)return;b[e[Math.floor(Math.random()*e.length)]]=Math.random()<0.9?2:4}
function slide(line){const a=line.filter(Boolean);for(let i=0;i<a.length-1;i++)if(a[i]===a[i+1]){a[i]*=2;if(a[i]===2048)won=true;a[i+1]=0}const c=a.filter(Boolean);while(c.length<4)c.push(0);return c}
function move(dir){
  if(!window.__gameRunning)return;
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
  if(n.some((v,i)=>v!==b[i])){b=n;spawn();draw();
    if(won)showEnd('You Win!','Reached 2048');
    else if(!b.some(v=>!v)&&!canMove())showEnd('Game Over','No moves left')}
}
function canMove(){
  for(let i=0;i<16;i++){const v=b[i];if(!v)return true;
    if(i%4<3&&b[i+1]===v)return true;if(i<12&&b[i+4]===v)return true}return false}
function draw(){const g=document.getElementById('g');g.innerHTML='';
  b.forEach(v=>{const d=document.createElement('div');d.className='cell';d.textContent=v||'';
    d.style.background=COL[v]||'#3c3a32';d.style.color=FG[v]||'#f9f6f2';g.appendChild(d)})}
[['l','l'],['r','r'],['u','u'],['d','d']].forEach(([id,dir])=>document.getElementById(id).onclick=()=>move(dir));
window.onGameStart=function(){b=Array(16).fill(0);won=false;spawn();spawn();draw()};
<\/script>`,
{ hint: 'Join tiles · colors by value' });

// ——— HANGMAN first letter hint ———
G.hangman = shell('Hangman',
`#word{letter-spacing:6px;font-size:22px;text-align:center;margin:12px 0;font-weight:700}
.letters{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.letters button{min-width:30px;padding:8px;background:#1a2430;color:#fff}`,
`<div id="hp"></div><div id="hint" class="hint"></div><div id="word"></div><div class="letters" id="L"></div>`,
{ hint: 'First letter is revealed' });
// rebuild with script
G.hangman = shell('Hangman',
`#word{letter-spacing:6px;font-size:22px;text-align:center;margin:12px 0;font-weight:700}
.letters{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.letters button{min-width:30px;padding:8px;background:#1a2430;color:#fff}`,
`<div id="hp"></div><p id="hint" class="hint"></p><div id="word"></div><div class="letters" id="L"></div>
<script>
const words=['APPLE','HOUSE','PLANE','WATER','SNAKE','TIGER','MUSIC','PHONE','LIGHT','BREAD','ROBOT','CLOUD','SMILE','DREAM','PLANT'];
let w,left,hp,guessed;
function show(){
  document.getElementById('word').textContent=w.split('').map(c=>guessed.has(c)?c:'_').join(' ');
  document.getElementById('hp').textContent='❤️'.repeat(hp)+'🖤'.repeat(6-hp);
}
window.onGameStart=function(){
  w=words[Math.floor(Math.random()*words.length)];
  left=new Set(w);hp=6;guessed=new Set([w[0]]); // first letter free
  left.delete(w[0]);
  document.getElementById('hint').textContent='Hint: starts with '+w[0];
  const box=document.getElementById('L');box.innerHTML='';
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(ch=>{
    const b=document.createElement('button');b.textContent=ch;
    if(ch===w[0]){b.disabled=true;b.style.opacity='.4'}
    b.onclick=()=>{
      if(!window.__gameRunning||guessed.has(ch)||hp<=0)return;
      guessed.add(ch);b.disabled=true;
      if(left.has(ch))left.delete(ch);else hp--;
      show();
      if(!left.size)showEnd('You Win!','Word: '+w);
      if(hp<=0)showEnd('You Lose','Word was '+w);
    };
    box.appendChild(b);
  });
  show();
};
<\/script>`,
{ hint: 'First letter is free' });

// ——— TETRIS ———
G.tetris = shell('Tetris',
`canvas{width:100%;max-width:200px}.row{display:flex;justify-content:center;gap:4px;margin-top:6px}`,
`<canvas id="c" width="200" height="400"></canvas>
<div class="row"><button id="L">◀</button><button id="R">▶</button><button id="O">⟳</button><button id="D">▼</button></div>
<script>
const C=document.getElementById('c'),x=C.getContext('2d'),W=10,H=20,S=20;
const SH=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
let grid,p,sc,over,iv;
function neu(){const s=SH[Math.floor(Math.random()*SH.length)].map(r=>r.slice());p={s,x:3,y:0};if(hit(0,0)){over=true;clearInterval(iv);showEnd('Game Over','Score '+sc)}}
function hit(dx,dy,s=p.s){for(let y=0;y<s.length;y++)for(let x0=0;x0<s[y].length;x0++)if(s[y][x0]&&(p.y+y+dy>=H||p.x+x0+dx<0||p.x+x0+dx>=W||grid[p.y+y+dy]?.[p.x+x0+dx]))return true;return false}
function merge(){for(let y=0;y<p.s.length;y++)for(let x0=0;x0<p.s[y].length;x0++)if(p.s[y][x0])grid[p.y+y][p.x+x0]=1;
  grid=grid.filter(r=>r.some(v=>!v));while(grid.length<H)grid.unshift(Array(W).fill(0));sc++;neu()}
function rot(){const s=p.s[0].map((_,i)=>p.s.map(r=>r[i]).reverse());if(!hit(0,0,s))p.s=s}
function draw(){x.fillStyle='#0d1117';x.fillRect(0,0,200,400);
  for(let y=0;y<H;y++)for(let x0=0;x0<W;x0++)if(grid[y][x0]){x.fillStyle='#3b82f6';x.fillRect(x0*S,y*S,S-1,S-1)}
  if(p)for(let y=0;y<p.s.length;y++)for(let x0=0;x0<p.s[y].length;x0++)if(p.s[y][x0]){x.fillStyle='#25D366';x.fillRect((p.x+x0)*S,(p.y+y)*S,S-1,S-1)}
  x.fillStyle='#fff';x.font='12px system-ui';x.fillText('Score '+sc,6,14)}
document.getElementById('L').onclick=()=>{if(window.__gameRunning&&!over&&!hit(-1,0))p.x--};
document.getElementById('R').onclick=()=>{if(window.__gameRunning&&!over&&!hit(1,0))p.x++};
document.getElementById('D').onclick=()=>{if(window.__gameRunning&&!over){if(!hit(0,1))p.y++;else merge()}};
document.getElementById('O').onclick=()=>{if(window.__gameRunning&&!over)rot()};
window.onGameStart=function(){
  grid=Array.from({length:H},()=>Array(W).fill(0));sc=0;over=false;neu();
  clearInterval(iv);iv=setInterval(()=>{if(!window.__gameRunning||over)return;if(!hit(0,1))p.y++;else merge();draw()},500);
  draw();
};
<\/script>`,
{ hint: 'Clear lines · medium speed' });

// ——— MEMORY ———
G.memory = shell('Memory',
`.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.card{aspect-ratio:1;border:0;border-radius:12px;background:#1a2430;color:#fff;font-size:22px}`,
`<div class="grid" id="g"></div>
<script>
let open,lock,done,icons;
window.onGameStart=function(){
  icons=['🍎','🍌','🍇','🍉','🍒','🥝','🍑','🍋',...['🍎','🍌','🍇','🍉','🍒','🥝','🍑','🍋']].sort(()=>Math.random()-0.5);
  open=[];lock=false;done=0;
  const g=document.getElementById('g');g.innerHTML='';
  icons.forEach((ic)=>{
    const b=document.createElement('button');b.className='card';b.textContent='❓';
    b.onclick=()=>{
      if(!window.__gameRunning||lock||b.dataset.on)return;
      b.textContent=ic;b.dataset.on=1;open.push(b);
      if(open.length===2){lock=true;const[a,c]=open;
        if(a.textContent===c.textContent){done++;open=[];lock=false;if(done===8)showEnd('Cleared!','All pairs found')}
        else setTimeout(()=>{a.textContent='❓';c.textContent='❓';delete a.dataset.on;delete c.dataset.on;open=[];lock=false},450)}
    };
    g.appendChild(b);
  });
};
<\/script>`,
{ hint: 'Find all pairs' });

// ——— RPS ———
G.rps = shell('Rock Paper Scissors',
`.row{display:flex;gap:8px}button{flex:1;height:64px;font-size:22px;background:#1a2430;color:#fff}`,
`<div class="row"><button data-c="🪨">🪨</button><button data-c="📄">📄</button><button data-c="✂️">✂️</button></div>
<p id="o" class="score"></p>
<script>
const beats={'🪨':'✂️','📄':'🪨','✂️':'📄'};let sc=0;
window.onGameStart=function(){sc=0;document.getElementById('o').textContent='Pick one'};
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
  if(!window.__gameRunning)return;
  const you=b.dataset.c,bot=['🪨','📄','✂️'][Math.floor(Math.random()*3)];
  let r=you===bot?'Draw':beats[you]===bot?'You win':'Bot wins';
  if(r==='You win')sc++;
  document.getElementById('o').textContent=you+' vs '+bot+' · '+r+' · wins '+sc;
  if(sc>=5)showEnd('You Win!','5 wins streak');
});
<\/script>`,
{ hint: 'First to 5 wins' });

// ——— DICE ———
G.dice = shell('Dice',
`#face{font-size:72px;text-align:center;margin:20px}`,
`<div id="face">🎲</div><button id="roll" style="width:100%">Roll</button><p id="m" class="score"></p>
<script>
const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
window.onGameStart=function(){document.getElementById('face').textContent='🎲';document.getElementById('m').textContent=''};
document.getElementById('roll').onclick=()=>{
  if(!window.__gameRunning)return;
  let n=0;const t=setInterval(()=>{document.getElementById('face').textContent=faces[Math.floor(Math.random()*6)];
    if(++n>12){clearInterval(t);const v=1+Math.floor(Math.random()*6);
      document.getElementById('face').textContent=faces[v-1];document.getElementById('m').textContent='You rolled '+v}},50);
};
<\/script>`,
{ hint: 'Tap Roll' });

// ——— FLAPPY ———
G.flappy = shell('Flappy',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="360"></canvas><button id="j" style="width:100%">Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y,vy,pipes,sc,dead,iv;
function jump(){if(window.__gameRunning&&!dead)vy=-5.5}
document.getElementById('j').onclick=jump;c.onclick=jump;
window.onGameStart=function(){
  y=180;vy=0;pipes=[{x:300,g:140}];sc=0;dead=false;
  clearInterval(iv);
  iv=setInterval(()=>{
    if(!window.__gameRunning||dead)return;
    y+=vy;vy+=0.32;
    pipes.forEach(p=>p.x-=2);
    if(pipes[0].x<-40){pipes.shift();pipes.push({x:300,g:60+Math.random()*180});sc++}
    const p=pipes[0];
    if(p.x<55&&p.x>20&&(y<p.g||y>p.g+95)){dead=true;clearInterval(iv);showEnd('Crashed','Score '+sc)}
    if(y>360||y<0){dead=true;clearInterval(iv);showEnd('Crashed','Score '+sc)}
    x.fillStyle='#87ceeb';x.fillRect(0,0,300,360);
    x.fillStyle='#166534';pipes.forEach(p=>{x.fillRect(p.x,0,34,p.g);x.fillRect(p.x,p.g+95,34,360)});
    x.fillStyle='#eab308';x.fillRect(36,y,18,18);
    x.fillStyle='#000';x.fillText('Score '+sc,8,16);
  },22);
};
<\/script>`,
{ hint: 'Tap to jump · gap is wide' });

// ——— MINES ———
G.mines = shell('Minesweeper',
`.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:3px}
.cell{aspect-ratio:1;border:0;border-radius:8px;background:#1a2430;color:#fff;font-size:11px;font-weight:700}`,
`<div class="grid" id="g"></div>
<script>
window.onGameStart=function(){
  const W=8,H=8,M=8,g=document.getElementById('g');g.innerHTML='';
  const board=Array.from({length:H},()=>Array(W).fill(0));
  const mine=new Set();while(mine.size<M)mine.add(Math.floor(Math.random()*W*H));
  mine.forEach(i=>{const y=i/W|0,x=i%W;board[y][x]=-1;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<H&&nx>=0&&nx<W&&board[ny][nx]>=0)board[ny][nx]++}});
  const cells=[];let opened=0;
  function open(y,x){
    const i=y*W+x,b=cells[i];if(b.disabled||!window.__gameRunning)return;b.disabled=true;
    if(board[y][x]===-1){b.textContent='💣';b.style.background='#7f1d1d';showEnd('Boom!','Hit a mine');return}
    opened++;b.textContent=board[y][x]||'';b.style.background='#14532d';
    if(opened>=W*H-M)showEnd('Cleared!','All safe cells open');
    if(!board[y][x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<H&&nx>=0&&nx<W)open(ny,nx)}
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const b=document.createElement('button');b.className='cell';
    b.onclick=()=>open(y,x);g.appendChild(b);cells.push(b);
  }
};
<\/script>`,
{ hint: '8 mines · open all safe cells' });

// ——— SIMON ———
G.simon = shell('Simon',
`.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:220px;margin:0 auto}
.pad{height:72px;border:0;border-radius:16px;opacity:.5}`,
`<div class="grid">
<button class="pad" id="0" style="background:#22c55e"></button>
<button class="pad" id="1" style="background:#ef4444"></button>
<button class="pad" id="2" style="background:#eab308"></button>
<button class="pad" id="3" style="background:#3b82f6"></button>
</div><p id="m" class="score"></p>
<script>
let seq,player,lock;
async function flash(i){const el=document.getElementById(i);el.style.opacity=1;await new Promise(r=>setTimeout(r,320));el.style.opacity=.5}
async function play(){lock=true;for(const i of seq){await flash(i);await new Promise(r=>setTimeout(r,120))}lock=false;player=[];document.getElementById('m').textContent='Your turn · L'+seq.length}
function next(){seq.push(Math.floor(Math.random()*4));play()}
window.onGameStart=function(){seq=[];player=[];lock=false;document.getElementById('m').textContent='Watch…';setTimeout(next,400)};
for(let i=0;i<4;i++)document.getElementById(i).onclick=async()=>{
  if(!window.__gameRunning||lock)return;await flash(i);player.push(i);
  if(player[player.length-1]!==seq[player.length-1]){showEnd('Wrong','Level '+(seq.length-1));return}
  if(player.length===seq.length){document.getElementById('m').textContent='Good!';setTimeout(next,500)}
};
<\/script>`,
{ hint: 'Repeat the pattern' });

// ——— CONNECT4 fair ———
G.connect4 = shell('Connect 4',
`.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;max-width:300px;margin:0 auto}
.cell{aspect-ratio:1;border-radius:50%;background:#1a2430;border:0}`,
`<div class="grid" id="g"></div><p id="m" class="score"></p>
<script>
const W=7,H=6;let board,over,cells;
function win(p){const d=[[0,1],[1,0],[1,1],[1,-1]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(board[y][x]!==p)continue;
    for(const[dy,dx] of d){let ok=true;for(let k=0;k<4;k++){const ny=y+dy*k,nx=x+dx*k;if(ny<0||ny>=H||nx<0||nx>=W||board[ny][nx]!==p){ok=false;break}}if(ok)return true}}return false}
function drop(col,p){for(let y=H-1;y>=0;y--)if(!board[y][col]){board[y][col]=p;return y}return -1}
function render(){cells.forEach((b,i)=>{const y=i/W|0,x=i%W;b.style.background=board[y][x]===1?'#ef4444':board[y][x]===2?'#eab308':'#1a2430'})}
function bot(){
  const free=[];for(let x=0;x<W;x++)if(!board[0][x])free.push(x);
  if(!free.length)return;
  let col=free[Math.floor(Math.random()*free.length)];
  if(Math.random()>0.45){
    for(const c of free){const y=drop(c,2);if(y>=0){if(win(2)){render();return}board[y][c]=0}}
    for(const c of free){const y=drop(c,1);if(y>=0){if(win(1)){col=c;board[y][c]=0;break}board[y][c]=0}}
  }
  drop(col,2);render();
  if(win(2)){over=true;showEnd('Bot wins','Try again')}
}
window.onGameStart=function(){
  board=Array.from({length:H},()=>Array(W).fill(0));over=false;
  const g=document.getElementById('g');g.innerHTML='';cells=[];
  document.getElementById('m').textContent='You 🔴 · Bot 🟡';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const b=document.createElement('button');b.className='cell';
    b.onclick=()=>{if(!window.__gameRunning||over||board[0][x])return;drop(x,1);render();
      if(win(1)){over=true;showEnd('You Win!','Nice!');return}bot()};
    g.appendChild(b);cells.push(b);
  }
};
<\/script>`,
{ hint: 'Fair bot · you can win' });

// ——— PONG ———
G.pong = shell('Pong',
`canvas{width:100%;max-width:320px}`,
`<canvas id="c" width="320" height="220"></canvas><p class="hint">Drag to move paddle</p>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px,bx,by,vx,vy,sc,bot,raf;
c.onpointermove=e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)*(c.width/r.width)-30};
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.fillStyle='#0d1117';x.fillRect(0,0,320,220);
  bot+=(bx-30-bot)*0.05+(Math.random()-0.5)*5;
  x.fillStyle='#64748b';x.fillRect(bot,12,60,8);
  x.fillStyle='#25D366';x.fillRect(px,200,60,8);
  bx+=vx;by+=vy;
  if(bx<6||bx>314)vx*=-1;
  if(by<20&&bx>bot&&bx<bot+60)vy=Math.abs(vy);
  if(by>194&&bx>px&&bx<px+60){vy=-Math.abs(vy);sc++}
  if(by>220){showEnd('Missed','Score '+sc);bx=160;by=110;vy=2}
  if(by<0){bx=160;by=110;vy=2;sc++}
  x.fillStyle='#fff';x.beginPath();x.arc(bx,by,6,0,6.28);x.fill();
  x.fillText('Score '+sc,8,14);
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){px=130;bx=160;by=110;vx=2.5;vy=2;sc=0;bot=130;cancelAnimationFrame(raf);loop()};
<\/script>`,
{ hint: 'Bot is imperfect' });

// ——— BREAKOUT ———
G.breakout = shell('Breakout',
`canvas{width:100%;max-width:320px}`,
`<canvas id="c" width="320" height="280"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px,bx,by,vx,vy,br,sc,raf;
c.onpointermove=e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)*(c.width/r.width)-30};
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.fillStyle='#0d1117';x.fillRect(0,0,320,280);
  x.fillStyle='#25D366';x.fillRect(px,260,60,8);
  let left=0;
  br.forEach(b=>{if(!b.a)return;left++;x.fillStyle='#3b82f6';x.fillRect(b.x,b.y,36,14);
    if(bx>b.x&&bx<b.x+36&&by>b.y&&by<b.y+14){b.a=0;vy*=-1;sc++}});
  if(!left)showEnd('Cleared!','Score '+sc);
  x.fillStyle='#fff';x.beginPath();x.arc(bx,by,5,0,6.28);x.fill();
  bx+=vx;by+=vy;if(bx<5||bx>315)vx*=-1;if(by<5)vy*=-1;
  if(by>255&&bx>px&&bx<px+60)vy=-Math.abs(vy);
  if(by>280){showEnd('Missed','Score '+sc);bx=160;by=200;vy=-2.5}
  x.fillText('Score '+sc,8,14);
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){
  px=130;bx=160;by=200;vx=2.2;vy=-2.2;sc=0;br=[];
  for(let r=0;r<4;r++)for(let c0=0;c0<8;c0++)br.push({x:c0*40+6,y:r*18+28,a:1});
  cancelAnimationFrame(raf);loop();
};
<\/script>`,
{ hint: 'Break all bricks' });

// ——— WHACK ———
G.whack = shell('Whack-a-Mole',
`.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hole{aspect-ratio:1;border:0;border-radius:50%;background:#1a2430;font-size:28px}`,
`<div class="grid" id="g"></div><p id="m" class="score"></p>
<script>
let sc,cur,iv,holes;
window.onGameStart=function(){
  sc=0;cur=-1;clearInterval(iv);
  const g=document.getElementById('g');g.innerHTML='';holes=[];
  document.getElementById('m').textContent='Score 0 · 20s';
  for(let i=0;i<9;i++){const b=document.createElement('button');b.className='hole';
    b.onclick=()=>{if(!window.__gameRunning)return;if(i===cur){sc++;document.getElementById('m').textContent='Score '+sc;cur=-1;b.textContent=''}};
    g.appendChild(b);holes.push(b)}
  const t0=Date.now();
  iv=setInterval(()=>{
    if(!window.__gameRunning)return;
    const left=20-((Date.now()-t0)/1000);
    if(left<=0){clearInterval(iv);showEnd('Time!','Score '+sc);return}
    holes.forEach(h=>h.textContent='');cur=Math.floor(Math.random()*9);holes[cur].textContent='🐹';
  },800);
};
<\/script>`,
{ hint: '20 seconds · tap moles' });

// ——— SLOTS ———
G.slots = shell('Slots',
`#reels{display:flex;justify-content:center;gap:12px;font-size:42px;margin:16px 0}`,
`<div id="reels"><span>🍒</span><span>🍋</span><span>7️⃣</span></div>
<button id="spin" style="width:100%">Spin</button><p id="m" class="score"></p>
<script>
const sym=['🍒','🍋','7️⃣','⭐','🍇'];
window.onGameStart=function(){document.getElementById('m').textContent='Good luck'};
document.getElementById('spin').onclick=()=>{
  if(!window.__gameRunning)return;
  const a=sym[Math.floor(Math.random()*sym.length)];
  const b=sym[Math.floor(Math.random()*sym.length)];
  const c=sym[Math.floor(Math.random()*sym.length)];
  document.getElementById('reels').innerHTML='<span>'+a+'</span><span>'+b+'</span><span>'+c+'</span>';
  document.getElementById('m').textContent=(a===b&&b===c)?'JACKPOT!':(a===b||b===c||a===c)?'Nice pair':'Try again';
};
<\/script>`,
{ hint: 'Spin the reels' });

// ——— HIGHER ———
G.higher = shell('Higher or Lower',
`#card{font-size:48px;text-align:center;margin:16px}`,
`<div id="card">?</div><div class="row"><button id="h" style="flex:1">Higher</button><button id="l" style="flex:1">Lower</button></div>
<p id="m" class="score"></p>
<script>
let cur,sc;
window.onGameStart=function(){cur=1+Math.floor(Math.random()*13);sc=0;document.getElementById('card').textContent=cur;document.getElementById('m').textContent='Streak 0'};
function go(higher){
  if(!window.__gameRunning)return;
  const next=1+Math.floor(Math.random()*13);
  const ok=higher?(next>=cur):(next<=cur);
  if(ok){sc++;document.getElementById('m').textContent='Yes · streak '+sc}
  else{showEnd('Wrong','Was '+next+' · streak '+sc);sc=0}
  cur=next;document.getElementById('card').textContent=cur;
}
document.getElementById('h').onclick=()=>go(true);
document.getElementById('l').onclick=()=>go(false);
<\/script>`,
{ hint: 'Guess next card 1–13' });

// ——— REACT ———
G.react = shell('Reaction',
`#b{width:100%;height:110px;font-size:16px}`,
`<p id="s" class="hint">Wait for green, then tap</p>
<button id="b" class="sec">Ready</button>
<script>
let t0,mode;
window.onGameStart=function(){mode='idle';const b=document.getElementById('b');b.className='sec';b.style.background='';b.textContent='Wait for green…';
  document.getElementById('s').textContent='Get ready…';
  setTimeout(()=>{if(!window.__gameRunning)return;mode='go';t0=performance.now();b.style.background='#25D366';b.textContent='TAP!';b.className=''},800+Math.random()*2000);
  b.onclick=()=>{
    if(mode==='go'){const ms=(performance.now()-t0)|0;mode='idle';showEnd('Reaction',ms+' ms')}
    else if(mode==='idle'){document.getElementById('s').textContent='Too early!'};
  };
};
<\/script>`,
{ hint: 'Don\'t tap early' });

// ——— PAINT ———
G.paint = shell('Paint',
`canvas{width:100%;max-width:320px;background:#fff}`,
`<canvas id="c" width="320" height="260"></canvas>
<div class="row"><button data-c="#111">Ink</button><button data-c="#ef4444">Red</button><button data-c="#25D366">Grn</button><button id="clr" class="sec">Clear</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');let draw=false,col='#111';
x.lineWidth=3;x.lineCap='round';
function pos(e){const r=c.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}}
c.onpointerdown=e=>{if(!window.__gameRunning)return;draw=true;const p=pos(e);x.beginPath();x.moveTo(p.x,p.y)};
c.onpointerup=()=>draw=false;
c.onpointermove=e=>{if(!draw)return;const p=pos(e);x.strokeStyle=col;x.lineTo(p.x,p.y);x.stroke()};
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>col=b.dataset.c);
document.getElementById('clr').onclick=()=>x.clearRect(0,0,320,260);
window.onGameStart=function(){x.clearRect(0,0,320,260)};
<\/script>`,
{ hint: 'Draw freely' });

// ——— COIN ———
G.coin = shell('Coin Flip',
`#face{font-size:64px;text-align:center;margin:24px}`,
`<div id="face">🪙</div><button id="f" style="width:100%">Flip</button><p id="m" class="score"></p>
<script>
window.onGameStart=function(){document.getElementById('face').textContent='🪙';document.getElementById('m').textContent=''};
document.getElementById('f').onclick=()=>{
  if(!window.__gameRunning)return;
  const v=Math.random()<0.5?'Heads':'Tails';
  document.getElementById('face').textContent=v==='Heads'?'🟢':'🔴';
  document.getElementById('m').textContent=v;
};
<\/script>`,
{ hint: '50 / 50' });

// ——— LIGHTS ———
G.lights = shell('Lights Out',
`.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:200px;margin:0 auto}
.cell{aspect-ratio:1;border:0;border-radius:12px}`,
`<div class="grid" id="g"></div>
<script>
let state,btns;
window.onGameStart=function(){
  state=Array(9).fill(0).map(()=>Math.random()<.5?1:0);
  const g=document.getElementById('g');g.innerHTML='';btns=[];
  function render(){btns.forEach((b,i)=>{b.style.background=state[i]?'#eab308':'#1a2430'});
    if(state.every(v=>!v))showEnd('Cleared!','All lights off')}
  function toggle(i){if(!window.__gameRunning)return;state[i]^=1;[i-1,i+1,i-3,i+3].forEach(j=>{if(j>=0&&j<9&&Math.abs((j%3)-(i%3))<=1)state[j]^=1});render()}
  for(let i=0;i<9;i++){const b=document.createElement('button');b.className='cell';b.onclick=()=>toggle(i);g.appendChild(b);btns.push(b)}
  render();
};
<\/script>`,
{ hint: 'Turn all lights off' });

const ALIASES = Object.keys(G);

module.exports = {
  name: 'games-pack',
  pattern: 'games',
  aliases: ALIASES,
  desc: 'HTML games list',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'games') {
      const names = ALIASES.map((a) => `.${a}`);
      let text = `┏ ${style('GAMES')}\n`;
      for (let i = 0; i < names.length; i += 3) {
        text += `┃ ${names.slice(i, i + 3).join(' ')}\n`;
      }
      text += `┃ .games2 more\n┗ .ttt .dino .guess .quiz`;
      return reply(text);
    }
    const html = G[cmd];
    if (!html) return reply('Unknown. .games');
    await sendHtmlApp(sock, jid, html, TITLES[cmd] || cmd);
  },
};
