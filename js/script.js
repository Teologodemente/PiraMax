'use strict';

/* =========================================================
   PIRAMAX — Pirámide Numérica
   Cada bloque es la suma (o el producto) de los dos bloques
   que lo sostienen. El jugador debe descubrir las casillas «?».
   ========================================================= */

const $ = (id) => document.getElementById(id);

const pyramidEl = $('pyramid');
const levelEl = $('level');
const scoreEl = $('score');
const bestEl = $('best');
const hintsEl = $('hints');
const opBadge = $('opBadge');
const ruleEl = $('rule');
const msgEl = $('msg');
const helperEl = $('helper');
const checkBtn = $('checkBtn');
const hintBtn = $('hintBtn');
const newBtn = $('newBtn');
const soundBtn = $('soundBtn');
const fx = $('fx');
const fctx = fx.getContext('2d');

const state = {
  level: 1,
  score: 0,
  recent: [], // pirámides ya jugadas (anti-repeticiones)
  best: Number(localStorage.getItem('piramax_best') || 0),
  op: 'sum',        // siempre 'sum' (pura suma)
  base: [],         // fila inferior (siempre visible)
  rows: [],         // rows[0] = punta, rows[last] = base
  hidden: new Map(),// "r:c" -> true
  hints: 2,
  finished: false,
};

let soundOn = true;

/* ---------------- Utilidades ---------------- */

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------- Sonido (Web Audio) ---------------- */

let audioCtx = null;

function beep(freq, dur = 0.12, type = 'sine', vol = 0.12) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* sin audio, no pasa nada */ }
}

function fanfare() {
  [523, 659, 784, 1046].forEach((f, i) =>
    setTimeout(() => beep(f, 0.2, 'triangle', 0.15), i * 140)
  );
}

function buzz() { beep(150, 0.28, 'sawtooth', 0.1); }

/* ---------------- Lógica del juego ---------------- */

function applyOp(a, b) {
  return a + b; // pura suma
}

// Dificultad progresiva SOLO con suma:
// - La base crece de 3 a 7 casillas (más filas, más cuadros).
// - Los números de la base crecen (las sumas por cuadro se hacen cada vez mayores).
function genBase() {
  const len = Math.min(3 + Math.floor((state.level - 1) / 2), 7);
  const max = Math.min(4 + state.level, 18);
  return Array.from({ length: len }, () => rand(1, max));
}

// Verificación exhaustiva: CADA bloque de arriba debe coincidir EXACTAMENTE
// con la operación de los dos bloques que lo sostienen.
function validatePyramid(rows) {
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] !== applyOp(rows[r + 1][c], rows[r + 1][c + 1])) {
        console.error(`PIRAMAX: celda (${r},${c})=${rows[r][c]} != ${rows[r + 1][c]} op ${rows[r + 1][c + 1]}`);
        return false;
      }
    }
  }
  return true;
}

function buildPyramid() {
  for (let tries = 0; tries < 50; tries++) {
    const rows = [state.base.slice()];
    while (rows[0].length > 1) {
      const prev = rows[0];
      rows.unshift(prev.slice(1).map((v, i) => applyOp(prev[i], v)));
    }
    if (validatePyramid(rows)) return rows; // rows[0] = punta, rows[last] = base
    state.base = genBase(); // defensivo: regenera si hubiera cualquier discrepancia
  }
}

function updateHUD() {
  levelEl.textContent = state.level;
  scoreEl.textContent = state.score;
  bestEl.textContent = state.best;
  hintsEl.textContent = state.hints;
  hintBtn.disabled = state.finished || state.hints <= 0;
}

