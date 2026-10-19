// Nivel 1-5: Lomo Saltado (también pide Pollo al Ají y Ají de Gallina)
// Aparecen la freidora (papas fritas) y el wok en la cocina criolla. La tabla corta la carne en cubos,
// la papa en bastones y la cebolla y el tomate en juliana.
const LEVEL = {
  id: '1-5', title: 'Nivel 1-5: Lomo Saltado',
  own: 'lomo_saltado', dishes: ['lomo_saltado', 'pollo_aji', 'aji'],
  crates: ['carne', 'papa_raw', 'tomate', 'cebolla_roja', 'arroz_raw', 'sillao', 'pollo_raw', 'aji'],
  left: ['pot', 'pot', 'pot', 'stew', 'pan', 'wok', 'board', 'board', 'blender', 'fryer'], right: [], customers: 5, arrival: 40      // el lomo tiene muchos pasos: los pedidos llegan más espaciados
};
