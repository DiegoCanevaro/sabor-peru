// ================= ESTADO COMPARTIDO =================
const player = { x: 450, y: 300, held: null };
let started = false, gameOver = false, score = 0, served = 0;
let toast = { t: 0, msg: '' };
let bot = false, helper = null;   // helper = segundo jugador controlado por la IA
const keys = {};                  // up/down/left/right + act (acción mantenida)
function showToast(msg) { toast = { t: 1.4, msg }; }
