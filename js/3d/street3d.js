// ================= ESCENARIO DE LA CALLE (niveles Kevin: comida de la calle) =================
// Inspirado en los niveles callejeros de Overcooked y en las carretillas cebicheras de Lima: pista de asfalto con cruce
// peatonal, veredas, fachadas limeñas y carretillas blancas con vitrinas de acrílico, sombrillas azules y banderitas.
// Se usa cuando el nivel tiene layout: 'calle' (ver stations.js).
// Depende de las utilidades de render3d.js (M, mesh, canvasTex, rnd, X3, Z3, scene3...).
const IS_CALLE = LEVEL.layout === 'calle';

// Mesas de las carretillas: paneles blancos con juntas grises y cubierta de acero, como en la foto de referencia
let _panelTex = null;
function cartCounter(lw, ld, rot) {
  if (!_panelTex) _panelTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#f7f7f3'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#c9ccd0'; c.lineWidth = 4; c.strokeRect(8, 8, w - 16, h - 16);
    c.strokeStyle = '#dfe2e5'; c.lineWidth = 2; c.strokeRect(16, 16, w - 32, h - 32);
    c.fillStyle = '#9aa0a6'; [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
  });
  const g = new THREE.Group(), inner = new THREE.Group(); inner.rotation.y = rot; g.add(inner);
  const body = mesh(new THREE.BoxGeometry(lw - 0.04, 0.86, ld - 0.04), new THREE.MeshStandardMaterial({ map: _panelTex, roughness: 0.55 })); body.position.y = 0.47; inner.add(body);
  const top = mesh(new THREE.BoxGeometry(lw, 0.08, ld), M('#d9dde1', { metalness: 0.5, roughness: 0.35 })); top.position.y = 0.95; inner.add(top);
  const edge = mesh(new THREE.BoxGeometry(lw + 0.02, 0.04, ld + 0.02), M('#ffffff', { roughness: 0.4 })); edge.position.y = 0.9; inner.add(edge);
  const skirt = mesh(new THREE.BoxGeometry(lw - 0.12, 0.08, ld - 0.12), M('#3b3f44')); skirt.position.y = 0.04; inner.add(skirt);
  return g;
}

// Vitrina de acrílico (como los contenedores de la carretilla): caja transparente con marco blanco, el ingrediente
// a la vista y una etiqueta redonda al frente
let _acrylic = null;
function vitrina3(item, lw, ld) {
  if (!_acrylic) _acrylic = new THREE.MeshStandardMaterial({ color: '#eaf6ff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group(), w = lw * 0.84, d = ld * 0.74, h = 0.62, y0 = TOP;
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), _acrylic); box.position.y = y0 + h / 2; g.add(box);
  const frame = M('#ffffff', { roughness: 0.35 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const p = mesh(new THREE.BoxGeometry(0.05, h, 0.05), frame); p.position.set(sx * w / 2, y0 + h / 2, sz * d / 2); g.add(p); });
  [-1, 1].forEach(sz => { const r = mesh(new THREE.BoxGeometry(w, 0.05, 0.05), frame); r.position.set(0, y0 + h, sz * d / 2); g.add(r); });
  [-1, 1].forEach(sx => { const r = mesh(new THREE.BoxGeometry(0.05, 0.05, d), frame); r.position.set(sx * w / 2, y0 + h, 0); g.add(r); });
  // el ingrediente amontonado adentro
  [[-0.24, -0.18], [0.22, -0.15], [-0.2, 0.17], [0.2, 0.18], [0, 0]].forEach(([x, z], i) => {
    const m = itemModel(item); m.scale.setScalar(1.15); m.position.set(x * w, y0 + 0.02 + (i === 4 ? 0.12 : 0), z * d); m.rotation.y = i * 1.3; g.add(m);
  });
  const lbl = mesh(new THREE.CircleGeometry(0.27, 32), new THREE.MeshStandardMaterial({ map: labelTexture(item), roughness: 0.6 }), false);
  lbl.position.set(0, y0 + h * 0.52, d / 2 + 0.03); g.add(lbl);
  return g;
}

