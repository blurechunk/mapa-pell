// Prova funcional de la capa de revisió amb el servidor simulat (rv/mock.js).
const {chromium}=require('playwright');
const OUT=process.argv[2]||'/tmp';
const PAGE='file:///home/claude/mapa-pell.html';
async function ctx(b,nom,opts={}){const c=await b.newContext({viewport:opts.vp||{width:1280,height:900},deviceScaleFactor:opts.dpr||1,colorScheme:opts.dark?'dark':'light'});
  await c.addInitScript(([n])=>{try{localStorage.setItem('mp-rv-pont','http://127.0.0.1:8765/exec');if(n){localStorage.setItem('mp-rv-nom',n);localStorage.setItem('mp-rv-codi','grup');}}catch(e){}},[nom]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('console: '+m.text());});
  await p.goto(PAGE);await p.waitForTimeout(1200);return {c,p,errs};}
async function selectIn(p,sel,text){return p.evaluate(([sel,text])=>{const root=document.querySelector(sel);const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){const i=n.nodeValue.indexOf(text);if(i>=0){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+text.length);const s=getSelection();s.removeAllRanges();s.addRange(r);
    document.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));return true;}}return false;},[sel,text]);}
async function selectFirst(p,sel){return p.evaluate((sel)=>{const root=document.querySelector(sel);const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){const v=n.nodeValue;if(v.trim().length>=24&&!n.parentElement.closest('.rv-ui,button,svg,script,style')){n.parentElement.scrollIntoView({block:'center'});const i=v.search(/\S/);const j=v.indexOf(' ',i+18);const r=document.createRange();r.setStart(n,i);r.setEnd(n,j>0?j:i+18);const s=getSelection();s.removeAllRanges();s.addRange(r);
    document.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));return r.toString();}}return null;},sel);}
