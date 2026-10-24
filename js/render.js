// ================= DIBUJO (canvas) =================
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
function emoji(e, x, y, size) { ctx.font = size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(e, x, y); }
function label(t, x, y, col, size, align) { ctx.font = Math.round((size || 11) * 1.12) + 'px Coolvetica, Arial, sans-serif'; ctx.fillStyle = col || '#fff'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); }
function bar(x, y, w, p, col, h) {
  h = h || 10;
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, Math.min(1, p)), h - 2);
}
function drawLayers(layers, x, y, size) {
  const w = size * 0.8, hh = Math.max(4, size * 0.15);
  layers.forEach((l, i) => {
    ctx.fillStyle = LAYER_COL[l]; ctx.fillRect(x - w / 2, y + size * 0.1 - (i + 1) * hh, w, hh - 1);
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, y + size * 0.1 - (i + 1) * hh, w, hh - 1);
  });
}
function drawItem(it, x, y, size) {
  if (!it) return;
  if (it.type === 'plate') {
    emoji('🍽️', x, y, size);
    drawLayers(it.parts.filter(p => LAYER_COL[p]), x, y, size);
    it.parts.filter(p => PART_EMOJI[p]).forEach(p => emoji(PART_EMOJI[p], x + PART_POS[p][0] * size, y + PART_POS[p][1] * size, size * .42));
  } else {
    emoji(ICON[it.type], x, y, size);
    if (LABELED.includes(it.type)) label(NAME[it.type] + (it.n > 1 ? ' ×' + it.n : ''), x, y + size * .62, '#fff', 9);
  }
}
const COL = { stew: '#5a6470', fryer: '#8a8f96', skewer: '#c9a46a', grill: '#3a3030', cups: '#7aa7c9', balde: '#6a2c8a', wok: '#3a2a2a', crate: '#8a5a2b', plates: '#9aa5ad', trash: '#4a4f55', pot: '#5a6470', board: '#b98a4f', bowl: '#c98a4a', blender: '#6b4f7a', pan: '#4a4a52', table: '#a07a45', counter: '#7a3b2b' };

