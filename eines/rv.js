/* ---------- revisió en grup: propostes, votacions i «Corregida» ----------
   Les dades viuen en un full de Google (script «pont-propostes.gs»).
   Dins de claude.ai la pàgina no pot connectar amb servidors externs: allà aquesta capa no s'activa. */
(function rv(){
"use strict";
if(/claude|anthropic/i.test(location.hostname))return;
const VERSIO="2026-10-19b";
const PONT_DEF="https://script.google.com/macros/s/AKfycbxt9n1CRTAoJkLrSAcvQjlb9X34DmJHaUyEnwhny1TkLZreDD1-Vr2_-2-xUzF-Lk8Fag/exec";
const LSG=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const LSS=(k,v)=>{try{if(v==null||v==="")localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}};
const PONT=LSG("mp-rv-pont")||PONT_DEF;
const CANV=typeof CANVIS!=="undefined"?CANVIS:{};
const ME={nom:LSG("mp-rv-nom")||"",codi:LSG("mp-rv-codi")||"",admin:LSG("mp-rv-admin")||""};
let DATA=null;try{DATA=ME.codi?JSON.parse(LSG("mp-rv-cache")||"null"):null;}catch(e){}
let MODE=false,netErr="";

const AMB={contingut:"Contingut",glossari:"Glossari",organitzacio:"Organització",web:"La web"};
const TIP={corregir:"Correcció",eliminar:"Eliminació",afegir:"Addició",assenyalar:"Imatge o esquema",dubte:"Dubte",terme_nou:"Terme nou al glossari",definicio:"Definició del glossari",moure:"Moure",fusionar:"Fusionar",separar:"Separar",reclassificar:"Reclassificar",reordenar:"Reordenar",altre:"Altre canvi d'organització",funcionalitat:"Funcionalitat nova",apartat:"Apartat nou",millora:"Millora d'una funcionalitat"};
const TORG=["moure","fusionar","separar","reclassificar","reordenar","altre"],TWEB=["funcionalitat","apartat","millora"];
const VOT={acord:"D'acord",contra:"En contra",innecessaria:"Innecessària"};
const RES={incorporada:"Incorporada",adaptada:"Incorporada amb canvis",rebutjada:"No incorporada",resposta:"Resposta de la guia"};
const MAINSECS=["fil","anatomia","llenguatge","patrons","raonar","tractament"];
const h=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $1=s=>document.querySelector(s);
const sp=s=>String(s||"").replace(/\s+/g," ").trim();
const same=(a,b)=>sp(a).toLowerCase()===sp(b).toLowerCase();
const dia=s=>{const d=new Date(s);return isNaN(d)?"":d.toLocaleDateString("ca-ES",{day:"numeric",month:"short"});};
function hash(s){let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193);}return (x>>>0).toString(16).padStart(8,"0");}

/* ---------- connexió amb el full ---------- */
async function api(body){
  if(!ME.codi)throw new Error("Cal el codi del grup.");
  let r;
  try{
    if(!body)r=await fetch(PONT+"?codi="+encodeURIComponent(ME.codi),{cache:"no-store"});
    else r=await fetch(PONT,{method:"POST",body:JSON.stringify(Object.assign({codi:ME.codi,autor:ME.nom},body))});
  }catch(e){throw new Error("No s'ha pogut connectar amb el full de propostes. Comprova la connexió i torna-ho a provar.");}
  let j;try{j=await r.json();}catch(e){throw new Error("El full de propostes no ha respost bé. Torna-ho a provar d'aquí a una estona.");}
  if(!j.ok){if(/codi de grup/i.test(j.error||"")){ME.codi="";LSS("mp-rv-codi",null);DATA=null;LSS("mp-rv-cache",null);renderAll();}throw new Error(j.error||"Error desconegut.");}
  DATA=j;LSS("mp-rv-cache",JSON.stringify(j));netErr="";renderAll();return j;
}
let lastLoad=0;
async function load(quiet){if(!ME.codi)return;try{await api(null);lastLoad=Date.now();}catch(e){netErr=e.message;if(!quiet)toast(e.message);renderBand();}}
setInterval(()=>{if(document.visibilityState==="visible"&&ME.codi&&Date.now()-lastLoad>85000)load(true);},15000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&ME.codi&&Date.now()-lastLoad>30000)load(true);});

/* ---------- dades derivades ---------- */
const PR=()=>DATA?DATA.propostes:[];
const votsDe=id=>DATA?DATA.vots.filter(v=>v.proposta===id):[];
const respDe=id=>DATA?DATA.respostes.filter(v=>v.proposta===id):[];
const anc=p=>{try{return JSON.parse(p.ancora||"{}")||{};}catch(e){return {};}};
const isAgr=id=>typeof GAGR!=="undefined"&&GAGR.has(id);
const formaLab=id=>isAgr(id)?"Malaltia nova a l'agrupació":"Forma o subtipus nou";
const tipOf=p=>p.lloc==="nova"?"Malaltia nova (sense lloc decidit)":anc(p).forma?formaLab(String(p.lloc||"").slice(2)):(TIP[p.tipus]||p.tipus);
function estat(p){const c=CANV[p.id];if(!c)return "oberta";
  if(respDe(p.id).some(r=>same(r.autor,p.autor)&&/^\[REOBERTA\]/.test(r.text)&&String(r.data).slice(0,10)>=c.v))return "reoberta";return c.e;}
const stCls=p=>{const e=estat(p);return e==="rebutjada"?"rv-no":(e==="oberta"||e==="reoberta")?"":"rv-fet";};
function chip(p){const e=estat(p);const t=e==="oberta"?"Oberta":e==="reoberta"?"Reoberta":RES[e]||e;const c=e==="oberta"?"oberta":e==="reoberta"?"reob":e==="rebutjada"?"no":"fet";return `<span class="rv-chip ${c}">${h(t)}</span>`;}
function recompte(id){const o={acord:0,contra:0,innecessaria:0,jotambe:0};votsDe(id).forEach(v=>{if(o[v.vot]!=null)o[v.vot]++;});return o;}
function consens(p){const c=recompte(p.id),n=c.acord+c.contra+c.innecessaria;if(n<2)return "pocs";if(c.acord*2>n)return "favor";if((c.contra+c.innecessaria)*2>n)return "contra";return "discutida";}
const secName=id=>{if(id==="fil")return "Inici";const a=document.querySelector(`nav.top a[href="#${id}"]`);return a?sp(a.textContent.replace(/^\s*\d+/,"")):id;};
function llocLabel(l){l=String(l||"");
  if(l.startsWith("f:")){const id=l.slice(2);return D[id]?D[id].n:id;}
  if(l.startsWith("g:")){const k=l.slice(2);return "Grup de l'atles: "+(FAM[k]||(ROWS[k]&&ROWS[k][0])||k);}
  if(l.startsWith("s:")){const [s,x]=l.slice(2).split("|");return secName(s)+(x?" › "+x:"");}
  if(l.startsWith("glos:"))return "Glossari › "+l.slice(5);
  if(l==="web")return "La web";if(l==="nova")return "Lloc per decidir";return l;}
const isMine=p=>ME.nom&&same(p.autor,ME.nom);

/* ---------- context d'una selecció: fitxa o apartat ---------- */
const SKIPTXT="script,style,svg,textarea,input,select,.rv-ui";
function ctxOf(node){const el=node&&(node.nodeType===1?node:node.parentElement);if(!el)return null;
  if(el.closest(".rv-ui,#glPop,.lbox,nav.top"))return null;
  const dr=el.closest("#drawer");if(dr){if(dr.hidden||!cur)return null;return {root:dr,f:cur};}
  for(const id of MAINSECS){const r=document.getElementById(id);if(r&&r.contains(el))return {root:r,sec:id};}
  return null;}
function headsOf(root){return [...root.querySelectorAll("h2,h3")].filter(x=>!x.closest(".rv-ui,.drawer")||root.id==="drawer");}
function headOf(el,root){let last=null;for(const x of headsOf(root)){if(x===el||x.contains(el)||(x.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING))last=x;else break;}return last;}
function apOf(el){el=el.nodeType===1?el:el.parentElement;
  if(el.closest("#drawer")){const ty=el.closest(".ty");if(ty){const b=ty.querySelector(":scope>b");return "Tipus i formes › "+sp(b&&b.firstChild?b.firstChild.textContent:"");}
    const s=el.closest(".dsec");if(s){const x=s.querySelector("h3");return x?sp(x.textContent):"";}return "Capçalera";}
  const c=ctxOf(el);const hd=c?headOf(el,c.root):null;return hd?sp(hd.textContent):"";}
function llocOf(c,el){return c.f?"f:"+c.f:"s:"+c.sec+"|"+apOf(el);}

/* ---------- índex de text normalitzat (espais col·lapsats) ---------- */
function index(root){const nodes=[],S=[],M=[],pos=new Map();let spc=true;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return(!p||p.closest(SKIPTXT))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
  let n;while((n=w.nextNode())){const v=n.nodeValue,ni=nodes.length;nodes.push(n);const pm=new Int32Array(v.length+1);
    for(let i=0;i<v.length;i++){pm[i]=S.length;const c=v[i];if(c===" "||c==="\n"||c==="\t"||c==="\r"||c==="\u00a0"){if(spc)continue;S.push(" ");M.push(ni,i);spc=true;}else{S.push(c);M.push(ni,i);spc=false;}}
    pm[v.length]=S.length;pos.set(n,pm);}
  return {s:S.join(""),M,nodes,pos};}
function nIdx(ix,cont,off,end){
  if(cont.nodeType===3&&ix.pos.has(cont))return ix.pos.get(cont)[off];
  const r=document.createRange();try{r.setStart(cont,off);}catch(e){return null;}
  if(!end){for(const n of ix.nodes){if(r.comparePoint(n,0)>=0)return ix.pos.get(n)[0];}return ix.s.length;}
  let res=0;for(const n of ix.nodes){if(r.comparePoint(n,n.nodeValue.length)<=0)res=ix.pos.get(n)[n.nodeValue.length];else break;}return res;}
function cs(a,b){let k=0;while(k<a.length&&k<b.length&&a[a.length-1-k]===b[b.length-1-k])k++;return k;}
function cp(a,b){let k=0;while(k<a.length&&k<b.length&&a[k]===b[k])k++;return k;}
function findA(ix,A){const t=A.t;if(!t)return -1;let best=-1,bs=-1,i=ix.s.indexOf(t);
  while(i>=0){const pre=A.pre||"",suf=A.suf||"";const sc=cs(ix.s.slice(Math.max(0,i-pre.length),i),pre)+cp(ix.s.slice(i+t.length,i+t.length+suf.length),suf);if(sc>bs){bs=sc;best=i;}i=ix.s.indexOf(t,i+1);}
  return best;}
