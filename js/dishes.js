// ================= PLATOS (recetas como datos) =================
// kind 'set' = las partes van en cualquier orden · kind 'seq' = las capas van en orden obligatorio.
// blend = lo que lleva la licuadora para este plato (null si no la usa) · uses = tipos que el ayudante considera útiles.
// course = tiempo del menú: 'entrada' (se sirve primero) o 'segundo' (plato de fondo, se sirve después).
// ticket.slots = ingredientes del ticket con la herramienta que usan debajo; { g, t } = grupo que se licúa junto.
const DISHES = {
  huancaina: {
    id: 'huancaina', level: 1, name: 'Papa a la Huancaína', short: 'Huancaína', icon: '🥔', course: 'entrada',
    kind: 'set', parts: ['papa', 'salsa'],
    partName: { papa: 'Papa en rodajas', salsa: 'Salsa huancaína' },
    patience: 90,
    uses: ['papa_raw', 'papa_cooked', 'papa_sliced', 'queso', 'aji', 'leche', 'galleta', 'salsa'],
    blend: ['queso', 'aji', 'leche', 'galleta'],
    ticket: { slots: [{ i: '🥔', t: ['🍲', '🔪'] }, { g: ['🧀', '🌶️', '🥛', '🍘'], t: '🥤' }] },
    recipe: RECIPES.huancaina
  },
  causa: {
    id: 'causa', level: 2, name: 'Causa Limeña', short: 'Causa', icon: '🍰', course: 'entrada',
    kind: 'seq', parts: ['masa', 'relleno', 'masa', 'palta'],
    pot: { papa_raw: 2 },          // las 2 papas de la masa se cuecen juntas en la misma olla
    partName: { masa: 'Masa', relleno: 'Relleno', palta: 'Palta' },
    patience: 105,
    uses: ['papa_raw', 'papa_cooked', 'aji', 'masa', 'pollo_raw', 'pollo_cooked', 'pollo_shred', 'palta', 'palta_sliced'],
    blend: null,
    ticket: { slots: [{ i: '🥔', t: ['🍲', '🥣'] }, { i: '🌶️', t: ['🥣'] }, { i: '🍗', t: ['🍲', '🔪'] }, { i: '🥑', t: ['🔪'] }] },
    recipe: RECIPES.causa
  },
  aji: {
    id: 'aji', level: 3, name: 'Ají de Gallina', short: 'Ají de gallina', icon: '🍛', course: 'segundo',
    kind: 'set', parts: ['arroz', 'papa', 'guiso'],
    partName: { arroz: 'Arroz cocido', papa: 'Papa en rodajas', guiso: 'Ají de gallina' },
    patience: 115,
    uses: ['arroz_raw', 'arroz_cooked', 'papa_raw', 'papa_cooked', 'papa_sliced', 'pollo_raw', 'pollo_cooked', 'pollo_shred', 'aji', 'salsa_aji', 'guiso'],
    blend: ['aji'],
    ticket: { slots: [{ i: '🍚', t: ['🍲'] }, { i: '🥔', t: ['🍲', '🔪'] }, { i: '🍗', t: ['🍲', '🔪', '🍳'] }, { g: ['🌶️'], t: '🥤' }] },
    recipe: RECIPES.aji
  },
  // Kevin: comida de la calle (niveles independientes de los mundos)
  // Cebiche de pota carretillero: la pota (en cuadros) y el camote ya vienen listos. Se pide con o sin ají.
  cebiche_pota: {
    id: 'cebiche_pota', level: 0, name: 'Cebiche de Pota con ají', short: 'Con ají', icon: '🦑', course: 'plato',
    kind: 'set', parts: ['cebiche_aji', 'camote'],
    partName: { cebiche_aji: 'Cebiche con ají', camote: 'Camote' },
    patience: 110,
    uses: ['pota_cortada', 'limon', 'cebolla_roja', 'cebolla_cuadros', 'aji_limo', 'aji_limo_picado', 'camote_cocido', 'cebiche_aji'],
    blend: null,
    ticket: { slots: [{ g: ['🦑', '🧅', '🌶️', '🍋'], t: '🥣' }, { i: '🍠', t: [] }] },
    recipe: RECIPES.cebiche_pota
  },
  cebiche_sin: {
    id: 'cebiche_sin', level: 0, name: 'Cebiche de Pota sin ají', short: 'Sin ají', icon: '🦑', course: 'plato',
    kind: 'set', parts: ['cebiche', 'camote'],
    partName: { cebiche: 'Cebiche sin ají', camote: 'Camote' },
    patience: 105,
    uses: ['pota_cortada', 'limon', 'cebolla_roja', 'cebolla_cuadros', 'camote_cocido', 'cebiche'],
    blend: null,
    ticket: { slots: [{ g: ['🦑', '🧅', '🍋'], t: '🥣' }, { i: '🍠', t: [] }] },
    recipe: RECIPES.cebiche_pota
  },
  // bebida: se entrega en su vaso, sin plato
  chicha: {
    id: 'chicha', level: 0, name: 'Chicha Morada', short: 'Chicha', icon: '🍇', course: 'bebida',
    kind: 'set', parts: ['chicha'],
    partName: { chicha: 'Vaso de chicha' },
    patience: 80,
    uses: ['vaso', 'chicha'],
    blend: null,
    ticket: { slots: [{ i: '🥤', t: ['🪣'] }] },
    recipe: ''
  },
  // Mundo 2 (chifa)
  chaufa: {
    id: 'chaufa', level: 4, name: 'Arroz Chaufa', short: 'Chaufa', icon: '🍛', course: 'segundo',
    kind: 'set', parts: ['chaufa'],
    partName: { chaufa: 'Arroz chaufa' },
    patience: 120,
    uses: ['arroz_raw', 'arroz_cooked', 'pollo_raw', 'pollo_cuadros', 'cebolla_china', 'cebolla_picada', 'huevo', 'sillao', 'chaufa'],
    blend: null,
    ticket: { slots: [{ i: '🍚', t: ['🍲', '🥘'] }, { i: '🍗', t: ['🔪', '🥘'] }, { i: '🌱', t: ['🔪', '🥘'] }, { i: '🥚', t: ['🥘'] }, { i: '🍶', t: ['🥘'] }] },
    recipe: RECIPES.chaufa
  }
};