function newRound() {
  state.finished = false;
  state.op = 'sum'; // siempre pura suma

  // Anti-repeticiones: no repetir ninguna pirámide ya jugada.
  for (let tries = 0; tries < 60; tries++) {
    state.base = genBase();
    if (!state.recent.includes(JSON.stringify(state.base))) break;
  }
  state.recent.push(JSON.stringify(state.base));
  if (state.recent.length > 12) state.recent.shift();
  state.rows = buildPyramid();

  // Garantía de perfección: la pirámide se valida celda por celda antes de jugarse.
  if (!validatePyramid(state.rows)) {
    console.error('PIRAMAX: pirámide inválida, regenerando');
    state.rows = buildPyramid();
  }

  // Elegir casillas ocultas: todas las filas menos la base. La punta siempre se oculta.
  const candidates = [];
  for (let r = 0; r < state.rows.length - 1; r++) {
    for (let c = 0; c < state.rows[r].length; c++) candidates.push([r, c]);
  }
  shuffle(candidates);
  const apexIdx = candidates.findIndex((p) => p[0] === 0);
  if (apexIdx > 0) [candidates[0], candidates[apexIdx]] = [candidates[apexIdx], candidates[0]];

  // Dificultad progresiva: a más niveles, mayor proporción de casillas ocultas (hasta el 100%).
  const frac = Math.min(1, 0.5 + state.level * 0.05);
  const hiddenCount = Math.min(candidates.length, Math.max(2, Math.round(candidates.length * frac)));
  state.hidden = new Map(candidates.slice(0, hiddenCount).map(([r, c]) => [`${r}:${c}`, true]));

  state.hints = 2;
  msgEl.textContent = '';
  msgEl.className = 'msg';

  opBadge.textContent = 'MODO SUMA ＋';
  ruleEl.innerHTML =
    'Cada bloque es la <b>SUMA</b> de los dos bloques que lo sostienen (ej. <b>2 + 3 = 5</b>). ¡Descubre las casillas «?»!';

  helperEl.textContent = '';
  updateHUD();
  render();
  beep(440, 0.08, 'triangle', 0.08);
}

// Tamaño automático: a MENOS cuadros → celdas más GRANDES (cómodas para adultos);
// a más cuadros → la pirámide completa la pantalla y las celdas se reducen solos.
// Considera el ancho Y la altura disponibles para que todo quepa sin scroll.
function fitCells() {
  const maxCols = state.rows.length ? state.rows[state.rows.length - 1].length : 4;
  const numRows = state.rows.length || 4;

  const gap = window.innerWidth < 480 ? 6 : 10;
  const vw = Math.min(window.innerWidth, 760);
  const availH = Math.max(260, window.innerHeight - 230); // menos header/HUD/mensajes/botones

  const byWidth = (vw - 24 - (maxCols - 1) * gap) / maxCols;
  const byHeight = (availH - (numRows - 1) * gap) / numRows;

  // Celdas cómodas: nunca menos de 48px, nunca más de 128px (no gigantes absurdas).
  const cell = Math.max(48, Math.min(Math.min(byWidth, byHeight), 128));

  document.documentElement.style.setProperty('--cell', Math.floor(cell) + 'px');
  document.documentElement.style.setProperty('--gap', gap + 'px');
}
window.addEventListener('resize', fitCells);

function render() {
  pyramidEl.innerHTML = '';
  fitCells();
  state.rows.forEach((row, r) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    row.forEach((val, c) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (r === state.rows.length - 1) cell.classList.add('base');
      if (r === 0) cell.classList.add('apex');
      cell.style.animationDelay = `${r * 0.05}s`;

      const key = `${r}:${c}`;
      if (state.hidden.has(key)) {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.inputMode = 'numeric';
        inp.autocomplete = 'off';
        inp.autocapitalize = 'none';
        inp.maxLength = 6;
        inp.placeholder = '?';
        inp.dataset.key = key;
        inp.setAttribute('aria-label', `Casilla oculta fila ${r + 1}`);
        inp.addEventListener('input', () => {
          inp.value = inp.value.replace(/[^0-9]/g, '');
          autoFitInput(inp);
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') check();
        });
        inp.addEventListener('focus', () => linkPair(r, c, true));
        inp.addEventListener('blur', () => linkPair(r, c, false));
        cell.appendChild(inp);
      } else {
        cell.textContent = val;
        cell.addEventListener('click', () => {
          // En móvil, tocar una casilla visible resalta su par inferior.
          linkPair(r, c, true);
          setTimeout(() => linkPair(r, c, false), 1200);
        });
        if (r < state.rows.length - 1) {
          const L = state.rows[r + 1][c];
          const R = state.rows[r + 1][c + 1];
          cell.title = `${L} + ${R} = ${val}`;
        }
      }
      rowEl.appendChild(cell);
    });
    pyramidEl.appendChild(rowEl);
  });

  // Auto-focus en la primera casilla «?» (móvil: sube el teclado directo).
  const first = pyramidEl.querySelector('.cell input:not(:disabled)');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
}

