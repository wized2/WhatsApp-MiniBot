/** Wrap game body HTML into a mobile-safe document */
function shell(title, css, bodyAndScript) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#0b141a;color:#e9edef;font-family:system-ui,sans-serif;overflow:hidden}
.wrap{padding:10px;max-width:420px;margin:0 auto}
h3{margin:0 0 6px;font-size:15px}
canvas,button,.cell{border-radius:12px}
button{border:0;padding:8px 12px;background:#25D366;color:#062;font-weight:700;margin:3px}
${css}
</style></head><body><div class="wrap"><h3>${title}</h3>${bodyAndScript}</div></body></html>`;
}
module.exports = { shell };
