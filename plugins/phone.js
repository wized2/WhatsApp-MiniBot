const { sendHtmlApp } = require('../lib/htmlTransport');
const { utilShell } = require('../lib/gameShell');

function phoneBody() {
  // All string pieces use \\n so browser JS receives \n escapes (not raw newlines).
  return (
    '<div id="home" class="view on">' +
    '<div class="clk" id="clk">00:00</div>' +
    '<div class="dte" id="dte">-</div>' +
    '<div class="pages" id="pages">' +
    '<div class="page" id="p0"></div>' +
    '<div class="page" id="p1"></div>' +
    '<div class="page" id="p2"></div>' +
    '<div class="page" id="p3"></div>' +
    '</div>' +
    '<div class="nav">' +
    '<button type="button" class="sec" id="prev">Prev</button>' +
    '<div class="dots"><i class="on" id="d0"></i><i id="d1"></i><i id="d2"></i><i id="d3"></i></div>' +
    '<button type="button" class="sec" id="next">Next</button>' +
    '</div>' +
    '<div class="dock" id="dock"></div>' +
    '</div>' +
    '<div id="app" class="view">' +
    '<button type="button" class="sec" id="back" style="width:100%;margin-bottom:8px">Back</button>' +
    '<div id="abody"></div>' +
    '</div>' +
    '<script>(function(){' +
    'var APPS=[' +
    '{id:"calc",n:"Calc",l:"CL",c:"#0ea5e9",p:0},' +
    '{id:"notes",n:"Notes",l:"NT",c:"#eab308",p:0},' +
    '{id:"todo",n:"Tasks",l:"TK",c:"#22c55e",p:0},' +
    '{id:"timer",n:"Timer",l:"TM",c:"#f97316",p:0},' +
    '{id:"stop",n:"Stopwatch",l:"SW",c:"#a855f7",p:0},' +
    '{id:"focus",n:"Focus",l:"FC",c:"#8b5cf6",p:0},' +
    '{id:"counter",n:"Counter",l:"CT",c:"#06b6d4",p:0},' +
    '{id:"world",n:"Clocks",l:"WC",c:"#059669",p:0},' +
    '{id:"bmi",n:"BMI",l:"BM",c:"#14b8a6",p:1},' +
    '{id:"age",n:"Age",l:"AG",c:"#ec4899",p:1},' +
    '{id:"unit",n:"Units",l:"UN",c:"#0ea5e9",p:1},' +
    '{id:"fx",n:"FX",l:"FX",c:"#84cc16",p:1},' +
    '{id:"emi",n:"EMI",l:"EM",c:"#8b5cf6",p:1},' +
    '{id:"pct",n:"Percent",l:"%",c:"#f59e0b",p:1},' +
    '{id:"disc",n:"Discount",l:"DS",c:"#ef4444",p:1},' +
    '{id:"fuel",n:"Fuel",l:"FL",c:"#ea580c",p:1},' +
    '{id:"int",n:"Interest",l:"IN",c:"#6366f1",p:1},' +
    '{id:"words",n:"Words",l:"WD",c:"#3b82f6",p:1},' +
    '{id:"pass",n:"Password",l:"PW",c:"#64748b",p:1},' +
    '{id:"rand",n:"Random",l:"RN",c:"#f43f5e",p:1},' +
    '{id:"dice",n:"Dice",l:"DC",c:"#ef4444",p:2},' +
    '{id:"coin",n:"Coin",l:"CN",c:"#f59e0b",p:2},' +
    '{id:"rps",n:"RPS",l:"RP",c:"#6366f1",p:2},' +
    '{id:"ball",n:"8Ball",l:"8B",c:"#334155",p:2},' +
    '{id:"spin",n:"Picker",l:"PK",c:"#db2777",p:2},' +
    '{id:"color",n:"Color",l:"CR",c:"#e11d48",p:2},' +
    '{id:"flash",n:"Flash",l:"FL",c:"#fbbf24",p:2},' +
    '{id:"score",n:"Score",l:"SC",c:"#10b981",p:2},' +
    '{id:"tip",n:"Tip",l:"TP",c:"#14b8a6",p:2},' +
    '{id:"avg",n:"Average",l:"AV",c:"#0ea5e9",p:2},' +
    '{id:"marks",n:"Marks",l:"MK",c:"#8b5cf6",p:2},' +
    '{id:"days",n:"Days left",l:"DL",c:"#f97316",p:3},' +
    '{id:"check",n:"Checklist",l:"CK",c:"#22c55e",p:3},' +
    '{id:"cases",n:"Case",l:"Aa",c:"#6366f1",p:3},' +
    '{id:"rev",n:"Reverse",l:"RV",c:"#db2777",p:3},' +
    '{id:"morse",n:"Morse",l:"MR",c:"#64748b",p:3},' +
    '{id:"bin",n:"Binary",l:"BN",c:"#0891b2",p:3},' +
    '{id:"uid",n:"UUID",l:"ID",c:"#4f46e5",p:3},' +
    '{id:"about",n:"About",l:"i",c:"#475569",p:3}' +
    '];' +
    'var DOCK=["calc","notes","todo","focus"];' +
    'function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}' +
    'function load(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}' +
    'function tick(){var d=new Date();var c=document.getElementById("clk");var t=document.getElementById("dte");if(!c)return;' +
    'c.textContent=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});' +
    't.textContent=d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})}' +
    'tick();setInterval(tick,1000);' +
    'function icon(a){var el=document.createElement("div");el.className="ic";' +
    'el.innerHTML="<div class=\\"b\\" style=\\"background:"+a.c+"\\">"+a.l+"</div><span>"+a.n+"</span>";' +
    'el.onclick=function(){openApp(a.id)};return el}' +
    'APPS.forEach(function(a){var pg=document.getElementById("p"+a.p);if(pg)pg.appendChild(icon(a))});' +
    'DOCK.forEach(function(id){for(var i=0;i<APPS.length;i++)if(APPS[i].id===id)document.getElementById("dock").appendChild(icon(APPS[i]))});' +
    'var page=0,PAGE_N=4;' +
    'function goPage(n){page=(n+PAGE_N)%PAGE_N;for(var i=0;i<PAGE_N;i++){var pg=document.getElementById("p"+i);' +
    'if(pg)pg.style.display=i===page?"grid":"none";var d=document.getElementById("d"+i);if(d)d.className=i===page?"on":""}}' +
    'document.getElementById("prev").onclick=function(){goPage(page-1)};' +
    'document.getElementById("next").onclick=function(){goPage(page+1)};' +
    'for(var di=0;di<PAGE_N;di++){(function(i){var d=document.getElementById("d"+i);if(d)d.onclick=function(){goPage(i)}})(di)}' +
    'goPage(0);' +
    'function showHome(){document.getElementById("home").className="view on";document.getElementById("app").className="view"}' +
    'function openApp(id){document.getElementById("home").className="view";document.getElementById("app").className="view on";' +
    'var body=document.getElementById("abody");body.innerHTML="";if(UI[id])UI[id](body)}' +
    'document.getElementById("back").onclick=showHome;' +
    'function field(el,label,id,type,val){var l=document.createElement("label");l.textContent=label;el.appendChild(l);' +
    'var i=document.createElement("input");i.id=id;i.type=type||"text";if(val!=null)i.value=val;el.appendChild(i);return i}' +
    'function btn(el,text,fn){var b=document.createElement("button");b.type="button";b.textContent=text;b.onclick=fn;el.appendChild(b);return b}' +
    'function out(el){var o=document.createElement("div");o.className="out";o.id="o";el.appendChild(o);return o}' +
    'var UI={' +
    'calc:function(el){el.innerHTML="<div class=\\"disp\\" id=\\"cd\\">0</div><div class=\\"pad\\" id=\\"cp\\"></div>";' +
    'var cur="0",op=null,prev=null;' +
    '["C","B","%","/","7","8","9","*","4","5","6","-","1","2","3","+","0",".","N","="].forEach(function(k){' +
    'var b=document.createElement("button");b.type="button";b.textContent=k==="N"?"+/-":k;' +
    'if(k==="/"||k==="*"||k==="%"||k==="-"||k==="+")b.className="sec";' +
    'b.onclick=function(){if(k==="C"){cur="0";op=null;prev=null}else if(k==="B"){cur=cur.length>1?cur.slice(0,-1):"0"}' +
    'else if(k==="N"){cur=String(-(+cur))}else if(k==="%"){cur=String(+cur/100)}' +
    'else if(k==="/"||k==="*"||k==="-"||k==="+"){prev=+cur;op=k;cur="0"}' +
    'else if(k==="="){var n=+cur;if(op==="+")cur=String(prev+n);if(op==="-")cur=String(prev-n);' +
    'if(op==="*")cur=String(prev*n);if(op==="/")cur=n?String(prev/n):"Err";op=null}' +
    'else{if(k==="."&&cur.indexOf(".")>=0)return;cur=(cur==="0"&&k!==".")?k:cur+k}' +
    'document.getElementById("cd").textContent=cur};document.getElementById("cp").appendChild(b)})},' +
    'notes:function(el){var ta=document.createElement("textarea");ta.rows=7;ta.value=load("mb_notes","");el.appendChild(ta);' +
    'btn(el,"Save",function(){store("mb_notes",ta.value);document.getElementById("o").textContent="Saved"});out(el)},' +
    'todo:function(el){var items=[];try{items=JSON.parse(load("mb_todo","[]"))}catch(e){items=[]}' +
    'function ren(){el.innerHTML="";var row=document.createElement("div");row.className="row";' +
    'var ti=document.createElement("input");ti.placeholder="New task";row.appendChild(ti);' +
    'var ad=document.createElement("button");ad.type="button";ad.textContent="Add";ad.style.flex="0 0 64px";row.appendChild(ad);el.appendChild(row);' +
    'var ul=document.createElement("div");el.appendChild(ul);' +
    'items.forEach(function(it){var d=document.createElement("div");d.className="out";d.textContent=(it.d?"[x] ":"[ ] ")+it.t;' +
    'd.onclick=function(){it.d=!it.d;store("mb_todo",JSON.stringify(items));ren()};ul.appendChild(d)});' +
    'ad.onclick=function(){var v=ti.value.trim();if(!v)return;items.push({t:v,d:0});store("mb_todo",JSON.stringify(items));ren()}}ren()},' +
    'timer:function(el){field(el,"Minutes","m","number","5");var st=btn(el,"Start",null);var o=out(el);o.style.cssText="font-size:26px;text-align:center";o.textContent="05:00";' +
    'var t=null,left=300;st.onclick=function(){if(t){clearInterval(t);t=null;st.textContent="Start";return}' +
    'left=Math.max(1,+(document.getElementById("m").value)||5)*60;st.textContent="Stop";' +
    't=setInterval(function(){left--;o.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");' +
    'if(left<=0){clearInterval(t);t=null;o.textContent="Done";st.textContent="Start"}},1000)}},' +
    'stop:function(el){var o=out(el);o.style.cssText="font-size:28px;text-align:center";o.textContent="00:00.0";' +
    'var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    'var st=document.createElement("button");st.type="button";st.textContent="Start";row.appendChild(st);' +
    'var rs=document.createElement("button");rs.type="button";rs.className="sec";rs.textContent="Reset";row.appendChild(rs);' +
    'var t=null,ms=0;st.onclick=function(){if(t){clearInterval(t);t=null;st.textContent="Start";return}st.textContent="Stop";var t0=Date.now()-ms;' +
    't=setInterval(function(){ms=Date.now()-t0;var s=Math.floor(ms/1000),m=Math.floor(s/60);' +
    'o.textContent=String(m).padStart(2,"0")+":"+String(s%60).padStart(2,"0")+"."+Math.floor((ms%1000)/100)},100)};' +
    'rs.onclick=function(){clearInterval(t);t=null;ms=0;o.textContent="00:00.0";st.textContent="Start"}},' +
    'focus:function(el){var left=25*60,t=null;var o=out(el);o.style.cssText="font-size:32px;text-align:center";' +
    'function show(){o.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0")}' +
    'var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    'var st=document.createElement("button");st.type="button";st.textContent="Start";row.appendChild(st);' +
    'var rs=document.createElement("button");rs.type="button";rs.className="sec";rs.textContent="Reset";row.appendChild(rs);' +
    'st.onclick=function(){if(t){clearInterval(t);t=null;st.textContent="Start";return}st.textContent="Pause";' +
    't=setInterval(function(){left--;show();if(left<=0){clearInterval(t);t=null;o.textContent="Break";st.textContent="Start"}},1000)};' +
    'rs.onclick=function(){clearInterval(t);t=null;left=25*60;show();st.textContent="Start"};show()},' +
    'counter:function(el){var n=+(load("mb_cnt","0"))||0;var o=out(el);o.style.cssText="font-size:36px;text-align:center";o.textContent=n;' +
    'var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    '[["-",function(){n--;o.textContent=n;store("mb_cnt",String(n))}],["+",function(){n++;o.textContent=n;store("mb_cnt",String(n))}],["Reset",function(){n=0;o.textContent=0;store("mb_cnt","0")}]].forEach(function(x){' +
    'var b=document.createElement("button");b.type="button";b.textContent=x[0];if(x[0]==="Reset")b.className="sec";b.onclick=x[1];row.appendChild(b)})},' +
    'world:function(el){var zs=[["Pakistan","Asia/Karachi"],["London","Europe/London"],["New York","America/New_York"],["Dubai","Asia/Dubai"],["Tokyo","Asia/Tokyo"]];' +
    'function ren(){el.innerHTML="";zs.forEach(function(z){var d=document.createElement("div");d.className="out";d.style.display="flex";d.style.justifyContent="space-between";' +
    'd.innerHTML="<span>"+z[0]+"</span><b>"+new Date().toLocaleTimeString([],{timeZone:z[1],hour:"2-digit",minute:"2-digit"})+"</b>";el.appendChild(d)})}ren();setInterval(ren,1000)},' +
    'bmi:function(el){field(el,"Height cm","h","number","170");field(el,"Weight kg","w","number","65");' +
    'btn(el,"Calc",function(){var m=+(document.getElementById("h").value)/100;var b=(+(document.getElementById("w").value))/(m*m);' +
    'var c=b<18.5?"Underweight":b>=30?"Obese":b>=25?"Overweight":"Normal";document.getElementById("o").textContent="BMI "+b.toFixed(1)+" | "+c});out(el)},' +
    'age:function(el){field(el,"Birth date","d","date","");btn(el,"Age",function(){var v=document.getElementById("d").value;if(!v)return;' +
    'var b=new Date(v),n=new Date();var y=n.getFullYear()-b.getFullYear();var m=n.getMonth()-b.getMonth();if(m<0){y--;m+=12}' +
    'document.getElementById("o").textContent=y+" years, "+m+" months"});out(el)},' +
    'unit:function(el){field(el,"Value","v","number","10");var s=document.createElement("select");s.id="t";' +
    '[["1","km to mi"],["2","mi to km"],["3","kg to lb"],["4","lb to kg"],["5","C to F"],["6","F to C"],["7","m to ft"],["8","L to gal"]].forEach(function(o){' +
    'var op=document.createElement("option");op.value=o[0];op.textContent=o[1];s.appendChild(op)});el.appendChild(s);' +
    'btn(el,"Convert",function(){var v=+(document.getElementById("v").value),t=document.getElementById("t").value;' +
    'var r=t=="1"?v*0.621371:t=="2"?v*1.60934:t=="3"?v*2.20462:t=="4"?v/2.20462:t=="5"?v*9/5+32:t=="6"?(v-32)*5/9:t=="7"?v*3.28084:v*0.264172;' +
    'document.getElementById("o").textContent=String(r.toFixed(4))});out(el)},' +
    'fx:function(el){field(el,"Amount PKR","a","number","1000");btn(el,"Convert",function(){var p=+(document.getElementById("a").value);' +
    'document.getElementById("o").textContent="USD "+(p/278).toFixed(2)+" | EUR "+(p/300).toFixed(2)+" | GBP "+(p/350).toFixed(2)+" | AED "+(p/75.7).toFixed(2)+" (approx)"});out(el)},' +
    'emi:function(el){field(el,"Loan","p","number","500000");field(el,"Rate %/yr","r","number","14");field(el,"Months","n","number","36");' +
    'btn(el,"EMI",function(){var P=+(document.getElementById("p").value),R=+(document.getElementById("r").value)/12/100,N=+(document.getElementById("n").value);' +
    'var e=P*R*Math.pow(1+R,N)/(Math.pow(1+R,N)-1);document.getElementById("o").textContent="Monthly "+e.toFixed(0)+" | Total "+(e*N).toFixed(0)+" | Interest "+(e*N-P).toFixed(0)});out(el)},' +
    'pct:function(el){field(el,"Value","v","number","200");field(el,"Percent","p","number","15");' +
    'btn(el,"Calc",function(){var v=+(document.getElementById("v").value),p=+(document.getElementById("p").value);' +
    'document.getElementById("o").textContent=p+"% of "+v+" = "+(v*p/100).toFixed(2)});out(el)},' +
    'disc:function(el){field(el,"Price","p","number","1000");field(el,"Discount %","d","number","20");' +
    'btn(el,"Final",function(){var p=+(document.getElementById("p").value),d=+(document.getElementById("d").value);var f=p*(1-d/100);' +
    'document.getElementById("o").textContent="Pay "+f.toFixed(2)+" | Save "+(p-f).toFixed(2)});out(el)},' +
    'fuel:function(el){field(el,"Distance km","d","number","100");field(el,"Km per L","k","number","12");field(el,"Price / L","p","number","280");' +
    'btn(el,"Cost",function(){var lit=(+(document.getElementById("d").value))/(+(document.getElementById("k").value)||1);' +
    'document.getElementById("o").textContent="Fuel "+lit.toFixed(2)+" L | Cost "+(lit*(+(document.getElementById("p").value))).toFixed(0)});out(el)},' +
    'int:function(el){field(el,"Principal","p","number","10000");field(el,"Rate %/yr","r","number","10");field(el,"Years","y","number","2");' +
    'btn(el,"Interest",function(){var P=+(document.getElementById("p").value),R=+(document.getElementById("r").value),Y=+(document.getElementById("y").value);' +
    'var i=P*R*Y/100;document.getElementById("o").textContent="Interest "+i.toFixed(2)+" | Total "+(P+i).toFixed(2)});out(el)},' +
    'words:function(el){var ta=document.createElement("textarea");ta.rows=6;el.appendChild(ta);' +
    'btn(el,"Count",function(){var s=ta.value;var w=s.trim()?s.trim().split(/\\s+/).length:0;' +
    'document.getElementById("o").textContent="Chars "+s.length+" | Words "+w+" | Lines "+(s?s.split(/\\n/).length:0)});out(el)},' +
    'pass:function(el){field(el,"Length","l","number","16");btn(el,"Generate",function(){' +
    'var c="abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";var n=+(document.getElementById("l").value)||16;var s="";' +
    'for(var i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];document.getElementById("o").textContent=s});out(el)},' +
    'rand:function(el){field(el,"Min","a","number","1");field(el,"Max","b","number","100");' +
    'btn(el,"Pick",function(){var lo=+(document.getElementById("a").value),hi=+(document.getElementById("b").value);' +
    'document.getElementById("o").textContent=String(Math.floor(Math.random()*(hi-lo+1))+lo)});var o=out(el);o.style.cssText="font-size:28px;text-align:center"},' +
    'dice:function(el){var o=out(el);o.style.cssText="font-size:32px;text-align:center";o.textContent="?";' +
    'btn(el,"Roll 1d6",function(){o.textContent=String(1+Math.floor(Math.random()*6))});' +
    'btn(el,"Roll 2d6",function(){o.textContent=String(2+Math.floor(Math.random()*6)+Math.floor(Math.random()*6))})},' +
    'coin:function(el){var o=out(el);o.style.cssText="font-size:24px;text-align:center";o.textContent="?";' +
    'btn(el,"Flip",function(){o.textContent=Math.random()<0.5?"Heads":"Tails"})},' +
    'rps:function(el){var o=out(el);var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    '["rock","paper","scissors"].forEach(function(m){var b=document.createElement("button");b.type="button";b.textContent=m;' +
    'b.onclick=function(){var ai=["rock","paper","scissors"][Math.floor(Math.random()*3)];var r="Draw";' +
    'if((m==="rock"&&ai==="scissors")||(m==="paper"&&ai==="rock")||(m==="scissors"&&ai==="paper"))r="You win";else if(m!==ai)r="You lose";' +
    'o.textContent="You: "+m+" | Bot: "+ai+" | "+r};row.appendChild(b)})},' +
    'ball:function(el){var a=["Yes","No","Maybe","Ask again","Definitely","Doubtful","Absolutely","Not now","Likely","No way"];' +
    'field(el,"Question","q","text","");btn(el,"Shake",function(){document.getElementById("o").textContent=a[Math.floor(Math.random()*a.length)]});out(el)},' +
    'spin:function(el){field(el,"Options (comma)","opts","text","A, B, C, D");btn(el,"Pick one",function(){' +
    'var p=document.getElementById("opts").value.split(",").map(function(s){return s.trim()}).filter(Boolean);' +
    'document.getElementById("o").textContent=p.length?p[Math.floor(Math.random()*p.length)]:"?"});out(el)},' +
    'color:function(el){var i=document.createElement("input");i.type="color";i.value="#3b82f6";i.style.height="48px";i.style.padding="0";el.appendChild(i);' +
    'var o=out(el);function up(){o.textContent=i.value};i.oninput=up;up()},' +
    'flash:function(el){var on=0;var o=out(el);o.textContent="Flash off";btn(el,"Toggle",function(){on=!on;' +
    'document.body.style.background=on?"#f8fafc":"";document.body.style.color=on?"#0f172a":"";o.textContent=on?"Flash ON":"Flash off"})},' +
    'score:function(el){var a=0,b=0;var o=out(el);o.style.cssText="font-size:22px;text-align:center";function show(){o.textContent="A "+a+" : "+b+" B"}' +
    'var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    '[["A +1",function(){a++;show()}],["B +1",function(){b++;show()}],["Reset",function(){a=0;b=0;show()}]].forEach(function(x){' +
    'var b=document.createElement("button");b.type="button";b.textContent=x[0];if(x[0]==="Reset")b.className="sec";b.onclick=x[1];row.appendChild(b)});show()},' +
    'tip:function(el){field(el,"Bill","bill","number","1000");field(el,"Tip %","tp","number","10");field(el,"People","np","number","2");' +
    'btn(el,"Split",function(){var b=+(document.getElementById("bill").value),t=+(document.getElementById("tp").value),n=Math.max(1,+(document.getElementById("np").value));' +
    'var tip=b*t/100,total=b+tip;document.getElementById("o").textContent="Tip "+tip.toFixed(0)+" | Total "+total.toFixed(0)+" | Each "+(total/n).toFixed(0)});out(el)},' +
    'avg:function(el){field(el,"Numbers (comma)","nums","text","10, 20, 30");btn(el,"Average",function(){' +
    'var a=document.getElementById("nums").value.split(",").map(function(x){return +x.trim()}).filter(function(x){return !isNaN(x)});' +
    'if(!a.length)return;var s=a.reduce(function(x,y){return x+y},0);document.getElementById("o").textContent="Count "+a.length+" | Sum "+s+" | Avg "+(s/a.length).toFixed(2)});out(el)},' +
    'marks:function(el){field(el,"Obtained","ob","number","450");field(el,"Total","tt","number","500");' +
    'btn(el,"Percent",function(){var o=+(document.getElementById("ob").value),t=+(document.getElementById("tt").value)||1;var p=o/t*100;' +
    'var g=p>=90?"A+":p>=80?"A":p>=70?"B":p>=60?"C":p>=50?"D":"F";document.getElementById("o").textContent=p.toFixed(2)+"% | Grade "+g});out(el)},' +
    'days:function(el){field(el,"Target date","td","date","");btn(el,"Days left",function(){var v=document.getElementById("td").value;if(!v)return;' +
    'var t=new Date(v),n=new Date();t.setHours(0,0,0,0);n.setHours(0,0,0,0);var days=Math.round((t-n)/86400000);' +
    'document.getElementById("o").textContent=days>=0?days+" days left":Math.abs(days)+" days ago"});out(el)},' +
    'check:function(el){var items=[];try{items=JSON.parse(load("mb_check","[]"))}catch(e){items=[]}' +
    'function ren(){el.innerHTML="";var row=document.createElement("div");row.className="row";var ti=document.createElement("input");ti.placeholder="Item";row.appendChild(ti);' +
    'var ad=document.createElement("button");ad.type="button";ad.textContent="Add";ad.style.flex="0 0 64px";row.appendChild(ad);el.appendChild(row);var ul=document.createElement("div");el.appendChild(ul);' +
    'items.forEach(function(it){var d=document.createElement("div");d.className="out";d.textContent=(it.d?"[x] ":"[ ] ")+it.t;' +
    'd.onclick=function(){it.d=!it.d;store("mb_check",JSON.stringify(items));ren()};ul.appendChild(d)});' +
    'ad.onclick=function(){var v=ti.value.trim();if(!v)return;items.push({t:v,d:0});store("mb_check",JSON.stringify(items));ren()}}ren()},' +
    'cases:function(el){var ta=document.createElement("textarea");ta.rows=4;el.appendChild(ta);var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    '[["UPPER",function(){ta.value=ta.value.toUpperCase()}],["lower",function(){ta.value=ta.value.toLowerCase()}],' +
    '["Title",function(){ta.value=ta.value.toLowerCase().split(" ").map(function(w){return w?w[0].toUpperCase()+w.slice(1):""}).join(" ")}]].forEach(function(x){' +
    'var b=document.createElement("button");b.type="button";b.textContent=x[0];b.onclick=x[1];row.appendChild(b)})},' +
    'rev:function(el){field(el,"Text","tx","text","hello");btn(el,"Reverse",function(){' +
    'document.getElementById("o").textContent=document.getElementById("tx").value.split("").reverse().join("")});out(el)},' +
    'morse:function(el){var M={A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."};' +
    'field(el,"Text","mt","text","HI");btn(el,"To Morse",function(){var s=document.getElementById("mt").value.toUpperCase();' +
    'document.getElementById("o").textContent=s.split("").map(function(c){return c===" "?"/":(M[c]||c)}).join(" ")});out(el)},' +
    'bin:function(el){field(el,"Text or number","bt","text","Hi");btn(el,"To binary",function(){var s=document.getElementById("bt").value;' +
    'if(/^\\d+$/.test(s))document.getElementById("o").textContent=(+s).toString(2);' +
    'else document.getElementById("o").textContent=s.split("").map(function(c){return c.charCodeAt(0).toString(2).padStart(8,"0")}).join(" ")});out(el)},' +
    'uid:function(el){btn(el,"Generate",function(){var s="";for(var i=0;i<32;i++)s+=Math.floor(Math.random()*16).toString(16);' +
    'document.getElementById("o").textContent=s.slice(0,8)+"-"+s.slice(8,12)+"-4"+s.slice(13,16)+"-a"+s.slice(17,20)+"-"+s.slice(20)});out(el)},' +
    'about:function(el){var o=out(el);o.textContent="MiniOS Phone | 4 pages | use Prev/Next buttons | offline MiniBot"}' +
    '};' +
    '})();</script>'
  );
}

function buildPhoneHtml() {
  const css =
    '.clk{font-size:32px;font-weight:200;text-align:center;margin:2px 0}' +
    '.dte{font-size:11px;color:#94a3b8;text-align:center;margin-bottom:6px}' +
    '.pages{margin:0}' +
    '.page{display:none;grid-template-columns:repeat(4,1fr);gap:10px 6px;padding:4px 2px}' +
    '.nav{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 4px}' +
    '.nav button{flex:0 0 auto;min-width:64px;padding:8px 12px;font-size:12px}' +
    '.ic{text-align:center}.ic .b{width:46px;height:46px;margin:0 auto;border-radius:13px;display:flex;align-items:center;' +
    'justify-content:center;font-size:11px;font-weight:800;color:#fff}' +
    '.ic span{display:block;font-size:9px;margin-top:3px;font-weight:600;color:#cbd5e1}' +
    '.dots{display:flex;justify-content:center;gap:5px;flex:1}' +
    '.dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25);display:inline-block}' +
    '.dots i.on{width:14px;border-radius:4px;background:#fff}' +
    '.dock{display:flex;justify-content:space-around;margin-top:4px;padding:8px;border-radius:18px;' +
    'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08)}' +
    '.view{display:none}.view.on{display:block}' +
    '.out{background:#020617;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;' +
    'margin-top:8px;white-space:pre-wrap;word-break:break-word;min-height:32px;font-size:13px}' +
    '.row{display:flex;gap:6px;margin-top:6px}.row>*{flex:1}' +
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
