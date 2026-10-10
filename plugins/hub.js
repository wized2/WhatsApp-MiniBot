const { sendHtmlApp } = require('../lib/htmlTransport');
const { utilShell } = require('../lib/gameShell');

function hubBody() {
  return (
    '<div id="home" class="view on"><div class="tabs" id="tabs"></div><div class="grid" id="grid"></div></div>' +
    '<div id="app" class="view"><button type="button" class="sec" id="back" style="width:100%;margin-bottom:8px">Back</button><div id="abody"></div></div>' +
    '<script>(function(){' +
    'var CATS={Daily:["calc","notes","todo","timer","focus","counter","habit","expense","water"],' +
    'Math:["pct","disc","emi","int","gcd","quad","prime","roman","base"],' +
    'Convert:["unit","fx","temp","data","timez","color"],' +
    'Text:["words","cases","rev","slug","lorem","diff","jsonf","hash"],' +
    'Health:["bmi","ideal","age","breath","zodiac"],' +
    'Fun:["dice","coin","rps","ball","spin","truth","rather","fakeid"],' +
    'Dev:["uuid","bin","morse","regex","passwd","luhn","leap"],' +
    'Islam:["zakat","tasbih","hijri"],' +
    'More:["days","marks","avg","tip","world","about"]};' +
    'var NAMES={calc:"Calc",notes:"Notes",todo:"Tasks",timer:"Timer",focus:"Focus",counter:"Counter",habit:"Habit",expense:"Expense",water:"Water",' +
    'pct:"Percent",disc:"Discount",emi:"EMI",int:"Interest",gcd:"GCD/LCM",quad:"Quadratic",prime:"Prime?",roman:"Roman",base:"Base",' +
    'unit:"Units",fx:"FX PKR",temp:"Temp",data:"Data size",timez:"Time zones",color:"Color",' +
    'words:"Word count",cases:"Case",rev:"Reverse",slug:"Slug",lorem:"Lorem",diff:"Diff lens",jsonf:"JSON",hash:"Hash",' +
    'bmi:"BMI",ideal:"Ideal wt",age:"Age",breath:"Breathe",zodiac:"Zodiac",' +
    'dice:"Dice",coin:"Coin",rps:"RPS",ball:"8Ball",spin:"Picker",truth:"Truth/Dare",rather:"Rather",fakeid:"Fake ID",' +
    'uuid:"UUID",bin:"Binary",morse:"Morse",regex:"Regex test",passwd:"Password",luhn:"Card check",leap:"Leap year",' +
    'zakat:"Zakat",tasbih:"Tasbih",hijri:"Hijri approx",' +
    'days:"Days left",marks:"Marks %",avg:"Average",tip:"Tip split",world:"Clocks",about:"About"};' +
    'function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}' +
    'function load(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}' +
    'var cur="Daily";' +
    'function renderTabs(){var t=document.getElementById("tabs");t.innerHTML="";Object.keys(CATS).forEach(function(c){' +
    'var b=document.createElement("button");b.type="button";b.textContent=c;b.className=c===cur?"":"sec";b.onclick=function(){cur=c;renderTabs();renderGrid()};t.appendChild(b)})}' +
    'function renderGrid(){var g=document.getElementById("grid");g.innerHTML="";(CATS[cur]||[]).forEach(function(id){' +
    'var b=document.createElement("button");b.type="button";b.className="sec";b.textContent=NAMES[id]||id;b.onclick=function(){openApp(id)};g.appendChild(b)})}' +
    'function showHome(){document.getElementById("home").className="view on";document.getElementById("app").className="view"}' +
    'function openApp(id){document.getElementById("home").className="view";document.getElementById("app").className="view on";' +
    'var body=document.getElementById("abody");body.innerHTML="";if(UI[id])UI[id](body);else body.textContent="Coming soon"}' +
    'document.getElementById("back").onclick=showHome;renderTabs();renderGrid();' +
    'function field(el,label,id,type,val){var l=document.createElement("label");l.textContent=label;el.appendChild(l);var i=document.createElement("input");i.id=id;i.type=type||"text";if(val!=null)i.value=val;el.appendChild(i);return i}' +
    'function btn(el,text,fn){var b=document.createElement("button");b.type="button";b.textContent=text;b.onclick=fn;el.appendChild(b);return b}' +
    'function out(el){var o=document.createElement("div");o.className="out";o.id="o";el.appendChild(o);return o}' +
    'var UI={' +
    'calc:function(el){el.innerHTML="<div class=\\"disp\\" id=\\"cd\\">0</div><div class=\\"pad\\" id=\\"cp\\"></div>";var cur="0",op=null,prev=null;' +
    '["C","B","%","/","7","8","9","*","4","5","6","-","1","2","3","+","0",".","="].forEach(function(k){var b=document.createElement("button");b.type="button";b.textContent=k;' +
    'b.onclick=function(){if(k==="C"){cur="0";op=null;prev=null}else if(k==="B"){cur=cur.length>1?cur.slice(0,-1):"0"}else if(k==="%"){cur=String(+cur/100)}' +
    'else if("/ * - +".indexOf(k)>=0){prev=+cur;op=k;cur="0"}else if(k==="="){var n=+cur;if(op==="+")cur=String(prev+n);if(op==="-")cur=String(prev-n);if(op==="*")cur=String(prev*n);if(op==="/")cur=n?String(prev/n):"Err";op=null}' +
    'else{if(k==="."&&cur.indexOf(".")>=0)return;cur=(cur==="0"&&k!==".")?k:cur+k}document.getElementById("cd").textContent=cur};document.getElementById("cp").appendChild(b)})},' +
    'notes:function(el){var ta=document.createElement("textarea");ta.rows=6;ta.value=load("hub_notes","");el.appendChild(ta);btn(el,"Save",function(){store("hub_notes",ta.value);document.getElementById("o").textContent="Saved"});out(el)},' +
    'todo:function(el){var items=[];try{items=JSON.parse(load("hub_todo","[]"))}catch(e){items=[]}function ren(){el.innerHTML="";var row=document.createElement("div");row.className="row";var ti=document.createElement("input");ti.placeholder="Task";row.appendChild(ti);' +
    'var ad=document.createElement("button");ad.type="button";ad.textContent="Add";row.appendChild(ad);el.appendChild(row);items.forEach(function(it){var d=document.createElement("div");d.className="out";d.textContent=(it.d?"[x] ":"[ ] ")+it.t;' +
    'd.onclick=function(){it.d=!it.d;store("hub_todo",JSON.stringify(items));ren()};el.appendChild(d)});ad.onclick=function(){var v=ti.value.trim();if(!v)return;items.push({t:v,d:0});store("hub_todo",JSON.stringify(items));ren()}}ren()},' +
    'timer:function(el){field(el,"Minutes","m","number","5");var st=btn(el,"Start",null);var o=out(el);o.style.fontSize="24px";o.style.textAlign="center";var t=null,left=300;' +
    'st.onclick=function(){if(t){clearInterval(t);t=null;st.textContent="Start";return}left=Math.max(1,+(document.getElementById("m").value)||5)*60;st.textContent="Stop";' +
    't=setInterval(function(){left--;o.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");if(left<=0){clearInterval(t);t=null;o.textContent="Done";st.textContent="Start"}},1000)}},' +
    'focus:function(el){var left=25*60,t=null;var o=out(el);o.style.fontSize="28px";o.style.textAlign="center";function show(){o.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0")}' +
    'var st=btn(el,"Start",null);st.onclick=function(){if(t){clearInterval(t);t=null;st.textContent="Start";return}st.textContent="Pause";t=setInterval(function(){left--;show();if(left<=0){clearInterval(t);t=null;o.textContent="Break";st.textContent="Start"}},1000)};show()},' +
    'counter:function(el){var n=+(load("hub_cnt","0"))||0;var o=out(el);o.style.fontSize="32px";o.style.textAlign="center";o.textContent=n;' +
    'var row=document.createElement("div");row.className="row";el.appendChild(row);[["-",-1],["+",1],["0",0]].forEach(function(x){var b=document.createElement("button");b.type="button";b.textContent=x[0];' +
    'b.onclick=function(){if(x[1]===0)n=0;else n+=x[1];o.textContent=n;store("hub_cnt",String(n))};row.appendChild(b)})},' +
    'habit:function(el){var items=[];try{items=JSON.parse(load("hub_habit","[]"))}catch(e){items=[]}function ren(){el.innerHTML="";var row=document.createElement("div");row.className="row";var ti=document.createElement("input");ti.placeholder="Habit";row.appendChild(ti);' +
    'var ad=document.createElement("button");ad.type="button";ad.textContent="Add";row.appendChild(ad);el.appendChild(row);items.forEach(function(it,idx){var d=document.createElement("div");d.className="out";d.textContent=it.n+" · streak "+it.s;' +
    'd.onclick=function(){it.s++;store("hub_habit",JSON.stringify(items));ren()};el.appendChild(d)});ad.onclick=function(){var v=ti.value.trim();if(!v)return;items.push({n:v,s:0});store("hub_habit",JSON.stringify(items));ren()}}ren()},' +
    'expense:function(el){field(el,"Amount","ea","number","100");field(el,"Note","en","text","food");btn(el,"Add",function(){' +
    'var list=[];try{list=JSON.parse(load("hub_exp","[]"))}catch(e){list=[]}list.push({a:+(document.getElementById("ea").value),n:document.getElementById("en").value});store("hub_exp",JSON.stringify(list));' +
    'var sum=list.reduce(function(s,x){return s+x.a},0);document.getElementById("o").textContent="Entries "+list.length+" | Total "+sum});out(el)},' +
    'water:function(el){var n=+(load("hub_water","0"))||0;var o=out(el);o.style.textAlign="center";o.style.fontSize="22px";function show(){o.textContent=n+" glasses"}' +
    'btn(el,"+1 glass",function(){n++;store("hub_water",String(n));show()});btn(el,"Reset",function(){n=0;store("hub_water","0");show()});show()},' +
    'pct:function(el){field(el,"Value","v","number","200");field(el,"Percent","p","number","15");btn(el,"Calc",function(){var v=+(document.getElementById("v").value),p=+(document.getElementById("p").value);document.getElementById("o").textContent=(v*p/100).toFixed(2)});out(el)},' +
    'disc:function(el){field(el,"Price","p","number","1000");field(el,"Off %","d","number","20");btn(el,"Final",function(){var p=+(document.getElementById("p").value),d=+(document.getElementById("d").value);document.getElementById("o").textContent="Pay "+(p*(1-d/100)).toFixed(2)});out(el)},' +
    'emi:function(el){field(el,"Loan","p","number","500000");field(el,"Rate %/yr","r","number","14");field(el,"Months","n","number","36");btn(el,"EMI",function(){var P=+(document.getElementById("p").value),R=+(document.getElementById("r").value)/12/100,N=+(document.getElementById("n").value);var e=P*R*Math.pow(1+R,N)/(Math.pow(1+R,N)-1);document.getElementById("o").textContent="Monthly "+e.toFixed(0)});out(el)},' +
    'int:function(el){field(el,"Principal","p","number","10000");field(el,"Rate","r","number","10");field(el,"Years","y","number","2");btn(el,"SI",function(){var P=+(document.getElementById("p").value),R=+(document.getElementById("r").value),Y=+(document.getElementById("y").value);document.getElementById("o").textContent="Interest "+(P*R*Y/100).toFixed(2)});out(el)},' +
    'gcd:function(el){field(el,"A","a","number","48");field(el,"B","b","number","18");btn(el,"GCD/LCM",function(){function g(a,b){return b?g(b,a%b):a}var a=+(document.getElementById("a").value),b=+(document.getElementById("b").value);var g0=g(a,b);document.getElementById("o").textContent="GCD "+g0+" | LCM "+(a*b/g0)});out(el)},' +
    'quad:function(el){field(el,"a","qa","number","1");field(el,"b","qb","number","-3");field(el,"c","qc","number","2");btn(el,"Solve",function(){var a=+(document.getElementById("qa").value),b=+(document.getElementById("qb").value),c=+(document.getElementById("qc").value);var d=b*b-4*a*c;if(d<0)document.getElementById("o").textContent="Complex roots";else{var s=Math.sqrt(d);document.getElementById("o").textContent="x="+((-b+s)/(2*a)).toFixed(4)+" | "+((-b-s)/(2*a)).toFixed(4)}});out(el)},' +
    'prime:function(el){field(el,"Number","pn","number","17");btn(el,"Check",function(){var n=+(document.getElementById("pn").value),ok=n>1;for(var i=2;i*i<=n;i++)if(n%i===0)ok=0;document.getElementById("o").textContent=ok?"Prime":"Not prime"});out(el)},' +
    'roman:function(el){field(el,"Number 1-3999","rn","number","2024");btn(el,"To Roman",function(){var num=+(document.getElementById("rn").value);var v=[1000,900,500,400,100,90,50,40,10,9,5,4,1],s=["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"],o="";for(var i=0;i<v.length;i++)while(num>=v[i]){o+=s[i];num-=v[i]}document.getElementById("o").textContent=o});out(el)},' +
    'base:function(el){field(el,"Number","bn","number","255");field(el,"Base 2-36","bb","number","16");btn(el,"Convert",function(){var n=+(document.getElementById("bn").value),b=+(document.getElementById("bb").value);document.getElementById("o").textContent=n.toString(b)});out(el)},' +
    'unit:function(el){field(el,"Value","uv","number","10");var s=document.createElement("select");s.id="ut";[["1","km->mi"],["2","mi->km"],["3","kg->lb"],["4","C->F"]].forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];s.appendChild(op)});el.appendChild(s);' +
    'btn(el,"Go",function(){var v=+(document.getElementById("uv").value),t=document.getElementById("ut").value;var r=t=="1"?v*0.621:t=="2"?v*1.609:t=="3"?v*2.205:v*9/5+32;document.getElementById("o").textContent=r.toFixed(4)});out(el)},' +
    'fx:function(el){field(el,"PKR","fa","number","1000");btn(el,"Approx",function(){var p=+(document.getElementById("fa").value);document.getElementById("o").textContent="USD "+(p/278).toFixed(2)+" EUR "+(p/300).toFixed(2)+" AED "+(p/75.7).toFixed(2)});out(el)},' +
    'temp:function(el){field(el,"Value","tv","number","37");var s=document.createElement("select");s.id="tt";[["1","C to F"],["2","F to C"],["3","C to K"]].forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];s.appendChild(op)});el.appendChild(s);' +
    'btn(el,"Convert",function(){var v=+(document.getElementById("tv").value),t=document.getElementById("tt").value;document.getElementById("o").textContent=String(t=="1"?v*9/5+32:t=="2"?(v-32)*5/9:v+273.15)});out(el)},' +
    'data:function(el){field(el,"MB","dm","number","1024");btn(el,"To GB/KB",function(){var m=+(document.getElementById("dm").value);document.getElementById("o").textContent=(m/1024).toFixed(3)+" GB | "+(m*1024)+" KB"});out(el)},' +
    'timez:function(el){var zs=[["PKT","Asia/Karachi"],["GMT","Europe/London"],["EST","America/New_York"],["GST","Asia/Dubai"]];function ren(){el.innerHTML="";zs.forEach(function(z){var d=document.createElement("div");d.className="out";d.textContent=z[0]+" "+new Date().toLocaleTimeString([],{timeZone:z[1],hour:"2-digit",minute:"2-digit"});el.appendChild(d)})}ren();setInterval(ren,1000)},' +
    'color:function(el){var i=document.createElement("input");i.type="color";i.value="#3b82f6";el.appendChild(i);var o=out(el);i.oninput=function(){o.textContent=i.value};o.textContent=i.value},' +
    'words:function(el){var ta=document.createElement("textarea");ta.rows=5;el.appendChild(ta);btn(el,"Count",function(){var s=ta.value;var w=s.trim()?s.trim().split(/\\s+/).length:0;document.getElementById("o").textContent="Chars "+s.length+" Words "+w});out(el)},' +
    'cases:function(el){var ta=document.createElement("textarea");ta.rows=3;el.appendChild(ta);var row=document.createElement("div");row.className="row";el.appendChild(row);' +
    '[["UP",function(){ta.value=ta.value.toUpperCase()}],["low",function(){ta.value=ta.value.toLowerCase()}],["Title",function(){ta.value=ta.value.toLowerCase().split(" ").map(function(w){return w?w[0].toUpperCase()+w.slice(1):""}).join(" ")}]].forEach(function(x){var b=document.createElement("button");b.type="button";b.textContent=x[0];b.onclick=x[1];row.appendChild(b)})},' +
    'rev:function(el){field(el,"Text","rt","text","hello");btn(el,"Reverse",function(){document.getElementById("o").textContent=document.getElementById("rt").value.split("").reverse().join("")});out(el)},' +
    'slug:function(el){field(el,"Text","st","text","Hello World");btn(el,"Slug",function(){document.getElementById("o").textContent=document.getElementById("st").value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")});out(el)},' +
    'lorem:function(el){field(el,"Words","lw","number","30");btn(el,"Generate",function(){var w="lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");var n=+(document.getElementById("lw").value)||30;var o=[];for(var i=0;i<n;i++)o.push(w[i%w.length]);document.getElementById("o").textContent=o.join(" ")});out(el)},' +
    'diff:function(el){field(el,"Text A","da","text","hello");field(el,"Text B","db","text","hallo");btn(el,"Compare",function(){var a=document.getElementById("da").value,b=document.getElementById("db").value;document.getElementById("o").textContent="Len A "+a.length+" B "+b.length+" | Equal "+(a===b?"yes":"no")});out(el)},' +
    'jsonf:function(el){var ta=document.createElement("textarea");ta.rows=5;ta.placeholder="{\\"a\\":1}";el.appendChild(ta);btn(el,"Format",function(){try{document.getElementById("o").textContent=JSON.stringify(JSON.parse(ta.value),null,2)}catch(e){document.getElementById("o").textContent="Invalid JSON"}});out(el)},' +
    'hash:function(el){field(el,"Text","ht","text","hello");btn(el,"Simple hash",function(){var s=document.getElementById("ht").value,h=0;for(var i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;document.getElementById("o").textContent=String(h>>>0)});out(el)},' +
    'bmi:function(el){field(el,"Height cm","bh","number","170");field(el,"Weight kg","bw","number","65");btn(el,"BMI",function(){var m=+(document.getElementById("bh").value)/100,b=(+(document.getElementById("bw").value))/(m*m);document.getElementById("o").textContent="BMI "+b.toFixed(1)});out(el)},' +
    'ideal:function(el){field(el,"Height cm","ih","number","170");field(el,"Gender m/f","ig","text","m");btn(el,"Ideal",function(){var h=+(document.getElementById("ih").value),g=document.getElementById("ig").value.toLowerCase();var w=g==="f"?45.5+0.91*(h-152.4):50+0.91*(h-152.4);document.getElementById("o").textContent="~"+w.toFixed(1)+" kg (Devine)"});out(el)},' +
    'age:function(el){field(el,"Birth","ad","date","");btn(el,"Age",function(){var v=document.getElementById("ad").value;if(!v)return;var b=new Date(v),n=new Date();document.getElementById("o").textContent=(n.getFullYear()-b.getFullYear())+" years approx"});out(el)},' +
    'breath:function(el){var o=out(el);o.style.textAlign="center";o.style.fontSize="20px";o.textContent="Box breathing";var steps=["Inhale","Hold","Exhale","Hold"],ix=0,t;btn(el,"Start",function(){clearInterval(t);ix=0;o.textContent=steps[0];t=setInterval(function(){ix=(ix+1)%4;o.textContent=steps[ix]},4000)})},' +
    'zodiac:function(el){field(el,"Month 1-12","zm","number","5");field(el,"Day","zd","number","15");btn(el,"Sign",function(){var m=+(document.getElementById("zm").value),d=+(document.getElementById("zd").value);' +
    'var s=["Capricorn","Aquarius","Pisces","Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn"];' +
    'var c=[20,19,20,20,21,21,22,22,22,23,22,21];document.getElementById("o").textContent=d<c[m-1]?s[m-1]:s[m]});out(el)},' +
    'dice:function(el){var o=out(el);o.style.textAlign="center";o.style.fontSize="28px";btn(el,"Roll",function(){o.textContent=String(1+Math.floor(Math.random()*6))})},' +
    'coin:function(el){var o=out(el);o.style.textAlign="center";btn(el,"Flip",function(){o.textContent=Math.random()<0.5?"Heads":"Tails"})},' +
    'rps:function(el){var o=out(el);["rock","paper","scissors"].forEach(function(m){btn(el,m,function(){var ai=["rock","paper","scissors"][Math.floor(Math.random()*3)];o.textContent="You "+m+" | Bot "+ai})})},' +
    'ball:function(el){var a=["Yes","No","Maybe","Ask again","Definitely","Doubtful"];field(el,"Q","bq","text","");btn(el,"Shake",function(){document.getElementById("o").textContent=a[Math.floor(Math.random()*a.length)]});out(el)},' +
    'spin:function(el){field(el,"Options","so","text","A,B,C");btn(el,"Pick",function(){var p=document.getElementById("so").value.split(",").map(function(s){return s.trim()}).filter(Boolean);document.getElementById("o").textContent=p[Math.floor(Math.random()*p.length)]||"?"});out(el)},' +
    'truth:function(el){var T=["Biggest fear?","Last lie?","Embarrassing moment?"],D=["Do 10 squats","Accent for 1 min","Compliment someone"];var o=out(el);btn(el,"Truth",function(){o.textContent=T[Math.floor(Math.random()*T.length)]});btn(el,"Dare",function(){o.textContent=D[Math.floor(Math.random()*D.length)]})},' +
    'rather:function(el){var Q=[["Invisible","Read minds"],["No internet","No AC"]];var o=out(el);btn(el,"Next",function(){var x=Q[Math.floor(Math.random()*Q.length)];o.textContent="A) "+x[0]+"  B) "+x[1]})},' +
    'fakeid:function(el){var first=["Ali","Sara","Omar","Zara","Hassan"],last=["Khan","Ahmed","Malik","Raza","Iqbal"];btn(el,"Generate",function(){document.getElementById("o").textContent=first[Math.floor(Math.random()*5)]+" "+last[Math.floor(Math.random()*5)]+" | age "+(18+Math.floor(Math.random()*40))});out(el)},' +
    'uuid:function(el){btn(el,"Generate",function(){var s="";for(var i=0;i<32;i++)s+=Math.floor(Math.random()*16).toString(16);document.getElementById("o").textContent=s.slice(0,8)+"-"+s.slice(8,12)+"-4"+s.slice(13,16)+"-a"+s.slice(17,20)+"-"+s.slice(20)});out(el)},' +
    'bin:function(el){field(el,"Text/num","bi","text","Hi");btn(el,"Binary",function(){var s=document.getElementById("bi").value;document.getElementById("o").textContent=/^\\d+$/.test(s)?(+s).toString(2):s.split("").map(function(c){return c.charCodeAt(0).toString(2)}).join(" ")});out(el)},' +
    'morse:function(el){var M={A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."};' +
    'field(el,"Text","mo","text","HI");btn(el,"Morse",function(){document.getElementById("o").textContent=document.getElementById("mo").value.toUpperCase().split("").map(function(c){return M[c]||c}).join(" ")});out(el)},' +
    'regex:function(el){field(el,"Pattern","rp","text","^[a-z]+$");field(el,"Text","rx","text","hello");btn(el,"Test",function(){try{var r=new RegExp(document.getElementById("rp").value);document.getElementById("o").textContent=r.test(document.getElementById("rx").value)?"Match":"No match"}catch(e){document.getElementById("o").textContent="Bad pattern"}});out(el)},' +
    'passwd:function(el){field(el,"Length","pl","number","16");btn(el,"Generate",function(){var c="abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#",n=+(document.getElementById("pl").value)||16,s="";for(var i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];document.getElementById("o").textContent=s});out(el)},' +
    'luhn:function(el){field(el,"Card digits","lc","text","4111111111111111");btn(el,"Luhn check",function(){var s=document.getElementById("lc").value.replace(/\\D/g,""),sum=0,alt=0;for(var i=s.length-1;i>=0;i--){var n=+s[i];if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}document.getElementById("o").textContent=sum%10===0?"Valid checksum":"Invalid"});out(el)},' +
    'leap:function(el){field(el,"Year","ly","number","2024");btn(el,"Check",function(){var y=+(document.getElementById("ly").value);document.getElementById("o").textContent=((y%4===0&&y%100!==0)||y%400===0)?"Leap year":"Not leap"});out(el)},' +
    'zakat:function(el){field(el,"Wealth PKR","zw","number","500000");btn(el,"2.5%",function(){var w=+(document.getElementById("zw").value);document.getElementById("o").textContent="Zakat ~ "+(w*0.025).toFixed(0)+" (if nisab met)"});out(el)},' +
    'tasbih:function(el){var n=0;var o=out(el);o.style.fontSize="32px";o.style.textAlign="center";o.textContent="0";btn(el,"Count +1",function(){n++;o.textContent=n});btn(el,"Reset",function(){n=0;o.textContent="0"})},' +
    'hijri:function(el){btn(el,"Approx today",function(){var d=new Date();var g=d.getFullYear()*365.25+d.getMonth()*30.44+d.getDate();var h=Math.floor((g-227014)/29.530588);document.getElementById("o").textContent="Rough day index "+h+" (approx only)"});out(el)},' +
    'days:function(el){field(el,"Target","dd","date","");btn(el,"Left",function(){var v=document.getElementById("dd").value;if(!v)return;var t=new Date(v),n=new Date();document.getElementById("o").textContent=Math.round((t-n)/86400000)+" days"});out(el)},' +
    'marks:function(el){field(el,"Got","mg","number","450");field(el,"Total","mt","number","500");btn(el,"%",function(){var g=+(document.getElementById("mg").value),t=+(document.getElementById("mt").value)||1;document.getElementById("o").textContent=(g/t*100).toFixed(2)+"%"});out(el)},' +
    'avg:function(el){field(el,"Nums","an","text","10,20,30");btn(el,"Avg",function(){var a=document.getElementById("an").value.split(",").map(Number).filter(function(x){return !isNaN(x)});var s=a.reduce(function(x,y){return x+y},0);document.getElementById("o").textContent=(s/a.length).toFixed(2)});out(el)},' +
    'tip:function(el){field(el,"Bill","tb","number","1000");field(el,"Tip%","tt","number","10");field(el,"People","tp","number","2");'.replace('field(el:"People"','field(el,"People"') +
    'btn(el,"Split",function(){var b=+(document.getElementById("tb").value),t=+(document.getElementById("tt").value),n=Math.max(1,+(document.getElementById("tp").value));var tip=b*t/100;document.getElementById("o").textContent="Each "+((b+tip)/n).toFixed(0)});out(el)},' +
    'world:function(el){var zs=[["PKT","Asia/Karachi"],["London","Europe/London"],["NY","America/New_York"]];function ren(){el.innerHTML="";zs.forEach(function(z){var d=document.createElement("div");d.className="out";d.textContent=z[0]+" "+new Date().toLocaleTimeString([],{timeZone:z[1],hour:"2-digit",minute:"2-digit"});el.appendChild(d)})}ren()},' +
    'about:function(el){out(el).textContent="MiniBot Hub | 55+ offline tools | no internet needed inside the card"}' +
    '};' +
    '})();</script>'
  );
}

function buildHub() {
  const css =
    '.tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}.tabs button{padding:6px 8px;font-size:11px}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.grid button{padding:10px 6px;font-size:12px}' +
    '.view{display:none}.view.on{display:block}' +
    '.out{background:#020617;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;margin-top:8px;word-break:break-word;min-height:32px;font-size:13px}' +
    '.row{display:flex;gap:6px;margin-top:6px}.row>*{flex:1}' +
    '.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pad button{padding:12px 0}' +
    '.disp{background:#020617;border-radius:12px;padding:12px;font-size:22px;text-align:right;margin-bottom:8px}' +
    'label{font-size:11px;color:#94a3b8;display:block;margin-top:6px}';
  return utilShell('Hub', css, hubBody());
}

module.exports = {
  name: 'hub',
  pattern: 'hub',
  aliases: ['apps', 'kit', 'toolbox', 'lab'],
  desc: '55+ offline tools hub',
  category: 'tools',
  async handler({ sock, jid }) {
    await sendHtmlApp(sock, jid, buildHub(), 'Hub');
  },
};
