// ================= PEDIDOS Y CLIENTES =================
// Cada cliente pide un plato. Un nivel acepta su propio plato y los de niveles inferiores (LEVEL.dishes).
// Los pedidos llegan escalonados. Como en un restaurante real, primero salen las entradas y después los segundos:
// las entradas llegan antes y se entregan en cualquier orden; un segundo solo se entrega cuando no queda ninguna entrada pendiente.
// Para probar: añade ?pedidos=causa,huancaina,aji a la dirección de la página.
const ARRIVAL = LEVEL.arrival || 30;   // segundos entre la llegada de un pedido y el siguiente
const ORDERS = [];
function makeOrders() {
  ORDERS.length = 0;
  const qs = (typeof location !== 'undefined' && location.search) || '';
  const forced = (new URLSearchParams(qs).get('pedidos') || '').split(',').filter(d => DISHES[d] && LEVEL.dishes.includes(d));
  if (forced.length) { const l = []; for (let i = 0; i < TOTAL_CUSTOMERS; i++) l.push(forced[i % forced.length]); byCourse(l).forEach(d => ORDERS.push(d)); return; }
  const pool = LEVEL.dishes;
  let list;
  do {                                   // siempre aparece el plato del nivel y no se repite el mismo para todos
    list = [LEVEL.own];
    while (list.length < TOTAL_CUSTOMERS) list.push(pool[Math.floor(Math.random() * pool.length)]);
  } while (pool.length > 1 && list.every(d => d === list[0]));
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  byCourse(list).forEach(d => ORDERS.push(d));
}
// orden estable: entradas primero, segundos después
const byCourse = list => list.filter(d => DISHES[d].course !== 'segundo').concat(list.filter(d => DISHES[d].course === 'segundo'));

let customers = [], clock = 0, lastResolve = -9, endTimer = -1;
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
  customers = ORDERS.map((d, i) => ({ idx: i, name: CUSTOMERS[i], dish: DISHES[d], state: 'queued', arriveAt: i * ARRIVAL, patience: 0, max: 0, doneAt: 0 }));
  clock = 0; lastResolve = -9; endTimer = -1;
}
function startRound() { initCustomers(); started = true; }
function setOrders(list) { ORDERS.length = 0; list.forEach(d => ORDERS.push(d)); initCustomers(); buildTickets(); }
const waitingList = () => customers.filter(c => c.state === 'waiting');
const nextQueued = () => customers.find(c => c.state === 'queued');
// platos que se pueden estar preparando: los pedidos en espera y el que llegará después (para ir adelantando)
function openDishes() { const l = waitingList().map(c => c.dish), q = nextQueued(); if (q) l.push(q.dish); return l; }
// el ayudante prioriza siempre el primer pedido de la cola
function targetDish() { const w = waitingList()[0]; if (w) return w.dish; const q = nextQueued(); return q ? q.dish : null; }
// un segundo espera a que no quede ninguna entrada por servir (en espera o por llegar); si un cliente se va enojado, ya no bloquea
const entradaPending = () => customers.some(c => c.dish.course === 'entrada' && (c.state === 'waiting' || c.state === 'queued'));
// se puede entregar a quien ya espera y también a los pedidos que aún no llegan (no urgentes: ticket en gris)
const servable = c => (c.state === 'waiting' || c.state === 'queued') && (c.dish.course !== 'segundo' || !entradaPending());
const servableList = () => customers.filter(servable);
const plateDone = plate => servableList().some(c => isDone(c.dish, plate));
// el plato está completo para un segundo, pero todavía faltan entradas
const plateEarly = plate => !plateDone(plate) && waitingList().some(c => isDone(c.dish, plate));
const fitsOpen = plate => openDishes().some(D => fits(D, plate));
function canPlace(plate, part) { return openDishes().some(D => fits(D, plate) && canAdd(D, plate, part)); }
// entrega: el plato sirve al primer cliente servible cuyo pedido completa (entradas en orden libre, segundos al final)
function serve(plate) {
  const list = servableList();
  // primero a quien ya está esperando; si nadie espera ese plato, se adelanta un pedido que aún no llega
  const c = list.find(c => c.state === 'waiting' && isDone(c.dish, plate)) || list.find(c => isDone(c.dish, plate));
  if (!c) return false;
  const bonus = c.state === 'queued' ? 50 : Math.round(c.patience / c.max * 50);
  score += 100 + bonus; served++;
  c.state = 'happy'; c.doneAt = clock; lastResolve = clock;
  plateReturns.push(clock + PLATE_RETURN);       // el plato volverá limpio
  showToast('+' + (100 + bonus) + ' ⭐ ¡Buen provecho!');
  return true;
}
