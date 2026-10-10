const { sendHtmlApp } = require('../lib/htmlTransport');
const { utilShell } = require('../lib/gameShell');

/** Single command .utils → launcher grid of all everyday tools */
const UTILS_HTML = utilShell(
  'Utilities',
  `.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.card{background:#1e293b;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 10px;text-align:center;cursor:pointer}
.card:active{transform:scale(.97)}
.card .ic{font-size:22px;margin-bottom:4px}
.card .nm{font-size:12px;font-weight:700;color:#e2e8f0}
.back{width:100%;margin-bottom:8px}
.view{display:none}.view.on{display:block}
.out{background:#0f172a;border-radius:12px;padding:10px;margin-top:8px;font-size:13px;word-break:break-all;min-height:40px;border:1px solid rgba(255,255,255,.06)}
label{font-size:11px;color:#94a3b8;display:block;margin-top:6px}`,
`<div id="home" class="view on">
  <div class="grid" id="grid"></div>
</div>
<div id="tool" class="view">
  <button class="sec back" id="back">← All tools</button>
  <div id="body"></div>
</div>
<script>
const tools=[
{id:'tip',ic:'💵',n:'Tip',h:()=>\`<label>Bill</label><input id="a" type="number" value="1000"/><label>Tip %</label><input id="b" type="number" value="10"/><button id="go">Calculate</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const bill=+a.value,p=+b.value,t=bill*p/100;o.textContent='Tip '+t.toFixed(2)+'\\nTotal '+(bill+t).toFixed(2)}}},
{id:'split',ic:'👥',n:'Split bill',h:()=>\`<label>Total</label><input id="a" type="number" value="3000"/><label>People</label><input id="b" type="number" value="4"/><button id="go">Split</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>o.textContent='Each pays '+((+a.value)/(+b.value||1)).toFixed(2)}},
{id:'disc',ic:'🏷️',n:'Discount',h:()=>\`<label>Price</label><input id="a" type="number" value="1500"/><label>%</label><input id="b" type="number" value="20"/><button id="go">Apply</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const p=+a.value,pct=+b.value,off=p*pct/100;o.textContent='Save '+off.toFixed(2)+'\\nPay '+(p-off).toFixed(2)}}},
{id:'pct',ic:'%',n:'Percent',h:()=>\`<label>X</label><input id="a" type="number" value="10"/><label>of Y</label><input id="b" type="number" value="200"/><button id="go">Calc</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>o.textContent=(+a.value)+'% of '+(+b.value)+' = '+(((+a.value)/100)*(+b.value)).toFixed(2)}},
{id:'gst',ic:'🧾',n:'Tax / GST',h:()=>\`<label>Amount</label><input id="a" type="number" value="1000"/><label>Tax %</label><input id="b" type="number" value="18"/><button id="go">Add tax</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const t=(+a.value)*(+b.value)/100;o.textContent='Tax '+t.toFixed(2)+'\\nTotal '+(+a.value+t).toFixed(2)}}},
{id:'bmi',ic:'⚖️',n:'BMI',h:()=>\`<label>Weight (kg)</label><input id="a" type="number" value="70"/><label>Height (cm)</label><input id="b" type="number" value="175"/><button id="go">BMI</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const m=(+b.value)/100,bmi=(+a.value)/(m*m);let c='Normal';if(bmi<18.5)c='Underweight';else if(bmi>=25&&bmi<30)c='Overweight';else if(bmi>=30)c='Obese';o.textContent=bmi.toFixed(1)+' · '+c}}},
{id:'age',ic:'🎂',n:'Age',h:()=>\`<label>Birth date</label><input id="a" placeholder="2000-05-15"/><button id="go">Age</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const d=new Date(a.value);if(isNaN(d)){o.textContent='Invalid date';return}const n=new Date();let y=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))y--;o.textContent=y+' years old'}}},
{id:'days',ic:'📅',n:'Days left',h:()=>\`<label>Target date</label><input id="a" placeholder="2026-12-31"/><button id="go">Count</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const d=new Date(a.value);if(isNaN(d)){o.textContent='Invalid';return}
    const diff=Math.ceil((d.setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/864e5);
    o.textContent=diff===0?'Today!':diff>0?diff+' days left':Math.abs(diff)+' days ago'}}},
{id:'unit',ic:'📐',n:'Units',h:()=>\`<label>Value</label><input id="a" type="number" value="37"/><label>Convert</label><select id="b"><option value="c2f">°C → °F</option><option value="f2c">°F → °C</option><option value="kg2lb">kg → lb</option><option value="lb2kg">lb → kg</option><option value="cm2in">cm → in</option><option value="km2mi">km → mi</option></select><button id="go">Convert</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const v=+a.value,t=b.value;const m={c2f:v*9/5+32,f2c:(v-32)*5/9,kg2lb:v*2.20462,lb2kg:v/2.20462,cm2in:v/2.54,km2mi:v*0.621371};o.textContent=m[t].toFixed(2)}}},
{id:'rand',ic:'🎲',n:'Random',h:()=>\`<label>Min</label><input id="a" type="number" value="1"/><label>Max</label><input id="b" type="number" value="100"/><button id="go">Roll</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const A=+a.value,B=+b.value;o.textContent=String(Math.floor(Math.min(A,B)+Math.random()*(Math.abs(B-A)+1)))}}},
{id:'pass',ic:'🔐',n:'Password',h:()=>\`<label>Length</label><input id="a" type="number" value="16"/><button id="go">Generate</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const n=Math.min(64,Math.max(8,+a.value||16));const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';let s='';for(let i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];o.textContent=s}}},
{id:'otp',ic:'🔢',n:'OTP',h:()=>\`<button id="go" style="width:100%;height:56px">Generate 6-digit</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>o.textContent=String(100000+Math.floor(Math.random()*900000))}},
{id:'flip',ic:'🪙',n:'Coin',h:()=>\`<button id="go" style="width:100%;height:64px">Flip</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>o.textContent=Math.random()<.5?'🟢 Heads':'🔴 Tails'}},
{id:'ball',ic:'🎱',n:'8-Ball',h:()=>\`<button id="go" style="width:100%;height:56px">Ask</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const a=['Yes.','No.','Maybe.','Ask again.','Absolutely.','Doubtful.','Sure.','Not now.'];o.textContent=a[Math.floor(Math.random()*a.length)]}}},
{id:'ship',ic:'💘',n:'Ship',h:()=>\`<label>Name 1</label><input id="a"/><label>Name 2</label><input id="b"/><button id="go">Ship %</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const s=(a.value+'|'+b.value).split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0);const p=Math.abs(s)%101;o.textContent=p+'% · '+(p>80?'🔥':p>50?'💛':p>25?'💙':'🧊')}}},
{id:'zodiac',ic:'✨',n:'Zodiac',h:()=>\`<label>Day</label><input id="a" type="number" value="15"/><label>Month</label><input id="b" type="number" value="8"/><button id="go">Sign</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const d=+a.value,mo=+b.value;const z=[[20,'Capricorn'],[19,'Aquarius'],[20,'Pisces'],[20,'Aries'],[21,'Taurus'],[21,'Gemini'],[22,'Cancer'],[22,'Leo'],[23,'Virgo'],[23,'Libra'],[22,'Scorpio'],[22,'Sagittarius'],[20,'Capricorn']];if(mo<1||mo>12){o.textContent='Bad month';return}o.textContent=d<z[mo-1][0]?z[mo-1][1]:z[mo][1]}}},
{id:'time',ic:'🕒',n:'Time',h:()=>\`<button id="go" style="width:100%">Now (UTC)</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const d=new Date();o.textContent=d.toUTCString()+'\\nUnix '+Math.floor(d/1000)}}},
{id:'text',ic:'✏️',n:'Text tools',h:()=>\`<label>Text</label><input id="a"/><div class="row"><button id="up">ABC</button><button id="lo">abc</button><button id="rv">⇄</button></div><div class="out" id="o"></div>\`,
  bind:()=>{up.onclick=()=>o.textContent=(a.value||'').toUpperCase();lo.onclick=()=>o.textContent=(a.value||'').toLowerCase();rv.onclick=()=>o.textContent=[...(a.value||'')].reverse().join('')}},
{id:'loan',ic:'🏦',n:'EMI',h:()=>\`<label>Principal</label><input id="a" type="number" value="500000"/><label>Rate % /yr</label><input id="b" type="number" value="12"/><label>Years</label><input id="c" type="number" value="2"/><button id="go">EMI</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const P=+a.value,r=(+b.value)/12/100,n=(+c.value)*12;const e=(P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);o.textContent='EMI '+e.toFixed(2)+'/mo\\nTotal '+(e*n).toFixed(2)}}},
{id:'decide',ic:'🎯',n:'Decide',h:()=>\`<label>Options (comma)</label><input id="a" placeholder="tea, coffee, juice"/><button id="go">Pick</button><div class="out" id="o"></div>\`,
  bind:()=>{go.onclick=()=>{const p=(a.value||'').split(/[,|]/).map(s=>s.trim()).filter(Boolean);o.textContent=p.length<2?'Need 2+ options':'→ '+p[Math.floor(Math.random()*p.length)]}}},
];

const grid=document.getElementById('grid');
tools.forEach(t=>{
  const d=document.createElement('div');d.className='card';
  d.innerHTML='<div class="ic">'+t.ic+'</div><div class="nm">'+t.n+'</div>';
  d.onclick=()=>openTool(t);grid.appendChild(d);
});
function openTool(t){
  home.classList.remove('on');tool.classList.add('on');
  body.innerHTML=t.h();t.bind();
}
document.getElementById('back').onclick=()=>{tool.classList.remove('on');home.classList.add('on')};
<\/script>`
);

module.exports = {
  name: 'utils',
  pattern: 'utils',
  aliases: ['tools', 'util', 'utilities', 'tool'],
  desc: 'Utilities launcher mini-app',
  category: 'utilities',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, UTILS_HTML, 'Utilities');
  },
};
