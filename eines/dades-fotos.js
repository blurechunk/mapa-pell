// Extreu de la guia les dades que necessita la pàgina de selecció de fotos
// (fitxes, grups, fotos actuals i fitxes on surt cada terme del glossari).
// Ús: NODE_PATH=$(npm root -g) node /home/claude/eines/dades-fotos.js sortida.json
const {chromium}=require('playwright');const out=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file:///home/claude/mapa-pell.html');await p.waitForTimeout(600);
const r=await p.evaluate(()=>({grups:Object.keys(GFAM).map(g=>({g,n:FAM[g]||g,ids:GFAM[g].ids})),
 fitxes:Object.fromEntries(Object.keys(D).map(id=>[id,{n:D[id].n,agr:GAGR.has(id),formes:TYP[id]?TYP[id].r.map(x=>x[0]):[],
  fotos:(IMG[id]||[]).map(x=>({f:x[0],peu:x[5],src:x[4]}))}])),glos:GLOS.map(g=>({k:g.k,t:g.t}))}));
const us={};
for(const id of Object.keys(r.fitxes)){await p.evaluate(id=>openD(id),id);await p.waitForTimeout(25);
 const gl=await p.$$eval('#drawer button.gl',a=>[...new Set(a.map(x=>+x.dataset.gl))]);
 for(const i of gl){const k=r.glos[i].k;(us[k]=us[k]||[]).push(id);}}
r.glosUs=us;
require('fs').writeFileSync(out,JSON.stringify(r));console.log(r.grups.length,'grups',Object.keys(r.fitxes).length,'fitxes',Object.keys(us).length,'termes amb ús');await b.close();})();
