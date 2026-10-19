// ================= CONFIGURACIÓN GLOBAL (reglas del juego) =================
const W = 900, H = 560;
const SPEED = 270;            // regla global: 180 base +50%
const R = 14;                 // radio del jugador
const REACH = 42;             // alcance de interacción
// cantidad de clientes por nivel: 3 salvo que el nivel diga otra cosa (LEVEL.customers, se aplica en orders.js)
let TOTAL_CUSTOMERS = 3;
const T = { cook: 6, board: 3, blend: 4, bowl: 4, pan: 5, wok: 5, balde: 1.5, stew: 7 };   // segundos de trabajo (se muestran como barras)
const PLATE_RETURN = 6;        // segundos que tarda en volver un plato limpio después de servir (sin lavar en los primeros niveles)
const POT_SLOTS = 1;          // regla global: 1 ingrediente por olla (salvo que la receta pida más)
// Cuántas unidades del mismo ingrediente caben en una olla: 1, salvo que algún plato del nivel pida más
// (p. ej. la causa cuece 2 papas juntas: dishes.js -> pot: { papa_raw: 2 }). Nunca se mezclan ingredientes distintos.
function potCap(type) { return Math.max(POT_SLOTS, ...LEVEL.dishes.map(d => (DISHES[d].pot || {})[type] || 1)); }
// Mantener presionado (hold-to-action): el progreso solo avanza mientras alguien mantiene la acción sobre estas estaciones.
// Olla, sartén y licuadora, en cambio, trabajan solas al colocar los ingredientes.
const HOLD_KINDS = ['board', 'bowl'];

