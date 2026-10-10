const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const G = {};
const TITLES = {};

function add(id, title, css, body, hint) {
  G[id] = shell(title, css || '', body, { hint: hint || 'Use buttons', start: true });
  TITLES[id] = title;
}

const pad3 = `.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px;margin:8px auto}.pad button{height:42px;font-size:16px}`;
const row2 = `.rowb{display:flex;gap:6px;margin-top:8px}.rowb button{flex:1;height:42px}`;

// SNAKE
add('snake', 'Snake', pad3,
`<canvas id="c" width="280" height="280" style="width:100%;max-width:280px;background:#0d1117;border-radius:12px"></canvas>
<div class="pad"><i></i><button id="u" type="button">Up</button><i></i>
<button id="l" type="button">Left</button><button id="r" type="button">Right</button><i></i>
<i></i><button id="d" type="button">Down</button><i></i></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),N=14,S=20,snake,dir,food,dead,sc,iv;
function place(){food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};if(snake.some(function(s){return s.x===food.x&&s.y===food.y}))place()}
function turn(nx,ny){if(dir.x+nx||dir.y+ny)dir={x:nx,y:ny}}
[["u",0,-1],["d",0,1],["l",-1,0],["r",1,0]].forEach(function(z){document.getElementById(z[0]).onclick=function(){turn(z[1],z[2])}});
function tick(){if(!window.__gameRunning||dead)return;var h={x:(snake[0].x+dir.x+N)%N,y:(snake[0].y+dir.y+N)%N};
if(snake.some(function(s){return s.x===h.x&&s.y===h.y})){dead=true;clearInterval(iv);showEnd("Game Over","Score "+sc);return}
snake.unshift(h);if(h.x===food.x&&h.y===food.y){sc++;place()}else snake.pop();
x.fillStyle="#0d1117";x.fillRect(0,0,280,280);x.fillStyle="#f43f5e";x.fillRect(food.x*S+2,food.y*S+2,S-4,S-4);
snake.forEach(function(s,i){x.fillStyle=i?"#22c55e":"#4ade80";x.fillRect(s.x*S+2,s.y*S+2,S-4,S-4)});setStat("Score "+sc)}
window.onGameStart=function(){snake=[{x:7,y:7}];dir={x:1,y:0};dead=false;sc=0;place();clearInterval(iv);iv=setInterval(tick,180);tick()};
<\/script>`, 'Buttons only · walls wrap');

// DINO
add('dino', 'Dino Run', row2,
`<canvas id="c" width="300" height="150" style="width:100%;max-width:300px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="jp" type="button">Jump</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),y,vy,obs,sc,spd,iv,ground=120;
function draw(){if(!window.__gameRunning)return;x.fillStyle="#0f172a";x.fillRect(0,0,300,150);
x.fillStyle="#334155";x.fillRect(0,ground,300,4);x.fillStyle="#4ade80";x.fillRect(30,y-20,18,20);
x.fillStyle="#f43f5e";obs.forEach(function(o){x.fillRect(o.x,ground-o.h,14,o.h)});setStat("Score "+sc)}
function tick(){if(!window.__gameRunning)return;vy+=0.7;y+=vy;if(y>ground){y=ground;vy=0}
obs.forEach(function(o){o.x-=spd});obs=obs.filter(function(o){return o.x>-20});
if(Math.random()<0.03)obs.push({x:300,h:16+Math.random()*22});
sc++;if(sc%120===0)spd=Math.min(spd+0.3,7);
for(var i=0;i<obs.length;i++){var o=obs[i];if(o.x<48&&o.x>20&&y>ground-o.h){clearInterval(iv);showEnd("Crashed","Score "+sc);return}}
draw()}
document.getElementById("jp").onclick=function(){if(y>=ground-1)vy=-9};
window.onGameStart=function(){y=ground;vy=0;obs=[];sc=0;spd=3;clearInterval(iv);iv=setInterval(tick,40);draw()};
<\/script>`, 'Tap Jump');

