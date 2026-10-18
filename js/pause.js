// ================= PAUSA =================
// Botón ⏸ en el HUD, tecla P o Esc. Mientras está en pausa no corre el tiempo de los pedidos ni de las estaciones.
// También se pausa solo si cambias de pestaña o de aplicación (útil en el móvil).
(function () {
  const hud = document.getElementById('hud'), wrap = document.getElementById('gameWrap');
  const btn = document.createElement('button');
  btn.id = 'pauseBtn'; btn.className = 'small'; btn.textContent = '⏸ Pausa (P)';
  hud.insertBefore(btn, document.getElementById('botBtn'));

  const ov = document.createElement('div');
  ov.id = 'pauseOverlay'; ov.className = 'overlay';
  ov.innerHTML = '<h1>Pausa</h1><p>El tiempo de los pedidos está detenido.</p>' +
    '<div class="btnRow"><a class="gamebtn alt" href="niveles.html">Elegir nivel</a>' +
    '<button id="pauseRestart" class="gamebtn alt">Reiniciar</button>' +
    '<button id="pauseResume" class="gamebtn">▶ Continuar</button></div>';
  wrap.appendChild(ov);

  function setPaused(v) {
    if (!started || gameOver) v = false;
    paused = v;
    for (const k in keys) keys[k] = false;          // que nadie quede caminando o picando al volver
    ov.classList.toggle('show', paused);
    btn.textContent = paused ? '▶ Seguir (P)' : '⏸ Pausa (P)';
  }
  window.setPaused = setPaused;
  btn.addEventListener('click', () => setPaused(!paused));
  document.getElementById('pauseResume').addEventListener('click', () => setPaused(false));
  document.getElementById('pauseRestart').addEventListener('click', () => location.reload());
  window.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { setPaused(!paused); e.preventDefault(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
})();
