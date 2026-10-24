// ================= AYUDANTE (segundo jugador controlado por la IA) =================
// Mira el estado de la cocina (incluido lo que lleva el jugador y lo que hay en las mesas) y hace lo que falta
// para terminar el PRIMER PEDIDO DE LA COLA, sin repetir pasos que ya están en marcha.
// Usa las mismas reglas que el jugador: mesas estándar, y mantener la acción en tabla y bowl (la licuadora va sola).
let playerHeldKey = '', playerHeldTime = 0;
function trackPlayerHeld(dt) {
  const k = player.held ? player.held.type + (player.held.parts ? player.held.parts.join('.') : '') : '';
  if (k !== playerHeldKey) { playerHeldKey = k; playerHeldTime = 0; } else playerHeldTime += dt;
}
// Si el jugador lleva el mismo objeto más de 4 s, el ayudante deja de contar con él.
function everyHeld() {
  const mine = (player.held && playerHeldTime < 4) ? player.held : null;
  return [mine, helper && helper.held, ...TABLES.map(t => t.item)].filter(Boolean);
}
function cnt(...types) { return everyHeld().filter(it => types.includes(it.type)).length; }
// puede haber más de una tabla (p. ej. en los carritos cebicheros)
const boards = () => st.filter(s => s.kind === 'board');
const freeBoard = () => boards().find(b => b.state === 'empty');
const boardHas = p => boards().filter(b => b.product === p && b.state !== 'empty').length;
// ¿al bowl le falta este ingrediente para la receta que se está armando?
const bowlNeeds = t => { const Bw = byKind('bowl'); return !!Bw && Bw.state === 'idle' && bowlAccepts(Bw.items, t); };
const count = (arr, x) => arr.filter(y => y === x).length;
// ¿a la olla del guiso le falta este ingrediente?
const stewNeeds = t => { const S = byKind('stew'); return !!S && S.state === 'idle' && stewAccepts(S.items, t); };

// ---- Mesa donde se arma el plato del pedido: la que ya tiene un plato compatible (la más avanzada)
function planTable(D) {
  let best = null;
  for (const t of TABLES) {
    const p = t.item;
    if (p && p.type === 'plate' && fits(D, p) && (!best || p.parts.length > best.item.parts.length)) best = t;
  }
  return best;
}
const buildSpot = () => freeTableNear(cellX(COLS / 2), cellY(ISLAND_ROW) + CS + STAND);      // dónde empieza un plato nuevo: la isla, cerca de las estaciones
const parkSpot = () => freeTableNear(helper.x, helper.y);