function wrapRange(ix,a,b,mk){const segs=[];
  for(let j=a;j<b;j++){const ni=ix.M[2*j],off=ix.M[2*j+1];const l=segs[segs.length-1];if(l&&l.ni===ni)l.e=off+1;else segs.push({ni,s:off,e:off+1});}
  segs.forEach(g=>{let n=ix.nodes[g.ni];if(!n.isConnected||!n.parentNode)return;if(g.e<n.nodeValue.length)n.splitText(g.e);if(g.s>0)n=n.splitText(g.s);const m=mk();n.parentNode.insertBefore(m,n);m.appendChild(n);});}
function insertAt(ix,b,node){if(b<=0)return;const ni=ix.M[2*(b-1)],off=ix.M[2*(b-1)+1];let n=ix.nodes[ni];if(!n.isConnected)return;if(off+1<n.nodeValue.length)n.splitText(off+1);n.parentNode.insertBefore(node,n.nextSibling);}

/* ---------- imatges i esquemes ---------- */
function bigSvg(s){if(!s||s.closest("svg")!==s)return false;const vb=(s.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number);return vb.length===4&&vb[2]>=60;}
function imgTarget(t){if(!t||!t.closest)return null;const im=t.closest("img");if(im&&!im.closest(".rv-ui,.lbox"))return im;
  let s=t.closest("svg");while(s&&s.parentElement&&s.parentElement.closest("svg"))s=s.parentElement.closest("svg");return bigSvg(s)&&!s.closest(".rv-ui,nav.top,.dbar")?s:null;}
function imgKey(el,c){if(el.tagName==="IMG"){const f=(el.getAttribute("src")||"").split("/").pop();const b=el.closest("[data-lb]");return {img:"foto:"+((b&&IMG[b.dataset.lb]&&IMG[b.dataset.lb][+b.dataset.li])?IMG[b.dataset.lb][+b.dataset.li][0]:f)};}
  const ap=apOf(el);const all=[...c.root.querySelectorAll("svg")].filter(s=>bigSvg(s)&&apOf(s)===ap);return {img:"svg:"+ap+":"+all.indexOf(el)};}
function findImg(root,A){const k=A.img||"";
  if(k.startsWith("foto:")){const f=k.slice(5);return [...root.querySelectorAll("img")].find(i=>{const b=i.closest("[data-lb]");return b&&IMG[b.dataset.lb]&&IMG[b.dataset.lb][+b.dataset.li]&&IMG[b.dataset.lb][+b.dataset.li][0]===f;})||null;}
  const m=k.match(/^svg:(.*):(\d+)$/);if(!m)return null;const all=[...root.querySelectorAll("svg")].filter(s=>bigSvg(s)&&apOf(s)===m[1]);return all[+m[2]]||null;}
function mkPin(cls,x,y,id,el){const p=document.createElement("span");p.className="rv-pin rv-ui "+cls;p.setAttribute("role","button");p.tabIndex=0;if(id)p.dataset.rvp=id;p._el=el;p._x=x;p._y=y;p.setAttribute("aria-label","Proposta sobre aquesta imatge");
  const par=el.parentElement;if(getComputedStyle(par).position==="static")par.style.position="relative";par.appendChild(p);posPin(p);return p;}
function posPin(p){const el=p._el,par=p.parentElement;if(!el||!par||!el.isConnected)return;const er=el.getBoundingClientRect(),pr=par.getBoundingClientRect();
  if(!er.width||!er.height){p.hidden=true;return;}p.hidden=false;
  p.style.left=(er.left-pr.left-par.clientLeft+par.scrollLeft+p._x/100*er.width)+"px";p.style.top=(er.top-pr.top-par.clientTop+par.scrollTop+p._y/100*er.height)+"px";}
const posAll=()=>document.querySelectorAll(".rv-pin").forEach(posPin);
let posT=null;const posLater=()=>{clearTimeout(posT);posT=setTimeout(posAll,120);};
addEventListener("resize",posLater);document.addEventListener("toggle",posLater,true);addEventListener("load",posLater);

/* ---------- marques al text ---------- */
const orphan=new Set();
let applying=false,dirty=new Set(),applyT=null;
function rootsAll(){const r=MAINSECS.map(id=>document.getElementById(id)).filter(Boolean);if(!drawer.hidden&&cur)r.push(drawer);return r;}
function matchRoot(root,p){if(root===drawer)return p.lloc==="f:"+cur;return p.lloc.startsWith("s:"+root.id+"|");}
function unwrap(m){if(m.classList.contains("rv-m")){const pa=m.parentNode;while(m.firstChild)pa.insertBefore(m.firstChild,m);pa.removeChild(m);pa.normalize&&pa.normalize();}else m.remove();}
function applyRoot(root){
  const ps=DATA?PR().filter(p=>matchRoot(root,p)&&(p.ambit==="contingut"||p.ambit==="glossari")):[];
  root.querySelectorAll("[data-rvp]").forEach(m=>{const p=ps.find(x=>x.id===m.dataset.rvp);if(!p||!m.classList.contains(stCls(p)||"rv-st"))unwrap(m);});
  let ix=null;
  ps.forEach(p=>{const A=anc(p);
    if(A.forma){orphan.delete(p.id);return;}
    if(A.img){const el=findImg(root,A);if(!el){orphan.add(p.id);return;}orphan.delete(p.id);const ex=root.querySelector(`[data-rvp="${p.id}"]`);if(ex&&ex._el===el){posPin(ex);return;}if(ex)ex.remove();mkPin((stCls(p)||"rv-st"),A.x,A.y,p.id,el);return;}
    if(root.querySelector(`[data-rvp="${p.id}"]`)){orphan.delete(p.id);return;}
    if(!ix)ix=index(root);const i=findA(ix,A);if(i<0){orphan.add(p.id);return;}orphan.delete(p.id);
    const cls=stCls(p)||"rv-st";
    if(p.tipus==="afegir"||A.after){const s=document.createElement("span");s.className="rv-ins rv-ui "+cls;s.dataset.rvp=p.id;s.setAttribute("role","button");s.tabIndex=0;s.title="Proposta d'addició";s.textContent="+";insertAt(ix,i+A.t.length,s);}
    else wrapRange(ix,i,i+A.t.length,()=>{const m=document.createElement("mark");m.className="rv-m "+cls;m.dataset.rvp=p.id;m.title=tipOf(p);return m;});
    ix=null;});
}
function applyMarks(roots){if(applying)return;applying=true;mo.disconnect();
  try{(roots||rootsAll()).forEach(r=>{try{applyRoot(r);}catch(e){console.warn("rv",e);}});decorate();posAll();}
  finally{applying=false;mo.observe(document.body,{childList:true,subtree:true,characterData:false});}}
const mo=new MutationObserver(recs=>{if(applying)return;
  for(const r of recs){const t=r.target;if(!t||!t.closest)continue;if(t.closest(".rv-ui"))continue;
    const root=t.closest("#drawer")||MAINSECS.map(id=>document.getElementById(id)).find(x=>x&&x.contains(t))||(t.closest("#atles,#glPop,nav.top")?t:null);
    if(root)dirty.add(root);}
  if(!dirty.size)return;clearTimeout(applyT);applyT=setTimeout(()=>{const rs=[...dirty].filter(x=>x===drawer||MAINSECS.includes(x.id));dirty.clear();applyMarks(rs);},140);});

/* ---------- «Corregida» ---------- */
const HF=new Map(),HH=new WeakMap();
function hashFitxa(id){if(HF.has(id))return HF.get(id);const v=hashFitxa0(id);HF.set(id,v);return v;}
function hashHead(root,hd){if(HH.has(hd))return HH.get(hd);const v=hash(regionText(root,hd));HH.set(hd,v);return v;}
function hashFitxa0(id){const pick=o=>o&&o[id]!==undefined?o[id]:null;
  const sv=Object.keys(SV).filter(k=>k.split("~")[0]===id).sort().map(k=>[k,SV[k],LOCS[k]]);
  return hash(JSON.stringify([D[id],pick(MIR),pick(V),pick(CO),pick(HP),pick(LOOK),pick(LOC),pick(TX),pick(CLIN),pick(DX),pick(MECH),pick(TYP),pick(GRP),pick(IMG),pick(TL),sv,R.filter(r=>r[0]===id||r[1]===id)]));}
function regionText(root,hd){const hs=headsOf(root),i=hs.indexOf(hd),nx=hs[i+1];const r=document.createRange();r.setStartBefore(hd);if(nx)r.setEndBefore(nx);else r.setEndAfter(root.lastChild);
  const out=[];const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return(!p||p.closest(SKIPTXT))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
  let n;while((n=w.nextNode())){if(r.intersectsNode(n))out.push(n.nodeValue);}return sp(out.join(" "));}
function corInfo(lloc,emp){const rows=DATA?DATA.corregides.filter(c=>c.lloc===lloc):[];return {ok:rows.filter(c=>c.empremta===emp),old:rows.filter(c=>c.empremta!==emp)};}
function corHTML(lloc,emp,nP){const ci=corInfo(lloc,emp);const mine=ci.ok.find(c=>same(c.autor,ME.nom)),mineOld=ci.old.find(c=>same(c.autor,ME.nom));
  const parts=[];
  if(ci.ok.length)parts.push(`<span class="ok">✓ Corregida per ${h(ci.ok.map(c=>c.autor).join(", "))}</span>`);
  if(ci.old.length)parts.push(`<span class="old" title="Ho van revisar abans de l'última actualització">Revisió anterior: ${h(ci.old.map(c=>c.autor).join(", "))}</span>`);
  if(nP)parts.push(`<button type="button" class="rv-link" data-rvlist="${h(lloc)}">${nP} ${nP===1?"proposta":"propostes"}</button>`);
  if(MODE){parts.push(`<button type="button" class="rv-btn${mine?" mine":""}" data-rvcor="${h(lloc)}" data-emp="${emp}" data-on="${mine?0:1}">${mine?"✓ Corregida per tu · treu la marca":mineOld?"Ha canviat: torna-la a marcar":"Marca com a corregida"}</button>`);
    parts.push(`<button type="button" class="rv-btn" data-rvorg="${h(lloc)}">Proposa un canvi d'organització</button>`);}
  return parts.join("");}
