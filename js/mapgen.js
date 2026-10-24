// ================= GENERADOR PROCEDURAL DE COCINAS =================
// Cada nivel recibe su propia distribución de cocina a partir de una semilla (por defecto, el id del nivel),
// así que el mismo nivel siempre se ve igual, pero cada nivel es distinto.
//
// La cocina sigue siendo una cuadrícula de 13 x 8 celdas:
//   - el perímetro son encimeras (las esquinas son solo decoración en 3D)
//   - el interior (columnas 1-11, filas 1-6) es el piso, con islas de formas variadas
//   - la bandeja de salida va siempre en la pared derecha (ahí está la ventanilla de PEDIDOS en 3D),
//     pero a una altura distinta en cada cocina
//   - los platos limpios empiezan en las mesas de abajo (regla de Sing)
//
// Cómo elegir el mapa de un nivel:
//   - por defecto: semilla = id del nivel
//   - en el archivo del nivel: LEVEL.map = { seed: 7 } o { shape: 'gemelas' } o { seed: 3, shape: 'bloque' }
//   - para probar: añade ?mapa=7 a la URL del nivel (o ?mapa=clasica para la cocina de antes)
//   - mapas.html muestra los mapas de todos los niveles y deja probar semillas
const MAPGEN = (() => {
  const COLS = 13, ROWS = 8;
  const HEAT = ['pot', 'stew', 'pan', 'wok'];
  const DIR = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] };

  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function makeRng(seed) {
    let s = (hash('sabor' + seed) || 1) >>> 0;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  // ---------- formas de isla (celdas dentro de columnas 2-10, filas 2-5; las penínsulas tocan la pared) ----------
  // Cada forma devuelve una lista de [c, r]. `need` = cuántas estaciones de preparación conviene que quepan.
  const SHAPES = {
    // una isla larga horizontal (la de siempre, pero de largo y posición variables)
    larga(R, need) {
      const r = R.pick([3, 4]), L = R.int(Math.max(4, need + 1), 9), c0 = R.int(2, 11 - L);
      return R.range(c0, c0 + L - 1).map(c => [c, r]);
    },
    // dos islas cortas en la misma fila con un pasillo entre ellas
    gemelas(R) {
      const r = R.pick([3, 4]), a = R.int(2, 4), gap = R.int(1, 2), b = R.int(2, 4), c0 = R.int(2, 11 - (a + gap + b));
      return R.range(c0, c0 + a - 1).concat(R.range(c0 + a + gap, c0 + a + gap + b - 1)).map(c => [c, r]);
    },
    // un bloque central de dos filas (se usa por arriba y por abajo)
    bloque(R) {
      const w = R.int(3, 5), c0 = R.int(3, 10 - w);
      return R.range(c0, c0 + w - 1).flatMap(c => [[c, 3], [c, 4]]);
    },
    // dos islas paralelas (arriba y abajo) que dejan un pasillo central
    carriles(R) {
      const a = R.int(3, 6), b = R.int(3, 6), ca = R.int(2, 11 - a), cb = R.int(2, 11 - b);
      return R.range(ca, ca + a - 1).map(c => [c, 2]).concat(R.range(cb, cb + b - 1).map(c => [c, 5]));
    },
    // isla en forma de T (o T invertida)
    te(R) {
      const L = R.int(5, 7), c0 = R.int(2, 11 - L), up = R.chance(0.5), r = up ? 4 : 3, cm = c0 + Math.floor(L / 2);
      const stem = up ? [[cm, 2], [cm, 3]] : [[cm, 4], [cm, 5]];
      return R.range(c0, c0 + L - 1).map(c => [c, r]).concat(stem);
    },
    // isla en L
    ele(R) {
      const L = R.int(4, 6), c0 = R.int(2, 11 - L), r = R.pick([2, 3]), atLeft = R.chance(0.5), cEnd = atLeft ? c0 : c0 + L - 1;
      return R.range(c0, c0 + L - 1).map(c => [c, r]).concat(R.range(r + 1, Math.min(5, r + 2)).map(rr => [cEnd, rr]));
    },
    // dos columnas verticales escalonadas que dividen la cocina en tres pasillos
    columnas(R) {
      const ca = R.int(3, 5), cb = R.int(7, 9), ra = R.pick([2, 3]), rb = R.pick([2, 3]);
      return R.range(ra, ra + 2).map(r => [ca, r]).concat(R.range(rb, rb + 2).map(r => [cb, r]));
    },
    // penínsulas que salen de la pared de arriba y de la de abajo (zigzag estilo Overcooked) + una isla corta
    peninsulas(R) {
      const ct = R.int(3, 5), cb = R.int(7, 9), cells = [[ct, 1], [ct, 2], [cb, 5], [cb, 6]];
      if (R.chance(0.6)) { const L = R.int(2, 3), r = R.pick([3, 4]), c0 = R.int(ct + 2, Math.max(ct + 2, cb - 1 - L)); R.range(c0, c0 + L - 1).forEach(c => cells.push([c, r])); }
      return cells;
    }
  };
  const ROTATION = ['larga', 'gemelas', 'bloque', 'ele', 'te', 'peninsulas', 'carriles', 'columnas'];
  const SHAPE_NAMES = { larga: 'Isla larga', gemelas: 'Islas gemelas', bloque: 'Bloque central', carriles: 'Carriles', te: 'Isla en T', ele: 'Isla en L', columnas: 'Columnas', peninsulas: 'Penínsulas', clasica: 'Clásica' };

  function makeR(rand) {
    const R = {
      f: rand,
      int: (a, b) => (b < a ? a : a + Math.floor(rand() * (b - a + 1))),
      pick: a => a[Math.floor(rand() * a.length)],
      chance: p => rand() < p,
      range: (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; },
      shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    };
    return R;
  }

  // ---------- un intento de cocina ----------
  function attempt(level, R, shapeName) {
    const key = (c, r) => c + ',' + r;
    const specs = level.left.concat(level.right || []);
    const heat = specs.filter(s => HEAT.includes(s)), prep = specs.filter(s => !HEAT.includes(s));
    const island = new Set(SHAPES[shapeName](R, prep.length).map(([c, r]) => key(c, r)));
    const isFloor = (c, r) => c >= 1 && c <= COLS - 2 && r >= 1 && r <= ROWS - 2 && !island.has(key(c, r));
    const used = new Map();       // key -> spec
    const out = [];
    const put = (sp) => { out.push(sp); for (let i = 0; i < (sp.tall || 1); i++) used.set(key(sp.c, sp.r + i), sp); };
    const frontOf = (c, r, face) => [c + DIR[face][0], r + DIR[face][1]];
    const usable = (c, r, face) => !used.has(key(c, r)) && isFloor(...frontOf(c, r, face));

    // bandeja de salida (2 celdas) en la pared derecha, a una altura al azar
    const cr = R.int(1, ROWS - 3);
    if (!isFloor(COLS - 2, cr) || !isFloor(COLS - 2, cr + 1)) return null;
    put({ kind: 'counter', c: COLS - 1, r: cr, face: 'left', tall: 2 });

    // recorrido del perímetro en sentido horario (pared izquierda de abajo arriba, fondo, pared derecha hacia abajo)
    const path = [];
    for (let r = ROWS - 2; r >= 1; r--) path.push([0, r, 'right']);
    for (let c = 1; c <= COLS - 2; c++) path.push([c, 0, 'down']);
    for (let r = 1; r <= ROWS - 2; r++) path.push([COLS - 1, r, 'left']);
    const free = () => path.filter(([c, r, f]) => usable(c, r, f));

    // ¿los fuegos van en la isla? (estilo Overcooked) solo si la isla da para fuegos + preparación
    const islandCells = [...island].map(k => k.split(',').map(Number));
    const heatOnIsland = heat.length > 0 && islandCells.length >= heat.length + prep.length && R.chance(0.35);

    // cajas y fuegos: tramos seguidos del perímetro, en orden y con huecos al azar
    const runs = [['crate', level.crates.slice()]];
    if (!heatOnIsland && heat.length) runs.push(['heat', heat.slice()]);
    const order = R.chance(0.5) ? runs : runs.slice().reverse();
    const pathIdx = p => path.findIndex(q => q[0] === p[0] && q[1] === p[1]);
    let slackLeft = Math.max(0, free().length - order.reduce((n, [, l]) => n + l.length, 0) - 1);
    let after = -1;        // el siguiente tramo empieza después de esta posición del recorrido
    for (const [type, list] of order) {
      const fp = free().filter(p => pathIdx(p) > after);
      if (fp.length < list.length) return null;
      const skip = Math.min(R.int(0, Math.min(slackLeft, type === 'crate' ? 5 : 4)), fp.length - list.length);
      slackLeft -= skip;
      const seg = fp.slice(skip, skip + list.length);
      seg.forEach(([c, r, face], k) => put(type === 'crate' ? { kind: 'crate', item: list[k], c, r, face } : { kind: list[k], c, r, face }));
      after = pathIdx(seg[seg.length - 1]);
    }

    // estaciones en la isla: preparación (y fuegos si toca) en un tramo seguido de la isla
    const faceFor = (c, r) => {
      const opts = ['down', 'up', 'left', 'right'].filter(f => isFloor(...frontOf(c, r, f)));
      if (!opts.length) return null;
      // en islas de dos filas, cada fila mira hacia afuera
      if (island.has(key(c, r + 1)) && opts.includes('up')) return 'up';
      if (island.has(key(c, r - 1)) && opts.includes('down')) return 'down';
      return opts[0];
    };
    const iorder = islandCells.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]).filter(([c, r]) => !used.has(key(c, r)) && faceFor(c, r));
    const onIsland = (heatOnIsland ? (R.chance(0.5) ? heat.concat(prep) : prep.concat(heat)) : prep).slice();
    const overflow = [];
    if (onIsland.length <= iorder.length) {
      const s0 = R.int(0, iorder.length - onIsland.length);
      onIsland.forEach((kind, k) => { const [c, r] = iorder[s0 + k]; put({ kind, c, r, face: faceFor(c, r) }); });
    } else {
      iorder.forEach(([c, r], k) => put({ kind: onIsland[k], c, r, face: faceFor(c, r) }));
      overflow.push(...onIsland.slice(iorder.length));
    }
    // lo que no cupo en la isla va al perímetro libre (primero la pared, luego la fila de abajo lejos de la salida)
    const bottom = []; for (let c = 1; c <= COLS - 2; c++) bottom.push([c, ROWS - 1, 'up']);
    for (const kind of overflow) {
      const fp = free().concat(bottom.filter(([c, r, f]) => usable(c, r, f) && c < 7));
      if (!fp.length) return null;
      const [c, r, face] = fp[R.int(0, fp.length - 1)]; put({ kind, c, r, face });
    }

    // basura: en la pared derecha, en el fondo o en la esquina de abajo a la izquierda
    const trashOpts = path.filter(([c, r, f]) => c === COLS - 1 && usable(c, r, f)).concat(bottom.filter(([c, r, f]) => (c === 1 || c === COLS - 2) && usable(c, r, f)));
    if (!trashOpts.length) return null;
    { const [c, r, face] = R.pick(trashOpts); put({ kind: 'trash', c, r, face }); }

    // todo lo demás: mesas de apoyo (las de abajo pueden llevar platos limpios)
    for (const [c, r, face] of bottom) if (!used.has(key(c, r))) put({ kind: 'table', c, r, face, plates: true });
    for (const [c, r, face] of path) if (!used.has(key(c, r))) put({ kind: 'table', c, r, face });
    for (const [c, r] of islandCells) if (!used.has(key(c, r))) put({ kind: 'table', c, r, face: faceFor(c, r) || 'down' });

    // ---------- validación: todo lo importante se alcanza caminando desde el punto de inicio ----------
    const floorCells = [];
    for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) if (isFloor(c, r)) floorCells.push([c, r]);
    const spawn = floorCells.slice().sort((a, b) => Math.hypot(a[0] - 6, a[1] - 4.2) - Math.hypot(b[0] - 6, b[1] - 4.2))[0];
    if (!spawn) return null;
    const seen = new Set([key(...spawn)]), q = [spawn];
    while (q.length) { const [c, r] = q.shift(); for (const [dx, dy] of Object.values(DIR)) { const n = [c + dx, r + dy]; if (isFloor(...n) && !seen.has(key(...n))) { seen.add(key(...n)); q.push(n); } } }
    if (seen.size !== floorCells.length) return null;                     // el piso no puede quedar partido en dos
    const reach = sp => { for (let i = 0; i < (sp.tall || 1); i++) if (seen.has(key(...frontOf(sp.c, sp.r + i, sp.face)))) return true; return false; };
    if (out.some(sp => sp.kind !== 'table' && !reach(sp))) return null;
    // mesas que quedaron tapadas por una isla o península: son encimeras de decoración (nadie llega a usarlas)
    out.forEach(sp => { if (sp.kind === 'table' && !reach(sp)) { sp.kind = 'deco'; delete sp.plates; } });
    if (out.filter(sp => sp.kind === 'table' && sp.plates && reach(sp)).length < Math.max(2, level.plates || 2)) return null;
    if (out.filter(sp => sp.kind === 'table' && reach(sp)).length < 8) return null;      // regla de Sing: muchas mesas de apoyo
    // el ayudante aparece en otra celda libre cerca del jugador
    const helperCell = floorCells.filter(([c, r]) => !(c === spawn[0] && r === spawn[1])).sort((a, b) => Math.hypot(a[0] - spawn[0], a[1] - (spawn[1] + 1.5)) - Math.hypot(b[0] - spawn[0], b[1] - (spawn[1] + 1.5)))[0];
    return { shape: shapeName, stations: out, island: islandCells, spawn, helper: helperCell || spawn };
  }

  // cocina de antes (cajas arriba, fuegos a la izquierda, isla en la fila 3): de respaldo y para comparar
  function classic(level) {
    const out = [], used = new Set(), key = (c, r) => c + ',' + r;
    const put = sp => { out.push(sp); for (let i = 0; i < (sp.tall || 1); i++) used.add(key(sp.c, sp.r + i)); };
    level.crates.forEach((it, i) => put({ kind: 'crate', item: it, c: 2 + i, r: 0, face: 'down' }));
    const specs = level.left.concat(level.right || []);
    let row = 1; specs.filter(s => HEAT.includes(s)).forEach(s => put({ kind: s, c: 0, r: row++, face: 'right' }));
    const prep = specs.filter(s => !HEAT.includes(s)), c0 = Math.round((COLS - prep.length) / 2);
    prep.forEach((s, i) => put({ kind: s, c: c0 + i, r: 3, face: 'down' }));
    put({ kind: 'counter', c: COLS - 1, r: 2, face: 'left', tall: 2 });
    put({ kind: 'trash', c: COLS - 1, r: ROWS - 2, face: 'left' });
    const t = (c, r, face, plates) => { if (!used.has(key(c, r))) put({ kind: 'table', c, r, face, plates }); };
    for (let c = 1; c < COLS - 1; c++) t(c, ROWS - 1, 'up', true);
    for (let c = 1; c < COLS - 1; c++) t(c, 0, 'down');
    for (let r = 1; r < ROWS - 1; r++) t(0, r, 'right');
    for (let r = 1; r < ROWS - 1; r++) t(COLS - 1, r, 'left');
    for (let c = 2; c < COLS - 2; c++) t(c, 3, 'down');
    const island = []; for (let c = 2; c < COLS - 2; c++) island.push([c, 3]);
    return { shape: 'clasica', stations: out, island, spawn: [6, 4], helper: [6, 5] };
  }

  // ---------- API ----------
  function generate(level, opts) {
    opts = opts || {};
    const lm = level.map || {};
    const seed = opts.seed != null ? opts.seed : (lm.seed != null ? lm.seed : level.id);
    let shape = opts.shape || lm.shape;
    if (shape === 'clasica' || seed === 'clasica') return Object.assign(classic(level), { seed: 'clasica', name: SHAPE_NAMES.clasica });
    const R = makeR(makeRng(seed));
    const names = Object.keys(SHAPES);
    // con la semilla por defecto (el id del nivel), los niveles de un mismo mundo rotan formas distintas
    // para que no se repitan seguidas; con otra semilla, la forma también sale al azar
    const m = /^(\d+)-(\d+)$/.exec(String(level.id));
    if ((!shape || !SHAPES[shape]) && m && String(seed) === String(level.id)) shape = ROTATION[(+m[2] - 1 + (+m[1] - 1) * 5) % ROTATION.length];
    if (!shape || !SHAPES[shape]) shape = R.pick(names);
    for (let i = 0; i < 80; i++) {
      // si una forma no encaja con este nivel (muchas estaciones), tras varios intentos se prueba otra
      const sh = i < 30 ? shape : R.pick(names);
      const m = attempt(level, R, sh);
      if (m) return Object.assign(m, { seed, name: SHAPE_NAMES[m.shape] });
    }
    return Object.assign(classic(level), { seed, name: SHAPE_NAMES.clasica });
  }
  return { generate, SHAPES: Object.keys(SHAPES), SHAPE_NAMES, COLS, ROWS };
})();
