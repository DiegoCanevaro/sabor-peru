// ================= DIBUJO 3D (Three.js) =================
// Sustituye a render.js. La lógica del juego (estaciones, pedidos, ayudante, HUD) no cambia: solo cambia cómo se dibuja.
// El mapa 2D (900x560 px) se proyecta sobre el suelo 3D: 1 unidad = 36 px. La encimera mide 1 unidad de alto.
// El canvas 2D original (#c) queda encima como capa de interfaz: barras de progreso, avisos, carteles y el toast.
// Modelos de cocina: KayKit Restaurant Bits (Kay Lousberg, CC0). Comida peruana, licuadora, chefs y clientes: hechos en código.

const U3 = 36;
const X3 = x => (x - W / 2) / U3, Z3 = y => (y - H / 2) / U3;
const TOP = 1.0;                 // altura de la encimera
const V3 = { ready: false, kk: {}, mats: {}, st: new Map(), hl: null, t: 0, last: 0, steam: [] };

// ---------- escenario: el canvas WebGL va debajo del canvas 2D original ----------
(function setupStage() {
  const c2 = document.getElementById('c');
  const stage = document.createElement('div'); stage.id = 'stage';
  c2.parentNode.insertBefore(stage, c2);
  const c3 = document.createElement('canvas'); c3.id = 'c3d'; c3.width = W; c3.height = H;
  stage.appendChild(c3); stage.appendChild(c2);
  V3.c3 = c3;
})();
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

const renderer3 = new THREE.WebGLRenderer({ canvas: V3.c3, antialias: true });
renderer3.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer3.setSize(W, H, false);
renderer3.outputEncoding = THREE.sRGBEncoding;
renderer3.shadowMap.enabled = true;
renderer3.shadowMap.type = THREE.PCFSoftShadowMap;
const scene3 = new THREE.Scene();
scene3.background = new THREE.Color('#2b180b');
const cam3 = new THREE.PerspectiveCamera(35, W / H, 0.5, 200);
cam3.position.set(-0.4, 21, 19.5);
cam3.lookAt(-0.4, 0, 1.3);

scene3.add(new THREE.HemisphereLight('#fff4e0', '#7a5a3a', 0.62));
const sun3 = new THREE.DirectionalLight('#fff0d4', 0.72);
sun3.position.set(-7, 22, 11);
sun3.castShadow = true;
sun3.shadow.mapSize.set(2048, 2048);
Object.assign(sun3.shadow.camera, { left: -19, right: 19, top: 15, bottom: -15, near: 1, far: 70 });
sun3.shadow.bias = -0.0005;
scene3.add(sun3);

// ---------- utilidades ----------
function M(color, o) {
  const k = color + JSON.stringify(o || {});
  return V3.mats[k] || (V3.mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, o || {})));
}
function mesh(geo, m, cast) {
  const x = new THREE.Mesh(geo, m); x.castShadow = cast !== false; x.receiveShadow = true; return x;
}
function canvasTex(w, h, paint, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
function KK(name, s) {                       // copia de un modelo KayKit
  const src = V3.kk[name]; if (!src) return new THREE.Group();
  const o = src.clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0);
  if (s) o.scale.setScalar(s);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return o;
}
const rnd = (a, b) => a + Math.random() * (b - a);

// ================= INGREDIENTES Y PLATOS (modelos) =================
function lumpy(r, sx, sy, sz, color, amount) {      // papa / palta / pollo: esfera deformada, look low-poly
  const geo = new THREE.SphereGeometry(r, 12, 9);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 1 + Math.sin(p.getX(i) * 17.3 + p.getY(i) * 7.1) * amount + Math.cos(p.getZ(i) * 13.7) * amount;
    p.setXYZ(i, p.getX(i) * k * sx, p.getY(i) * k * sy, p.getZ(i) * k * sz);
  }
  geo.computeVertexNormals();
  return mesh(geo, M(color, { flatShading: true }));
}
function bowlWith(fill, extra) {
  const g = new THREE.Group();
  g.add(KK('bowl', 0.6));
  const c = mesh(new THREE.CylinderGeometry(0.235, 0.2, 0.07, 22), M(fill, { roughness: 0.32 }));
  c.position.y = 0.13; g.add(c);
  if (extra) extra(g);
  return g;
}
function chickenBits(g, n, y, spread, color) {
  for (let i = 0; i < n; i++) {
    const b = mesh(new THREE.CapsuleGeometry(0.025, 0.09, 3, 6), M(color || '#e3c48f'));
    b.position.set(rnd(-spread, spread), y + rnd(0, 0.04), rnd(-spread, spread));
    b.rotation.set(Math.PI / 2, 0, rnd(0, 3)); g.add(b);
  }
}
let _lecheTex = null, _galletaTex = null;
const ITEM3 = {
  papa_raw: () => { const g = new THREE.Group(); const p = KK('food_ingredient_potato', 0.72); p.position.y = 0.28; g.add(p); return g; },
  // papa amarilla cocida y pelada
  papa_cooked: () => { const g = new THREE.Group(); const p = lumpy(0.22, 1.3, 0.85, 1, '#f1c840', 0.05); p.position.y = 0.19; g.add(p); return g; },
  papa_sliced: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 16), M('#f6d257'));
      s.position.set(-0.18 + i * 0.12, 0.06 + i * 0.012, 0); s.rotation.z = -0.25; g.add(s);
    }
    return g;
  },
  // queso fresco: rueda blanca
  queso: () => {
    const g = new THREE.Group();
    const w = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 22), M('#f8f4e6', { roughness: 0.9 }));
    w.position.y = 0.1; g.add(w);
    const top = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.005, 22), M('#ede6cf'));
    top.position.y = 0.203; g.add(top);
    return g;
  },
  // ají amarillo (naranja intenso), echado de lado
  aji: () => {
    const g = new THREE.Group();
    const pts = [[0, 0], [0.06, 0.05], [0.12, 0.14], [0.15, 0.25], [0.15, 0.33], [0.12, 0.39], [0.05, 0.42], [0, 0.42]].map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(pts, 14), ps = geo.attributes.position;
    for (let i = 0; i < ps.count; i++) { const y = ps.getY(i); ps.setX(i, ps.getX(i) + (0.42 - y) * (0.42 - y) * 0.35); }   // punta curvada
    geo.computeVertexNormals();
    const body = mesh(geo, M('#f5a01a', { roughness: 0.35 }));
    const stem = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.1, 8), M('#4f7a28'));
    stem.position.y = 0.46;
    const pep = new THREE.Group(); pep.add(body, stem);
    pep.rotation.z = Math.PI / 2; pep.rotation.y = 0.35; pep.position.set(0.2, 0.15, 0);
    g.add(pep); return g;
  },
  // tarro de leche evaporada (genérico, sin marca)
  leche: () => {
    if (!_lecheTex) _lecheTex = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#1f5fa8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fbf6ea'; c.fillRect(0, 34, w, 60);
      c.fillStyle = '#c0392b'; c.font = 'bold 40px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('LECHE', w / 2, 58);
      c.fillStyle = '#1f5fa8'; c.font = 'bold 17px Arial'; c.fillText('EVAPORADA', w / 2, 84);
    });
    const g = new THREE.Group();
    const metal = M('#b9bec4', { metalness: 0.6, roughness: 0.35 });
    const can = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 22), [new THREE.MeshStandardMaterial({ map: _lecheTex, roughness: 0.5 }), metal, metal]);
    can.position.y = 0.17; g.add(can); return g;
  },
  // galletas de soda
  galleta: () => {
    if (!_galletaTex) _galletaTex = canvasTex(64, 64, (c, w, h) => {
      c.fillStyle = '#ebcf93'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#c9a463';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(10 + i * 15, 10 + j * 15, 2, 0, 7); c.fill(); }
    });
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ map: _galletaTex, roughness: 0.85 });
    for (let i = 0; i < 4; i++) {
      const b = mesh(new THREE.BoxGeometry(0.3, 0.035, 0.3), m);
      b.position.y = 0.02 + i * 0.04; b.rotation.y = i * 0.12 - 0.15; g.add(b);
    }
    return g;
  },
  salsa: () => bowlWith('#f3c13a'),
  salsa_aji: () => bowlWith('#ef7d1a'),
  masa: () => bowlWith('#f2c94c', g => { const m = mesh(new THREE.SphereGeometry(0.19, 14, 8, 0, 6.3, 0, 1.4), M('#f2c94c', { roughness: 0.5 })); m.position.y = 0.1; g.add(m); }),
  // media masa: queda una sola capa en el bowl
  masa1: () => bowlWith('#f2c94c', g => { const m = mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, 6.3, 0, 1.2), M('#f2c94c', { roughness: 0.5 })); m.scale.y = 0.6; m.position.y = 0.12; g.add(m); }),
  guiso: () => bowlWith('#eab73f', g => chickenBits(g, 7, 0.16, 0.12)),
  arroz_cooked: () => bowlWith('#fbfaf3', g => { const d = mesh(new THREE.SphereGeometry(0.19, 14, 8, 0, 6.3, 0, 1.4), M('#fbfaf3', { roughness: 0.95 })); d.position.y = 0.1; g.add(d); }),
  arroz_raw: () => {
    const g = new THREE.Group();
    const pts = [[0, 0], [0.2, 0.01], [0.24, 0.15], [0.22, 0.32], [0.17, 0.38], [0, 0.39]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(mesh(new THREE.LatheGeometry(pts, 12), M('#cdb07a', { flatShading: true })));
    const r = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), M('#fbfaf3')); r.position.y = 0.385; g.add(r);
    return g;
  },
  pollo_raw: () => { const g = new THREE.Group(); const p = lumpy(0.2, 1.4, 0.55, 1, '#f1b1a0', 0.06); p.position.y = 0.11; g.add(p); return g; },
  pollo_cooked: () => { const g = new THREE.Group(); const p = lumpy(0.2, 1.4, 0.55, 1, '#e9d0a0', 0.06); p.position.y = 0.11; g.add(p); return g; },
  pollo_shred: () => { const g = new THREE.Group(); chickenBits(g, 12, 0.03, 0.15); return g; },
  palta: () => { const g = new THREE.Group(); const p = lumpy(0.18, 1, 1.3, 1, '#3d5f22', 0.03); p.rotation.z = 1.2; p.position.y = 0.17; g.add(p); return g; },
  palta_sliced: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16, 1, false, 0, Math.PI), M('#a8cf5c'));
      s.position.set(-0.15 + i * 0.1, 0.04 + i * 0.01, 0); s.rotation.z = -0.2; g.add(s);
    }
    return g;
  }
};

