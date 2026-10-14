/**
 * Mapa de la pell · pont de propostes
 * Script de Google Apps Script vinculat al full de càlcul de propostes.
 *
 * Fulls que crea `configura()`:
 *   Config      codi_grup (per llegir i escriure) · codi_admin (per tancar propostes de qualsevol)
 *   Propostes   una fila per proposta
 *   Vots        una fila per persona i proposta
 *   Respostes   respostes als dubtes i comentaris
 *   Corregides  una fila per persona i lloc marcat com a corregit
 *
 * Tot passa per l'adreça de l'aplicació web (…/exec):
 *   GET  ?codi=…                         → totes les dades vigents
 *   POST {codi, autor, accio, …} (text)  → desa i retorna totes les dades
 */

const FULLS = {
  Config:     ['clau', 'valor'],
  Propostes:  ['id', 'data', 'autor', 'ambit', 'tipus', 'lloc', 'ancora', 'text', 'font', 'estat', 'actualitzat'],
  Vots:       ['proposta', 'autor', 'vot', 'motiu', 'data'],
  Respostes:  ['proposta', 'autor', 'text', 'data'],
  Corregides: ['lloc', 'autor', 'empremta', 'data']
};

const AMBITS = {
  contingut:    ['corregir', 'eliminar', 'afegir', 'assenyalar', 'dubte'],
  glossari:     ['terme_nou', 'definicio'],
  organitzacio: ['moure', 'fusionar', 'separar', 'reclassificar', 'reordenar', 'altre'],
  web:          ['funcionalitat', 'apartat', 'millora']
};
const VOTS = ['acord', 'contra', 'innecessaria', 'jotambe'];
const ESTATS = ['oberta', 'arxivada', 'retirada'];

/** Executa aquesta funció una sola vegada, des de l'editor, per crear els fulls. */
function configura() {
  const ss = SpreadsheetApp.getActive();
  for (const [nom, cap] of Object.entries(FULLS)) {
    const sh = ss.getSheetByName(nom) || ss.insertSheet(nom);
    if (sh.getLastRow() === 0) sh.appendRow(cap);
    sh.setFrozenRows(1);
    sh.getRange('A:Z').setNumberFormat('@'); // tot com a text: evita conversions automàtiques
  }
  const cfg = ss.getSheetByName('Config');
  if (cfg.getLastRow() < 2) {
    cfg.appendRow(['codi_grup', 'CANVIA-AQUEST-CODI']);
    cfg.appendRow(['codi_admin', 'CANVIA-TAMBE-AQUEST']);
  }
  ['Full 1', 'Hoja 1', 'Sheet1'].forEach(n => {
    const s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1 && s.getLastRow() === 0) ss.deleteSheet(s);
  });
}

function doGet(e) {
  return resposta_(() => {
    comprovaCodi_((e.parameter || {}).codi);
    return totes_();
  });
}

function doPost(e) {
  return resposta_(() => {
    const b = JSON.parse(e.postData.contents);
    comprovaCodi_(b.codi);
    const autor = txt_(b.autor, 60).trim();
    if (!autor) throw new Error('Cal escriure el teu nom.');
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      ACCIONS[b.accio] ? ACCIONS[b.accio](b, autor) : (() => { throw new Error('Acció desconeguda.'); })();
    } finally {
      lock.releaseLock();
    }
    return totes_();
  });
}

