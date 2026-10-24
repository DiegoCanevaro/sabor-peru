// ================= ESTACIONES (mapa de la cocina) =================
// Distribución estilo Overcooked: encimeras en todo el perímetro y una isla en el centro.
// La cocina es una cuadrícula de celdas de CS px:
//   fila de arriba (pared del fondo) = cajas de ingredientes · columna izquierda = fuegos (ollas y sartén)
//   isla central = preparación (tabla, bowl, licuadora) · columna derecha = bandeja de salida y basura
//   fila de abajo = mesas (ahí empiezan los platos limpios). Las celdas que sobran son mesas estándar.
function S(id, kind, x, y, w, h, sx, sy, extra) { return Object.assign({ id, kind, x, y, w, h, sx, sy }, extra || {}); }
const st = [];
const CS = 64, GX = 26, GY = 24, COLS = 13, ROWS = 8, ISLAND_ROW = 3;
const cellX = c => GX + c * CS, cellY = r => GY + r * CS;
const STAND = 32;     // a qué distancia del borde se para el ayudante para usar una estación
// face = hacia dónde queda la zona de paso (desde ahí se usa la estación)
function cellSt(id, kind, c, r, face, extra, cellsTall, cellsWide) {
  const x = cellX(c), y = cellY(r), w = CS * (cellsWide || 1), h = CS * (cellsTall || 1), cx = x + w / 2, cy = y + h / 2;
  const sp = { down: [cx, y + h + STAND], up: [cx, y - STAND], right: [x + w + STAND, cy], left: [x - STAND, cy] }[face];
  return S(id, kind, x, y, w, h, sp[0], sp[1], Object.assign({ face, col: c, row: r }, extra || {}));
}
function stationExtra(spec) {
  switch (spec) {
    case 'pot': return { slots: [], label: 'Olla' };
    case 'board': return { state: 'empty', t: 0, product: null, label: 'Tabla' };
    case 'bowl': return { state: 'idle', t: 0, items: [], label: 'Bowl' };
    case 'pan': return { state: 'idle', t: 0, items: [], label: 'Sartén' };
    case 'wok': return { state: 'idle', t: 0, items: [], label: 'Wok' };
    case 'stew': return { state: 'idle', t: 0, items: [], label: 'Olla' };      // olla del guiso (pollo al ají)
    case 'fryer': return { state: 'idle', t: 0, item: null, label: 'Freidora' };   // papas fritas
    case 'skewer': return { state: 'empty', t: 0, product: null, label: 'Palitos' };    // ensartar anticuchos (mantener)
    case 'grill': return { slots: [], label: 'Parrilla' };                            // anticuchos (automática, 3 palitos)
    case 'balde': return { state: 'idle', t: 0, label: 'Balde chichero' };      // llena vasos de chicha morada
    case 'cups': return { label: 'Vasos' };
    case 'blender': return { state: 'idle', t: 0, items: [], out: null, label: 'Licuadora' };
  }
}
// Carritos de la calle (layout 'calle'): el 3D los usa para poner ruedas y toldos. { c0, c1, r, side: 'top'|'bottom', awning }
const CARTS = [];
let MAP = null;      // cocina generada (null en la calle)
const idCount = {};
const uid = base => { idCount[base] = (idCount[base] || 0) + 1; return idCount[base] === 1 ? base : base + idCount[base]; };
if (LEVEL.layout === 'calle') {
  let mn = 0, pn = 0;
  const place = (spec, c, r, face) => {
    if (spec.startsWith('crate:')) { const it = spec.slice(6); st.push(cellSt('crate_' + it, 'crate', c, r, face, { item: it, emoji: CRATE_INFO[it][0], label: CRATE_INFO[it][1] })); return; }
    if (spec === 'table' || spec === 'plates') { st.push(cellSt('mesa' + (++mn), 'table', c, r, face, { item: null, label: 'Mesa', plates: spec === 'plates' })); return; }
    if (spec === 'trash') { st.push(cellSt('trash', 'trash', c, r, face, { label: 'Basura' })); return; }
    st.push(cellSt(spec === 'pot' ? 'pot' + (++pn) : uid(spec), spec, c, r, face, stationExtra(spec)));
  };
  const cart = (c0, r, face, specs, awning) => {
    CARTS.push({ c0, c1: c0 + specs.length - 1, r, side: face === 'down' ? 'top' : 'bottom', awning });
    specs.forEach((sp, i) => place(sp, c0 + i, r, face));
  };
  // Calle con carretillas cebicheras a ambos lados de la pista; el cruce peatonal queda al centro (columnas 6 y 7).
  //   arriba a la izquierda: los ingredientes · arriba a la derecha: fuegos (si hay), balde chichero y vasos
  //   abajo a la izquierda: tablas de picar y el mostrador (entre las tablas y el cruce) · abajo a la derecha: bowl, platos y basura
  const specs = LEVEL.left.concat(LEVEL.right || []);
  const heat = specs.filter(sp => sp === 'pot' || sp === 'pan' || sp === 'wok' || sp === 'stew' || sp === 'grill'), prep = specs.filter(sp => !heat.includes(sp));
  const pad = (list, n) => list.concat(Array(Math.max(0, n - list.length)).fill('table'));
  cart(1, 1, 'down', LEVEL.crates.map(it => 'crate:' + it), 'blue');
  cart(8, 1, 'down', pad(heat.concat(LEVEL.drinks || []), 4), 'blue');
  const cut = prep.filter(sp => sp !== 'bowl');
  cart(1, 6, 'up', cut, 'blue');
  // mostrador de 2 mesas pegado al cruce; si sobra espacio entre las tablas y el mostrador, va una mesa de apoyo
  st.push(cellSt('counter', 'counter', 4, 6, 'up', { label: 'MOSTRADOR' }, 1, 2));
  for (let col = 1 + cut.length; col < 4; col++) place('table', col, 6, 'up');
  cart(8, 6, 'up', (prep.includes('bowl') ? ['bowl'] : []).concat(['plates', 'plates', 'trash']), 'blue');
} else {
  // cocina procedural (js/mapgen.js): cada nivel tiene su propia distribución, siempre la misma para ese nivel
  // para probar: ?mapa=<semilla> y/o ?forma=<forma> (?mapa=clasica = la cocina de antes)
  const qs = new URLSearchParams(location.search), qm = qs.get('mapa'), qf = qs.get('forma'), opt = {};
  if (qm != null && qm !== '') { if (MAPGEN.SHAPES.includes(qm) || qm === 'clasica') opt.shape = qm; else opt.seed = /^\d+$/.test(qm) ? +qm : qm; }
  if (qf) opt.shape = qf;
  MAP = MAPGEN.generate(LEVEL, opt);
  console.log('Cocina:', MAP.name, '· semilla', MAP.seed);
  let pn = 0, mn = 0;
  for (const sp of MAP.stations) {
    if (sp.kind === 'crate') st.push(cellSt('crate_' + sp.item, 'crate', sp.c, sp.r, sp.face, { item: sp.item, emoji: CRATE_INFO[sp.item][0], label: CRATE_INFO[sp.item][1] }));
    else if (sp.kind === 'table') st.push(cellSt('mesa' + (++mn), 'table', sp.c, sp.r, sp.face, { item: null, label: 'Mesa', plates: !!sp.plates }));
    else if (sp.kind === 'counter') st.push(cellSt('counter', 'counter', sp.c, sp.r, sp.face, { label: 'MOSTRADOR' }, sp.tall || 1));
    else if (sp.kind === 'deco') st.push(cellSt('deco' + (++mn), 'deco', sp.c, sp.r, sp.face, { label: '' }));
    else if (sp.kind === 'trash') st.push(cellSt('trash', 'trash', sp.c, sp.r, sp.face, { label: 'Basura' }));
    else st.push(cellSt(sp.kind === 'pot' ? 'pot' + (++pn) : uid(sp.kind), sp.kind, sp.c, sp.r, sp.face, stationExtra(sp.kind)));
  }
  // el jugador empieza en el centro libre de la cocina (ya no puede aparecer dentro de una isla)
  player.x = cellX(MAP.spawn[0]) + CS / 2; player.y = cellY(MAP.spawn[1]) + CS / 2;
}