// 2048
add('g2048', '2048', pad3,
`<div id="b" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-width:260px;margin:0 auto"></div>
<div class="pad" style="max-width:200px"><i></i><button id="u" type="button">Up</button><i></i>
<button id="l" type="button">Left</button><button id="r" type="button">Right</button><i></i>
<i></i><button id="d" type="button">Down</button><i></i></div>
<script>
var grid,sc;
function cell(v){var col=v?("hsl("+(v*12%360)+",70%,40%)"):"#1e293b";return "<div style=\\"background:"+col+";height:52px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px\\">"+(v||"")+"</div>"}
function ren(){document.getElementById("b").innerHTML=grid.flat().map(cell).join("");setStat("Score "+sc)}
function spawn(){var e=[];grid.forEach(function(row,i){row.forEach(function(v,j){if(!v)e.push([i,j])})});if(!e.length)return;var p=e[Math.floor(Math.random()*e.length)];grid[p[0]][p[1]]=Math.random()<0.9?2:4}
function slide(arr){var a=arr.filter(function(v){return v});for(var i=0;i<a.length-1;i++){if(a[i]===a[i+1]){a[i]*=2;sc+=a[i];a[i+1]=0}}a=a.filter(function(v){return v});while(a.length<4)a.push(0);return a}
function move(dir){var old=JSON.stringify(grid);
if(dir==="l")grid=grid.map(function(r){return slide(r)});
if(dir==="r")grid=grid.map(function(r){return slide(r.slice().reverse()).reverse()});
if(dir==="u"){for(var j=0;j<4;j++){var col=[];for(var i=0;i<4;i++)col.push(grid[i][j]);col=slide(col);for(var i=0;i<4;i++)grid[i][j]=col[i]}}
if(dir==="d"){for(var j=0;j<4;j++){var col=[];for(var i=0;i<4;i++)col.push(grid[i][j]);col=slide(col.reverse()).reverse();for(var i=0;i<4;i++)grid[i][j]=col[i]}}
if(JSON.stringify(grid)!==old){spawn();ren();if(!grid.flat().some(function(v){return !v}))showEnd("Game Over","Score "+sc)}}
[["u","u"],["d","d"],["l","l"],["r","r"]].forEach(function(z){document.getElementById(z[0]).onclick=function(){if(window.__gameRunning)move(z[1])}});
window.onGameStart=function(){grid=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];sc=0;spawn();spawn();ren()};
<\/script>`, 'Use arrow buttons');