const ACCIONS = {
  proposa(b, autor) {
    if (!AMBITS[b.ambit] || !AMBITS[b.ambit].includes(b.tipus)) throw new Error('Tipus de proposta no vàlid.');
    const ara = new Date().toISOString();
    const id = 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    full_('Propostes').appendRow([id, ara, autor, b.ambit, b.tipus, txt_(b.lloc, 120),
      txt_(JSON.stringify(b.ancora || {}), 4000), txt_(b.text, 4000), txt_(b.font, 600), 'oberta', ara].map(cel_));
  },
  vota(b, autor) {
    const p = proposta_(b.proposta);
    if (mateix_(p.autor, autor)) throw new Error('No pots votar les teves propostes.');
    const vot = String(b.vot || '');
    if (vot && !VOTS.includes(vot)) throw new Error('Vot no vàlid.');
    if (vot === 'contra' && !txt_(b.motiu, 600).trim()) throw new Error('Indica breument el motiu del vot en contra.');
    desaUnic_('Vots', r => r.proposta === p.id && mateix_(r.autor, autor),
      vot ? [p.id, autor, vot, txt_(b.motiu, 600), new Date().toISOString()] : null);
  },
  respon(b, autor) {
    const p = proposta_(b.proposta);
    const t = txt_(b.text, 2000).trim();
    if (!t) throw new Error('La resposta és buida.');
    full_('Respostes').appendRow([p.id, autor, t, new Date().toISOString()].map(cel_));
  },
  corregida(b, autor) {
    const lloc = txt_(b.lloc, 120);
    if (!lloc) throw new Error('Falta el lloc.');
    desaUnic_('Corregides', r => r.lloc === lloc && mateix_(r.autor, autor),
      b.marca ? [lloc, autor, txt_(b.empremta, 64), new Date().toISOString()] : null);
  },
  estat(b, autor) {
    const p = proposta_(b.proposta);
    if (!ESTATS.includes(b.estat)) throw new Error('Estat no vàlid.');
    const admin = b.admin && b.admin === config_().codi_admin;
    if (!admin && !mateix_(p.autor, autor)) throw new Error('Només qui ha fet la proposta pot canviar-ne l\'estat.');
    const sh = full_('Propostes');
    sh.getRange(p._fila, 10, 1, 2).setValues([[b.estat, new Date().toISOString()]]);
  }
};

/* ---------- utilitats ---------- */

function totes_() {
  const prop = files_('Propostes').filter(p => p.estat === 'oberta');
  const ids = new Set(prop.map(p => p.id));
  const noms = new Set();
  ['Propostes', 'Vots', 'Respostes', 'Corregides'].forEach(n => files_(n).forEach(r => r.autor && noms.add(r.autor)));
  return {
    ok: true,
    propostes: prop.map(net_),
    vots: files_('Vots').filter(v => ids.has(v.proposta)).map(net_),
    respostes: files_('Respostes').filter(r => ids.has(r.proposta)).map(net_),
    corregides: files_('Corregides').map(net_),
    noms: [...noms].sort((a, b) => a.localeCompare(b, 'ca'))
  };
}

function resposta_(f) {
  let out;
  try { out = f(); } catch (err) { out = { ok: false, error: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function config_() {
  const o = {};
  full_('Config').getDataRange().getValues().slice(1).forEach(r => { o[String(r[0]).trim()] = String(r[1]).trim(); });
  return o;
}

function comprovaCodi_(codi) {
  const c = config_().codi_grup;
  if (!c || String(codi || '').trim() !== c) throw new Error('Codi de grup incorrecte.');
}

function full_(nom) { return SpreadsheetApp.getActive().getSheetByName(nom); }

function files_(nom) {
  const v = full_(nom).getDataRange().getValues();
  const cap = v[0];
  return v.slice(1).map((r, i) => {
    const o = { _fila: i + 2 };
    cap.forEach((c, j) => { o[c] = r[j] instanceof Date ? r[j].toISOString() : String(r[j]); });
    return o;
  });
}

function proposta_(id) {
  const p = files_('Propostes').find(x => x.id === String(id || ''));
  if (!p) throw new Error('Aquesta proposta ja no existeix.');
  return p;
}

/** Crea, substitueix o (amb fila = null) esborra l'única fila que compleix `cond`. */
function desaUnic_(nom, cond, fila) {
  const sh = full_(nom);
  const r = files_(nom).find(cond);
  if (r && fila) sh.getRange(r._fila, 1, 1, fila.length).setValues([fila.map(cel_)]);
  else if (r) sh.deleteRow(r._fila);
  else if (fila) sh.appendRow(fila.map(cel_));
}

function net_(o) { const c = Object.assign({}, o); delete c._fila; return c; }
function mateix_(a, b) { return String(a).trim().toLowerCase() === String(b).trim().toLowerCase(); }
function txt_(x, n) { return String(x == null ? '' : x).slice(0, n || 4000); }
/** Impedeix que un text que comenci per = + - @ s'interpreti com a fórmula. */
function cel_(x) { const s = String(x); return /^[=+\-@]/.test(s) ? "'" + s : s; }
