// Servidor de prova que imita el pont de Google Apps Script (mateixes accions i validacions).
// Ús: node /home/claude/rv/mock.js 8765
const http = require('http');
const PORT = +process.argv[2] || 8765;
const CODI = 'grup', ADMIN = 'admin';
const DB = { Propostes: [], Vots: [], Respostes: [], Corregides: [] };
const AMBITS = { contingut: ['corregir','eliminar','afegir','assenyalar','dubte'], glossari: ['terme_nou','definicio'], organitzacio: ['moure','fusionar','separar','reclassificar','reordenar','altre'], web: ['funcionalitat','apartat','millora'] };
const VOTS = ['acord','contra','innecessaria','jotambe'], ESTATS = ['oberta','arxivada','retirada'];
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
const now = () => new Date().toISOString();
function totes() {
  const prop = DB.Propostes.filter(p => p.estat === 'oberta'); const ids = new Set(prop.map(p => p.id));
  const noms = new Set(); Object.values(DB).forEach(t => t.forEach(r => r.autor && noms.add(r.autor)));
  return { ok: true, propostes: prop, vots: DB.Vots.filter(v => ids.has(v.proposta)), respostes: DB.Respostes.filter(r => ids.has(r.proposta)), corregides: DB.Corregides, noms: [...noms].sort() };
}
const prop = id => { const p = DB.Propostes.find(x => x.id === id); if (!p) throw new Error('Aquesta proposta ja no existeix.'); return p; };
const ACC = {
  proposa(b, autor) { if (!AMBITS[b.ambit] || !AMBITS[b.ambit].includes(b.tipus)) throw new Error('Tipus de proposta no vàlid.');
    DB.Propostes.push({ id: 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), data: now(), autor, ambit: b.ambit, tipus: b.tipus, lloc: String(b.lloc || ''), ancora: JSON.stringify(b.ancora || {}), text: String(b.text || ''), font: String(b.font || ''), estat: 'oberta', actualitzat: now() }); },
  vota(b, autor) { const p = prop(b.proposta); if (same(p.autor, autor)) throw new Error('No pots votar les teves propostes.');
    const vot = String(b.vot || ''); if (vot && !VOTS.includes(vot)) throw new Error('Vot no vàlid.');
    if (vot === 'contra' && !String(b.motiu || '').trim()) throw new Error('Indica breument el motiu del vot en contra.');
    const i = DB.Vots.findIndex(r => r.proposta === p.id && same(r.autor, autor)); const row = { proposta: p.id, autor, vot, motiu: String(b.motiu || ''), data: now() };
    if (i >= 0 && vot) DB.Vots[i] = row; else if (i >= 0) DB.Vots.splice(i, 1); else if (vot) DB.Vots.push(row); },
  respon(b, autor) { const p = prop(b.proposta); const t = String(b.text || '').trim(); if (!t) throw new Error('La resposta és buida.'); DB.Respostes.push({ proposta: p.id, autor, text: t, data: now() }); },
  corregida(b, autor) { const lloc = String(b.lloc || ''); if (!lloc) throw new Error('Falta el lloc.');
    const i = DB.Corregides.findIndex(r => r.lloc === lloc && same(r.autor, autor)); const row = { lloc, autor, empremta: String(b.empremta || ''), data: now() };
    if (i >= 0 && b.marca) DB.Corregides[i] = row; else if (i >= 0) DB.Corregides.splice(i, 1); else if (b.marca) DB.Corregides.push(row); },
  estat(b, autor) { const p = prop(b.proposta); if (!ESTATS.includes(b.estat)) throw new Error('Estat no vàlid.');
    if (!(b.admin && b.admin === ADMIN) && !same(p.autor, autor)) throw new Error("Només qui ha fet la proposta pot canviar-ne l'estat.");
    p.estat = b.estat; p.actualitzat = now(); }
};
http.createServer((req, res) => {
  const send = o => { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(o)); };
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__db') return send(DB);
  if (req.method === 'GET') { if (u.searchParams.get('codi') !== CODI) return send({ ok: false, error: 'Codi de grup incorrecte.' }); return send(totes()); }
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    try { const b = JSON.parse(body); if (b.codi !== CODI) throw new Error('Codi de grup incorrecte.'); const autor = String(b.autor || '').trim(); if (!autor) throw new Error('Cal escriure el teu nom.');
      if (!ACC[b.accio]) throw new Error('Acció desconeguda.'); ACC[b.accio](b, autor); send(totes()); }
    catch (e) { send({ ok: false, error: e.message }); } });
}).listen(PORT, () => console.log('mock a', PORT));
