// ================= INTERACCIÓN =================
// interact() es el "toque" (pulsar una vez): coger, dejar, colocar. Funciona igual para el jugador y el ayudante.
// El trabajo mantenido (tabla y bowl) no está aquí: lo gestiona update() con workedStations().
// Usar una porción de algo que rinde varias (la masa de causa): devuelve true si ya no queda nada.
// ¿Se puede pasar todo lo de un plato a otro? Solo si el resultado sigue siendo parte de algún pedido abierto.
function canMerge(target, from) { const merged = { type: 'plate', parts: target.parts.concat(from.parts) }; return openDishes().some(D => fits(D, merged)); }
function usePortion(it) { if ((it.n || 1) > 1) { it.n--; return false; } return true; }
// Devuelve true si algo ocurrió. `want` (opcional) elige qué cosa sacar de la olla.
function interact(s, p, want) {
  const h = p.held;
  switch (s.kind) {
    case 'crate':
      if (!h) { p.held = { type: s.item }; return true; } return false;
    case 'plates':
      if (!h) { p.held = { type: 'plate', parts: [] }; return true; } return false;
    case 'trash':      // la comida se tira, pero el plato se conserva (vacío)
      if (h && h.type === 'plate') { if (!h.parts.length) return false; h.parts = []; return true; }
      if (h) { p.held = null; return true; } return false;
    case 'table': {
      // mesa estándar: deja o recoge cualquier cosa, y si hay un plato sobre ella le añade los ingredientes del pedido
      const it = s.item;
      if (h && !it) { s.item = h; p.held = null; return true; }
      // plato con ingredientes en la mano + otro plato en la mesa: todo pasa al plato de la mesa
      if (h && h.type === 'plate' && it && it.type === 'plate' && h.parts.length) {
        if (!canMerge(it, h)) return false;
        it.parts = it.parts.concat(h.parts); h.parts = []; return true;
      }
      if (h && it && it.type === 'plate' && PART_OF_ITEM[h.type]) {
        const part = PART_OF_ITEM[h.type];
        if (canPlace(it, part)) { it.parts.push(part); if (usePortion(h)) p.held = null; return true; }
        return false;
      }
      if (h && h.type === 'plate' && it && PART_OF_ITEM[it.type]) {     // plato en la mano + ingrediente sobre la mesa
        const part = PART_OF_ITEM[it.type];
        if (canPlace(h, part)) { h.parts.push(part); if (usePortion(it)) s.item = null; return true; }
        return false;
      }
      if (!h && it) { p.held = it; s.item = null; return true; }
      return false;
    }
    case 'pot':      // automática: arranca sola al colocar el ingrediente
      if (h && POT_OUT[h.type] && s.slots.length < potCap(h.type) && s.slots.every(x => x.type === h.type)) {
        s.slots.push({ type: h.type, t: 0, done: false }); p.held = null; return true;
      }
      if (!h) {
        const i = s.slots.findIndex(x => x.done && (!want || x.type === want));
        if (i < 0) return false;
        const sl = s.slots.splice(i, 1)[0];
        p.held = { type: POT_OUT[sl.type] };
        return true;
      }
      return false;
    case 'board':    // hold: se coloca con un toque y se pica manteniendo la acción
      if (h && s.state === 'empty' && chopOut(h.type, p === helper ? targetDish() : null)) {
        s.state = 'chopping'; s.t = 0; s.input = h.type; s.product = chopOut(h.type, p === helper ? targetDish() : null); p.held = null; return true;
      }
      if (!h && s.state === 'done') { p.held = { type: s.product }; s.state = 'empty'; s.product = null; return true; }
      return false;
    case 'bowl':     // hold: 2 papas cocidas + ají -> masa de 2 porciones
      if (h && s.state === 'idle' && bowlAccepts(s.items, h.type)) {
        s.items.push(h.type); p.held = null;
        return true;      // la mezcla empieza al mantener la acción (update.js)
      }
      // algo más para una mezcla ya empezada (p. ej. el ají al cebiche): se añade y la mezcla vuelve a empezar
      if (h && (s.state === 'mashing' || (s.state === 'done' && (s.n || 1) >= (s.portions || 1))) && bowlAccepts(s.items, h.type)) {
        s.items.push(h.type); p.held = null; s.state = 'idle'; s.t = 0; s.out = null; s.n = 0;
        return true;
      }
      // con un plato en la mano: se pone una capa directamente desde el bowl (gasta la mitad)
      if (h && h.type === 'plate' && s.state === 'done' && canPlace(h, PART_OF_ITEM[s.out])) {
        h.parts.push(PART_OF_ITEM[s.out]); s.n--;
        if (s.n <= 0) { s.state = 'idle'; s.items = []; }
        return true;
      }
      // con las manos vacías: se lleva toda la masa que queda
      if (!h && s.state === 'done') { p.held = { type: s.out, n: s.n }; s.state = 'idle'; s.items = []; s.n = 0; return true; }
      return false;
    case 'blender':  // hold: se licúa manteniendo la acción cuando el contenido coincide con una receta
      if (h && BLEND_ACCEPT.includes(h.type) && s.state === 'idle' && blendOK(s.items.concat(h.type))) {
        s.items.push(h.type); s.wait = 0; p.held = null; return true;
      }
      if (!h && s.state === 'done') { p.held = { type: s.out }; s.state = 'idle'; s.items = []; s.out = null; return true; }
      // con las manos vacías y una mezcla que no es ninguna receta: recupera el último ingrediente (deshacer)
      if (!h && s.state === 'idle' && s.items.length && !blendMatch(s.items)) { p.held = { type: s.items.pop() }; return true; }
      return false;
    case 'wok':      // automática: arranca sola cuando tiene todo lo de una receta (chaufa o lomo saltado)
      if (h && s.state === 'idle' && wokAccepts(s.items, h.type)) {
        s.items.push(h.type); p.held = null;
        const m = wokMatch(s.items);
        if (m) { s.state = 'cooking'; s.t = 0; s.out = m.out; }
        return true;
      }
      if (h && h.type === 'plate' && s.state === 'done' && canPlace(h, PART_OF_ITEM[s.out])) { h.parts.push(PART_OF_ITEM[s.out]); s.state = 'idle'; s.items = []; return true; }
      if (!h && s.state === 'done') { p.held = { type: s.out || 'chaufa' }; s.state = 'idle'; s.items = []; return true; }
      return false;
    case 'fryer':    // freidora (automática): papas en bastón -> papas fritas
      if (h && s.state === 'idle' && FRY_OUT[h.type]) { s.item = h.type; s.state = 'frying'; s.t = 0; p.held = null; return true; }
      if (h && h.type === 'plate' && s.state === 'done' && canPlace(h, PART_OF_ITEM[FRY_OUT[s.item]])) { h.parts.push(PART_OF_ITEM[FRY_OUT[s.item]]); s.state = 'idle'; s.item = null; return true; }
      if (!h && s.state === 'done') { p.held = { type: FRY_OUT[s.item] }; s.state = 'idle'; s.item = null; return true; }
      return false;
    case 'pan':      // automática: arranca sola con pollo desmenuzado + ají molido
      if (h && PAN_IN.includes(h.type) && s.state === 'idle' && !s.items.includes(h.type)) {
        s.items.push(h.type); p.held = null;
        if (s.items.length === PAN_IN.length) { s.state = 'cooking'; s.t = 0; }
        return true;
      }
      if (!h && s.state === 'done') { p.held = { type: 'guiso' }; s.state = 'idle'; s.items = []; return true; }
      return false;
    case 'stew':     // olla del guiso (automática): arranca sola con pollo crudo + cebolla en cuadros + ají molido
      if (h && STEW_IN.includes(stewKey(h.type)) && s.state === 'idle' && !s.items.includes(stewKey(h.type))) {
        s.items.push(stewKey(h.type)); p.held = null;
        if (s.items.length === STEW_IN.length) { s.state = 'cooking'; s.t = 0; }
        return true;
      }
      // con un plato en la mano: se sirve el pollo al ají directamente de la olla
      if (h && h.type === 'plate' && s.state === 'done' && canPlace(h, 'pollo_aji')) { h.parts.push('pollo_aji'); s.state = 'idle'; s.items = []; return true; }
      if (!h && s.state === 'done') { p.held = { type: 'pollo_aji' }; s.state = 'idle'; s.items = []; return true; }
      return false;
    case 'cups':     // vasos de plástico vacíos
      if (!h) { p.held = { type: 'vaso' }; return true; } return false;
    case 'balde':    // automático: se deja el vaso bajo el caño y se llena solo
      if (h && h.type === 'vaso' && s.state === 'idle') { s.state = 'filling'; s.t = 0; p.held = null; return true; }
      if (!h && s.state === 'done') { p.held = { type: 'chicha' }; s.state = 'idle'; return true; }
      return false;
    case 'counter':
      if (h && h.type === 'chicha' && serve({ type: 'plate', parts: ['chicha'] }, true)) { p.held = null; return true; }   // la chicha se entrega en su vaso
      if (h && h.type === 'plate' && serve(h)) { p.held = null; return true; }
      return false;
  }
  return false;
}

