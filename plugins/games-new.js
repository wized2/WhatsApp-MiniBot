const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const G = {};
const TITLES = {};
function add(id, title, css, body, hint) {
  G[id] = shell(title, css || '', body, { hint: hint || 'Buttons', start: true });
  TITLES[id] = title;
}
const row = `.rowb{display:flex;gap:6px;margin-top:8px}.rowb button{flex:1;height:42px}`;
const grid2 = `.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}`;

add('slots', 'Slots', row,
`<div class="out" id="o" style="text-align:center;font-size:22px;letter-spacing:6px">- - -</div>
<div class="rowb"><button id="go" type="button">Spin</button></div>
<script>
var sym=["A","B","C","7","X","Z"];
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var a=sym[Math.floor(Math.random()*sym.length)];var b=sym[Math.floor(Math.random()*sym.length)];var c=sym[Math.floor(Math.random()*sym.length)];
document.getElementById("o").textContent=a+" "+b+" "+c;if(a===b&&b===c)showEnd("Jackpot",a+" "+b+" "+c)};
window.onGameStart=function(){document.getElementById("o").textContent="- - -"};
<\/script>`, 'Match three');

add('blackjack', 'Blackjack', row,
`<div class="out" id="o"></div>
<div class="rowb"><button id="hit" type="button">Hit</button><button id="stand" type="button">Stand</button></div>
<script>
var deck,player,dealer;
function val(h){var t=0,a=0;h.forEach(function(c){if(c===1){a++;t+=11}else t+=c});while(t>21&&a){t-=10;a--}return t}
function card(){return 1+Math.floor(Math.random()*13)>10?10:Math.min(10,1+Math.floor(Math.random()*13))}
function show(msg){document.getElementById("o").textContent="You: "+player.join(",")+" ("+val(player)+")\\nDealer: "+dealer.join(",")+" ("+val(dealer)+")"+(msg?"\\n"+msg:"")}
document.getElementById("hit").onclick=function(){if(!window.__gameRunning)return;player.push(card());if(val(player)>21){show("Bust");showEnd("Bust","Dealer wins")}else show("")};
document.getElementById("stand").onclick=function(){if(!window.__gameRunning)return;while(val(dealer)<17)dealer.push(card());var p=val(player),d=val(dealer);if(d>21||p>d)showEnd("You win","You "+p+" vs "+d);else if(p===d)showEnd("Push","Both "+p);else showEnd("Dealer wins","You "+p+" vs "+d)};
window.onGameStart=function(){player=[card(),card()];dealer=[card(),card()];show("")};
<\/script>`, 'Hit or Stand');

add('treasure', 'Treasure Hunt', '',
`<div class="out" id="o" style="text-align:center">Find the treasure</div>
<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px"></div>
<script>
window.onGameStart=function(){var prize=Math.floor(Math.random()*12),tries=0;var el=document.getElementById("g");el.innerHTML="";
for(var i=0;i<12;i++){(function(i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="44px";b.textContent="?";
b.onclick=function(){if(!window.__gameRunning||b.disabled)return;tries++;b.disabled=true;if(i===prize){b.textContent="*";showEnd("Found","Tries "+tries)}else b.textContent="."};el.appendChild(b)})(i)}};
<\/script>`, 'Tap tiles');

add('wordle', 'Word Guess', '',
`<div class="out" id="o" style="letter-spacing:3px;text-align:center;font-size:18px"></div>
<input id="in" maxlength="5" placeholder="5 letters" style="text-transform:uppercase"/>
<button class="p" id="go" type="button">Guess</button>
<div class="out" id="log"></div>
<script>
var words=["APPLE","HOUSE","PLANE","TRAIN","SMILE","BRAIN","CLOUD","LIGHT","WATER","MUSIC"];
var secret,tries;
function mask(){return Array(5).fill("_").join(" ")}
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;var g=(document.getElementById("in").value||"").toUpperCase().replace(/[^A-Z]/g,"");
if(g.length!==5)return;tries++;var row="";for(var i=0;i<5;i++){if(g[i]===secret[i])row+=g[i];else if(secret.indexOf(g[i])>=0)row+=g[i].toLowerCase();else row+="."}
document.getElementById("log").textContent+=row+"\\n";document.getElementById("in").value="";
if(g===secret)showEnd("Correct",secret+" in "+tries);else if(tries>=6)showEnd("Fail","Word was "+secret)};
window.onGameStart=function(){secret=words[Math.floor(Math.random()*words.length)];tries=0;document.getElementById("log").textContent="";document.getElementById("o").textContent=mask()};
<\/script>`, '5 letter word');

