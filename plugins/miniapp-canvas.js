/**
 * Mini-app style card: self-contained HTML/CSS/JS "canvas" description.
 *
 * True in-bubble HTML rendering depends on a Baileys fork that supports
 * embedded WebUI / GenAI HTML primitives. This plugin:
 *  1) Sends a rich text card that works everywhere
 *  2) Also attaches the HTML source so advanced clients / forks can use it
 */

const DINO_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;background:#0b141a;color:#e9edef;font-family:system-ui,sans-serif}
  .wrap{padding:12px}
  h3{margin:0 0 8px;font-size:16px}
  canvas{width:100%;max-width:360px;height:auto;background:#111;border-radius:12px;display:block}
  p{font-size:12px;opacity:.75;margin:8px 0 0}
</style></head>
<body><div class="wrap">
<h3>Dino Run (demo)</h3>
<canvas id="c" width="320" height="120"></canvas>
<p>Tap / space to jump · demo logic runs locally in compatible clients</p>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=80,vy=0,on=true,obs=300,sc=0;
function jump(){if(y>=80)vy=-8}
c.addEventListener('pointerdown',jump);
addEventListener('keydown',e=>{if(e.code==='Space')jump()});
function loop(){
  x.clearRect(0,0,320,120);
  x.fillStyle='#25D366';x.fillRect(30,y,18,18);
  x.fillStyle='#ef4444';x.fillRect(obs,90,14,20);
  y+=vy;vy+=0.5;if(y>80){y=80;vy=0}
  obs-=4;if(obs<-20){obs=320;sc++}
  if(obs<48&&obs>20&&y>70){on=false;x.fillStyle='#fff';x.fillText('Game Over · score '+sc,90,60);return}
  x.fillStyle='#fff';x.fillText('Score '+sc,8,14);
  if(on)requestAnimationFrame(loop);
}
loop();
<\/script></div></body></html>`;

module.exports = {
  name: 'miniapp',
  pattern: 'miniapp',
  aliases: ['app', 'canvas'],
  desc: 'In-chat mini-app card + HTML canvas demo',
  category: 'mini-apps',
  async handler({ reply, sock, jid, m }) {
    const card =
      '🧩 *Mini App · Canvas demo*\n\n' +
      'This is the *in-chat mini surface* style:\n' +
      '• Looks like a rich card in the thread\n' +
      '• Powered by HTML / CSS / JS (canvas game)\n' +
      '• Full interactive HTML needs a Baileys build with embedded WebUI support\n\n' +
      'On stock Baileys you still get this card + the HTML source below.\n\n' +
      '```html\n' +
      DINO_HTML.slice(0, 900) +
      '\n…```\n\n' +
      '_Tip: forks with `sendInlineWebUI` / embedded screens can render this HTML inside the bubble._';

    await reply(card);

    // Best-effort: if a fork exposes an inline HTML helper, use it
    try {
      if (typeof sock.sendInlineWebUI === 'function') {
        await sock.sendInlineWebUI(jid, DINO_HTML, 'Dino Run');
      }
    } catch (_) {
      /* optional */
    }
  },
};

module.exports.DINO_HTML = DINO_HTML;
