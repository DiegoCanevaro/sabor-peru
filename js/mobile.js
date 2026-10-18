// ================= MÓVIL: vista horizontal forzada y controles táctiles =================
// En pantallas táctiles:
//  - Al tocar "¡Empezar!" se pide pantalla completa y se bloquea la orientación en horizontal (Android).
//  - Si aun así el teléfono queda en vertical (p. ej. iPhone, que no permite bloquear), la página se gira 90° por CSS.
//  - La cocina se escala para llenar la pantalla. Los estilos están en css/mobile.css.
(function () {
  const touch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!touch) return;
  const body = document.body, wrap = document.getElementById('gameWrap');
  body.classList.add('mobile');

  function fit() {
    const portrait = window.innerHeight > window.innerWidth;
    body.classList.toggle('portrait', portrait);
    const vw = portrait ? window.innerHeight : window.innerWidth, vh = portrait ? window.innerWidth : window.innerHeight;
    body.style.setProperty('--vw', vw + 'px');
    body.style.setProperty('--vh', vh + 'px');
    const natW = 900, natH = wrap.offsetHeight || 566;          // el HUD y los tickets van encima: solo cuenta la cocina
    wrap.style.setProperty('--s', Math.min(vw / natW, vh / natH));
    body.classList.toggle('menuOpen', !!document.querySelector('.overlay.show'));
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
  // las pantallas de inicio/fin aparecen y desaparecen: se vuelve a calcular
  new MutationObserver(fit).observe(wrap, { subtree: true, attributes: true, attributeFilter: ['class'] });
  fit();

  // pantalla completa + horizontal al empezar (solo funciona en navegadores que lo permiten)
  const start = document.getElementById('startBtn');
  if (start) start.addEventListener('click', () => {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    Promise.resolve(req.call(el))
      .then(() => screen.orientation && screen.orientation.lock ? screen.orientation.lock('landscape') : null)
      .catch(() => {})
      .then(() => setTimeout(fit, 300));
  });

  // botones: marca visual al pulsar
  document.querySelectorAll('#dpad button, #actBtn').forEach(b => {
    const on = () => b.classList.add('pressed'), off = () => b.classList.remove('pressed');
    b.addEventListener('touchstart', on); b.addEventListener('touchend', off); b.addEventListener('touchcancel', off);
  });
  // sin desplazamiento ni zoom accidental (salvo dentro de las pantallas de inicio/fin, que pueden tener scroll)
  document.addEventListener('touchmove', e => { if (!e.target.closest('.overlay')) e.preventDefault(); }, { passive: false });
})();
