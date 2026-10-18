# Sabor Perú

Juego de cocina peruana estilo Overcooked que enseña recetas reales. Se juega en el navegador, sin instalar nada: basta con abrir `index.html`.

## Cómo jugar

- **Mover:** WASD o flechas
- **Interactuar:** Espacio o E (mantener presionado en la tabla y el bowl)
- **Ayudante (IA):** B
- **Móvil:** se juega en horizontal con los controles táctiles semitransparentes

## Niveles

| Mundo | Nivel | Plato |
|---|---|---|
| 1 · Cocina criolla (restaurante menú de mercado limeño) | 1-1 | Papa a la Huancaína |
| | 1-2 | Causa Limeña |
| | 1-3 | Ají de Gallina |
| 2 · Chifa | 2-1 | Arroz Chaufa |
| Kevin · Comida de la calle (carritos cebicheros) | K-9 | Cebiche de Pota |

La pantalla de niveles abre las versiones 3D (`nivelX-Y-3d.html`, `kevin-*-3d.html`). Las páginas 2D (`nivelX-Y.html`) usan la misma lógica y sirven para probar mecánicas.

## Estructura

- `js/config.js`: reglas globales, ingredientes y procesos de cada estación
- `js/dishes.js`, `js/recipes-data.js`: platos (como datos) y recetas reales
- `js/levels/`: un archivo por nivel (platos, cajas y estaciones)
- `js/stations.js`: distribución de la cocina (perímetro + isla central)
- `js/interact.js`, `js/update.js`, `js/orders.js`, `js/plate.js`: lógica del juego
- `js/helper.js`: el ayudante controlado por IA
- `js/render.js`: dibujo 2D · `js/3d/`: dibujo 3D con Three.js (`street3d.js`: escenario de la calle de los Kevin)
- `js/pause.js`: pausa
- `js/mobile.js`, `css/mobile.css`: vista horizontal forzada y controles táctiles
- `js/dish-icons.js`, `js/3d/labels3d.js`: ilustraciones de platos y etiquetas de las cajas

## Créditos

- Modelos de cocina: [KayKit Restaurant Bits](https://kaylousberg.com) de Kay Lousberg (CC0)
- Motor 3D: [Three.js](https://threejs.org) r147 (MIT)
- Tipografía de títulos: Kitchen Bold (Design Vector10, dafont). `fonts/Kitchen_Bold_tildes.otf` es la misma fuente con tildes y ñ añadidas.
