/**
 * Bubble shooter mini game (in-chat HTML mini app). No network needed: everything is inline.
 */
const { sendHtmlApp } = require('../lib/htmlTransport');

function bubbleHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
body{font-family:system-ui,-apple-system,sans-serif;background:#0b1020;color:#eef2ff;min-height:100vh}
.top{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:linear-gradient(135deg,#1b1450,#0f3a5c)}
.top b{font-size:16px}.top span{font-size:12px;opacity:.85}
.stats{display:flex;gap:14px;font-size:12px}.stats i{font-style:normal;font-weight:700;color:#ffe27a}
#wrap{position:relative;padding:8px 10px 0}
canvas{width:100%;display:block;border-radius:16px;background:#101735;touch-action:none}
#msg{position:absolute;inset:8px 10px 0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:rgba(6,9,25,.78);border-radius:16px;text-align:center;padding:20px}
#msg h2{font-size:24px}#msg p{font-size:14px;opacity:.85}
.bar{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:8px;padding:10px}
.bar2{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 10px 14px}
button{border:0;border-radius:14px;padding:14px 6px;font-size:15px;font-weight:700;color:#fff;background:#26335f;touch-action:manipulation}
button:active{transform:scale(.96);filter:brightness(1.2)}
.fire{background:linear-gradient(135deg,#ff5f6d,#ffc371);color:#2a0a0a}
.sw{background:#2a6f6a}.nw{background:#5b3a8c}
</style></head><body>
<div class="top"><b>🫧 Bubble Shooter</b><div class="stats"><span>Score <i id="sc">0</i></span><span>Best <i id="bs">0</i></span><span>Lv <i id="lv">1</i></span></div></div>
<div id="wrap"><canvas id="c" width="288" height="470"></canvas>
<div id="msg"><h2 id="mt"></h2><p id="mp"></p><button class="fire" id="again" style="padding:14px 28px">Play again</button></div></div>
<div class="bar"><button id="L">◀ Aim</button><button class="fire" id="F">🚀 FIRE</button><button id="Rt">Aim ▶</button></div>
<div class="bar2"><button class="sw" id="S">🔄 Swap color</button><button class="nw" id="N">🆕 New game</button></div>
<script>
(function(){
var cv=document.getElementById('c'),g=cv.getContext('2d');
var W=288,H=470,R=16,COLS=9,RH=R*Math.sqrt(3),LIMIT=12,MAXR=14,SPEED=11;
var COLORS=['#ff4d6d','#ffb703','#3ddc84','#4cc9f0','#b388ff','#ff7ad9'];
var rows,off,cur,nxt,angle,shot,parts,score,best=0,level,shots,over,fallers;
try{best=+localStorage.getItem('bubbleBest')||0}catch(e){}
var $=function(i){return document.getElementById(i)};
function rc(r){return((r+off)%2)?COLS-1:COLS}
function pos(r,c){return{x:R+c*2*R+(((r+off)%2)?R:0),y:R+r*RH}}
function rnd(n){return Math.floor(Math.random()*n)}
function newRow(){var r=[],n=rc(0);for(var i=0;i<n;i++)r.push(rnd(Math.min(COLORS.length,3+Math.floor(level/2)+1)));return r}
function init(){
  off=0;rows=[];level=level||1;score=score||0;
  for(var r=0;r<5;r++){var n=rc(r),a=[];for(var c=0;c<n;c++)a.push(rnd(Math.min(COLORS.length,3+Math.floor(level/2)+1)));rows.push(a)}
  shot=null;parts=[];fallers=[];shots=0;over=false;angle=Math.PI/2;
  cur=pick();nxt=pick();hud();$('msg').style.display='none';
}
function colorsOnBoard(){var s={};rows.forEach(function(a){a.forEach(function(v){if(v>=0)s[v]=1})});return Object.keys(s).map(Number)}
function pick(){var cs=colorsOnBoard();if(!cs.length)return rnd(COLORS.length);return cs[rnd(cs.length)]}
function hud(){$('sc').textContent=score;$('bs').textContent=best;$('lv').textContent=level}
function nb(r,c){
  var o=[[r,c-1],[r,c+1]],odd=((r+off)%2)===1;
  [r-1,r+1].forEach(function(rr){if(odd){o.push([rr,c],[rr,c+1])}else{o.push([rr,c-1],[rr,c])}});
  return o.filter(function(p){return p[0]>=0&&p[0]<rows.length&&p[1]>=0&&p[1]<rc(p[0])});
}
function get(r,c){return rows[r]&&rows[r][c]!==undefined?rows[r][c]:-1}
function snap(x,y){
  var best=null,bd=1e9;
  for(var r=0;r<MAXR;r++){for(var c=0;c<rc(r);c++){
    if(r<rows.length&&rows[r][c]>=0)continue;
    var p=pos(r,c),d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);
    if(d<bd){bd=d;best=[r,c]}}}
  return best;
}
function settle(x,y,color){
  var cell=snap(x,y);if(!cell)return;
  while(rows.length<=cell[0]){var a=[];for(var i=0;i<rc(rows.length);i++)a.push(-1);rows.push(a)}
  rows[cell[0]][cell[1]]=color;
  var group=[],seen={},st=[cell];seen[cell.join()]=1;
  while(st.length){var p=st.pop();group.push(p);nb(p[0],p[1]).forEach(function(q){
    if(!seen[q.join()]&&get(q[0],q[1])===color){seen[q.join()]=1;st.push(q)}})}
  var popped=0;
  if(group.length>=3){
    group.forEach(function(p){burst(p[0],p[1],rows[p[0]][p[1]]);rows[p[0]][p[1]]=-1});
    popped=group.length;score+=popped*10;
    var drop=floating();score+=drop*20;
  }
  trim();
  shots++;
  if(!popped&&shots%5===0){addRow()}
  if(rows.length>LIMIT){var bad=false;for(var r=LIMIT;r<rows.length;r++)for(var c=0;c<rows[r].length;c++)if(rows[r][c]>=0)bad=true;if(bad)return end(false)}
  if(!colorsOnBoard().length){level++;score+=100;burstAll();rows=[];off=0;for(var r=0;r<4+Math.min(level,4);r++){var n=rc(r),a=[];for(var c=0;c<n;c++)a.push(rnd(Math.min(COLORS.length,3+Math.floor(level/2)+1)));rows.push(a)}}
  if(score>best){best=score;try{localStorage.setItem('bubbleBest',best)}catch(e){}}
  hud();
}
function floating(){
  var reach={},st=[],n=0;
  for(var c=0;c<rc(0);c++)if(get(0,c)>=0){reach['0,'+c]=1;st.push([0,c])}
  while(st.length){var p=st.pop();nb(p[0],p[1]).forEach(function(q){if(!reach[q.join()]&&get(q[0],q[1])>=0){reach[q.join()]=1;st.push(q)}})}
  for(var r=0;r<rows.length;r++)for(var c2=0;c2<rows[r].length;c2++)
    if(rows[r][c2]>=0&&!reach[r+','+c2]){var p2=pos(r,c2);fallers.push({x:p2.x,y:p2.y,vy:0,vx:(Math.random()-.5)*2,col:rows[r][c2]});rows[r][c2]=-1;n++}
  return n;
}
function trim(){while(rows.length>1&&rows[rows.length-1].every(function(v){return v<0}))rows.pop()}
function addRow(){off=1-off;rows.unshift(newRow())}
function burst(r,c,col){var p=pos(r,c);for(var i=0;i<8;i++)parts.push({x:p.x,y:p.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:1,col:col})}
function burstAll(){for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++)if(rows[r][c]>=0)burst(r,c,rows[r][c])}
function end(win){
  over=true;
  if(score>best){best=score;try{localStorage.setItem('bubbleBest',best)}catch(e){}}hud();
  $('mt').textContent='Game over';$('mp').textContent='Score '+score+' · Best '+best;$('msg').style.display='flex';
}
function fire(){
  if(shot||over)return;
  shot={x:W/2,y:H-34,vx:Math.cos(angle)*SPEED,vy:-Math.sin(angle)*SPEED,col:cur};
  cur=nxt;nxt=pick();
}
function swap(){if(shot||over)return;var t=cur;cur=nxt;nxt=t}
function step(){
  if(shot){
    for(var k=0;k<2&&shot;k++){
      shot.x+=shot.vx/2;shot.y+=shot.vy/2;
      if(shot.x<R){shot.x=R;shot.vx=-shot.vx}
      if(shot.x>W-R){shot.x=W-R;shot.vx=-shot.vx}
      var hit=shot.y<=R;
      if(!hit){outer:for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++){
        if(rows[r][c]<0)continue;var p=pos(r,c),dx=p.x-shot.x,dy=p.y-shot.y;
        if(dx*dx+dy*dy<(R*1.8)*(R*1.8)){hit=true;break outer}}}
      if(hit){var s=shot;shot=null;settle(s.x,s.y,s.col);if(!colorsOnBoard().length&&!over){}}
    }
  }
  parts.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l-=.035});parts=parts.filter(function(p){return p.l>0});
  fallers.forEach(function(f){f.vy+=.7;f.y+=f.vy;f.x+=f.vx});fallers=fallers.filter(function(f){return f.y<H+R});
}
function ball(x,y,col,rad){
  var gr=g.createRadialGradient(x-rad*.35,y-rad*.4,rad*.1,x,y,rad);
  gr.addColorStop(0,'#fff');gr.addColorStop(.25,COLORS[col]);gr.addColorStop(1,shade(COLORS[col]));
  g.fillStyle=gr;g.beginPath();g.arc(x,y,rad-1,0,6.2832);g.fill();
}
function shade(h){var n=parseInt(h.slice(1),16),r=(n>>16)*.55|0,gg=((n>>8)&255)*.55|0,b=(n&255)*.55|0;return'rgb('+r+','+gg+','+b+')'}
function guide(){
  if(shot||over)return;
  var x=W/2,y=H-34,vx=Math.cos(angle)*6,vy=-Math.sin(angle)*6;
  g.fillStyle='rgba(255,255,255,.55)';
  for(var i=0;i<60;i++){
    x+=vx;y+=vy;if(x<R||x>W-R){vx=-vx;x+=vx}
    if(y<R)break;
    var stop=false;for(var r=0;r<rows.length&&!stop;r++)for(var c=0;c<rows[r].length;c++){if(rows[r][c]<0)continue;var p=pos(r,c);if((p.x-x)*(p.x-x)+(p.y-y)*(p.y-y)<(R*1.6)*(R*1.6)){stop=true;break}}
    if(stop)break;
    if(i%2===0){g.beginPath();g.arc(x,y,2.2,0,6.2832);g.fill()}
  }
}
function draw(){
  g.clearRect(0,0,W,H);
  var bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#16204a');bg.addColorStop(1,'#0a0f26');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(255,90,110,.55)';g.setLineDash([6,6]);g.beginPath();var ly=R+LIMIT*RH-R*.4;g.moveTo(0,ly);g.lineTo(W,ly);g.stroke();g.setLineDash([]);
  for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++)if(rows[r][c]>=0){var p=pos(r,c);ball(p.x,p.y,rows[r][c],R)}
  fallers.forEach(function(f){ball(f.x,f.y,f.col,R)});
  parts.forEach(function(p){g.globalAlpha=Math.max(0,p.l);g.fillStyle=COLORS[p.col];g.beginPath();g.arc(p.x,p.y,3,0,6.2832);g.fill();g.globalAlpha=1});
  guide();
  if(shot)ball(shot.x,shot.y,shot.col,R);
  g.fillStyle='#1b2552';g.beginPath();g.arc(W/2,H-34,24,0,6.2832);g.fill();
  if(!shot)ball(W/2,H-34,cur,R);
  g.save();g.translate(W/2,H-34);g.rotate(Math.PI/2-angle);g.fillStyle='#8fa2ff';g.fillRect(-3,-34,6,14);g.restore();
  g.fillStyle='#ffffff99';g.font='11px system-ui';g.fillText('NEXT',14,H-36);ball(34,H-18,nxt,11);
}
function loop(){if(!over)step();draw();requestAnimationFrame(loop)}
function aimTo(e){
  var b=cv.getBoundingClientRect(),x=(e.clientX-b.left)*W/b.width,y=(e.clientY-b.top)*H/b.height;
  var a=Math.atan2(-(y-(H-34)),x-W/2);angle=Math.max(.18,Math.min(Math.PI-.18,a));
}
var down=false;
cv.addEventListener('pointerdown',function(e){down=true;aimTo(e)});
cv.addEventListener('pointermove',function(e){if(down)aimTo(e)});
cv.addEventListener('pointerup',function(e){if(down){aimTo(e);down=false;fire()}});
cv.addEventListener('pointercancel',function(){down=false});
function hold(id,d){
  var t=null,el=$(id);
  function go(){angle=Math.max(.18,Math.min(Math.PI-.18,angle+d))}
  el.addEventListener('pointerdown',function(e){e.preventDefault();go();clearInterval(t);t=setInterval(go,40)});
  ['pointerup','pointerleave','pointercancel'].forEach(function(ev){el.addEventListener(ev,function(){clearInterval(t)})});
}
hold('L',.045);hold('Rt',-.045);
$('F').addEventListener('click',fire);$('S').addEventListener('click',swap);
function fresh(){score=0;level=1;init()}
$('N').addEventListener('click',fresh);$('again').addEventListener('click',fresh);
window.__bubble={rows:function(){return rows},score:function(){return score},fire:fire,setAngle:function(a){angle=a},busy:function(){return !!shot},over:function(){return over},step:step};
level=1;score=0;init();loop();
})();
</script></body></html>`;
}

module.exports = {
  name: 'bubble',
  pattern: 'bubble',
  aliases: ['buble', 'bubbles', 'bubbleshooter'],
  desc: 'Bubble shooter mini game',
  category: 'games',
  async handler({ sock, jid, reply }) {
    try {
      await sendHtmlApp(sock, jid, bubbleHtml(), 'Bubble Shooter');
    } catch (e) {
      await reply('Could not open the mini game on this WhatsApp version: ' + (e.message || e));
    }
  },
  _html: bubbleHtml,
};