// ================= INGREDIENTES, PRODUCTOS Y PARTES DEL PLATO =================
const ICON = {
  papa_raw: '🥔', papa_cooked: '🥔', papa_sliced: '🥔', pollo_raw: '🍗', pollo_cooked: '🍗', pollo_shred: '🍗',
  arroz_raw: '🍚', arroz_cooked: '🍚', aji: '🌶️', palta: '🥑', palta_sliced: '🥑', queso: '🧀', leche: '🥛', galleta: '🍘',
  salsa: '🥣', salsa_aji: '🟠', masa: '🟨', guiso: '🍛', plate: '🍽️',
  cebolla_china: '🌱', cebolla_picada: '🌱', sillao: '🍶', chaufa: '🍛', huevo: '🥚', pollo_cuadros: '🍗',
  pota: '🦑', pota_cortada: '🦑', limon: '🍋', cebolla_roja: '🧅', cebolla_pluma: '🧅', aji_limo: '🌶️', aji_limo_picado: '🌶️',
  camote: '🍠', camote_cocido: '🍠', cebiche: '🥣', cebiche_aji: '🥣', cebolla_cuadros: '🧅', vaso: '🥤', chicha: '🍇', pollo_aji: '🍛'
};
const NAME = {
  papa_raw: 'papa', papa_cooked: 'cocida', papa_sliced: 'rodajas', pollo_raw: 'pollo', pollo_cooked: 'cocido', pollo_shred: 'desmenuz.',
  arroz_raw: 'arroz', arroz_cooked: 'cocido', aji: 'ají', palta: 'palta', palta_sliced: 'láminas', queso: 'queso', leche: 'leche',
  galleta: 'galleta', salsa: 'salsa', salsa_aji: 'crema', masa: 'masa', guiso: 'guiso', plate: 'plato',
  cebolla_china: 'cebolla', cebolla_picada: 'picada', sillao: 'sillao', chaufa: 'chaufa', huevo: 'huevo', pollo_cuadros: 'cuadros',
  pota: 'pota', pota_cortada: 'cortada', limon: 'limón', cebolla_roja: 'cebolla', cebolla_pluma: 'pluma', aji_limo: 'ají limo', aji_limo_picado: 'picado',
  camote: 'camote', camote_cocido: 'cocido', cebiche: 'sin ají', cebiche_aji: 'con ají', cebolla_cuadros: 'cuadros', vaso: 'vaso', chicha: 'chicha', pollo_aji: 'pollo ají'
};
const LABELED = ['papa_cooked', 'papa_sliced', 'pollo_cooked', 'pollo_shred', 'arroz_cooked', 'palta_sliced', 'salsa', 'salsa_aji', 'masa', 'guiso', 'cebolla_picada', 'chaufa', 'pollo_cuadros', 'pota_cortada', 'cebolla_pluma', 'aji_limo_picado', 'camote_cocido', 'cebiche', 'cebiche_aji', 'cebolla_cuadros', 'chicha', 'pollo_aji'];
const CRATE_INFO = {
  papa_raw: ['🥔', 'Papas'], pollo_raw: ['🍗', 'Pollo'], aji: ['🌶️', 'Ají'], arroz_raw: ['🍚', 'Arroz'],
  palta: ['🥑', 'Paltas'], queso: ['🧀', 'Queso'], leche: ['🥛', 'Leche'], galleta: ['🍘', 'Galletas'],
  cebolla_china: ['🌱', 'Cebolla china'], sillao: ['🍶', 'Sillao'], huevo: ['🥚', 'Huevos'],
  pota: ['🦑', 'Pota'], limon: ['🍋', 'Limones'], cebolla_roja: ['🧅', 'Cebolla'], aji_limo: ['🌶️', 'Ají limo'], camote: ['🍠', 'Camote'],
  pota_cortada: ['🦑', 'Pota'], camote_cocido: ['🍠', 'Camote']
};
// lo que se puede poner sobre el plato (producto -> parte) y cómo se dibuja cada parte
const PART_OF_ITEM = { papa_sliced: 'papa', salsa: 'salsa', arroz_cooked: 'arroz', guiso: 'guiso', masa: 'masa', pollo_shred: 'relleno', palta_sliced: 'palta', chaufa: 'chaufa', cebiche: 'cebiche', cebiche_aji: 'cebiche_aji', camote_cocido: 'camote', pollo_aji: 'pollo_aji', papa_cooked: 'papa_entera' };
const PART_EMOJI = { papa: '🥔', salsa: '🥣', arroz: '🍚', guiso: '🍛', chaufa: '🍛', cebiche: '🦑', cebiche_aji: '🦑', camote: '🍠', pollo_aji: '🍛', papa_entera: '🥔' };
const PART_POS = { arroz: [-.22, -.12], papa: [.22, -.12], salsa: [0, .1], guiso: [0, .1], chaufa: [0, 0], cebiche: [-.1, 0], cebiche_aji: [-.1, 0], camote: [.26, .1], pollo_aji: [0, .12], papa_entera: [.22, -.12] };
const LAYER_COL = { masa: '#f2c94c', relleno: '#d99a6c', palta: '#7fb54a' };
const LAYER_NAME = { masa: 'Masa', relleno: 'Relleno', palta: 'Palta' };

// ================= PROCESOS DE LAS ESTACIONES =================
const POT_OUT = { papa_raw: 'papa_cooked', pollo_raw: 'pollo_cooked', arroz_raw: 'arroz_cooked' };   // olla (automática)
const CHOP = { papa_cooked: 'papa_sliced', pollo_cooked: 'pollo_shred', palta: 'palta_sliced', cebolla_china: 'cebolla_picada', pollo_raw: 'pollo_cuadros',
  cebolla_roja: 'cebolla_cuadros', aji_limo: 'aji_limo_picado' };      // carretillero: la pota y el camote ya vienen listos