// Balde chichero: dispensador de plástico con chicha morada, tapa azul y caño; el vaso se pone debajo del caño
function baldeChichero() {
  const g = new THREE.Group();
  const stand = mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), M('#e9ebee')); stand.position.y = 0.09; g.add(stand);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.95, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#f4f8fb', transparent: true, opacity: 0.42, roughness: 0.15, side: THREE.DoubleSide, depthWrite: false }));
  shell.position.y = 0.66; g.add(shell);
  const liquid = mesh(new THREE.CylinderGeometry(0.39, 0.37, 0.74, 24), M('#4a1342', { roughness: 0.2 })); liquid.position.y = 0.56; g.add(liquid);
  const lid = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24), M('#2f6fb3', { roughness: 0.4 })); lid.position.y = 1.17; g.add(lid);
  const knob = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14), M('#2f6fb3')); knob.position.y = 1.26; g.add(knob);
  const spout = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.22), M('#e04a3a')); spout.position.set(0, 0.32, 0.47); g.add(spout);
  const tap = mesh(new THREE.BoxGeometry(0.05, 0.14, 0.05), M('#e04a3a')); tap.position.set(0, 0.42, 0.56); g.add(tap);
  // vaso que se llena bajo el caño
  const cup = plasticCup(null); cup.scale.setScalar(0.85); cup.position.set(0, 0.18, 0.56); g.add(cup); cup.visible = false;
  const liq = mesh(new THREE.CylinderGeometry(0.095, 0.075, 0.24, 16), M('#4a1342', { roughness: 0.15 })); liq.position.y = 0.01; cup.add(liq);
  const stream = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 6), M('#4a1342')); stream.position.set(0, 0.36, 0); cup.add(stream);
  cup.userData = { liq, stream };
  g.userData = { cup, liquid };
  return g;
}
// Pilas de vasos de plástico
function cupStacks() {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: '#eef6ff', transparent: true, opacity: 0.55, roughness: 0.1, side: THREE.DoubleSide });
  [[-0.32, -0.15], [0, 0.18], [0.32, -0.12]].forEach(([x, z]) => {
    for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.095, 0.3, 16, 1, true), mat); c.rotation.x = Math.PI; c.position.set(x, 0.15 + i * 0.05, z); g.add(c); }
    const top = mesh(new THREE.TorusGeometry(0.13, 0.01, 4, 16), M('#ffffff')); top.rotation.x = Math.PI / 2; top.position.set(x, 0.3 + 6 * 0.05 - 0.15, z); g.add(top);
  });
  return g;
}
// Sombrilla azul con borde blanco (como la de la foto)
function umbrella3(r, h) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 8), M('#cfd3d7', { metalness: 0.6 })); pole.position.y = h / 2; g.add(pole);
  const canopy = mesh(new THREE.ConeGeometry(r, r * 0.32, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#0b3d9c', roughness: 0.75, side: THREE.DoubleSide }));
  canopy.position.y = h; g.add(canopy);
  const rim = mesh(new THREE.TorusGeometry(r * 0.985, 0.045, 6, 10), M('#f6f6f6')); rim.rotation.x = Math.PI / 2; rim.position.y = h - r * 0.16; rim.rotation.z = Math.PI / 10; g.add(rim);
  const tip = mesh(new THREE.SphereGeometry(0.07, 8, 6), M('#f6f6f6')); tip.position.y = h + r * 0.17; g.add(tip);
  return g;
}
// Banderita peruana en su palito
let _flagTex = null;
function flag3() {
  if (!_flagTex) _flagTex = canvasTex(96, 64, (c, w, h) => { c.fillStyle = '#d91023'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.fillRect(w / 3, 0, w / 3, h); });
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), M('#d9b26a')); pole.position.y = 0.45; g.add(pole);
  const cloth = mesh(new THREE.PlaneGeometry(0.42, 0.28), new THREE.MeshStandardMaterial({ map: _flagTex, side: THREE.DoubleSide, roughness: 0.8 }), false);
  cloth.position.set(0.22, 0.76, 0); g.add(cloth);
  return g;
}
// Clientes esperando en la vereda, frente al mostrador (uno por pedido en espera)
const STREET_PEOPLE = [];
function person3(shirt, skin, hair) {
  const g = new THREE.Group();
  const legs = mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.7, 10), M('#3b4a63')); legs.position.y = 0.35; g.add(legs);
  const body = mesh(new THREE.CapsuleGeometry(0.26, 0.4, 6, 12), M(shirt)); body.position.y = 1.05; g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.22, 14, 10), M(skin)); head.position.y = 1.6; g.add(head);
  const hr = mesh(new THREE.SphereGeometry(0.23, 14, 8, 0, 6.3, 0, 1.2), M(hair)); hr.position.y = 1.62; g.add(hr);
  return g;
}
function updStreet(dt) {
  const waiting = customers.filter(c => c.state === 'waiting');
  STREET_PEOPLE.forEach((p, i) => {
    const show = i < waiting.length;
    p.userData.k = Math.max(0, Math.min(1, (p.userData.k || 0) + (show ? dt * 4 : -dt * 4)));
    p.visible = p.userData.k > 0.02; p.scale.setScalar(0.6 + 0.4 * p.userData.k);
    p.position.y = 0.06 + (show ? Math.abs(Math.sin(V3.t * 2 + i)) * 0.03 : 0);
  });
}

