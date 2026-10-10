const { shell } = require('./gameShell');

const G = {};
const TITLES = {};

function add(id, title, css, body, hint) {
  G[id] = shell(title, css || '', body, { hint: hint || 'Buttons', start: true });
  TITLES[id] = title;
}

const row = `.rowb{display:flex;gap:6px;margin-top:8px}.rowb button{flex:1;height:42px}`;
const pad = `.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px;margin:8px auto}.pad button{height:42px}`;
const g2 = `.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}`;

// ——— Core classics (button only) ———
add('snake', 'Snake', pad,
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
<\/script>`);

add('dino', 'Dino Run', row,
`<canvas id="c" width="300" height="150" style="width:100%;max-width:300px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="jp" type="button">Jump</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),y,vy,obs,sc,spd,iv,ground=120;
function tick(){if(!window.__gameRunning)return;vy+=0.7;y+=vy;if(y>ground){y=ground;vy=0}
obs.forEach(function(o){o.x-=spd});obs=obs.filter(function(o){return o.x>-20});
if(Math.random()<0.03)obs.push({x:300,h:16+Math.random()*22});sc++;if(sc%120===0)spd=Math.min(spd+0.3,7);
for(var i=0;i<obs.length;i++){var o=obs[i];if(o.x<48&&o.x>20&&y>ground-o.h){clearInterval(iv);showEnd("Crashed","Score "+sc);return}}
x.fillStyle="#0f172a";x.fillRect(0,0,300,150);x.fillStyle="#334155";x.fillRect(0,ground,300,4);
x.fillStyle="#4ade80";x.fillRect(30,y-20,18,20);x.fillStyle="#f43f5e";obs.forEach(function(o){x.fillRect(o.x,ground-o.h,14,o.h)});setStat("Score "+sc)}
document.getElementById("jp").onclick=function(){if(y>=ground-1)vy=-9};
window.onGameStart=function(){y=ground;vy=0;obs=[];sc=0;spd=3;clearInterval(iv);iv=setInterval(tick,40)};
<\/script>`);

add('g2048', '2048', pad,
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
<\/script>`);

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
<\/script>`);

add('hangman', 'Hangman', '',
`<div class="out" id="w" style="font-size:22px;letter-spacing:4px;text-align:center"></div>
<div class="out" id="m" style="text-align:center"></div>
<div id="keys" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:8px"></div>
<script>
var words=["APPLE","PLANET","SCHOOL","MOBILE","ORANGE","GUITAR","FRIEND","BRIDGE","FOREST","CASTLE"];
var word,left,miss;
function ren(){document.getElementById("w").textContent=word.map(function(c){return left.indexOf(c)>=0?c:"_"}).join(" ");document.getElementById("m").textContent="Miss "+miss+"/6"}
window.onGameStart=function(){word=words[Math.floor(Math.random()*words.length)].split("");left=[word[0]];miss=0;ren();
var k=document.getElementById("keys");k.innerHTML="";
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function(ch){var b=document.createElement("button");b.type="button";b.textContent=ch;b.style.cssText="width:28px;height:32px;border:0;border-radius:8px;background:#1e293b;color:#fff;font-size:12px";
b.onclick=function(){if(!window.__gameRunning||b.disabled)return;b.disabled=true;if(word.indexOf(ch)>=0){if(left.indexOf(ch)<0)left.push(ch);ren();if(word.every(function(c){return left.indexOf(c)>=0}))showEnd("You win",word.join(""))}
else{miss++;ren();if(miss>=6)showEnd("Lost",word.join(""))}};k.appendChild(b)})};
<\/script>`);

add('memory', 'Memory', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px"></div>
<script>
window.onGameStart=function(){var em=["A","B","C","D","E","F","G","H"];var cards=em.concat(em).sort(function(){return Math.random()-0.5});
var open=[],lock=0,matched=0,el=document.getElementById("g");el.innerHTML="";
cards.forEach(function(c,i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="48px";b.textContent="?";
b.onclick=function(){if(lock||b.dataset.m||!window.__gameRunning)return;b.textContent=c;open.push({b:b,c:c});
if(open.length===2){lock=1;if(open[0].c===open[1].c){open[0].b.dataset.m=1;open[1].b.dataset.m=1;matched++;open=[];lock=0;if(matched===8)showEnd("Cleared","Nice")}
else{setTimeout(function(){open[0].b.textContent="?";open[1].b.textContent="?";open=[];lock=0},450)}}};el.appendChild(b)})};
<\/script>`);

add('pong', 'Pong', row,
`<canvas id="c" width="280" height="200" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="u" type="button">Paddle Up</button><button id="d" type="button">Paddle Down</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),py,bx,by,vx,vy,sc,iv;
document.getElementById("u").onclick=function(){py=Math.max(0,py-24)};
document.getElementById("d").onclick=function(){py=Math.min(160,py+24)};
function tick(){if(!window.__gameRunning)return;bx+=vx;by+=vy;if(by<4||by>196)vy*=-1;
if(bx<16&&by>py&&by<py+40){vx=Math.abs(vx);sc++}if(bx>276)vx*=-1;if(bx<0){clearInterval(iv);showEnd("Miss","Score "+sc);return}
x.fillStyle="#0f172a";x.fillRect(0,0,280,200);x.fillStyle="#38bdf8";x.fillRect(6,py,8,40);x.fillStyle="#fff";x.beginPath();x.arc(bx,by,5,0,6.3);x.fill();setStat("Score "+sc)}
window.onGameStart=function(){py=80;bx=140;by=100;vx=-3;vy=2;sc=0;clearInterval(iv);iv=setInterval(tick,30)};
<\/script>`);

