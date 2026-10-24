# Sabor Perú

Juego de cocina peruana estilo Overcooked que enseña recetas reales. Se juega en el navegador, sin instalar nada: basta con abrir `index.html`.

## Cómo jugar

- **Mover:** WASD o flechas
- **Interactuar:** Espacio o E (mantener presionado en la tabla y el bowl)
- **Ayudante (IA):** B
- **Móvil:** solo en horizontal (en vertical aparece el aviso de girar el teléfono). Joystick virtual en la mitad izquierda (el chef camina en cualquier dirección) y botón ACCIÓN a la derecha

## Niveles

| Mundo | Nivel | Plato |
|---|---|---|
| 1 · Cocina criolla (restaurante menú de mercado limeño) | 1-1 | Papa a la Huancaína |
| | 1-2 | Causa Limeña |
| | 1-3 | Ají de Gallina |
| | 1-4 | Pollo al Ají |
| | 1-5 | Lomo Saltado (wok y freidora) |
| 2 · Chifa | 2-1 | Entradas de chifa: Sopa Wantán y Wantán Frito |
| | 2-2 | Arroz Chaufa |
| | 2-3 | Tallarín Saltado |
| Kevin · Comida de la calle (carretilla cebichera) | K-9 | Cebiche de Pota con o sin ají + Chicha Morada |
| | K-10 | Anticuchos, rachi y pancita (carretilla de noche: tabla → bowl con salsa anticuchera → palitos → parrilla) |

La pantalla de niveles abre las versiones 3D (`nivelX-Y-3d.html`, `kevin-*-3d.html`). Las páginas 2D (`nivelX-Y.html`) usan la misma lógica y sirven para probar mecánicas.

## Mapas procedurales

Cada nivel genera su propia cocina a partir de una semilla (por defecto, el id del nivel), así que un mismo nivel siempre se ve igual y cada nivel es distinto. Formas de isla: isla larga, islas gemelas, bloque central, isla en L, isla en T, penínsulas, carriles y columnas. Las cajas, los fuegos, la bandeja de salida y la basura cambian de sitio; los platos siguen empezando en las mesas de abajo.

- **Ver y elegir mapas:** abre `mapas.html` (en Netlify o con un servidor local). Cambia la semilla o la forma y copia la línea `map: { ... }` dentro del `LEVEL` del nivel en `js/levels/`.
- **Probar sin tocar archivos:** añade `?mapa=7` (semilla), `?forma=gemelas` o `?mapa=clasica` (la cocina de antes) a la URL del nivel.

## Estructura

- `js/config.js`: reglas globales, ingredientes y procesos de cada estación
- `js/dishes.js`, `js/recipes-data.js`: platos (como datos) y recetas reales
- `js/levels/`: un archivo por nivel (platos, cajas y estaciones)
- `js/mapgen.js`: generador procedural de cocinas (formas de isla, zonas, validación de que todo se alcanza)
- `js/stations.js`: convierte el mapa generado en estaciones (los Kevin mantienen su calle hecha a mano)
- `js/interact.js`, `js/update.js`, `js/orders.js`, `js/plate.js`: lógica del juego
- `js/helper.js`: el ayudante controlado por IA
- `js/render.js`: dibujo 2D · `js/3d/`: dibujo 3D con Three.js (`street3d.js`: escenario de la calle de los Kevin)
- `js/pause.js`: pausa
- `js/fullscreen.js`: pantalla completa que se mantiene al cambiar de página (las páginas se abren dentro de un marco)
- `js/mobile.js`, `css/mobile.css`: horizontal obligatorio, joystick virtual y botón de acción
- `js/icons.js`, `js/ing-images.js`: iconos de ingredientes y herramientas (etiquetas de cajas, tickets y pizarra). Las ilustraciones originales están en `assets/ingredientes/`
- `js/howto.js`: pizarra con la receta en dibujo antes de jugar
- `js/tool-images.js`: ilustraciones de las herramientas (originales en `assets/herramientas/`)
- `js/dish-images.js`, `js/dish-icons.js`, `js/3d/labels3d.js`: ilustraciones de los platos terminados (originales en `assets/platos/`) y etiquetas 3D de las cajas

## Créditos

- Modelos de cocina: [KayKit Restaurant Bits](https://kaylousberg.com) de Kay Lousberg (CC0)
- Motor 3D: [Three.js](https://threejs.org) r147 (MIT)
- Tipografía de títulos: Kitchen Bold (Design Vector10, dafont). `fonts/Kitchen_Bold_tildes.otf` es la misma fuente con tildes y ñ añadidas.
- Tipografía de subtítulos e información: Coolvetica (Typodermic Fonts, dafont), en `fonts/Coolvetica_Rg.otf`