// Mundo 2 (chifa)
let _sillaoTex = null;
Object.assign(ITEM3, {
  // atado de cebolla china: tallos verdes con la base blanca
  cebolla_china: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const st3 = new THREE.Group();
      const white = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.16, 8), M('#f3f1e4')); white.position.y = 0.08;
      const green = mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 8), M('#4f9a32')); green.position.y = 0.37;
      st3.add(white, green); st3.rotation.z = Math.PI / 2 + (i - 2) * 0.05; st3.position.set(-0.24, 0.05, (i - 2) * 0.05);
      g.add(st3);
    }
    const tie = mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 14), M('#c0392b')); tie.rotation.y = Math.PI / 2; tie.position.set(-0.05, 0.05, 0); g.add(tie);
    return g;
  },
  // cebolla china picada: rodajitas verdes y blancas
  cebolla_picada: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const r = mesh(new THREE.TorusGeometry(0.03, 0.012, 5, 10), M(i % 4 ? '#5aa83a' : '#eef0e0'));
      r.rotation.x = Math.PI / 2 + rnd(-0.4, 0.4); r.position.set(rnd(-0.16, 0.16), 0.02 + rnd(0, 0.03), rnd(-0.12, 0.12)); g.add(r);
    }
    return g;
  },
  // botella de sillao
  sillao: () => {
    if (!_sillaoTex) _sillaoTex = canvasTex(128, 64, (c, w, h) => {
      c.fillStyle = '#f1d9a8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.fillRect(0, 22, w, 20);
      c.fillStyle = '#fbe9b7'; c.font = 'bold 16px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SILLAO', w / 2, 33);
    });
    const g = new THREE.Group(), glass = M('#3a1d12', { roughness: 0.2 });
    const body = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 16), [new THREE.MeshStandardMaterial({ map: _sillaoTex, roughness: 0.5 }), glass, glass]); body.position.y = 0.15; g.add(body);
    const neck = mesh(new THREE.CylinderGeometry(0.04, 0.1, 0.12, 14), glass); neck.position.y = 0.36; g.add(neck);
    const capB = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 12), M('#c0392b')); capB.position.y = 0.45; g.add(capB);
    return g;
  },
  // huevos (dos, uno apoyado en el otro)
  huevo: () => {
    const g = new THREE.Group();
    [[-0.08, 0, 0], [0.1, 0.02, 0.4]].forEach(([x, z, r]) => { const e = mesh(new THREE.SphereGeometry(0.12, 16, 12), M('#e9cfa6', { roughness: 0.6 })); e.scale.set(1, 1.3, 1); e.rotation.z = r; e.position.set(x, 0.15, z); g.add(e); });
    return g;
  },
  // pollo crudo cortado en cuadros
  pollo_cuadros: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 9; i++) { const b = mesh(new THREE.BoxGeometry(0.09, 0.07, 0.09), M('#f1b1a0', { roughness: 0.55 })); b.position.set(-0.11 + (i % 3) * 0.11 + rnd(-0.02, 0.02), 0.04 + rnd(0, 0.03), -0.11 + Math.floor(i / 3) * 0.11); b.rotation.y = rnd(0, 1); g.add(b); }
    return g;
  },
  // chaufa recién salteado (en un tazón)
  chaufa: () => bowlWith('#c98b3c', g => chaufaMound(g, 0.1, 0.17))
});
// montículo de arroz chaufa: arroz dorado por el sillao, trocitos de pollo y cebolla china
function chaufaMound(g, y, r) {
  const d = mesh(new THREE.SphereGeometry(r, 18, 10, 0, 6.3, 0, 1.45), M('#c98b3c', { roughness: 0.9 }));
  d.position.y = y; g.add(d);
  for (let i = 0; i < 14; i++) {
    const a = rnd(0, 6.28), k = rnd(0.2, 0.85), px = Math.cos(a) * r * k, pz = Math.sin(a) * r * k;
    const py = y + Math.sqrt(Math.max(0, r * r - px * px - pz * pz)) * 0.97;
    // pollo en cuadros, tiras de huevo y cebolla china
    const bit = i % 4 === 0 ? mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), M('#f0dcae')) : i % 4 === 1 ? mesh(new THREE.BoxGeometry(0.07, 0.015, 0.025), M('#f6c531')) : mesh(new THREE.TorusGeometry(0.018, 0.008, 4, 8), M('#4f9a32'));
    bit.position.set(px, py, pz); bit.rotation.set(rnd(0, 3), rnd(0, 3), 0); g.add(bit);
  }
}
const LAYER3 = { masa: ['#f2c94c', 0.12], relleno: ['#e9d3a0', 0.1], palta: ['#7fb54a', 0.07] };
function plateModel(parts) {
  const g = new THREE.Group();
  g.add(KK('plate', 0.8));
  const has = x => parts.includes(x), y0 = 0.08;
  // Causa: cilindro con las capas en el orden en que se pusieron
  const layers = parts.filter(p => LAYER3[p]);
  if (layers.length) {
    let y = y0;
    layers.forEach(l => {
      const [col, h] = LAYER3[l];
      const c = mesh(new THREE.CylinderGeometry(0.2, 0.2, h, 26), M(col, { roughness: l === 'palta' ? 0.45 : 0.7 }));
      c.position.y = y + h / 2; y += h; g.add(c);
    });
    if (layers.length === 4) {
      const o = mesh(new THREE.SphereGeometry(0.045, 10, 8), M('#2a1a2a', { roughness: 0.3 })); o.scale.set(1, 0.8, 1.2); o.position.set(0.06, y + 0.03, 0); g.add(o);
    }
  }
  const alone = !has('arroz') && !has('guiso');
  // papa a la huancaína: hoja de lechuga + rodajas, salsa por encima y, completa, huevo y aceituna
  if (has('papa')) {
    const pos = alone ? [0, 0] : [0.18, -0.1];
    const lettuce = mesh(new THREE.SphereGeometry(0.24, 12, 6, 0, 6.3, 0, 0.7), M('#6fae3b', { side: THREE.DoubleSide, flatShading: true }));
    lettuce.scale.set(1, 0.35, 0.8); lettuce.position.set(pos[0], y0 - 0.02, pos[1]);
    if (alone) g.add(lettuce);
    for (let i = 0; i < 3; i++) {
      const s = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), M('#f6d257'));
      s.position.set(pos[0] - 0.1 + i * 0.1, y0 + 0.04 + i * 0.01, pos[1]); s.rotation.z = -0.25; g.add(s);
    }
  }
  if (has('salsa')) {
    const s = mesh(new THREE.SphereGeometry(0.22, 18, 10), M('#f3c13a', { roughness: 0.28 }));
    s.scale.set(1.1, 0.25, 0.85); s.position.set(0, y0 + (has('papa') ? 0.1 : 0.02), 0); g.add(s);
    if (has('papa')) {
      const egg = new THREE.Group();
      const wht = mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, 6.3, 0, 1.57), M('#fbfbf5')); wht.rotation.x = Math.PI / 2;
      const yol = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 12), M('#f2a81d')); yol.position.z = 0.003; yol.rotation.x = Math.PI / 2;
      egg.add(wht, yol); egg.rotation.x = -Math.PI / 2; egg.position.set(-0.1, y0 + 0.19, 0.05); g.add(egg);
      const o = mesh(new THREE.SphereGeometry(0.04, 10, 8), M('#2a1a2a', { roughness: 0.3 })); o.scale.set(1, 0.8, 1.25); o.position.set(0.1, y0 + 0.19, -0.03); g.add(o);
    }
  }
  if (has('chaufa')) chaufaMound(g, y0, 0.26);      // servido en forma de cúpula, como en el chifa
  if (has('arroz')) {
    const d = mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, 6.3, 0, 1.4), M('#fbfaf3', { roughness: 0.95 }));
    d.position.set(-0.17, y0, -0.1); g.add(d);
  }
  if (has('guiso')) {
    const s = mesh(new THREE.SphereGeometry(0.17, 16, 8), M('#eab73f', { roughness: 0.32 }));
    s.scale.set(1.15, 0.28, 0.85); s.position.set(0, y0 + 0.02, 0.13); g.add(s);
    chickenBits(g, 6, y0 + 0.05, 0.1);
  }
  return g;
}
function itemModel(key) {
  if (key.startsWith('plate|')) return plateModel(key.slice(6) ? key.slice(6).split(',') : []);
  if (key.startsWith('set|')) {                       // varios ingredientes juntos (bowl, sartén)
    const g = new THREE.Group(), list = key.slice(4).split(',');
    list.forEach((k, i) => {
      const m = itemModel(k), a = i / list.length * Math.PI * 2;
      m.scale.setScalar(0.55); m.position.set(Math.cos(a) * 0.12, 0.05, Math.sin(a) * 0.12); g.add(m);
    });
    return g;
  }
  if (ITEM3[key]) return ITEM3[key]();
  const g = new THREE.Group(); const s = mesh(new THREE.SphereGeometry(0.15, 10, 8), M('#999')); s.position.y = 0.15; g.add(s); return g;
}
const itemKey = it => !it ? null : it.type === 'plate' ? 'plate|' + it.parts.join(',') : (it.type === 'masa' && it.n === 1) ? 'masa1' : it.type;
function setSlot(holder, key) {                       // cambia el modelo de un "hueco" solo si cambió lo que contiene
  if (holder.userData.key === key) return;
  holder.userData.key = key;
  holder.clear();
  if (key) holder.add(itemModel(key));
}