add('breakout', 'Breakout', row,
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
<\/script>`);

add('flappy', 'Flappy', row,
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
<\/script>`);

add('mines', 'Mines', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(6,1fr);gap:3px"></div>
<script>
window.onGameStart=function(){var W=6,H=6,M=6,mine={},open={};while(Object.keys(mine).length<M){mine[Math.floor(Math.random()*W*H)]=1}
function n(i){var x=i%W,y=Math.floor(i/W),c=0;for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&mine[ny*W+nx])c++}return c}
function ren(){var el=document.getElementById("g");el.innerHTML="";for(var i=0;i<W*H;i++){(function(i){var b=document.createElement("button");b.type="button";b.style.cssText="height:36px;border:0;border-radius:6px;background:#1e293b;color:#fff;font-size:12px";
if(open[i]){b.style.background="#334155";b.textContent=mine[i]?"*":(n(i)||"");if(mine[i])b.style.color="#f43f5e"}
b.onclick=function(){if(!window.__gameRunning||open[i])return;open[i]=1;if(mine[i]){Object.keys(mine).forEach(function(k){open[k]=1});ren();showEnd("Boom","Hit a mine");return}
ren();if(W*H-Object.keys(open).length<=M)showEnd("Clear","Nice")};el.appendChild(b)})(i)}}
ren()};
<\/script>`);

add('rps', 'RPS', row,
`<div class="out" id="o" style="text-align:center;min-height:48px">Pick</div>
<div class="rowb"><button id="rk" type="button">Rock</button><button id="pp" type="button">Paper</button><button id="sc" type="button">Scissors</button></div>
<script>
function play(you){var ai=["rock","paper","scissors"][Math.floor(Math.random()*3)];var r="Draw";
if((you==="rock"&&ai==="scissors")||(you==="paper"&&ai==="rock")||(you==="scissors"&&ai==="paper"))r="You win";
else if(you!==ai)r="You lose";document.getElementById("o").textContent="You: "+you+" | Bot: "+ai+" | "+r}
document.getElementById("rk").onclick=function(){play("rock")};document.getElementById("pp").onclick=function(){play("paper")};document.getElementById("sc").onclick=function(){play("scissors")};
window.onGameStart=function(){document.getElementById("o").textContent="Pick"};
<\/script>`);

// Previous expansion set
add('react', 'Reaction', row,
`<div class="out" id="o" style="text-align:center;min-height:60px">Wait for green</div>
<div class="rowb"><button id="go" type="button">Tap</button></div>
<script>
var t0=0,armed=0;
window.onGameStart=function(){armed=0;document.getElementById("o").textContent="Wait for green";document.getElementById("o").style.background="#1e293b";
setTimeout(function(){if(!window.__gameRunning)return;armed=1;t0=Date.now();document.getElementById("o").textContent="TAP NOW";document.getElementById("o").style.background="#166534"},800+Math.random()*2200)};
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;if(!armed){document.getElementById("o").textContent="Too early";return}showEnd("Reaction",(Date.now()-t0)+" ms")};
<\/script>`);

add('simon', 'Simon', row,
`<div class="out" id="o" style="text-align:center">Watch</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
<button id="b0" type="button" class="p" style="background:#ef4444;height:48px">1</button>
<button id="b1" type="button" class="p" style="background:#22c55e;height:48px">2</button>
<button id="b2" type="button" class="p" style="background:#3b82f6;height:48px">3</button>
<button id="b3" type="button" class="p" style="background:#eab308;height:48px">4</button></div>
<script>
var seq,pos,lock;
function flash(i){var b=document.getElementById("b"+i);b.style.opacity="0.4";setTimeout(function(){b.style.opacity="1"},250)}
function playSeq(){lock=1;document.getElementById("o").textContent="Watch";var i=0;var t=setInterval(function(){if(i>=seq.length){clearInterval(t);lock=0;pos=0;document.getElementById("o").textContent="Your turn";return}flash(seq[i]);i++},500)}
function press(i){if(lock||!window.__gameRunning)return;flash(i);if(seq[pos]!==i){showEnd("Wrong","Level "+seq.length);return}pos++;if(pos>=seq.length){seq.push(Math.floor(Math.random()*4));setTimeout(playSeq,400)}}
[0,1,2,3].forEach(function(i){document.getElementById("b"+i).onclick=function(){press(i)}});
window.onGameStart=function(){seq=[Math.floor(Math.random()*4)];pos=0;setTimeout(playSeq,300)};
<\/script>`);

add('slots', 'Slots', row,
`<div class="out" id="o" style="text-align:center;font-size:22px;letter-spacing:6px">- - -</div>
<div class="rowb"><button id="go" type="button">Spin</button></div>
<script>
var sym=["A","B","C","7","X","Z"];
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var a=sym[Math.floor(Math.random()*sym.length)];var b=sym[Math.floor(Math.random()*sym.length)];var c=sym[Math.floor(Math.random()*sym.length)];
document.getElementById("o").textContent=a+" "+b+" "+c;if(a===b&&b===c)showEnd("Jackpot",a+" "+b+" "+c)};
window.onGameStart=function(){document.getElementById("o").textContent="- - -"};
<\/script>`);

add('blackjack', 'Blackjack', row,
`<div class="out" id="o"></div>
<div class="rowb"><button id="hit" type="button">Hit</button><button id="stand" type="button">Stand</button></div>
<script>
var player,dealer;
function val(h){var t=0,a=0;h.forEach(function(c){if(c===1){a++;t+=11}else t+=c});while(t>21&&a){t-=10;a--}return t}
function card(){var n=1+Math.floor(Math.random()*13);return n>10?10:n}
function show(){document.getElementById("o").textContent="You: "+player.join(",")+" ("+val(player)+")\\nDealer: "+dealer.join(",")+" ("+val(dealer)+")"}
document.getElementById("hit").onclick=function(){if(!window.__gameRunning)return;player.push(card());if(val(player)>21){show();showEnd("Bust","Dealer wins")}else show()};
document.getElementById("stand").onclick=function(){if(!window.__gameRunning)return;while(val(dealer)<17)dealer.push(card());var p=val(player),d=val(dealer);if(d>21||p>d)showEnd("You win","You "+p+" vs "+d);else if(p===d)showEnd("Push","Both "+p);else showEnd("Dealer wins","You "+p+" vs "+d)};
window.onGameStart=function(){player=[card(),card()];dealer=[card(),card()];show()};
<\/script>`);

add('wordle', 'Word Guess', '',
`<div class="out" id="o" style="letter-spacing:3px;text-align:center;font-size:18px"></div>
<input id="in" maxlength="5" placeholder="5 letters" style="text-transform:uppercase"/>
<button class="p" id="go" type="button">Guess</button>
<div class="out" id="log"></div>
<script>
var words=["APPLE","HOUSE","PLANE","TRAIN","SMILE","BRAIN","CLOUD","LIGHT","WATER","MUSIC"];
var secret,tries;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var g=(document.getElementById("in").value||"").toUpperCase().replace(/[^A-Z]/g,"");
if(g.length!==5)return;tries++;var row="";for(var i=0;i<5;i++){if(g[i]===secret[i])row+=g[i];else if(secret.indexOf(g[i])>=0)row+=g[i].toLowerCase();else row+="."}
document.getElementById("log").textContent+=row+"\\n";document.getElementById("in").value="";
if(g===secret)showEnd("Correct",secret+" in "+tries);else if(tries>=6)showEnd("Fail","Word was "+secret)};
window.onGameStart=function(){secret=words[Math.floor(Math.random()*words.length)];tries=0;document.getElementById("log").textContent="";document.getElementById("o").textContent="_ _ _ _ _"};
<\/script>`);

// ——— Brand new unique games ———
add('sudoku4', 'Mini Sudoku', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-width:200px;margin:0 auto"></div>
<div class="out" id="h">Fill 1-4, no repeat row/col</div>
<script>
window.onGameStart=function(){var puzzle=[1,2,0,0,0,0,3,4,0,0,0,1,2,3,0,0];var sol=[1,2,3,4,3,4,1,2,4,1,2,3,2,3,4,1];
var grid=puzzle.slice();function ren(){var el=document.getElementById("g");el.innerHTML="";grid.forEach(function(v,i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="40px";b.textContent=v||".";
if(puzzle[i]){b.disabled=true;b.style.opacity="0.7"}
b.onclick=function(){if(!window.__gameRunning)return;grid[i]=(grid[i]%4)+1;ren()};el.appendChild(b)});
if(grid.every(function(v,i){return v===sol[i]}))showEnd("Solved","Nice")}
ren()};
<\/script>`);

