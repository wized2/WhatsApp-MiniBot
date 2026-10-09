const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Tic-Tac-Toe', `.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto}
.cell{aspect-ratio:1;border:0;border-radius:14px;background:#1f2c34;color:#fff;font-size:28px;font-weight:700}`,
`<div id="s" style="text-align:center;font-size:13px;margin-bottom:8px">You X · Bot O</div>
<div class="grid" id="g"></div>
<button id="r" style="width:100%;margin-top:10px">New game</button>
<script>
const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let board=Array(9).fill(''),over=false;
const g=document.getElementById('g'),st=document.getElementById('s');
function winner(b){for(const[a,c,d] of wins){if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a]}return b.every(Boolean)?'draw':null}
function bot(){const empty=board.map((v,i)=>v?'':i).filter(v=>v!=='');
  for(const mark of ['O','X']){for(const i of empty){const t=board.slice();t[i]=mark;if(winner(t)===mark){board[i]='O';return}}}
  const pick=empty.includes(4)?4:empty[Math.floor(Math.random()*empty.length)];if(pick!==undefined)board[pick]='O'}
function render(){g.innerHTML='';board.forEach((v,i)=>{const b=document.createElement('button');b.className='cell';b.textContent=v;b.disabled=!!v||over;
  b.onclick=()=>{if(over||board[i])return;board[i]='X';let w=winner(board);if(!w){bot();w=winner(board)}
    if(w==='X'){over=true;st.textContent='You win!'}else if(w==='O'){over=true;st.textContent='Bot wins'}else if(w==='draw'){over=true;st.textContent='Draw'}
    render()};g.appendChild(b)})}
document.getElementById('r').onclick=()=>{board=Array(9).fill('');over=false;st.textContent='You X · Bot O';render()};
render();
<\/script>`);

module.exports = {
  name: 'ttt',
  pattern: 'ttt',
  aliases: ['tictactoe', 'xo'],
  desc: 'Tic-tac-toe mini-app',
  category: 'games',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, HTML, 'Tic-Tac-Toe');
  },
};
