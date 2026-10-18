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
function cellSt(id, kind, c, r, face, extra, cellsTall) {
  const x = cellX(c), y = cellY(r), w = CS, h = CS * (cellsTall || 1), cx = x + w / 2, cy = y + h / 2;
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
    case 'blender': return { state: 'idle', t: 0, items: [], out: null, label: 'Licuadora' };
  }
}
{
  const used = new Set(), key = (c, r) => c + ',' + r;
  const put = (spec, kind, c, r, face, extra, tall) => { st.push(cellSt(spec, kind, c, r, face, extra, tall)); for (let i = 0; i < (tall || 1); i++) used.add(key(c, r + i)); };
  // fila de arriba: cajas de ingredientes (en el orden del nivel)
  LEVEL.crates.forEach((it, i) => put('crate_' + it, 'crate', 2 + i, 0, 'down', { item: it, emoji: CRATE_INFO[it][0], label: CRATE_INFO[it][1] }));
  // fuegos en la pared izquierda; preparación en el centro de la isla
  const specs = LEVEL.left.concat(LEVEL.right || []);
  let pn = 0, row = 1;
  const HEAT = ['pot', 'pan', 'wok'];
  specs.filter(sp => HEAT.includes(sp)).forEach(sp => { put(sp === 'pot' ? 'pot' + (++pn) : sp, sp, 0, row++, 'right', stationExtra(sp)); });
  const prep = specs.filter(sp => !HEAT.includes(sp));
  const c0 = Math.round((COLS - prep.length) / 2);
  prep.forEach((sp, i) => put(sp, sp, c0 + i, ISLAND_ROW, 'down', stationExtra(sp)));
  // pared derecha: bandeja de salida (3 celdas) y basura
  put('counter', 'counter', COLS - 1, 2, 'left', { label: 'MOSTRADOR' }, 3);
  put('trash', 'trash', COLS - 1, ROWS - 2, 'left', { label: 'Basura' });
  // el resto del perímetro y de la isla: mesas estándar (las esquinas no se alcanzan, son solo decoración en 3D)
  let mn = 0;
  const table = (c, r, face) => { if (!used.has(key(c, r))) put('mesa' + (++mn), 'table', c, r, face, { item: null, label: 'Mesa' }); };
  for (let c = 1; c < COLS - 1; c++) table(c, ROWS - 1, 'up');           // fila de abajo
  for (let c = 1; c < COLS - 1; c++) table(c, 0, 'down');               // fila de arriba
  for (let r = 1; r < ROWS - 1; r++) table(0, r, 'right');              // pared izquierda
  for (let r = 1; r < ROWS - 1; r++) table(COLS - 1, r, 'left');        // pared derecha
  for (let c = 2; c < COLS - 2; c++) table(c, ISLAND_ROW, 'down');      // isla
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
  return st.filter(s => s.kind === 'table' && s.row === ROWS - 1 && !s.item)
    .sort((a, b) => Math.hypot(a.sx - out.sx, a.sy - out.sy) - Math.hypot(b.sx - out.sx, b.sy - out.sy))[0] || null;
}
for (let i = 0; i < (LEVEL.plates || 2); i++) { const t = plateSpot(); if (t) t.item = { type: 'plate', parts: [] }; }
// mesa libre más cercana a un punto
function freeTableNear(x, y) {
  let best = null, bd = 1e9;
  for (const t of TABLES) if (!t.item) { const d = Math.hypot(t.sx - x, t.sy - y); if (d < bd) { bd = d; best = t; } }
  return best;
}