add('life', 'Life Step', row,
`<canvas id="c" width="240" height="240" style="width:100%;max-width:240px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="step" type="button">Step</button><button id="rand" type="button">Random</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),N=12,S=20,g;
function ren(){x.fillStyle="#0f172a";x.fillRect(0,0,240,240);for(var i=0;i<N;i++)for(var j=0;j<N;j++){if(g[i][j]){x.fillStyle="#22c55e";x.fillRect(j*S+1,i*S+1,S-2,S-2)}}}
function step(){var n=[];for(var i=0;i<N;i++){n[i]=[];for(var j=0;j<N;j++){var c0=0;for(var di=-1;di<=1;di++)for(var dj=-1;dj<=1;dj++)if(di||dj){var ii=i+di,jj=j+dj;if(ii>=0&&jj>=0&&ii<N&&jj<N&&g[ii][jj])c0++}
n[i][j]=g[i][j]?(c0===2||c0===3):c0===3}}g=n;ren()}
document.getElementById("step").onclick=function(){if(window.__gameRunning)step()};
document.getElementById("rand").onclick=function(){if(!window.__gameRunning)return;for(var i=0;i<N;i++)for(var j=0;j<N;j++)g[i][j]=Math.random()<0.3;ren()};
window.onGameStart=function(){g=[];for(var i=0;i<N;i++){g[i]=[];for(var j=0;j<N;j++)g[i][j]=Math.random()<0.25}ren()};
<\/script>`);