// TICTACTOE vs random AI - already have plugin but include simple
add('xo', 'Tic Tac Toe', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:200px;margin:0 auto"></div>
<script>
var board,turn;
function win(p){var L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];return L.some(function(l){return l.every(function(i){return board[i]===p})})}
function ren(){var el=document.getElementById("g");el.innerHTML="";board.forEach(function(v,i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="56px";b.style.fontSize="20px";b.textContent=v||"";
b.onclick=function(){if(!window.__gameRunning||board[i]||turn!=="X")return;board[i]="X";if(win("X")){ren();showEnd("You win","");return}if(board.every(Boolean)){ren();showEnd("Draw","");return}
turn="O";var e=[];board.forEach(function(v,j){if(!v)e.push(j)});if(e.length)board[e[Math.floor(Math.random()*e.length)]]="O";
if(win("O")){ren();showEnd("Bot wins","");return}turn="X";ren()};el.appendChild(b)})}
window.onGameStart=function(){board=Array(9).fill("");turn="X";ren()};
<\/script>`, 'You are X');

// HANGMAN
add('hangman', 'Hangman', '',
`<div class="out" id="w" style="font-size:22px;letter-spacing:4px;text-align:center"></div>
<div class="out" id="m" style="text-align:center"></div>
<div id="keys" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:8px"></div>
<script>
var words=["APPLE","PAKISTAN","PYTHON","SCHOOL","WHATSAPP","MOBILE","ORANGE","PLANET","GUITAR","FRIEND"];
var word,left,miss;
function ren(){document.getElementById("w").textContent=word.map(function(c){return left.indexOf(c)>=0?c:"_"}).join(" ");
document.getElementById("m").textContent="Miss "+miss+"/6"}
window.onGameStart=function(){word=words[Math.floor(Math.random()*words.length)].split("");left=[word[0]];miss=0;ren();
var k=document.getElementById("keys");k.innerHTML="";
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function(ch){var b=document.createElement("button");b.type="button";b.textContent=ch;b.style.cssText="width:28px;height:32px;border:0;border-radius:8px;background:#1e293b;color:#fff;font-size:12px";
b.onclick=function(){if(!window.__gameRunning||b.disabled)return;b.disabled=true;if(word.indexOf(ch)>=0){if(left.indexOf(ch)<0)left.push(ch);ren();if(word.every(function(c){return left.indexOf(c)>=0}))showEnd("You win",word.join(""));}
else{miss++;ren();if(miss>=6)showEnd("Lost",word.join(""))}};k.appendChild(b)})};
<\/script>`, 'First letter shown');

// MEMORY
add('memory', 'Memory', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px"></div>
<script>
window.onGameStart=function(){var em=["A","B","C","D","E","F","G","H"];var cards=em.concat(em).sort(function(){return Math.random()-0.5});
var open=[],lock=0,matched=0,el=document.getElementById("g");el.innerHTML="";
cards.forEach(function(c,i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="48px";b.textContent="?";
b.onclick=function(){if(lock||b.dataset.m||!window.__gameRunning)return;b.textContent=c;open.push({b:b,c:c});
if(open.length===2){lock=1;if(open[0].c===open[1].c){open[0].b.dataset.m=1;open[1].b.dataset.m=1;matched++;open=[];lock=0;if(matched===8)showEnd("Cleared","Nice")}
else{setTimeout(function(){open[0].b.textContent="?";open[1].b.textContent="?";open=[];lock=0},450)}}};el.appendChild(b)})};
<\/script>`, 'Match pairs');

// PONG buttons
add('pong', 'Pong', row2,
`<canvas id="c" width="280" height="200" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="u" type="button">Paddle Up</button><button id="d" type="button">Paddle Down</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),px,py,bx,by,vx,vy,sc,iv;
document.getElementById("u").onclick=function(){py=Math.max(0,py-24)};
document.getElementById("d").onclick=function(){py=Math.min(160,py+24)};
function tick(){if(!window.__gameRunning)return;bx+=vx;by+=vy;if(by<4||by>196)vy*=-1;
if(bx<16&&by>py&&by<py+40){vx=Math.abs(vx);sc++}if(bx>276)vx*=-1;if(bx<0){clearInterval(iv);showEnd("Miss","Score "+sc);return}
x.fillStyle="#0f172a";x.fillRect(0,0,280,200);x.fillStyle="#38bdf8";x.fillRect(6,py,8,40);x.fillStyle="#fff";x.beginPath();x.arc(bx,by,5,0,6.3);x.fill();setStat("Score "+sc)}
window.onGameStart=function(){px=6;py=80;bx=140;by=100;vx=-3;vy=2;sc=0;clearInterval(iv);iv=setInterval(tick,30)};
<\/script>`, 'Buttons move paddle');