// Ajusta el tamaño de FUENTE del número escrito al tamaño de la celda,
// reduciéndolo automáticamente si el número tiene muchos dígitos.
function autoFitInput(inp) {
  const cell = inp.closest('.cell');
  if (!cell) return;
  const w = cell.clientWidth;
  let px = w * 0.34; // mismo tamaño que los números de la pirámide
  const len = inp.value.length || 1;
  while (len > 1 && px > 12 && px * len * 0.62 > w * 0.92) px *= 0.9;
  inp.style.fontSize = px.toFixed(1) + 'px';
}

// Resalta las dos casillas inferiores que se combinan para formar la celda «?»
// y muestra la operación exacta a resolver.
function linkPair(r, c, on) {
  if (r >= state.rows.length - 1) return;
  const rowEl = pyramidEl.children[r + 1];
  if (!rowEl) return;
  [c, c + 1].forEach((k) => {
    if (rowEl.children[k]) rowEl.children[k].classList.toggle('link', on);
  });
  if (on) {
    const L = state.rows[r + 1][c];
    const R = state.rows[r + 1][c + 1];
    helperEl.textContent = `${L} ＋ ${R} = ?`;
  } else {
    helperEl.textContent = '';
  }
}

function markErr(input) {
  const cell = input.closest('.cell');
  cell.classList.remove('err');
  void cell.offsetWidth; // reinicia la animación
  cell.classList.add('err');
}

function check() {
  if (state.finished) return;

  let wrong = 0;
  document.querySelectorAll('.cell input').forEach((inp) => {
    if (inp.disabled) return;
    const [r, c] = inp.dataset.key.split(':').map(Number);
    const actual = state.rows[r][c];

    if (inp.value === '') {
      markErr(inp);
      wrong++;
      return;
    }
    if (Number(inp.value) === actual) {
      inp.disabled = true;
      inp.closest('.cell').classList.add('ok');
      beep(660, 0.1, 'sine');
    } else {
      markErr(inp);
      wrong++;
    }
  });

  if (wrong === 0) {
    win();
    return;
  }
  buzz();
  msgEl.textContent = `❌ Fallaste ${wrong} casilla${wrong > 1 ? 's' : ''}. ¡Inténtalo de nuevo!`;
  msgEl.className = 'msg bad';
}

function win() {
  state.finished = true;
  const bonus = 10 * state.hidden.size + 25 + state.hints * 5;
  state.score += bonus;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem('piramax_best', String(state.best));
  }
  updateHUD();
  msgEl.textContent = `🏆 ¡Pirámide completa! +${bonus} puntos`;
  msgEl.className = 'msg good';
  fanfare();
  confetti();
  setTimeout(() => {
    state.level += 1;
    newRound();
  }, 2000);
}

function hint() {
  if (state.finished || state.hints <= 0) return;
  const pending = [...document.querySelectorAll('.cell input')].filter((i) => !i.disabled);
  if (pending.length === 0) return;

  const inp = pending[rand(0, pending.length - 1)];
  const [r, c] = inp.dataset.key.split(':').map(Number);
  inp.value = String(state.rows[r][c]);
  inp.disabled = true;
  inp.closest('.cell').classList.add('ok');
  state.hints -= 1;
  updateHUD();
  beep(880, 0.1, 'triangle');
}

/* ---------------- Confeti ---------------- */

let particles = [];
let rafId = null;

function resizeFx() {
  fx.width = window.innerWidth;
  fx.height = window.innerHeight;
}
window.addEventListener('resize', resizeFx);
resizeFx();

function confetti() {
  const colors = ['#ffc94d', '#ff5ca8', '#7c5cff', '#3ddc84', '#5cc8ff'];
  particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * fx.width,
    y: -20 - Math.random() * 120,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    s: 4 + Math.random() * 6,
    c: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.25,
  }));
  cancelAnimationFrame(rafId);
  const tick = () => {
    fctx.clearRect(0, 0, fx.width, fx.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y < fx.height + 20) alive = true;
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(p.rot);
      fctx.fillStyle = p.c;
      fctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      fctx.restore();
    }
    if (alive) {
      rafId = requestAnimationFrame(tick);
    } else {
      fctx.clearRect(0, 0, fx.width, fx.height);
    }
  };
  tick();
}

/* ---------------- Eventos ---------------- */

checkBtn.addEventListener('click', check);
hintBtn.addEventListener('click', hint);
newBtn.addEventListener('click', newRound);
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
});

/* ---------------- Inicio ---------------- */
newRound();