add('cipher', 'Cipher Crack', '',
`<div class="out" id="o" style="text-align:center"></div>
<input id="in" placeholder="Decode"/>
<button class="p" id="go" type="button">Check</button>
<script>
var secret,shift;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var g=(document.getElementById("in").value||"").toUpperCase().replace(/[^A-Z]/g,"");
if(g===secret)showEnd("Cracked",secret);else document.getElementById("o").textContent="Wrong. Cipher: "+document.getElementById("o").dataset.c};
window.onGameStart=function(){var words=["HELLO","WORLD","SECRET","CODE","AGENT"];secret=words[Math.floor(Math.random()*words.length)];shift=1+Math.floor(Math.random()*5);
var c=secret.split("").map(function(ch){return String.fromCharCode((ch.charCodeAt(0)-65+shift)%26+65)}).join("");
document.getElementById("o").textContent="Caesar +"+shift+": "+c;document.getElementById("o").dataset.c=c;document.getElementById("in").value=""};
<\/script>`);

add('traffic', 'Traffic Light', row,
`<div class="out" id="o" style="text-align:center;height:64px;line-height:64px">Red - wait</div>
<div class="rowb"><button id="go" type="button">Drive</button></div>
<script>
var phase;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;if(phase!=="green")showEnd("Crash","Went on "+phase);else showEnd("Safe","Good timing")};
window.onGameStart=function(){phase="red";document.getElementById("o").textContent="Red - wait";document.getElementById("o").style.background="#7f1d1d";
setTimeout(function(){if(!window.__gameRunning)return;phase="yellow";document.getElementById("o").textContent="Yellow";document.getElementById("o").style.background="#854d0e";
setTimeout(function(){if(!window.__gameRunning)return;phase="green";document.getElementById("o").textContent="Green - go";document.getElementById("o").style.background="#14532d"},800+Math.random()*800)},1200+Math.random()*1500)};
<\/script>`);

add('elevator', 'Elevator', row,
`<div class="out" id="o" style="text-align:center">Floor 1 · Goal 5</div>
<div class="rowb"><button id="up" type="button">Up</button><button id="dn" type="button">Down</button></div>
<script>
var floor,goal,moves;
function show(){document.getElementById("o").textContent="Floor "+floor+" · Goal "+goal+" · Moves "+moves}
document.getElementById("up").onclick=function(){if(!window.__gameRunning)return;floor=Math.min(10,floor+1);moves++;show();if(floor===goal)showEnd("Arrived","Moves "+moves)};
document.getElementById("dn").onclick=function(){if(!window.__gameRunning)return;floor=Math.max(1,floor-1);moves++;show();if(floor===goal)showEnd("Arrived","Moves "+moves)};
window.onGameStart=function(){floor=1;goal=3+Math.floor(Math.random()*7);moves=0;show()};
<\/script>`);

add('recipe', 'Recipe Mix', '',
`<div class="out" id="o" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
var need,have;
function ren(){document.getElementById("o").textContent="Need: "+need.join(" + ");var el=document.getElementById("a");el.innerHTML="";
["Flour","Egg","Milk","Sugar","Butter","Salt"].forEach(function(ing){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=ing+(have.indexOf(ing)>=0?" *":"");
b.onclick=function(){if(!window.__gameRunning)return;if(have.indexOf(ing)>=0)have=have.filter(function(x){return x!==ing});else have.push(ing);ren();
if(have.length===need.length&&need.every(function(x){return have.indexOf(x)>=0}))showEnd("Cooked","Perfect")};el.appendChild(b)})}
window.onGameStart=function(){var pool=["Flour","Egg","Milk","Sugar","Butter","Salt"];need=pool.sort(function(){return Math.random()-0.5}).slice(0,3);have=[];ren()};
<\/script>`);

add('radar', 'Radar Sweep', row,
`<canvas id="c" width="240" height="240" style="width:100%;max-width:240px;background:#020617;border-radius:12px"></canvas>
<div class="rowb"><button id="lock" type="button">Lock</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),ang,tx,ty,iv;
document.getElementById("lock").onclick=function(){if(!window.__gameRunning)return;var beam=ang%(Math.PI*2);var t=Math.atan2(ty-120,tx-120);var d=Math.abs(Math.atan2(Math.sin(beam-t),Math.cos(beam-t)));
if(d<0.25)showEnd("Locked","Hit");else document.getElementById("lock").textContent="Miss - retry"};
function draw(){if(!window.__gameRunning)return;ang+=0.04;x.fillStyle="#020617";x.fillRect(0,0,240,240);x.strokeStyle="#14532d";x.beginPath();x.arc(120,120,100,0,6.3);x.stroke();
x.strokeStyle="#22c55e";x.beginPath();x.moveTo(120,120);x.lineTo(120+Math.cos(ang)*100,120+Math.sin(ang)*100);x.stroke();
x.fillStyle="#f43f5e";x.beginPath();x.arc(tx,ty,6,0,6.3);x.fill();requestAnimationFrame(draw)}
window.onGameStart=function(){ang=0;tx=60+Math.random()*120;ty=60+Math.random()*120;document.getElementById("lock").textContent="Lock";draw()};
<\/script>`);

