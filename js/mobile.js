// ================= MÓVIL: horizontal obligatorio, joystick y botón de acción =================
// En pantallas táctiles:
//  - Desde la portada ("Sabor Perú") se juega en horizontal: al tocar "Jugar"/"¡Empezar!" se pide pantalla completa
//    y se bloquea la orientación (Android). Si el teléfono está en vertical aparece un aviso que tapa todo
//    ("Gira tu teléfono") y la partida se pausa: no se puede avanzar hasta girarlo.
//  - Joystick virtual omnidireccional (mitad izquierda de la pantalla): el círculo aparece donde se apoya el pulgar
//    y el chef camina en cualquier dirección, más rápido cuanto más se empuja. Escribe en `stick` (js/state.js).
//  - En los niveles la cocina se escala para llenar la pantalla. Estilos en css/mobile.css.
(function () {
  const touch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!touch) return;
  const body = document.body, wrap = document.getElementById('gameWrap');
  body.classList.add('mobile');
  if (wrap) body.classList.add('inGame');

  // ---- aviso de girar el teléfono ----
  const block = document.createElement('div');
  block.id = 'rotateBlock';
  block.innerHTML = '<div class="phone"></div><h2>Gira tu teléfono</h2><p>Sabor Perú se juega en horizontal</p>';
  body.appendChild(block);

  function fit() {
    const portrait = window.innerHeight > window.innerWidth;
    body.classList.toggle('portrait', portrait);
    if (portrait && typeof setPaused === 'function' && typeof started !== 'undefined' && started && !gameOver && !paused) setPaused(true);
    if (!wrap) return;
    const natW = 900, natH = wrap.offsetHeight || 566;          // el HUD y los tickets van encima: solo cuenta la cocina
    wrap.style.setProperty('--s', Math.min(window.innerWidth / natW, window.innerHeight / natH));
    body.classList.toggle('menuOpen', !!document.querySelector('.overlay.show'));
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
  if (wrap) new MutationObserver(fit).observe(wrap, { subtree: true, attributes: true, attributeFilter: ['class'] });
  fit();

  // ---- pantalla completa + horizontal (solo en navegadores que lo permiten; iPhone no deja bloquear) ----
  function landscape() {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return lock();
    Promise.resolve(req.call(el)).then(lock).catch(() => {}).then(() => setTimeout(fit, 300));
  }
  function lock() {
    try { if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  }
  // cualquier botón de juego (Jugar, niveles, Empezar) lo intenta; al cambiar de página el navegador sale de pantalla
  // completa, así que se vuelve a pedir en cada página
  document.addEventListener('click', e => { if (e.target.closest('.gamebtn, .levelCard, a[href*="nivel"], a[href*="kevin"]')) landscape(); }, true);
  // en vertical el aviso tapa la página: ningún toque pasa por debajo
  block.addEventListener('touchstart', e => e.preventDefault(), { passive: false });

  if (!wrap) return;          // portada y pantalla de niveles: solo orientación

  // sin teclado: fuera los atajos "(B)", "(P)" de los botones
  document.querySelectorAll('#hud button').forEach(b => { b.textContent = b.textContent.replace(/\s*\([A-Z]\)\s*$/, ''); });

  // ---- joystick virtual ----
  const zone = document.getElementById('joyZone'), base = document.getElementById('joyBase'), knob = document.getElementById('joyKnob');
  const R = 56;              // recorrido máximo del pulgar (px de pantalla)
  let id = null, cx = 0, cy = 0;
  function place(x, y) { base.style.left = x + 'px'; base.style.top = y + 'px'; }
  function move(x, y) {
    let dx = x - cx, dy = y - cy; const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    stick.x = dx / R; stick.y = dy / R;
  }
  function release() {
    id = null; stick.active = false; stick.x = stick.y = 0;
    knob.style.transform = ''; base.classList.remove('on'); base.style.left = base.style.top = '';
  }
  if (zone) {
    zone.addEventListener('touchstart', e => {
      e.preventDefault();
      if (id !== null) return;
      const t = e.changedTouches[0]; id = t.identifier; cx = t.clientX; cy = t.clientY;
      place(cx, cy); base.classList.add('on'); stick.active = true; move(cx, cy);
    }, { passive: false });
    const find = e => { for (const t of e.changedTouches) if (t.identifier === id) return t; return null; };
    zone.addEventListener('touchmove', e => { e.preventDefault(); const t = find(e); if (t) move(t.clientX, t.clientY); }, { passive: false });
    const end = e => { if (find(e)) release(); };
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
  }

  // botón de acción: marca visual al pulsar
  const act = document.getElementById('actBtn');
  if (act) {
    const on = () => act.classList.add('pressed'), off = () => act.classList.remove('pressed');
    act.addEventListener('touchstart', on); act.addEventListener('touchend', off); act.addEventListener('touchcancel', off);
  }
  // sin desplazamiento ni zoom accidental (salvo dentro de las pantallas de inicio/fin, que pueden tener scroll)
  document.addEventListener('touchmove', e => { if (!e.target.closest('.overlay')) e.preventDefault(); }, { passive: false });
})();