function drawStation(s) {
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  ctx.fillStyle = COL[s.kind]; ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = '#2a1b0a'; ctx.lineWidth = 3; ctx.strokeRect(s.x, s.y, s.w, s.h);
  const base = (icon) => { emoji(icon, cx - 14, cy + 4, 26); label(s.label, cx, s.y + s.h - 7, '#fff', 10); };
  // barra de progreso: verde mientras alguien mantiene la acción; en las estaciones "hold" avisa si falta mantener
  const prog = (p) => bar(s.x + 4, s.y + 4, s.w - 8, p, s.worked ? '#5ec26a' : '#f4b83c', 8);
  const hint = () => { if (!s.worked && Math.floor(Date.now() / 450) % 2) label('MANTÉN E', cx, s.y + 18, '#f4e04c', 9); };
  switch (s.kind) {
    case 'crate': emoji(s.emoji, cx, cy - 6, 28); label(s.label, cx, s.y + s.h - 9, '#fff', 10); break;
    case 'trash': emoji('🗑️', cx, cy - 6, 28); label(s.label, cx, s.y + s.h - 9, '#fff', 10); break;
    case 'table':
      label(s.label, cx, s.y + s.h - 9, '#2a1b0a');
      if (s.item) drawItem(s.item, cx, cy - 8, 30);
      break;
    case 'pot': {
      const sl = s.slots[0];
      base('🍲');
      if (sl) { emoji(ICON[sl.type], cx + 20, cy + 2, 18); bar(s.x + 4, s.y + 4, s.w - 8, sl.t / T.cook, sl.done ? '#5ec26a' : '#f4b83c', 8); }
      break;
    }
    case 'board':
      base('🔪');
      if (s.state === 'chopping') { emoji(ICON[s.product], cx + 20, cy + 2, 18); prog(s.t / T.board); hint(); }
      if (s.state === 'done') { emoji(ICON[s.product], cx + 20, cy + 2, 20); label('¡lista!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'bowl':
      base('🥣');
      s.items.forEach((it, i) => emoji(ICON[it], s.x + 56 + i * 16, cy + 2, 14));
      if (s.state === 'idle' && bowlMatch(s.items)) { prog(0); hint(); }
      if (s.state === 'mashing') { prog(s.t / T.bowl); hint(); }
      if (s.state === 'done') { emoji(s.out === 'masa' ? '🟨' : ICON[s.out], cx + 20, cy + 2, 20); label('¡lista!' + (s.n > 1 ? ' ×' + s.n : ''), cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'blender': {
      base('🥤');
      if (s.state !== 'done') s.items.forEach((it, i) => emoji(ICON[it], s.x + 12 + i * 15, s.y + 11, 12));
      if (s.state === 'blending') { bar(s.x + 4, s.y + 4, s.w - 8, s.t / blendTime(s.items), '#f4b83c', 8); if (s.t >= blendTime(s.items)) label('¿falta algo?', cx, s.y + 18, '#f4e04c', 9); }
      if (s.state === 'done') { emoji(ICON[s.out], cx + 20, cy + 2, 20); label('¡lista!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    }
    case 'pan':
      base('🍳');
      s.items.forEach((it, i) => emoji(ICON[it], s.x + 56 + i * 16, cy + 2, 14));
      if (s.state === 'cooking') prog(s.t / T.pan);
      if (s.state === 'done') { emoji('🍛', cx + 20, cy + 2, 20); label('¡listo!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'stew':
      base('🍲');
      s.items.forEach((it, i) => emoji(ICON[it], s.x + 40 + i * 14, cy + 2, 13));
      if (s.state === 'cooking') prog(s.t / T.stew);
      if (s.state === 'done') { emoji('🍛', cx + 20, cy + 2, 20); label('¡listo!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'cups': base('🥤'); break;
    case 'balde':
      base('🪣');
      if (s.state === 'filling') { emoji('🥤', cx + 20, cy + 2, 16); prog(s.t / T.balde); }
      if (s.state === 'done') { emoji('🍇', cx + 20, cy + 2, 18); label('¡lista!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'wok':
      base('🥘');
      s.items.forEach((it, i) => emoji(ICON[it], s.x + 8 + i * 12, s.y + 14, 11));
      if (s.state === 'cooking') prog(s.t / T.wok);
      if (s.state === 'done') { emoji(ICON[s.out] || '🍛', cx + 20, cy + 2, 20); label('¡listo!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'skewer':
      base('🍢');
      if (s.state === 'chopping') { emoji(ICON[s.product], cx + 20, cy + 2, 18); prog(s.t / T.skewer); hint(); }
      if (s.state === 'done') { emoji(ICON[s.product], cx + 20, cy + 2, 20); label('¡listo!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'grill':
      base('🔥');
      s.slots.forEach((sl, i) => { emoji(sl.done ? '🍢' : ICON[sl.type], s.x + 14 + i * 18, s.y + 16, 14); });
      if (s.slots.length) { const c = s.slots.filter(x => !x.done); if (c.length) prog(Math.min(...c.map(x => x.t)) / T.grill); else label('¡listos!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'fryer':
      base('🍟');
      if (s.state === 'frying') { emoji(ICON[s.item], cx + 20, cy + 2, 14); prog(s.t / T.fry); }
      if (s.state === 'done') { emoji('🍟', cx + 20, cy + 2, 20); label('¡listas!', cx, s.y + 12, '#8fe39a', 11); }
      break;
    case 'counter':
      label(s.label, cx, s.y + s.h - 8, '#e8c9b8', 9);
      break;
  }
}

function drawCustomers() {      // clientes en el mostrador: un puesto por cliente (cara, plato que pide y barra de paciencia)
  for (const c of customers) {
    if (c.state === 'queued' || (c.state !== 'waiting' && clock - c.doneAt > 1.5)) continue;
    const out = byKind('counter'), wide = out.w > out.h, k = c.idx % 2;      // mostrador horizontal (calle): clientes en fila
    const cx = wide ? out.x + 32 + k * 64 : out.x + out.w / 2, y0 = wide ? out.y + 2 : out.y + 4 + k * 62, pr = c.patience / c.max;
    const face = c.state === 'happy' ? '😋' : c.state === 'angry' ? '😠' : pr > .4 ? '🙂' : pr > .15 ? '😐' : '😟';
    emoji(face, cx - 11, y0 + 27, 24);
    emoji(c.dish.icon, cx + 15, y0 + 27, 16);
    if (c.state === 'waiting') bar(cx - 26, y0 + 44, 52, pr, pr > .4 ? '#5ec26a' : pr > .15 ? '#f4b83c' : '#d9473a', 7);
  }
}

function drawChef(p, fill, stroke, icon, name) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 12, R, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke();
  emoji(icon, p.x, p.y - 2, 18);
  if (name) label(name, p.x, p.y + 26, '#17325c', 10);
  if (p.held) drawItem(p.held, p.x, p.y - 34, 26);
}

function draw() {
  ctx.fillStyle = '#d8c9a3'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#cdbd93';
  for (let y = 0; y < H; y += 40) for (let x = (y / 40 % 2) * 40; x < W; x += 80) ctx.fillRect(x, y, 40, 40);
  for (const s of st) drawStation(s);
  drawCustomers();
  drawChef(player, '#e8793a', '#2a1b0a', '👨‍🍳');
  if (helper) drawChef(helper, '#3a7bd5', '#17325c', '🤖', 'AYUDANTE');
  // resaltar estación cercana al jugador
  const n = nearestStation(player);
  if (n) { ctx.strokeStyle = '#f4e04c'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.strokeRect(n.x - 3, n.y - 3, n.w + 6, n.h + 6); ctx.setLineDash([]); }
  if (toast.t > 0) {
    ctx.fillStyle = 'rgba(30,15,5,.88)'; ctx.fillRect(W / 2 - 170, 416, 340, 28);
    label(toast.msg, W / 2, 430, '#f4e4c1', 14);
  }
}