// ================= ESCENARIO SEGÚN EL MUNDO =================
// Mundo 1: restaurante menú de mercado limeño · Mundo 2: chifa (paredes rojas, faroles de papel, letrero lacado)
const THEME = (LEVEL.world || 1) === 2 ? {
  floorA: '#f1e6cf', floorB: '#8f2f28', tile: '#f6efe0', tileLine: '#d6c7a8', band: '#c9a227', wall: '#a51b20',
  brick: '#6e2a22', brickLine: '#4d1a14', capCol: '#c9a227'
} : {
  floorA: '#ece2cc', floorB: '#c4785a', tile: '#f4f1e8', tileLine: '#c9c3b2', band: '#2f6fb3', wall: '#f0be4a',
  brick: '#a9553a', brickLine: '#7d3a26', capCol: '#8a3b28'
};
function chifaSignTex() {
  const dish = LEVEL.dishes.map(d => DISHES[d].name).join(' · ');
  return canvasTex(512, 320, (c, w, h) => {
    c.fillStyle = '#c9a227'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#7d1418'; c.fillRect(12, 12, w - 24, h - 24);
    c.strokeStyle = '#e8c55a'; c.lineWidth = 4; c.strokeRect(26, 26, w - 52, h - 52);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#f4d35e'; c.font = '84px Kitchen, Georgia, serif'; c.fillText('CHIFA', w / 2, 92);
    c.fillStyle = '#fbe9b7'; let f = 30; do { c.font = 'bold ' + f + 'px Georgia, serif'; f--; } while (c.measureText(dish).width > w - 80 && f > 14);
    c.fillText(dish, w / 2, 170);
    c.fillStyle = '#f4d35e'; c.font = 'bold 40px Georgia, serif'; c.fillText('S/ 15.00', w / 2, 240);
  });
}
// faroles de papel rojos con borla dorada
function lantern3() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.34, 16, 12), M('#d6202a', { roughness: 0.6, emissive: '#5a0a0a' }), false); body.scale.y = 0.85; g.add(body);
  [0.3, -0.3].forEach(y => { const r = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 14), M('#c9a227', { metalness: 0.5, roughness: 0.4 }), false); r.position.y = y; g.add(r); });
  const tassel = mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.28, 8), M('#e8c55a'), false); tassel.position.y = -0.48; g.add(tassel);
  const cord = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6), M('#2b1a10'), false); cord.position.y = 0.52; g.add(cord);
  return g;
}
function menuBoardTex() {
  const ent = LEVEL.dishes.filter(d => DISHES[d].course !== 'segundo').map(d => DISHES[d].name);
  const seg = LEVEL.dishes.filter(d => DISHES[d].course === 'segundo').map(d => DISHES[d].name);
  return canvasTex(512, 320, (c, w, h) => {
    c.fillStyle = '#7a4e2a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#23352a'; c.fillRect(14, 14, w - 28, h - 28);
    c.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 40; i++) c.fillRect(rnd(14, w), rnd(14, h), rnd(20, 90), 2);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const hand = s => 'bold ' + s + 'px "Segoe Print","Comic Sans MS","Chalkboard SE",cursive';
    c.fillStyle = '#f4e04c'; c.font = '46px Kitchen, sans-serif'; c.fillText('MENÚ DEL DÍA', w / 2, 58);
    c.fillStyle = '#fbf6ea';
    const line = (t, y) => { let f = 26; do { c.font = hand(f); f--; } while (c.measureText(t).width > w - 60 && f > 12); c.fillText(t, w / 2, y); };
    const lines = [];
    if (ent.length) lines.push('Entrada: ' + ent.join(' / '));
    if (seg.length) lines.push('Segundo: ' + seg.join(' / '));
    lines.forEach((t, i) => line(t, (lines.length === 1 ? 150 : 128) + i * 44));
    c.fillStyle = '#f39a16'; c.font = hand(40); c.fillText('S/ 12.00', w / 2, 246);
  });
}
function buildWorld() {
  // la cocina queda cerrada por las encimeras del perímetro (stations.js): las paredes van justo detrás
  const X0 = X3(GX) - 0.05, X1 = X3(GX + COLS * CS) + 0.05, Z0 = Z3(GY) - 0.05, ZF = Z3(GY + ROWS * CS), Z1 = ZF + 0.35;
  const FW = X1 - X0, FD = Z1 - Z0;
  // piso de losetas terracota y crema
  const floorTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = THEME.floorA; c.fillRect(0, 0, w, h);
    c.fillStyle = THEME.floorB; c.fillRect(0, 0, w / 2, h / 2); c.fillRect(w / 2, h / 2, w / 2, h / 2);
    for (let i = 0; i < 700; i++) { c.fillStyle = 'rgba(70,40,15,' + Math.random() * 0.07 + ')'; c.fillRect(Math.random() * w, Math.random() * h, rnd(1, 5), rnd(1, 5)); }
    c.strokeStyle = 'rgba(60,30,10,.35)'; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
    c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  }, [FW / 1.6, FD / 1.6]);
  const floor = mesh(new THREE.PlaneGeometry(FW, FD), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 }), false);
  floor.rotation.x = -Math.PI / 2; floor.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2); scene3.add(floor);
  // paredes: zócalo de mayólica blanca con franja azul y pared pintada de amarillo
  const tileTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = THEME.tile; c.fillRect(0, 0, w, h);
    c.strokeStyle = THEME.tileLine; c.lineWidth = 3; c.strokeRect(0, 0, w, h); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  }, [FW / 0.8, 2]);
  const WH = 4.2, TILE_H = 1.6;
  const back = new THREE.Group();
  const lower = mesh(new THREE.PlaneGeometry(FW, TILE_H), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 }), false);
  lower.position.set((X0 + X1) / 2, TILE_H / 2, Z0); back.add(lower);
  const band = mesh(new THREE.BoxGeometry(FW, 0.16, 0.06), M(THEME.band)); band.position.set((X0 + X1) / 2, TILE_H, Z0 + 0.03); back.add(band);
  const upper = mesh(new THREE.PlaneGeometry(FW, WH - TILE_H), M(THEME.wall, { roughness: 0.95 }), false);
  upper.position.set((X0 + X1) / 2, TILE_H + (WH - TILE_H) / 2, Z0); back.add(upper);
  scene3.add(back);
  const left = back.clone(); left.children.forEach(c => { c.position.x = 0; c.position.z = 0; });
  left.rotation.y = Math.PI / 2; left.position.set(X0, 0, (Z0 + Z1) / 2); left.scale.x = FD / FW; scene3.add(left);
  // pizarra con el menú del día (mundo 1) o letrero lacado del chifa (mundo 2)
  const isChifa = (LEVEL.world || 1) === 2;
  const board = mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshStandardMaterial({ map: isChifa ? chifaSignTex() : menuBoardTex(), roughness: isChifa ? 0.45 : 0.9 }), false);
  board.position.set(-3.4, 2.75, Z0 + 0.05); scene3.add(board);
  if (isChifa) {
    // faroles de papel colgados a lo largo de la pared del fondo
    for (let i = 0; i < 8; i++) {
      const x = X0 + 1.4 + i * (FW - 2.8) / 7;
      if (Math.abs(x - board.position.x) < 2.6 || Math.abs(x - 1.4) < 0.9) continue;          // sin tapar el letrero ni el reloj
      const l = lantern3(); l.position.set(x, WH - 0.75, Z0 + 0.6); scene3.add(l);
    }
  } else {
    // banderines rojiblancos
    for (let i = 0; i < 26; i++) {
      const f = mesh(new THREE.ConeGeometry(0.22, 0.42, 3), M(i % 2 ? '#fbfbf5' : '#d22b2b'), false);
      f.rotation.x = Math.PI; f.position.set(X0 + 0.7 + i * (FW - 1.4) / 25, WH - 0.35, Z0 + 0.1); scene3.add(f);
    }
  }
  // refrigerador en la esquina, repisa con frascos, alacenas y un reloj
  // esquinas del perímetro: encimeras de decoración (no se usan)
  [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1]].forEach(([c, r]) => {
    const k = KK('kitchencounter_straight_B'); k.scale.set(CS / U3 / 2, 1, CS / U3 / 2.04);
    k.position.set(X3(cellX(c) + CS / 2), 0, Z3(cellY(r) + CS / 2)); scene3.add(k);
  });
  // muro bajo de ladrillo al frente (como en la referencia de Overcooked)
  const brick = canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = THEME.brick; c.fillRect(0, 0, w, h); c.strokeStyle = THEME.brickLine; c.lineWidth = 3;
    for (let row = 0; row < 4; row++) { const y = row * 16; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (let x = (row % 2) * 16; x < w; x += 32) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 16); c.stroke(); } }
  }, [(X1 - X0) / 2, 1]);
  const lowWall = mesh(new THREE.BoxGeometry(X1 - X0 + 0.3, 1.15, 0.3), new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9 }));
  lowWall.position.set((X0 + X1) / 2, 0.575, ZF + 0.18); scene3.add(lowWall);
  const cap = mesh(new THREE.BoxGeometry(X1 - X0 + 0.4, 0.12, 0.42), M(THEME.capCol)); cap.position.set((X0 + X1) / 2, 1.2, ZF + 0.18); scene3.add(cap);
  const sh = KK('shelf_papertowel_decorated'); sh.position.set(4.6, 2.2, Z0); scene3.add(sh);
  [['kitchencabinet', 7.6], ['kitchencabinet', 9.6]].forEach(([n, x]) => { const k = KK(n); k.position.set(x, -0.6, Z0); scene3.add(k); });
  const clock3 = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), M('#fbfbf5'), false);
  clock3.rotation.x = Math.PI / 2; clock3.position.set(1.4, 3.1, Z0 + 0.06); scene3.add(clock3);
  const rim3 = mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 24), M('#7a3b2b'), false); rim3.position.set(1.4, 3.1, Z0 + 0.1); scene3.add(rim3);
  [[0.28, 0.6], [0.2, 2.2]].forEach(([l, a]) => { const h = mesh(new THREE.BoxGeometry(0.04, l, 0.02), M('#1d1d1d'), false); h.geometry.translate(0, l / 2, 0); h.position.set(1.4, 3.1, Z0 + 0.11); h.rotation.z = -a; scene3.add(h); });
  // pared derecha con la ventanilla por donde salen los platos (detrás de la bandeja de salida)
  const out = st.find(x => x.kind === 'counter');
  const zA = out ? Z3(out.y) : -1, zB = out ? Z3(out.y + out.h) : 1, H0 = 0.95, H1 = 2.35;
  const seg = (z0, z1, y0, y1) => {
    if (z1 - z0 < 0.01 || y1 - y0 < 0.01) return;
    const part = (a, b, mat) => {
      if (b - a < 0.01) return;
      const m = mesh(new THREE.PlaneGeometry(z1 - z0, b - a), mat, false);
      m.rotation.y = -Math.PI / 2; m.position.set(X1, (a + b) / 2, (z0 + z1) / 2); scene3.add(m);
    };
    const t = tileTex.clone(); t.needsUpdate = true; t.repeat.set((z1 - z0) / 0.8, (Math.min(y1, TILE_H) - y0) / 0.8);
    part(y0, Math.min(y1, TILE_H), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }));
    part(Math.max(y0, TILE_H), y1, M(THEME.wall, { roughness: 0.95 }));
    if (y0 < TILE_H && y1 > TILE_H) { const b = mesh(new THREE.BoxGeometry(0.06, 0.16, z1 - z0), M(THEME.band)); b.position.set(X1 - 0.03, TILE_H, (z0 + z1) / 2); scene3.add(b); }
  };
  seg(Z0, zA, 0, WH); seg(zB, Z1, 0, WH); seg(zA, zB, 0, H0); seg(zA, zB, H1, WH);
  // marco de madera, interior oscuro y cartel
  const frameM = M('#7a3b2b', { roughness: 0.7 });
  [[zA, H0, H1], [zB, H0, H1]].forEach(([z]) => { const f = mesh(new THREE.BoxGeometry(0.3, H1 - H0 + 0.2, 0.16), frameM); f.position.set(X1, (H0 + H1) / 2, z); scene3.add(f); });
  const top3 = mesh(new THREE.BoxGeometry(0.3, 0.16, zB - zA + 0.16), frameM); top3.position.set(X1, H1 + 0.08, (zA + zB) / 2); scene3.add(top3);
  const inside = new THREE.Mesh(new THREE.BoxGeometry(1.4, H1 - H0, zB - zA), new THREE.MeshStandardMaterial({ color: '#3a2414', side: THREE.BackSide, roughness: 1 }));
  inside.position.set(X1 + 0.7, (H0 + H1) / 2, (zA + zB) / 2); scene3.add(inside);
  const signTex = canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = '#2f6fb3'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fbf6ea'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = '#fbf6ea'; c.font = '66px Kitchen, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PEDIDOS', w / 2 - 30, h / 2 + 4); c.font = 'bold 60px Arial'; c.fillText('➜', w - 80, h / 2 + 2);
  });
  const sign = mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }), false);
  sign.rotation.y = -Math.PI / 2; sign.position.set(X1 - 0.04, H1 + 0.75, (zA + zB) / 2); scene3.add(sign);
  buildStations();
  buildChefs();
}

