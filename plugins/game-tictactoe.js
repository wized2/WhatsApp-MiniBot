const { sendHtmlApp } = require('../lib/htmlTransport');

const TTT_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box;touch-action:manipulation}
body{margin:0;background:#0b141a;color:#e9edef;font-family:system-ui,sans-serif}
.wrap{padding:12px;max-width:360px;margin:0 auto;text-align:center}
h3{margin:0 0 8px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px auto;max-width:240px}
.cell{aspect-ratio:1;border:0;border-radius:14px;background:#1f2c34;color:#e9edef;font-size:28px;font-weight:700}
.cell:disabled{opacity:.9}
.status{font-size:13px;opacity:.85;min-height:18px}
button.reset{margin-top:10px;border:0;border-radius:12px;padding:8px 16px;background:#25D366;color:#062;font-weight:700}
</style></head>
<body><div class="wrap">
<h3>Tic-Tac-Toe</h3>
<div class="status" id="s">You are X · bot is O</div>
<div class="grid" id="g"></div>
<button class="reset" id="r">New game</button>
<script>
const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let board=Array(9).fill(''),over=false;
const g=document.getElementById('g'),st=document.getElementById('s');
function winner(b){for(const[a,c,d] of wins){if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a]}return b.every(Boolean)?'draw':null}
function bot(){
  const empty=board.map((v,i)=>v?'':i).filter(v=>v!=='');
  // win / block
  for(const mark of ['O','X']){
    for(const i of empty){
      const t=board.slice();t[i]=mark;
      if(winner(t)===mark){board[i]='O';return}
    }
  }
  const pick=empty.includes(4)?4:empty[Math.floor(Math.random()*empty.length)];
  if(pick!==undefined)board[pick]='O';
}
function render(){
  g.innerHTML='';
  board.forEach((v,i)=>{
    const b=document.createElement('button');
    b.className='cell';b.textContent=v;b.disabled=!!v||over;
    b.onclick=()=>{
      if(over||board[i])return;
      board[i]='X';
      let w=winner(board);
      if(!w){bot();w=winner(board)}
      if(w==='X'){over=true;st.textContent='You win!'}
      else if(w==='O'){over=true;st.textContent='Bot wins'}
      else if(w==='draw'){over=true;st.textContent='Draw'}
      render();
    };
    g.appendChild(b);
  });
}
document.getElementById('r').onclick=()=>{board=Array(9).fill('');over=false;st.textContent='You are X · bot is O';render()};
render();
<\/script></div></body></html>`;

module.exports = {
  name: 'ttt',
  pattern: 'ttt',
  aliases: ['tictactoe', 'xo'],
  desc: 'In-chat tic-tac-toe mini-app',
  category: 'games',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, TTT_HTML, 'Tic-Tac-Toe');
  },
};