// ¿Sirve este objeto para ese pedido? (si no, va a la basura)
function relevant(D, h) { return h.type === 'plate' ? (fits(D, h) || plateDone(h)) : D.uses.includes(h.type); }
const relevantAny = h => h.type === 'plate' ? (fitsOpen(h) || plateDone(h)) : openDishes().some(D => D.uses.includes(h.type));
// ¿Se puede usar ahora mismo? (si no, se deja en una mesa)
function usable(D, h) {
  const Bd = freeBoard() || g('board'), Bw = byKind('bowl'), Bl = BL(), Pn = byKind('pan'), Wk = byKind('wok');
  const wokNeeds = t => !!Wk && Wk.state === 'idle' && wokAccepts(Wk.items, t);
  const Fr = byKind('fryer');
  const inPlate = () => { const A = planTable(D); return !!A && canAdd(D, A.item, PART_OF_ITEM[h.type]); };
  switch (h.type) {
    case 'pollo_raw': if (D.id === 'chaufa') return Bd.state === 'empty'; if (D.id === 'pollo_aji') return stewNeeds('pollo_raw'); return !!freePot(h.type);      // chaufa: el pollo se corta crudo
    case 'papa_raw': if (D.id === 'lomo_saltado') return !!freeBoard(); return !!freePot(h.type);
    case 'arroz_raw': case 'tallarines': return !!freePot(h.type);
    case 'cerdo': return !!freeBoard();
    case 'cerdo_picado': case 'wantan': return bowlNeeds(h.type);
    case 'wantan_crudo': return D.id === 'wantan_frito' ? (!!Fr && Fr.state === 'idle') : stewNeeds('wantan_crudo');
    case 'tallarin_cocido': return wokNeeds(h.type);
    case 'carne': case 'tomate': return !!freeBoard();
    case 'carne_cubos': case 'tomate_juliana': case 'cebolla_juliana': return wokNeeds(h.type);
    case 'papa_baston': return !!Fr && Fr.state === 'idle';
    case 'corazon': case 'rachi': case 'pancita': case 'choclo_cocido': return !!freeBoard();
    case 'corazon_trozos': case 'rachi_trozos': case 'pancita_trozos': return bowlNeeds(h.type);
    case 'corazon_mar': return !!byKind('skewer') && byKind('skewer').state === 'empty';
    case 'corazon_palito': return !!freeGrill();
    case 'rachi_mar': case 'pancita_mar': return !!freeGrill();
    case 'papa_cooked': return D.id === 'causa' ? (Bw.state === 'idle' && nOf(Bw.items, h.type) < BOWL_NEED.papa_cooked) : Bd.state === 'empty';
    case 'pollo_cooked': case 'palta': case 'cebolla_china': case 'cebolla_roja': case 'aji_limo': return !!freeBoard();
    case 'cebolla_cuadros': if (D.id === 'pollo_aji') return stewNeeds(h.type); return bowlNeeds(h.type);
    case 'pota_cortada': case 'aji_limo_picado': case 'limon': return bowlNeeds(h.type);
    case 'vaso': return !!byKind('balde') && byKind('balde').state === 'idle';
    case 'chicha': return true;
    case 'cebolla_picada': if (D.id === 'sopa_wantan') return stewNeeds(h.type); return wokNeeds(h.type);
    case 'sillao': case 'huevo': case 'pollo_cuadros': return wokNeeds(h.type);
    case 'arroz_cooked': if (D.id === 'chaufa') return wokNeeds('arroz_cooked'); return inPlate();
    case 'aji':
      if (D.id === 'causa') return Bw.state === 'idle' && !Bw.items.includes('aji');
      return !!D.blend && Bl.state === 'idle' && subMulti(Bl.items.concat('aji'), D.blend);
    case 'queso': case 'leche': case 'galleta': return !!D.blend && Bl.state === 'idle' && subMulti(Bl.items.concat(h.type), D.blend);
    case 'pollo_shred':
      if (D.id === 'chaufa') return wokNeeds('pollo_shred');
      return D.id === 'causa' ? inPlate() : (Pn.state === 'idle' && !Pn.items.includes('pollo_shred'));
    case 'salsa_aji': if (D.id === 'pollo_aji') return stewNeeds('salsa_aji'); return Pn.state === 'idle' && !Pn.items.includes('salsa_aji');
    case 'plate': return plateDone(h) || (fits(D, h) && !planTable(D));
    default: return inPlate();      // papa_sliced, arroz_cooked, guiso, salsa, masa, palta_sliced
  }
}
function destination(D, h) {
  switch (h.type) {
    case 'pollo_raw': if (D.id === 'chaufa') return g('board'); if (D.id === 'pollo_aji') return byKind('stew'); return freePot(h.type) || POTS[0];
    case 'papa_raw': if (D.id === 'lomo_saltado') return freeBoard() || g('board'); return freePot(h.type) || POTS[0];
    case 'arroz_raw': case 'tallarines': return freePot(h.type) || POTS[0];
    case 'cerdo': return freeBoard() || g('board');
    case 'cerdo_picado': case 'wantan': return byKind('bowl');
    case 'wantan_crudo': return D.id === 'wantan_frito' ? byKind('fryer') : byKind('stew');
    case 'tallarin_cocido': return byKind('wok');
    case 'carne': case 'tomate': return freeBoard() || g('board');
    case 'carne_cubos': case 'tomate_juliana': case 'cebolla_juliana': return byKind('wok');
    case 'papa_baston': return byKind('fryer');
    case 'corazon': case 'rachi': case 'pancita': case 'choclo_cocido': return freeBoard() || g('board');
    case 'corazon_trozos': case 'rachi_trozos': case 'pancita_trozos': return byKind('bowl');
    case 'corazon_mar': return byKind('skewer');
    case 'corazon_palito': case 'rachi_mar': case 'pancita_mar': return freeGrill() || byKind('grill');
    case 'papa_cooked': return D.id === 'causa' ? byKind('bowl') : freeBoard() || g('board');
    case 'pollo_cooked': case 'palta': case 'cebolla_china': case 'cebolla_roja': case 'aji_limo': return freeBoard() || g('board');
    case 'cebolla_cuadros': return D.id === 'pollo_aji' ? byKind('stew') : byKind('bowl');
    case 'pota_cortada': case 'aji_limo_picado': case 'limon': return byKind('bowl');
    case 'vaso': return byKind('balde');
    case 'chicha': return g('counter');
    case 'cebolla_picada': return D.id === 'sopa_wantan' ? byKind('stew') : byKind('wok');
    case 'sillao': case 'huevo': case 'pollo_cuadros': return byKind('wok');
    case 'arroz_cooked': return D.id === 'chaufa' ? byKind('wok') : planTable(D);
    case 'aji': return D.id === 'causa' ? byKind('bowl') : BL();
    case 'queso': case 'leche': case 'galleta': return BL();
    case 'pollo_shred': return D.id === 'chaufa' ? byKind('wok') : D.id === 'causa' ? planTable(D) : byKind('pan');
    case 'salsa_aji': return D.id === 'pollo_aji' ? byKind('stew') : byKind('pan');
    case 'plate': return plateDone(h) ? g('counter') : (buildSpot() || g('trash'));
    default: return planTable(D);
  }
}