// ================= ESTACIONES =================
// hacia dónde mira el frente de la estación (la zona de paso), según stations.js
function facingOf(s) { return { down: 0, right: Math.PI / 2, left: -Math.PI / 2, up: Math.PI }[s.face] || 0; }
function counter3(s, model) {
  const rot = facingOf(s), side = Math.abs(Math.sin(rot)) > 0.5;
  const lw = (side ? s.h : s.w) / U3, ld = (side ? s.w : s.h) / U3;
  const c = KK(model || 'kitchencounter_straight_A');
  c.scale.set(lw / 2, 1, ld / 2.04); c.rotation.y = rot;
  return c;
}
function stove3(s) {
  const st3 = KK('stove_single_countertop'), k = Math.min(s.w, s.h) / U3 / 1.75 * 0.98;
  st3.scale.set(k, 1, k); return st3;
}
function wok3() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.22, 0.01], [0.42, 0.08], [0.55, 0.2], [0.6, 0.3]].map(([x, y]) => new THREE.Vector2(x, y));
  const bowl = mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshStandardMaterial({ color: '#2a2a2c', metalness: 0.75, roughness: 0.35, side: THREE.DoubleSide }));
  g.add(bowl);
  const handle = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.6, 10), M('#4a2c18')); handle.rotation.z = Math.PI / 2; handle.position.set(0.85, 0.28, 0); g.add(handle);
  const loop = mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), M('#2a2a2c', { metalness: 0.7 })); loop.position.set(-0.62, 0.3, 0); loop.rotation.x = Math.PI / 2; g.add(loop);
  return g;
}
function blender3() {
  const g = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(0.42, 0.3, 0.42), M('#c63a2c', { roughness: 0.4 })); base.position.y = 0.15; g.add(base);
  const dial = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), M('#eeeeee')); dial.rotation.x = Math.PI / 2; dial.position.set(0, 0.15, 0.22); g.add(dial);
  const jar = new THREE.Group(); jar.position.y = 0.3; g.add(jar);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.33, roughness: 0.05, side: THREE.DoubleSide }));
  glass.position.y = 0.3; jar.add(glass);
  const lid = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 20), M('#2b2b2b')); lid.position.y = 0.62; jar.add(lid);
  const fill = new THREE.Group(); jar.add(fill);
  g.userData = { jar, fill };
  return g;
}
function trash3() {
  const g = new THREE.Group();
  const bin = mesh(new THREE.CylinderGeometry(0.55, 0.47, 1.05, 20), M('#3f5a3c', { roughness: 0.5 })); bin.position.y = 0.525; g.add(bin);
  const rim = mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 24), M('#2c3f2a')); rim.rotation.x = Math.PI / 2; rim.position.y = 1.05; g.add(rim);
  const hole = mesh(new THREE.CircleGeometry(0.5, 20), M('#141a13'), false); hole.rotation.x = -Math.PI / 2; hole.position.y = 1.0; g.add(hole);
  return g;
}
// Bandeja de salida (estilo Overcooked): cinta que lleva los platos a la ventanilla de la pared derecha
let _beltTex = null;
function bandeja3(s) {
  const g = new THREE.Group(), w = s.w / U3, d = s.h / U3;
  const body = mesh(new THREE.BoxGeometry(w, 0.9, d), M('#5a6470', { metalness: 0.35, roughness: 0.45 })); body.position.y = 0.45; g.add(body);
  const steel = M('#c8ccd0', { metalness: 0.7, roughness: 0.3 });
  for (const sz of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(w + 0.1, 0.18, 0.14), steel); r.position.set(0, 0.97, sz * (d / 2 - 0.07)); g.add(r); }
  _beltTex = canvasTex(128, 128, (c, cw, ch) => {
    c.fillStyle = '#2a2d31'; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = '#f4b83c'; c.lineWidth = 14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(40, 24); c.lineTo(84, 64); c.lineTo(40, 104); c.stroke();      // flecha hacia la ventanilla
  }, [w / 0.9, (d - 0.28) / 0.9]);
  const belt = mesh(new THREE.BoxGeometry(w, 0.08, d - 0.28), new THREE.MeshStandardMaterial({ map: _beltTex, roughness: 0.8 })); belt.position.y = 0.93; g.add(belt);
  return g;
}

