// ================= REGLAS DEL PLATO =================
// Un plato lleva una lista ordenada de partes: plate.parts. Cada pedido (dish) decide qué partes acepta.
function canAdd(dish, plate, part) {
  if (dish.kind === 'seq') return dish.parts[plate.parts.length] === part;
  return dish.parts.includes(part) && !plate.parts.includes(part);
}
function fits(dish, plate) {    // ¿lo que ya tiene el plato sirve para este pedido?
  if (dish.kind === 'seq') return plate.parts.every((p, i) => dish.parts[i] === p);
  return plate.parts.every((p, i) => dish.parts.includes(p) && plate.parts.indexOf(p) === i);
}
function isDone(dish, plate) {
  if (!dish || !plate || !fits(dish, plate)) return false;
  return dish.kind === 'seq' ? plate.parts.length === dish.parts.length : dish.parts.every(p => plate.parts.includes(p));
}