// la tabla solo corta lo que algún plato del nivel necesita (p. ej. el pollo crudo en cuadros solo en el chifa)
const chopOut = type => { const out = CHOP[type]; return out && LEVEL.dishes.some(d => DISHES[d].uses.includes(out)) ? out : null; };      // tabla (hold)
// bowl (hold) -> masa de causa: 2 papas cocidas + 1 ají. Rinde 2 porciones: cada capa de masa gasta la mitad del bowl.
const BOWL_NEED = { papa_cooked: 2, aji: 1 };
const MASA_PORTIONS = 2;
const nOf = (arr, x) => arr.filter(y => y === x).length;
// El bowl tiene varias recetas: la que se arma la deciden los ingredientes (solo cuentan las de los platos del nivel).
//   masa de causa: 2 papas cocidas + ají amarillo (2 porciones)
//   cebiche carretillero: pota en cuadros + cebolla en cuadros + limón, y con ají limo picado si el pedido es con ají
// Cuando los ingredientes forman una receta, la mezcla empieza al MANTENER la acción (así se puede añadir el ají antes).
const BOWL_RECIPES = [
  { need: BOWL_NEED, out: 'masa', n: MASA_PORTIONS },
  { need: { pota_cortada: 1, cebolla_cuadros: 1, limon: 1 }, out: 'cebiche', n: 1 },
  { need: { pota_cortada: 1, cebolla_cuadros: 1, aji_limo_picado: 1, limon: 1 }, out: 'cebiche_aji', n: 1 }
];
const activeBowls = () => BOWL_RECIPES.filter(r => LEVEL.dishes.some(d => DISHES[d].uses.includes(r.out)));
const bowlAccepts = (items, t) => activeBowls().some(r => (r.need[t] || 0) > nOf(items, t) && items.every(i => r.need[i]));
const bowlMatch = items => activeBowls().find(r => Object.keys(r.need).every(k => nOf(items, k) === r.need[k]) && items.length === Object.values(r.need).reduce((a, b) => a + b, 0));
const bowlFull = items => !!bowlMatch(items);
const PAN_IN = ['pollo_shred', 'salsa_aji'];            // sartén (automática) -> guiso
// olla de barro (automática) -> pollo al ají: pollo crudo + cebolla en cuadros (tabla) + crema de ají amarillo (licuadora)
const STEW_IN = ['pollo_raw', 'cebolla_cuadros', 'salsa_aji'];
// wok del chifa (automático): arroz cocido + pollo crudo en cuadros + cebolla china picada + huevo + sillao (salsa de soya) -> arroz chaufa
// el pollo se cocina en el mismo wok, por eso se corta crudo
const WOK_IN = ['arroz_cooked', 'pollo_cuadros', 'cebolla_picada', 'huevo', 'sillao'];
// La licuadora es genérica: su función la define lo que se mete. Arranca SOLA cuando el contenido coincide con una receta.
// Si esa mezcla todavía podría crecer hacia otra receta del nivel (p. ej. 1 ají = crema, pero ají + queso + leche + galleta = huancaína),
// espera BLEND_WAIT segundos por si llega otro ingrediente antes de empezar.
const BLEND_ACCEPT = ['queso', 'aji', 'leche', 'galleta'];
const BLEND_RECIPES = [
  { in: ['queso', 'aji', 'leche', 'galleta'], out: 'salsa' },   // salsa huancaína
  { in: ['aji'], out: 'salsa_aji' }                             // crema de ají (1 solo ají)
];
const sortKey = a => a.slice().sort().join(',');
function subMulti(items, full) {      // ¿items cabe dentro de full (contando repeticiones)?
  const rest = full.slice();
  for (const it of items) { const i = rest.indexOf(it); if (i < 0) return false; rest.splice(i, 1); }
  return true;
}
const BLEND_WAIT = 2;
// solo cuentan las recetas cuyo resultado usa algún plato del nivel
const activeBlends = () => BLEND_RECIPES.filter(r => LEVEL.dishes.some(d => DISHES[d].uses.includes(r.out)));
const blendOK = items => activeBlends().some(r => subMulti(items, r.in));
const blendMatch = items => activeBlends().find(r => sortKey(r.in) === sortKey(items));
const blendCanGrow = items => activeBlends().some(r => r.in.length > items.length && subMulti(items, r.in));
