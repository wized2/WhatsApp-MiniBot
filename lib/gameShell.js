/**
 * Mobile-safe HTML shell for in-chat mini apps.
 * Includes Start screen + End/Restart overlay for every game.
 */
function shell(title, css, bodyAndScript, opts = {}) {
  const needStart = opts.start !== false;
  const startLabel = opts.startLabel || 'Start';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
body{margin:0;background:linear-gradient(165deg,#0a1218,#0f1c24 50%,#0b141a);color:#e9edef;font-family:system-ui,-apple-system,sans-serif;overflow-x:hidden;min-height:100%}
.wrap{padding:12px;max-width:420px;margin:0 auto;position:relative}
h3{margin:0 0 10px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}
h3:before{content:"";width:4px;height:16px;border-radius:4px;background:#25D366;flex-shrink:0}
canvas{display:block;margin:0 auto;border-radius:14px;background:#0d1117;box-shadow:0 4px 20px rgba(0,0,0,.35);max-width:100%}
button{border:0;border-radius:12px;padding:10px 14px;background:linear-gradient(180deg,#2be076,#1fad5a);color:#062810;font-weight:700;font-size:13px;margin:3px;box-shadow:0 2px 8px rgba(37,211,102,.25)}
button:active{transform:scale(.97);opacity:.9}
button.sec{background:#1f2c34;color:#e9edef;box-shadow:none}
input,textarea,select{width:100%;border:0;border-radius:12px;padding:11px 12px;background:#1a2430;color:#e9edef;font-size:15px;margin:6px 0}
p,.hint{font-size:12px;opacity:.75;margin:6px 0}
.card{background:rgba(31,44,52,.85);border-radius:16px;padding:12px;margin:8px 0;border:1px solid rgba(255,255,255,.06)}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.score{font-size:12px;opacity:.85;margin-top:6px}
/* Start / End overlays */
.scr{position:absolute;inset:0;background:rgba(8,14,18,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;border-radius:12px;padding:20px;text-align:center}
.scr.hid{display:none}
.scr h4{margin:0 0 8px;font-size:18px}
.scr p{margin:0 0 14px;opacity:.8;font-size:13px}
.scr button{min-width:140px;padding:12px 20px;font-size:15px}
#gameRoot{position:relative;min-height:120px}
${css || ''}
</style></head><body><div class="wrap">
<h3>${title}</h3>
<div id="gameRoot">
${needStart ? `<div id="startScr" class="scr"><h4>${title}</h4><p>${opts.hint || 'Tap Start when ready'}</p><button id="btnStart">${startLabel}</button></div>` : ''}
<div id="endScr" class="scr hid"><h4 id="endTitle">Game Over</h4><p id="endMsg"></p><button id="btnRestart">Restart</button></div>
<div id="playArea">${bodyAndScript}</div>
</div>
<script>
window.__gameRunning=false;
window.showEnd=function(title,msg){
  window.__gameRunning=false;
  var e=document.getElementById('endScr');
  if(!e)return;
  document.getElementById('endTitle').textContent=title||'Game Over';
  document.getElementById('endMsg').textContent=msg||'';
  e.classList.remove('hid');
};
window.hideEnd=function(){var e=document.getElementById('endScr');if(e)e.classList.add('hid')};
window.hideStart=function(){var e=document.getElementById('startScr');if(e)e.classList.add('hid')};
(function(){
  var bs=document.getElementById('btnStart');
  var br=document.getElementById('btnRestart');
  function go(){hideStart();hideEnd();window.__gameRunning=true;if(typeof window.onGameStart==='function')window.onGameStart()}
  if(bs)bs.onclick=go;
  if(br)br.onclick=go;
})();
<\/script>
</div></body></html>`;
}

/** Utility mini-app shell (no game start screen) */
function utilShell(title, css, bodyAndScript) {
  return shell(title, css, bodyAndScript, { start: false });
}

module.exports = { shell, utilShell };
