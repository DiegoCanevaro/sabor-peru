// Kevin: Cebiche de Pota (nivel independiente: comida de la calle, carretilla cebichera)
// La pota ya viene en cuadros y el camote ya cocido. La cebolla (en cuadros) y el ají limo se pican en las tablas.
// Cada cliente elige sus agregados: con o sin ají, choclo desgranado, cancha y camote. También piden chicha morada.
const CEBICHES = Object.keys(DISHES).filter(k => k.startsWith('cebiche_') && DISHES[k].ceb);
const LEVEL = {
  id: 'K-9', world: 'kevin', layout: 'calle', title: 'Kevin: Cebiche de Pota',
  own: 'cebiche_ackm', dishes: CEBICHES.concat(['chicha']),
  weight: { chicha: 5 },                    // la chicha sale más a menudo (si no, sería 1 de 17)
  customers: 5, arrival: 24,
  crates: ['pota_cortada', 'cebolla_roja', 'aji_limo', 'limon', 'camote_cocido'],
  left: ['board', 'board', 'bowl'], right: [],
  drinks: ['balde', 'cups', 'crate:choclo_desgranado', 'crate:cancha'],
  intro: ['cebiche_ackm', 'chicha']      // recetas que se muestran en la pizarra antes de jugar
};
