// ================= HUD: TICKETS Y FIN DE NIVEL =================
// Un ticket por cliente: plato, barra de espera y, estilo Overcooked, cada ingrediente con la herramienta que usa debajo.
// Los ingredientes que se licúan juntos se agrupan en una pestaña con el icono de la licuadora.
const tickEls = [];
// Los iconos son las mismas ilustraciones de las etiquetas de las cajas (js/icons.js): así se reconoce qué caja usar.
const hasIcons = typeof iconEl === 'function';
function chip(id) { const s = document.createElement('span'); s.className = 'chip'; if (hasIcons) s.appendChild(iconEl('ing', id, 22)); else s.textContent = ICON[id] || '?'; return s; }
function tool(id, px) { const s = document.createElement('span'); s.className = 'tool'; if (hasIcons) s.appendChild(iconEl('tool', id, px)); return s; }
function ticketSlots(D) {
  const box = document.createElement('div'); box.className = 'slots';
  D.ticket.slots.forEach(sl => {
    if (sl.g) {
      const g = document.createElement('div'); g.className = 'grp';
      const tab = document.createElement('span'); tab.className = 'gtab'; tab.appendChild(tool(sl.t, 16)); g.appendChild(tab);
      sl.g.forEach(id => g.appendChild(chip(id)));
      box.appendChild(g);
    } else {
      const d = document.createElement('div'); d.className = 'slot'; d.appendChild(chip(sl.id));
      const t = document.createElement('div'); t.className = 'tools'; sl.t.forEach(x => t.appendChild(tool(x, 18))); d.appendChild(t);
      box.appendChild(d);
    }
  });
  return box;
}
function buildTickets() {
  const box = document.getElementById('tickets');
  box.innerHTML = ''; tickEls.length = 0;
  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    const D = DISHES[ORDERS[i]];
    const d = document.createElement('div');
    d.className = 'ticket upcoming';
    d.innerHTML = '<div class="card"><div class="tbar"><i></i></div><div class="dish">' + (typeof dishIcon === 'function' && hasDishIcon(D.id) ? '' : D.icon) + '</div><div class="name">' + D.short + '</div><div class="course ' + D.course + '">' + ({ entrada: 'Entrada', segundo: 'Segundo', plato: 'Plato', bebida: 'Bebida' }[D.course] || '') + '</div></div>' +
      '';
    d.appendChild(ticketSlots(D));
    if (typeof dishIcon === 'function' && hasDishIcon(D.id)) d.querySelector('.dish').appendChild(dishIcon(D.id, 44));
    box.appendChild(d);
    tickEls.push({ el: d, bar: d.querySelector('.tbar i'), cls: '', w: -1, col: '' });
  }
}
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
}

// Al terminar solo se ofrece la receta real del plato del nivel, oculta tras un botón.
function endGame() {
  gameOver = true;
  document.body.classList.remove('playing');
  document.getElementById('overlayTitle').textContent = served > 0 ? '¡' + LEVEL.title.split(':')[0] + ' completado! 🎉' : 'Fin del turno';
  const record = served > 0 && saveBest(LEVEL.id, score);
  document.getElementById('overlaySubtitle').textContent = 'Puntaje final: ' + score + ' ⭐ — ' + served + ' de ' + TOTAL_CUSTOMERS + ' clientes atendidos' + (record ? ' · ¡Nuevo récord!' : '');
  document.getElementById('recipeCard').innerHTML = DISHES[LEVEL.own].recipe;
  document.getElementById('recipeCard').style.display = 'none';
  document.getElementById('recipeBtn').textContent = '📖 Ver receta real';
  document.getElementById('overlay').classList.add('show');
}