function stripeTex(colA, colB, n) {
  return canvasTex(256, 256, (c, w, h) => {
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? colB : colA; c.fillRect(i * w / n, 0, w / n + 1, h); }
    c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(0, h - 18, w, 18);
  });
}
function awning3(len, depth, colA, colB, text) {
  const g = new THREE.Group();
  const tex = stripeTex(colA, colB, Math.max(6, Math.round(len * 3)));
  const roof = mesh(new THREE.BoxGeometry(len, 0.06, depth), [M('#ddd'), M('#ddd'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), M('#ddd'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), M('#ddd')]);
  g.add(roof);
  // faldón con ondas en el borde delantero
  const val = mesh(new THREE.BoxGeometry(len, 0.3, 0.04), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })); val.position.set(0, -0.15, depth / 2); g.add(val);
  if (text) {
    const sign = mesh(new THREE.PlaneGeometry(len * 0.8, 0.26), new THREE.MeshStandardMaterial({ map: canvasTex(512, 64, (c, w, h) => {
      c.fillStyle = '#fbf6ea'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2b1a10'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
      c.fillStyle = '#c0392b'; c.font = '40px Kitchen, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 3);
    }), roughness: 0.6 }), false);
    sign.position.set(0, -0.15, depth / 2 + 0.03); g.add(sign);
  }
  return g;
}
function wheel3() {
  const g = new THREE.Group();
  const tire = mesh(new THREE.TorusGeometry(0.36, 0.08, 8, 20), M('#2a2a2a')); g.add(tire);
  const hub = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12), M('#9a9a9a', { metalness: 0.6 })); hub.rotation.x = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 6; i++) { const sp = mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), M('#b5b5b5', { metalness: 0.5 })); sp.rotation.z = i * Math.PI / 6; g.add(sp); }
  return g;
}
function tree3() {
  const g = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.35, 20), M('#8f8a80')); pot.position.y = 0.18; g.add(pot);
  const soil = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 20), M('#5a3d22')); soil.position.y = 0.36; g.add(soil);
  const trunk = mesh(new THREE.CylinderGeometry(0.12, 0.17, 1.4, 8), M('#6b4423')); trunk.position.y = 1.0; g.add(trunk);
  [[0, 2.0, 0, 0.85], [-0.45, 1.75, 0.2, 0.6], [0.45, 1.8, -0.15, 0.62], [0.1, 2.5, 0.1, 0.6]].forEach(([x, y, z, r]) => {
    const l = mesh(new THREE.IcosahedronGeometry(r, 1), M('#5fa83a', { flatShading: true })); l.position.set(x, y, z); g.add(l);
  });
  return g;
}
function cone3() {
  const g = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), M('#e8642a')); base.position.y = 0.025; g.add(base);
  const c = mesh(new THREE.ConeGeometry(0.17, 0.55, 14), M('#f0702e')); c.position.y = 0.3; g.add(c);
  const band = mesh(new THREE.CylinderGeometry(0.1, 0.125, 0.09, 14), M('#fbfbf5')); band.position.y = 0.32; g.add(band);
  return g;
}
function facadeTex(wall, trim, kind) {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = wall; c.fillRect(0, 0, w, h);
    c.fillStyle = trim; c.fillRect(0, h - 70, w, 70); c.fillRect(0, 0, w, 26);
    // ventanas
    const win = (x, y, ww, hh) => { c.fillStyle = '#f6f1e4'; c.fillRect(x - 8, y - 8, ww + 16, hh + 16); c.fillStyle = '#35546e'; c.fillRect(x, y, ww, hh); c.strokeStyle = '#f6f1e4'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + ww / 2, y); c.lineTo(x + ww / 2, y + hh); c.stroke(); };
    if (kind === 'balcon') {
      // balcón limeño de madera
      c.fillStyle = '#6b3a1c'; c.fillRect(110, 70, 290, 190);
      c.fillStyle = '#8a5028'; for (let i = 0; i < 6; i++) c.fillRect(124 + i * 46, 86, 36, 150);
      c.strokeStyle = '#4a2610'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(124 + i * 46, 160); c.lineTo(160 + i * 46, 160); c.stroke(); }
    } else { win(70, 90, 120, 150); win(320, 90, 120, 150); }
    // puerta y vitrina
    c.fillStyle = '#5a3a22'; c.fillRect(200, 320, 110, 192);
    c.fillStyle = '#c9a227'; c.beginPath(); c.arc(290, 420, 6, 0, 7); c.fill();
    if (kind === 'bodega') {
      c.fillStyle = '#fbf6ea'; c.fillRect(40, 290, 150, 60); c.fillStyle = '#c0392b'; c.font = 'bold 34px Arial'; c.textAlign = 'center'; c.fillText('BODEGA', 115, 332);
    }
    for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.05 + ')'; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  });
}

