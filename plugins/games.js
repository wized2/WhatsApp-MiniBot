/**
 * .game / .games — mini-app with popular casual games.
 * Text fallbacks also work without HTML: .rps .dice .coin .guess
 */
const { sendHtmlApp } = require('../lib/htmlTransport');

const TRIVIA = [
  { q: 'Capital of Pakistan?', a: 'islamabad' },
  { q: 'How many continents?', a: '7' },
  { q: 'Largest planet in our solar system?', a: 'jupiter' },
  { q: 'Who wrote Romeo and Juliet?', a: 'shakespeare' },
  { q: 'Chemical symbol for gold?', a: 'au' },
  { q: 'Fastest land animal?', a: 'cheetah' },
  { q: 'How many sides does a hexagon have?', a: '6' },
  { q: 'Primary color that is not red or blue?', a: 'yellow' },
  { q: 'Year Pakistan was founded?', a: '1947' },
  { q: 'What gas do plants absorb?', a: 'carbon dioxide' },
];

const WORDS = [
  'apple', 'river', 'phone', 'cloud', 'tiger', 'music', 'pizza', 'earth',
  'light', 'water', 'happy', 'green', 'magic', 'robot', 'chess', 'ocean',
];

function gamesHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0b1220;color:#e8eef8;min-height:100vh}
.top{padding:14px 16px;background:linear-gradient(135deg,#1a1530,#122a40);border-bottom:1px solid #334}
.top h1{font-size:17px;font-weight:700}
.top p{font-size:11px;opacity:.7;margin-top:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px}
.app{background:#152033;border:1px solid #243044;border-radius:16px;padding:14px 10px;text-align:center;cursor:pointer}
.app:active{transform:scale(.97)}
.app .ic{font-size:24px;margin-bottom:6px}
.app .lb{font-size:12px;font-weight:600}
.panel{display:none;padding:14px}
.panel.on{display:block}
.back{margin:0 0 12px;background:transparent;border:1px solid #345;color:#9ab;border-radius:10px;padding:8px 12px}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:12px auto}
.cell{aspect-ratio:1;background:#0e1726;border:1px solid #2a3a50;border-radius:12px;font-size:28px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.btn{flex:1;border:0;border-radius:12px;padding:12px;font-weight:700;font-size:13px;cursor:pointer;background:#25D366;color:#042}
.btn-s{background:#243044;color:#e8eef8}
.msg{margin-top:12px;padding:12px;background:#0a101a;border-radius:12px;border:1px solid #2a3a50;font-size:14px;min-height:40px}
input{width:100%;background:#0e1726;border:1px solid #2a3a50;color:#e8eef8;border-radius:10px;padding:10px;font-size:14px;margin-top:8px}
.hang{font-family:ui-monospace,monospace;letter-spacing:4px;font-size:20px;text-align:center;margin:12px 0}
</style></head><body>
<div id="home">
  <div class="top"><h1>Games</h1><p>8 quick games · play in chat</p></div>
  <div class="grid">
    <div class="app" onclick="show('ttt')"><div class="ic">⭕</div><div class="lb">Tic-Tac-Toe</div></div>
    <div class="app" onclick="show('rps')"><div class="ic">✊</div><div class="lb">Rock Paper Scissors</div></div>
    <div class="app" onclick="show('dice')"><div class="ic">🎲</div><div class="lb">Dice</div></div>
    <div class="app" onclick="show('coin')"><div class="ic">🪙</div><div class="lb">Coin Flip</div></div>
    <div class="app" onclick="show('guess')"><div class="ic">🔢</div><div class="lb">Guess Number</div></div>
    <div class="app" onclick="show('hang')"><div class="ic">🪓</div><div class="lb">Hangman</div></div>
    <div class="app" onclick="show('trivia')"><div class="ic">❓</div><div class="lb">Trivia</div></div>
    <div class="app" onclick="show('scram')"><div class="ic">🔤</div><div class="lb">Word Scramble</div></div>
  </div>
</div>

<div id="ttt" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Tic-Tac-Toe vs Bot</h3>
  <div class="board" id="board"></div>
  <div class="msg" id="tttMsg">You are X. Tap a cell.</div>
  <div class="row"><button class="btn btn-s" onclick="tttReset()">Reset</button></div>
</div>

<div id="rps" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Rock · Paper · Scissors</h3>
  <div class="row">
    <button class="btn" onclick="playRps('rock')">✊ Rock</button>
    <button class="btn" onclick="playRps('paper')">✋ Paper</button>
    <button class="btn" onclick="playRps('scissors')">✌️ Scissors</button>
  </div>
  <div class="msg" id="rpsMsg">Pick one.</div>
</div>

<div id="dice" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Dice Roll</h3>
  <div class="row"><button class="btn" onclick="rollDice()">Roll 🎲</button></div>
  <div class="msg" id="diceMsg">Tap to roll.</div>
</div>

<div id="coin" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Coin Flip</h3>
  <div class="row"><button class="btn" onclick="flipCoin()">Flip 🪙</button></div>
  <div class="msg" id="coinMsg">Tap to flip.</div>
</div>

<div id="guess" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Guess 1–100</h3>
  <input id="guessIn" type="number" min="1" max="100" placeholder="Your guess"/>
  <div class="row">
    <button class="btn" onclick="doGuess()">Guess</button>
    <button class="btn btn-s" onclick="guessReset()">New</button>
  </div>
  <div class="msg" id="guessMsg">I'm thinking of a number…</div>
</div>

<div id="hang" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Hangman</h3>
  <div class="hang" id="hangWord">_ _ _ _</div>
  <div class="msg" id="hangMsg">Type a letter below.</div>
  <input id="hangIn" maxlength="1" placeholder="letter"/>
  <div class="row">
    <button class="btn" onclick="hangGuess()">Guess</button>
    <button class="btn btn-s" onclick="hangNew()">New word</button>
  </div>
</div>

<div id="trivia" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Trivia</h3>
  <div class="msg" id="trivQ">…</div>
  <input id="trivIn" placeholder="Your answer"/>
  <div class="row">
    <button class="btn" onclick="trivCheck()">Submit</button>
    <button class="btn btn-s" onclick="trivNext()">Next</button>
  </div>
  <div class="msg" id="trivMsg"></div>
</div>

<div id="scram" class="panel">
  <button class="back" onclick="home()">← Games</button>
  <h3>Word Scramble</h3>
  <div class="hang" id="scramWord">????</div>
  <input id="scramIn" placeholder="Unscramble"/>
  <div class="row">
    <button class="btn" onclick="scramCheck()">Check</button>
    <button class="btn btn-s" onclick="scramNew()">New</button>
  </div>
  <div class="msg" id="scramMsg"></div>
</div>

<script>
var WORDS=${JSON.stringify(WORDS)};
var TRIVIA=${JSON.stringify(TRIVIA)};
function show(id){
  document.getElementById('home').style.display='none';
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on')});
  document.getElementById(id).classList.add('on');
  if(id==='ttt')tttReset();
  if(id==='guess')guessReset();
  if(id==='hang')hangNew();
  if(id==='trivia')trivNext();
  if(id==='scram')scramNew();
}
function home(){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on')});
  document.getElementById('home').style.display='block';
}

/* TicTacToe */
var cells,turn,over;
function tttReset(){
  cells=Array(9).fill(''); turn='X'; over=false;
  var b=document.getElementById('board'); b.innerHTML='';
  for(var i=0;i<9;i++){
    var d=document.createElement('div'); d.className='cell'; d.dataset.i=i;
    d.onclick=function(){tttClick(+this.dataset.i)};
    b.appendChild(d);
  }
  document.getElementById('tttMsg').textContent='You are X. Tap a cell.';
}
function wins(b,p){
  var L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return L.some(function(x){return b[x[0]]===p&&b[x[1]]===p&&b[x[2]]===p});
}
function tttClick(i){
  if(over||cells[i])return;
  cells[i]='X'; renderBoard();
  if(wins(cells,'X')){over=true;document.getElementById('tttMsg').textContent='You win!';return}
  if(cells.every(Boolean)){over=true;document.getElementById('tttMsg').textContent='Draw.';return}
  // bot
  var move=botMove();
  if(move>=0){cells[move]='O'; renderBoard()}
  if(wins(cells,'O')){over=true;document.getElementById('tttMsg').textContent='Bot wins.';return}
  if(cells.every(Boolean)){over=true;document.getElementById('tttMsg').textContent='Draw.';return}
  document.getElementById('tttMsg').textContent='Your turn.';
}
function botMove(){
  for(var i=0;i<9;i++){if(!cells[i]){var t=cells.slice();t[i]='O';if(wins(t,'O'))return i}}
  for(var i=0;i<9;i++){if(!cells[i]){var t=cells.slice();t[i]='X';if(wins(t,'X'))return i}}
  if(!cells[4])return 4;
  var corners=[0,2,6,8].filter(function(i){return !cells[i]});
  if(corners.length)return corners[Math.floor(Math.random()*corners.length)];
  var open=cells.map(function(v,i){return v?'':i}).filter(function(x){return x!==''});
  return open.length?open[Math.floor(Math.random()*open.length)]:-1;
}
function renderBoard(){
  var nodes=document.querySelectorAll('#board .cell');
  nodes.forEach(function(n,i){n.textContent=cells[i]||''});
}

/* RPS */
function playRps(you){
  var opts=['rock','paper','scissors'];
  var bot=opts[Math.floor(Math.random()*3)];
  var map={rock:'✊',paper:'✋',scissors:'✌️'};
  var res='Draw';
  if(you===bot)res='Draw';
  else if((you==='rock'&&bot==='scissors')||(you==='paper'&&bot==='rock')||(you==='scissors'&&bot==='paper'))res='You win!';
  else res='Bot wins.';
  document.getElementById('rpsMsg').textContent='You '+map[you]+' vs Bot '+map[bot]+' → '+res;
}

/* Dice / Coin */
function rollDice(){document.getElementById('diceMsg').textContent='🎲 You rolled '+ (1+Math.floor(Math.random()*6));}
function flipCoin(){document.getElementById('coinMsg').textContent=Math.random()<0.5?'🪙 Heads':'🪙 Tails';}

/* Guess */
var secret,tries;
function guessReset(){secret=1+Math.floor(Math.random()*100);tries=0;document.getElementById('guessMsg').textContent='Guess a number from 1 to 100.';document.getElementById('guessIn').value='';}
function doGuess(){
  var n=parseInt(document.getElementById('guessIn').value,10);
  if(!n||n<1||n>100){document.getElementById('guessMsg').textContent='Enter 1–100.';return}
  tries++;
  if(n===secret)document.getElementById('guessMsg').textContent='🎉 Correct! '+secret+' in '+tries+' tries.';
  else if(n<secret)document.getElementById('guessMsg').textContent='Higher ↑ ('+tries+' tries)';
  else document.getElementById('guessMsg').textContent='Lower ↓ ('+tries+' tries)';
}

/* Hangman */
var hw,hg,hl;
function hangNew(){
  hw=WORDS[Math.floor(Math.random()*WORDS.length)];
  hg=[]; hl=6;
  hangRender();
  document.getElementById('hangMsg').textContent='Lives: '+hl;
  document.getElementById('hangIn').value='';
}
function hangRender(){
  document.getElementById('hangWord').textContent=hw.split('').map(function(c){return hg.indexOf(c)>=0?c:'_'}).join(' ');
}
function hangGuess(){
  var c=(document.getElementById('hangIn').value||'').toLowerCase().replace(/[^a-z]/g,'').charAt(0);
  document.getElementById('hangIn').value='';
  if(!c)return;
  if(hg.indexOf(c)>=0){document.getElementById('hangMsg').textContent='Already tried '+c;return}
  hg.push(c);
  if(hw.indexOf(c)<0)hl--;
  hangRender();
  if(hw.split('').every(function(x){return hg.indexOf(x)>=0}))document.getElementById('hangMsg').textContent='You win! Word: '+hw;
  else if(hl<=0)document.getElementById('hangMsg').textContent='Out of lives. Word was '+hw;
  else document.getElementById('hangMsg').textContent='Lives: '+hl+' · tried: '+hg.join(',');
}

/* Trivia */
var tq;
function trivNext(){
  tq=TRIVIA[Math.floor(Math.random()*TRIVIA.length)];
  document.getElementById('trivQ').textContent=tq.q;
  document.getElementById('trivIn').value='';
  document.getElementById('trivMsg').textContent='';
}
function trivCheck(){
  var a=(document.getElementById('trivIn').value||'').toLowerCase().trim();
  if(!a)return;
  if(a===tq.a||a.indexOf(tq.a)>=0)document.getElementById('trivMsg').textContent='✅ Correct!';
  else document.getElementById('trivMsg').textContent='❌ Answer: '+tq.a;
}

/* Scramble */
var sw;
function scramble(w){
  var a=w.split('');
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}
  var s=a.join('');
  return s===w?scramble(w):s;
}
function scramNew(){
  sw=WORDS[Math.floor(Math.random()*WORDS.length)];
  document.getElementById('scramWord').textContent=scramble(sw);
  document.getElementById('scramIn').value='';
  document.getElementById('scramMsg').textContent='Unscramble the word.';
}
function scramCheck(){
  var a=(document.getElementById('scramIn').value||'').toLowerCase().trim();
  if(a===sw)document.getElementById('scramMsg').textContent='✅ '+sw;
  else document.getElementById('scramMsg').textContent='❌ Try again (or New).';
}
</script>
</body></html>`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = [
  {
    name: 'games',
    pattern: 'games',
    aliases: ['game', 'play'],
    desc: 'Open games mini-app (8 games)',
    category: 'games',
    async handler(ctx) {
      const { sock, reply, m, jid } = ctx;
      const chat = jid || m?.key?.remoteJid;
      try {
        await sendHtmlApp(sock, chat, gamesHtml(), 'Games');
      } catch (e) {
        await reply(
          'Games UI failed (' +
            (e.message || e) +
            ').\nQuick commands:\n' +
            '`.dice` · `.coin` · `.rps rock|paper|scissors` · `.guess`'
        );
      }
    },
  },
  {
    name: 'dice',
    pattern: 'dice',
    aliases: ['roll'],
    desc: 'Roll a dice (1–6)',
    category: 'games',
    async handler(ctx) {
      const n = 1 + Math.floor(Math.random() * 6);
      await ctx.reply('🎲 You rolled *' + n + '*');
    },
  },
  {
    name: 'coin',
    pattern: 'coin',
    aliases: ['flip', 'coinflip'],
    desc: 'Flip a coin',
    category: 'games',
    async handler(ctx) {
      await ctx.reply(Math.random() < 0.5 ? '🪙 *Heads*' : '🪙 *Tails*');
    },
  },
  {
    name: 'rps',
    pattern: 'rps',
    aliases: ['rockpaperscissors'],
    desc: 'Rock Paper Scissors — `.rps rock`',
    category: 'games',
    async handler(ctx) {
      const you = String(ctx.args[0] || '').toLowerCase();
      const opts = ['rock', 'paper', 'scissors'];
      if (!opts.includes(you)) {
        return ctx.reply('Usage: `.rps rock` | `.rps paper` | `.rps scissors`');
      }
      const bot = pick(opts);
      const map = { rock: '✊', paper: '✋', scissors: '✌️' };
      let res = 'Draw';
      if (you === bot) res = 'Draw';
      else if (
        (you === 'rock' && bot === 'scissors') ||
        (you === 'paper' && bot === 'rock') ||
        (you === 'scissors' && bot === 'paper')
      )
        res = 'You win!';
      else res = 'Bot wins.';
      await ctx.reply(`You ${map[you]} vs Bot ${map[bot]}\n*${res}*`);
    },
  },
  {
    name: 'guess',
    pattern: 'guess',
    aliases: ['numberguess'],
    desc: 'Hint: use .games for full guess game',
    category: 'games',
    async handler(ctx) {
      const n = 1 + Math.floor(Math.random() * 10);
      await ctx.reply(
        'I picked a number **1–10**: *' +
          n +
          '*\nOpen `.games` → Guess Number for 1–100 with hints.'
      );
    },
  },
];