// BREAKOUT buttons
add('breakout', 'Breakout', row2,
`<canvas id="c" width="280" height="220" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="l" type="button">Left</button><button id="r" type="button">Right</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),px,bx,by,vx,vy,bricks,sc,iv;
document.getElementById("l").onclick=function(){px=Math.max(0,px-28)};
document.getElementById("r").onclick=function(){px=Math.min(220,px+28)};
function tick(){if(!window.__gameRunning)return;bx+=vx;by+=vy;if(bx<4||bx>276)vx*=-1;if(by<4)vy=Math.abs(vy);
if(by>200&&bx>px&&bx<px+60){vy=-Math.abs(vy)}if(by>230){clearInterval(iv);showEnd("Lost","Score "+sc);return}
bricks=bricks.filter(function(b){if(bx>b.x&&bx<b.x+32&&by>b.y&&by<b.y+12){sc+=10;vy*=-1;return false}return true});
if(!bricks.length){clearInterval(iv);showEnd("Clear","Score "+sc);return}
x.fillStyle="#0f172a";x.fillRect(0,0,280,220);bricks.forEach(function(b){x.fillStyle="#f59e0b";x.fillRect(b.x,b.y,30,10)});
x.fillStyle="#38bdf8";x.fillRect(px,208,60,8);x.fillStyle="#fff";x.beginPath();x.arc(bx,by,5,0,6.3);x.fill();setStat("Score "+sc)}
window.onGameStart=function(){px=110;bx=140;by=160;vx=2.5;vy=-2.5;sc=0;bricks=[];for(var r=0;r<3;r++)for(var col=0;col<8;col++)bricks.push({x:8+col*34,y:12+r*16});clearInterval(iv);iv=setInterval(tick,25)};
<\/script>`, 'Left / Right buttons');

// FLAPPY buttons
add('flappy', 'Flappy', row2,
`<canvas id="c" width="280" height="220" style="width:100%;max-width:280px;background:#0c4a6e;border-radius:12px"></canvas>
<div class="rowb"><button id="fl" type="button">Flap</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),y,vy,pipes,sc,iv;
document.getElementById("fl").onclick=function(){if(window.__gameRunning)vy=-5.5};
function tick(){if(!window.__gameRunning)return;vy+=0.35;y+=vy;pipes.forEach(function(p){p.x-=2.2});
if(pipes.length&&pipes[0].x<-40){pipes.shift();sc++}
if(Math.random()<0.02)pipes.push({x:280,g:40+Math.random()*100});
for(var i=0;i<pipes.length;i++){var p=pipes[i];if(p.x<36&&p.x>0&&(y<p.g||y>p.g+55)){clearInterval(iv);showEnd("Hit","Score "+sc);return}}
if(y>220||y<0){clearInterval(iv);showEnd("Crash","Score "+sc);return}
x.fillStyle="#0c4a6e";x.fillRect(0,0,280,220);x.fillStyle="#4ade80";pipes.forEach(function(p){x.fillRect(p.x,0,28,p.g);x.fillRect(p.x,p.g+55,28,220)});
x.fillStyle="#fbbf24";x.beginPath();x.arc(30,y,8,0,6.3);x.fill();setStat("Score "+sc)}
window.onGameStart=function(){y=110;vy=0;pipes=[];sc=0;clearInterval(iv);iv=setInterval(tick,30)};
<\/script>`, 'Tap Flap');