function buildStations() {
  for (const s of st) {
    const g = new THREE.Group();
    g.position.set(X3(s.x + s.w / 2), 0, Z3(s.y + s.h / 2));
    const s3 = { g, s, slot: new THREE.Group(), extra: {} };
    s3.slot.position.y = TOP;
    switch (s.kind) {
      case 'crate': {
        // caja de madera cerrada a la altura de la mesa (estilo Overcooked), con la etiqueta del ingrediente en la tapa
        const lw = s.w / U3, ld = s.h / U3;
        const box = KK('crate'); box.scale.set(lw / 2, 0.84 / 0.8, ld / 2); g.add(box);
        const lid = KK('crate_lid'); lid.scale.set(lw / 2 * 1.02, 0.8, ld / 2 * 1.02); lid.position.y = 0.84; g.add(lid);
        const lbl = new THREE.Mesh(new THREE.CircleGeometry(Math.min(lw, ld) * 0.45, 40), new THREE.MeshStandardMaterial({ map: labelTexture(s.item), roughness: 0.7 }));
        lbl.rotation.x = -Math.PI / 2; lbl.position.y = 1.005; lbl.receiveShadow = true; g.add(lbl);
        break;
      }
      case 'plates': { g.add(counter3(s, 'kitchencounter_straight_B')); const r = KK('dishrack_plates', 0.82); r.position.y = TOP; g.add(r); break; }
      case 'trash': g.add(trash3()); break;
      case 'table': g.add(counter3(s, 'kitchencounter_straight_B')); s3.slot.scale.setScalar(1.9); g.add(s3.slot); break;
      case 'pot': {
        g.add(counter3(s)); g.add(stove3(s));
        const p = KK('pot_large', 0.95); p.position.y = 1.21; p.rotation.y = facingOf(s); g.add(p);
        const water = mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.03, 24), M('#a9cbd6', { roughness: 0.15 }), false);
        water.position.y = 1.85; water.visible = false; g.add(water); s3.extra.water = water;
        s3.slot.position.y = 1.8; s3.slot.scale.setScalar(1.2); g.add(s3.slot); break;
      }
      case 'pan': {
        g.add(counter3(s)); g.add(stove3(s));
        const p = KK('pan_A', 1.0); p.position.y = 1.21; p.rotation.y = facingOf(s) + Math.PI; g.add(p);
        s3.slot.position.y = 1.3; s3.slot.scale.setScalar(1.3); g.add(s3.slot); break;
      }
      case 'wok': {
        g.add(counter3(s)); g.add(stove3(s));
        const w = wok3(); w.position.y = 1.21; w.rotation.y = facingOf(s) - Math.PI / 2; g.add(w); s3.extra.wok = w;
        s3.slot.position.y = 1.3; s3.slot.scale.setScalar(1.5); w.add(s3.slot); s3.slot.position.set(0, 0.08, 0); break;
      }
      case 'board': {
        g.add(counter3(s));
        const b = KK('cuttingboard', 1.1); b.position.y = TOP; b.rotation.y = facingOf(s) + Math.PI / 2; g.add(b);
        const k = KK('knife', 1.1); k.rotation.set(Math.PI / 2, 0, 0.6); k.position.set(0.45, TOP + 0.2, 0.35); g.add(k);
        s3.slot.position.y = TOP + 0.17; s3.slot.scale.setScalar(1.7); g.add(s3.slot); break;
      }
      case 'bowl': {
        g.add(counter3(s)); const b = KK('bowl', 1.6); b.position.y = TOP; g.add(b);
        s3.slot.position.y = TOP + 0.12; s3.slot.scale.setScalar(1.6); g.add(s3.slot); break;
      }
      case 'blender': {
        g.add(counter3(s)); const b = blender3(); b.scale.setScalar(1.75); b.position.y = TOP; b.rotation.y = facingOf(s); g.add(b); s3.extra.bl = b; break;
      }
      case 'counter': g.add(bandeja3(s)); break;
      default: g.add(counter3(s));
    }
    // materiales propios para poder resaltar la estación más cercana
    s3.mats = [];
    g.traverse(m => {
      if (m.isMesh && !m.material.transparent && !Array.isArray(m.material)) { m.material = m.material.clone(); s3.mats.push(m.material); }
    });
    scene3.add(g);
    V3.st.set(s, s3);
  }
}

