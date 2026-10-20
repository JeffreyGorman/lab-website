// ──────────────────────────────────────────────────────────────
//  DNA BACKGROUND — random A / T / C / G letters in Departure Mono,
//  drawn on a canvas behind content (replaces the old dotted pattern).
//
//  Where it appears (any element with one of these):
//    class="dot-lattice"        one canvas filling that section
//    data-dna-bg                same, for any other element
//    data-dna-group="name"      several elements sharing ONE letter field —
//                               e.g. the two Research columns: letters line up
//                               across the join, so it looks like one background
//    data-dna-fixed             canvas fixed to the window (used on the long
//                               Publications page, so it never gets huge)
//
//  • Every 27–51 s (motion on only) the word GATTACA lights up in a random
//    spot for a few seconds, then fades back into the noise. See WORD_* above.
//  • Letters are chosen at random on each page load, then stay put.
//  • Colour comes from --dna-bg-color in css/styles.css (raise the
//    alpha there for stronger letters, lower it for subtler ones).
//  • Spacing and size: edit CELL_W / CELL_H / FONT_PX below.
// ──────────────────────────────────────────────────────────────

import { getStoredMotionPreference } from './motion-state.js';
import { CONFIG } from './config.js';
const BASE_COLORS = CONFIG.DNA_BASE_COLORS;

const LETTERS = 'ATCG';
const WORD = 'GATTACA';          // occasionally spelled out, brighter, then fades away
const WORD_PEAK = 0.42;         // brightness of the spelled word (normal letters are ~0.06)
const WORD_EVERY = [27000, 51000]; // ms between appearances (min, max)
const CELL_W = 26;     // px between letters, horizontally
const CELL_H = 30;     // px between letters, vertically
const FONT_PX = 14;    // letter size
const FONT = `${FONT_PX}px 'Departure Mono', ui-monospace, Menlo, monospace`;

