// ================= ACTUALIZACIÓN (un paso de simulación) =================
// Estaciones que alguien está trabajando ahora mismo (manteniendo la acción)
function workedStations() {
  const set = new Set();
  if (keys.act) { const n = nearestStation(player); if (n && HOLD_KINDS.includes(n.kind)) set.add(n); }
  if (helper && helper.work) set.add(helper.work);
  return set;
}

function update(dt) {
  if (!started || gameOver || paused) return;
  clock += dt;
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0), force = 1;
  if (stick.active && Math.hypot(stick.x, stick.y) > 0.18) {       // joystick: cualquier dirección y velocidad según cuánto se empuja
    dx = stick.x; dy = stick.y; force = Math.min(1, Math.hypot(dx, dy) * 1.25);
  }
  if (dx || dy) { const l = Math.hypot(dx, dy); tryMove(player, dx / l * SPEED * force * dt, dy / l * SPEED * force * dt); }
  trackPlayerHeld(dt);
  if (helper) botStep(dt);

  // estaciones con progreso
  const worked = workedStations();
  for (const s of st) {
    s.worked = worked.has(s);
    switch (s.kind) {
      // automáticas: avanzan solas al colocar los ingredientes
      case 'pot': s.slots.forEach(sl => { if (!sl.done) { sl.t += dt; if (sl.t >= T.cook) sl.done = true; } }); break;
      case 'pan': if (s.state === 'cooking') { s.t += dt; if (s.t >= T.pan) s.state = 'done'; } break;
      case 'stew': if (s.state === 'cooking') { s.t += dt; if (s.t >= T.stew) s.state = 'done'; } break;
      case 'wok': if (s.state === 'cooking') { s.t += dt; if (s.t >= T.wok) s.state = 'done'; } break;
      case 'fryer': if (s.state === 'frying') { s.t += dt; if (s.t >= T.fry) s.state = 'done'; } break;
      // mantener presionado: solo avanzan mientras alguien las trabaja
      case 'board': if (s.state === 'chopping' && s.worked) { s.t += dt; if (s.t >= T.board) s.state = 'done'; } break;
      case 'balde': if (s.state === 'filling') { s.t += dt; if (s.t >= T.balde) s.state = 'done'; } break;
      case 'bowl':
        if (s.state === 'idle' && s.worked) { const m = bowlMatch(s.items); if (m) { s.state = 'mashing'; s.t = 0; s.out = m.out; s.portions = m.n; } }
        if (s.state === 'mashing' && s.worked) { s.t += dt; if (s.t >= T.bowl) { s.state = 'done'; s.n = s.portions || 1; } } break;
      // automática: arranca sola cuando el contenido es una receta (el contenido decide qué sale)
      case 'blender': {
        if (s.state === 'idle') {
          const m = blendMatch(s.items);
          if (m) {
            s.wait = (s.wait || 0) + dt;
            if (!blendCanGrow(s.items) || s.wait >= BLEND_WAIT) { s.state = 'blending'; s.t = 0; s.out = m.out; s.wait = 0; }
          } else s.wait = 0;
        }
        if (s.state === 'blending') { s.t += dt; if (s.t >= T.blend) s.state = 'done'; }
        break;
      }
    }
  }

  returnPlates();
  // llegada de pedidos (escalonada; si no hay nadie esperando, el siguiente llega enseguida)
  const nq = nextQueued();
  if (nq && (clock >= nq.arriveAt || (!waitingList().length && clock - lastResolve >= 2))) {
    nq.state = 'waiting'; nq.patience = nq.max = nq.dish.patience;
  }
  // paciencia
  for (const c of waitingList()) {
    c.patience -= dt;
    if (c.patience <= 0) {
      c.state = 'angry'; c.doneAt = clock; lastResolve = clock; score = Math.max(0, score - 30);
      showToast('Un cliente se fue enojado (-30)');
    }
  }
  // fin de partida: todos atendidos o perdidos
  if (customers.every(c => c.state === 'happy' || c.state === 'angry')) {
    if (endTimer < 0) endTimer = 2;
    endTimer -= dt;
    if (endTimer <= 0) { endGame(); return; }
  }
  if (toast.t > 0) toast.t -= dt;
  updateTickets();
  document.getElementById('scoreDisplay').textContent = '⭐ ' + score;
  document.getElementById('customerDisplay').textContent = 'Atendidos ' + served + ' / ' + TOTAL_CUSTOMERS + ' · En espera: ' + waitingList().length;
}
