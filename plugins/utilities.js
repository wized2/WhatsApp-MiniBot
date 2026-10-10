const { sendHtmlApp } = require('../lib/htmlTransport');
const { utilShell } = require('../lib/gameShell');

const UTILS_HTML = utilShell(
  'Tools',
  `.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.card{background:#1e293b;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 10px;text-align:center;cursor:pointer}
.card:active{transform:scale(.97)}.card .ic{font-size:22px;margin-bottom:4px}.card .nm{font-size:12px;font-weight:700}
.view{display:none}.view.on{display:block}.back{width:100%;margin-bottom:8px}
.out{background:#0f172a;border-radius:12px;padding:10px;margin-top:8px;font-size:13px;word-break:break-all;min-height:40px;border:1px solid rgba(255,255,255,.06)}
label{font-size:11px;color:#94a3b8;display:block;margin-top:6px}`,
`<div id="home" class="view on"><div class="grid" id="grid"></div></div>
<div id="tool" class="view"><button class="sec back" id="back">← Tools</button><div id="body"></div></div>
<script>
const tools=[
{id:'bmi',ic:'⚖️',n:'BMI',h:()=>\`<label>Height cm</label><input id="a" type="number" value="170"/><label>Weight kg</label><input id="b" type="number" value="65"/><button id="go">Calc</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const m=+a.value/100,x=(+b.value)/(m*m);let c='Normal';if(x<18.5)c='Under';else if(x>=25&&x<30)c='Over';else if(x>=30)c='Obese';o.textContent='BMI '+x.toFixed(1)+' · '+c}}},
{id:'age',ic:'🎂',n:'Age',h:()=>\`<label>Birth date</label><input id="a" type="date"/><button id="go">Age</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const b=new Date(a.value),n=new Date();let y=n.getFullYear()-b.getFullYear(),m=n.getMonth()-b.getMonth(),d=n.getDate()-b.getDate();if(d<0){m--;d+=30}if(m<0){y--;m+=12}o.textContent=y+'y '+m+'m '+d+'d'}}},
{id:'emi',ic:'🏦',n:'Loan EMI',h:()=>\`<label>Amount</label><input id="a" type="number" value="500000"/><label>Rate %/yr</label><input id="b" type="number" value="14"/><label>Months</label><input id="c" type="number" value="36"/><button id="go">EMI</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const P=+a.value,R=+b.value/12/100,N=+c.value;const e=P*R*Math.pow(1+R,N)/(Math.pow(1+R,N)-1);o.textContent='EMI '+e.toFixed(0)+'\\nTotal '+(e*N).toFixed(0)}}},
{id:'fx',ic:'💱',n:'PKR FX',h:()=>\`<label>PKR</label><input id="a" type="number" value="1000"/><button id="go">Convert</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const p=+a.value;o.textContent='USD ~'+(p/278).toFixed(2)+'\\nEUR ~'+(p/300).toFixed(2)+'\\nAED ~'+(p/75.7).toFixed(2)}}},
{id:'unit',ic:'📐',n:'Units',h:()=>\`<label>Value</label><input id="a" type="number" value="10"/><select id="b"><option value="1">km→mi</option><option value="2">mi→km</option><option value="3">kg→lb</option><option value="4">°C→°F</option></select><button id="go">Go</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const v=+a.value,t=b.value;o.textContent=t==1?(v*0.621).toFixed(3):t==2?(v*1.609).toFixed(3):t==3?(v*2.205).toFixed(3):(v*9/5+32).toFixed(2)}}},
{id:'pass',ic:'🔐',n:'Password',h:()=>\`<label>Length</label><input id="a" type="number" value="16"/><button id="go">Generate</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const c='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$',n=+a.value||16;let s='';for(let i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];o.textContent=s}}},
{id:'word',ic:'📄',n:'Word count',h:()=>\`<textarea id="a" rows="5"></textarea><button id="go">Count</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const s=a.value,w=s.trim()?s.trim().split(/\\s+/).length:0;o.textContent='Chars '+s.length+' · Words '+w}}},
{id:'b64',ic:'🧩',n:'Base64',h:()=>\`<textarea id="a" rows="3"></textarea><button id="go">Encode</button><button id="go2" class="sec">Decode</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{try{o.textContent=btoa(unescape(encodeURIComponent(a.value)))}catch(e){o.textContent='err'}};go2.onclick=()=>{try{o.textContent=decodeURIComponent(escape(atob(a.value)))}catch(e){o.textContent='invalid'}}}},
{id:'rand',ic:'🎯',n:'Random',h:()=>\`<label>Min</label><input id="a" type="number" value="1"/><label>Max</label><input id="b" type="number" value="100"/><button id="go">Pick</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>o.textContent=String(Math.floor(Math.random()*(+b.value-+a.value+1))+ +a.value)}},
{id:'disc',ic:'🏷️',n:'Discount',h:()=>\`<label>Price</label><input id="a" type="number" value="1500"/><label>%</label><input id="b" type="number" value="20"/><button id="go">Apply</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>{const p=+a.value,off=p*(+b.value)/100;o.textContent='Save '+off.toFixed(0)+' · Pay '+(p-off).toFixed(0)}}},
{id:'qrtext',ic:'🔗',n:'Share text',h:()=>\`<textarea id="a" rows="4" placeholder="Text to copy-ready…"></textarea><button id="go">Format</button><div class="out" id="o"></div>\`,
 bind:()=>{go.onclick=()=>o.textContent=a.value.trim()}},
{id:'tz',ic:'🌍',n:'World time',h:()=>\`<div class="out" id="o"></div>\`,
 bind:()=>{const z=[['PK','Asia/Karachi'],['UK','Europe/London'],['NY','America/New_York'],['Dubai','Asia/Dubai']];function r(){o.textContent=z.map(([n,tz])=>n+': '+new Date().toLocaleTimeString([],{timeZone:tz,hour:'2-digit',minute:'2-digit'})).join('\\n')}r();setInterval(r,1000)}}
];
const grid=document.getElementById('grid');
tools.forEach(t=>{const d=document.createElement('div');d.className='card';d.innerHTML='<div class="ic">'+t.ic+'</div><div class="nm">'+t.n+'</div>';d.onclick=()=>open(t);grid.appendChild(d)});
function open(t){home.classList.remove('on');tool.classList.add('on');body.innerHTML=t.h();t.bind()}
back.onclick=()=>{tool.classList.remove('on');home.classList.add('on')}
</script>`
);

module.exports = {
  name: 'utilities',
  pattern: 'utils',
  aliases: ['tools', 'utilities', 'util'],
  desc: 'Everyday tools launcher (BMI, EMI, FX, password, units…)',
  category: 'tools',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, UTILS_HTML, 'Tools');
  },
};
