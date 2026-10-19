// ================= ESTADO COMPARTIDO =================
const player = { x: 450, y: 300, held: null };
let started = false, gameOver = false, paused = false, score = 0, served = 0;
let toast = { t: 0, msg: '' };
let bot = false, helper = null;   // helper = segundo jugador controlado por la IA
const keys = {};                  // up/down/left/right + act (acción mantenida)
function showToast(msg) { toast = { t: 1.4, msg }; }
// Móvil / táctil: se detecta al inicio para no mostrar atajos de teclado (solo controles táctiles)
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (IS_TOUCH) document.body.classList.add('mobile');
const keyHint = k => IS_TOUCH ? '' : ' (' + k + ')';
// joystick virtual (js/mobile.js): dirección y fuerza entre -1 y 1; active = el dedo está sobre el joystick
const stick = { x: 0, y: 0, active: false };