// MINES
add('mines', 'Mines', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(6,1fr);gap:3px"></div>
<script>
window.onGameStart=function(){var W=6,H=6,M=6,mine={},open={},flag={};while(Object.keys(mine).length<M){mine[Math.floor(Math.random()*W*H)]=1}
function n(i){var x=i%W,y=Math.floor(i/W),c=0;for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&mine[ny*W+nx])c++}return c}
function ren(){var el=document.getElementById("g");el.innerHTML="";for(var i=0;i<W*H;i++){(function(i){var b=document.createElement("button");b.type="button";b.style.cssText="height:36px;border:0;border-radius:6px;background:#1e293b;color:#fff;font-size:12px";
if(open[i]){b.style.background="#334155";b.textContent=mine[i]?"*":(n(i)||"");if(mine[i])b.style.color="#f43f5e"}
b.onclick=function(){if(!window.__gameRunning||open[i])return;open[i]=1;if(mine[i]){Object.keys(mine).forEach(function(k){open[k]=1});ren();showEnd("Boom","Hit a mine");return}
ren();var left=W*H-Object.keys(open).length;if(left<=M)showEnd("Clear","Nice")};el.appendChild(b)})(i)}}
ren()};
<\/script>`, 'Avoid mines');

// RPS
add('rps', 'Rock Paper Scissors', row2,
`<div class="out" id="o" style="text-align:center;min-height:48px">Pick one</div>
<div class="rowb"><button id="rk" type="button">Rock</button><button id="pp" type="button">Paper</button><button id="sc" type="button">Scissors</button></div>
<script>
function play(you){var ai=["rock","paper","scissors"][Math.floor(Math.random()*3)];var r="Draw";
if((you==="rock"&&ai==="scissors")||(you==="paper"&&ai==="rock")||(you==="scissors"&&ai==="paper"))r="You win";
else if(you!==ai)r="You lose";document.getElementById("o").textContent="You: "+you+" | Bot: "+ai+"\\n"+r}
document.getElementById("rk").onclick=function(){play("rock")};document.getElementById("pp").onclick=function(){play("paper")};document.getElementById("sc").onclick=function(){play("scissors")};
window.onGameStart=function(){document.getElementById("o").textContent="Pick one"};
<\/script>`, 'Buttons');

// MORE GAMES (15+)
add('react', 'Reaction', row2,
`<div class="out" id="o" style="text-align:center;min-height:60px;font-size:16px">Wait for green…</div>
<div class="rowb"><button id="go" type="button">Tap!</button></div>
<script>
var t0=0,armed=0;
window.onGameStart=function(){armed=0;document.getElementById("o").textContent="Wait for green…";document.getElementById("o").style.background="#1e293b";
setTimeout(function(){if(!window.__gameRunning)return;armed=1;t0=Date.now();document.getElementById("o").textContent="TAP NOW";document.getElementById("o").style.background="#166534"},800+Math.random()*2200)};
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;if(!armed){document.getElementById("o").textContent="Too early!";return}showEnd("Reaction", (Date.now()-t0)+" ms")};
<\/script>`, 'Tap when green');

add('mathduel', 'Math Duel', '',
`<div class="out" id="q" style="text-align:center;font-size:20px"></div>
<div id="a" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px"></div>
<script>
var ans,sc,left;
function next(){var a=1+Math.floor(Math.random()*12),b=1+Math.floor(Math.random()*12);ans=a+b;document.getElementById("q").textContent=a+" + "+b+" = ?";
var opts=[ans,ans+1,ans-1,ans+2].sort(function(){return Math.random()-0.5});var el=document.getElementById("a");el.innerHTML="";
opts.forEach(function(v){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=v;b.onclick=function(){if(!window.__gameRunning)return;if(v===ans){sc++;left=3;setStat("Score "+sc);next()}else showEnd("Wrong","Score "+sc)};el.appendChild(b)})}
window.onGameStart=function(){sc=0;next()};
<\/script>`, 'Pick correct sum');

add('simon', 'Simon', row2,
`<div class="out" id="o" style="text-align:center">Watch…</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
<button id="b0" type="button" class="p" style="background:#ef4444;height:48px">1</button>
<button id="b1" type="button" class="p" style="background:#22c55e;height:48px">2</button>
<button id="b2" type="button" class="p" style="background:#3b82f6;height:48px">3</button>
<button id="b3" type="button" class="p" style="background:#eab308;height:48px">4</button></div>
<script>
var seq,pos,lock;
function flash(i){var b=document.getElementById("b"+i);var o=b.style.opacity;b.style.opacity="0.4";setTimeout(function(){b.style.opacity="1"},250)}
function playSeq(){lock=1;document.getElementById("o").textContent="Watch…";var i=0;var t=setInterval(function(){if(i>=seq.length){clearInterval(t);lock=0;pos=0;document.getElementById("o").textContent="Your turn";return}flash(seq[i]);i++},500)}
function press(i){if(lock||!window.__gameRunning)return;flash(i);if(seq[pos]!==i){showEnd("Wrong","Level "+seq.length);return}pos++;if(pos>=seq.length){seq.push(Math.floor(Math.random()*4));setTimeout(playSeq,400)}}
[0,1,2,3].forEach(function(i){document.getElementById("b"+i).onclick=function(){press(i)}});
window.onGameStart=function(){seq=[Math.floor(Math.random()*4)];pos=0;setTimeout(playSeq,300)};
<\/script>`, 'Repeat the pattern');

add('taprace', 'Tap Race', row2,
`<div class="out" id="o" style="font-size:28px;text-align:center">0</div>
<div class="rowb"><button id="t" type="button">TAP</button></div>
<script>
var n,t0;
document.getElementById("t").onclick=function(){if(!window.__gameRunning)return;n++;document.getElementById("o").textContent=n;if(Date.now()-t0>5000)showEnd("Time up",n+" taps")};
window.onGameStart=function(){n=0;t0=Date.now();document.getElementById("o").textContent="0";setTimeout(function(){if(window.__gameRunning)showEnd("Time up",n+" taps")},5000)};
<\/script>`, '5 seconds');

add('higher', 'Higher Lower', row2,
`<div class="out" id="o" style="text-align:center;font-size:18px"></div>
<div class="rowb"><button id="h" type="button">Higher</button><button id="l" type="button">Lower</button></div>
<script>
var cur,sc;
function show(){document.getElementById("o").textContent="Number: "+cur+"\\nScore "+sc}
function guess(up){var n=1+Math.floor(Math.random()*100);var ok=up?n>=cur:n<=cur;cur=n;if(ok){sc++;show()}else showEnd("Wrong","Score "+sc+" · was "+n)}
document.getElementById("h").onclick=function(){if(window.__gameRunning)guess(1)};
document.getElementById("l").onclick=function(){if(window.__gameRunning)guess(0)};
window.onGameStart=function(){cur=1+Math.floor(Math.random()*100);sc=0;show()};
<\/script>`, 'Guess next');

add('colorname', 'Color Name', '',
`<div id="box" style="height:80px;border-radius:12px;margin-bottom:8px"></div>
<div id="a" style="display:grid;grid-template-columns:1fr 1fr;gap:6px"></div>
<script>
var cols=[["Red","#ef4444"],["Green","#22c55e"],["Blue","#3b82f6"],["Yellow","#eab308"],["Purple","#a855f7"],["Orange","#f97316"]];
var ans,sc;
function next(){var i=Math.floor(Math.random()*cols.length);ans=cols[i][0];document.getElementById("box").style.background=cols[i][1];
var opts=cols.map(function(c){return c[0]}).sort(function(){return Math.random()-0.5});var el=document.getElementById("a");el.innerHTML="";
opts.forEach(function(name){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=name;
b.onclick=function(){if(!window.__gameRunning)return;if(name===ans){sc++;setStat("Score "+sc);next()}else showEnd("Wrong","Score "+sc)};el.appendChild(b)})}
window.onGameStart=function(){sc=0;next()};
<\/script>`, 'Name the color');

add('balloon', 'Balloon Pop', row2,
`<canvas id="c" width="280" height="220" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="p1" type="button">Pop Left</button><button id="p2" type="button">Pop Right</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),balls,sc,iv;
function tick(){if(!window.__gameRunning)return;x.fillStyle="#0f172a";x.fillRect(0,0,280,220);
balls.forEach(function(b){b.y-=b.v;x.beginPath();x.fillStyle=b.col;x.arc(b.x,b.y,b.r,0,6.3);x.fill()});
balls=balls.filter(function(b){return b.y>-20});setStat("Score "+sc)}
function pop(side){if(!window.__gameRunning)return;var hit=null;balls.forEach(function(b){if(side==="L"&&b.x<140)hit=b;if(side==="R"&&b.x>=140)hit=b});
if(hit){balls=balls.filter(function(b){return b!==hit});sc++}}
document.getElementById("p1").onclick=function(){pop("L")};document.getElementById("p2").onclick=function(){pop("R")};
window.onGameStart=function(){balls=[];sc=0;clearInterval(iv);iv=setInterval(function(){if(!window.__gameRunning)return;
balls.push({x:40+Math.random()*200,y:220,r:12+Math.random()*10,v:1+Math.random()*1.5,col:"hsl("+Math.floor(Math.random()*360)+",70%,55%)"})},600);
var d=setInterval(function(){if(!window.__gameRunning){clearInterval(d);clearInterval(iv);return}tick()},40)};
<\/script>`, 'Pop left or right');

add('dodge', 'Dodge', row2,
`<canvas id="c" width="280" height="200" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="l" type="button">Left</button><button id="r" type="button">Right</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),px,rocks,sc,iv;
document.getElementById("l").onclick=function(){px=Math.max(10,px-30)};
document.getElementById("r").onclick=function(){px=Math.min(250,px+30)};
function tick(){if(!window.__gameRunning)return;rocks.forEach(function(r){r.y+=r.v});rocks=rocks.filter(function(r){return r.y<220});
if(Math.random()<0.06)rocks.push({x:Math.random()*260,y:-10,v:2+Math.random()*2});
for(var i=0;i<rocks.length;i++){var r=rocks[i];if(Math.abs(r.x-px)<16&&r.y>160&&r.y<190){clearInterval(iv);showEnd("Hit","Score "+sc);return}}
sc++;x.fillStyle="#0f172a";x.fillRect(0,0,280,200);x.fillStyle="#38bdf8";x.fillRect(px-12,170,24,16);x.fillStyle="#f43f5e";rocks.forEach(function(r){x.fillRect(r.x,r.y,14,14)});setStat("Score "+sc)}
window.onGameStart=function(){px=140;rocks=[];sc=0;clearInterval(iv);iv=setInterval(tick,35)};
<\/script>`, 'Dodge falling blocks');

add('whack', 'Whack', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"></div>
<script>
var sc,iv,active;
function ren(){var el=document.getElementById("g");el.innerHTML="";for(var i=0;i<9;i++){(function(i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="52px";b.textContent=active===i?"X":".";
b.onclick=function(){if(!window.__gameRunning)return;if(active===i){sc++;setStat("Score "+sc);active=-1;ren()}};el.appendChild(b)})(i)}}
window.onGameStart=function(){sc=0;active=-1;ren();clearInterval(iv);iv=setInterval(function(){if(!window.__gameRunning)return;active=Math.floor(Math.random()*9);ren()},700);
setTimeout(function(){if(window.__gameRunning){clearInterval(iv);showEnd("Time","Score "+sc)}},15000)};
<\/script>`, '15s · hit X');