const nProp=l=>PR().filter(p=>p.lloc===l).length;
function decorate(){
  const on=!!DATA;
  /* fitxa oberta */
  if(!drawer.hidden&&cur){const t=$1("#dTitle");const host=t&&t.parentElement;
    if(host){let c=host.querySelector(":scope>.rv-cor");const html=on||MODE?(MODE?`<button type="button" class="rv-btn rv-add" data-rvforma="${h(cur)}">+ ${h(formaLab(cur))}</button>`:"")+corHTML("f:"+cur,hashFitxa(cur),nProp("f:"+cur)):"";
      if(!html){if(c)c.remove();}else{if(!c){c=document.createElement("div");c.className="rv-cor rv-ui";host.appendChild(c);}if(c.innerHTML!==html)c.innerHTML=html;}}
    const act=drawer.querySelector(".dact");if(act&&!act.querySelector(".rv-dt")){const b=document.createElement("button");b.type="button";b.className="dbtn rv-dt rv-ui";b.dataset.rvmode="1";b.title="Mode corrector (Ctrl+K)";b.innerHTML=`<span class="dbt">Corrector </span>✎`;act.insertBefore(b,act.firstChild);}
    const dt=drawer.querySelector(".rv-dt");if(dt)dt.setAttribute("aria-pressed",MODE?"true":"false");
    decoTyp();}
  /* subapartats de les seccions */
  MAINSECS.forEach(id=>{const root=document.getElementById(id);if(!root)return;
    headsOf(root).forEach(hd=>{const lloc="s:"+id+"|"+sp(hd.textContent);let c=hd.nextElementSibling;if(c&&!c.classList.contains("rv-cor"))c=null;
      const n=nProp(lloc);const need=MODE||(on&&(n||DATA.corregides.some(x=>x.lloc===lloc)));
      if(!need){if(c)c.remove();return;}
      const html=corHTML(lloc,hashHead(root,hd),n);
      if(!c){c=document.createElement("div");c.className="rv-cor rv-ui";hd.after(c);}if(c.innerHTML!==html)c.innerHTML=html;});});
  /* targetes i grups de l'atles */
  document.querySelectorAll("#atles .acell[data-card]").forEach(cell=>{const id=cell.dataset.card,card=cell.querySelector(".acard");if(!card)return;let b=card.querySelector(".rv-badge");
    if(!on){if(b)b.remove();return;}const ci=corInfo("f:"+id,hashFitxa(id)),n=nProp("f:"+id);
    const html=(ci.ok.length?`<span class="ok">✓ Corregida · ${ci.ok.length}</span>`:"")+(n?`<span class="pr">${n} ${n===1?"proposta":"propostes"}</span>`:"");
    if(!html){if(b)b.remove();return;}if(!b){b=document.createElement("span");b.className="rv-badge rv-ui";card.appendChild(b);}if(b.innerHTML!==html)b.innerHTML=html;});
  document.querySelectorAll("#atles .agroup").forEach(g=>{const k=(g.id||"").replace(/^[gf]-/,"");const lloc="g:"+k;const box=g.querySelector(":scope>div");if(!box)return;let c=box.querySelector(":scope>.rv-cor");
    const n=nProp(lloc);const html=(n?`<button type="button" class="rv-link" data-rvlist="${h(lloc)}">${n} ${n===1?"proposta":"propostes"}</button>`:"")+(MODE?`<button type="button" class="rv-btn" data-rvorg="${h(lloc)}">Proposa un canvi d'organització</button>`:"");
    if(!html){if(c)c.remove();return;}if(!c){c=document.createElement("div");c.className="rv-cor rv-ui";box.appendChild(c);}if(c.innerHTML!==html)c.innerHTML=html;});
  /* glossari */
  const gp=$1("#glPop");if(gp&&!gp.hidden){let b=gp.querySelector(".rv-gl");const t=gp.querySelector(".gt");
    if(MODE&&t){if(!b){b=document.createElement("div");b.className="rv-gl rv-ui";b.style.marginTop="8px";gp.appendChild(b);}const k=sp(t.textContent),n=nProp("glos:"+k);
      const html=`<div class="rv-row">${n?`<button type="button" class="rv-link" data-rvlist="glos:${h(k)}">${n} ${n===1?"proposta":"propostes"}</button>`:""}<button type="button" class="rv-btn" data-rvdef="${h(k)}">Proposa un canvi a la definició</button></div>`;if(b.innerHTML!==html)b.innerHTML=html;}
    else if(b)b.remove();}
}

/* formes proposades dins de «Tipus i formes» */
function rowsOf(id){const t=TYP[id];return t&&!(typeof TL!=="undefined"&&TL[id])?t.r:[];}
function decoTyp(){const g=drawer.querySelector("#dtyp .typ");if(!g)return;
  const ps=PR().filter(p=>p.lloc==="f:"+cur&&anc(p).forma);
  const sig=(MODE?1:0)+"|"+ps.map(p=>p.id+stCls(p)+JSON.stringify(recompte(p.id))).join(",");if(g.dataset.rvsig===sig)return;g.dataset.rvsig=sig;
  g.querySelectorAll(":scope>.rv-ty,:scope>.rv-tyadd").forEach(x=>x.remove());
  const tys=[...g.querySelectorAll(":scope>.ty")],rows=rowsOf(cur);
  ps.forEach(p=>{const F=anc(p).forma,c=recompte(p.id);const e=mk("button","rv-ty rv-ui "+(stCls(p)||"rv-st"));e.type="button";e.dataset.rvp=p.id;
    const f1=(F.camps||[]).find(x=>x[1]);
    e.innerHTML=`<span class="k">Proposta · ${h(tipOf(p))}</span><b>${h(F.nom)}</b>${f1?`<span>${h(f1[0])}: ${h(f1[1])}</span>`:""}<span class="m">${h(p.autor)} · ✓ ${c.acord} · ✗ ${c.contra} · – ${c.innecessaria}</span>`;
    const i=F.despres?rows.findIndex(r=>same(r[0],F.despres)):-1;const ref=i>=0?tys[i]:null;
    if(ref){let n=ref;while(n.nextElementSibling&&n.nextElementSibling.classList.contains("rv-ty"))n=n.nextElementSibling;n.after(e);}else g.appendChild(e);});
  if(MODE){const a=mk("button","rv-tyadd rv-ui",`<b>+ ${h(formaLab(cur))}</b><span>${isAgr(cur)?"Proposa una altra malaltia per a aquesta fitxa":"Proposa una forma que falti en aquesta taula"}</span>`);a.type="button";a.dataset.rvforma=cur;g.appendChild(a);}}
function openForma(id,after,rect){const t=TYP[id],rows=rowsOf(id),agr=isAgr(id);
  const labs=t&&t.lab?t.lab:(rows.length?["Descripció"]:["Què","Qui","Clínica","Clau"]);
  draft={kind:"forma",ctx:{lloc:"f:"+id,id,labs}};cardId=null;
  let opts="";if(rows.length){let grp=null;rows.forEach((r,i)=>{const hd=t.hd&&t.hd[""+i];if(hd){opts+=(grp?"</optgroup>":"")+`<optgroup label="${h(hd)}">`;grp=1;}opts+=`<option value="${i}"${i===after?" selected":""}>Després de «${h(r[0])}»</option>`;});if(grp)opts+="</optgroup>";}
  const pos=rows.length?`<label>On va<select id="rvFPos"><option value=""${after==null?" selected":""}>Al final de la taula</option>${opts}</select></label>`:`<p class="rv-who">Aquesta fitxa encara no té taula de formes: la proposta servirà per començar-ne una.</p>`;
  openPop(`${head(agr?"Proposa una malaltia nova per a l'agrupació":"Proposa una forma o subtipus nou",D[id].n+" › "+(agr?"Malalties agrupades":"Tipus i formes"))}
   <label>${agr?"Nom de la malaltia":"Nom de la forma o subtipus"}<input type="text" id="rvFNom" maxlength="120"></label>${pos}
   <fieldset class="rv-fs"><legend>Com la descriuries? <small>(omple el que sàpigues)</small></legend>${labs.map((l,i)=>`<label>${h(l)}<input type="text" class="rv-fc" data-i="${i}" maxlength="400"></label>`).join("")}</fieldset>
   <label>Esquema histològic <small>(opcional: què s'hi veuria al microscopi)</small><textarea id="rvFEsq" maxlength="600" rows="2" style="min-height:56px"></textarea></label>
   <label>Font <small>(opcional: article, guia, llibre o enllaç)</small><input type="text" id="rvFont" maxlength="600"></label>
   ${idFields()}
   <div class="rv-row"><button type="button" class="rv-btn pri" data-rvsend>Publica la proposta</button><button type="button" class="rv-btn" data-rvclose>Cancel·la</button></div>`,rect);
  const n=pop.querySelector("#rvFNom");if(n)n.focus({preventScroll:true});}
async function sendForma(){const ctx=draft.ctx,id=ctx.id,rows=rowsOf(id);
  const nom=sp(pop.querySelector("#rvFNom").value);const vals=[...pop.querySelectorAll(".rv-fc")].map(x=>sp(x.value));
  const esq=sp(pop.querySelector("#rvFEsq").value),font=sp(pop.querySelector("#rvFont").value);const ps=pop.querySelector("#rvFPos");
  const err=readId();if(err)return showErr(err);
  if(!nom)return showErr(isAgr(id)?"Escriu el nom de la malaltia.":"Escriu el nom de la forma.");
  if(!vals.some(Boolean))return showErr("Descriu-la almenys en un dels camps.");
  if(rows.some(r=>same(r[0],nom)))return showErr("Aquesta forma ja és a la taula. Si vols canviar-la, selecciona'n el text.");
  const despres=ps&&ps.value!==""?rows[+ps.value][0]:null;
  const camps=ctx.labs.map((l,i)=>[l,vals[i]]).filter(x=>x[1]);
  const text=[`${formaLab(id)}: ${nom}${despres?` (després de «${despres}»)`:" (al final de la taula)"}`,...camps.map(([l,v])=>`${l}: ${v}`),...(esq?["Esquema: "+esq]:[])].join("\n");
  setBusy(true);
  try{await api({accio:"proposa",ambit:"contingut",tipus:"afegir",lloc:ctx.lloc,ancora:{forma:{nom,despres,camps,esquema:esq},ap:"Tipus i formes"},text,font});closePop();toast("Proposta publicada.");}
  catch(e){setBusy(false);showErr(e.message);}}
