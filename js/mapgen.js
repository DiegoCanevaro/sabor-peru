// ================= GENERADOR PROCEDURAL DE COCINAS =================
// Cada nivel recibe su propia distribución de cocina a partir de una semilla (por defecto, el id del nivel),
// así que el mismo nivel siempre se ve igual, pero cada nivel es distinto.
//
// La cocina sigue siendo una cuadrícula de 13 x 8 celdas:
//   - el perímetro son encimeras (las esquinas son solo decoración en 3D)
//   - el interior (columnas 1-11, filas 1-6) es el piso, con islas de formas variadas
//   - la bandeja de salida puede ir en cualquier pared (en 3D se abre ahí la ventanilla de PEDIDOS)
//   - cajas, ollas, tablas y demás estaciones van en grupos: a veces juntas, a veces repartidas por la cocina
//   - los platos limpios empiezan en mesas al azar, juntos o separados, y vuelven a esas mismas mesas
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
    const cellsOf = sp => { const o = []; for (let i = 0; i < (sp.tall || 1); i++) for (let j = 0; j < (sp.wide || 1); j++) o.push([sp.c + j, sp.r + i]); return o; };
    const put = sp => { out.push(sp); cellsOf(sp).forEach(([c, r]) => used.set(key(c, r), sp)); };
    const frontOf = (c, r, face) => [c + DIR[face][0], r + DIR[face][1]];
    const usable = (c, r, face) => !!face && !used.has(key(c, r)) && isFloor(...frontOf(c, r, face));

    // anillo del perímetro en sentido horario (sin esquinas): pared izquierda, fondo, pared derecha y fila de abajo
    const ring = [];
    for (let r = ROWS - 2; r >= 1; r--) ring.push([0, r, 'right']);
    for (let c = 1; c <= COLS - 2; c++) ring.push([c, 0, 'down']);
    for (let r = 1; r <= ROWS - 2; r++) ring.push([COLS - 1, r, 'left']);
    for (let c = COLS - 2; c >= 1; c--) ring.push([c, ROWS - 1, 'up']);

    // en la isla, cada celda mira hacia un lado libre (en islas de dos filas, hacia afuera)
    const faceFor = (c, r) => {
      const opts = ['down', 'up', 'left', 'right'].filter(f => isFloor(...frontOf(c, r, f)));
      if (!opts.length) return null;
      if (island.has(key(c, r + 1)) && opts.includes('up')) return 'up';
      if (island.has(key(c, r - 1)) && opts.includes('down')) return 'down';
      return opts[0];
    };
    const islandCells = [...island].map(k => k.split(',').map(Number));
    // orden de la isla: filas y columnas en recorrido "serpiente" para que los tramos seguidos queden pegados
    const iorder = islandCells.slice().sort((a, b) => a[1] - b[1] || (a[1] % 2 ? b[0] - a[0] : a[0] - b[0])).map(([c, r]) => [c, r, faceFor(c, r)]);

    // ---------- bandeja de salida (2 celdas) en cualquier pared ----------
    const side = R.pick(['right', 'left', 'top', 'bottom']);
    let counter;
    if (side === 'right' || side === 'left') { const c = side === 'right' ? COLS - 1 : 0, r = R.int(1, ROWS - 3); counter = { kind: 'counter', c, r, face: side === 'right' ? 'left' : 'right', tall: 2 }; }
    else { const r = side === 'top' ? 0 : ROWS - 1, c = R.int(1, COLS - 3); counter = { kind: 'counter', c, r, face: side === 'top' ? 'down' : 'up', wide: 2 }; }
    if (cellsOf(counter).some(([c, r]) => !isFloor(...frontOf(c, r, counter.face)))) return null;
    put(counter);

    // ---------- grupos de estaciones (cada grupo va junto; grupos distintos van separados) ----------
    const groups = [];
    const G = (items, pref) => groups.push({ items, pref });
    // cajas: 1 a 3 grupos repartidos por la cocina
    {
      const cr = R.shuffle(level.crates), k = Math.min(cr.length, R.pick([1, 2, 2, 3, 3]));
      const cuts = R.shuffle(R.range(1, cr.length - 1)).slice(0, k - 1).sort((a, b) => a - b);
      let a = 0; for (const b of cuts.concat([cr.length])) { G(cr.slice(a, b).map(it => ({ kind: 'crate', item: it })), R.chance(0.15) ? 'island' : 'wall'); a = b; }
    }
    // fuegos: las ollas a veces juntas, a veces separadas; sartén, wok y olla del guiso sueltos o junto a una olla
    {
      const pots = heat.filter(h => h === 'pot').map(kind => ({ kind })), others = heat.filter(h => h !== 'pot').map(kind => ({ kind }));
      const hg = [];
      if (pots.length > 1 && R.chance(0.55)) hg.push(pots); else pots.forEach(p => hg.push([p]));
      others.forEach(o => { if (hg.length && R.chance(0.4)) R.pick(hg).push(o); else hg.push([o]); });
      hg.forEach(g => G(g, R.chance(0.3) ? 'island' : 'any'));
    }
    // preparación: las tablas a veces juntas; el resto suelto o en pareja al azar
    {
      const boards = prep.filter(p => p === 'board').map(kind => ({ kind })), others = prep.filter(p => p !== 'board').map(kind => ({ kind }));
      const pg = [];
      if (boards.length > 1 && R.chance(0.5)) pg.push(boards); else boards.forEach(b => pg.push([b]));
      R.shuffle(others).forEach(o => { if (pg.length && R.chance(0.3)) R.pick(pg).push(o); else pg.push([o]); });
      pg.forEach(g => G(R.shuffle(g), R.chance(0.65) ? 'island' : 'any'));
    }
    // platos limpios: juntos o separados, en cualquier mesa
    {
      const n = Math.max(2, level.plates || 2), pl = Array.from({ length: n }, () => ({ kind: 'table', plates: true }));
      if (R.chance(0.35)) G(pl, 'any'); else pl.forEach(p => G([p], 'any'));
    }
    G([{ kind: 'trash' }], 'wall');

    // dónde cabe un grupo: tramos seguidos de celdas libres en la pared o en la isla
    const runs = (list, n, cyclic) => {
      const res = [], L = list.length;
      for (let i = 0; i < (cyclic ? L : L - n + 1); i++) {
        const seg = []; let ok = true;
        for (let k = 0; k < n && ok; k++) {
          const cell = list[(i + k) % L];
          if (!usable(cell[0], cell[1], cell[2])) ok = false;
          else if (k && Math.abs(cell[0] - seg[k - 1][0]) + Math.abs(cell[1] - seg[k - 1][1]) > 2) ok = false;    // pegadas (las esquinas cuentan)
          seg.push(cell);
        }
        if (ok) res.push(seg);
      }
      return res;
    };
    // primero los grupos grandes, después los sueltos (orden al azar entre iguales)
    for (const grp of R.shuffle(groups).sort((a, b) => b.items.length - a.items.length)) {
      const n = grp.items.length;
      const onWall = runs(ring, n, true), onIsland = runs(iorder, n, false);
      let cand = grp.pref === 'island' ? (onIsland.length ? onIsland : onWall) : grp.pref === 'wall' ? (onWall.length ? onWall : onIsland) : onWall.concat(onIsland);
      if (!cand.length) return null;
      const seg = R.pick(cand);
      grp.items.forEach((it, k) => put(Object.assign({}, it, { c: seg[k][0], r: seg[k][1], face: seg[k][2] })));
    }

    // todo lo demás: mesas de apoyo
    for (const [c, r, face] of ring) if (!used.has(key(c, r))) put({ kind: 'table', c, r, face });
    for (const [c, r, face] of iorder) if (!used.has(key(c, r))) put({ kind: 'table', c, r, face: face || 'down' });

    // ---------- validación: todo lo importante se alcanza caminando desde el punto de inicio ----------
    const floorCells = [];
    for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) if (isFloor(c, r)) floorCells.push([c, r]);
    const spawn = floorCells.slice().sort((a, b) => Math.hypot(a[0] - 6, a[1] - 4.2) - Math.hypot(b[0] - 6, b[1] - 4.2))[0];
    if (!spawn) return null;
    const seen = new Set([key(...spawn)]), q = [spawn];
    while (q.length) { const [c, r] = q.shift(); for (const [dx, dy] of Object.values(DIR)) { const n = [c + dx, r + dy]; if (isFloor(...n) && !seen.has(key(...n))) { seen.add(key(...n)); q.push(n); } } }
    if (seen.size !== floorCells.length) return null;                     // el piso no puede quedar partido en dos
    const reach = sp => cellsOf(sp).some(([c, r]) => seen.has(key(...frontOf(c, r, sp.face))));
    if (out.some(sp => (sp.kind !== 'table' || sp.plates) && !reach(sp))) return null;
    // mesas que quedaron tapadas por una isla o península: son encimeras de decoración (nadie llega a usarlas)
    out.forEach(sp => { if (sp.kind === 'table' && !reach(sp)) sp.kind = 'deco'; });
    if (out.filter(sp => sp.kind === 'table' && !sp.plates).length < 8) return null;      // regla de Sing: muchas mesas de apoyo
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
