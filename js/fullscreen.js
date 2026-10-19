// ================= PANTALLA COMPLETA QUE SE MANTIENE ENTRE PÁGINAS =================
// El navegador sale de pantalla completa cada vez que se cambia de página. Para que no pase, la página donde se activa
// se queda como "marco": se pone a pantalla completa y las siguientes páginas (niveles, juego) se abren dentro de un
// iframe que la ocupa entera. Navegar dentro del iframe no saca de pantalla completa.
//   saborFS.toggle()  botón de la portada · saborFS.request() pide pantalla completa (móvil, al tocar Jugar o ¡Empezar!)
// Las páginas que ya están dentro del marco le piden las cosas al marco con postMessage.
(function () {
  const inShell = window.parent !== window;
  const root = document.documentElement;
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  const supported = !!req || inShell;
  const isFsHere = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  let fsOn = isFsHere(), frame = null;
  const toParent = msg => { try { parent.postMessage(Object.assign({ sabor: 1 }, msg), '*'); } catch (e) {} };
  function lock() { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }
  function goFs() {
    if (inShell) { toParent({ fs: 'on' }); return; }
    if (!req || isFsHere()) { lock(); return; }
    Promise.resolve(req.call(root)).then(lock).catch(() => {});
  }
  function exitFs() {
    if (inShell) { toParent({ fs: 'off' }); return; }
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (isFsHere() && ex) ex.call(document);
  }
  // botones de pantalla completa de la página (class="fsBtn")
  function paint() {
    document.querySelectorAll('.fsBtn').forEach(b => {
      if (!supported) { b.remove(); return; }
      b.textContent = fsOn ? '✕ Salir de pantalla completa' : '⛶ Pantalla completa';
    });
  }
  // abre la página dentro del marco (y lo crea la primera vez)
  function openInShell(url) {
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'shellFrame'; frame.setAttribute('allow', 'fullscreen'); frame.setAttribute('allowfullscreen', '');
      document.body.appendChild(frame); document.body.classList.add('shell');
      frame.addEventListener('load', () => { tellFrame(); frame.focus(); });
      if (typeof setPaused === 'function') try { setPaused(true); } catch (e) {}
    }
    frame.src = url;
  }
  function tellFrame() { if (frame && frame.contentWindow) frame.contentWindow.postMessage({ sabor: 1, state: fsOn }, '*'); }

  window.saborFS = { request: goFs, toggle: () => (fsOn ? exitFs() : goFs()), get on() { return fsOn; } };

  window.addEventListener('message', e => {
    const d = e.data; if (!d || !d.sabor) return;
    if (!inShell) {                       // el marco recibe pedidos de la página de dentro
      if (d.fs === 'on') goFs();
      if (d.fs === 'off') exitFs();
      if (d.title) document.title = d.title;
    } else if ('state' in d) { fsOn = d.state; paint(); }      // la página de dentro se entera del estado
  });
  const changed = () => { if (!inShell) { fsOn = isFsHere(); paint(); tellFrame(); } };
  document.addEventListener('fullscreenchange', changed); document.addEventListener('webkitfullscreenchange', changed);
  if (inShell) toParent({ title: document.title });

  // Enlaces entre páginas del juego: si estamos en pantalla completa (o en el móvil, que siempre la pide),
  // en vez de salir de la página se abren dentro del marco.
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    const mobile = document.body.classList.contains('mobile');
    if (!a) { if (mobile && e.target.closest && e.target.closest('.gamebtn')) goFs(); return; }
    const href = a.getAttribute('href');
    if (!/\.html(\?|#|$)/.test(href) || a.target) return;
    if (inShell) { if (mobile) goFs(); return; }           // dentro del marco se navega normal y no se sale
    if (!fsOn && !mobile) return;                          // en el PC sin pantalla completa: navegación normal
    e.preventDefault();
    goFs(); openInShell(a.href);
  }, true);

  document.addEventListener('DOMContentLoaded', paint); paint();
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.fsBtn'); if (b) window.saborFS.toggle(); });
})();