function openNova(rect,preId){draft={kind:"nova",ctx:{lloc:"nova",labs:["Què","Qui","Clínica","Clau"]}};cardId=null;
  const used=new Set();const grp=Object.entries(GFAM).map(([k,g])=>{const ids=g.ids.filter(id=>D[id]);ids.forEach(id=>used.add(id));return ids.length?`<optgroup label="${h(FAM[k]||k)}">${ids.map(id=>`<option value="${id}"${id===preId?" selected":""}>${h(D[id].n)}</option>`).join("")}</optgroup>`:"";}).join("");
  const rest=Object.keys(D).filter(id=>!used.has(id));
  openPop(`${head("Proposa una malaltia o forma nova","Contingut nou")}
   <label>Nom<input type="text" id="rvFNom" maxlength="120" placeholder="p. ex. Escleredema de Buschke"></label>
   <label>On creus que va?<select id="rvNLloc"><option value="">No ho sé: que es decideixi en la revisió</option>${grp}${rest.length?`<optgroup label="Altres">${rest.map(id=>`<option value="${id}">${h(D[id].n)}</option>`).join("")}</optgroup>`:""}</select></label>
   <p class="rv-who" id="rvNHint">Si no saps on encaixa, deixa-ho així: en preparar la versió següent es proposarà la fitxa més adequada (com a forma, com a malaltia d'una agrupació o com a nota) i ho decidirà la Mireia.</p>
   <label>Per què hi va o amb què es relaciona? <small>(opcional)</small><input type="text" id="rvNPq" maxlength="400" placeholder="p. ex. s'associa a la diabetis; es confon amb l'esclerodèrmia"></label>
   <fieldset class="rv-fs"><legend>Com la descriuries? <small>(omple el que sàpigues)</small></legend>${["Què","Qui","Clínica","Clau"].map((l,i)=>`<label>${l}<input type="text" class="rv-fc" data-i="${i}" maxlength="400"></label>`).join("")}</fieldset>
   <label>Esquema histològic <small>(opcional: què s'hi veuria al microscopi)</small><textarea id="rvFEsq" maxlength="600" rows="2" style="min-height:56px"></textarea></label>
   <label>Font <small>(opcional: article, guia, llibre o enllaç)</small><input type="text" id="rvFont" maxlength="600"></label>
   ${idFields()}
   <div class="rv-row"><button type="button" class="rv-btn pri" data-rvsend>Publica la proposta</button><button type="button" class="rv-btn" data-rvclose>Cancel·la</button></div>`,rect);
  const n=pop.querySelector("#rvFNom");if(n)n.focus({preventScroll:true});}
async function sendNova(){const ctx=draft.ctx;
  const nom=sp(pop.querySelector("#rvFNom").value),on=pop.querySelector("#rvNLloc").value,pq=sp(pop.querySelector("#rvNPq").value);
  const vals=[...pop.querySelectorAll(".rv-fc")].map(x=>sp(x.value));const esq=sp(pop.querySelector("#rvFEsq").value),font=sp(pop.querySelector("#rvFont").value);
  const err=readId();if(err)return showErr(err);
  if(!nom)return showErr("Escriu el nom.");
  if(!vals.some(Boolean)&&!pq)return showErr("Descriu-la almenys en un camp o explica amb què es relaciona.");
  const dup=Object.keys(D).find(id=>same(D[id].n,nom))||Object.keys(TYP).find(id=>(TYP[id].r||[]).some(r=>same(r[0],nom)));
  if(dup)return showErr(same(D[dup].n,nom)?`Ja té fitxa pròpia: «${D[dup].n}».`:`Ja és a la guia, dins de la fitxa «${D[dup].n}».`);
  const camps=ctx.labs.map((l,i)=>[l,vals[i]]).filter(x=>x[1]);
  const lloc=on?"f:"+on:"nova";
  const text=[`${on?formaLab(on):"Malaltia nova (sense lloc decidit)"}: ${nom}${on?"":" · on va: no ho sé"}`,...(pq?["Relació: "+pq]:[]),...camps.map(([l,v])=>`${l}: ${v}`),...(esq?["Esquema: "+esq]:[])].join("\n");
  setBusy(true);
  try{await api({accio:"proposa",ambit:"contingut",tipus:"afegir",lloc,ancora:{forma:{nom,despres:null,camps,esquema:esq,relacio:pq,suggerida:!!on},ap:on?"Tipus i formes":""},text,font});closePop();toast(on?"Proposta publicada a la fitxa «"+D[on].n+"».":"Proposta publicada. Es decidirà on va.");}
  catch(e){setBusy(false);showErr(e.message);}}
function helpPop(rect){cardId=null;draft=null;openPop(`${head("Com proposar un canvi","Mode corrector")}
  <ul class="rv-help">
   <li><b>Corregir, eliminar, preguntar o afegir al glossari</b> Selecciona el text i tria l'opció a la barra que apareix.</li>
   <li><b>Afegir text</b> Passa per sobre d'un paràgraf i toca el botó <span class="rv-k">+</span> de la cantonada.</li>
   <li><b>Malaltia nova sense saber on va</b> Botó <span class="rv-k">+ Malaltia nova</span> d'aquesta franja: tria «No ho sé» i explica amb què es relaciona.</li>
   <li><b>Forma o subtipus nou</b> A la fitxa, botó <span class="rv-k">+ Forma o subtipus nou</span> de la capçalera o del final de «Tipus i formes». També el <span class="rv-k">+ Forma nova</span> de cada forma, per posar-la just després.</li>
   <li><b>Imatges i esquemes</b> Clica el punt exacte de la foto o del dibuix.</li>
   <li><b>Organització</b> Botó «Proposa un canvi d'organització» de cada fitxa, subapartat o grup de l'atles (moure, fusionar, separar…).</li>
   <li><b>La web</b> «Proposta general» d'aquesta franja: funcionalitats, apartats nous, millores.</li>
   <li><b>Revisat</b> «Marca com a corregida» quan hagis repassat una fitxa o un subapartat.</li></ul>
  <div class="rv-row"><button type="button" class="rv-btn pri" data-rvclose>Entesos</button></div>`,rect);}

/* ---------- interfície: barra, finestra, franja, avisos ---------- */
const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const bar=mk("div","rv-bar rv-ui");bar.hidden=true;bar.setAttribute("role","toolbar");bar.setAttribute("aria-label","Proposa un canvi sobre el text seleccionat");
bar.innerHTML=[["corregir","Corregeix"],["eliminar","Elimina"],["afegir","Afegeix després"],["glossari","Al glossari"],["dubte","Dubte"]].map(([k,t])=>`<button type="button" data-rvsel="${k}">${t}</button>`).join("");
const pop=mk("div","rv-pop rv-ui");pop.hidden=true;pop.setAttribute("role","dialog");pop.setAttribute("aria-modal","false");
const plus=mk("button","rv-plus rv-ui","+");const hl=mk("div","rv-hl rv-ui");hl.hidden=true;plus.type="button";hidePlus();plus.title="Afegeix contingut aquí";plus.setAttribute("aria-label","Proposa afegir contingut després d'aquest bloc");
const band=mk("div","rv-band rv-ui");band.hidden=true;
const toastEl=mk("div","rv-toast rv-ui");toastEl.hidden=true;toastEl.setAttribute("role","status");
document.body.append(bar,pop,plus,hl,band,toastEl);
let toastT=null;function toast(t){toastEl.textContent=t;toastEl.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>toastEl.hidden=true,3600);}

let popAnchor=null,tmpPin=null,selData=null;
function placePop(rect){
  if(innerWidth<640||!rect){pop.classList.add("sheet");return;}
  pop.classList.remove("sheet");const W=pop.offsetWidth,H=pop.offsetHeight;
  let left=Math.min(Math.max(12,rect.left),innerWidth-W-12);let top=rect.bottom+10;
  if(top+H>innerHeight-70){top=rect.top-10-H;if(top<12)top=Math.max(12,innerHeight-H-70);}
  pop.style.left=left+"px";pop.style.top=top+"px";}
function openPop(html,rect){pop.innerHTML=html;pop.hidden=false;popAnchor=rect||null;placePop(rect);
  const f=pop.querySelector("textarea,input[type=text]:not([readonly]),select");if(f&&innerWidth>=640)f.focus({preventScroll:true});else{const x=pop.querySelector(".rv-x");if(x)x.focus({preventScroll:true});}}
function closePop(){pop.hidden=true;pop.innerHTML="";if(tmpPin){tmpPin.remove();tmpPin=null;}}
function head(title,lloc){return `<div class="rv-ph"><div><div class="rv-lloc">${h(lloc)}</div><b>${h(title)}</b></div><button type="button" class="rv-x" data-rvclose aria-label="Tanca">×</button></div>`;}
function idFields(){
  const noms=DATA?DATA.noms:[];const dl=`<datalist id="rvNoms">${noms.map(n=>`<option value="${h(n)}">`).join("")}</datalist>`;
  if(ME.nom&&ME.codi)return `<p class="rv-who">Proposes com a <b>${h(ME.nom)}</b> · <button type="button" class="rv-link" data-rvwho>canvia</button></p>`;
  return `<label>El teu nom<input type="text" id="rvNom" list="rvNoms" maxlength="60" autocomplete="name" value="${h(ME.nom)}" placeholder="Com vols que surti el teu nom"></label>${dl}<label>Codi del grup<input type="password" id="rvCodi" maxlength="80" value="${h(ME.codi)}" autocomplete="off" placeholder="El que us ha passat la Mireia"></label>`;}
function readId(){const n=pop.querySelector("#rvNom"),c=pop.querySelector("#rvCodi");
  if(n){const v=sp(n.value);if(!v)return "Escriu el teu nom.";ME.nom=v;LSS("mp-rv-nom",v);}
  if(c){const v=c.value.trim();if(!v)return "Escriu el codi del grup.";if(v!==ME.codi){ME.codi=v;LSS("mp-rv-codi",v);}}
  if(!ME.nom||!ME.codi)return "Falten el nom o el codi del grup.";return "";}
function setBusy(b){pop.querySelectorAll("button,textarea,input,select").forEach(x=>{if(!x.matches(".rv-x"))x.disabled=b;});}
function showErr(t){let e=pop.querySelector(".rv-err");if(!e){e=mk("p","rv-err");const r=pop.querySelector(".rv-row:last-child");pop.insertBefore(e,r||null);}e.textContent=t;}

/* formulari de proposta */
const FORM={
  corregir:{t:"Corregeix el text",q:"Text actual",f:"Text corregit",req:1,pref:1},
  eliminar:{t:"Proposa eliminar-ho",q:"Text que s'eliminaria",f:"Per què? (opcional)",req:0},
  afegir:{t:"Proposa afegir contingut",q:"Després de",f:"Què hi falta?",req:1},
  assenyalar:{t:"Assenyala un punt de la imatge",q:"",f:"Què no és correcte en aquest punt?",req:1},
  dubte:{t:"Planteja un dubte",q:"Sobre",f:"La teva pregunta",req:1,nofont:1},
  terme_nou:{t:"Proposa un terme per al glossari",q:"",f:"Definició proposada (opcional)",req:0,term:1},
  definicio:{t:"Proposa un canvi a la definició",q:"Definició actual",f:"Definició proposada",req:1},
  org:{t:"Proposa un canvi d'organització",q:"",f:"Què proposes i per què?",req:1,sel:TORG},
  web:{t:"Proposa una millora de la web",q:"",f:"Què proposes i per què?",req:1,sel:TWEB}};