add('orchestra', 'Rhythm Tap', row,
`<div class="out" id="o" style="text-align:center">Memorize beats</div>
<div class="rowb"><button id="tap" type="button">Tap</button><button id="done" type="button">Done</button></div>
<script>
var pattern,user,playing;
function playPat(){playing=1;document.getElementById("o").textContent="Listen...";var i=0;var t=setInterval(function(){document.getElementById("o").textContent=pattern[i]?"BEAT":"...";i++;if(i>=pattern.length){clearInterval(t);playing=0;document.getElementById("o").textContent="Your turn - tap then Done"}},400)}
document.getElementById("tap").onclick=function(){if(playing||!window.__gameRunning)return;user.push(1);document.getElementById("o").textContent="Taps "+user.length};
document.getElementById("done").onclick=function(){if(playing||!window.__gameRunning)return;if(user.length===pattern.filter(Boolean).length)showEnd("In time","Good ear");else showEnd("Off beat","Try again")};
window.onGameStart=function(){pattern=[1,0,1,1,0,1];user=[];playPat()};
<\/script>`);

add('vault', 'Vault Code', '',
`<div class="out" id="o" style="text-align:center;font-size:20px">????</div>
<div id="pad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px;margin:8px auto"></div>
<script>
window.onGameStart=function(){var code=String(1000+Math.floor(Math.random()*9000));var enter="";var tries=0;
function ren(){document.getElementById("o").textContent=(enter+"????").slice(0,4)}
var el=document.getElementById("pad");el.innerHTML="";
[1,2,3,4,5,6,7,8,9,0,"C","OK"].forEach(function(k){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=k;b.style.height="40px";
b.onclick=function(){if(!window.__gameRunning)return;if(k==="C")enter="";else if(k==="OK"){tries++;if(enter===code)showEnd("Open","Tries "+tries);else{enter="";document.getElementById("o").textContent="Wrong"}}
else if(enter.length<4)enter+=k;ren()};el.appendChild(b)});ren()};
<\/script>`);

add('farm', 'Pixel Farm', row,
`<div class="out" id="o" style="text-align:center"></div>
<div class="rowb"><button id="plant" type="button">Plant</button><button id="water" type="button">Water</button><button id="harvest" type="button">Harvest</button></div>
<script>
var stage,wet,crops;
function show(){document.getElementById("o").textContent="Stage: "+stage+" | Wet: "+(wet?"yes":"no")+" | Crops: "+crops}
document.getElementById("plant").onclick=function(){if(!window.__gameRunning)return;if(stage==="empty"){stage="seed";show()}};
document.getElementById("water").onclick=function(){if(!window.__gameRunning)return;wet=1;if(stage==="seed")stage="sprout";else if(stage==="sprout")stage="ripe";show()};
document.getElementById("harvest").onclick=function(){if(!window.__gameRunning)return;if(stage==="ripe"&&wet){crops++;stage="empty";wet=0;show();if(crops>=3)showEnd("Harvest","Crops "+crops)}else show()};
window.onGameStart=function(){stage="empty";wet=0;crops=0;show()};
<\/script>`);

add('taxi', 'Taxi Fare', '',
`<div class="out" id="o" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
function next(){var km=2+Math.floor(Math.random()*12);var rate=50;var ans=100+km*rate;document.getElementById("o").textContent="Base 100 + "+km+" km x "+rate+" = ?";
var opts=[ans,ans+50,ans-50,ans+100].sort(function(){return Math.random()-0.5});var el=document.getElementById("a");el.innerHTML="";
opts.forEach(function(v){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=v;
b.onclick=function(){if(v===ans)next();else showEnd("Wrong","Fare was "+ans)};el.appendChild(b)})}
window.onGameStart=function(){next()};
<\/script>`);

add('constellation', 'Stars', '',
`<div class="out" id="o">Connect stars in order 1-5</div>
<canvas id="c" width="260" height="200" style="width:100%;max-width:260px;background:#020617;border-radius:12px"></canvas>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),stars,next;
function draw(){x.fillStyle="#020617";x.fillRect(0,0,260,200);stars.forEach(function(s,i){x.fillStyle=i<next?"#38bdf8":"#f8fafc";x.beginPath();x.arc(s.x,s.y,8,0,6.3);x.fill();x.fillStyle="#0f172a";x.font="10px sans-serif";x.fillText(String(i+1),s.x-3,s.y+3)})}
c.onclick=function(e){if(!window.__gameRunning)return;var r=c.getBoundingClientRect();var mx=(e.clientX-r.left)*(c.width/r.width),my=(e.clientY-r.top)*(c.height/r.height);
var s=stars[next];if(s&&Math.hypot(mx-s.x,my-s.y)<16){next++;draw();if(next>=5)showEnd("Linked","Constellation")}};
window.onGameStart=function(){stars=[];for(var i=0;i<5;i++)stars.push({x:30+Math.random()*200,y:30+Math.random()*140});next=0;draw()};
<\/script>`);

