// ================= MOVIMIENTO Y PATHFINDING =================
function collides(px, py) {
  if (px < R || px > W - R || py < R || py > H - R) return true;
  for (const s of st) {
    const cx = Math.max(s.x, Math.min(px, s.x + s.w)), cy = Math.max(s.y, Math.min(py, s.y + s.h));
    if ((px - cx) ** 2 + (py - cy) ** 2 < R * R) return true;
  }
  return false;
}
function tryMove(p, dx, dy) {
  const mx = !collides(p.x + dx, p.y); if (mx) p.x += dx;
  const my = !collides(p.x, p.y + dy); if (my) p.y += dy;
  // Esquinas: si el eje principal choca contra la punta de una mesa y casi no hubo avance, el chef resbala
  // por el borde (como en Overcooked) en vez de quedarse trabado. Importa sobre todo con islas y penínsulas.
  const want = Math.hypot(dx, dy), got = Math.hypot(mx ? dx : 0, my ? dy : 0);
  if (want > 0 && got < want * 0.4) {
    if (!mx && Math.abs(dx) >= Math.abs(dy)) slide(p, dx, 'x');
    else if (!my) slide(p, dy, 'y');
  }
}
function slide(p, d, axis) {
  const n = Math.abs(d);
  for (let k = 1; k <= Math.ceil(n * 1.6); k++) for (const sgn of [1, -1]) {
    const ox = axis === 'x' ? d : sgn * k, oy = axis === 'x' ? sgn * k : d;
    if (!collides(p.x + ox, p.y + oy)) {
      const step = Math.min(k, n);
      if (axis === 'x') { if (!collides(p.x, p.y + sgn * step)) p.y += sgn * step; }
      else if (!collides(p.x + sgn * step, p.y)) p.x += sgn * step;
      return;
    }
  }
}
function distToStation(s, p) {
  const cx = Math.max(s.x, Math.min(p.x, s.x + s.w)), cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
  return Math.hypot(p.x - cx, p.y - cy);
}
function nearestStation(p) {
  let best = null, bd = REACH;
  for (const s of st) { if (s.kind === 'deco') continue; const d = distToStation(s, p); if (d < bd) { bd = d; best = s; } }
  return best;
}

// ---- Pathfinding (cuadrícula + BFS): el ayudante rodea mesas y obstáculos.
// Si en el futuro hay obstáculos o mesas móviles, basta con llamar a rebuildGrid() cuando algo se mueva.
const CELL = 20, GW = W / CELL, GH = H / CELL;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
let blocked = null;
function rebuildGrid() {
  blocked = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) blocked[gy * GW + gx] = collides(gx * CELL + CELL / 2, gy * CELL + CELL / 2) ? 1 : 0;
}
function lineClear(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6);
  for (let i = 1; i <= n; i++) if (collides(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
  return true;
}
function nextWaypoint(p, tx, ty) {
  if (lineClear(p.x, p.y, tx, ty)) return { x: tx, y: ty };
  if (!blocked) rebuildGrid();
  const cl = (v, m) => Math.min(m - 1, Math.max(0, v));
  const tgx = cl(Math.floor(tx / CELL), GW), tgy = cl(Math.floor(ty / CELL), GH);
  const dist = new Int16Array(GW * GH).fill(-1);
  const q = [tgy * GW + tgx]; dist[q[0]] = 0;
  for (let i = 0; i < q.length; i++) {
    const c = q[i], cx = c % GW, cy = (c / GW) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const ni = ny * GW + nx;
      if (dist[ni] >= 0 || blocked[ni]) continue;
      if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
      dist[ni] = dist[c] + 1; q.push(ni);
    }
  }
  let cx = cl(Math.floor(p.x / CELL), GW), cy = cl(Math.floor(p.y / CELL), GH);
  let wp = null;
  for (let step = 0; step < 18; step++) {
    let best = null, bd = dist[cy * GW + cx] < 0 ? 1e9 : dist[cy * GW + cx];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const d = dist[ny * GW + nx];
      if (d < 0 || d >= bd) continue;
      if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
      bd = d; best = [nx, ny];
    }
    if (!best) break;
    cx = best[0]; cy = best[1];
    const c = { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 };
    if (!wp || lineClear(p.x, p.y, c.x, c.y)) wp = c; else break;
  }
  return wp || { x: tx, y: ty };
}
