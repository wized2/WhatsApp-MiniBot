const { sendHtmlApp } = require('../lib/htmlTransport');

const DINO_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation}
body{margin:0;background:#0b141a;color:#e9edef;font-family:system-ui,sans-serif;overflow:hidden}
.wrap{padding:10px}
h3{margin:0 0 6px;font-size:15px}
canvas{width:100%;max-width:360px;height:auto;background:#111;border-radius:12px;display:block;margin:0 auto}
.bar{display:flex;justify-content:space-between;font-size:12px;opacity:.85;margin-top:6px}
btn,button{border:0;border-radius:10px;padding:8px 14px;background:#25D366;color:#062;font-weight:700}
</style></head>
<body><div class="wrap">
<h3>Dino Run</h3>
<canvas id="c" width="320" height="140"></canvas>
<div class="bar"><span id="sc">Score 0</span><button id="j">Jump</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=100,vy=0,on=true,obs=300,sc=0;
function jump(){if(y>=100)vy=-9}
document.getElementById('j').onclick=jump;
c.addEventListener('pointerdown',jump);
function loop(){
  x.clearRect(0,0,320,140);
  x.fillStyle='#1f2c34';x.fillRect(0,120,320,20);
  x.fillStyle='#25D366';x.fillRect(28,y,20,20);
  x.fillStyle='#ef4444';x.fillRect(obs,100,16,22);
  y+=vy;vy+=0.55;if(y>100){y=100;vy=0}
  obs-=5;if(obs<-20){obs=320+Math.random()*40;sc++}
  if(obs<48&&obs>18&&y>85){on=false;x.fillStyle='#fff';x.font='16px system-ui';x.fillText('Game Over · '+sc,90,70)}
  document.getElementById('sc').textContent='Score '+sc;
  if(on)requestAnimationFrame(loop);
}
loop();
<\/script></div></body></html>`;

module.exports = {
  name: 'miniapp',
  pattern: 'miniapp',
  aliases: ['app', 'canvas', 'dino'],
  desc: 'In-chat HTML mini-app (Dino Run)',
  category: 'mini-apps',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, DINO_HTML, 'Dino Run');
  },
};
