// ================= HUD: TICKETS Y FIN DE NIVEL =================
// Un ticket por cliente, estilo Overcooked: el plato, la barra de espera y los ingredientes (las mismas ilustraciones
// de las cajas). Debajo de un ingrediente solo aparece una señal negra si necesita una acción compleja (olla, freidora,
// sartén, wok, parrilla...); las básicas como cortar no se muestran. Los que van juntos (licuadora, bowl, wok)
// se agrupan bajo una sola señal.
const tickEls = [];
const hasIcons = typeof iconEl === 'function';
const COMPLEX_TOOLS = ['pot', 'stew', 'fryer', 'pan', 'wok', 'grill', 'blender', 'bowl', 'balde'];
function chip(id) { const s = document.createElement('span'); s.className = 'chip'; if (hasIcons) s.appendChild(iconEl('ing', id, 24)); else s.textContent = ICON[id] || '?'; return s; }
function sign(id, px) { const s = document.createElement('span'); s.className = 'tsign'; if (hasIcons) s.appendChild(iconEl('sign', id, px)); return s; }
function ticketSlots(D) {
  const box = document.createElement('div'); box.className = 'slots';
  // cada ingrediente con su acción compleja principal (la última); los seguidos que van a la misma herramienta
  // (p. ej. todo lo del wok) comparten una sola señal
  const groups = [];
  D.ticket.slots.forEach(sl => {
    const ids = sl.g || [sl.id], t = sl.g ? sl.t : sl.t.filter(x => COMPLEX_TOOLS.includes(x)).pop() || null;
    const last = groups[groups.length - 1];
    if (last && t && last.t === t) last.ids.push(...ids); else groups.push({ ids: ids.slice(), t });
  });
  groups.forEach(gr => {
    const g = document.createElement('div'); g.className = 'grp';
    const row = document.createElement('div'); row.className = 'grow'; gr.ids.forEach(id => row.appendChild(chip(id))); g.appendChild(row);
    if (gr.t) g.appendChild(sign(gr.t, 18));
    box.appendChild(g);
  });
  return box;
}
// la etiqueta Entrada / Segundo solo hace falta si en el nivel se mezclan (las entradas salen antes)
const MIXED_COURSES = ['entrada', 'segundo'].every(k => LEVEL.dishes.some(d => DISHES[d].course === k));
function buildTickets() {
  const box = document.getElementById('tickets');
  box.innerHTML = ''; tickEls.length = 0;
  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    const D = DISHES[ORDERS[i]];
    const d = document.createElement('div');
    d.className = 'ticket upcoming';
    const img = typeof dishIcon === 'function' && hasDishIcon(D.id);
    d.innerHTML = '<div class="card"><div class="tbar"><i></i></div><div class="dish" title="' + D.name + '">' + (img ? '' : D.icon) + '</div>' +
      (MIXED_COURSES ? '<div class="course ' + D.course + '">' + ({ entrada: 'Entrada', segundo: 'Segundo', plato: 'Plato', bebida: 'Bebida' }[D.course] || '') + '</div>' : '') + '</div>';
    d.appendChild(ticketSlots(D));
    if (img) d.querySelector('.dish').appendChild(dishIcon(D.id, 46));
    box.appendChild(d);
    tickEls.push({ el: d, bar: d.querySelector('.tbar i'), cls: '', w: -1, col: '' });
  }
}
// reloj del turno en el HUD (rojo y latiendo en los últimos 30 s)
const clockEl = document.createElement('span'); clockEl.id = 'timeDisplay';
document.getElementById('hud').insertBefore(clockEl, document.getElementById('customerDisplay'));
let clockTxt = '';
function updateClock() {
  const t = Math.ceil(timeLeft), txt = '⏱ ' + Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  if (txt !== clockTxt) { clockEl.textContent = txt; clockTxt = txt; clockEl.classList.toggle('low', t <= 30); }
}
updateClock();
function updateTickets() {
  tickEls.forEach((t, i) => {
    const c = customers[i]; if (!c) return;
    if ((c.state === 'happy' || c.state === 'angry') && clock - c.doneAt > 1.5) { if (t.cls !== 'gone') { t.el.style.display = 'none'; t.cls = 'gone'; } return; }
    let pct = 1, cls = 'ticket upcoming';
    if (c.state === 'waiting') { pct = Math.max(0, c.patience / c.max); cls = 'ticket' + (pct < 0.2 ? ' urgent' : '') + (servable(c) ? '' : ' hold'); }
    else if (c.state === 'happy') cls = 'ticket ok';
    else if (c.state === 'angry') { pct = 0; cls = 'ticket bad'; }
    const col = pct > 0.6 ? '#7fc41a' : pct > 0.3 ? '#f2b01e' : '#e04a3a';
    const w = Math.round(pct * 100);
    if (t.cls !== cls) { t.el.className = cls; t.el.style.display = ''; t.cls = cls; }
    if (t.w !== w) { t.bar.style.width = w + '%'; t.w = w; }
    if (t.col !== col) { t.bar.style.background = col; t.col = col; }
  });
  // orden en pantalla (móvil): 0 = el más urgente (el que más tiempo lleva esperando), luego los demás; máximo 3
  let k = 0;
  tickEls.forEach((t, i) => {
    const c = customers[i], r = c && c.state === 'waiting' ? String(k++) : '';
    if (t.el.dataset.rank !== r) t.el.dataset.rank = r;
  });
}

// Al terminar solo se ofrece la receta real del plato del nivel, oculta tras un botón.
function endGame() {
  gameOver = true;
  document.body.classList.remove('playing');
  document.getElementById('overlayTitle').textContent = timeUp && served < TOTAL_CUSTOMERS ? '¡Se acabó el tiempo!' : served > 0 ? '¡' + (LEVEL.world === 'kevin' ? 'Nivel ' + LEVEL.id : LEVEL.title.split(':')[0]) + ' completado! 🎉' : 'Fin del turno';
  const record = served > 0 && saveBest(LEVEL.id, score);
  document.getElementById('overlaySubtitle').textContent = 'Puntaje final: ' + score + ' ⭐ — ' + served + ' de ' + TOTAL_CUSTOMERS + ' clientes atendidos' + (record ? ' · ¡Nuevo récord!' : '');
  document.getElementById('recipeCard').innerHTML = DISHES[LEVEL.own].recipe;
  document.getElementById('recipeCard').style.display = 'none';
  document.getElementById('recipeBtn').textContent = '📖 Ver receta real';
  document.getElementById('overlay').classList.add('show');
}
