// ================= ESCENARIO DE LA CALLE (niveles Kevin: comida de la calle) =================
// Inspirado en los niveles callejeros de Overcooked: pista de asfalto con cruce peatonal, veredas, fachadas limeñas
// y carritos cebicheros de madera con toldos a rayas. Se usa cuando el nivel tiene layout: 'calle' (ver stations.js).
// Depende de las utilidades de render3d.js (M, mesh, canvasTex, rnd, X3, Z3, scene3...).
const IS_CALLE = LEVEL.layout === 'calle';

// Mesas de los carritos: madera clara con tablones y cubierta más clara
let _plankTex = null;
function cartCounter(lw, ld, rot) {
  if (!_plankTex) _plankTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#c98b4a'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#9a6430'; c.lineWidth = 4; for (let y = 0; y <= h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let i = 0; i < 300; i++) { c.fillStyle = 'rgba(90,50,20,' + Math.random() * 0.12 + ')'; c.fillRect(Math.random() * w, Math.random() * h, rnd(4, 18), 1.5); }
  });
  const g = new THREE.Group(), inner = new THREE.Group(); inner.rotation.y = rot; g.add(inner);
  const body = mesh(new THREE.BoxGeometry(lw - 0.04, 0.88, ld - 0.04), new THREE.MeshStandardMaterial({ map: _plankTex, roughness: 0.8 })); body.position.y = 0.46; inner.add(body);
  const top = mesh(new THREE.BoxGeometry(lw, 0.1, ld), M('#e8bd76', { roughness: 0.6 })); top.position.y = 0.95; inner.add(top);
  const skirt = mesh(new THREE.BoxGeometry(lw - 0.1, 0.08, ld - 0.1), M('#7a4a22')); skirt.position.y = 0.06; inner.add(skirt);
  return g;
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
  // carritos: ruedas en los extremos y toldo a rayas por fuera, sin tapar lo que hay sobre la mesa
  const COLORS = { red: ['#d23a2e', '#f6f1e6'], blue: ['#4a8fd6', '#f6f1e6'] };
  CARTS.forEach((ct, i) => {
    const x0 = X3(cellX(ct.c0)), x1 = X3(cellX(ct.c1 + 1)), zc = Z3(cellY(ct.r) + CS / 2), d = CS / U3, len = x1 - x0;
    [x0 - 0.1, x1 + 0.1].forEach(x => { const w = wheel3(); w.rotation.y = Math.PI / 2; w.position.set(x, 0.44, zc); scene3.add(w); });
    const [a, b] = COLORS[ct.awning] || COLORS.red;
    const top = ct.side === 'top';
    const aw = awning3(len + 0.3, top ? 1.7 : 0.9, a, b, top && i === 0 ? 'CEBICHE DE POTA' : top ? 'CEBICHERÍA' : '');
    const zA = top ? zc - d / 2 - 0.35 : zc + d / 2 + 1.5, yA = top ? 2.35 : 1.25;
    aw.position.set((x0 + x1) / 2, yA, zA); aw.rotation.x = top ? 0.12 : -0.18; scene3.add(aw);
    const half = (top ? 1.7 : 0.9) / 2;
    [[x0 - 0.1, zA - half], [x1 + 0.1, zA - half], [x0 - 0.1, zA + half], [x1 + 0.1, zA + half]].forEach(([x, z]) => {
      const p = mesh(new THREE.CylinderGeometry(0.035, 0.035, yA, 8), M('#5a4632')); p.position.set(x, yA / 2, z); scene3.add(p);
    });
  });
  // árboles, conos, grifo, poste de luz y una tapa de buzón
  [[-10.5, Zsw - 1.3], [3.6, Zsw - 1.3], [-13.6, Zsw2 + 1.3], [13.6, Zsw2 + 1.3]].forEach(([x, z]) => { const t = tree3(); t.position.set(x, 0.06, z); scene3.add(t); });
  [[X3(cellX(6)) - 0.5, Zsw + 0.35], [X3(cellX(8)) + 0.5, Zsw + 0.35], [X3(cellX(6)) - 0.5, Zsw2 - 0.35], [12.3, Zsw + 0.6], [12.3, Zsw2 - 0.5]].forEach(([x, z]) => { const c = cone3(); c.position.set(x, 0, z); scene3.add(c); });
  const hyd = new THREE.Group();
  const hb = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 12), M('#c0392b')); hb.position.y = 0.3; hyd.add(hb);
  const ht = mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, 6.3, 0, 1.57), M('#c0392b')); ht.position.y = 0.6; hyd.add(ht);
  hyd.position.set(-0.6, 0.06, Zsw2 + 0.8); scene3.add(hyd);
  const lamp = new THREE.Group();
  const lp = mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 10), M('#3a3a3a')); lp.position.y = 1.8; lamp.add(lp);
  const lh = mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), M('#3a3a3a')); lh.position.set(0.25, 3.55, 0); lamp.add(lh);
  const bulb = mesh(new THREE.BoxGeometry(0.4, 0.05, 0.22), M('#fff2b3', { emissive: '#fff2b3', emissiveIntensity: 0.6 })); bulb.position.set(0.3, 3.48, 0); lamp.add(bulb);
  lamp.position.set(-1.6, 0.06, Zsw - 1.6); scene3.add(lamp);
  const man = mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#5a5650'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.strokeStyle = '#3e3b37'; c.lineWidth = 5;
    for (let r = 14; r < 60; r += 12) { c.beginPath(); c.arc(64, 64, r, 0, 7); c.stroke(); }
  }), roughness: 0.8 }), false);
  man.rotation.x = -Math.PI / 2; man.position.set(X3(cellX(11)) + 0.6, 0.014, Z3(cellY(5)) + 0.4); scene3.add(man);
  buildStations();
  buildChefs();
}