const g = id => st.find(s => s.id === id);
const byKind = k => st.find(s => s.kind === k);
const POTS = st.filter(s => s.kind === 'pot');
const TABLES = st.filter(s => s.kind === 'table');
const BL = () => byKind('blender');
// olla libre para un ingrediente: primero una que ya cuece ese mismo ingrediente y aún tiene sitio, si no una vacía
function freePot(type) {
  if (type) { const same = POTS.find(p => p.slots.length && p.slots.length < potCap(type) && p.slots.every(x => x.type === type)); if (same) return same; }
  return POTS.find(p => !p.slots.length);
}
const potWith = type => POTS.find(p => p.slots.some(x => x.done && x.type === type));
const potN = type => POTS.reduce((n, p) => n + p.slots.filter(x => x.type === type).length, 0);
// Platos limpios: empiezan en las mesas de abajo más cercanas a la bandeja de salida y vuelven ahí tras servir
// (en los primeros niveles no se lavan)
function plateSpot() {
  const out = st.find(s => s.kind === 'counter');
  return st.filter(s => s.kind === 'table' && !s.item && s.plates)
    .sort((a, b) => Math.hypot(a.sx - out.sx, a.sy - out.sy) - Math.hypot(b.sx - out.sx, b.sy - out.sy))[0] || null;
}
for (let i = 0; i < (LEVEL.plates || 2); i++) { const t = plateSpot(); if (t) t.item = { type: 'plate', parts: [] }; }
// mesa libre más cercana a un punto
function freeTableNear(x, y) {
  let best = null, bd = 1e9;
  for (const t of TABLES) if (!t.item) { const d = Math.hypot(t.sx - x, t.sy - y); if (d < bd) { bd = d; best = t; } }
  return best;
}