// ================= CHEFS (estilo Overcooked: sin piernas, con gorro) =================
function makeChef(scarf, mustache) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const torso = mesh(new THREE.CapsuleGeometry(0.36, 0.4, 6, 16), M('#f6f3ec', { roughness: 0.8 })); torso.position.y = 0.62; body.add(torso);
  for (let i = 0; i < 3; i++) for (const sx of [-0.09, 0.09]) {
    const b = mesh(new THREE.SphereGeometry(0.028, 8, 6), M('#2c2c2c')); b.position.set(sx, 0.48 + i * 0.13, 0.355 - Math.abs(0.5 - i * 0.13) * 0.05); body.add(b);
  }
  const sc = mesh(new THREE.TorusGeometry(0.19, 0.07, 8, 18), M(scarf)); sc.rotation.x = Math.PI / 2; sc.position.y = 1.02; body.add(sc);
  const knot = mesh(new THREE.ConeGeometry(0.08, 0.16, 6), M(scarf)); knot.position.set(0, 0.92, 0.22); knot.rotation.x = Math.PI; body.add(knot);
  const head = mesh(new THREE.SphereGeometry(0.3, 18, 14), M('#d9a06f')); head.position.y = 1.32; body.add(head);
  for (const sx of [-0.1, 0.1]) {
    const e = mesh(new THREE.SphereGeometry(0.036, 8, 6), M('#1d1d1d', { roughness: 0.3 })); e.position.set(sx, 1.36, 0.275); body.add(e);
  }
  if (mustache) { const m = mesh(new THREE.CapsuleGeometry(0.035, 0.16, 4, 8), M('#3b2414')); m.rotation.z = Math.PI / 2; m.position.set(0, 1.25, 0.29); body.add(m); }
  const hat = mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.24, 18), M('#fbfbf7')); hat.position.y = 1.62; body.add(hat);
  const puff = mesh(new THREE.SphereGeometry(0.32, 16, 10), M('#fbfbf7')); puff.scale.set(1, 0.62, 1); puff.position.y = 1.8; body.add(puff);
  const hands = [-1, 1].map(sx => { const h = mesh(new THREE.SphereGeometry(0.1, 12, 8), M('#d9a06f')); h.position.set(sx * 0.45, 0.72, 0.1); body.add(h); return h; });
  const hold = new THREE.Group(); hold.position.set(0, 0.86, 0.6); hold.scale.setScalar(1.5); body.add(hold);
  g.scale.setScalar(1.25);
  scene3.add(g);
  return { g, body, hands, hold, ang: 0, phase: 0, px: null, pz: null };
}
function buildChefs() {
  V3.player = makeChef('#e8793a', true);
  V3.helper = makeChef('#3a7bd5', false);
}
function updChef(ch, p, dt, workSt) {
  ch.g.visible = !!p; if (!p) { ch.px = null; return; }
  const x = X3(p.x), z = Z3(p.y);
  if (ch.px === null) { ch.px = x; ch.pz = z; }
  const dx = x - ch.px, dz = z - ch.pz, moving = Math.hypot(dx, dz) > 0.001;
  ch.px = x; ch.pz = z; ch.g.position.set(x, 0, z);
  let target = ch.ang;
  if (workSt) target = Math.atan2(X3(workSt.x + workSt.w / 2) - x, Z3(workSt.y + workSt.h / 2) - z);
  else if (moving) target = Math.atan2(dx, dz);
  let d = target - ch.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  ch.ang += d * Math.min(1, dt * 16); ch.g.rotation.y = ch.ang;
  ch.phase += dt * (moving ? 15 : 0);
  ch.body.position.y = moving ? Math.abs(Math.sin(ch.phase)) * 0.07 : 0;
  ch.body.rotation.z = moving ? Math.sin(ch.phase) * 0.05 : 0;
  const held = itemKey(p.held);
  setSlot(ch.hold, held);
  ch.hands.forEach((h, i) => {
    const sx = i ? 1 : -1;
    if (workSt) h.position.set(sx * 0.2, 0.8 + Math.sin(V3.t * 28 + i * Math.PI) * 0.1, 0.48);
    else if (held) h.position.set(sx * 0.3, 0.8, 0.42);
    else h.position.set(sx * 0.45, 0.68 + (moving ? Math.sin(ch.phase + i * Math.PI) * 0.05 : 0), 0.08);
  });
}

