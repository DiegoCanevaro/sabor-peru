// ================= ENTRADA (teclado y táctil) =================
// Espacio/E: un toque interactúa; mantenerlo trabaja la tabla, el bowl y la licuadora.
const KEYMAP = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
const isAct = k => k === ' ' || k === 'e' || k === 'E';
window.addEventListener('keydown', e => {
  if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; e.preventDefault(); }
  else if (isAct(e.key) && started && !gameOver && !paused) { keys.act = true; if (!e.repeat) manualInteract(); e.preventDefault(); }
  else if ((e.key === 'b' || e.key === 'B') && started) setBot(!bot);
});
window.addEventListener('keyup', e => { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; if (isAct(e.key)) keys.act = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('#dpad button').forEach(b => {
  const k = b.dataset.k;
  const on = e => { keys[k] = true; e.preventDefault(); }, off = e => { keys[k] = false; e.preventDefault(); };
  b.addEventListener('touchstart', on); b.addEventListener('touchend', off); b.addEventListener('touchcancel', off);
  b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); b.addEventListener('mouseleave', off);
});
const actBtn = document.getElementById('actBtn');
const actOn = e => { if (started && !gameOver && !paused) { keys.act = true; manualInteract(); } e.preventDefault(); };
const actOff = e => { keys.act = false; e.preventDefault(); };
actBtn.addEventListener('touchstart', actOn); actBtn.addEventListener('touchend', actOff); actBtn.addEventListener('touchcancel', actOff);
actBtn.addEventListener('mousedown', actOn); actBtn.addEventListener('mouseup', actOff); actBtn.addEventListener('mouseleave', actOff);
document.getElementById('botBtn').addEventListener('click', () => { if (started) setBot(!bot); });
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('startOverlay').classList.remove('show');
  startRound();
});
document.getElementById('recipeBtn').addEventListener('click', () => {
  const card = document.getElementById('recipeCard'), open = card.style.display === 'none';
  card.style.display = open ? 'block' : 'none';
  document.getElementById('recipeBtn').textContent = open ? '📖 Ocultar receta' : '📖 Ver receta real';
});
document.getElementById('restartBtn').addEventListener('click', () => location.reload());