let draft=null;
function openForm(kind,ctx,rect){const F=FORM[kind];draft={kind,ctx};
  const A=ctx.ancora||{};const quote=F.q&&A.t?`<p class="rv-q"><small>${h(F.q)}</small>${h(kind==="afegir"?"…"+A.t.slice(-90):A.t)}</p>`:(F.q&&ctx.quote?`<p class="rv-q"><small>${h(F.q)}</small>${h(ctx.quote)}</p>`:"");
  const sel=F.sel?`<label>Tipus<select id="rvTip">${F.sel.map(k=>`<option value="${k}">${h(TIP[k])}</option>`).join("")}</select></label>`:"";
  const term=F.term?`<label>Terme<input type="text" id="rvTerm" maxlength="80" value="${h(A.t||"")}"></label>`:"";
  openPop(`${head(F.t,llocLabel(ctx.lloc)+(A.ap&&!ctx.lloc.startsWith("s:")?" › "+A.ap:""))}${quote}${sel}${term}
   <label>${h(F.f)}<textarea id="rvTxt" maxlength="4000">${F.pref?h(A.t||""):""}</textarea></label>
   ${F.nofont?"":`<label>Font <small>(opcional: article, guia, llibre o enllaç)</small><input type="text" id="rvFont" maxlength="600"></label>`}
   ${idFields()}
   <div class="rv-row"><button type="button" class="rv-btn pri" data-rvsend>Publica la proposta</button><button type="button" class="rv-btn" data-rvclose>Cancel·la</button></div>`,rect);}
async function sendForm(){if(!draft)return;if(draft.kind==="forma")return sendForma();if(draft.kind==="nova")return sendNova();const F=FORM[draft.kind],ctx=draft.ctx;
  const txt=(pop.querySelector("#rvTxt")||{}).value||"";const font=((pop.querySelector("#rvFont")||{}).value||"").trim();
  const err=readId();if(err)return showErr(err);
  let tipus=draft.kind,ambit="contingut";const A=Object.assign({},ctx.ancora||{});
  if(F.sel){tipus=pop.querySelector("#rvTip").value;ambit=draft.kind==="org"?"organitzacio":"web";}
  if(draft.kind==="terme_nou"||draft.kind==="definicio")ambit="glossari";
  if(F.term){const t=sp(pop.querySelector("#rvTerm").value);if(!t)return showErr("Escriu el terme.");A.terme=t;}
  if(F.req&&!txt.trim())return showErr("Escriu la proposta.");
  if(draft.kind==="corregir"&&sp(txt)===sp(A.t))return showErr("El text corregit és igual que l'original.");
  setBusy(true);
  try{await api({accio:"proposa",ambit,tipus,lloc:ctx.lloc,ancora:A,text:txt.trim(),font});closePop();toast("Proposta publicada.");try{getSelection().removeAllRanges();}catch(e){}hideBar();}
  catch(e){setBusy(false);showErr(e.message);}}

/* targeta d'una proposta */
function cardHTML(p){const A=anc(p),c=recompte(p.id),vs=votsDe(p.id),rs=respDe(p.id),e=estat(p),C=CANV[p.id],mine=isMine(p);
  const myV=ME.nom?(vs.find(v=>same(v.autor,ME.nom))||{}).vot:"";
  let body="";
  if(A.t&&p.tipus!=="assenyalar")body+=`<p class="rv-q"><small>${p.tipus==="afegir"?"Després de":p.tipus==="dubte"?"Sobre":p.tipus==="terme_nou"?"Al text":"Text actual"}</small>${h(p.tipus==="afegir"?"…"+A.t.slice(-90):A.t)}</p>`;
  if(A.terme)body+=`<p class="rv-q new"><small>Terme</small>${h(A.terme)}</p>`;
  if(A.forma){const F=A.forma;body+=`<div class="rv-q new rv-fm"><small>${p.lloc==="nova"?"On va: no ho sap":F.suggerida?"Fitxa suggerida: "+h(llocLabel(p.lloc)):F.despres?"Després de «"+h(F.despres)+"»":"Al final de la taula"}</small><b>${h(F.nom)}</b><dl>${F.relacio?`<dt>Relació</dt><dd>${h(F.relacio)}</dd>`:""}${(F.camps||[]).map(([l,v])=>`<dt>${h(l)}</dt><dd>${h(v)}</dd>`).join("")}${F.esquema?`<dt>Esquema</dt><dd>${h(F.esquema)}</dd>`:""}</dl></div>`;}
  else if(p.text)body+=`<p class="rv-q new"><small>${p.tipus==="corregir"?"Proposta":p.tipus==="dubte"?"Pregunta":p.tipus==="eliminar"?"Motiu":"Proposta"}</small>${h(p.text)}</p>`;
  if(p.font)body+=`<p class="rv-who">Font: ${/^https?:\/\//.test(p.font)?`<a href="${h(p.font)}" target="_blank" rel="noopener">${h(p.font)}</a>`:h(p.font)}</p>`;
  if(orphan.has(p.id)&&!C)body+=`<p class="rv-who">No he trobat aquest fragment a la versió actual de la guia.</p>`;
  if(C)body+=`<div class="rv-res${e==="rebutjada"?" no":""}"><b>${h(RES[C.e]||C.e)}</b> · ${h(dia(C.v))}${C.n?`<br>${h(C.n)}`:""}</div>`;
  let votes="";
  if(p.tipus==="dubte"){votes=`<div class="rv-row">${mine?"":`<button type="button" class="rv-btn${myV==="jotambe"?" on":""}" data-rvvote="jotambe">Jo també</button>`}<span class="rv-who">${c.jotambe} ${c.jotambe===1?"persona té":"persones tenen"} el mateix dubte</span></div>`;}
  else{votes=`<div class="rv-row">${Object.keys(VOT).map(k=>mine?`<span class="rv-chip">${h(VOT[k])} ${c[k]}</span>`:`<button type="button" class="rv-btn${myV===k?" on":""}" data-rvvote="${k}" aria-pressed="${myV===k}">${h(VOT[k])} · ${c[k]}</button>`).join("")}</div>${mine?`<p class="rv-who">És la teva proposta: no la pots votar.</p>`:""}
    <div id="rvMotiu" hidden><label>Motiu del vot en contra<input type="text" id="rvMot" maxlength="600"></label><div class="rv-row" style="margin-top:6px"><button type="button" class="rv-btn pri" data-rvvotec>Desa el vot</button></div></div>`;}
  const vm=vs.filter(v=>v.motiu&&v.vot!=="jotambe");
  const vlist=vm.length?`<ul class="rv-vlist">${vm.map(v=>`<li><b>${h(v.autor)}</b> · ${h(VOT[v.vot]||v.vot)}: ${h(v.motiu)}</li>`).join("")}</ul>`:"";
  const rlist=rs.length?`<ul class="rv-rlist">${rs.map(r=>`<li><b>${h(r.autor)}</b> · ${h(dia(r.data))}<br>${h(String(r.text).replace(/^\[REOBERTA\]\s*/,"No hi està d'acord: "))}</li>`).join("")}</ul>`:"";
  let acts="";
  if(mine&&C)acts+=`<div class="rv-row"><button type="button" class="rv-btn pri" data-rvok>Valido la resolució</button><button type="button" class="rv-btn" data-rvreob>No hi estic d'acord</button></div><div id="rvReob" hidden><label>Explica per què<input type="text" id="rvReobT" maxlength="1500"></label><div class="rv-row" style="margin-top:6px"><button type="button" class="rv-btn pri" data-rvreobs>Reobre la proposta</button></div></div>`;
  if(mine&&!C)acts+=`<div class="rv-row"><button type="button" class="rv-btn" data-rvret>Retira la proposta</button></div>`;
  if(ME.admin)acts+=`<div class="rv-row"><button type="button" class="rv-btn" data-rvadm>Tanca-la (administració)</button></div>`;
  const go=cardGo&&p.lloc!=="nova"?`<button type="button" class="rv-link" data-rvgo="${h(p.id)}">Ves al lloc</button>`:"";
  return `${head(tipOf(p),llocLabel(p.lloc)+(A.ap&&!p.lloc.startsWith("s:")?" › "+A.ap:""))}
   <div class="rv-row">${chip(p)}<span class="rv-who">${h(p.autor)} · ${h(dia(p.data))}</span>${go}</div>
   ${body}<div class="rv-sep"></div><div class="rv-votes">${votes}${vlist}</div>
   ${rlist}<div class="rv-row"><input type="text" id="rvResp" maxlength="2000" placeholder="${p.tipus==="dubte"?"Respon el dubte":"Afegeix un comentari"}" style="flex:1 1 200px"><button type="button" class="rv-btn" data-rvresp>Envia</button></div>
   ${acts}${(!ME.nom||!ME.codi)?idFields():""}`;}
let cardId=null,cardGo=false;
function openCard(id,rect,go){const p=PR().find(x=>x.id===id);if(!p)return;cardId=id;cardGo=!!go;draft=null;openPop(cardHTML(p),rect);}
function refreshCard(){if(pop.hidden||!cardId)return;const p=PR().find(x=>x.id===cardId);if(!p){closePop();cardId=null;return;}const keep=popAnchor;const r=pop.querySelector("#rvResp");const v=r?r.value:"";pop.innerHTML=cardHTML(p);const r2=pop.querySelector("#rvResp");if(r2)r2.value=v;placePop(keep);}
async function act(body,okMsg){const err=pop.querySelector("#rvNom")?readId():"";if(err)return showErr(err);if(!ME.nom||!ME.codi)return showErr("Cal el teu nom i el codi del grup.");setBusy(true);
  try{await api(body);if(okMsg)toast(okMsg);refreshCard();}catch(e){setBusy(false);showErr(e.message);}}
function listPop(lloc,rect){const ps=PR().filter(p=>p.lloc===lloc);cardId=null;draft=null;
  openPop(`${head(ps.length+" "+(ps.length===1?"proposta":"propostes"),llocLabel(lloc))}<div class="rv-items">${ps.map(itemHTML).join("")}</div>`,rect);}

/* identitat */
function whoPop(rect){cardId=null;draft=null;openPop(`${head("Qui ets",ME.codi?"Revisió en grup":"Accés a les propostes")}<p class="rv-who">El nom apareix a les teves propostes, vots i marques de «Corregida». El codi del grup el comparteix la Mireia.</p>
  <label>El teu nom<input type="text" id="rvNom" list="rvNoms" maxlength="60" value="${h(ME.nom)}"></label><datalist id="rvNoms">${(DATA?DATA.noms:[]).map(n=>`<option value="${h(n)}">`).join("")}</datalist>
  <label>Codi del grup<input type="password" id="rvCodi" maxlength="80" value="${h(ME.codi)}" autocomplete="off"></label>
  <div class="rv-row"><button type="button" class="rv-btn pri" data-rvwhos>Desa</button><button type="button" class="rv-btn" data-rvclose>Cancel·la</button></div>`,rect);}

