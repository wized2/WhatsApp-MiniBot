const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Dino Run',
`canvas{width:100%;max-width:300px}`,
`<canvas id="c" width="300" height="140"></canvas>
<button id="j" style="width:100%;margin-top:6px">Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y,vy,on,obs,sc,spd,raf;
function jump(){if(window.__gameRunning&&on&&y>=100)vy=-9}
document.getElementById('j').onclick=jump;c.onpointerdown=jump;
function loop(){
  if(!window.__gameRunning){raf=requestAnimationFrame(loop);return}
  x.clearRect(0,0,300,140);
  x.fillStyle='#1f2c34';x.fillRect(0,120,300,20);
  x.fillStyle='#25D366';x.fillRect(28,y,18,18);
  x.fillStyle='#ef4444';x.fillRect(obs,100,14,20);
  if(on){
    y+=vy;vy+=0.55;if(y>100){y=100;vy=0}
    obs-=spd;spd=Math.min(7,spd+0.0012);
    if(obs<-20){obs=280+Math.random()*60;sc++}
    if(obs<46&&obs>16&&y>85){on=false;showEnd('Game Over','Score '+sc+' · max spd '+spd.toFixed(1))}
  }
  x.fillStyle='#fff';x.font='12px system-ui';
  x.fillText('Score '+sc+'  spd '+spd.toFixed(1),8,14);
  raf=requestAnimationFrame(loop);
}
window.onGameStart=function(){y=100;vy=0;on=true;obs=320;sc=0;spd=1.8;cancelAnimationFrame(raf);loop()};
<\/script>`,
{ hint: 'Starts slow · speeds up · Jump' });

module.exports = {
  name: 'miniapp',
  pattern: 'miniapp',
  aliases: ['app', 'canvas', 'dino'],
  desc: 'Dino Run mini-app',
  category: 'mini-apps',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, HTML, 'Dino Run');
  },
};