// ================= PLATOS ENTREGADOS (se van por la cinta) =================
// Los pedidos se ven en los tickets del HUD; aquí solo se anima el plato que sale.
V3.sent = [];
const _serve = serve;
serve = function (plate) {
  const by = player.held === plate ? player : helper;
  const ok = _serve(plate);
  if (ok && V3.ready) {
    const out = st.find(x => x.kind === 'counter');
    const m = plateModel(plate.parts); m.scale.setScalar(1.3);
    const z = Math.max(Z3(out.y) + 0.5, Math.min(Z3(out.y + out.h) - 0.5, Z3(by ? by.y : out.y + out.h / 2)));
    m.position.set(X3(out.x) + 0.25, 0.98, z); scene3.add(m); V3.sent.push(m);
  }
  return ok;
};
function updSent(dt) {
  if (_beltTex) _beltTex.offset.x -= dt * 0.6;
  V3.sent = V3.sent.filter(m => {
    m.position.x += dt * 1.1;
    if (m.position.x > 13.2) { scene3.remove(m); return false; }
    return true;
  });
}

// ================= VAPOR =================
function puff(x, y, z, big) {
  let p = V3.steam.find(q => q.life <= 0);
  if (!p) {
    if (V3.steam.length > 80) return;
    p = { s: new THREE.Sprite(new THREE.SpriteMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })) };
    scene3.add(p.s); V3.steam.push(p);
  }
  p.life = p.max = rnd(0.9, 1.4); p.s.position.set(x + rnd(-0.15, 0.15), y, z + rnd(-0.15, 0.15)); p.big = big ? 1.4 : 1;
}
function updSteam(dt) {
  V3.steam.forEach(p => {
    if (p.life <= 0) { p.s.visible = false; return; }
    p.life -= dt; p.s.visible = true;
    const k = 1 - p.life / p.max;
    p.s.position.y += dt * 0.8; p.s.scale.setScalar((0.18 + k * 0.4) * p.big);
    p.s.material.opacity = Math.sin(k * Math.PI) * 0.5;
  });
}

// ================= ACTUALIZAR ESTACIONES CADA FRAME =================
const CHOP_IN = Object.fromEntries(Object.entries(CHOP).map(([a, b]) => [b, a]));
const BLEND_COL = { queso: '#f8f4e6', aji: '#f39a16', leche: '#f1e8d2', galleta: '#e8c98a', salsa: '#f3c13a', salsa_aji: '#ef7d1a' };
function updBlender(s3, s) {
  const { jar, fill } = s3.extra.bl.userData;
  const list = s.state === 'idle' ? s.items : [s.state === 'done' ? s.out : '__mix'];
  const k = s.state + '|' + s.items.join(',') + '|' + s.out;
  if (fill.userData.k !== k) {
    fill.userData.k = k; fill.clear();
    if (s.state === 'idle') {
      list.forEach((it, i) => { const c = mesh(new THREE.CylinderGeometry(0.15 + i * 0.012, 0.14 + i * 0.012, 0.11, 18), M(BLEND_COL[it] || '#ccc')); c.position.y = 0.06 + i * 0.115; fill.add(c); });
    } else {
      const h = Math.max(0.12, s.items.length * 0.115);
      const c = mesh(new THREE.CylinderGeometry(0.15 + (h / 0.6) * 0.04, 0.145, h, 18), new THREE.MeshStandardMaterial({ color: BLEND_COL[s.out] || '#f3c13a', roughness: 0.3 }));
      c.position.y = 0.01 + h / 2; fill.add(c); fill.userData.mixMesh = c;
    }
  }
  const blending = s.state === 'blending';
  jar.position.x = blending ? Math.sin(V3.t * 60) * 0.015 : 0;
  fill.rotation.y += blending ? 0.5 : 0;
  if (fill.userData.mixMesh && s.state === 'blending') {      // la mezcla va tomando el color de la salsa
    const p = Math.min(1, s.t / T.blend), from = new THREE.Color('#f4e6c4'), to = new THREE.Color(BLEND_COL[s.out] || '#f3c13a');
    fill.userData.mixMesh.material.color.copy(from.lerp(to, 0.3 + 0.7 * p));
  }
}
function updStations(dt) {
  for (const [s, s3] of V3.st) {
    const { g } = s3;
    switch (s.kind) {
      case 'table': setSlot(s3.slot, itemKey(s.item)); break;
      case 'pot': {
        const list = s.slots.map(x => x.done ? POT_OUT[x.type] : x.type), any = list.length > 0;
        const allDone = any && s.slots.every(x => x.done);
        setSlot(s3.slot, !any ? null : list.length === 1 ? list[0] : 'set|' + list.join(','));
        s3.extra.water.visible = any;
        s3.slot.position.y = 1.8 + (any && !allDone ? Math.sin(V3.t * 6) * 0.025 : 0);
        if (any && Math.random() < dt * (allDone ? 7 : 4)) puff(g.position.x, 1.95, g.position.z, allDone);
        break;
      }
      case 'board':
        setSlot(s3.slot, s.state === 'chopping' ? CHOP_IN[s.product] : s.state === 'done' ? s.product : null);
        if (s.state === 'chopping' && s.worked) s3.slot.rotation.y = Math.sin(V3.t * 25) * 0.05;
        break;
      case 'bowl':
        setSlot(s3.slot, s.state === 'done' ? (s.n === 1 ? 'masa1' : 'masa') : s.items.length ? 'set|' + s.items.join(',') : null);
        s3.slot.rotation.y += s.state === 'mashing' && s.worked ? dt * 6 : 0;
        break;
      case 'pan':
        setSlot(s3.slot, s.state === 'done' ? 'guiso' : s.items.length ? 'set|' + s.items.join(',') : null);
        if (s.state === 'cooking' && Math.random() < dt * 6) puff(g.position.x, 1.45, g.position.z);
        break;
      case 'blender': updBlender(s3, s); break;
      case 'wok': {
        setSlot(s3.slot, s.state === 'done' ? 'chaufa' : s.items.length ? 'set|' + s.items.join(',') : null);
        const toss = s.state === 'cooking';                      // salteado: el wok se mueve y saltan los ingredientes
        s3.extra.wok.rotation.z = toss ? Math.sin(V3.t * 9) * 0.08 : 0;
        s3.slot.position.y = 0.08 + (toss ? Math.abs(Math.sin(V3.t * 9)) * 0.12 : 0);
        if (toss && Math.random() < dt * 8) puff(g.position.x, 1.6, g.position.z);
        break;
      }
    }
  }
}
function setHighlight(s) {
  if (V3.hl === s) return;
  const set = (x, on) => { const s3 = x && V3.st.get(x); if (s3) s3.mats.forEach(m => { m.emissive.set(on ? '#ffcf4a' : '#000000'); m.emissiveIntensity = on ? 0.28 : 1; }); };
  set(V3.hl, false); set(s, true); V3.hl = s;
}