/* franja del mode corrector */
function renderBand(){band.hidden=!MODE;if(!MODE)return;
  band.innerHTML=`<b>Mode corrector</b><span>Selecciona text, fes servir els botons + o clica una imatge.</span><button type="button" data-rvhelp>Com proposar?</button>${netErr?`<span>· ${h(netErr)}</span>`:""}<span class="sp"></span>
  ${ME.nom?`<span>Ets <b>${h(ME.nom)}</b></span>`:""}<button type="button" data-rvwho>${ME.nom&&ME.codi?"Canvia el nom":"Identifica't"}</button><button type="button" data-rvnova>+ Malaltia nova</button><button type="button" data-rvweb>Proposta general</button><button type="button" data-rvmode>Surt <kbd>Ctrl+K</kbd></button>`;}
function setMode(on){MODE=!!on;document.body.classList.toggle("rv-mode",MODE);if(!MODE){hidePlus();}
  document.querySelectorAll("[data-rvmode].rv-tg,.rv-dt").forEach(b=>b.setAttribute("aria-pressed",MODE?"true":"false"));
  renderBand();applyMarks();if(MODE&&(!ME.codi||!ME.nom))whoPop(null);}

/* ---------- selecció de text ---------- */
function hideBar(){bar.hidden=true;selData=null;}
function checkSel(){const sel=getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount){hideBar();return;}
  const r=sel.getRangeAt(0);if(pop.contains(r.startContainer)||bar.contains(r.startContainer)){return;}
  const c1=ctxOf(r.startContainer),c2=ctxOf(r.endContainer);if(!c1||!c2||c1.root!==c2.root){hideBar();return;}
  const ix=index(c1.root);let a=nIdx(ix,r.startContainer,r.startOffset,false),b=nIdx(ix,r.endContainer,r.endOffset,true);
  if(a==null||b==null){hideBar();return;}while(a<b&&ix.s[a]===" ")a++;while(b>a&&ix.s[b-1]===" ")b--;
  if(b-a<1||b-a>800){hideBar();return;}
  const el=r.startContainer.nodeType===1?r.startContainer:r.startContainer.parentElement;
  selData={ctx:c1,lloc:llocOf(c1,el),ancora:{t:ix.s.slice(a,b),pre:ix.s.slice(Math.max(0,a-40),a),suf:ix.s.slice(b,b+40),ap:apOf(el)},range:r.cloneRange()};
  bar.hidden=false;placeBar();}
function placeBar(){if(bar.hidden||!selData)return;const rc=selData.range.getBoundingClientRect();if(!rc||(!rc.width&&!rc.height)){hideBar();return;}
  const W=bar.offsetWidth,H=bar.offsetHeight;let top=rc.bottom+8;if(top+H>innerHeight-(MODE?64:8))top=rc.top-8-H;
  bar.style.left=Math.min(Math.max(8,rc.left+rc.width/2-W/2),innerWidth-W-8)+"px";bar.style.top=Math.max(8,top)+"px";}
let selT=null;
document.addEventListener("selectionchange",()=>{clearTimeout(selT);selT=setTimeout(()=>{const s=getSelection();if(!s||s.isCollapsed){if(Date.now()-barDown>900)hideBar();}else checkSel();},280);});
document.addEventListener("mouseup",e=>{if(e.target.closest&&e.target.closest(".rv-ui"))return;setTimeout(checkSel,0);});
bar.addEventListener("mousedown",e=>e.preventDefault());
let barDown=0;bar.addEventListener("pointerdown",()=>{barDown=Date.now();});
bar.addEventListener("click",e=>{const b=e.target.closest("[data-rvsel]");if(!b||!selData)return;const k=b.dataset.rvsel,rect=selData.range.getBoundingClientRect();const d=selData;hideBar();
  if(k==="glossari"){openForm("terme_nou",{lloc:d.lloc,ancora:d.ancora},rect);return;}
  openForm(k,{lloc:d.lloc,ancora:Object.assign({},d.ancora,k==="afegir"?{after:true}:{})},rect);});
addEventListener("scroll",()=>{placeBar();if(!plus.hidden&&plusTarget){const r=plusTarget.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight){hidePlus();plusTarget=null;}else showPlus(plusTarget);}},{capture:true,passive:true});
addEventListener("resize",()=>{placeBar();if(!pop.hidden)placePop(popAnchor);});

/* ---------- botó + (mode corrector) ---------- */
const BLOCK="p,li,dd,.ty,h3,h4,td,.step,.ltile,.hterm,.pcard";
let plusTarget=null;
function hidePlus(){plus.hidden=true;hl.hidden=true;}
function showPlus(el){const c=ctxOf(el);if(!c){hidePlus();return;}const r=el.getBoundingClientRect();if(!r.width){hidePlus();return;}
  const fm=!!(c.f&&el.matches(".ty"));plusTarget=el;plus.classList.toggle("wide",fm);plus.textContent=fm?"+ Forma nova":"+";
  plus.title=fm?"Proposa una forma nova just després d'aquesta":"Proposa afegir text just després d'aquest bloc";plus.setAttribute("aria-label",plus.title);
  plus.hidden=false;const W=plus.offsetWidth;plus.style.left=Math.max(4,Math.min(r.right-W+(fm?-12:10),innerWidth-W-6))+"px";plus.style.top=Math.max(4,fm?Math.min(r.bottom-12,innerHeight-(MODE?84:30)):r.top-12)+"px";
  hl.hidden=false;hl.style.left=(r.left-3)+"px";hl.style.top=(r.top-3)+"px";hl.style.width=(r.width+6)+"px";hl.style.height=(r.height+6)+"px";}
document.addEventListener("pointermove",e=>{if(!MODE||e.pointerType!=="mouse")return;if(e.target.closest&&e.target.closest(".rv-ui"))return;const b=e.target.closest&&e.target.closest(BLOCK);if(b&&(b!==plusTarget||plus.hidden))showPlus(b);else if(!b&&!plus.matches(":hover")){hidePlus();plusTarget=null;}},{passive:true});
document.addEventListener("pointerdown",e=>{if(!MODE||e.pointerType==="mouse")return;if(e.target.closest&&e.target.closest(".rv-ui,button,a,input,summary"))return;const b=e.target.closest&&e.target.closest(BLOCK);if(b)showPlus(b);},{passive:true});
plus.addEventListener("click",()=>{const el=plusTarget;hidePlus();if(!el)return;const c=ctxOf(el);if(!c)return;
  if(c.f&&el.matches(".ty")){const i=[...el.parentElement.querySelectorAll(":scope>.ty")].indexOf(el);openForma(c.f,i>=0?i:null,el.getBoundingClientRect());return;}
  const ix=index(c.root);
  const tn=[];const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return(!p||p.closest(SKIPTXT))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});let n;while((n=w.nextNode()))tn.push(n);
  if(!tn.length)return;const a0=ix.pos.get(tn[0])[0];let e=ix.pos.get(tn[tn.length-1])[tn[tn.length-1].nodeValue.length];while(e>a0&&ix.s[e-1]===" ")e--;
  const s=Math.max(a0,e-60);openForm("afegir",{lloc:llocOf(c,el),ancora:{t:ix.s.slice(s,e),pre:ix.s.slice(Math.max(0,s-40),s),suf:ix.s.slice(e,e+40),ap:apOf(el),after:true}},el.getBoundingClientRect());});

/* ---------- clics ---------- */
addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(MODE&&!t.closest(".rv-ui")){const im=imgTarget(t);const c=im&&ctxOf(im);
    if(im&&c){e.preventDefault();e.stopPropagation();const r=im.getBoundingClientRect();const x=Math.round(Math.min(100,Math.max(0,(e.clientX-r.left)/r.width*100))*10)/10,y=Math.round(Math.min(100,Math.max(0,(e.clientY-r.top)/r.height*100))*10)/10;
      if(tmpPin)tmpPin.remove();applying=true;mo.disconnect();tmpPin=mkPin("rv-tmp",x,y,null,im);applying=false;mo.observe(document.body,{childList:true,subtree:true});
      openForm("assenyalar",{lloc:llocOf(c,im),ancora:Object.assign(imgKey(im,c),{x,y,ap:apOf(im)})},{left:e.clientX-20,right:e.clientX,top:e.clientY-10,bottom:e.clientY+14});return;}}
  const m=t.closest("[data-rvp]");if(m&&!t.closest(".rv-pop")){e.preventDefault();e.stopPropagation();openCard(m.dataset.rvp,m.getBoundingClientRect());return;}
},true);
document.addEventListener("keydown",e=>{const m=e.target&&e.target.closest&&e.target.closest(".rv-pin,.rv-ins");if(m&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openCard(m.dataset.rvp,m.getBoundingClientRect());}});
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if((b=t.closest("[data-rvclose]"))){closePop();cardId=null;return;}
  if((b=t.closest("[data-rvsend]"))){sendForm();return;}
  if((b=t.closest("[data-rvmode]"))){setMode(!MODE);return;}
  if((b=t.closest("[data-rvwho]"))){whoPop(b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvwhos]"))){const err=readId();if(err)return showErr(err);closePop();toast("Desat.");load(false);renderBand();return;}
  if((b=t.closest("[data-rvforma]"))){openForma(b.dataset.rvforma,null,b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvnova]"))){openNova(b.getBoundingClientRect(),null);return;}
  if((b=t.closest("[data-rvhelp]"))){helpPop(b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvweb]"))){openForm("web",{lloc:"web"},b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvorg]"))){openForm("org",{lloc:b.dataset.rvorg},b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvdef]"))){const k=b.dataset.rvdef;const g=GLOS.find(x=>sp(x.t)===k);openForm("definicio",{lloc:"glos:"+k,quote:g?g.d:""},b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvlist]"))){listPop(b.dataset.rvlist,b.getBoundingClientRect());return;}
  if((b=t.closest("[data-rvitem]"))){openCard(b.dataset.rvitem,b.getBoundingClientRect(),!pop.contains(b));return;}
  if((b=t.closest("[data-rvgo]"))){goTo(b.dataset.rvgo);return;}
  if((b=t.closest("[data-rvcor]"))){if(!ME.nom||!ME.codi){whoPop(b.getBoundingClientRect());return;}const on=b.dataset.on==="1";b.disabled=true;
    api({accio:"corregida",lloc:b.dataset.rvcor,empremta:b.dataset.emp,marca:on}).then(()=>toast(on?"Marcada com a corregida.":"Marca retirada.")).catch(er=>{b.disabled=false;toast(er.message);});return;}
  if(!cardId)return;
  if((b=t.closest("[data-rvvote]"))){const k=b.dataset.rvvote;const p=PR().find(x=>x.id===cardId);const cur0=ME.nom?(votsDe(cardId).find(v=>same(v.autor,ME.nom))||{}).vot:"";
    if(k===cur0){act({accio:"vota",proposta:cardId,vot:""},"Vot retirat.");return;}
    if(k==="contra"){const m=pop.querySelector("#rvMotiu");m.hidden=false;pop.querySelector("#rvMot").focus();return;}
    act({accio:"vota",proposta:cardId,vot:k},"Vot desat.");return;}
  if((b=t.closest("[data-rvvotec]"))){const mt=pop.querySelector("#rvMot").value.trim();if(!mt)return showErr("Escriu breument el motiu.");act({accio:"vota",proposta:cardId,vot:"contra",motiu:mt},"Vot desat.");return;}
  if((b=t.closest("[data-rvresp]"))){const v=pop.querySelector("#rvResp").value.trim();if(!v)return;act({accio:"respon",proposta:cardId,text:v},"Comentari publicat.");return;}
  if((b=t.closest("[data-rvok]"))){act({accio:"estat",proposta:cardId,estat:"arxivada"},"Validada. La proposta s'ha arxivat.");return;}
  if((b=t.closest("[data-rvreob]"))){pop.querySelector("#rvReob").hidden=false;pop.querySelector("#rvReobT").focus();return;}
  if((b=t.closest("[data-rvreobs]"))){const v=pop.querySelector("#rvReobT").value.trim();if(!v)return showErr("Explica breument per què.");act({accio:"respon",proposta:cardId,text:"[REOBERTA] "+v},"Proposta reoberta.");return;}
  if((b=t.closest("[data-rvret]"))){act({accio:"estat",proposta:cardId,estat:"retirada"},"Proposta retirada.");return;}
  if((b=t.closest("[data-rvadm]"))){act({accio:"estat",proposta:cardId,estat:"arxivada",admin:ME.admin},"Proposta tancada.");return;}
});
document.addEventListener("mousedown",e=>{if(pop.hidden)return;const t=e.target;if(pop.contains(t)||bar.contains(t)||(t.closest&&t.closest("[data-rvp],[data-rvitem],[data-rvlist],[data-rvorg],[data-rvwho],[data-rvweb],[data-rvdef],[data-rvforma],[data-rvhelp],[data-rvnova],.rv-plus")))return;
  if(draft&&[...pop.querySelectorAll("textarea,input[type=text]:not(#rvNom):not(#rvFont)")].some(x=>x.value.trim()&&x.value!==((draft.ctx.ancora||{}).t||"")))return;closePop();cardId=null;});
addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&(e.key==="k"||e.key==="K")){e.preventDefault();e.stopPropagation();setMode(!MODE);return;}
  if(e.key==="Escape"&&!pop.hidden){e.preventDefault();e.stopImmediatePropagation();closePop();cardId=null;return;}
  if(e.key==="Escape"&&!bar.hidden){hideBar();}
},true);
function goTo(id){const p=PR().find(x=>x.id===id);if(!p)return;closePop();cardId=null;
  const find=()=>document.querySelector(`[data-rvp="${id}"]`);
  if(p.lloc.startsWith("f:")){openD(p.lloc.slice(2));setTimeout(()=>{applyMarks([drawer]);const m=find();if(m){const pics=m.closest("details");if(pics&&!pics.open)pics.open=true;m.scrollIntoView({block:"center",behavior:"smooth"});}},250);return;}
  if(p.lloc.startsWith("s:")){closeD&&!drawer.hidden&&closeD();const m=find();const [s]=p.lloc.slice(2).split("|");(m||document.getElementById(s)).scrollIntoView({block:m?"center":"start",behavior:"smooth"});return;}
  if(p.lloc.startsWith("g:")){const g=document.getElementById("g-"+p.lloc.slice(2))||document.getElementById("f-"+p.lloc.slice(2));(g||$1("#atles")).scrollIntoView({behavior:"smooth"});return;}
  if(p.lloc.startsWith("glos:")){toast("Proposta sobre el glossari: "+p.lloc.slice(5));return;}
  $1("#propostes").scrollIntoView({behavior:"smooth"});}

/* ---------- navegació ---------- */
const nav=$1("nav.top"),nw=nav&&nav.querySelector(".wrap");
if(nw){nav.classList.add("rv");const a=mk("a","",`<b>9</b>Propostes <i class="rv-n"></i>`);a.href="#propostes";a.title="Propostes del grup";nw.appendChild(a);
  const tg=mk("button","rv-tg rv-ui",`✎<span>Corrector</span>`);tg.type="button";tg.dataset.rvmode="1";tg.title="Mode corrector (Ctrl+K)";tg.setAttribute("aria-pressed","false");nw.appendChild(tg);}

(function spy(){const a=document.querySelector('nav.top a[href="#propostes"]');if(!a)return;let t=null;
  const fix=()=>{const se=document.getElementById("propostes");if(!se)return;const on=se.offsetTop<=scrollY+120;if(on){document.querySelectorAll("nav.top a.on").forEach(x=>x.classList.remove("on"));a.classList.add("on");}else a.classList.remove("on");};
  addEventListener("scroll",()=>{if(t)return;t=requestAnimationFrame(()=>requestAnimationFrame(()=>{t=null;fix();}));},{passive:true});})();
/* ---------- apartat Propostes ---------- */
const sec=mk("section","rv-sec");sec.id="propostes";
sec.innerHTML=`<div class="sec-head"><div class="eyebrow">9 · Revisió en grup</div><h2>Propostes del grup</h2>
  <p class="prose muted" style="font-size:15px">Correccions, addicions, dubtes i idees per millorar la guia. Cada proposta es vota i, segons la valoració del grup, s'incorpora a la versió següent. Qui la va fer valida el resultat i aleshores la proposta s'arxiva.</p></div>
  <div class="rv-panel" id="rvAcc"></div>
  <div id="rvMain" hidden>
   <div class="rv-tools"><select id="rvFA" aria-label="Àmbit"><option value="">Tots els àmbits</option>${Object.keys(AMB).map(k=>`<option value="${k}">${h(AMB[k])}</option>`).join("")}</select>
    <select id="rvFE" aria-label="Estat"><option value="">Tots els estats</option><option value="vot">Pendents de votar per mi</option><option value="oberta">Obertes</option><option value="fet">Resoltes, pendents de validar</option><option value="reoberta">Reobertes</option></select>
    <input type="text" id="rvFQ" placeholder="Cerca per text, fitxa o nom" aria-label="Cerca"><label class="ck"><input type="checkbox" id="rvFM"> Només les meves</label></div>
   <div class="rv-sum" id="rvSum" style="margin-top:12px"></div>
   <div class="rv-groups" id="rvList" style="margin-top:14px"></div>
   <div class="rv-panel rv-exp" style="margin-top:22px"><h3 style="font-size:1.1rem">Arxiu per a Claude</h3>
    <p style="font-size:14.5px;max-width:75ch">Recull totes les propostes obertes amb els vots i els comentaris, ordenades segons la valoració del grup. Descarrega'l o copia'l i passa'l a Claude per preparar la versió següent de la guia.</p>
    <div class="rv-row"><button type="button" class="rv-btn pri" id="rvGen">Genera l'arxiu</button><button type="button" class="rv-btn" id="rvCopy" hidden>Copia el text</button><a class="rv-btn" id="rvDl" hidden>Descarrega (.md)</a></div>
    <textarea id="rvOut" readonly hidden aria-label="Text de l'arxiu"></textarea></div>
   <details class="rv-adm" style="margin-top:18px"><summary>Administració</summary><div class="rv-panel"><p style="font-size:14px">Amb el codi d'administració pots tancar qualsevol proposta. Només el necessita la Mireia.</p><div class="rv-row"><input type="password" id="rvAdm" style="max-width:260px" autocomplete="off" aria-label="Codi d'administració"><button type="button" class="rv-btn" id="rvAdmS">Desa</button></div></div></details>
  </div>`;
const foot=$1("footer");if(foot)foot.parentNode.insertBefore(sec,foot);else document.body.appendChild(sec);
function renderAcc(){const acc=$1("#rvAcc");const ok=!!(ME.codi&&DATA);$1("#rvMain").hidden=!ok;
  if(ok){acc.innerHTML=`<div class="rv-row" style="justify-content:space-between"><span style="font-size:14.5px">Ets <b>${h(ME.nom||"—")}</b>. Activa el mode corrector amb <b>Ctrl+K</b> (Cmd+K al Mac) o el botó ✎ de la barra superior.</span><span class="rv-row"><button type="button" class="rv-btn" data-rvwho>Canvia el nom</button><button type="button" class="rv-btn" data-rvnova>+ Malaltia nova</button><button type="button" class="rv-btn" data-rvweb>Proposta general</button><button type="button" class="rv-btn" id="rvRef">Actualitza</button></span></div>${netErr?`<p class="rv-err">${h(netErr)}</p>`:""}`;return;}
  acc.innerHTML=`<p style="font-size:15px">Per veure les propostes i fer-ne, escriu el teu nom i el codi del grup. Només cal fer-ho una vegada en aquest navegador.</p>
   <ol class="rv-steps"><li>Selecciona qualsevol text de la guia i tria què vols proposar a la barra que apareix.</li><li>Amb el mode corrector (<b>Ctrl+K</b>) també pots afegir contingut al final d'un bloc, assenyalar punts de les imatges i marcar fitxes com a corregides.</li><li>Vota les propostes dels altres: d'acord, en contra o innecessària.</li></ol>
   <div class="rv-row"><input type="text" id="rvANom" placeholder="El teu nom" maxlength="60" style="max-width:240px" value="${h(ME.nom)}" aria-label="El teu nom"><input type="password" id="rvACodi" placeholder="Codi del grup" maxlength="80" style="max-width:220px" autocomplete="off" aria-label="Codi del grup"><button type="button" class="rv-btn pri" id="rvAOk">Entra</button></div>${netErr?`<p class="rv-err">${h(netErr)}</p>`:""}`;}
