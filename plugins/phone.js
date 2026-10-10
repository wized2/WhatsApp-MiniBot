const { sendHtmlApp } = require('../lib/htmlTransport');
const { utilShell } = require('../lib/gameShell');

function phoneBody() {
  return (
    '<div id="home" class="view on">' +
    '<div class="clk" id="clk">00:00</div>' +
    '<div class="dte" id="dte">-</div>' +
    '<div class="grid" id="grid"></div>' +
    '<div class="dock" id="dock"></div>' +
    '</div>' +
    '<div id="app" class="view">' +
    '<button type="button" class="sec" id="back" style="width:100%;margin-bottom:8px">Back</button>' +
    '<div id="abody"></div>' +
    '</div>' +
    '<script>' +
    '(function(){' +
    'var APPS=[' +
    '{id:"calc",n:"Calc",l:"CL",c:"#0ea5e9"},' +
    '{id:"notes",n:"Notes",l:"NT",c:"#eab308"},' +
    '{id:"todo",n:"Tasks",l:"TK",c:"#22c55e"},' +
    '{id:"timer",n:"Timer",l:"TM",c:"#f97316"},' +
    '{id:"dice",n:"Dice",l:"DC",c:"#ef4444"},' +
    '{id:"coin",n:"Coin",l:"CN",c:"#f59e0b"},' +
    '{id:"bmi",n:"BMI",l:"BM",c:"#14b8a6"},' +
    '{id:"pass",n:"Pass",l:"PW",c:"#64748b"},' +
    '{id:"rand",n:"Rand",l:"RN",c:"#f43f5e"},' +
    '{id:"rps",n:"RPS",l:"RP",c:"#6366f1"},' +
    '{id:"ball",n:"8Ball",l:"8B",c:"#334155"},' +
    '{id:"about",n:"About",l:"i",c:"#475569"}' +
    '];' +
    'var DOCK=["calc","notes","todo","timer"];' +
    'function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}' +
    'function load(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}' +
    'function tick(){var d=new Date();var c=document.getElementById("clk");var t=document.getElementById("dte");if(!c)return;' +
    'c.textContent=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});' +
    't.textContent=d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})}' +
    'tick();setInterval(tick,1000);' +
    'function icon(a){var el=document.createElement("div");el.className="ic";' +
    'el.innerHTML="<div class=\\"b\\" style=\\"background:"+a.c+"\\">"+a.l+"</div><span>"+a.n+"</span>";' +
    'el.onclick=function(){openApp(a.id)};return el}' +
    'var grid=document.getElementById("grid");var dock=document.getElementById("dock");' +
    'APPS.forEach(function(a){grid.appendChild(icon(a))});' +
    'DOCK.forEach(function(id){for(var i=0;i<APPS.length;i++)if(APPS[i].id===id)dock.appendChild(icon(APPS[i]))});' +
    'function showHome(){document.getElementById("home").className="view on";document.getElementById("app").className="view"}' +
    'function openApp(id){document.getElementById("home").className="view";document.getElementById("app").className="view on";' +
    'var body=document.getElementById("abody");body.innerHTML="";if(UI[id])UI[id](body)}' +
    'document.getElementById("back").onclick=showHome;' +
    'var UI={' +
    'calc:function(el){' +
    'el.innerHTML="<div class=\\"disp\\" id=\\"cd\\">0</div><div class=\\"pad\\" id=\\"cp\\"></div>";' +
    'var cur="0",op=null,prev=null;' +
    'var keys=["C","B","%","/","7","8","9","*","4","5","6","-","1","2","3","+","0",".","N","="];' +
    'keys.forEach(function(k){var b=document.createElement("button");b.type="button";b.textContent=k==="N"?"+/-":k;' +
    'if(k==="/"||k==="*"||k==="%"||k==="-"||k==="+")b.className="sec";' +
    'b.onclick=function(){' +
    'if(k==="C"){cur="0";op=null;prev=null}' +
    'else if(k==="B"){cur=cur.length>1?cur.slice(0,-1):"0"}' +
    'else if(k==="N"){cur=String(-(+cur))}' +
    'else if(k==="%"){cur=String(+cur/100)}' +
    'else if(k==="/"||k==="*"||k==="-"||k==="+"){prev=+cur;op=k;cur="0"}' +
    'else if(k==="="){var n=+cur;if(op==="+")cur=String(prev+n);if(op==="-")cur=String(prev-n);' +
    'if(op==="*")cur=String(prev*n);if(op==="/")cur=n?String(prev/n):"Err";op=null}' +
    'else{if(k==="."&&cur.indexOf(".")>=0)return;cur=(cur==="0"&&k!==".")?k:cur+k}' +
    'document.getElementById("cd").textContent=cur};' +
    'document.getElementById("cp").appendChild(b)})},' +
    'notes:function(el){' +
    'el.innerHTML="<textarea id=\\"nt\\" rows=\\"7\\"></textarea><button type=\\"button\\" id=\\"sv\\">Save</button><div class=\\"out\\" id=\\"o\\"></div>";' +
    'document.getElementById("nt").value=load("mb_notes","");' +
    'document.getElementById("sv").onclick=function(){store("mb_notes",document.getElementById("nt").value);document.getElementById("o").textContent="Saved"}},' +
    'todo:function(el){' +
    'var items=[];try{items=JSON.parse(load("mb_todo","[]"))}catch(e){items=[]}' +
    'function ren(){el.innerHTML="<div class=\\"row\\"><input id=\\"ti\\" placeholder=\\"New task\\"/><button type=\\"button\\" id=\\"ad\\" style=\\"flex:0 0 64px\\">Add</button></div><div id=\\"ul\\"></div>";' +
    'items.forEach(function(it){var d=document.createElement("div");d.className="out";d.textContent=(it.d?"[x] ":"[ ] ")+it.t;' +
    'd.onclick=function(){it.d=!it.d;store("mb_todo",JSON.stringify(items));ren()};document.getElementById("ul").appendChild(d)});' +
    'document.getElementById("ad").onclick=function(){var v=document.getElementById("ti").value.trim();if(!v)return;items.push({t:v,d:0});store("mb_todo",JSON.stringify(items));ren()}}' +
    'ren()},' +
    'timer:function(el){' +
    'el.innerHTML="<label>Minutes</label><input id=\\"m\\" type=\\"number\\" value=\\"5\\"/><button type=\\"button\\" id=\\"st\\">Start</button><div class=\\"out\\" id=\\"o\\" style=\\"font-size:26px;text-align:center\\">05:00</div>";' +
    'var t=null,left=300;' +
    'document.getElementById("st").onclick=function(){if(t){clearInterval(t);t=null;document.getElementById("st").textContent="Start";return}' +
    'left=Math.max(1,+(document.getElementById("m").value)||5)*60;document.getElementById("st").textContent="Stop";' +
    't=setInterval(function(){left--;var mm=String(Math.floor(left/60)).padStart(2,"0");var ss=String(left%60).padStart(2,"0");' +
    'document.getElementById("o").textContent=mm+":"+ss;if(left<=0){clearInterval(t);t=null;document.getElementById("o").textContent="Done";document.getElementById("st").textContent="Start"}},1000)}},' +
    'dice:function(el){el.innerHTML="<div class=\\"out\\" id=\\"o\\" style=\\"font-size:32px;text-align:center\\">?</div><button type=\\"button\\" id=\\"g\\">Roll</button>";' +
    'document.getElementById("g").onclick=function(){document.getElementById("o").textContent=String(1+Math.floor(Math.random()*6))}},' +
    'coin:function(el){el.innerHTML="<div class=\\"out\\" id=\\"o\\" style=\\"font-size:24px;text-align:center\\">?</div><button type=\\"button\\" id=\\"g\\">Flip</button>";' +
    'document.getElementById("g").onclick=function(){document.getElementById("o").textContent=Math.random()<0.5?"Heads":"Tails"}},' +
    'bmi:function(el){el.innerHTML="<label>Height cm</label><input id=\\"h\\" type=\\"number\\" value=\\"170\\"/><label>Weight kg</label><input id=\\"w\\" type=\\"number\\" value=\\"65\\"/><button type=\\"button\\" id=\\"g\\">Calc</button><div class=\\"out\\" id=\\"o\\"></div>";' +
    'document.getElementById("g").onclick=function(){var m=+(document.getElementById("h").value)/100;var b=(+(document.getElementById("w").value))/(m*m);var c="Normal";if(b<18.5)c="Underweight";else if(b>=25&&b<30)c="Overweight";else if(b>=30)c="Obese";document.getElementById("o").textContent="BMI "+b.toFixed(1)+"\\n"+c}},' +
    'pass:function(el){el.innerHTML="<label>Length</label><input id=\\"l\\" type=\\"number\\" value=\\"12\\"/><button type=\\"button\\" id=\\"g\\">Generate</button><div class=\\"out\\" id=\\"o\\"></div>";' +
    'document.getElementById("g").onclick=function(){var c="abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";var n=+(document.getElementById("l").value)||12;var s="";for(var i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];document.getElementById("o").textContent=s}},' +
    'rand:function(el){el.innerHTML="<label>Min</label><input id=\\"a\\" type=\\"number\\" value=\\"1\\"/><label>Max</label><input id=\\"b\\" type=\\"number\\" value=\\"100\\"/><button type=\\"button\\" id=\\"g\\">Pick</button><div class=\\"out\\" id=\\"o\\" style=\\"font-size:28px;text-align:center\\"></div>";' +
    'document.getElementById("g").onclick=function(){var lo=+(document.getElementById("a").value),hi=+(document.getElementById("b").value);document.getElementById("o").textContent=String(Math.floor(Math.random()*(hi-lo+1))+lo)}},' +
    'rps:function(el){el.innerHTML="<div class=\\"row\\"><button type=\\"button\\" data-m=\\"rock\\">Rock</button><button type=\\"button\\" data-m=\\"paper\\">Paper</button><button type=\\"button\\" data-m=\\"scissors\\">Scissors</button></div><div class=\\"out\\" id=\\"o\\"></div>";' +
    'var nodes=el.querySelectorAll("[data-m]");for(var i=0;i<nodes.length;i++){(function(btn){btn.onclick=function(){var you=btn.getAttribute("data-m");var ai=["rock","paper","scissors"][Math.floor(Math.random()*3)];' +
    'var r="Draw";if((you==="rock"&&ai==="scissors")||(you==="paper"&&ai==="rock")||(you==="scissors"&&ai==="paper"))r="You win";else if(you!==ai)r="You lose";' +
    'document.getElementById("o").textContent="You: "+you+"\\nBot: "+ai+"\\n"+r}})(nodes[i])}},' +
    'ball:function(el){var a=["Yes","No","Maybe","Ask again","Definitely","Doubtful","Absolutely","Not now"];' +
    'el.innerHTML="<input id=\\"q\\" placeholder=\\"Question\\"/><button type=\\"button\\" id=\\"g\\">Shake</button><div class=\\"out\\" id=\\"o\\" style=\\"text-align:center;font-size:16px\\"></div>";' +
    'document.getElementById("g").onclick=function(){document.getElementById("o").textContent=a[Math.floor(Math.random()*a.length)]}},' +
    'about:function(el){el.innerHTML="<div class=\\"out\\"><b>MiniOS Phone</b>\\nOffline apps inside WhatsApp\\nMiniBot</div>"}' +
    '};' +
    '})();' +
    '</script>'
  );
}

