// ================= PIZARRA DE RECETA (pantalla antes de jugar) =================
// En vez del texto, una pizarra con tiza estilo Overcooked que muestra cómo se arma cada plato del nivel:
//   ingredientes (con la misma etiqueta que su caja) → herramientas → donde se juntan → el plato terminado.
// Los datos salen de DISHES[id].howto (js/dishes.js). Por defecto se muestra el plato del nivel (LEVEL.own);
// LEVEL.intro puede pedir varias recetas (p. ej. el cebiche y la chicha).
(function () {
  const ov = document.getElementById('startOverlay');
  if (!ov || typeof DISHES === 'undefined') return;
  const ids = (LEVEL.intro || [LEVEL.own]).filter(id => DISHES[id] && DISHES[id].howto);
  if (!ids.length) return;

  // fuera el texto: queda solo la pizarra y los botones
  ov.querySelectorAll('h1, p').forEach(e => e.remove());
  ov.classList.add('howtoOverlay');
  const W = 900, rowH = 74, gapSec = 24;
  const rowsOf = id => { const h = DISHES[id].howto; return h.rows.length + (h.extras || []).length; };
  const H = 120 + ids.reduce((a, id) => a + rowsOf(id) * rowH, 0) + (ids.length - 1) * gapSec + 40;
  const cnv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
  cnv.width = W * dpr; cnv.height = H * dpr; cnv.id = 'howto';
  cnv.style.width = '100%'; cnv.style.maxWidth = W + 'px'; cnv.style.aspectRatio = W + ' / ' + H;
  ov.insertBefore(cnv, ov.querySelector('.btnRow'));
  const hint = document.createElement('div'); hint.className = 'howtoKeys';
  hint.innerHTML = '<span><b>WASD</b> mover</span><span><b>E</b> / <b>Espacio</b> acción</span><span><b>B</b> ayudante</span><span><b>P</b> pausa</span>';
  ov.insertBefore(hint, ov.querySelector('.btnRow'));

  const c = cnv.getContext('2d'); c.scale(dpr, dpr);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chalk = 'rgba(245,242,232,';

  function board() {
    // marco de madera y pizarra verde oscuro con polvo de tiza
    c.fillStyle = '#7a4e2a'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#5c3a1e'; c.fillRect(6, 6, W - 12, H - 12);
    c.fillStyle = '#26332c'; c.fillRect(16, 16, W - 32, H - 32);
    for (let i = 0; i < 260; i++) { c.fillStyle = chalk + rnd(0.01, 0.05) + ')'; c.fillRect(rnd(16, W - 16), rnd(16, H - 16), rnd(10, 90), rnd(1, 3)); }
    const grd = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7); grd.addColorStop(0, 'rgba(255,255,255,.04)'); grd.addColorStop(1, 'rgba(0,0,0,.25)');
    c.fillStyle = grd; c.fillRect(16, 16, W - 32, H - 32);
  }
  function title(text) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '44px Kitchen, "Courier New", monospace'; c.fillStyle = chalk + '.95)';
    c.fillText(text, W / 2, 56);
    c.strokeStyle = chalk + '.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 200, 84); c.quadraticCurveTo(W / 2, 92, W / 2 + 200, 82); c.stroke();
    c.restore();
    // papelito "NUEVA RECETA" pegado en la esquina
    c.save(); c.translate(W - 112, 52); c.rotate(0.08);
    c.fillStyle = '#efe6d2'; c.fillRect(-72, -30, 144, 60);
    c.fillStyle = 'rgba(200,190,160,.8)'; c.fillRect(-26, -38, 52, 14);
    c.fillStyle = '#4a5a6a'; c.font = '20px Kitchen, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('NUEVA', 0, -8); c.fillText('RECETA', 0, 14);
    c.restore();
  }
  // flecha de tiza (un poco temblorosa)
  function arrow(x0, y0, x1, y1) {
    c.save(); c.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = chalk + (k ? 0.35 : 0.85) + ')'; c.lineWidth = k ? 2 : 4;
      const j = k ? rnd(-1.5, 1.5) : 0, mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.min(18, Math.abs(x1 - x0) * 0.08);
      c.beginPath(); c.moveTo(x0, y0 + j); c.quadraticCurveTo(mx, my + j, x1, y1 + j); c.stroke();
    }
    const a = Math.atan2(y1 - ((y0 + y1) / 2 - Math.min(18, Math.abs(x1 - x0) * 0.08)), x1 - (x0 + x1) / 2);
    c.strokeStyle = chalk + '.9)'; c.lineWidth = 4; c.beginPath();
    c.moveTo(x1 - 13 * Math.cos(a - 0.5), y1 - 13 * Math.sin(a - 0.5)); c.lineTo(x1, y1); c.lineTo(x1 - 13 * Math.cos(a + 0.5), y1 - 13 * Math.sin(a + 0.5)); c.stroke();
    c.restore();
  }
  function chalkCircle(x, y, r) {
    c.save(); c.strokeStyle = chalk + '.55)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(x, y, r, r * 0.96, rnd(-0.2, 0.2), 0, 7); c.stroke(); c.restore();
  }
  const ING = 56, TOOL = 58;
  const ing = (id, x, y) => c.drawImage(ingCanvas(id, ING, true), x - ING / 2, y - ING / 2, ING, ING);
  const tool = (id, x, y, big) => { const s = big ? 74 : TOOL; chalkCircle(x, y, s * 0.56); c.drawImage(toolCanvas(id, s), x - s / 2, y - s / 2, s, s); };

  // una cadena: ingredientes → herramientas; devuelve el punto donde termina
  function chain(row, y) {
    let x = 70;
    row.ings.forEach((id, i) => { ing(id, x + i * (ING - 6), y); });
    x += (row.ings.length - 1) * (ING - 6) + ING / 2 + 6;
    row.tools.forEach(t => { arrow(x, y, x + 44, y); x += 44 + TOOL / 2 + 4; tool(t, x, y); x += TOOL / 2 + 4; });
    if (row.optional) {
      c.save(); c.font = '15px Kitchen, sans-serif'; c.fillStyle = '#f4d35e'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('¿' + row.optional + '?', 40, y - ING / 2 - 4); c.restore();
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(244,211,94,.7)'; c.lineWidth = 2; c.strokeRect(38, y - ING / 2 - 14, x - 30, ING + 20); c.restore();
    }
    return x;
  }
  function section(id, y0) {
    const h = DISHES[id].howto, rows = h.rows, extras = h.extras || [];
    const n = rows.length + extras.length, yc = i => y0 + rowH * i + rowH / 2;
    const xMerge = 560, xDish = 770, yRowsMid = (yc(0) + yc(rows.length - 1)) / 2, yDish = (yc(0) + yc(n - 1)) / 2;
    const ends = rows.map((r, i) => [chain(r, yc(i)), yc(i)]);
    const extraEnds = extras.map((r, i) => [chain(r, yc(rows.length + i)), yc(rows.length + i)]);
    if (h.merge) {
      ends.forEach(([x, y]) => arrow(x + 4, y, xMerge - 46, yRowsMid + (y - yRowsMid) * 0.25));
      tool(h.merge, xMerge, yRowsMid, true);
      arrow(xMerge + 46, yRowsMid, xDish - 70, yDish);
    } else ends.forEach(([x, y]) => arrow(x + 4, y, xDish - 70, yDish + (y - yDish) * 0.3));
    extraEnds.forEach(([x, y]) => arrow(x + 4, y, xDish - 70, yDish + (y - yDish) * 0.3));
    // el plato terminado
    c.save(); c.fillStyle = 'rgba(245,242,232,.08)'; c.beginPath(); c.arc(xDish, yDish, 70, 0, 7); c.fill(); c.restore();
    chalkCircle(xDish, yDish, 70);
    const ic = dishIcon(id, 128); c.drawImage(ic, xDish - 64, yDish - 64, 128, 128);
    // orden de las capas (causa): pasos numerados sobre el plato
    if (h.order) {
      const ox = xDish - (h.order.length - 1) * 19, oy = yDish + 86;
      h.order.forEach((o, i) => {
        const x = ox + i * 38;
        c.drawImage(o.ing ? ingCanvas(o.ing, 30, true) : toolCanvas(o.tool, 30), x - 15, oy - 15, 30, 30);
        c.save(); c.fillStyle = '#f4d35e'; c.font = '14px Kitchen, sans-serif'; c.textAlign = 'center'; c.fillText(String(i + 1), x, oy - 20); c.restore();
      });
    }
    if (!h.order) {
      // se entrega en el mostrador
      c.drawImage(toolCanvas('counter', 34), xDish + 54, yDish + 40, 34, 34);
    }
  }
  function draw() {
    c.clearRect(0, 0, W, H);
    board();
    const name = (LEVEL.title || '').split(': ')[1] || DISHES[LEVEL.own].name;      // 'Nivel 1-1: Papa a la Huancaína' -> 'Papa a la Huancaína'
    title('¡' + name.toUpperCase() + '!');
    let y = 110;
    ids.forEach((id, k) => {
      if (k) { c.save(); c.strokeStyle = chalk + '.25)'; c.setLineDash([10, 8]); c.lineWidth = 2; c.beginPath(); c.moveTo(60, y - gapSec / 2); c.lineTo(W - 60, y - gapSec / 2); c.stroke(); c.restore(); }
      section(id, y); y += rowsOf(id) * rowH + gapSec;
    });
  }
  const fonts = document.fonts && document.fonts.load ? document.fonts.load('40px Kitchen') : Promise.resolve();
  Promise.all([fonts, typeof ICONS_READY !== 'undefined' ? ICONS_READY : null]).then(draw, draw);
})();