// ================= CAPA 2D (barras, avisos, carteles) =================
const _v = new THREE.Vector3();
function proj(x, y, z) { _v.set(x, y, z).project(cam3); return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H }; }
function emoji(e, x, y, size) { ctx.font = size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(e, x, y); }
function label(t, x, y, col, size, align) { ctx.font = 'bold ' + (size || 11) + 'px "Courier New", monospace'; ctx.fillStyle = col || '#fff'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); }
function pill(t, x, y, bg, fg, size) {
  ctx.font = 'bold ' + (size || 11) + 'px "Courier New", monospace';
  const w = ctx.measureText(t).width + 12, h = (size || 11) + 8;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 6) : ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill();
  label(t, x, y + 1, fg, size);
}
function bar(x, y, w, p, col, h) {
  h = h || 10;
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, Math.min(1, p)), h - 2);
}
function stationOverlay(s) {
  const c = proj(X3(s.x + s.w / 2), 2.35, Z3(s.y + s.h / 2)), bx = c.x - 28;
  const prog = p => bar(bx, c.y - 5, 56, p, s.worked ? '#5ec26a' : '#f4b83c', 9);
  const hint = () => { if (!s.worked && Math.floor(Date.now() / 450) % 2) pill('MANTÉN E', c.x, c.y - 18, 'rgba(30,15,5,.85)', '#f4e04c', 10); };
  const ready = () => pill('¡LISTO!', c.x, c.y, '#2f8a3b', '#ffffff', 11);
  switch (s.kind) {
    case 'pot': {
      if (!s.slots.length) break;
      const cooking = s.slots.filter(x => !x.done), done = s.slots.length - cooking.length;
      if (!cooking.length) { pill(s.slots.length > 1 ? '¡LISTO! ×' + s.slots.length : '¡LISTO!', c.x, c.y, '#2f8a3b', '#ffffff', 11); break; }
      bar(bx, c.y - 5, 56, Math.min(...cooking.map(x => x.t)) / T.cook, '#f4b83c', 9);
      if (done) pill(done + ' lista', c.x, c.y - 18, '#2f8a3b', '#ffffff', 9);
      break;
    }
    case 'board': if (s.state === 'chopping') { prog(s.t / T.board); hint(); } if (s.state === 'done') ready(); break;
    case 'bowl': if (s.state === 'mashing') { prog(s.t / T.bowl); hint(); } if (s.state === 'done') pill('¡LISTO! ×' + s.n + (s.n === 1 ? ' capa' : ' capas'), c.x, c.y, '#2f8a3b', '#ffffff', 11); break;
    case 'pan': if (s.state === 'cooking') bar(bx, c.y - 5, 56, s.t / T.pan, '#f4b83c', 9); if (s.state === 'done') ready(); break;
    case 'wok': if (s.state === 'cooking') bar(bx, c.y - 5, 56, s.t / T.wok, '#f4b83c', 9); if (s.state === 'done') ready(); break;
    case 'blender': {
      const c2 = proj(X3(s.x + s.w / 2), 3.0, Z3(s.y + s.h / 2)), b2 = c2.x - 28;
      const m = s.state === 'idle' && blendMatch(s.items);
      // la licuadora va sola; si la mezcla aún puede crecer hacia otra receta, espera un momento por si llega algo más
      if (m) { bar(b2, c2.y - 5, 56, (s.wait || 0) / BLEND_WAIT, '#9aa5ad', 9); pill('¿algo más?', c2.x, c2.y - 18, 'rgba(30,15,5,.85)', '#f4e04c', 10); }
      if (s.state === 'blending') bar(b2, c2.y - 5, 56, s.t / T.blend, '#f4b83c', 9);
      if (s.state === 'done') pill('¡LISTO!', c2.x, c2.y, '#2f8a3b', '#ffffff', 11);
      break;
    }
  }
}
function drawOverlay() {
  ctx.clearRect(0, 0, W, H);
  if (!V3.ready) { label('Preparando la cocina…', W / 2, H / 2, '#f4e4c1', 18); return; }
  for (const s of st) stationOverlay(s);
  const n = nearestStation(player);
  if (n && n.label && n.kind !== 'table') { const c = proj(X3(n.x + n.w / 2), 0.2, Z3(n.y + n.h / 2)); pill(n.kind === 'counter' ? 'Bandeja de salida' : n.label, c.x, c.y + 6, 'rgba(30,15,5,.72)', '#f4e4c1', 10); }
  if (helper) { const p = proj(X3(helper.x), 2.35, Z3(helper.y)); pill('AYUDANTE', p.x, p.y, '#17325c', '#cfe1ff', 9); }
  if (toast.t > 0) {
    const ty = document.body.classList.contains('mobile') ? H - 120 : H - 54;      // en móvil, por encima del HUD
    ctx.fillStyle = 'rgba(30,15,5,.88)'; ctx.fillRect(W / 2 - 190, ty, 380, 30);
    label(toast.msg, W / 2, ty + 15, '#f4e4c1', 15);
  }
}

// ================= BUCLE DE DIBUJO (lo llama main.js) =================
function draw() {
  const now = performance.now(), dt = V3.last ? Math.min(0.05, (now - V3.last) / 1000) : 0.016;
  V3.last = now; V3.t += dt;
  if (V3.ready) {
    updStations(dt);
    const near = nearestStation(player);
    const pWork = keys.act && near && HOLD_KINDS.includes(near.kind) && near.worked ? near : null;
    updChef(V3.player, player, dt, pWork);
    updChef(V3.helper, helper, dt, helper && helper.work);
    updSent(dt);
    updSteam(dt);
    setHighlight(started && !gameOver ? near : null);
    renderer3.render(scene3, cam3);
  }
  drawOverlay();
}

// ---------- cargar los modelos KayKit (van incrustados en assets-kaykit.js, así funciona sin servidor) ----------
(function loadKayKit() {
  const bin = Uint8Array.from(atob(window.KAYKIT_GLB), ch => ch.charCodeAt(0)).buffer;
  new THREE.GLTFLoader().parse(bin, '', gl => {
    gl.scenes.forEach(sc => sc.children.forEach(n => { V3.kk[n.name] = n; }));
    start();
  }, e => { console.error('No se pudieron cargar los modelos', e); start(); });
  // los letreros se dibujan con la tipografía Kitchen: se espera a que esté lista
  function start() {
    const go = () => { buildWorld(); V3.ready = true; };
    if (document.fonts && document.fonts.load) document.fonts.load('40px Kitchen').then(go, go); else go();
  }
})();