sec.addEventListener("click",async e=>{const t=e.target;
  if(t.closest("#rvAOk")){const n=sp($1("#rvANom").value),c=$1("#rvACodi").value.trim();if(!n||!c){netErr="Escriu el nom i el codi del grup.";renderAcc();return;}ME.nom=n;ME.codi=c;LSS("mp-rv-nom",n);LSS("mp-rv-codi",c);t.disabled=true;await load(false);renderAcc();return;}
  if(t.closest("#rvRef")){t.disabled=true;await load(false);t.disabled=false;return;}
  if(t.closest("#rvAdmS")){ME.admin=$1("#rvAdm").value.trim();LSS("mp-rv-admin",ME.admin);toast(ME.admin?"Codi d'administració desat en aquest navegador.":"Codi d'administració esborrat.");return;}
  if(t.closest("#rvGen")){genExport();return;}
  if(t.closest("#rvCopy")){const o=$1("#rvOut");try{await navigator.clipboard.writeText(o.value);toast("Text copiat.");}catch(er){o.focus();o.select();toast("Selecciona el text i copia'l.");}return;}});
sec.addEventListener("input",e=>{if(e.target.matches("#rvFQ"))renderList();});
sec.addEventListener("change",e=>{if(e.target.matches("#rvFA,#rvFE,#rvFM"))renderList();});
sec.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches("#rvANom,#rvACodi"))$1("#rvAOk").click();});
function itemHTML(p){const c=recompte(p.id),A=anc(p);const ex=A.forma?A.forma.nom:p.tipus==="corregir"?`«${A.t||""}» → «${p.text}»`:(A.terme?A.terme+(p.text?": "+p.text:""):p.text||A.t||"");
  return `<button type="button" class="rv-item" data-rvitem="${h(p.id)}"><span class="t">${chip(p)}<b>${h(tipOf(p))}</b><span class="muted">${h(llocLabel(p.lloc))}</span></span>
   <span class="v">${p.tipus==="dubte"?`Jo també ${c.jotambe}`:`✓ ${c.acord} · ✗ ${c.contra} · – ${c.innecessaria}`}</span><span class="x">${h(ex)}</span><span class="m">${h(p.autor)} · ${h(dia(p.data))}${orphan.has(p.id)&&!CANV[p.id]?" · fragment no trobat a la guia actual":""}</span></button>`;}
function renderList(){if(!DATA)return;const fa=$1("#rvFA").value,fe=$1("#rvFE").value,fq=sp($1("#rvFQ").value).toLowerCase(),fm=$1("#rvFM").checked;
  let ps=PR().slice();
  if(fa)ps=ps.filter(p=>p.ambit===fa);
  if(fm)ps=ps.filter(isMine);
  if(fe==="vot")ps=ps.filter(p=>!isMine(p)&&!CANV[p.id]&&!votsDe(p.id).some(v=>same(v.autor,ME.nom)));
  else if(fe==="oberta")ps=ps.filter(p=>estat(p)==="oberta");else if(fe==="reoberta")ps=ps.filter(p=>estat(p)==="reoberta");else if(fe==="fet")ps=ps.filter(p=>CANV[p.id]&&estat(p)!=="reoberta");
  if(fq)ps=ps.filter(p=>(p.text+" "+anc(p).t+" "+llocLabel(p.lloc)+" "+p.autor+" "+(anc(p).terme||"")).toLowerCase().includes(fq));
  const G=[["Pendents de valoració",p=>estat(p)==="oberta"],["Reobertes",p=>estat(p)==="reoberta"],["Resoltes: falta que qui les va proposar les validi",p=>CANV[p.id]&&estat(p)!=="reoberta"]];
  const all=PR();$1("#rvSum").innerHTML=`<span>${all.length} propostes actives</span><span>${all.filter(p=>!CANV[p.id]).length} pendents</span><span>${all.filter(p=>CANV[p.id]&&estat(p)!=="reoberta").length} per validar</span><span>${DATA.noms.length} participants</span>`;
  $1("#rvList").innerHTML=G.map(([t,f])=>{const it=ps.filter(f).sort((a,b)=>String(b.data).localeCompare(String(a.data)));return it.length?`<div class="rv-grp"><h3>${h(t)} <span>· ${it.length}</span></h3><div class="rv-items">${it.map(itemHTML).join("")}</div></div>`:"";}).join("")||`<p class="rv-empty">${PR().length?"Cap proposta coincideix amb els filtres.":"Encara no hi ha cap proposta. Selecciona un text de la guia per fer-ne la primera."}</p>`;}
function renderNav(){const n=document.querySelector("nav.top .rv-n");if(n){const k=PR().filter(p=>!CANV[p.id]||estat(p)==="reoberta").length;n.textContent=DATA&&k?String(k):"";}}

/* ---------- arxiu per a Claude ---------- */
function genExport(){if(!DATA)return;const today=new Date().toISOString().slice(0,10);
  const open=PR().filter(p=>!CANV[p.id]||estat(p)==="reoberta");
  const B={favor:[],discutida:[],contra:[],pocs:[],dubte:[],decisio:[],reob:[]};
  open.forEach(p=>{if(estat(p)==="reoberta")B.reob.push(p);else if(p.tipus==="dubte")B.dubte.push(p);else if(p.ambit==="organitzacio"||p.ambit==="web"||p.lloc==="nova")B.decisio.push(p);else B[consens(p)].push(p);});
  const fmt=p=>{const A=anc(p),c=recompte(p.id),vs=votsDe(p.id).filter(v=>v.motiu),rs=respDe(p.id);const L=[];
    L.push(`### ${p.id} · ${tipOf(p)} · ${llocLabel(p.lloc)}${A.ap&&!p.lloc.startsWith("s:")?" › "+A.ap:""}`);
    L.push(`- Lloc (clau): \`${p.lloc}\`${A.img?` · imatge \`${A.img}\` · punt x=${A.x}% y=${A.y}%`:""}`);
    if(A.t)L.push(`- ${p.tipus==="afegir"?"Inserir just després de":"Text de la guia"}: «${A.t}»`),L.push(`- Context: «…${A.pre||""}[${A.t}]${A.suf||""}…»`);
    if(A.terme)L.push(`- Terme: ${A.terme}`);
    if(A.forma){const F=A.forma;L.push(`- Nom: ${F.nom}`,p.lloc==="nova"?`- Ubicació: no decidida. Proposa on encaixa (forma d'una fitxa, malaltia d'una agrupació, nota o fitxa nova), amb arguments, i no l'apliquis sense l'aprovació de la Mireia.`:F.suggerida?`- Fitxa suggerida pel proponent (comprova si és la més adequada): ${llocLabel(p.lloc)}`:`- Posició a «Tipus i formes»: ${F.despres?"després de «"+F.despres+"»":"al final de la taula"}`);if(F.relacio)L.push(`- Relació: ${F.relacio}`);(F.camps||[]).forEach(([l,v])=>L.push(`  - ${l}: ${v}`));if(F.esquema)L.push(`- Esquema histològic proposat: ${F.esquema}`);}
    else if(p.text)L.push(`- ${p.tipus==="corregir"?"Text proposat":p.tipus==="dubte"?"Pregunta":p.tipus==="eliminar"?"Motiu":"Proposta"}: ${p.text}`);
    if(p.font)L.push(`- Font: ${p.font}`);
    L.push(`- Proposa: ${p.autor} (${String(p.data).slice(0,10)})`);
    L.push(p.tipus==="dubte"?`- Jo també: ${c.jotambe}`:`- Vots: D'acord ${c.acord} · En contra ${c.contra} · Innecessària ${c.innecessaria}`);
    vs.forEach(v=>L.push(`  - ${v.autor} (${VOT[v.vot]||v.vot}): ${v.motiu}`));
    if(CANV[p.id])L.push(`- Resolució anterior: ${RES[CANV[p.id].e]||CANV[p.id].e} (${CANV[p.id].v})${CANV[p.id].n?" · "+CANV[p.id].n:""}`);
    rs.forEach(r=>L.push(`- Comentari de ${r.autor} (${String(r.data).slice(0,10)}): ${String(r.text).replace(/^\[REOBERTA\]\s*/,"[No hi està d'acord] ")}`));
    if(orphan.has(p.id))L.push(`- Nota: el fragment no s'ha trobat a la versió publicada de la guia.`);
    return L.join("\n");};
  const S=[["1. Consens a favor","Aplica-les si la verificació amb fonts ho confirma. Si una dada no es pot verificar o és incorrecta, no l'apliquis i explica el motiu a CANVIS.",B.favor],
    ["2. Discutides","No les apliquis. Resumeix els arguments de cada part i fes una recomanació perquè decideixi la Mireia.",B.discutida],
    ["3. Consens en contra","Tanca-les com a «rebutjada» a CANVIS, amb el motiu principal del grup.",B.contra],
    ["4. Sense prou vots (menys de 2)","Deixa-les obertes, excepte els errors objectius que puguis verificar amb fonts: aquests corregeix-los.",B.pocs],
    ["5. Dubtes","Respon-los amb una entrada a CANVIS (e:\"resposta\"). Si el dubte revela un error de la guia, corregeix-lo.",B.dubte],
    ["6. Requereixen la decisió de la Mireia (organització, la web i contingut nou sense lloc)","No les apliquis. Per a cadascuna, explica què caldria modificar, quant creixeria la guia i com es podria implementar.",B.decisio],
    ["7. Reobertes pel proponent","Revisa la resolució anterior a la llum del comentari del proponent.",B.reob]];
  const md=[`# Propostes del grup · Mapa de la pell`,``,`Generat el ${today} a partir de la versió ${VERSIO} de la guia. ${open.length} propostes, ${DATA.noms.length} participants.`,``,
    `Instruccions per a Claude: aplica els criteris del projecte «Atles dermatològic» (català normatiu, dades verificades, guia breu, esquemes revisats visualment, fotos amb llicència lliure). Per a cada proposta tractada, afegeix una entrada a la constant CANVIS amb l'identificador de la proposta: {e:"incorporada"|"adaptada"|"rebutjada"|"resposta", v:"AAAA-MM-DD", n:"explicació breu"}. Després comprova la guia sencera, publica-la i resumeix els canvis.`,``,
    ...S.flatMap(([t,ins,ps])=>ps.length?[`## ${t} (${ps.length})`,``,`_${ins}_`,``,...ps.map(p=>fmt(p)+"\n")]:[])].join("\n");
  const o=$1("#rvOut");o.value=md;o.hidden=false;$1("#rvCopy").hidden=false;const dl=$1("#rvDl");dl.hidden=false;
  try{if(dl.dataset.u)URL.revokeObjectURL(dl.dataset.u);const u=URL.createObjectURL(new Blob([md],{type:"text/markdown;charset=utf-8"}));dl.href=u;dl.dataset.u=u;dl.download=`propostes-mapa-pell-${today}.md`;}catch(e){}
  toast(open.length?"Arxiu generat.":"No hi ha propostes obertes.");}

/* ---------- arrencada ---------- */
function renderAll(){renderAcc();renderList();renderNav();renderBand();applyMarks();refreshCard();}
renderAcc();
applyMarks();
if(ME.codi){renderList();renderNav();load(true);}
})();