add('battleship', 'Battle Grid', '',
`<div class="out" id="o">Sink the ship (3 cells)</div>
<div id="g" style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:8px"></div>
<script>
window.onGameStart=function(){var cells=25,ship=[],hits=0,tries=0;while(ship.length<3){var n=Math.floor(Math.random()*cells);if(ship.indexOf(n)<0)ship.push(n)}
var el=document.getElementById("g");el.innerHTML="";
for(var i=0;i<cells;i++){(function(i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="36px";b.textContent="~";
b.onclick=function(){if(!window.__gameRunning||b.disabled)return;tries++;b.disabled=true;if(ship.indexOf(i)>=0){b.textContent="H";hits++;if(hits>=3)showEnd("Sunk","Shots "+tries)}else b.textContent="."};el.appendChild(b)})(i)}};
<\/script>`, 'Find 3 hits');

add('connect', 'Connect Three', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:200px;margin:0 auto"></div>
<script>
var board,turn;
function win(p){var L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];return L.some(function(l){return l.every(function(i){return board[i]===p})})}
function ren(){var el=document.getElementById("g");el.innerHTML="";board.forEach(function(v,i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="56px";b.textContent=v||".";
b.onclick=function(){if(!window.__gameRunning||board[i])return;board[i]=turn;if(win(turn)){ren();showEnd(turn+" wins","");return}if(board.every(Boolean)){ren();showEnd("Draw","");return}turn=turn==="X"?"O":"X";ren()};el.appendChild(b)})}
window.onGameStart=function(){board=Array(9).fill("");turn="X";ren()};
<\/script>`, 'Local 2-player');

add('tapcolor', 'Tap Color', '',
`<div id="box" style="height:90px;border-radius:12px;margin-bottom:8px"></div>
<div class="g2" id="a"></div>
<script>
var cols=[["Red","#ef4444"],["Green","#22c55e"],["Blue","#3b82f6"],["Yellow","#eab308"]];
var ans,sc,left;
function next(){var i=Math.floor(Math.random()*cols.length);ans=cols[i][0];document.getElementById("box").style.background=cols[i][1];
var el=document.getElementById("a");el.innerHTML="";cols.forEach(function(c){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=c[0];
b.onclick=function(){if(!window.__gameRunning)return;if(c[0]===ans){sc++;setStat("Score "+sc);next()}else showEnd("Wrong","Score "+sc)};el.appendChild(b)})}
window.onGameStart=function(){sc=0;next()};
<\/script>`, 'Match name');

add('runner', 'Lane Runner', row,
`<canvas id="c" width="280" height="200" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="l" type="button">Left</button><button id="r" type="button">Right</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),lane,obs,sc,iv;
document.getElementById("l").onclick=function(){lane=Math.max(0,lane-1)};
document.getElementById("r").onclick=function(){lane=Math.min(2,lane+1)};
function tick(){if(!window.__gameRunning)return;obs.forEach(function(o){o.y+=3});obs=obs.filter(function(o){return o.y<220});
if(Math.random()<0.05)obs.push({lane:Math.floor(Math.random()*3),y:-10});
for(var i=0;i<obs.length;i++){if(obs[i].lane===lane&&obs[i].y>150&&obs[i].y<180){clearInterval(iv);showEnd("Crash","Score "+sc);return}}
sc++;x.fillStyle="#0f172a";x.fillRect(0,0,280,200);for(var L=0;L<3;L++){x.strokeStyle="#1e293b";x.strokeRect(L*93+2,0,90,200)}
x.fillStyle="#38bdf8";x.fillRect(lane*93+30,160,30,20);x.fillStyle="#f43f5e";obs.forEach(function(o){x.fillRect(o.lane*93+30,o.y,30,20)});setStat("Score "+sc)}
window.onGameStart=function(){lane=1;obs=[];sc=0;clearInterval(iv);iv=setInterval(tick,40)};
<\/script>`, 'Change lanes');

add('aim', 'Target Aim', row,
`<canvas id="c" width="280" height="200" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="s" type="button">Shoot</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),tx,ty,sc,iv,cool;
document.getElementById("s").onclick=function(){if(!window.__gameRunning||cool)return;cool=1;setTimeout(function(){cool=0},300);
var dx=140-tx,dy=100-ty;if(Math.hypot(dx,dy)<22){sc++;tx=30+Math.random()*220;ty=30+Math.random()*140;setStat("Score "+sc)}};
function draw(){if(!window.__gameRunning)return;x.fillStyle="#0f172a";x.fillRect(0,0,280,200);x.fillStyle="#f43f5e";x.beginPath();x.arc(tx,ty,16,0,6.3);x.fill();
x.strokeStyle="#94a3b8";x.beginPath();x.moveTo(130,100);x.lineTo(150,100);x.moveTo(140,90);x.lineTo(140,110);x.stroke();requestAnimationFrame(draw)}
window.onGameStart=function(){tx=100;ty=80;sc=0;cool=0;draw()};
<\/script>`, 'Shoot when centered');

add('anomaly', 'Find Odd', '',
`<div class="out" id="q" style="text-align:center;font-size:22px"></div>
<div id="a" class="g2"></div>
<script>
function next(){var base=10+Math.floor(Math.random()*20);var odd=base+(Math.random()<0.5?1:-1);var opts=[base,base,base,odd].sort(function(){return Math.random()-0.5});
document.getElementById("q").textContent="Tap the different number";var el=document.getElementById("a");el.innerHTML="";
opts.forEach(function(v){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=v;
b.onclick=function(){if(v===odd){setStat("OK");next()}else showEnd("Wrong","It was "+odd)};el.appendChild(b)})}
window.onGameStart=function(){next()};
<\/script>`, 'Odd one out');

add('timerbeat', 'Beat Timer', row,
`<div class="out" id="o" style="text-align:center;font-size:28px">3.00</div>
<div class="rowb"><button id="s" type="button">Stop</button></div>
<script>
var t0,iv;
document.getElementById("s").onclick=function(){if(!window.__gameRunning)return;clearInterval(iv);var s=(Date.now()-t0)/1000;var diff=Math.abs(s-3);showEnd(diff<0.15?"Perfect":diff<0.4?"Close":"Miss",s.toFixed(2)+"s")};
window.onGameStart=function(){t0=Date.now();clearInterval(iv);iv=setInterval(function(){document.getElementById("o").textContent=((Date.now()-t0)/1000).toFixed(2)},50)};
<\/script>`, 'Stop at 3.00');

add('sortnum', 'Sort Numbers', '',
`<div id="g" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center"></div>
<script>
window.onGameStart=function(){var nums=[];while(nums.length<5){var n=1+Math.floor(Math.random()*20);if(nums.indexOf(n)<0)nums.push(n)}
var need=nums.slice().sort(function(a,b){return a-b});var pick=[];var el=document.getElementById("g");el.innerHTML="";
nums.forEach(function(n){var b=document.createElement("button");b.type="button";b.className="p";b.style.width="52px";b.textContent=n;
b.onclick=function(){if(!window.__gameRunning||b.disabled)return;b.disabled=true;pick.push(n);if(pick.length===need.length){var ok=pick.every(function(v,i){return v===need[i]});showEnd(ok?"Sorted":"Wrong",need.join(","))}};el.appendChild(b)})};
<\/script>`, 'Ascending order');

add('memorynum', 'Memory Digits', row,
`<div class="out" id="o" style="text-align:center;font-size:24px"></div>
<input id="in" placeholder="Type what you saw"/>
<div class="rowb"><button id="ok" type="button">Check</button></div>
<script>
var secret;
document.getElementById("ok").onclick=function(){if(!window.__gameRunning)return;var g=(document.getElementById("in").value||"").replace(/\\s/g,"");
if(g===secret)showEnd("Correct",secret);else showEnd("Wrong","Was "+secret)};
window.onGameStart=function(){secret=String(1000+Math.floor(Math.random()*9000));document.getElementById("o").textContent=secret;document.getElementById("in").value="";
setTimeout(function(){document.getElementById("o").textContent="????"},1200)};
<\/script>`, 'Remember digits');

add('gravity', 'Drop Catch', row,
`<canvas id="c" width="280" height="200" style="width:100%;max-width:280px;background:#0f172a;border-radius:12px"></canvas>
<div class="rowb"><button id="l" type="button">Left</button><button id="r" type="button">Right</button></div>
<script>
var c=document.getElementById("c"),x=c.getContext("2d"),px,ball,sc,iv;
document.getElementById("l").onclick=function(){px=Math.max(0,px-24)};
document.getElementById("r").onclick=function(){px=Math.min(230,px+24)};
function tick(){if(!window.__gameRunning)return;ball.y+=ball.v;if(ball.y>175&&ball.x>px&&ball.x<px+50){sc++;ball={x:Math.random()*260,y:0,v:2+Math.random()*2};setStat("Score "+sc)}
if(ball.y>210){clearInterval(iv);showEnd("Missed","Score "+sc);return}
x.fillStyle="#0f172a";x.fillRect(0,0,280,200);x.fillStyle="#22c55e";x.fillRect(px,185,50,8);x.fillStyle="#fbbf24";x.beginPath();x.arc(ball.x,ball.y,8,0,6.3);x.fill()}
window.onGameStart=function(){px=115;ball={x:140,y:0,v:2.5};sc=0;clearInterval(iv);iv=setInterval(tick,30)};
<\/script>`, 'Catch drops');

add('quizmath', 'Speed Math', '',
`<div class="out" id="q" style="text-align:center;font-size:22px"></div>
<div id="a" class="g2"></div>
<script>
var ans,sc,round;
function next(){if(round>=10){showEnd("Done","Score "+sc+"/10");return}
var a=2+Math.floor(Math.random()*12),b=2+Math.floor(Math.random()*12),op=Math.random()<0.5?"+":"*";
ans=op==="+"?a+b:a*b;document.getElementById("q").textContent=a+" "+op+" "+b;
var opts=[ans,ans+1,ans-1,ans+2].sort(function(){return Math.random()-0.5});
var el=document.getElementById("a");el.innerHTML="";opts.forEach(function(v){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=v;
b.onclick=function(){if(v===ans)sc++;round++;next()};el.appendChild(b)})}
window.onGameStart=function(){sc=0;round=0;next()};
<\/script>`, '10 rounds');

add('path', 'Safe Path', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px"></div>
<script>
window.onGameStart=function(){var safe={};var cur=0;safe[0]=1;while(cur<15){var n=cur+(Math.random()<0.5?1:4);if(n>15)n=15;safe[n]=1;cur=n}
var el=document.getElementById("g");el.innerHTML="";var pos=0;
for(var i=0;i<16;i++){(function(i){var b=document.createElement("button");b.type="button";b.className="p";b.style.height="40px";b.textContent=i===0?"S":i===15?"E":".";
b.onclick=function(){if(!window.__gameRunning)return;if(!safe[i]){showEnd("Trap","Failed");return}pos=i;b.style.background="#166534";if(i===15)showEnd("Safe","Reached end")};el.appendChild(b)})(i)}};
<\/script>`, 'Start to end');