function buildPhoneHtml() {
  const css =
    '.clk{font-size:32px;font-weight:200;text-align:center;margin:4px 0 2px}' +
    '.dte{font-size:11px;color:#94a3b8;text-align:center;margin-bottom:8px}' +
    '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 6px}' +
    '.ic{text-align:center}' +
    '.ic .b{width:48px;height:48px;margin:0 auto;border-radius:14px;display:flex;align-items:center;' +
    'justify-content:center;font-size:12px;font-weight:800;color:#fff}' +
    '.ic span{display:block;font-size:9px;margin-top:4px;font-weight:600;color:#cbd5e1}' +
    '.dock{display:flex;justify-content:space-around;margin-top:10px;padding:8px;border-radius:18px;' +
    'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08)}' +
    '.view{display:none}.view.on{display:block}' +
    '.out{background:#020617;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;' +
    'margin-top:8px;white-space:pre-wrap;word-break:break-word;min-height:32px;font-size:13px}' +
    '.row{display:flex;gap:6px}.row>*{flex:1}' +
    '.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pad button{padding:12px 0;font-size:15px}' +
    '.disp{background:#020617;border-radius:12px;padding:12px;font-size:24px;text-align:right;margin-bottom:8px;min-height:44px}' +
    'label{font-size:11px;color:#94a3b8;display:block;margin-top:6px}';
  return utilShell('Phone', css, phoneBody());
}

module.exports = {
  name: 'phone',
  pattern: 'phone',
  aliases: ['mobile', 'launcher', 'os', 'home'],
  desc: 'Smartphone launcher',
  category: 'apps',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, buildPhoneHtml(), 'Phone');
  },
};
