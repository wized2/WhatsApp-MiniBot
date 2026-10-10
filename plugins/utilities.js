const { sendHtmlApp } = require('../lib/htmlTransport');
const { utilShell } = require('../lib/gameShell');
const { style } = require('../lib/stylish');

/** One polished utility mini-app with tabs for common tools */
const UTILS_HTML = utilShell('Utilities',
`.tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.tabs button{padding:6px 10px;font-size:11px;background:#1a2430;color:#e9edef;box-shadow:none}
.tabs button.on{background:linear-gradient(180deg,#2be076,#1fad5a);color:#062}
.panel{display:none}.panel.on{display:block}
label{font-size:11px;opacity:.7;display:block;margin-top:6px}
.out{background:#1a2430;border-radius:12px;padding:10px;margin-top:8px;font-size:13px;word-break:break-all;min-height:36px}`,
`<div class="tabs" id="tabs"></div>
<div id="panels"></div>
<script>
const tools=[
{id:'tip',n:'Tip',html:'<label>Bill</label><input id="tip_b" type="number" value="1000"/><label>Tip %</label><input id="tip_p" type="number" value="10"/><button id="tip_go">Calc</button><div class="out" id="tip_o"></div>'},
{id:'split',n:'Split',html:'<label>Total</label><input id="sp_t" type="number" value="3000"/><label>People</label><input id="sp_n" type="number" value="4"/><button id="sp_go">Split</button><div class="out" id="sp_o"></div>'},
{id:'disc',n:'Discount',html:'<label>Price</label><input id="d_p" type="number" value="1500"/><label>%</label><input id="d_pct" type="number" value="20"/><button id="d_go">Apply</button><div class="out" id="d_o"></div>'},
{id:'bmi',n:'BMI',html:'<label>kg</label><input id="b_kg" type="number" value="70"/><label>cm</label><input id="b_cm" type="number" value="175"/><button id="b_go">BMI</button><div class="out" id="b_o"></div>'},
{id:'age',n:'Age',html:'<label>Birth YYYY-MM-DD</label><input id="a_d" placeholder="2000-05-15"/><button id="a_go">Age</button><div class="out" id="a_o"></div>'},
{id:'unit',n:'Units',html:'<label>Value</label><input id="u_v" type="number" value="37"/><label>Convert</label><select id="u_t"><option value="c2f">°C→°F</option><option value="f2c">°F→°C</option><option value="kg2lb">kg→lb</option><option value="lb2kg">lb→kg</option><option value="cm2in">cm→in</option><option value="km2mi">km→mi</option></select><button id="u_go">Convert</button><div class="out" id="u_o"></div>'},
{id:'rand',n:'Random',html:'<label>Min</label><input id="r_a" type="number" value="1"/><label>Max</label><input id="r_b" type="number" value="100"/><button id="r_go">Roll</button><div class="out" id="r_o"></div>'},
{id:'pass',n:'Password',html:'<label>Length</label><input id="p_n" type="number" value="16"/><button id="p_go">Generate</button><div class="out" id="p_o"></div>'},
{id:'flip',n:'Flip',html:'<button id="f_go" style="width:100%;height:64px">Flip coin</button><div class="out" id="f_o"></div>'},
{id:'ball',n:'8-Ball',html:'<button id="8_go" style="width:100%">Ask the ball</button><div class="out" id="8_o"></div>'},
{id:'ship',n:'Ship',html:'<label>Name 1</label><input id="s_a"/><label>Name 2</label><input id="s_b"/><button id="s_go">Ship %</button><div class="out" id="s_o"></div>'},
{id:'pct',n:'Percent',html:'<label>X</label><input id="pc_x" type="number" value="10"/><label>of Y</label><input id="pc_y" type="number" value="200"/><button id="pc_go">Calc</button><div class="out" id="pc_o"></div>'},
{id:'time',n:'Time',html:'<button id="t_go" style="width:100%">Now</button><div class="out" id="t_o"></div>'},
{id:'text',n:'Text',html:'<label>Text</label><input id="tx_i"/><div class="row"><button id="tx_up">UPPER</button><button id="tx_lo">lower</button><button id="tx_rev">Reverse</button></div><div class="out" id="tx_o"></div>'},
{id:'gst',n:'GST',html:'<label>Amount</label><input id="g_a" type="number" value="1000"/><label>% </label><input id="g_p" type="number" value="18"/><button id="g_go">Add tax</button><div class="out" id="g_o"></div>'},
];
const tabs=document.getElementById('tabs'),panels=document.getElementById('panels');
tools.forEach((t,i)=>{
  const b=document.createElement('button');b.textContent=t.n;b.onclick=()=>show(i);tabs.appendChild(b);
  const p=document.createElement('div');p.className='panel';p.id='p_'+t.id;p.innerHTML=t.html;panels.appendChild(p);
});
function show(i){
  [...tabs.children].forEach((b,j)=>b.classList.toggle('on',j===i));
  [...panels.children].forEach((p,j)=>p.classList.toggle('on',j===i));
}
show(0);
document.getElementById('tip_go').onclick=()=>{const b=+tip_b.value,p=+tip_p.value;const t=b*p/100;tip_o.textContent='Tip '+t.toFixed(2)+' · Total '+(b+t).toFixed(2)};
document.getElementById('sp_go').onclick=()=>{sp_o.textContent='Each: '+(+sp_t.value/+sp_n.value).toFixed(2)};
document.getElementById('d_go').onclick=()=>{const p=+d_p.value,pct=+d_pct.value;const off=p*pct/100;d_o.textContent='Off '+off.toFixed(2)+' · Pay '+(p-off).toFixed(2)};
document.getElementById('b_go').onclick=()=>{const kg=+b_kg.value,m=+b_cm.value/100;const bmi=kg/(m*m);let c='Normal';if(bmi<18.5)c='Underweight';else if(bmi>=25&&bmi<30)c='Overweight';else if(bmi>=30)c='Obese';b_o.textContent=bmi.toFixed(1)+' · '+c};
document.getElementById('a_go').onclick=()=>{const d=new Date(a_d.value);if(isNaN(d)){a_o.textContent='Bad date';return};const n=new Date();let y=n.getFullYear()-d.getFullYear();let m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))y--;a_o.textContent=y+' years'};
document.getElementById('u_go').onclick=()=>{const v=+u_v.value,t=u_t.value;const map={c2f:v*9/5+32,f2c:(v-32)*5/9,kg2lb:v*2.20462,lb2kg:v/2.20462,cm2in:v/2.54,km2mi:v*0.621371};u_o.textContent=map[t].toFixed(2)};
document.getElementById('r_go').onclick=()=>{const a=+r_a.value,b=+r_b.value;r_o.textContent=String(Math.floor(Math.min(a,b)+Math.random()*(Math.abs(b-a)+1)))};
document.getElementById('p_go').onclick=()=>{const n=Math.min(64,Math.max(8,+p_n.value||16));const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';let o='';for(let i=0;i<n;i++)o+=c[Math.floor(Math.random()*c.length)];p_o.textContent=o};
document.getElementById('f_go').onclick=()=>{f_o.textContent=Math.random()<.5?'🟢 Heads':'🔴 Tails'};
document.getElementById('8_go').onclick=()=>{const a=['Yes.','No.','Maybe.','Ask again.','Absolutely.','Doubtful.'];document.getElementById('8_o').textContent='🎱 '+a[Math.floor(Math.random()*a.length)]};
document.getElementById('s_go').onclick=()=>{const s=(s_a.value+'|'+s_b.value).split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0);s_o.textContent=Math.abs(s)%101+'%'};
document.getElementById('pc_go').onclick=()=>{const x=+pc_x.value,y=+pc_y.value;pc_o.textContent=x+'% of '+y+' = '+((x/100)*y).toFixed(2)};
document.getElementById('t_go').onclick=()=>{t_o.textContent=new Date().toUTCString()};
document.getElementById('tx_up').onclick=()=>{tx_o.textContent=(tx_i.value||'').toUpperCase()};
document.getElementById('tx_lo').onclick=()=>{tx_o.textContent=(tx_i.value||'').toLowerCase()};
document.getElementById('tx_rev').onclick=()=>{tx_o.textContent=[...(tx_i.value||'')].reverse().join('')};
document.getElementById('g_go').onclick=()=>{const a=+g_a.value,p=+g_p.value;const t=a*p/100;g_o.textContent='Tax '+t.toFixed(2)+' · Total '+(a+t).toFixed(2)};
<\/script>`);

module.exports = {
  name: 'utils',
  pattern: 'utils',
  aliases: ['tools', 'util', 'utilities'],
  desc: 'Utility mini-app hub',
  category: 'utilities',
  async handler({ sock, jid, reply, cmd }) {
    await sendHtmlApp(sock, jid, UTILS_HTML, 'Utilities');
  },
};
