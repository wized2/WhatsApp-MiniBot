/**
 * Compact, beautiful HTML shell for in-chat mini apps.
 * Start + End overlays included. Keep payload small for all WA clients.
 */
function shell(title, css, bodyAndScript, opts = {}) {
  const needStart = opts.start !== false;
  const startLabel = opts.startLabel || '▶  Start';
  const hint = opts.hint || 'Tap Start when ready';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;background:transparent;font-family:system-ui,-apple-system,sans-serif;color:#f1f5f9}
.gw{max-width:420px;margin:0 auto;padding:8px}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.title{font-weight:800;font-size:15px;letter-spacing:.2px}
.sub{font-size:10px;color:#94a3b8;margin-top:2px}
.panel{background:#0f172a;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px;position:relative;overflow:hidden;min-height:140px}
canvas{display:block;margin:0 auto;border-radius:12px;background:#020617;max-width:100%}
button{border:0;border-radius:12px;padding:10px 12px;background:linear-gradient(180deg,#34d399,#10b981);color:#052e1c;font-weight:800;font-size:13px;margin:2px;box-shadow:0 2px 10px rgba(16,185,129,.25)}
button:active{transform:scale(.97);opacity:.9}
button.sec{background:#1e293b;color:#e2e8f0;box-shadow:none;border:1px solid rgba(255,255,255,.08)}
input,textarea,select{width:100%;border:0;border-radius:12px;padding:10px 12px;background:#1e293b;color:#f1f5f9;font-size:14px;margin:5px 0;border:1px solid rgba(255,255,255,.08)}
p,.hint{font-size:11px;color:#94a3b8;margin:4px 0}
.row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.score{font-size:11px;color:#cbd5e1;margin-top:6px}
.brand{font-size:8px;color:#475569;text-align:center;margin-top:6px;letter-spacing:.8px}
.scr{position:absolute;inset:0;background:rgba(2,6,23,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:30;border-radius:16px;padding:16px;text-align:center}
.scr.hid{display:none}
.scr h4{margin:0 0 6px;font-size:17px;font-weight:800}
.scr p{margin:0 0 12px;color:#94a3b8;font-size:12px}
.scr button{min-width:150px;padding:12px 18px;font-size:14px}
${css || ''}
</style></head><body><div class="gw">
<div class="head"><div><div class="title">${title}</div><div class="sub">${hint}</div></div><div class="score" id="stat"></div></div>
<div class="panel" id="gameRoot">
${needStart ? `<div id="startScr" class="scr"><h4>${title}</h4><p>${hint}</p><button id="btnStart">${startLabel}</button></div>` : ''}
<div id="endScr" class="scr hid"><h4 id="endTitle">Game Over</h4><p id="endMsg"></p><button id="btnRestart">↻  Restart</button></div>
<div id="playArea">${bodyAndScript}</div>
</div>
<div class="brand">MINIBOT · HTML MINI APP</div>
<script>
window.__gameRunning=false;
window.showEnd=function(t,m){window.__gameRunning=false;var e=document.getElementById('endScr');if(!e)return;
  document.getElementById('endTitle').textContent=t||'Game Over';document.getElementById('endMsg').textContent=m||'';e.classList.remove('hid')};
window.hideEnd=function(){var e=document.getElementById('endScr');if(e)e.classList.add('hid')};
window.hideStart=function(){var e=document.getElementById('startScr');if(e)e.classList.add('hid')};
window.setStat=function(t){var s=document.getElementById('stat');if(s)s.textContent=t||''};
(function(){var bs=document.getElementById('btnStart'),br=document.getElementById('btnRestart');
function go(){hideStart();hideEnd();window.__gameRunning=true;if(typeof window.onGameStart==='function')window.onGameStart()}
if(bs)bs.onclick=go;if(br)br.onclick=go})();
<\/script>
</div></body></html>`;
}

function utilShell(title, css, bodyAndScript) {
  return shell(title, css, bodyAndScript, { start: false, hint: 'All tools in one place' });
}

module.exports = { shell, utilShell };
