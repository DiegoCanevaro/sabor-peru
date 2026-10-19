// ================= ETIQUETAS DE LAS CAJAS (3D) =================
// La etiqueta redonda (crema con borde de madera) con la ilustración del ingrediente. Los dibujos están en js/icons.js.
function labelTexture(type) {
  const t = new THREE.CanvasTexture(labelCanvas(type, 256)); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return t;
}
