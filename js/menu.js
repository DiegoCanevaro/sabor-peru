// ================= MENÚ: LISTA DE NIVELES Y PROGRESO =================
// Datos que usan la pantalla de inicio y la de selección de niveles (no cargan el motor del juego).
// Los niveles se juegan en 3D; las páginas 2D (nivelX-Y.html) quedan solo para probar mecánicas.
const LEVEL_LIST = [
  { id: '1-1', file: 'nivel1-1-3d.html', icon: '🥔', dish: 'huancaina', servesDish: ['huancaina'], name: 'Papa a la Huancaína',
    desc: 'Papa en rodajas con salsa huancaína licuada.', serves: ['🥔'] },
  { id: '1-2', file: 'nivel1-2-3d.html', icon: '🍰', dish: 'causa', servesDish: ['causa', 'huancaina'], name: 'Causa Limeña',
    desc: 'Capas en orden: masa, relleno de pollo, masa y palta.', serves: ['🍰', '🥔'] },
  { id: '1-3', file: 'nivel1-3-3d.html', icon: '🍛', dish: 'aji', servesDish: ['aji', 'causa', 'huancaina'], name: 'Ají de Gallina',
    desc: 'Arroz, papa y ají de gallina hecho en la sartén.', serves: ['🍛', '🍰', '🥔'] },
  { id: '1-4', file: 'nivel1-4-3d.html', icon: '🍗', dish: 'pollo_aji', servesDish: ['pollo_aji', 'aji', 'huancaina'], name: 'Pollo al Ají',
    desc: 'Pollo, cebolla en cuadros y ají molido en la olla; con papa en rodajas y arroz.', serves: ['🍗', '🍛', '🥔'] },
  { id: '1-5', file: 'nivel1-5-3d.html', icon: '🥩', dish: 'lomo_saltado', servesDish: ['lomo_saltado', 'pollo_aji', 'aji'], name: 'Lomo Saltado',
    desc: 'Carne, tomate y cebolla salteados en el wok con sillao; con arroz y papas fritas.', serves: ['🥩', '🍗', '🍛'] },
  { id: '2-1', world: 2, file: 'nivel2-1-3d.html', icon: '🍛', dish: 'chaufa', servesDish: ['chaufa'], name: 'Arroz Chaufa',
    desc: 'Arroz, pollo en cuadros, huevo, cebolla china y sillao salteados en el wok.', serves: ['🍛'] },
  { id: 'K-9', world: 'kevin', file: 'kevin-pota-3d.html', icon: '🦑', dish: 'cebiche_pota', servesDish: ['cebiche_pota', 'cebiche_sin', 'chicha'], name: 'Cebiche de Pota',
    desc: 'Carretilla cebichera: cebiche con o sin ají, con camote, y chicha morada del balde.', serves: ['🦑', '🍇'] },
  { id: 'K-10', world: 'kevin', file: 'kevin-anticuchos-3d.html', icon: '🍢', dish: 'anticuchos', servesDish: ['anticuchos', 'rachi', 'pancita'], name: 'Anticuchos',
    desc: 'Carretilla de noche: corazón, rachi o pancita macerados, en palito y a la parrilla; con papa y choclo.', serves: ['🍢'] }
];

// El mejor puntaje de cada nivel se guarda en el navegador (puede no estar disponible: modo privado, etc.).
const BEST_KEY = id => 'saborPeru.best.' + id;
function getBest(id) {
  try { const v = localStorage.getItem(BEST_KEY(id)); return v === null ? null : +v; } catch { return null; }
}
function saveBest(id, score) {
  const prev = getBest(id);
  if (prev !== null && prev >= score) return false;
  try { localStorage.setItem(BEST_KEY(id), String(score)); } catch { return false; }
  return true;
}

// Dibuja las tarjetas de niveles, un bloque por mundo (la usan la portada y niveles.html)
const WORLD_NAMES = { 1: 'Mundo 1 · Cocina criolla', 2: 'Mundo 2 · Chifa', kevin: 'Kevin · Comida de la calle' };
function renderLevels(box) {
  box.innerHTML = '';
  const grids = {};
  LEVEL_LIST.forEach(L => {
    const w = L.world || 1;
    if (!grids[w]) {
      const h = document.createElement('h2'); h.className = 'world'; h.textContent = WORLD_NAMES[w] || 'Mundo ' + w;
      const gd = document.createElement('div'); gd.className = 'levelGrid';
      box.append(h, gd); grids[w] = gd;
    }
    const best = getBest(L.id);
    const a = document.createElement('a');
    a.className = 'levelCard' + (best !== null ? ' done' : '');
    a.href = L.file;
    a.innerHTML =
      '<span class="lvNum">' + L.id + '</span>' +
      '<span class="lvIcon"></span>' +
      '<span class="lvName">' + L.name + '</span>' +
      '<span class="lvDesc">' + L.desc + '</span>' +
      '<span class="lvServes">Pedidos: </span>' +
      '<span class="lvBest">' + (best !== null ? '⭐ Récord: ' + best : 'Sin jugar') + '</span>';
    if (typeof dishIcon === 'function') {
      a.querySelector('.lvIcon').appendChild(dishIcon(L.dish, 110));
      L.servesDish.forEach(d => a.querySelector('.lvServes').appendChild(dishIcon(d, 30)));
    }
    grids[w].appendChild(a);
  });
}