add('quiz2', 'Quick Quiz', '',
`<div class="out" id="q"></div><div id="a"></div>
<script>
var Q=[{q:"2+2?",o:["3","4","5"],c:1},{q:"Capital of France?",o:["Paris","Rome","Madrid"],c:0},{q:"HTML is…",o:["Language","Protocol","Markup"],c:2},{q:"5*5?",o:["20","25","15"],c:1}];
var i,sc;
function show(){if(i>=Q.length){showEnd("Done","Score "+sc+"/"+Q.length);return}var x=Q[i];document.getElementById("q").textContent=x.q;var el=document.getElementById("a");el.innerHTML="";
x.o.forEach(function(t,n){var b=document.createElement("button");b.type="button";b.className="p sec";b.style.marginTop="6px";b.textContent=t;
b.onclick=function(){if(n===x.c)sc++;i++;show()};el.appendChild(b)})}
window.onGameStart=function(){i=0;sc=0;show()};
<\/script>`, 'Answer questions');

add('stack', 'Stack', row2,
`<canvas id="c" width="280" height="220" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="drop" type="button">Drop</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),blocks,cur,dir,sc,iv;
function draw(){x.fillStyle="#0f172a";x.fillRect(0,0,280,220);blocks.forEach(function(b){x.fillStyle="#22c55e";x.fillRect(b.x,b.y,b.w,14)});
if(cur){x.fillStyle="#38bdf8";x.fillRect(cur.x,cur.y,cur.w,14)}setStat("Score "+sc)}
document.getElementById("drop").onclick=function(){if(!window.__gameRunning||!cur)return;
var prev=blocks[blocks.length-1];var nx=Math.max(cur.x,prev.x);var nw=Math.min(cur.x+cur.w,prev.x+prev.w)-nx;
if(nw<=4){showEnd("Miss","Score "+sc);return}blocks.push({x:nx,y:prev.y-16,w:nw});sc++;cur={x:0,y:prev.y-32,w:nw};dir=2;if(sc>=12)showEnd("Tower!","Score "+sc)};
window.onGameStart=function(){blocks=[{x:90,y:200,w:100}];cur={x:0,y:184,w:100};dir=2;sc=0;clearInterval(iv);
iv=setInterval(function(){if(!window.__gameRunning||!cur)return;cur.x+=dir;if(cur.x<0||cur.x+cur.w>280)dir*=-1;draw()},30)};
<\/script>`, 'Drop to stack');