add('mirror', 'Mirror Text', row,
`<div class="out" id="o" style="text-align:center;font-size:20px"></div>
<input id="in" placeholder="Type the mirror"/>
<div class="rowb"><button id="ok" type="button">Check</button></div>
<script>
var secret;
document.getElementById("ok").onclick=function(){if(!window.__gameRunning)return;var g=(document.getElementById("in").value||"");
if(g===secret)showEnd("Correct",secret);else showEnd("Wrong","Was "+secret)};
window.onGameStart=function(){var words=["hello","world","game","code","phone"];secret=words[Math.floor(Math.random()*words.length)];
document.getElementById("o").textContent=secret.split("").reverse().join("");document.getElementById("in").value=""};
<\/script>`, 'Un-mirror');

add('tapstop', 'Red Light', row,
`<div class="out" id="o" style="text-align:center;height:70px;line-height:70px;font-size:18px">Wait</div>
<div class="rowb"><button id="go" type="button">GO</button></div>
<script>
var ok=0;
document.getElementById("go").onclick=function(){if(!window.__gameRunning)return;if(!ok)showEnd("Early","Wait for GO");else showEnd("Good","Nice timing")};
window.onGameStart=function(){ok=0;document.getElementById("o").textContent="Wait";document.getElementById("o").style.background="#7f1d1d";
setTimeout(function(){if(!window.__gameRunning)return;ok=1;document.getElementById("o").textContent="GO";document.getElementById("o").style.background="#14532d"},1000+Math.random()*2500)};
<\/script>`, 'Wait then GO');

