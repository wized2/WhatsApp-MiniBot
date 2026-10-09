/** Mobile-safe HTML shell for in-chat mini apps (keep payload small). */
function shell(title, css, bodyAndScript) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
body{margin:0;background:linear-gradient(165deg,#0a1218 0%,#0f1c24 50%,#0b141a 100%);color:#e9edef;font-family:system-ui,-apple-system,sans-serif;overflow-x:hidden;min-height:100%}
.wrap{padding:12px 12px 16px;max-width:420px;margin:0 auto}
h3{margin:0 0 10px;font-size:15px;font-weight:700;letter-spacing:.3px;display:flex;align-items:center;gap:8px}
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
${css||''}
</style></head><body><div class="wrap"><h3>${title}</h3>${bodyAndScript}</div></body></html>`;
}
module.exports = { shell };
