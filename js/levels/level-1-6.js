// Nivel 1-6: Menú completo. Cada cliente pide una entrada y un segundo (en un solo ticket):
// primero se entrega la entrada (huancaína o causa) y después el segundo (ají de gallina o pollo al ají).
const LEVEL = {
  id: '1-6', title: 'Nivel 1-6: Menú completo',
  own: 'pollo_aji', dishes: ['huancaina', 'causa', 'aji', 'pollo_aji'],
  combos: { entradas: ['huancaina', 'causa'], segundos: ['aji', 'pollo_aji'] },
  crates: ['papa_raw', 'aji', 'queso', 'leche', 'galleta', 'pollo_raw', 'palta', 'arroz_raw', 'cebolla_roja'],
  left: ['pot', 'pot', 'pot', 'pot', 'pan', 'board', 'board', 'bowl', 'blender'], right: [],
  customers: 4, arrival: 65, time: 420, patience: 1.4,      // dos platos por cliente: más paciencia
  intro: ['huancaina', 'pollo_aji']
};