add('brick', 'Brick Count', '',
`<div class="out" id="q" style="text-align:center"></div>
<div id="a" class="g2"></div>
<script>
function next(){var n=3+Math.floor(Math.random()*6);document.getElementById("q").textContent=Array(n).fill("[#]").join(" ")+"\\nHow many?";
var opts=[n,n+1,n-1,n+2].filter(function(v){return v>0}).sort(function(){return Math.random()-0.5});
var el=document.getElementById("a");el.innerHTML="";opts.forEach(function(v){var b=document.createElement("button");b.type="button";b.className="p";b.textContent=v;
b.onclick=function(){if(v===n)next();else showEnd("Wrong","It was "+n)};el.appendChild(b)})}
window.onGameStart=function(){next()};
<\/script>`, 'Count blocks');

add('balance', 'Balance', row,
`<div class="out" id="o" style="text-align:center;font-size:18px"></div>
<div class="rowb"><button id="l" type="button">Left</button><button id="r" type="button">Right</button></div>
<script>
var bal,sc,iv;
function show(){document.getElementById("o").textContent="Balance: "+bal.toFixed(1)+"\\nKeep near 0"}
document.getElementById("l").onclick=function(){bal-=1.5};
document.getElementById("r").onclick=function(){bal+=1.5};
window.onGameStart=function(){bal=0;sc=0;clearInterval(iv);iv=setInterval(function(){if(!window.__gameRunning)return;bal+=(Math.random()-0.5)*0.8;sc++;show();setStat("Time "+sc);
if(Math.abs(bal)>8){clearInterval(iv);showEnd("Fell","Held "+sc+"s")}},200)};
<\/script>`, 'Keep balanced');

