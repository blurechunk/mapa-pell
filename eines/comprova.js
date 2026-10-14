// Comprova la guia sencera: obre totes les fitxes, el comparador i les parelles; detecta errors JS, "undefined" i enllaços trencats.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1200,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+(process.env.PAGINA||'/home/claude/mapa-pell.html'));await p.waitForTimeout(900);
const r=await p.evaluate(async()=>{const out=[];
 for(const id of Object.keys(D)){try{openD(id);const h=drawer.innerHTML;if(h.includes('undefined')||h.includes('NaN'))out.push('undefined a '+id);}catch(e){out.push(id+' '+e.message);}}
 closeD();
 const ids=Object.keys(D);for(let i=0;i<ids.length;i+=7){try{setPair(ids[i],ids[(i+3)%ids.length]);}catch(e){out.push('comparador '+ids[i]+' '+e.message);}}
 for(const [a,b2] of CPAIRS){setPair(a,b2);if(document.querySelector('#cmpOut').innerHTML.includes('undefined'))out.push('comparador undefined '+a+'/'+b2);}
 const bad=[...document.querySelectorAll('[data-dz]')].filter(x=>!D[x.dataset.dz]).map(x=>x.dataset.dz);if(bad.length)out.push('enllaços trencats '+bad);
 return out.concat([Object.keys(D).length+' fitxes', document.querySelector('#count').textContent]);});
console.log(r.join('\n'));console.log('errors JS:',errs.length?errs:'cap');await b.close();})();
