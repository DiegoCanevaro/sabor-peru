// ================= PEDIDOS Y CLIENTES =================
// Cada cliente pide un plato. Un nivel acepta su propio plato y los de niveles inferiores (LEVEL.dishes).
// Los pedidos llegan escalonados. Como en un restaurante real, primero salen las entradas y después los segundos:
// las entradas llegan antes y se entregan en cualquier orden; un segundo solo se entrega cuando no queda ninguna entrada pendiente.
// Para probar: añade ?pedidos=causa,huancaina,aji a la dirección de la página.
if (LEVEL.customers) TOTAL_CUSTOMERS = LEVEL.customers;
const ARRIVAL = LEVEL.arrival || 30;   // segundos entre la llegada de un pedido y el siguiente
// reloj del turno: lo que tarda en llegar el último cliente + 1:30 (redondeado a 15 s). LEVEL.time lo fija a mano.
const TURN_TIME = LEVEL.time || Math.ceil(((TOTAL_CUSTOMERS - 1) * ARRIVAL + 90) / 15) * 15;
let timeLeft = TURN_TIME, timeUp = false;
const ORDERS = [];
// Pedidos combinados (LEVEL.combos): un mismo cliente pide una entrada y un segundo ('huancaina+aji'). Se entrega
// primero la entrada y después el segundo, en un solo ticket.
const comboOf = o => o.split('+').map(d => DISHES[d]);
function makeOrders() {
  ORDERS.length = 0;
  const qs = (typeof location !== 'undefined' && location.search) || '';
  const forced = (new URLSearchParams(qs).get('pedidos') || '').split(',').filter(o => o && o.split('+').every(d => DISHES[d] && LEVEL.dishes.includes(d)));
  if (LEVEL.combos && !forced.length) {
    const pick = a => a[Math.floor(Math.random() * a.length)], C = LEVEL.combos;
    for (let i = 0; i < TOTAL_CUSTOMERS; i++) ORDERS.push(pick(C.entradas) + '+' + (i === 0 ? LEVEL.own : pick(C.segundos)));
    for (let i = ORDERS.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ORDERS[i], ORDERS[j]] = [ORDERS[j], ORDERS[i]]; }
    return;
  }
  if (forced.length) { const l = []; for (let i = 0; i < TOTAL_CUSTOMERS; i++) l.push(forced[i % forced.length]); byCourse(l).forEach(d => ORDERS.push(d)); return; }
  const pool = LEVEL.dishes.flatMap(d => Array((LEVEL.weight || {})[d] || 1).fill(d));      // weight: unos platos salen más
  let list;
  do {                                   // siempre aparece el plato del nivel y no se repite el mismo para todos
    list = [LEVEL.own];
    while (list.length < TOTAL_CUSTOMERS) list.push(pool[Math.floor(Math.random() * pool.length)]);
  } while (pool.length > 1 && list.every(d => d === list[0]));
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  byCourse(list).forEach(d => ORDERS.push(d));
}
// orden estable: entradas primero, segundos después
const byCourse = list => list.some(d => d.includes('+')) ? list : list.filter(d => DISHES[d].course !== 'segundo').concat(list.filter(d => DISHES[d].course === 'segundo'));

let customers = [], clock = 0, lastResolve = -9, endTimer = -1, lastArrival = -9;
const MIN_WAITING = LEVEL.minWaiting || 2;      // pedidos que se ven a la vez como mínimo
const plateReturns = [];        // momentos en que vuelve un plato limpio a una mesa cerca de la salida
function returnPlates() {
  for (let i = plateReturns.length - 1; i >= 0; i--) {
    if (clock < plateReturns[i]) continue;
    const t = plateSpot() || freeTableNear(byKind('counter').sx, byKind('counter').sy);
    if (!t) return;                // no hay mesa libre: se intenta en el siguiente fotograma
    t.item = { type: 'plate', parts: [] }; plateReturns.splice(i, 1);
  }
}
function initCustomers() {
  customers = ORDERS.map((d, i) => ({ idx: i, dish: comboOf(d)[0], combo: d.includes('+') ? comboOf(d) : null, step: 0, state: 'queued', arriveAt: i * ARRIVAL, patience: 0, max: 0, doneAt: 0 }));
  clock = 0; lastResolve = -9; endTimer = -1; lastArrival = -9;
}
function startRound() { initCustomers(); timeLeft = TURN_TIME; timeUp = false; started = true; }
function setOrders(list) { ORDERS.length = 0; list.forEach(d => ORDERS.push(d)); initCustomers(); buildTickets(); }
const waitingList = () => customers.filter(c => c.state === 'waiting');
const nextQueued = () => customers.find(c => c.state === 'queued');
// platos que se pueden estar preparando
// (todos los pedidos pendientes, también los que aún no llegan: se pueden adelantar y entregar antes)
function openDishes() { return customers.filter(c => c.state === 'waiting' || c.state === 'queued').flatMap(c => c.combo ? c.combo.slice(c.step) : [c.dish]); }
// el ayudante prioriza siempre el primer pedido de la cola
function targetDish() { const w = waitingList()[0]; if (w) return w.dish; const q = nextQueued(); return q ? q.dish : null; }
// un segundo espera a que no quede ninguna entrada por servir (en espera o por llegar); si un cliente se va enojado, ya no bloquea
const entradaPending = () => customers.some(c => !c.combo && c.dish.course === 'entrada' && (c.state === 'waiting' || c.state === 'queued'));
// se puede entregar a quien ya espera y también a los pedidos que aún no llegan (no urgentes: ticket en gris)
const servable = c => (c.state === 'waiting' || c.state === 'queued') && (c.combo || c.dish.course !== 'segundo' || !entradaPending());
const servableList = () => customers.filter(servable);
const plateDone = plate => servableList().some(c => isDone(c.dish, plate));
// el plato está completo para un segundo, pero todavía faltan entradas
const plateEarly = plate => !plateDone(plate) && waitingList().some(c => isDone(c.dish, plate));
const fitsOpen = plate => openDishes().some(D => fits(D, plate));
function canPlace(plate, part) { return openDishes().some(D => fits(D, plate) && canAdd(D, plate, part)); }
// entrega: el plato sirve al primer cliente servible cuyo pedido completa (entradas en orden libre, segundos al final)
function serve(plate, noPlate) {      // noPlate: lo entregado no es un plato (p. ej. un vaso de chicha), no vuelve a la mesa
  const list = servableList();
  // primero a quien ya está esperando; si nadie espera ese plato, se adelanta un pedido que aún no llega
  const c = list.find(c => c.state === 'waiting' && isDone(c.dish, plate)) || list.find(c => isDone(c.dish, plate));
  if (!c) return false;
  const bonus = c.state === 'queued' ? 50 : Math.round(c.patience / c.max * 50);
  if (!noPlate) plateReturns.push(clock + PLATE_RETURN);
  // pedido combinado: tras la entrada, el mismo cliente espera su segundo (con la paciencia renovada)
  if (c.combo && c.step < c.combo.length - 1) {
    c.step++; c.dish = c.combo[c.step];
    if (c.state === 'waiting') c.patience = c.max = c.dish.patience * (LEVEL.patience || 1);
    score += 100 + bonus; showToast('+' + (100 + bonus) + ' ⭐ ¡Ahora el segundo!');
    return true;
  }
  score += 100 + bonus; served++;
  c.state = 'happy'; c.doneAt = clock; lastResolve = clock;
  showToast('+' + (100 + bonus) + ' ⭐ ¡Buen provecho!');
  return true;
}