add('pixel', 'Pixel Art', '',
`<div id="g" style="display:grid;grid-template-columns:repeat(6,1fr);gap:2px;max-width:180px;margin:0 auto"></div>
<button class="p" id="clr" type="button">Clear</button>
<script>
window.onGameStart=function(){var el=document.getElementById("g");el.innerHTML="";for(var i=0;i<36;i++){var b=document.createElement("button");b.type="button";b.style.cssText="height:28px;border:0;border-radius:4px;background:#1e293b";
b.onclick=function(){this.style.background=this.style.background==="rgb(56, 189, 248)"?"#1e293b":"#38bdf8"};el.appendChild(b)}
document.getElementById("clr").onclick=function(){el.querySelectorAll("button").forEach(function(b){b.style.background="#1e293b"})}};
<\/script>`, 'Doodle');

const ORDER = Object.keys(G);
module.exports = {
  name: 'games-new',
  pattern: 'gamesnew',
  aliases: ORDER,
  desc: 'More games',
  category: 'games',
  async handler({ sock, jid, cmd, reply }) {
    if (cmd === 'gamesnew') {
      return reply(ORDER.map((id, i) => (i + 1) + '. .' + id).join('\n'));
    }
    if (!G[cmd]) return reply('Unknown. .games');
    await sendHtmlApp(sock, jid, G[cmd], TITLES[cmd] || cmd);
  },
};
