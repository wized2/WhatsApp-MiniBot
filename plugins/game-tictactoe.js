const { sendHtmlApp } = require('../lib/htmlTransport');
const { shell } = require('../lib/gameShell');

const HTML = shell('Tic-Tac-Toe',
`.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:220px;margin:0 auto}
.cell{aspect-ratio:1;border:0;border-radius:14px;background:#1a2430;color:#fff;font-size:28px;font-weight:700}`,
`<div class="grid" id="g"></div>
<script>
const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let board,over;
function winner(b){for(const[a,c,d] of wins){if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a]}return b.every(Boolean)?'draw':null}
function bot(){
  const empty=board.map((v,i)=>v?'':i).filter(v=>v!=='');
  if(Math.random()<0.5){board[empty[Math.floor(Math.random()*empty.length)]]='O';return}
  for(const mark of ['O','X']){for(const i of empty){const t=board.slice();t[i]=mark;if(winner(t)===mark){board[i]='O';return}}}
  board[empty[Math.floor(Math.random()*empty.length)]]='O';
}
function render(){
  const g=document.getElementById('g');g.innerHTML='';
  board.forEach((v,i)=>{const b=document.createElement('button');b.className='cell';b.textContent=v;b.disabled=!!v||over;
    b.onclick=()=>{if(!window.__gameRunning||over||board[i])return;board[i]='X';
      let w=winner(board);if(!w){bot();w=winner(board)}
      if(w==='X'){over=true;showEnd('You Win!','Nice game')}
      else if(w==='O'){over=true;showEnd('Bot wins','Try again')}
      else if(w==='draw'){over=true;showEnd('Draw','Close one')}
      render()};g.appendChild(b)});
}
window.onGameStart=function(){board=Array(9).fill('');over=false;render()};
<\/script>`,
{ hint: 'Fair AI · you can win' });

module.exports = {
  name: 'ttt',
  pattern: 'ttt',
  aliases: ['tictactoe', 'xo'],
  desc: 'Tic-tac-toe fair AI',
  category: 'games',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, HTML, 'Tic-Tac-Toe');
  },
};