// ¿Hay algo que "mantener" en esta estación ahora mismo?
function workable(s) {
  if (s.kind === 'board') return s.state === 'chopping';
  if (s.kind === 'bowl') return s.state === 'mashing' || (s.state === 'idle' && !!bowlMatch(s.items));
  if (s.kind === 'blender') return s.state === 'blending' || (s.state === 'idle' && !!blendMatch(s.items));
  return false;
}

function manualInteract() {
  const s = nearestStation(player); if (!s) return;
  if (interact(s, player)) return;
  const h = player.held;
  if (s.kind === 'table' && h) {
    const it = s.item;
    if (!it) return;
    if (it.type === 'plate' && PART_OF_ITEM[h.type]) {
      const part = PART_OF_ITEM[h.type], ds = openDishes().filter(D => fits(D, it));
      if (!ds.length) showToast('Ese plato no es de ningún pedido');
      else if (!ds.some(D => D.parts.includes(part))) showToast('Eso no va en este plato');
      else if (ds.every(D => D.kind === 'seq')) showToast('Capa fuera de orden: toca ' + LAYER_NAME[ds[0].parts[it.parts.length]]);
      else showToast('Eso ya está en el plato');
    } else if (it.type === 'plate' && h.type === 'plate' && h.parts.length) showToast('Esos ingredientes no se pueden juntar en un mismo plato');
    else showToast('La mesa está ocupada');
  } else if (s.kind === 'counter') {
    if (h && h.type === 'plate' && waitingList().length)
      showToast(plateEarly(h) ? 'Primero salen las entradas: el segundo va después' : fitsOpen(h) ? 'Al plato le falta algo' : 'Ese no es un plato pedido');
    else showToast('Lleva un plato completo');
  } else if (s.kind === 'blender' && h && BLEND_ACCEPT.includes(h.type)) {
    showToast(s.state === 'idle' ? 'Eso no combina con lo que hay en la licuadora' : 'La licuadora está ocupada');
  } else if (h) showToast('Eso no va ahí');
}
