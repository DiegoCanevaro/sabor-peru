// ================= PLATOS (recetas como datos) =================
// kind 'set' = las partes van en cualquier orden · kind 'seq' = las capas van en orden obligatorio.
// blend = lo que lleva la licuadora para este plato (null si no la usa) · uses = tipos que el ayudante considera útiles.
// howto = la receta en dibujo de la pizarra antes de jugar (js/howto.js): rows = cadenas ingrediente → herramientas que llegan
//   a 'merge' (o directo al plato); extras = cadenas que van directo al plato; order = orden de las capas (causa).
// course = tiempo del menú: 'entrada' (se sirve primero) o 'segundo' (plato de fondo, se sirve después).
// ticket.slots = ingredientes del ticket (id) con las herramientas que usan debajo; { g, t } = grupo que va junto a una herramienta.
const DISHES = {
  huancaina: {
    id: 'huancaina', level: 1, name: 'Papa a la Huancaína', short: 'Huancaína', icon: '🥔', course: 'entrada',
    kind: 'set', parts: ['papa', 'salsa'],
    partName: { papa: 'Papa en rodajas', salsa: 'Salsa huancaína' },
    patience: 90,
    uses: ['papa_raw', 'papa_cooked', 'papa_sliced', 'queso', 'aji', 'leche', 'galleta', 'salsa'],
    blend: ['queso', 'aji', 'leche', 'galleta'],
    ticket: { slots: [{ id: 'papa_raw', t: ['pot', 'board'] }, { g: ['queso', 'aji', 'leche', 'galleta'], t: 'blender' }] },
    howto: { rows: [{ ings: ['papa_raw'], tools: ['pot', 'board'] }, { ings: ['queso', 'aji', 'leche', 'galleta'], tools: ['blender'] }] },
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
    ticket: { slots: [{ id: 'papa_raw', t: ['pot', 'bowl'] }, { id: 'aji', t: ['bowl'] }, { id: 'pollo_raw', t: ['pot', 'board'] }, { id: 'palta', t: ['board'] }] },
    howto: { rows: [{ ings: ['papa_raw', 'papa_raw'], tools: ['pot'] }, { ings: ['aji'], tools: [] }], merge: 'bowl', extras: [{ ings: ['pollo_raw'], tools: ['pot', 'board'] }, { ings: ['palta'], tools: ['board'] }], order: [{ tool: 'bowl' }, { ing: 'pollo_raw' }, { tool: 'bowl' }, { ing: 'palta' }] },
    recipe: RECIPES.causa
  },
  aji: {
    id: 'aji', level: 3, name: 'Ají de Gallina', short: 'Ají de gallina', icon: '🍛', course: 'segundo',
    kind: 'set', parts: ['arroz', 'papa', 'guiso'],
    partName: { arroz: 'Arroz cocido', papa: 'Papa en rodajas', guiso: 'Ají de gallina' },
    patience: 115,
    uses: ['arroz_raw', 'arroz_cooked', 'papa_raw', 'papa_cooked', 'papa_sliced', 'pollo_raw', 'pollo_cooked', 'pollo_shred', 'aji', 'salsa_aji', 'guiso'],
    blend: ['aji'],
    ticket: { slots: [{ id: 'arroz_raw', t: ['pot'] }, { id: 'papa_raw', t: ['pot', 'board'] }, { id: 'pollo_raw', t: ['pot', 'board', 'pan'] }, { g: ['aji'], t: 'blender' }] },
    howto: { rows: [{ ings: ['pollo_raw'], tools: ['pot', 'board'] }, { ings: ['aji'], tools: ['blender'] }], merge: 'pan', extras: [{ ings: ['arroz_raw'], tools: ['pot'] }, { ings: ['papa_raw'], tools: ['pot', 'board'] }] },
    recipe: RECIPES.aji
  },
  // Nivel 1-4: Pollo al ají. Todo a una olla (pollo, cebolla en cuadros y ají amarillo molido en la licuadora);
  // se sirve con papa sancochada en rodajas (tabla) y arroz. El ají sigue siendo el protagonista del Mundo 1.
  pollo_aji: {
    id: 'pollo_aji', level: 4, name: 'Pollo al Ají', short: 'Pollo al ají', icon: '🍛', course: 'segundo',
    kind: 'set', parts: ['arroz', 'papa', 'pollo_aji'],
    partName: { arroz: 'Arroz cocido', papa: 'Papa en rodajas', pollo_aji: 'Pollo al ají' },
    patience: 125,
    uses: ['arroz_raw', 'arroz_cooked', 'papa_raw', 'papa_cooked', 'papa_sliced', 'pollo_raw', 'cebolla_roja', 'cebolla_cuadros', 'aji', 'salsa_aji', 'pollo_aji'],
    blend: ['aji'],
    ticket: { slots: [{ id: 'pollo_raw', t: ['stew'] }, { id: 'cebolla_roja', t: ['board', 'stew'] }, { id: 'aji', t: ['blender', 'stew'] }, { id: 'arroz_raw', t: ['pot'] }, { id: 'papa_raw', t: ['pot', 'board'] }] },
    howto: { rows: [{ ings: ['pollo_raw'], tools: [] }, { ings: ['cebolla_roja'], tools: ['board'] }, { ings: ['aji'], tools: ['blender'] }], merge: 'stew', extras: [{ ings: ['arroz_raw'], tools: ['pot'] }, { ings: ['papa_raw'], tools: ['pot', 'board'] }] },
    recipe: RECIPES.pollo_aji
  },
  // Nivel 1-5: Lomo saltado. Cortes en la tabla (carne en cubos, papa en bastón, cebolla y tomate en juliana);
  // la papa va a la freidora y lo demás se saltea en el wok con sillao. Al plato: el saltado, arroz y papas fritas.
  lomo_saltado: {
    id: 'lomo_saltado', level: 5, name: 'Lomo Saltado', short: 'Lomo saltado', icon: '🥩', course: 'segundo',
    kind: 'set', parts: ['arroz', 'papas_fritas', 'saltado'],
    partName: { arroz: 'Arroz cocido', papas_fritas: 'Papas fritas', saltado: 'Lomo saltado' },
    patience: 150,
    uses: ['arroz_raw', 'arroz_cooked', 'papa_raw', 'papa_baston', 'papas_fritas', 'carne', 'carne_cubos', 'tomate', 'tomate_juliana', 'cebolla_roja', 'cebolla_juliana', 'sillao', 'saltado'],
    blend: null,
    ticket: { slots: [{ id: 'carne', t: ['board', 'wok'] }, { id: 'tomate', t: ['board', 'wok'] }, { id: 'cebolla_roja', t: ['board', 'wok'] }, { id: 'sillao', t: ['wok'] }, { id: 'arroz_raw', t: ['pot'] }, { id: 'papa_raw', t: ['board', 'fryer'] }] },
    howto: { rows: [{ ings: ['carne'], tools: ['board'] }, { ings: ['tomate'], tools: ['board'] }, { ings: ['cebolla_roja'], tools: ['board'] }, { ings: ['sillao'], tools: [] }], merge: 'wok', extras: [{ ings: ['arroz_raw'], tools: ['pot'] }, { ings: ['papa_raw'], tools: ['board', 'fryer'] }] },
    recipe: RECIPES.lomo_saltado
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
    ticket: { slots: [{ g: ['pota_cortada', 'cebolla_roja', 'aji_limo', 'limon'], t: 'bowl' }, { id: 'camote_cocido', t: [] }] },
    howto: { rows: [{ ings: ['pota_cortada', 'limon'], tools: [] }, { ings: ['cebolla_roja'], tools: ['board'] }, { ings: ['aji_limo'], tools: ['board'], optional: 'con ají' }], merge: 'bowl', extras: [{ ings: ['camote_cocido'], tools: [] }] },
    recipe: RECIPES.cebiche_pota
  },
  cebiche_sin: {
    id: 'cebiche_sin', level: 0, name: 'Cebiche de Pota sin ají', short: 'Sin ají', icon: '🦑', course: 'plato',
    kind: 'set', parts: ['cebiche', 'camote'],
    partName: { cebiche: 'Cebiche sin ají', camote: 'Camote' },
    patience: 105,
    uses: ['pota_cortada', 'limon', 'cebolla_roja', 'cebolla_cuadros', 'camote_cocido', 'cebiche'],
    blend: null,
    ticket: { slots: [{ g: ['pota_cortada', 'cebolla_roja', 'limon'], t: 'bowl' }, { id: 'camote_cocido', t: [] }] },
    howto: { rows: [{ ings: ['pota_cortada', 'limon'], tools: [] }, { ings: ['cebolla_roja'], tools: ['board'] }], merge: 'bowl', extras: [{ ings: ['camote_cocido'], tools: [] }] },
    recipe: RECIPES.cebiche_pota
  },
  // Kevin: carretilla nocturna de anticuchos. Corazón, rachi o pancita: se cortan (tabla), se maceran con salsa
  // anticuchera (bowl), se ensartan (palitos) y se asan (parrilla). Al plato con papa y choclo sancochados en rodajas.
  ...['anticuchos:corazon:anticucho:Anticuchos:Anticuchos', 'rachi:rachi:rachi_asado:Rachi:Rachi', 'pancita:pancita:pancita_asada:Pancita:Pancita'].reduce((o, row) => {
    const [id, meat, out, name, short] = row.split(':');
    o[id] = {
      id, level: 0, name, short, icon: '🍢', course: 'plato',
      kind: 'set', parts: [out, 'papa', 'choclo'],
      partName: { [out]: name, papa: 'Papa en rodajas', choclo: 'Choclo en rodajas' },
      patience: 150, meat,
      uses: [meat, meat + '_trozos', 'salsa_anticuchera', meat + '_mar', meat + '_palito', out, 'papa_cooked', 'papa_sliced', 'choclo_cocido', 'choclo_rodajas'],
      blend: null,
      ticket: { slots: [{ id: meat, t: ['board', 'bowl', 'skewer', 'grill'] }, { id: 'salsa_anticuchera', t: ['bowl'] }, { id: 'papa_cooked', t: ['board'] }, { id: 'choclo_cocido', t: ['board'] }] },
      howto: { rows: [{ ings: ['corazon', 'rachi', 'pancita'], or: true, tools: ['board'] }, { ings: ['salsa_anticuchera'], tools: [] }], merge: 'bowl', after: ['skewer', 'grill'],
        extras: [{ ings: ['papa_cooked'], tools: ['board'] }, { ings: ['choclo_cocido'], tools: ['board'] }] },
      recipe: RECIPES.anticuchos
    };
    return o;
  }, {}),
  // bebida: se entrega en su vaso, sin plato
  chicha: {
    id: 'chicha', level: 0, name: 'Chicha Morada', short: 'Chicha', icon: '🍇', course: 'bebida',
    kind: 'set', parts: ['chicha'],
    partName: { chicha: 'Vaso de chicha' },
    patience: 80,
    uses: ['vaso', 'chicha'],
    blend: null,
    ticket: { slots: [{ id: 'vaso', t: ['balde'] }] },
    howto: { rows: [{ ings: ['vaso'], tools: ['balde'] }] },
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
    ticket: { slots: [{ id: 'arroz_raw', t: ['pot', 'wok'] }, { id: 'pollo_raw', t: ['board', 'wok'] }, { id: 'cebolla_china', t: ['board', 'wok'] }, { id: 'huevo', t: ['wok'] }, { id: 'sillao', t: ['wok'] }] },
    howto: { rows: [{ ings: ['arroz_raw'], tools: ['pot'] }, { ings: ['pollo_raw'], tools: ['board'] }, { ings: ['cebolla_china'], tools: ['board'] }, { ings: ['huevo', 'sillao'], tools: [] }], merge: 'wok' },
    recipe: RECIPES.chaufa
  }
};