add('chef', 'Order Up', '',
`<div class="out" id="order" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
var menu=["Burger","Fries","Cola","Salad","Pizza","Soup"];
var order,sc;
function next(){order=menu[Math.floor(Math.random()*menu.length)];document.getElementById("order").textContent="Customer wants: "+order;
var opts=menu.slice().sort(function(){return Math.random()-0.5}).slice(0,4);if(opts.indexOf(order)<0)opts[0]=order;
var el=document.getElementById("a");el.innerHTML="";opts.forEach(function(item){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=item;
b.onclick=function(){if(item===order){sc++;setStat("Served "+sc);if(sc>=5)showEnd("Rush done","Served "+sc);else next()}else showEnd("Wrong order","Served "+sc)};el.appendChild(b)})}
window.onGameStart=function(){sc=0;next()};
<\/script>`);

add('battery', 'Charge Rush', row,
`<div class="out" id="o" style="text-align:center;font-size:28px">0%</div>
<div class="rowb"><button id="ch" type="button">Charge</button></div>
<script>
var pct,drain,iv;
document.getElementById("ch").onclick=function(){if(!window.__gameRunning)return;pct=Math.min(100,pct+7);document.getElementById("o").textContent=pct+"%";if(pct>=100){clearInterval(iv);showEnd("Full","Charged")}};
window.onGameStart=function(){pct=20;drain=1;document.getElementById("o").textContent=pct+"%";clearInterval(iv);
iv=setInterval(function(){if(!window.__gameRunning)return;pct=Math.max(0,pct-drain);document.getElementById("o").textContent=pct+"%";if(pct<=0){clearInterval(iv);showEnd("Dead","Battery empty")}},400)};
<\/script>`);

add('maze', 'Maze 5x5', pad,
`<div id="g" style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;max-width:220px;margin:0 auto"></div>
<div class="pad"><i></i><button id="u" type="button">Up</button><i></i>
<button id="l" type="button">Left</button><button id="r" type="button">Right</button><i></i>
<i></i><button id="d" type="button">Down</button><i></i></div>
<script>
var N=5,wall,px,py;
function ren(){var el=document.getElementById("g");el.innerHTML="";for(var y=0;y<N;y++)for(var x=0;x<N;x++){var d=document.createElement("div");d.style.cssText="height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;background:"+(wall[y][x]?"#334155":"#0f172a");
if(x===px&&y===py)d.textContent="P";if(x===N-1&&y===N-1)d.textContent=d.textContent||"E";el.appendChild(d)}}
function tryMove(dx,dy){var nx=px+dx,ny=py+dy;if(nx<0||ny<0||nx>=N||ny>=N||wall[ny][nx])return;px=nx;py=ny;ren();if(px===N-1&&py===N-1)showEnd("Escaped","Maze clear")}
[["u",0,-1],["d",0,1],["l",-1,0],["r",1,0]].forEach(function(z){document.getElementById(z[0]).onclick=function(){if(window.__gameRunning)tryMove(z[1],z[2])}});
window.onGameStart=function(){wall=[];for(var y=0;y<N;y++){wall[y]=[];for(var x=0;x<N;x++)wall[y][x]=Math.random()<0.22&&!(x===0&&y===0)&&!(x===N-1&&y===N-1)}
px=0;py=0;ren()};
<\/script>`);

add('typing', 'Type Race', '',
`<div class="out" id="q" style="text-align:center"></div>
<input id="in" placeholder="Type exactly"/>
<button class="p" id="go" type="button">Submit</button>
<script>
var phrases=["hello world","mini bot games","type this fast","practice makes better","whatsapp mini app"];
var target,t0;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var g=document.getElementById("in").value;if(g===target)showEnd("Done",(Date.now()-t0)+" ms");else document.getElementById("q").textContent=target+" (mismatch)"};
window.onGameStart=function(){target=phrases[Math.floor(Math.random()*phrases.length)];t0=Date.now();document.getElementById("q").textContent=target;document.getElementById("in").value=""};
<\/script>`);

add('budget', 'Budget Day', '',
`<div class="out" id="o" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
var money,day;
function next(){document.getElementById("o").textContent="Day "+day+" | Cash "+money;var cost=10+Math.floor(Math.random()*40);var el=document.getElementById("a");el.innerHTML="";
[["Buy "+cost,cost],["Skip",0]].forEach(function(pair){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=pair[0];
b.onclick=function(){money-=pair[1];if(money<0){showEnd("Broke","Day "+day);return}day++;if(day>7)showEnd("Survived","Cash "+money);else next()};el.appendChild(b)})}
window.onGameStart=function(){money=100;day=1;next()};
<\/script>`);