add('lights', 'Lights Out', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px;margin:0 auto"></div>
<script>
var grid;
function ren(){var el=document.getElementById("g");el.innerHTML="";grid.forEach(function(v,i){var b=document.createElement("button");b.type="button";b.style.cssText="height:48px;border:0;border-radius:10px;background:"+(v?"#fbbf24":"#1e293b");
b.onclick=function(){if(!window.__gameRunning)return;[i,i-1,i+1,i-3,i+3].forEach(function(j){if(j>=0&&j<9&&(Math.abs(j%3-i%3)<=1||Math.abs(j-i)===3))grid[j]=grid[j]?0:1});ren();if(grid.every(function(v){return !v}))showEnd("Solved","Nice")};el.appendChild(b)})}
window.onGameStart=function(){grid=Array(9).fill(0).map(function(){return Math.random()<0.5?1:0});ren()};
<\/script>`, 'Turn all off');

add('sequence', 'Number Seq', '',
`<div class="out" id="q" style="text-align:center"></div><div id="a" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px"></div>
<script>
var sc;
function next(){var a=2+Math.floor(Math.random()*5),s=1+Math.floor(Math.random()*8);var seq=[s,s+a,s+2*a,s+3*a];var ans=s+4*a;
document.getElementById("q").textContent=seq.join(", ")+", ?";var opts=[ans,ans+a,ans-1,ans+2].sort(function(){return Math.random()-0.5});
var el=document.getElementById("a");el.innerHTML="";opts.forEach(function(v){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=v;
b.onclick=function(){if(v===ans){sc++;setStat("Score "+sc);next()}else showEnd("Wrong","Score "+sc)};el.appendChild(b)})}
window.onGameStart=function(){sc=0;next()};
<\/script>`, 'Next number');

// List + handler
const ORDER = Object.keys(G);

function gamesList() {
  const lines = [
    '╭─── ᴄʜᴀᴛ ɢᴀᴍᴇꜱ ───╮',
    ...ORDER.map((id, i) => `│ ${String(i + 1).padStart(2, ' ')}. .${id}`),
    '╰────────────────╯',
  ];
  return lines.join('\n');
}

module.exports = {
  name: 'games-pack',
  pattern: 'games',
  aliases: ORDER,
  desc: 'HTML games',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'games') return reply(gamesList());
    if (!G[cmd]) return reply(gamesList());
    await sendHtmlApp(sock, jid, G[cmd], TITLES[cmd] || cmd);
  },
};
