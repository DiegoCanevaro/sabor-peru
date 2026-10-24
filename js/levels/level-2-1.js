// Nivel 2-1: Entradas de chifa (primer nivel del Mundo 2): wantán frito y sopa wantán
// Los wantanes se arman en el bowl: masa + cerdo picado (tabla). Fritos en la freidora; para la sopa van a la olla
// llena de agua en el grifo (la olla se lleva con la acción) y con cebolla china picada.
const LEVEL = {
  id: '2-1', world: 2, title: 'Nivel 2-1: Entradas de chifa',
  own: 'wantan_frito', dishes: ['wantan_frito', 'sopa_wantan'],
  crates: ['wantan', 'cerdo', 'cebolla_china'],
  left: ['pot', 'pot', 'tap', 'board', 'board', 'bowl', 'fryer'], right: [],
  customers: 4,
  intro: ['wantan_frito', 'sopa_wantan']
};