const log=(...a)=>console.log(...a);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  // ----- Anna -----
  const A=await ctx(b,'Anna');const p=A.p;
  log('nav propostes:',await p.$$eval('nav.top a[href="#propostes"], nav.top .rv-tg',x=>x.length));
  await p.evaluate(()=>openD('psoriasi'));await p.waitForTimeout(400);
  const q=await p.$eval('#drawer .qdef',e=>e.textContent.slice(0,200));log('qdef:',q.slice(0,90));
  const frag=q.split(/[.,]/)[0].split(' ').slice(2,7).join(' ');log('fragment:',frag);
  log('seleccio:',await selectIn(p,'#drawer .qdef',frag));await p.waitForTimeout(500);
  log('barra visible:',await p.$eval('.rv-bar',e=>!e.hidden));
  await p.screenshot({path:OUT+'/1-barra.png'});
  await p.click('.rv-bar [data-rvsel="corregir"]');await p.waitForTimeout(300);
  await p.fill('#rvTxt',frag+' (text corregit de prova)');await p.fill('#rvFont','https://exemple.org/guia');
  await p.screenshot({path:OUT+'/2-formulari.png'});
  await p.click('[data-rvsend]');await p.waitForTimeout(900);
  log('marques al drawer:',await p.$$eval('#drawer mark.rv-m',x=>x.length));
  // dubte en una altra part
  log('seleccio dubte:',await selectFirst(p,'#drawer .dsec.exam'));await p.waitForTimeout(400);await p.click('.rv-bar [data-rvsel="dubte"]');await p.fill('#rvTxt','Això és sempre així?');await p.click('[data-rvsend]');await p.waitForTimeout(700);
  // mode corrector, punt en un esquema i corregida
  await p.keyboard.press('Control+k');await p.waitForTimeout(400);
  log('franja:',await p.$eval('.rv-band',e=>!e.hidden),'drawer toggle:',await p.$eval('.rv-dt',e=>e.getAttribute('aria-pressed')));
  const svg=await p.$('#drawer .dfig svg.mini');await svg.scrollIntoViewIfNeeded();await p.waitForTimeout(200);const bb=await svg.boundingBox();await p.mouse.click(bb.x+bb.width*0.4,bb.y+bb.height*0.3);await p.waitForTimeout(300);
  log('formulari assenyalar:',await p.$eval('.rv-pop b',e=>e.textContent));
  await p.fill('#rvTxt','L\'etiqueta d\'acantosi apunta massa amunt.');await p.click('[data-rvsend]');await p.waitForTimeout(700);
  log('punts:',await p.$$eval('#drawer .rv-pin',x=>x.map(e=>!e.hidden+' '+e.style.left+','+e.style.top)));
  await p.$eval('#drawer [data-rvcor]',e=>e.scrollIntoView({block:'center'}));await p.click('#drawer [data-rvcor]');await p.waitForTimeout(700);
  log('corregida:',await p.$eval('#drawer .rv-cor',e=>e.textContent));
  await p.screenshot({path:OUT+'/3-mode-drawer.png'});
  // afegir amb + en una secció principal
  await p.evaluate(()=>closeD());await p.waitForTimeout(200);
  const para=await p.$('#anatomia p');await para.scrollIntoViewIfNeeded();await p.waitForTimeout(300);const pb=await para.boundingBox();await p.mouse.move(pb.x+20,pb.y+5);await p.waitForTimeout(200);
  log('+ visible:',await p.$eval('.rv-plus',e=>!e.hidden));await p.click('.rv-plus');await p.waitForTimeout(200);
  await p.fill('#rvTxt','Falta esmentar la membrana basal com a diana.');await p.click('[data-rvsend]');await p.waitForTimeout(700);
  log('insercions anatomia:',await p.$$eval('#anatomia .rv-ins',x=>x.length));
  log('corregida subapartats (mode):',await p.$$eval('#anatomia .rv-cor',x=>x.length));
  // proposta d'organització i general
  await p.click('#anatomia .rv-cor [data-rvorg]');await p.waitForTimeout(200);await p.selectOption('#rvTip','reordenar');await p.fill('#rvTxt','Posaria les dianes de l\'adhesió abans.');await p.click('[data-rvsend]');await p.waitForTimeout(600);
  await p.click('.rv-band [data-rvweb]');await p.waitForTimeout(200);await p.selectOption('#rvTip','funcionalitat');await p.fill('#rvTxt','Mode fosc per a l\'atles.');await p.click('[data-rvsend]');await p.waitForTimeout(600);
  // glossari des de la selecció
  await p.evaluate(()=>openD('pemfig_vulgar'));await p.waitForTimeout(400);
  log('seleccio glossari:',await selectFirst(p,'#drawer .qdef'));await p.waitForTimeout(400);
  await p.click('.rv-bar [data-rvsel="glossari"]');await p.fill('#rvTxt','Definició de prova.');await p.click('[data-rvsend]');await p.waitForTimeout(600);
  await p.evaluate(()=>closeD());
  await p.keyboard.press('Control+k');await p.waitForTimeout(300);
  log('franja després de sortir:',await p.$eval('.rv-band',e=>e.hidden));
  log('errors Anna:',A.errs.length?A.errs:'cap');
  // ----- Pau vota -----
  const B=await ctx(b,'Pau');const q2=B.p;
  await q2.evaluate(()=>openD('psoriasi'));await q2.waitForTimeout(500);
  log('Pau veu marques:',await q2.$$eval('#drawer mark.rv-m',x=>x.length));
  await q2.click('#drawer mark.rv-m');await q2.waitForTimeout(300);
  await q2.click('[data-rvvote="acord"]');await q2.waitForTimeout(600);
  log('vots després:',await q2.$eval('.rv-pop',e=>[...e.querySelectorAll('[data-rvvote]')].map(x=>x.textContent).join(' | ')));
  await q2.screenshot({path:OUT+'/4-targeta.png'});
  await q2.click('[data-rvvote="contra"]');await q2.waitForTimeout(200);await q2.fill('#rvMot','No és correcte segons la guia europea.');await q2.click('[data-rvvotec]');await q2.waitForTimeout(600);
  log('vot en contra amb motiu:',await q2.$eval('.rv-vlist',e=>e.textContent).catch(()=>'cap'));
  await q2.keyboard.press('Escape');
  log('errors Pau:',B.errs.length?B.errs:'cap');
  // ----- Joan vota també i el grup genera l'arxiu -----
  const C=await ctx(b,'Joan');const r=C.p;
  await r.evaluate(()=>document.querySelector('#propostes').scrollIntoView());await r.waitForTimeout(300);
  log('llista:',await r.$$eval('#rvList .rv-item',x=>x.length));
  await r.click('#rvList .rv-item');await r.waitForTimeout(300);
  const isPsor=await r.$eval('.rv-pop .rv-lloc',e=>e.textContent);log('Joan obre:',isPsor);
  const vb=await r.$('[data-rvvote="acord"]');if(vb){await vb.click();await r.waitForTimeout(600);}
  await r.keyboard.press('Escape');
  await r.click('#rvGen');await r.waitForTimeout(300);
  const md=await r.$eval('#rvOut',e=>e.value);require('fs').writeFileSync(OUT+'/arxiu.md',md);log('arxiu: ',md.split('\n').filter(l=>l.startsWith('## ')).join(' / '));
  await r.screenshot({path:OUT+'/5-propostes.png',fullPage:false});
  log('errors Joan:',C.errs.length?C.errs:'cap');
  // ----- sense codi -----
  const N=await ctx(b,null);
  log('sense codi, marques:',await N.p.$$eval('mark.rv-m,.rv-pin,.rv-ins',x=>x.length),'panell:',await N.p.$eval('#rvMain',e=>e.hidden));
  // ----- mòbil i fosc -----
  const M=await ctx(b,'Anna',{vp:{width:390,height:844},dpr:2,dark:true});
  await M.p.evaluate(()=>openD('psoriasi'));await M.p.waitForTimeout(500);await M.p.click('#drawer mark.rv-m');await M.p.waitForTimeout(300);
  await M.p.screenshot({path:OUT+'/6-mobil.png'});
  await M.p.keyboard.press('Escape');await M.p.evaluate(()=>closeD());
  await M.p.evaluate(()=>document.querySelector('nav.top').scrollIntoView());await M.p.screenshot({path:OUT+'/7-mobil-nav.png'});
  log('scroll horitzontal mòbil:',await M.p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  log('errors mòbil:',M.errs.length?M.errs:'cap');
  await b.close();})();
