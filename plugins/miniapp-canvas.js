const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Dino Run', `canvas{display:block;margin:0 auto;background:#111;width:100%;max-width:320px}
.row{display:flex;gap:8px;margin-top:8px}button{flex:1}`,
`<canvas id="c" width="320" height="140"></canvas>
<div class="row"><button id="j">Jump</button><button id="r">Restart</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y,vy,on,obs,sc,spd,acc;
function reset(){
  y=100;vy=0;on=true;obs=340;sc=0;spd=2.2;acc=0.0015;
}
function jump(){if(!on)return;if(y>=100)vy=-9}
document.getElementById('j').onclick=jump;c.onpointerdown=jump;
document.getElementById('r').onclick=()=>{reset();loop()};
function loop(){
  if(!on&&y===100)return;
  x.clearRect(0,0,320,140);
  x.fillStyle='#1f2c34';x.fillRect(0,120,320,20);
  x.fillStyle='#25D366';x.fillRect(28,y,20,20);
  x.fillStyle='#ef4444';x.fillRect(obs,100,16,22);
  if(on){
    y+=vy;vy+=0.55;if(y>100){y=100;vy=0}
    obs-=spd;spd=Math.min(9,spd+acc);
    if(obs<-20){obs=300+Math.random()*80;sc++}
    if(obs<48&&obs>18&&y>85){on=false}
  }
  x.fillStyle='#fff';x.font='12px system-ui';
  x.fillText('Score '+sc+'  spd '+spd.toFixed(1)+(on?'':'  · TAP RESTART'),8,14);
  if(on)requestAnimationFrame(loop);
  else {x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,0,320,140);x.fillStyle='#fff';x.font='16px system-ui';x.fillText('Game Over · '+sc,100,70)}
}
reset();loop();
<\/script>`);

module.exports = {
  name: 'miniapp',
  pattern: 'miniapp',
  aliases: ['app', 'canvas', 'dino'],
  desc: 'Dino Run (speed ramps up)',
  category: 'mini-apps',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, HTML, 'Dino Run');
  },
};
