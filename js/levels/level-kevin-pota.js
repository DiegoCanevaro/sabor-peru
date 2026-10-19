// Kevin: Cebiche de Pota (nivel independiente: comida de la calle, carretilla cebichera)
// La pota ya viene en cuadros y el camote ya cocido. La cebolla (en cuadros) y el ají limo se pican en las tablas.
// Los clientes piden cebiche con ají, sin ají o chicha morada (del balde chichero, en vasos de plástico).
const LEVEL = {
  id: 'K-9', world: 'kevin', layout: 'calle', title: 'Kevin: Cebiche de Pota',
  own: 'cebiche_pota', dishes: ['cebiche_pota', 'cebiche_sin', 'chicha'],
  customers: 5, arrival: 24,
  crates: ['pota_cortada', 'cebolla_roja', 'aji_limo', 'limon', 'camote_cocido'],
  left: ['board', 'board', 'bowl'], right: [],
  drinks: ['balde', 'cups']
};