// Estación de "mantener" que conviene trabajar ahora (solo si lo que produce sirve a algún pedido abierto)
function workTarget() {
  const Bd = boards().find(b => b.state === 'chopping' && relevantAny({ type: b.product })), Bw = byKind('bowl');
  if (Bd) return Bd;
  const Sk = byKind('skewer');
  if (Sk && Sk.state === 'chopping' && relevantAny({ type: Sk.product })) return Sk;
  if (Bw && Bw.state === 'mashing' && relevantAny({ type: Bw.out })) return Bw;
  const m = Bw && Bw.state === 'idle' && bowlMatch(Bw.items), D = targetDish();
  if (m && D && D.uses.includes(m.out)) return Bw;      // p. ej. no mezclar sin ají si el pedido es con ají
  return null;
}

// Un plan por plato: qué hacer después (estación a visitar) o null si no hay nada útil que hacer ahora.
const PLANS = {
  huancaina(D) {
    const A = planTable(D), Bd = g('board'), Bl = BL(), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
    // recoger lo que ya terminó (solo si hay dónde ponerlo)
    if (Bl.state === 'done' && Bl.out === 'salsa' && pl && !has('salsa')) return { s: Bl };
    if (Bd.state === 'done' && Bd.product === 'papa_sliced' && pl && !has('papa')) return { s: Bd };
    const pd = potWith('papa_raw'); if (pd && Bd.state === 'empty') return { s: pd };
    // iniciar lo que falta
    const papaSec = (has('papa') ? 1 : 0) + cnt('papa_sliced') + boardHas('papa_sliced') + cnt('papa_cooked') + potN('papa_raw') + cnt('papa_raw');
    if (papaSec < 1 && freePot('papa_raw')) return { s: g('crate_papa_raw') };
    const salsaSec = (has('salsa') ? 1 : 0) + cnt('salsa') + ((Bl.state === 'blending' || Bl.state === 'done') && Bl.out === 'salsa' ? 1 : 0);
    if (salsaSec < 1 && Bl.state === 'idle') {
      const need = D.blend.slice();                       // ingredientes que ya están dentro de la licuadora
      Bl.items.forEach(i => need.splice(need.indexOf(i), 1));
      everyHeld().map(it => it.type).forEach(i => { const k = need.indexOf(i); if (k >= 0) need.splice(k, 1); });   // y los que alguien lleva en la mano
      if (need.length) return { s: g('crate_' + need[0]) };
    }
    return null;
  },
  causa(D) {
    const A = planTable(D), Bw = byKind('bowl'), Bd = g('board'), pl = A ? A.item : null;
    const L = pl ? pl.parts : [], next = pl ? D.parts[L.length] : undefined;
    if (Bw.state === 'done' && next === 'masa') return { s: Bw };      // se lleva la masa (2 porciones): una capa ahora, otra después del relleno
    if (Bd.state === 'done' && ((Bd.product === 'pollo_shred' && next === 'relleno') || (Bd.product === 'palta_sliced' && next === 'palta'))) return { s: Bd };
    const papaDone = potWith('papa_raw'), polloDone = potWith('pollo_raw');
    if (papaDone && Bw.state === 'idle' && nOf(Bw.items, 'papa_cooked') < BOWL_NEED.papa_cooked) return { s: papaDone, want: 'papa_raw' };
    if (polloDone && Bd.state === 'empty') return { s: polloDone };
    // una sola tanda de masa (2 papas + 1 ají) alcanza para las dos capas
    const masaBatch = L.includes('masa') || cnt('masa') > 0 || Bw.state === 'mashing' || Bw.state === 'done';
    const bowlPapa = Bw.state === 'idle' ? nOf(Bw.items, 'papa_cooked') : 0;
    const bowlAji = (Bw.state === 'idle' && Bw.items.includes('aji')) ? 1 : 0;
    const papaSecured = masaBatch ? 2 : bowlPapa + cnt('papa_cooked') + potN('papa_raw') + cnt('papa_raw');
    const ajiSecured = masaBatch ? 1 : bowlAji + cnt('aji');
    const polloSecured = (L.includes('relleno') ? 1 : 0) + cnt('pollo_shred') + boardHas('pollo_shred') + cnt('pollo_cooked') + potN('pollo_raw') + cnt('pollo_raw');
    const paltaSecured = (L.includes('palta') ? 1 : 0) + cnt('palta_sliced') + boardHas('palta_sliced') + cnt('palta');
    if (papaSecured < 2 && freePot('papa_raw')) return { s: g('crate_papa_raw') };       // las 2 papas van a la misma olla
    if (polloSecured < 1 && freePot('pollo_raw')) return { s: g('crate_pollo_raw') };
    if (ajiSecured < 1 && Bw.state === 'idle') return { s: g('crate_aji') };
    // la palta se corta al final, cuando la tabla ya quedó libre (el relleno ya está en el plato)
    if (paltaSecured < 1 && L.length >= 2 && Bd.state === 'empty') return { s: g('crate_palta') };
    return null;
  },
  aji(D) {
    const A = planTable(D), Bd = g('board'), Bl = BL(), Pn = byKind('pan'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
    if (Pn.state === 'done' && pl && !has('guiso')) return { s: Pn };
    if (Bl.state === 'done' && Bl.out === 'salsa_aji' && Pn.state === 'idle' && !Pn.items.includes('salsa_aji')) return { s: Bl };
    if (Bd.state === 'done') {
      if (Bd.product === 'pollo_shred' && Pn.state === 'idle' && !Pn.items.includes('pollo_shred')) return { s: Bd };
      if (Bd.product === 'papa_sliced' && pl && !has('papa')) return { s: Bd };
    }
    const arrozDone = potWith('arroz_raw'), papaDone = potWith('papa_raw'), polloDone = potWith('pollo_raw');
    if (arrozDone && pl && !has('arroz')) return { s: arrozDone };
    if (papaDone && Bd.state === 'empty') return { s: papaDone };
    if (polloDone && Bd.state === 'empty') return { s: polloDone };
    const arrozSecured = (has('arroz') ? 1 : 0) + cnt('arroz_cooked') + potN('arroz_raw') + cnt('arroz_raw');
    const papaSecured = (has('papa') ? 1 : 0) + cnt('papa_sliced') + boardHas('papa_sliced') + cnt('papa_cooked') + potN('papa_raw') + cnt('papa_raw');
    const guisoUnits = (has('guiso') ? 1 : 0) + cnt('guiso') + ((Pn.state === 'cooking' || Pn.state === 'done') ? 1 : 0);
    const polloUnit = (Pn.items.includes('pollo_shred') ? 1 : 0) + cnt('pollo_shred') + boardHas('pollo_shred') + cnt('pollo_cooked') + potN('pollo_raw') + cnt('pollo_raw');
    const cremaUnit = (Pn.items.includes('salsa_aji') ? 1 : 0) + cnt('salsa_aji') + ((Bl.state === 'blending' || Bl.state === 'done') && Bl.out === 'salsa_aji' ? 1 : 0);
    if (arrozSecured < 1 && freePot('arroz_raw')) return { s: g('crate_arroz_raw') };
    if (papaSecured < 1 && freePot('papa_raw')) return { s: g('crate_papa_raw') };
    if (guisoUnits < 1 && polloUnit < 1 && freePot('pollo_raw')) return { s: g('crate_pollo_raw') };
    if (guisoUnits < 1 && cremaUnit < 1 && Bl.state === 'idle' && count(Bl.items, 'aji') + cnt('aji') < 1) return { s: g('crate_aji') };
    return null;
  }
};

// Pollo al ají: pollo crudo, cebolla en cuadros (tabla) y ají molido (licuadora) van a la olla del guiso.
// Al plato: arroz (olla), papa sancochada en rodajas (olla + tabla) y el pollo al ají.
PLANS.pollo_aji = function (D) {
  const A = planTable(D), Bd = freeBoard() || g('board'), Bl = BL(), S = byKind('stew'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  if (S.state === 'done' && pl && !has('pollo_aji')) return { s: S };
  if (Bl.state === 'done' && Bl.out === 'salsa_aji' && stewNeeds('salsa_aji')) return { s: Bl };
  const bd = boards().find(b => b.state === 'done' && b.product === 'cebolla_cuadros');
  if (bd && stewNeeds('cebolla_cuadros')) return { s: bd };
  const pb = boards().find(b => b.state === 'done' && b.product === 'papa_sliced');
  if (pb && pl && !has('papa')) return { s: pb };
  const arrozDone = potWith('arroz_raw'), papaDone = potWith('papa_raw');
  if (arrozDone && pl && !has('arroz')) return { s: arrozDone, want: 'arroz_raw' };
  if (papaDone && freeBoard()) return { s: papaDone, want: 'papa_raw' };
  const inS = x => S.items.includes(x) ? 1 : 0, stewOn = S.state !== 'idle' || has('pollo_aji') || cnt('pollo_aji') > 0;
  const arroz = (has('arroz') ? 1 : 0) + cnt('arroz_cooked') + potN('arroz_raw') + cnt('arroz_raw');
  const papa = (has('papa') ? 1 : 0) + cnt('papa_sliced') + boardHas('papa_sliced') + cnt('papa_cooked') + potN('papa_raw') + cnt('papa_raw');
  if (arroz < 1 && freePot('arroz_raw')) return { s: g('crate_arroz_raw') };
  if (papa < 1 && freePot('papa_raw')) return { s: g('crate_papa_raw') };
  if (stewOn) return null;
  const crema = inS('salsa_aji') + cnt('salsa_aji') + ((Bl.state === 'blending' || Bl.state === 'done') && Bl.out === 'salsa_aji' ? 1 : 0) + (Bl.state === 'idle' ? count(Bl.items, 'aji') : 0) + cnt('aji');
  const cebolla = inS('cebolla_cuadros') + cnt('cebolla_cuadros') + boardHas('cebolla_cuadros') + cnt('cebolla_roja');
  const pollo = inS('pollo_raw') + cnt('pollo_raw');
  if (crema < 1 && Bl.state === 'idle') return { s: g('crate_aji') };
  if (cebolla < 1 && freeBoard()) return { s: g('crate_cebolla_roja') };
  if (pollo < 1) return { s: g('crate_pollo_raw') };
  return null;
};

// Lomo saltado: carne en cubos, tomate y cebolla en juliana (tablas) + sillao al wok; la papa en bastón (tabla) a la freidora.
// Al plato: el saltado, arroz (olla) y papas fritas.
PLANS.lomo_saltado = function (D) {
  const A = planTable(D), Wk = byKind('wok'), Fr = byKind('fryer'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  const wokNeeds = t => Wk.state === 'idle' && wokAccepts(Wk.items, t);
  if (Wk.state === 'done' && Wk.out === 'saltado' && pl && !has('saltado')) return { s: Wk };
  if (Fr.state === 'done' && pl && !has('papas_fritas')) return { s: Fr };
  const bd = boards().find(b => b.state === 'done' && ['carne_cubos', 'tomate_juliana', 'cebolla_juliana'].includes(b.product) && wokNeeds(b.product));
  if (bd) return { s: bd };
  const pb = boards().find(b => b.state === 'done' && b.product === 'papa_baston');
  if (pb && Fr.state === 'idle') return { s: pb };
  const arrozDone = potWith('arroz_raw');
  if (arrozDone && pl && !has('arroz')) return { s: arrozDone, want: 'arroz_raw' };
  const arroz = (has('arroz') ? 1 : 0) + cnt('arroz_cooked') + potN('arroz_raw') + cnt('arroz_raw');
  if (arroz < 1 && freePot('arroz_raw')) return { s: g('crate_arroz_raw') };
  const papa = (has('papas_fritas') ? 1 : 0) + cnt('papas_fritas') + (Fr.state !== 'idle' ? 1 : 0) + cnt('papa_baston') + boardHas('papa_baston') + cnt('papa_raw');
  if (papa < 1 && freeBoard()) return { s: g('crate_papa_raw') };
  if (Wk.state !== 'idle' || has('saltado') || cnt('saltado') > 0) return null;      // ya hay un saltado en camino
  const inW = x => Wk.items.includes(x) ? 1 : 0;
  for (const [cut, crate] of [['carne_cubos', 'carne'], ['cebolla_juliana', 'cebolla_roja'], ['tomate_juliana', 'tomate']]) {
    if (inW(cut) + cnt(cut) + boardHas(cut) + cnt(crate) < 1 && freeBoard()) return { s: g('crate_' + crate) };
  }
  if (inW('sillao') + cnt('sillao') < 1) return { s: g('crate_sillao') };
  return null;
};

// Carretilla de anticuchos (corazón, rachi o pancita): tabla -> bowl con salsa anticuchera -> palitos -> parrilla.
// Al plato: lo asado y papa y choclo sancochados en rodajas (tabla).
const grills = () => st.filter(s => s.kind === 'grill');
const freeGrill = () => grills().find(g => g.slots.length < GRILL_CAP);
function parrillaPlan(D) {
  const meat = D.meat, cut = meat + '_trozos', mar = meat + '_mar', gin = grillIn(meat), out = GRILL_OUT[gin], part = PART_OF_ITEM[out], palito = gin !== mar;
  const A = planTable(D), Bw = byKind('bowl'), Sk = byKind('skewer'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  const Gd = grills().find(g => g.slots.some(x => x.done && x.type === gin));
  if (pl && !has(part) && Gd) return { s: Gd, want: gin };
  if (palito && Sk.state === 'done' && Sk.product === gin && freeGrill()) return { s: Sk };
  if (Bw.state === 'done' && Bw.out === mar && (palito ? Sk.state === 'empty' : !!freeGrill())) return { s: Bw };
  const bd = boards().find(b => b.state === 'done' && b.product === cut && bowlNeeds(cut));
  if (bd) return { s: bd };
  for (const [sl, part2] of [['papa_sliced', 'papa'], ['choclo_rodajas', 'choclo']]) {
    const b = boards().find(x => x.state === 'done' && x.product === sl);
    if (b && pl && !has(part2)) return { s: b };
  }
  // ¿la carne de este pedido ya está en camino en alguna etapa?
  const inBowl = (Bw.state === 'idle' && Bw.items.includes(cut)) || (Bw.state !== 'idle' && Bw.out === mar);
  const onGrill = grills().reduce((n, g) => n + g.slots.filter(x => x.type === gin).length, 0);
  const meatSec = (has(part) ? 1 : 0) + cnt(out) + onGrill + (palito ? cnt(gin) + (Sk.state !== 'empty' && Sk.product === gin ? 1 : 0) : 0)
    + cnt(mar) + (inBowl ? 1 : 0) + cnt(cut) + boardHas(cut) + cnt(meat);
  if (meatSec < 1 && freeBoard() && Bw.state === 'idle' && !Bw.items.some(i => i.endsWith('_trozos'))) return { s: g('crate_' + meat) };
  const papa = (has('papa') ? 1 : 0) + cnt('papa_sliced') + boardHas('papa_sliced') + cnt('papa_cooked');
  if (papa < 1 && freeBoard()) return { s: g('crate_papa_cooked') };
  const choclo = (has('choclo') ? 1 : 0) + cnt('choclo_rodajas') + boardHas('choclo_rodajas') + cnt('choclo_cocido');
  if (choclo < 1 && freeBoard()) return { s: g('crate_choclo_cocido') };
  return null;
}
PLANS.anticuchos = parrillaPlan; PLANS.rachi = parrillaPlan; PLANS.pancita = parrillaPlan;

// Wantanes: el cerdo se pica (tabla) y se arma con la masa en el bowl. Fritos: a la freidora. Sopa: a la olla de caldo
// con la cebolla china picada.
function wantanPlan(D) {
  const frito = D.id === 'wantan_frito', part = frito ? 'wantan_frito' : 'sopa';
  const A = planTable(D), Bw = byKind('bowl'), S = byKind('stew'), Fr = byKind('fryer'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  if (frito && Fr.state === 'done' && Fr.item === 'wantan_crudo' && pl && !has(part)) return { s: Fr };
  if (!frito && S.state === 'done' && S.out === 'sopa' && pl && !has(part)) return { s: S };
  if (Bw.state === 'done' && Bw.out === 'wantan_crudo' && (frito ? Fr.state === 'idle' : stewNeeds('wantan_crudo'))) return { s: Bw };
  const bd = boards().find(b => b.state === 'done' && b.product === 'cerdo_picado' && bowlNeeds('cerdo_picado'));
  if (bd) return { s: bd };
  if (!frito) { const cb = boards().find(b => b.state === 'done' && b.product === 'cebolla_picada' && stewNeeds('cebolla_picada')); if (cb) return { s: cb }; }
  const cooking = frito ? (Fr.state !== 'idle' && Fr.item === 'wantan_crudo') : (S.state !== 'idle' && S.out === 'sopa');
  if (has(part) || cnt(part) > 0 || cooking) return null;
  const wan = cnt('wantan_crudo') + (Bw.state !== 'idle' && Bw.out === 'wantan_crudo' ? 1 : 0) + (!frito && S.state === 'idle' && S.items.includes('wantan_crudo') ? 1 : 0);
  if (wan < 1 && Bw.state === 'idle') {
    const inB = x => Bw.items.includes(x);
    if (!inB('cerdo_picado') && cnt('cerdo_picado') + boardHas('cerdo_picado') + cnt('cerdo') < 1 && freeBoard()) return { s: g('crate_cerdo') };
    if (!inB('wantan') && cnt('wantan') < 1) return { s: g('crate_wantan') };
  }
  if (!frito) {
    const ceb = (S.state === 'idle' && S.items.includes('cebolla_picada') ? 1 : 0) + cnt('cebolla_picada') + boardHas('cebolla_picada') + cnt('cebolla_china');
    if (ceb < 1 && freeBoard()) return { s: g('crate_cebolla_china') };
  }
  return null;
}
PLANS.wantan_frito = wantanPlan; PLANS.sopa_wantan = wantanPlan;
// Tallarín saltado: tallarines cocidos (olla) + carne en cubos, cebolla y tomate en juliana (tablas) + sillao, todo al wok.
PLANS.tallarin_saltado = function (D) {
  const A = planTable(D), Wk = byKind('wok'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  const wokNeeds = t => Wk.state === 'idle' && wokAccepts(Wk.items, t);
  if (Wk.state === 'done' && Wk.out === 'tallarin_saltado' && pl && !has('tallarin_saltado')) return { s: Wk };
  const bd = boards().find(b => b.state === 'done' && ['carne_cubos', 'tomate_juliana', 'cebolla_juliana'].includes(b.product) && wokNeeds(b.product));
  if (bd) return { s: bd };
  const td = potWith('tallarines');
  if (td && wokNeeds('tallarin_cocido')) return { s: td, want: 'tallarines' };
  if (Wk.state !== 'idle' || has('tallarin_saltado') || cnt('tallarin_saltado') > 0) return null;
  const inW = x => Wk.items.includes(x) ? 1 : 0;
  if (inW('tallarin_cocido') + cnt('tallarin_cocido') + potN('tallarines') + cnt('tallarines') < 1 && freePot('tallarines')) return { s: g('crate_tallarines') };
  for (const [cut, crate] of [['carne_cubos', 'carne'], ['cebolla_juliana', 'cebolla_roja'], ['tomate_juliana', 'tomate']]) {
    if (inW(cut) + cnt(cut) + boardHas(cut) + cnt(crate) < 1 && freeBoard()) return { s: g('crate_' + crate) };
  }
  if (inW('sillao') + cnt('sillao') < 1) return { s: g('crate_sillao') };
  return null;
};

// Arroz chaufa: todo va al wok: arroz cocido (olla), pollo crudo cortado en cuadros (tabla), cebolla china picada (tabla),
// huevo y sillao (directo). El chaufa listo va al plato.
PLANS.chaufa = function (D) {
  const A = planTable(D), Bd = g('board'), Wk = byKind('wok'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  if (Wk.state === 'done' && pl && !has('chaufa')) return { s: Wk };
  if (Bd.state === 'done' && (Bd.product === 'pollo_cuadros' || Bd.product === 'cebolla_picada') && Wk.state === 'idle' && !Wk.items.includes(Bd.product)) return { s: Bd };
  const arrozDone = potWith('arroz_raw');
  if (arrozDone && Wk.state === 'idle' && !Wk.items.includes('arroz_cooked')) return { s: arrozDone, want: 'arroz_raw' };
  if (Wk.state !== 'idle' || has('chaufa') || cnt('chaufa') > 0) return null;      // ya hay un chaufa en camino
  const inW = x => Wk.items.includes(x) ? 1 : 0;
  const arroz = inW('arroz_cooked') + cnt('arroz_cooked') + potN('arroz_raw') + cnt('arroz_raw');
  const pollo = inW('pollo_cuadros') + cnt('pollo_cuadros') + boardHas('pollo_cuadros') + cnt('pollo_raw');
  const cebolla = inW('cebolla_picada') + cnt('cebolla_picada') + boardHas('cebolla_picada') + cnt('cebolla_china');
  const huevo = inW('huevo') + cnt('huevo'), sillao = inW('sillao') + cnt('sillao');
  if (arroz < 1 && freePot('arroz_raw')) return { s: g('crate_arroz_raw') };          // el arroz primero: es lo que más tarda
  if (pollo < 1 && Bd.state === 'empty') return { s: g('crate_pollo_raw') };           // la tabla se usa para el pollo y para la cebolla
  if (cebolla < 1 && Bd.state === 'empty') return { s: g('crate_cebolla_china') };
  if (huevo < 1) return { s: g('crate_huevo') };
  if (sillao < 1) return { s: g('crate_sillao') };
  return null;
};

// Cebiche de pota carretillero: la pota ya viene en cuadros; la cebolla (en cuadros) y el ají limo se pican en las tablas.
// Todo va al bowl con el limón (el ají solo si el pedido es con ají) y se mezcla. Al plato: el cebiche y el camote (ya cocido).
function cebichePlan(D, aji) {
  const out = aji ? 'cebiche_aji' : 'cebiche';
  const A = planTable(D), Bw = byKind('bowl'), pl = A ? A.item : null, has = p => !!pl && pl.parts.includes(p);
  if (Bw.state === 'done' && Bw.out === out && pl && !has(out)) return { s: Bw };
  const need = aji ? ['cebolla_cuadros', 'aji_limo_picado'] : ['cebolla_cuadros'];
  const bd = boards().find(b => b.state === 'done' && need.includes(b.product) && bowlNeeds(b.product));
  if (bd) return { s: bd };
  if (pl && !has('camote') && cnt('camote_cocido') < 1) return { s: g('crate_camote_cocido') };
  if (Bw.state !== 'idle' || has(out) || cnt(out) > 0) return null;      // ya hay un cebiche en camino
  const inB = x => Bw.items.includes(x) ? 1 : 0;
  if (inB('pota_cortada') + cnt('pota_cortada') < 1) return { s: g('crate_pota_cortada') };
  if (inB('cebolla_cuadros') + cnt('cebolla_cuadros') + boardHas('cebolla_cuadros') + cnt('cebolla_roja') < 1 && freeBoard()) return { s: g('crate_cebolla_roja') };
  if (aji && inB('aji_limo_picado') + cnt('aji_limo_picado') + boardHas('aji_limo_picado') + cnt('aji_limo') < 1 && freeBoard()) return { s: g('crate_aji_limo') };
  if (inB('limon') + cnt('limon') < 1) return { s: g('crate_limon') };
  return null;
}
PLANS.cebiche_pota = D => cebichePlan(D, true);
PLANS.cebiche_sin = D => cebichePlan(D, false);
// Chicha morada: vaso vacío -> balde chichero (se llena solo) -> mostrador
PLANS.chicha = function (D) {
  const B = byKind('balde');
  if (B.state === 'done') return { s: B };
  if (B.state === 'filling' || cnt('chicha') > 0 || cnt('vaso') > 0) return null;
  return { s: g('cups') };
};

function helperPlan() {
  const D = targetDish(), h = helper.held;
  if (!h) helper.trashNext = false;
  if (h) {
    if (helper.trashNext || !D) return { s: g('trash') };
    if (h.type === 'chicha') return { s: servableList().some(c => c.dish.id === 'chicha') ? g('counter') : (parkSpot() || g('trash')) };
    if (h.type === 'plate') {
      if (plateDone(h)) return { s: g('counter') };
      if (fits(D, h)) return { s: planTable(D) ? (parkSpot() || g('trash')) : (buildSpot() || g('trash')) };
      return { s: fitsOpen(h) ? (parkSpot() || g('trash')) : g('trash') };   // plato de otro pedido: se aparta; si no es de nadie, basura
    }
    if (!relevant(D, h)) return { s: g('trash') };              // no sirve para este pedido
    if (!usable(D, h)) return { s: parkSpot() || g('trash') };   // sirve, pero todavía no: a una mesa
    return { s: destination(D, h) };
  }
  if (!D) return null;
  // 0) un plato completo (en cualquier mesa) se lleva al mostrador
  const doneT = TABLES.find(t => t.item && t.item.type === 'plate' && plateDone(t.item));
  if (doneT) return { s: doneT };
  // 1) mantener la acción en tabla / bowl / licuadora si hay algo en proceso que sirve
  const w = workTarget();
  if (w) return { s: w, work: true };
  // 2) aprovechar lo que quedó en las mesas
  const parked = TABLES.find(t => t.item && t.item.type !== 'plate' && relevant(D, t.item) && usable(D, t.item));
  if (parked) return { s: parked };
  // 3) asegurar un plato para este pedido
  // (los platos limpios están sobre las mesas: un plato vacío ya sirve para cualquier pedido)
  // 4) la licuadora tiene algo que no sirve para este pedido: recuperar los ingredientes y tirarlos
  const Bl = BL();
  if (D.blend && Bl && Bl.state === 'idle' && Bl.items.length && !subMulti(Bl.items, D.blend)) return { s: Bl };
  // 5) recoger lo que terminó e iniciar lo que falta, según el plato
  return PLANS[D.id](D);
}
// Si nada puede avanzar (algo estorba en una estación), el ayudante lo retira para destrabar la cocina.
function unblockPlan(idle) {
  for (const s of st) {
    if ((s.kind === 'board' || s.kind === 'skewer') && s.state === 'done') return { s };
    if (s.kind === 'grill' && s.slots.some(x => x.done)) return { s };
    if (s.kind === 'pot' && s.slots.some(x => x.done)) return { s };
    if ((s.kind === 'bowl' || s.kind === 'blender' || s.kind === 'pan' || s.kind === 'wok' || s.kind === 'stew' || s.kind === 'fryer') && s.state === 'done') return { s };
  }
  // proceso a medias que nadie sigue (p. ej. una mezcla que no sirve): terminarlo manteniendo, luego se retira y se tira
  for (const s of st) {
    if ((s.kind === 'board' || s.kind === 'skewer') && s.state === 'chopping') return { s, work: true };
    if (s.kind === 'bowl' && (s.state === 'mashing' || (s.state === 'idle' && bowlMatch(s.items)))) return { s, work: true };
    if (s.kind === 'balde' && s.state === 'done') return { s };
  }
  for (const t of TABLES) {
    if (!t.item) continue;
    const keep = relevantAny(t.item);
    if (!keep || (idle > 10 && t.item.type !== 'plate')) return { s: t, thenTrash: true };
  }
  return null;
}
function botStep(dt) {
  helper.work = null;
  let plan = helperPlan();
  if (plan || helper.held) helper.idle = 0;
  else {
    helper.idle += dt;
    if (helper.idle > 4 && waitingList().length) plan = unblockPlan(helper.idle);
  }
  if (!plan) return;
  const t = plan.s;
  const dx = t.sx - helper.x, dy = t.sy - helper.y, d = Math.hypot(dx, dy);
  if (d > 6) {
    const m = Math.min(SPEED * dt, d), w = nextWaypoint(helper, t.sx, t.sy);
    const wx = w.x - helper.x, wy = w.y - helper.y, wd = Math.hypot(wx, wy) || 1;
    tryMove(helper, wx / wd * m, wy / wd * m);
  }
  else if (plan.work) helper.work = t;      // se queda manteniendo la acción
  else {
    helper.timer -= dt;
    if (helper.timer <= 0) {
      const ok = interact(t, helper, plan.want); helper.timer = 0.12;
      if (ok && plan.thenTrash) helper.trashNext = true;       // lo que acaba de retirar de la mesa va a la basura
      else if (ok && t.kind === 'trash') helper.trashNext = false;
    }
  }
}
function setBot(v) {
  bot = v;
  helper = bot ? { x: 450, y: 400, held: null, timer: 0, idle: 0, trashNext: false, work: null } : null;
  const b = document.getElementById('botBtn');
  b.textContent = IS_TOUCH ? '🤖' : '🤖 Ayudante: ' + (bot ? 'ON' : 'OFF') + keyHint('B');
  b.classList.toggle('on', bot);
  if (started) showToast(bot ? 'Tu ayudante entró a la cocina' : 'El ayudante salió de la cocina');
}