add('pulse', 'Pulse Match', row,
`<div class="out" id="o" style="text-align:center">Match the tempo</div>
<div class="rowb"><button id="tap" type="button">Pulse</button></div>
<script>
var times,need;
document.getElementById("tap").onclick=function(){if(!window.__gameRunning)return;times.push(Date.now());document.getElementById("o").textContent="Beats "+times.length+"/4";
if(times.length>=4){var gaps=[];for(var i=1;i<times.length;i++)gaps.push(times[i]-times[i-1]);var avg=gaps.reduce(function(a,b){return a+b},0)/gaps.length;
var ok=gaps.every(function(g){return Math.abs(g-avg)<120});showEnd(ok?"Steady":"Uneven","Avg "+Math.round(avg)+"ms")}};
window.onGameStart=function(){times=[];document.getElementById("o").textContent="Tap 4 steady beats"};
<\/script>`);

add('shop', 'Shopkeeper', '',
`<div class="out" id="o" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
var cash,left;
function deal(){if(left<=0){showEnd("Closed","Profit "+cash);return}
var price=20+Math.floor(Math.random()*80);var offer=price+Math.floor(Math.random()*30)-10;document.getElementById("o").textContent="Cost "+price+" | Customer offers "+offer;
var el=document.getElementById("a");el.innerHTML="";[["Accept",1],["Refuse",0]].forEach(function(p){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=p[0];
b.onclick=function(){if(p[1]&&offer>=price)cash+=offer-price;left--;deal()};el.appendChild(b)})}
window.onGameStart=function(){cash=0;left=6;deal()};
<\/script>`);

add('wires', 'Wire Match', '',
`<div class="out" id="o">Pair colors (A1 B2...)</div>
<div id="a" class="g2"></div>
<script>
window.onGameStart=function(){var pairs=[["A","1"],["B","2"],["C","3"]];var left={A:"1",B:"2",C:"3"};var pick=null;var el=document.getElementById("a");el.innerHTML="";
var nodes=["A","B","C","1","2","3"].sort(function(){return Math.random()-0.5});
nodes.forEach(function(n){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=n;
b.onclick=function(){if(!window.__gameRunning||b.disabled)return;if(!pick){pick=n;b.style.outline="2px solid #38bdf8"}
else{var ok=(left[pick]===n)||(left[n]===pick);if(ok){b.disabled=true;document.querySelectorAll("button").forEach(function(x){if(x.textContent===pick)x.disabled=true});delete left[pick];delete left[n];pick=null;
if(!Object.keys(left).filter(function(k){return k.length===1&&k>="A"&&k<="C"}).length)showEnd("Linked","All wires");}
else{pick=null;document.querySelectorAll("button").forEach(function(x){x.style.outline=""})}}};el.appendChild(b)})};
<\/script>`);

add('forecast', 'Weather Call', '',
`<div class="out" id="o" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
function next(){var days=["Mon","Tue","Wed"];var temps=days.map(function(){return 15+Math.floor(Math.random()*15)});
document.getElementById("o").textContent=days.map(function(d,i){return d+": "+temps[i]+"C"}).join(" | ")+"\\nWarmest day?";
var max=Math.max.apply(null,temps);var el=document.getElementById("a");el.innerHTML="";
days.forEach(function(d,i){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=d;
b.onclick=function(){if(temps[i]===max)next();else showEnd("Wrong","Warmest was "+days[temps.indexOf(max)])};el.appendChild(b)})}
window.onGameStart=function(){next()};
<\/script>`);

add('robot', 'Robot Path', pad,
`<div class="out" id="o" style="text-align:center">Get to X</div>
<canvas id="c" width="200" height="200" style="width:100%;max-width:200px;background:#0f172a;border-radius:12px"></canvas>
<div class="pad"><i></i><button id="u" type="button">Up</button><i></i>
<button id="l" type="button">Left</button><button id="r" type="button">Right</button><i></i>
<i></i><button id="d" type="button">Down</button><i></i></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),N=5,S=40,rx,ry,gx,gy;
function draw(){x.fillStyle="#0f172a";x.fillRect(0,0,200,200);for(var i=0;i<=N;i++){x.strokeStyle="#1e293b";x.beginPath();x.moveTo(i*S,0);x.lineTo(i*S,200);x.moveTo(0,i*S);x.lineTo(200,i*S);x.stroke()}
x.fillStyle="#f43f5e";x.fillRect(gx*S+8,gy*S+8,S-16,S-16);x.fillStyle="#38bdf8";x.fillRect(rx*S+10,ry*S+10,S-20,S-20)}
function mv(dx,dy){rx=Math.max(0,Math.min(N-1,rx+dx));ry=Math.max(0,Math.min(N-1,ry+dy));draw();if(rx===gx&&ry===gy)showEnd("Goal","Robot arrived")}
[["u",0,-1],["d",0,1],["l",-1,0],["r",1,0]].forEach(function(z){document.getElementById(z[0]).onclick=function(){if(window.__gameRunning)mv(z[1],z[2])}});
window.onGameStart=function(){rx=0;ry=0;gx=3+Math.floor(Math.random()*2);gy=3+Math.floor(Math.random()*2);draw()};
<\/script>`);

