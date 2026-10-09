const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Dino Run', `canvas{display:block;margin:0 auto;background:#111;width:100%;max-width:320px}`,
`<canvas id="c" width="320" height="140"></canvas>
<button id="j" style="width:100%;margin-top:6px">Jump</button>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=100,vy=0,on=true,obs=300,sc=0;
function jump(){if(y>=100)vy=-9}
document.getElementById('j').onclick=jump;c.onpointerdown=jump;
function loop(){
  x.clearRect(0,0,320,140);x.fillStyle='#1f2c34';x.fillRect(0,120,320,20);
  x.fillStyle='#25D366';x.fillRect(28,y,20,20);x.fillStyle='#ef4444';x.fillRect(obs,100,16,22);
  y+=vy;vy+=0.55;if(y>100){y=100;vy=0}
  obs-=5;if(obs<-20){obs=320;sc++}
  if(obs<48&&obs>18&&y>85){on=false;x.fillStyle='#fff';x.fillText('Game Over '+sc,100,70)}
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  if(on)requestAnimationFrame(loop);
}
loop();
<\/script>`);

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
