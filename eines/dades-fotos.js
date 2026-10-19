// Extreu de la guia les dades que necessita la pàgina de selecció de fotos.
// Ús: NODE_PATH=$(npm root -g) node /home/claude/eines/dades-fotos.js sortida.json
const {chromium}=require('playwright');const out=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file:///home/claude/mapa-pell.html');await p.waitForTimeout(600);
const r=await p.evaluate(()=>({grups:Object.keys(GFAM).map(g=>({g,n:FAM[g]||g,ids:GFAM[g].ids})),
 fitxes:Object.fromEntries(Object.keys(D).map(id=>[id,{n:D[id].n,agr:GAGR.has(id),formes:TYP[id]?TYP[id].r.map(x=>x[0]):[],
  fotos:(IMG[id]||[]).map(x=>({f:x[0],peu:x[5],src:x[4]}))}]))}));
require('fs').writeFileSync(out,JSON.stringify(r));console.log(r.grups.length,'grups',Object.keys(r.fitxes).length,'fitxes');await b.close();})();