add('anagram', 'Anagram', '',
`<div class="out" id="o" style="text-align:center;font-size:20px"></div>
<input id="in" placeholder="Unscramble"/>
<button class="p" id="go" type="button">Check</button>
<script>
var words=["LISTEN","SILENT","EARTH","HEART","NIGHT","THING"];
var secret;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var g=(document.getElementById("in").value||"").toUpperCase().replace(/[^A-Z]/g,"");
if(g===secret)showEnd("Yes",secret);else document.getElementById("o").textContent=document.getElementById("o").dataset.sc+" (try again)"};
window.onGameStart=function(){secret=words[Math.floor(Math.random()*words.length)];var sc=secret.split("").sort(function(){return Math.random()-0.5}).join("");
document.getElementById("o").textContent=sc;document.getElementById("o").dataset.sc=sc;document.getElementById("in").value=""};
<\/script>`);

add('bridge', 'Bridge Build', row,
`<div class="out" id="o" style="text-align:center"></div>
<div class="rowb"><button id="wood" type="button">Wood</button><button id="stone" type="button">Stone</button></div>
<script>
var need,built;
function show(){document.getElementById("o").textContent="Need: "+need.join(", ")+"\\nBuilt: "+built.join(", ")}
function add(mat){if(!window.__gameRunning)return;built.push(mat);show();if(built.length===need.length){var ok=built.every(function(m,i){return m===need[i]});showEnd(ok?"Strong":"Collapsed",ok?"Crossed":"Wrong order")}}
document.getElementById("wood").onclick=function(){add("Wood")};document.getElementById("stone").onclick=function(){add("Stone")};
window.onGameStart=function(){need=[];for(var i=0;i<4;i++)need.push(Math.random()<0.5?"Wood":"Stone");built=[];show()};
<\/script>`);

add('satellite', 'Sat Align', row,
`<canvas id="c" width="240" height="180" style="width:100%;max-width:240px;background:#020617;border-radius:12px"></canvas>
<div class="rowb"><button id="l" type="button">Rotate L</button><button id="r" type="button">Rotate R</button><button id="ok" type="button">Lock</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),ang,target;
function draw(){x.fillStyle="#020617";x.fillRect(0,0,240,180);x.strokeStyle="#334155";x.beginPath();x.arc(120,90,50,0,6.3);x.stroke();
x.strokeStyle="#fbbf24";x.beginPath();x.moveTo(120,90);x.lineTo(120+Math.cos(target)*50,90+Math.sin(target)*50);x.stroke();
x.strokeStyle="#38bdf8";x.beginPath();x.moveTo(120,90);x.lineTo(120+Math.cos(ang)*50,90+Math.sin(ang)*50);x.stroke()}
document.getElementById("l").onclick=function(){ang-=0.2;draw()};document.getElementById("r").onclick=function(){ang+=0.2;draw()};
document.getElementById("ok").onclick=function(){if(!window.__gameRunning)return;var d=Math.abs(Math.atan2(Math.sin(ang-target),Math.cos(ang-target)));if(d<0.2)showEnd("Aligned","Signal OK");else document.getElementById("ok").textContent="Off - adjust"};
window.onGameStart=function(){ang=0;target=Math.random()*Math.PI*2;document.getElementById("ok").textContent="Lock";draw()};
<\/script>`);

add('guessnum', 'Guess Number', '',
`<div class="out" id="o" style="text-align:center">Guess 1-50</div>
<input id="in" type="number" min="1" max="50"/>
<button class="p" id="go" type="button">Guess</button>
<script>
var secret,tries;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var g=+(document.getElementById("in").value);tries++;
if(g===secret)showEnd("Yes","Tries "+tries);else document.getElementById("o").textContent=g<secret?"Higher":"Lower"};
window.onGameStart=function(){secret=1+Math.floor(Math.random()*50);tries=0;document.getElementById("o").textContent="Guess 1-50";document.getElementById("in").value=""};
<\/script>`);

add('quiz', 'Quick Quiz', '',
`<div class="out" id="q"></div><div id="a"></div>
<script>
var Q=[{q:"2+2?",o:["3","4","5"],c:1},{q:"Capital of France?",o:["Paris","Rome","Madrid"],c:0},{q:"HTML is?",o:["Language","Protocol","Markup"],c:2},{q:"5*6?",o:["30","11","56"],c:0}];
var i,sc;
function show(){if(i>=Q.length){showEnd("Done","Score "+sc+"/"+Q.length);return}var x=Q[i];document.getElementById("q").textContent=x.q;var el=document.getElementById("a");el.innerHTML="";
x.o.forEach(function(t,n){var b=document.createElement("button");b.type="button";b.className="p sec";b.style.marginTop="6px";b.textContent=t;
b.onclick=function(){if(n===x.c)sc++;i++;show()};el.appendChild(b)})}
window.onGameStart=function(){i=0;sc=0;show()};
<\/script>`);

module.exports = { G, TITLES, ORDER: Object.keys(G) };
