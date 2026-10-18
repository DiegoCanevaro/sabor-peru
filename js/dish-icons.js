// ================= ICONOS DE LOS PLATOS (pantalla de inicio y de niveles) =================
// Ilustraciones dibujadas en código, en el mismo estilo que las etiquetas de las cajas:
// contorno marrón oscuro grueso, colores planos, brillos y sombra suave. Cada plato se dibuja servido en su plato.
// Uso: dishIcon('huancaina', 120) -> <canvas> listo para insertar.
const DI_INK = '#3b2414';
function diShape(c, fill, path, lw) {
  c.beginPath(); path(c);
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.lineWidth = lw === undefined ? 7 : lw; c.strokeStyle = DI_INK; c.lineJoin = 'round'; c.lineCap = 'round';
  if (c.lineWidth) c.stroke();
}
const diShine = (c, x, y, rx, ry, rot, a) => { c.fillStyle = 'rgba(255,255,255,' + (a || 0.6) + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fill(); };
function diPlate(c) {        // plato blanco visto en diagonal, con su sombra
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(4, 58, 92, 34, 0, 0, 7); c.fill();
  diShape(c, '#ffffff', c => c.ellipse(0, 42, 92, 44, 0, 0, 7));
  diShape(c, '#eef1f4', c => c.ellipse(0, 40, 66, 30, 0, 0, 7), 3);
}
function diEgg(c, x, y, s) {  // medio huevo duro
  c.save(); c.translate(x, y); c.scale(s, s);
  diShape(c, '#fbfbf5', c => c.ellipse(0, 0, 18, 13, -0.2, 0, 7), 5);
  diShape(c, '#f2a81d', c => c.ellipse(1, -1, 8, 6, -0.2, 0, 7), 3);
  c.restore();
}
function diOlive(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
  diShape(c, '#3a2340', c => c.ellipse(0, 0, 9, 7, 0.4, 0, 7), 4); diShine(c, -3, -2, 3, 2, 0.4, 0.5);
  c.restore();
}
const DISH_ICONS = {
  // Papa a la huancaína: hoja de lechuga, rodajas de papa amarilla bañadas en salsa, huevo y aceituna
  huancaina(c) {
    diPlate(c);
    diShape(c, '#7cbf45', c => { c.moveTo(-70, 40); c.bezierCurveTo(-74, 6, -40, -6, -10, 0); c.bezierCurveTo(30, -10, 72, 0, 72, 34); c.bezierCurveTo(60, 60, -50, 66, -70, 40); c.closePath(); }, 5);
    [[-34, 18], [0, 12], [34, 18]].forEach(([x, y]) => { diShape(c, '#f6d257', c => c.ellipse(x, y, 26, 17, 0, 0, 7), 5); });
    diShape(c, '#f3c13a', c => { c.moveTo(-58, 22); c.bezierCurveTo(-58, -14, -20, -22, 6, -16); c.bezierCurveTo(40, -24, 62, -6, 58, 22); c.bezierCurveTo(52, 30, 44, 26, 40, 34); c.bezierCurveTo(30, 44, 16, 34, 6, 40); c.bezierCurveTo(-8, 46, -20, 34, -32, 38); c.bezierCurveTo(-46, 42, -58, 34, -58, 22); c.closePath(); });
    diShine(c, -18, -6, 22, 6, -0.15, 0.55);
    diEgg(c, -20, 4, 1.05); diOlive(c, 22, 0, 1.1);
  },
  // Causa limeña: cilindro con capas visibles (masa, relleno de pollo, masa, palta) y aceituna encima
  causa(c) {
    diPlate(c);
    const L = [['#f2c94c', 28], ['#efe1b8', 16], ['#f2c94c', 26], ['#86bf4b', 12]];
    let y = 44;
    L.forEach(([col, h]) => {
      diShape(c, col, c => { c.moveTo(-46, y); c.lineTo(-46, y - h); c.ellipse(0, y - h, 46, 15, 0, Math.PI, 0, true); c.lineTo(46, y); c.ellipse(0, y, 46, 15, 0, 0, Math.PI); c.closePath(); }, 6);
      y -= h;
    });
    diShape(c, '#9ccf5e', c => c.ellipse(0, y, 46, 15, 0, 0, 7), 6);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 5; c.beginPath(); c.moveTo(-34, 36); c.lineTo(-34, y + 6); c.stroke();
    diOlive(c, 8, y - 6, 1.2);
    diShape(c, '#3f7a2a', c => { c.moveTo(-14, y - 4); c.quadraticCurveTo(-20, y - 16, -10, y - 18); }, 4);
  },
  // Ají de gallina: crema amarilla con pollo deshilachado, arroz blanco, papa, huevo y aceituna
  aji(c) {
    diPlate(c);
    diShape(c, '#ffffff', c => { c.moveTo(-74, 36); c.bezierCurveTo(-76, -6, -26, -10, -18, 30); c.bezierCurveTo(-30, 46, -66, 48, -74, 36); c.closePath(); }, 6);
    c.fillStyle = '#d8d2c0'; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(-62 + (i % 3) * 13, 14 + Math.floor(i / 3) * 9, 3.5, 2, i, 0, 7); c.fill(); }
    diShape(c, '#f6d257', c => c.ellipse(52, 30, 24, 15, 0, 0, 7), 5);
    diShape(c, '#eab73f', c => { c.moveTo(-28, 34); c.bezierCurveTo(-34, -4, 0, -18, 26, -8); c.bezierCurveTo(52, 2, 50, 30, 36, 40); c.bezierCurveTo(14, 52, -16, 50, -28, 34); c.closePath(); });
    c.strokeStyle = '#f7e2a6'; c.lineWidth = 4; c.lineCap = 'round';
    [[-14, 10, 8, 4], [2, 22, 22, 16], [8, 2, 26, 8], [-6, 30, 12, 34], [16, 30, 30, 24]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
    diShine(c, -2, -2, 16, 5, -0.2, 0.5);
    diEgg(c, 44, 2, 0.95); diOlive(c, 6, -8, 1.05);
  }
};
// Arroz chaufa: cúpula de arroz dorado por el sillao, con pollo y cebolla china
DISH_ICONS.chaufa = function (c) {
  diPlate(c);
  diShape(c, '#cf9445', c => { c.moveTo(-64, 40); c.bezierCurveTo(-66, -34, 66, -34, 64, 40); c.bezierCurveTo(40, 52, -40, 52, -64, 40); c.closePath(); });
  c.fillStyle = '#e8b866';
  for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 10 + (i * 7) % 44; c.beginPath(); c.ellipse(Math.cos(a) * r, 10 + Math.sin(a) * r * 0.45, 4, 2.2, a, 0, 7); c.fill(); }
  [[-30, 4], [8, -10], [30, 18], [-8, 26]].forEach(([x, y]) => diShape(c, '#f3e2b8', c => c.rect(x - 7, y - 6, 14, 12), 4));
  // tiras de tortilla de huevo
  [[-44, 12, 0.3], [20, -4, -0.4], [-4, 8, 0.1], [44, 20, 0.5]].forEach(([x, y, r]) => { c.save(); c.translate(x, y); c.rotate(r); diShape(c, '#f6c531', c => c.rect(-11, -3.5, 22, 7), 3); c.restore(); });
  c.strokeStyle = '#4f9a32'; c.lineWidth = 5;
  [[-16, -6], [18, 4], [-36, 22], [40, -2], [4, 30]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 4.5, 0, 7); c.stroke(); });
  diShine(c, -22, -14, 18, 6, -0.3, 0.45);
};
function dishIcon(id, size) {
  const cnv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
  cnv.width = cnv.height = size * dpr; cnv.style.width = cnv.style.height = size + 'px'; cnv.className = 'dishIcon';
  const c = cnv.getContext('2d');
  c.scale(size * dpr / 220, size * dpr / 220); c.translate(110, 96);
  if (DISH_ICONS[id]) DISH_ICONS[id](c);
  return cnv;
}
