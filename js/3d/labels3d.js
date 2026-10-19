// ================= ETIQUETAS DE LAS CAJAS DE INGREDIENTES =================
// Estilo de las cajas de Overcooked (círculo crema sobre la tapa de madera) con dibujos tipo cartoon:
// contorno marrón oscuro grueso, colores planos, un brillo y una sombra suave debajo.
// Cada dibujo ocupa el cuadro de -100..100 centrado en (0,0). Para añadir un ingrediente, añade su función aquí.
const LBL_INK = '#3b2414';
function lblShape(c, fill, path, lw) {
  c.beginPath(); path(c);
  c.fillStyle = fill; c.fill();
  c.lineWidth = lw || 9; c.strokeStyle = LBL_INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
}
function lblShadow(c, y, rx) { c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(4, y, rx, rx * 0.22, 0, 0, 7); c.fill(); }
function lblShine(c, x, y, rx, ry, rot) { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fill(); }

const LABEL_ICONS = {
  // ají amarillo: alargado y curvado, con su tallo verde
  aji(c) {
    lblShadow(c, 62, 70);
    lblShape(c, '#f39a16', c => { c.moveTo(-80, 56); c.bezierCurveTo(-70, 0, -20, -44, 30, -62); c.bezierCurveTo(60, -72, 80, -50, 68, -22); c.bezierCurveTo(52, 22, -10, 56, -80, 56); c.closePath(); });
    lblShine(c, 2, -24, 36, 10, -0.6);
    lblShape(c, '#3f7a2a', c => { c.moveTo(52, -56); c.quadraticCurveTo(62, -84, 80, -90); }, 10);
  },
  // tarro de leche evaporada (en el dibujo, caja de leche como en la referencia)
  leche(c) {
    lblShadow(c, 78, 62);
    lblShape(c, '#4a8fd6', c => { c.moveTo(-48, -36); c.lineTo(28, -36); c.lineTo(28, 76); c.lineTo(-48, 76); c.closePath(); });
    lblShape(c, '#2f6fb3', c => { c.moveTo(28, -36); c.lineTo(56, -58); c.lineTo(56, 56); c.lineTo(28, 76); c.closePath(); });
    lblShape(c, '#eaf3fb', c => { c.moveTo(-48, -36); c.lineTo(-30, -78); c.lineTo(46, -78); c.lineTo(56, -58); c.lineTo(28, -36); c.closePath(); });
    c.fillStyle = '#ffffff'; c.fillRect(-44, 4, 68, 38);
    // vaquita
    lblShape(c, '#ffffff', c => { c.ellipse(-10, 24, 20, 16, 0, 0, 7); }, 5);
    c.fillStyle = LBL_INK; c.beginPath(); c.arc(-17, 20, 3, 0, 7); c.arc(-3, 20, 3, 0, 7); c.fill();
    c.fillStyle = '#f2a6a0'; c.beginPath(); c.ellipse(-10, 31, 11, 6, 0, 0, 7); c.fill();
  },
  // galletas de soda: dos cuadradas con sus agujeritos
  galleta(c) {
    lblShadow(c, 70, 72);
    const cracker = (dx, dy, rot) => {
      c.save(); c.translate(dx, dy); c.rotate(rot);
      lblShape(c, '#e9c690', c => { c.rect(-46, -46, 92, 92); });
      c.fillStyle = '#b98a4f';
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { c.beginPath(); c.arc(i * 26, j * 26, 4.5, 0, 7); c.fill(); }
      c.restore();
    };
    cracker(18, 14, 0.25); cracker(-16, -12, 0.12);
  },
  // papa: café, con ojitos
  papa_raw(c) {
    lblShadow(c, 66, 70);
    lblShape(c, '#a8733f', c => { c.moveTo(-70, 0); c.bezierCurveTo(-74, -50, -20, -66, 20, -60); c.bezierCurveTo(70, -52, 82, 0, 66, 34); c.bezierCurveTo(48, 70, -40, 72, -62, 40); c.closePath(); });
    c.fillStyle = '#7d5129';
    [[-30, -20, 8], [18, -30, 6], [34, 18, 9], [-20, 28, 6], [-48, 6, 5]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r, r * 0.75, 0, 0, 7); c.fill(); });
    lblShine(c, -24, -40, 22, 9, -0.3);
  },
  // queso fresco: bloque blanco
  queso(c) {
    lblShadow(c, 64, 80);
    lblShape(c, '#fbf7ea', c => { c.moveTo(-78, -18); c.lineTo(-30, -52); c.lineTo(80, -40); c.lineTo(36, -6); c.closePath(); });
    lblShape(c, '#efe6cc', c => { c.moveTo(-78, -18); c.lineTo(36, -6); c.lineTo(36, 54); c.lineTo(-78, 40); c.closePath(); });
    lblShape(c, '#e3d7b6', c => { c.moveTo(36, -6); c.lineTo(80, -40); c.lineTo(80, 20); c.lineTo(36, 54); c.closePath(); });
    c.fillStyle = 'rgba(160,140,100,.35)';
    [[-50, 10], [-10, 26], [10, 4], [-30, 30]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
  },
  // sillao (para el Mundo 1-5 y el chifa)
  sillao(c) {
    lblShadow(c, 82, 44);
    lblShape(c, '#3a1d12', c => { c.moveTo(-18, -50); c.lineTo(18, -50); c.lineTo(18, -26); c.bezierCurveTo(42, -16, 44, 0, 44, 16); c.lineTo(44, 74); c.lineTo(-44, 74); c.lineTo(-44, 16); c.bezierCurveTo(-44, 0, -42, -16, -18, -26); c.closePath(); });
    lblShape(c, '#c0392b', c => { c.rect(-22, -78, 44, 30); });
    lblShape(c, '#f1d9a8', c => { c.rect(-34, 16, 68, 40); }, 6);
    c.fillStyle = '#c0392b'; c.fillRect(-26, 28, 52, 8);
    lblShine(c, -28, 2, 6, 18, 0);
  },
  // pota: calamar gigante blanco rosado con aletas y tentáculos
  pota(c) {
    lblShadow(c, 72, 76);
    c.strokeStyle = LBL_INK; c.lineWidth = 7; c.lineCap = 'round';
    [-24, -10, 4, 18].forEach((dy, i) => { c.beginPath(); c.moveTo(-40, 20 + dy * 0.4); c.bezierCurveTo(-60, 30 + dy, -74, 46 + dy, -86, 40 + dy); c.stroke();
      c.strokeStyle = '#e9b8ad'; c.lineWidth = 3; c.stroke(); c.strokeStyle = LBL_INK; c.lineWidth = 7; });
    lblShape(c, '#f1d7d0', c => { c.moveTo(-44, 6); c.bezierCurveTo(-20, -22, 40, -40, 66, -46); c.lineTo(70, 22); c.bezierCurveTo(40, 30, -20, 40, -44, 30); c.closePath(); });
    lblShape(c, '#e9c1b8', c => { c.moveTo(56, -44); c.lineTo(92, -70); c.lineTo(80, -10); c.closePath(); }, 6);
    lblShape(c, '#e9c1b8', c => { c.moveTo(62, 20); c.lineTo(96, 40); c.lineTo(70, -6); c.closePath(); }, 6);
    c.fillStyle = LBL_INK; c.beginPath(); c.arc(-28, 14, 6, 0, 7); c.fill();
    lblShine(c, 4, -14, 26, 6, -0.3);
  },
  // pota ya cortada en cuadritos (como llega a la carretilla)
  pota_cortada(c) {
    lblShadow(c, 66, 78);
    [[-46, 18], [-10, 26], [26, 20], [56, 30], [-30, -14], [8, -8], [42, -12], [-6, -40], [24, -38]].forEach(([x, y], i) => {
      c.save(); c.translate(x, y); c.rotate((i % 3 - 1) * 0.2);
      lblShape(c, i % 2 ? '#f6ece6' : '#f1ddd6', c => c.rect(-17, -15, 34, 30), 6);
      c.restore();
    });
    lblShine(c, -2, -42, 10, 4, 0);
  },
  // camote ya cocido: rodajas anaranjadas con su piel morada
  camote_cocido(c) {
    lblShadow(c, 64, 78);
    [[-40, 14], [0, 4], [40, 14]].forEach(([x, y]) => {
      lblShape(c, '#8a3a4a', c => c.ellipse(x, y, 34, 30, 0, 0, 7), 7);
      lblShape(c, '#f08a2a', c => c.ellipse(x, y - 2, 26, 22, 0, 0, 7), 0);
      lblShine(c, x - 8, y - 10, 9, 4, -0.3);
    });
  },
  // limones verdes, uno partido por la mitad
  limon(c) {
    lblShadow(c, 64, 76);
    lblShape(c, '#5c9b2e', c => c.ellipse(-26, 6, 46, 40, -0.2, 0, 7));
    lblShine(c, -40, -12, 14, 7, -0.4);
    lblShape(c, '#5c9b2e', c => c.ellipse(34, 18, 42, 40, 0, 0, 7));
    lblShape(c, '#e5f0a6', c => c.ellipse(34, 18, 32, 30, 0, 0, 7), 4);
    c.strokeStyle = '#a8c95a'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(34, 18); c.lineTo(34 + Math.cos(a) * 28, 18 + Math.sin(a) * 26); c.stroke(); }
  },
  // cebolla roja: morada con capas y raíz
  cebolla_roja(c) {
    lblShadow(c, 70, 66);
    lblShape(c, '#8a2a55', c => { c.moveTo(0, -78); c.bezierCurveTo(10, -54, 70, -40, 66, 10); c.bezierCurveTo(62, 56, -62, 56, -66, 10); c.bezierCurveTo(-70, -40, -10, -54, 0, -78); c.closePath(); });
    c.strokeStyle = '#b5517f'; c.lineWidth = 4; [[-30, 0], [0, 0], [30, 0]].forEach(([x]) => { c.beginPath(); c.moveTo(x * 0.2, -66); c.quadraticCurveTo(x * 1.4, -10, x * 0.6, 48); c.stroke(); });
    c.strokeStyle = '#d9b58a'; c.lineWidth = 4; [-10, 0, 10].forEach(x => { c.beginPath(); c.moveTo(x * 0.5, 50); c.lineTo(x, 66); c.stroke(); });
    lblShine(c, -30, -16, 9, 20, -0.2);
  },
  // ají limo: dos ajicitos rojos
  aji_limo(c) {
    lblShadow(c, 64, 70);
    [[-24, -0.5, '#d9271c'], [22, 0.35, '#e8a21c']].forEach(([x, r, col]) => {
      c.save(); c.translate(x, 6); c.rotate(r);
      lblShape(c, col, c => { c.moveTo(0, -52); c.bezierCurveTo(22, -46, 20, 10, 2, 60); c.bezierCurveTo(-16, 10, -22, -46, 0, -52); c.closePath(); });
      lblShape(c, '#3f7a2a', c => { c.moveTo(-8, -52); c.quadraticCurveTo(0, -78, 12, -80); }, 8);
      lblShine(c, -6, -20, 4, 14, 0);
      c.restore();
    });
  },
  // camote: piel morada con un corte anaranjado
  camote(c) {
    lblShadow(c, 62, 80);
    lblShape(c, '#8a3a4a', c => { c.moveTo(-84, 10); c.bezierCurveTo(-70, -40, 40, -50, 74, -16); c.bezierCurveTo(90, 0, 70, 40, 30, 44); c.bezierCurveTo(-20, 50, -76, 44, -84, 10); c.closePath(); });
    lblShape(c, '#f08a2a', c => c.ellipse(64, 12, 18, 30, 0.2, 0, 7), 6);
    lblShine(c, -30, -18, 26, 7, -0.15);
  },
  // huevos: dos huevos de cáscara marrón
  huevo(c) {
    lblShadow(c, 66, 74);
    lblShape(c, '#efd8b4', c => c.ellipse(30, 6, 40, 52, 0.25, 0, 7));
    lblShine(c, 18, -18, 10, 16, 0.25);
    lblShape(c, '#e3c08e', c => c.ellipse(-26, 14, 40, 52, -0.2, 0, 7));
    lblShine(c, -38, -10, 10, 16, -0.2);
  },
  // cebolla china: atado de tallos verdes con la base blanca y su amarre
  cebolla_china(c) {
    lblShadow(c, 70, 70);
    [[-26, -0.5], [-8, -0.25], [10, 0], [28, 0.25]].forEach(([x, rot]) => {
      c.save(); c.translate(x * 0.4, 40); c.rotate(rot * 0.5);
      lblShape(c, '#5aa83a', c => { c.moveTo(-9, 0); c.bezierCurveTo(-12, -60, -6, -100, 0, -112); c.bezierCurveTo(6, -100, 12, -60, 9, 0); c.closePath(); }, 7);
      lblShape(c, '#f6f3e6', c => { c.moveTo(-11, 0); c.lineTo(-11, 26); c.quadraticCurveTo(0, 40, 11, 26); c.lineTo(11, 0); c.closePath(); }, 7);
      c.restore();
    });
    lblShape(c, '#c0392b', c => { c.rect(-30, 26, 60, 12); }, 6);
    c.strokeStyle = '#e8e0c8'; c.lineWidth = 3; [-10, 0, 10].forEach(x => { c.beginPath(); c.moveTo(x * 0.6, 72); c.lineTo(x, 84); c.stroke(); });
  },
  // pollo crudo: presa rosada con hueso
  pollo_raw(c) {
    lblShadow(c, 66, 70);
    // hueso: palito con dos nudos en la punta
    c.save(); c.translate(56, -44); c.rotate(-Math.PI / 4);
    lblShape(c, '#f4f0e6', c => { c.rect(-34, -9, 40, 18); }, 8);
    lblShape(c, '#f4f0e6', c => { c.arc(14, -12, 13, 0, 7); }, 8);
    lblShape(c, '#f4f0e6', c => { c.arc(14, 12, 13, 0, 7); }, 8);
    c.fillStyle = '#f4f0e6'; c.fillRect(-2, -7, 18, 14);
    c.restore();
    lblShape(c, '#f2a993', c => { c.moveTo(-70, 30); c.bezierCurveTo(-76, -20, -20, -50, 22, -30); c.bezierCurveTo(52, -14, 50, 30, 20, 50); c.bezierCurveTo(-10, 70, -64, 66, -70, 30); c.closePath(); });
    lblShine(c, -30, -16, 22, 9, -0.4);
  },
  // arroz: tazón con arroz blanco
  arroz_raw(c) {
    lblShadow(c, 70, 70);
    lblShape(c, '#ffffff', c => { c.moveTo(-62, -2); c.bezierCurveTo(-60, -60, 60, -60, 62, -2); c.closePath(); });
    c.fillStyle = '#dcd6c4'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(-44 + (i % 7) * 15, -14 - Math.floor(i / 7) * 16, 5, 2.6, i, 0, 7); c.fill(); }
    lblShape(c, '#4a8fd6', c => { c.moveTo(-74, -4); c.lineTo(74, -4); c.bezierCurveTo(70, 50, 40, 66, 0, 66); c.bezierCurveTo(-40, 66, -70, 50, -74, -4); c.closePath(); });
    c.strokeStyle = '#eaf3fb'; c.lineWidth = 6; c.beginPath(); c.moveTo(-60, 18); c.lineTo(60, 18); c.stroke();
  },
  // palta: mitad con pepa
  palta(c) {
    lblShadow(c, 76, 56);
    lblShape(c, '#3d6b22', c => { c.moveTo(0, -78); c.bezierCurveTo(34, -78, 40, -30, 52, 2); c.bezierCurveTo(70, 46, 40, 76, 0, 76); c.bezierCurveTo(-40, 76, -70, 46, -52, 2); c.bezierCurveTo(-40, -30, -34, -78, 0, -78); c.closePath(); });
    lblShape(c, '#c9e07a', c => { c.moveTo(0, -60); c.bezierCurveTo(24, -60, 28, -24, 38, 4); c.bezierCurveTo(52, 38, 30, 62, 0, 62); c.bezierCurveTo(-30, 62, -52, 38, -38, 4); c.bezierCurveTo(-28, -24, -24, -60, 0, -60); c.closePath(); }, 5);
    lblShape(c, '#8a5a2b', c => { c.arc(0, 22, 22, 0, 7); }, 7);
    lblShine(c, -7, 14, 7, 5, 0);
  }
};

// Textura de la etiqueta: círculo crema con borde de madera oscura y el dibujo
function labelTexture(type) {
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = 256;
  const c = cnv.getContext('2d');
  c.translate(128, 128);
  c.fillStyle = '#6b3f1f'; c.beginPath(); c.arc(0, 0, 126, 0, 7); c.fill();
  c.fillStyle = '#f6ecd4'; c.beginPath(); c.arc(0, 0, 112, 0, 7); c.fill();
  c.strokeStyle = 'rgba(107,63,31,.35)'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 104, 0, 7); c.stroke();
  const draw = LABEL_ICONS[type];
  if (draw) { c.save(); c.scale(0.86, 0.86); draw(c); c.restore(); }
  else { c.fillStyle = LBL_INK; c.font = 'bold 120px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((typeof ICON !== 'undefined' && ICON[type]) || '?', 0, 6); }
  const t = new THREE.CanvasTexture(cnv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return t;
}