// Deterministic per-cell hash → [0,1). Keeping letters a function of
// (row, col, seed) means a resize (e.g. a phone's address bar hiding)
// redraws the same letters instead of reshuffling them — and that two
// canvases in one group agree on every letter.
function rand01(r, c, seed) {
  let h = (r * 374761393 + c * 668265263 + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

const groupSeeds = new Map();
function seedFor(host, index) {
  const key = host.dataset.dnaGroup || `solo-${index}`;
  if (!groupSeeds.has(key)) groupSeeds.set(key, Math.floor(Math.random() * 2 ** 31));
  return groupSeeds.get(key);
}

const instances = [];
let busy = false;

function motionAllowed() {
  return getStoredMotionPreference() && !document.body.classList.contains('motion-off') && !document.hidden;
}

function scheduleWord(first) {
  const [a, b] = WORD_EVERY;
  setTimeout(() => {
    if (!busy && motionAllowed()) {
      const order = instances.slice().sort(() => Math.random() - 0.5);
      for (const inst of order) {
        const spot = inst.pickSpot();
        if (spot) { busy = true; inst.play(spot, () => { busy = false; }); break; }
      }
    }
    scheduleWord(false);
  }, first ? 5000 + Math.random() * 4000 : a + Math.random() * (b - a));
}

function setup(host, index) {
  const fixed = host.hasAttribute('data-dna-fixed');
  const grouped = !!host.dataset.dnaGroup;
  const canvas = document.createElement('canvas');
  canvas.className = 'dna-bg' + (fixed ? ' dna-bg-fixed' : '');
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const seed = seedFor(host, index);

  let dims = null;   // last drawn size, used by paint()
  let spell = null;  // active GATTACA animation for this canvas, or null
  const glowHost = host.id === 's3';   // the home DNA section: letters light up with the helix (see drawGlow)
  const COMP = { A: 'T', T: 'A', C: 'G', G: 'C' };
  // In the DNA section the letter rows are spaced like the helix rungs and offset so each rung sits exactly on a row
  let CH = CELL_H, shiftY = 0, shiftX = 0;   // shiftX slides the letter columns so the helix's centre line is exactly a column centre (left and right pair letters then sit equally far from the helix)
  function computeGrid() {
    if (!glowHost) return;
    const dna = document.getElementById('dna-root');
    if (!dna) return;
    const cr = canvas.getBoundingClientRect(), dr = dna.getBoundingClientRect();
    if (!dr.height || !cr.height) return;
    const pitch = dr.height / 13;
    CH = pitch;
    shiftY = (((dr.top - cr.top) % CH) + CH) % CH;     // rung centres are at top + pitch/2 + n*pitch = row centres
    const cxg = dr.left + dr.width / 2 - cr.left + (dims ? dims.offX : 0) - CELL_W / 2;
    shiftX = ((cxg % CELL_W) + CELL_W) % CELL_W;       // column centres at helix centre ± n*CELL_W
  }

  function draw() {
    const w = fixed ? window.innerWidth : host.offsetWidth;
    const h = fixed ? window.innerHeight : host.offsetHeight;
    if (!w || !h) return;
    // grouped canvases draw their slice of a shared field: shift by where
    // this element sits inside its section
    const offX = grouped ? host.offsetLeft : 0;
    const offY = grouped ? host.offsetTop : 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // faint background letters: 1.5x is plenty and costs far fewer pixels than 2x
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dims = { w, h, offX, offY, dpr, color: getComputedStyle(host).getPropertyValue('--dna-bg-color').trim() || 'rgba(255,255,255,0.06)' };
    computeGrid();
    paint(performance.now());
  }

  // The ordinary background letters never change (only the size does), so they are drawn once onto a spare canvas and each
  // repaint just copies that picture. (Redrawing every letter on every scroll step made the DNA section sluggish.)
  let baseCv = null, baseKey = '';
  function ensureBase() {
    const { w, h, offX, offY, dpr, color } = dims;
    const key = [w, h, offX, offY, dpr, color, Math.round(CH * 4), Math.round(shiftY * 4), Math.round(shiftX * 4), seed].join('|');   // quarter-pixel steps: sub-pixel jitter must not trigger a full redraw
    if (baseCv && key === baseKey) return;
    baseKey = key;
    if (!baseCv) baseCv = document.createElement('canvas');
    baseCv.width = Math.round(w * dpr); baseCv.height = Math.round(h * dpr);
    const b = baseCv.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.font = FONT; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillStyle = color;
    const c0 = Math.floor((offX - shiftX) / CELL_W) - 1, c1 = Math.ceil((offX + w - shiftX) / CELL_W) + 1;
    const r0 = Math.floor((offY - shiftY) / CH) - 1, r1 = Math.ceil((offY + h - shiftY) / CH) + 1;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const letter = LETTERS[Math.floor(rand01(r, c, seed) * 4)];
        b.globalAlpha = 0.55 + 0.45 * rand01(r, c, seed + 7919);   // slight brightness variation so it reads as texture, not a grid
        b.fillText(letter, c * CELL_W + CELL_W / 2 + shiftX - offX, r * CH + CH / 2 + shiftY - offY);
      }
    }
  }

  // Repaint at the current size (cheap enough to run every frame during the word animation)
  function paint(now) {
    if (!dims) return;
    const { w, h, offX, offY, color } = dims;
    ensureBase();
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseCv, 0, 0, w, h);
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (spell) {
      for (let i = 0; i < WORD.length; i++) {
        const c = spell.c + i;
        const a = spellAlpha(spell, i, now);
        if (a <= 0) continue;   // not lit yet / already faded: the ordinary random letter from the base picture
        const x = c * CELL_W + CELL_W / 2 + shiftX - offX, y = spell.r * CH + CH / 2 + shiftY - offY;
        ctx.globalAlpha = 1;
        ctx.clearRect(x - CELL_W / 2, y - CH / 2, CELL_W, CH);   // remove the random letter underneath
        ctx.fillStyle = `rgba(255,255,255,${(0.06 + (WORD_PEAK - 0.06) * a).toFixed(3)})`;
        ctx.fillText(WORD[i], x, y);
      }
    }
    if (glowHost) drawGlow();
    ctx.globalAlpha = 1;
  }

  // Idea 5: as the helix builds (scroll progress), each rung gets its base-pair letters in the
  // letter field either side of it (A/T pink, C/G white), and the rest of that row glows faintly.
  // Skipped when Motion is off. Nothing here touches the normal letters.
  function helixZone() {
    const dna = document.getElementById('dna-root');
    if (!dna || !dims) return null;
    const cr = canvas.getBoundingClientRect(), dr = dna.getBoundingClientRect();
    if (!dr.width || !cr.width) return null;
    const cx = dr.left + dr.width / 2 - cr.left;
    const c0 = Math.round((cx + dims.offX - CELL_W / 2 - shiftX) / CELL_W);
    const k = Math.ceil((dr.width / 2 + 42) / CELL_W);   // pair letters sit clear of the bracket marks beside the helix
    return { cr, dr, c0, k };
  }
  function drawGlow() {
    const z = helixZone(); if (!z) return;
    const { cr } = z;
    const labels = Array.from(document.querySelectorAll('.dna-annot text')).map(t => ({ r: t.getBoundingClientRect(), on: parseFloat(getComputedStyle(t.parentNode).opacity) > 0.05 }));
    const s = window.__dnaProgress || 0;
    if (s > 0.3 && motionAllowed()) glowLetters(z, labels.map(l => l.r));
    ctx.globalAlpha = 1;
    // keep the blueprint labels readable: no background letters behind them
    // (labels no longer knock a box out of the background letters: the letters stay visible behind them)
  }
  // As the helix builds (scroll progress), every rung gets its base pair in the letter field either side of it
  // (all white: the pair is A with T, or C with G), and the rest of that row glows faintly.
  let beaconAt = null, beaconTimer = 0;
  function glowLetters(z, labels) {
    beaconAt = null;
    const s = window.__dnaProgress || 0;
    const { cr, dr, c0, k } = z, { offX, offY } = dims;
    const clamp01 = v => Math.max(0, Math.min(1, v));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = FONT;
    const x = c => c * CELL_W + CELL_W / 2 + shiftX - offX;
    for (let i = 0; i < 13; i++) {
      const a = clamp01((s - 0.3) / 2.0 * 15 - i);
      if (a <= 0) continue;
      const y = dr.top - cr.top + (i + 0.5) * dr.height / 13;      // the rung's own height
      const r = Math.round((y + offY - shiftY - CH / 2) / CH);
      const yy = r * CH + CH / 2 + shiftY - offY;                    // nearest row of the letter grid
      ctx.font = FONT; ctx.fillStyle = '#fff';
      for (let c = c0 - k - 14; c <= c0 + k + 14; c++) {
        const d = Math.abs(c - c0) - k;
        if (d < 0) continue;
        ctx.globalAlpha = 0.2 * a * Math.exp(-d / 5);
        ctx.fillText(LETTERS[Math.floor(rand01(r, c, seed) * 4)], x(c), yy);
      }
      // if a blueprint label sits on this rung, the left letter goes just beyond the label instead
      const L = labels.find(l => y + cr.top >= l.top - 8 && y + cr.top <= l.bottom + 8);
      let leftCol = c0 - k;
      const strand = document.querySelectorAll('#dna-root .strand')[i];
      let left = strand && strand.dataset.left, right = strand && strand.dataset.right;   // the bases the balls stand for
      if (!left || !right) { left = LETTERS[Math.floor(rand01(i, 4242, seed) * 4)]; right = COMP[left]; }
      if (strand && strand.dataset.mod === '1') left = 'π';   // the swapped base (see updateDNA in navigation.js)
      ctx.globalAlpha = 0.95 * a;
      [[leftCol, left], [c0 + k, right]].forEach(([c, ch]) => {
        ctx.clearRect(x(c) - CELL_W / 2, yy - CH / 2, CELL_W, CH);   // remove the random letter underneath
        ctx.fillStyle = BASE_COLORS[ch] || '#fff';
        ctx.font = `${FONT_PX + 3}px 'Departure Mono', ui-monospace, Menlo, monospace`;
        if (ch === 'π') { ctx.font = `bold ${FONT_PX + 7}px 'Departure Mono', ui-monospace, Menlo, monospace`; ctx.shadowColor = 'rgba(255,255,255,0.95)'; ctx.shadowBlur = 10; }
        ctx.fillText(ch, x(c), y);
        ctx.shadowBlur = 0;
        if (ch === 'π') beaconAt = { x: x(c), y };
      });
    }
  }
  if (glowHost) {
    let pending = false;
    window.dnaGlowRepaint = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; computeGrid(); paint(performance.now()); });
    };
  }

  // Letters light up left→right, hold, then fade out left→right
  function spellAlpha(sp, i, now) {
    const t0 = sp.start + i * 220;
    const t1 = sp.start + 3800 + i * 120;
    return Math.max(0, Math.min(1, (now - t0) / 400, (t1 - now) / 800));
  }

  instances.push({
    host, canvas, fixed,
    // can a 7-letter word fit, and is this canvas on screen? → pick a spot
    pickSpot() {
      if (!dims) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 80 || rect.top > innerHeight - 80 || rect.right < 80 || rect.left > innerWidth - 80) return null;
      const need = WORD.length * CELL_W;
      const x0 = Math.max(rect.left, 0), x1 = Math.min(rect.right, innerWidth);
      const y0 = Math.max(rect.top, 90), y1 = Math.min(rect.bottom, innerHeight - 60);
      if (x1 - x0 < need + 40 || y1 - y0 < CH * 2) return null;
      const lx = x0 - rect.left + 20 + Math.random() * (x1 - x0 - need - 40);
      const ly = y0 - rect.top + Math.random() * (y1 - y0);
      const spot = { r: Math.floor((ly + dims.offY - shiftY) / CH), c: Math.ceil((lx + dims.offX - shiftX) / CELL_W) };
      if (glowHost) {
        const z = helixZone();
        if (z && spot.c + WORD.length > z.c0 - z.k - 1 && spot.c < z.c0 + z.k + 2) return null;
      }
      return spot;
    },
    play(spot, done) {
      spell = { r: spot.r, c: spot.c, start: performance.now() };
      const end = spell.start + 3800 + WORD.length * 120 + 100;
      let last = 0;
      const tick = now => {
        if (!spell) return;
        if (now >= end || !motionAllowed()) { spell = null; paint(now); done(); return; }
        if (now - last > 33) { last = now; paint(now); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });

  draw();
  if (fixed) {
    window.addEventListener('resize', draw);
  } else if (window.ResizeObserver) {
    new ResizeObserver(draw).observe(host);
  }
  // Redraw once the web font has arrived (first draw may use the fallback)
  if (document.fonts && document.fonts.load) {
    document.fonts.load(FONT).then(draw).catch(() => {});
  }
}

export function initDnaBackground() {
  document.querySelectorAll('.dot-lattice, [data-dna-bg]').forEach(setup);
  if (instances.length) scheduleWord(true);
}