function buildStreet() {
  scene3.background = new THREE.Color('#2a2622');
  const Zsw = Z3(cellY(1)) - 0.02, Zsw2 = Z3(cellY(ROWS - 1)) + 0.02;     // bordes de las veredas
  // asfalto
  const asphalt = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#4b4e53'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { const v = 50 + Math.random() * 60; c.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 4) + ',.5)'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, [10, 10]);
  const road = mesh(new THREE.PlaneGeometry(36, 30), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.95 }), false);
  road.rotation.x = -Math.PI / 2; scene3.add(road);
  // veredas con baldosas y sardinel
  const tiles = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#cfc6b6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a99f8e'; c.lineWidth = 3;
    c.strokeRect(0, 0, w / 2, h / 2); c.strokeRect(w / 2, 0, w / 2, h / 2); c.strokeRect(0, h / 2, w / 2, h / 2); c.strokeRect(w / 2, h / 2, w / 2, h / 2);
  }, [18, 3]);
  [[Zsw - 3, Zsw], [Zsw2, Zsw2 + 3]].forEach(([z0, z1], i) => {
    const t = tiles.clone(); t.needsUpdate = true; t.repeat.set(18, (z1 - z0) / 1.2);
    const sw = mesh(new THREE.BoxGeometry(36, 0.06, z1 - z0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), false); sw.position.set(0, 0.03, (z0 + z1) / 2); scene3.add(sw);
    const curb = mesh(new THREE.BoxGeometry(36, 0.1, 0.16), M('#b9b2a5')); curb.position.set(0, 0.05, i ? z0 : z1); scene3.add(curb);
    // doble línea amarilla junto al sardinel
    [0.25, 0.4].forEach(d => { const y = mesh(new THREE.PlaneGeometry(36, 0.07), M('#e8c22e'), false); y.rotation.x = -Math.PI / 2; y.position.set(0, 0.012, i ? z0 - d : z1 + d); scene3.add(y); });
  });
  // cruce peatonal al centro y línea discontinua
  const xz0 = X3(cellX(6)) + 0.15, xz1 = X3(cellX(8)) - 0.15;
  for (let z = Zsw + 0.6; z < Zsw2 - 0.4; z += 0.95) { const s = mesh(new THREE.PlaneGeometry(xz1 - xz0, 0.48), M('#efefe8'), false); s.rotation.x = -Math.PI / 2; s.position.set((xz0 + xz1) / 2, 0.013, z); scene3.add(s); }
  for (let x = -16; x < 16; x += 2.2) {
    if (x + 1.2 > xz0 - 0.3 && x < xz1 + 0.3) continue;
    const d = mesh(new THREE.PlaneGeometry(1.2, 0.12), M('#efefe8'), false); d.rotation.x = -Math.PI / 2; d.position.set(x + 0.6, 0.012, Z3(cellY(4)) - 0.02); scene3.add(d);
  }
  // fachadas limeñas detrás de la vereda de arriba
  const houses = [['#e6b84a', '#c8962e', 'bodega'], ['#5aa3c9', '#3f7fa3', ''], ['#e9e2d0', '#c9bfa6', 'balcon'], ['#d97a7a', '#b85a5a', ''], ['#7fb06a', '#5f8e4c', ''], ['#e6b84a', '#c8962e', 'balcon'], ['#5aa3c9', '#3f7fa3', 'bodega']];
  const hw = 4.4, zF = Zsw - 3;
  houses.forEach(([wall, trim, kind], i) => {
    const x = -15.4 + i * hw + hw / 2;
    const f = mesh(new THREE.BoxGeometry(hw, 4.6, 0.4), [M(trim), M(trim), M(trim), M(trim), new THREE.MeshStandardMaterial({ map: facadeTex(wall, trim, kind), roughness: 0.9 }), M(trim)]);
    f.position.set(x, 2.3, zF - 0.2); scene3.add(f);
    const corn = mesh(new THREE.BoxGeometry(hw, 0.2, 0.6), M(trim)); corn.position.set(x, 4.6, zF - 0.1); scene3.add(corn);
  });
  // tejas al frente (como en la referencia)
  const tejas = canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = '#9e4a2a'; c.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let x = (row % 2) * 16; x < w + 16; x += 32) { c.fillStyle = row % 2 ? '#c4643a' : '#b65632'; c.beginPath(); c.ellipse(x, 10 + row * 22, 16, 14, 0, 0, Math.PI); c.fill(); }
  }, [18, 1]);
  const roof = mesh(new THREE.BoxGeometry(36, 0.9, 1.2), new THREE.MeshStandardMaterial({ map: tejas, roughness: 0.85 })); roof.position.set(0, 0.45, Zsw2 + 2.9); roof.rotation.x = -0.25; scene3.add(roof);
  // carretillas: ruedas de rayos a los costados, sombrillas azules y banderitas peruanas
  const occupied = (c, r) => st.some(x => x.row === r && c >= x.col && c < x.col + x.w / CS);
  CARTS.forEach(ct => {
    const x0 = X3(cellX(ct.c0)), x1 = X3(cellX(ct.c1 + 1)), zc = Z3(cellY(ct.r) + CS / 2), d = CS / U3, len = x1 - x0, top = ct.side === 'top';
    [[x0 - 0.1, ct.c0 - 1], [x1 + 0.1, ct.c1 + 1]].forEach(([x, nc]) => { if (occupied(nc, ct.r)) return; const w = wheel3(); w.scale.setScalar(1.25); w.rotation.y = Math.PI / 2; w.position.set(x, 0.5, zc); scene3.add(w); });
    // sombrillas: detrás de las carretillas de arriba, delante (sobre la vereda) en las de abajo, sin tapar la mesa
    const n = Math.max(1, Math.round(len / 4.5));
    for (let i = 0; i < n; i++) {
      const x = x0 + len * (i + 0.5) / n, u = top ? umbrella3(1.9, 2.9) : umbrella3(1.35, 1.9);
      u.position.set(x, 0.06, top ? zc - d / 2 - 0.9 : zc + d / 2 + 1.75); scene3.add(u);
    }
    // banderitas en las esquinas de la mesa
    [x0 + 0.15, x1 - 0.15].forEach((x, i) => { const f = flag3(); f.position.set(x, TOP, top ? zc - d / 2 + 0.15 : zc + d / 2 - 0.12); f.rotation.y = i ? Math.PI : 0; scene3.add(f); });
  });
  // clientes en la vereda, frente al mostrador
  const out = st.find(x => x.kind === 'counter');
  if (out) {
    const shirts = ['#d94f8a', '#2e86de', '#27ae60', '#f39c12', '#8e44ad'], skins = ['#c68c5a', '#e0ac7e', '#a8714a'], hair = ['#1d1410', '#3b2414', '#2a1a12'];
    for (let i = 0; i < 5; i++) {
      const p = person3(shirts[i], skins[i % 3], hair[i % 3]);
      p.position.set(X3(out.x) + 0.7 + i * ((out.w / U3 - 1.4) / 4), 0.06, Zsw2 + 0.75 + (i % 2) * 0.35); p.rotation.y = Math.PI; p.visible = false;
      scene3.add(p); STREET_PEOPLE.push(p);
    }
  }
  // árboles, conos, grifo, poste de luz y una tapa de buzón
  [[-14.2, Zsw - 1.6], [14.2, Zsw - 1.6], [-13.8, Zsw2 + 1.3], [13.8, Zsw2 + 1.3]].forEach(([x, z]) => { const t = tree3(); t.position.set(x, 0.06, z); scene3.add(t); });
  [[X3(cellX(6)) - 0.5, Zsw + 0.35], [X3(cellX(8)) + 0.5, Zsw + 0.35], [X3(cellX(6)) - 0.5, Zsw2 - 0.35], [12.3, Zsw + 0.6], [12.3, Zsw2 - 0.5]].forEach(([x, z]) => { const c = cone3(); c.position.set(x, 0, z); scene3.add(c); });
  const hyd = new THREE.Group();
  const hb = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 12), M('#c0392b')); hb.position.y = 0.3; hyd.add(hb);
  const ht = mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, 6.3, 0, 1.57), M('#c0392b')); ht.position.y = 0.6; hyd.add(ht);
  hyd.position.set(1.0, 0.06, Zsw2 + 0.8); scene3.add(hyd);
  const lamp = new THREE.Group();
  const lp = mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 10), M('#3a3a3a')); lp.position.y = 1.8; lamp.add(lp);
  const lh = mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), M('#3a3a3a')); lh.position.set(0.25, 3.55, 0); lamp.add(lh);
  const bulb = mesh(new THREE.BoxGeometry(0.4, 0.05, 0.22), M('#fff2b3', { emissive: '#fff2b3', emissiveIntensity: 0.6 })); bulb.position.set(0.3, 3.48, 0); lamp.add(bulb);
  lamp.position.set(-0.1, 0.06, Zsw - 1.6); scene3.add(lamp);
  const man = mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#5a5650'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.strokeStyle = '#3e3b37'; c.lineWidth = 5;
    for (let r = 14; r < 60; r += 12) { c.beginPath(); c.arc(64, 64, r, 0, 7); c.stroke(); }
  }), roughness: 0.8 }), false);
  man.rotation.x = -Math.PI / 2; man.position.set(X3(cellX(11)) + 0.6, 0.014, Z3(cellY(5)) + 0.4); scene3.add(man);
  buildStations();
  buildChefs();
}
