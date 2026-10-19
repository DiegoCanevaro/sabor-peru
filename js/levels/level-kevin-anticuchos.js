// Kevin: Anticuchos, rachi y pancita (nivel independiente: carretilla anticuchera de noche)
// Corazón, rachi o pancita: se cortan en la tabla, se maceran en el bowl con salsa anticuchera, se ensartan en
// palitos y se asan en la parrilla. Se sirven con papa y choclo sancochados (vienen cocidos; se cortan en rodajas).
const LEVEL = {
  id: 'K-10', world: 'kevin', layout: 'calle', night: true, title: 'Kevin: Anticuchos, rachi y pancita',
  own: 'anticuchos', dishes: ['anticuchos', 'rachi', 'pancita'],
  customers: 5, arrival: 36,
  crates: ['corazon', 'rachi', 'pancita', 'papa_cooked', 'choclo_cocido'],
  left: ['board', 'board', 'skewer', 'bowl', 'grill'], right: [],
  drinks: ['crate:salsa_anticuchera'],
  intro: ['anticuchos']      // la pizarra muestra el flujo una vez (corazón, rachi o pancita)
};
