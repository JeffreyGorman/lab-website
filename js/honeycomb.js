// ──────────────────────────────────────────────────────────────
//  HONEYCOMB – interactive hex grid with exciton animation
// ──────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';
import { getCSSVarNum, clamp } from './utils.js';

const {
  HEX_GRID_RADIUS: R,
  HOP_INTERVAL,
  GLOW_DECAY,
  TRAIL_DECAY,
  HONEYCOMB_LABELS,          // <-- comma added here
  HONEYCOMB_LABEL_OFFSET_X, 
  HONEYCOMB_LABEL_OFFSET_Y,
  HONEYCOMB_LEGEND_HEIGHT_RATIO
} = CONFIG;

let container, canvas, ctx;
let W, H;
let hexes = [], hexMap = {}, outerHexes = [], centerHex = null;
let exciton = null, frame = 0, canSpawn = true;
let hexSize = 40;
let labelState = { photon: false, energy: false, electron: false };
let labelPulse = 0;

export function initHoneycomb() {
  container = document.getElementById('honeycomb-container');
  if (!container) return;

  canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  let dpr = 1, lastKey = '';
  function resize() {
    const rect = container.getBoundingClientRect();
    W = rect.width || 400;
    H = rect.height || 400;
    if (W < 10) W = 400;
    if (H < 10) H = 400;
    // nothing changed (the expand code refits a few times): keep the running animation and its hexes as they are,
    // otherwise the rebuilt grid left the first photon pointing at hexes that no longer exist (no colour on the 1st open)
    const key = W + '|' + H + '|' + (window.S2_LEGEND_RATIO || 0) + '|' + (window.S2_LEGEND_MIN_FS || 0);
    if (key === lastKey && hexes.length) return;
    lastKey = key;
    dpr = Math.min(window.devicePixelRatio || 1, 2);   // crisp text/lines on high-density screens (it was blurry)
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    buildGrid();
    exciton = null; canSpawn = true;   // any photon from the old grid is gone
    if (window._honeycombStarted) { clearTimeout(window._hcSpawnT); window._hcSpawnT = setTimeout(spawnExciton, 500); }
    staticDrawn = false; staticFilled = false;
  }

  let staticDrawn = false, staticFilled = false;
  window.honeycombRedraw = () => { staticDrawn = false; };
  window.honeycombResize = resize;

  function buildGrid() {
    hexes = [];
    hexMap = {};
    outerHexes = [];
    const SAFETY = 0.94;
    const wf = Math.sqrt(3) * (2 * R + 1);
    const hf = 3 * R + 2;
    const gridH = H * (1 - (window.S2_LEGEND_RATIO || HONEYCOMB_LEGEND_HEIGHT_RATIO)); // reserve the bottom band for the legend
    hexSize = Math.min((W * SAFETY) / wf, (gridH * SAFETY) / hf);
    hexSize = clamp(hexSize, 3, 28);

    for (let q = -R; q <= R; q++) {
      for (let r = -R; r <= R; r++) {
        const s = -q - r;
        if (Math.abs(q) > R || Math.abs(r) > R || Math.abs(s) > R) continue;
        const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
        const x = hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = hexSize * (3 / 2 * r);
        const hex = { q, r, s, x, y, dist, glow: 0, trail: 0, kind: 'energy', neighbors: [], isCenter: dist === 0 };
        hexes.push(hex);
        hexMap[q + ',' + r] = hex;
        if (dist === R) outerHexes.push(hex);
        if (dist === 0) centerHex = hex;
      }
    }
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
    for (const h of hexes) {
      h.neighbors = [];
      for (const [dq, dr] of dirs) {
        const key = (h.q + dq) + ',' + (h.r + dr);
        if (hexMap[key]) h.neighbors.push(hexMap[key]);
      }
    }
  }

  // fill colours come from the same CSS variables as the legend bullets, so hexes and labels always match
  let _rgb = null;
  function processRGB(kind) {
    if (!_rgb) {
      const cs = getComputedStyle(document.documentElement);
      const parse = (name, fb) => {
        const v = (cs.getPropertyValue(name).trim() || fb).replace('#', '');
        const h = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(',');
      };
      _rgb = { photon: parse('--honeycomb-bullet-active-photon', '#b22d64'), energy: parse('--honeycomb-bullet-active-energy', '#894495'), electron: parse('--honeycomb-bullet-active-electron', '#512940') };
    }
    return _rgb[kind] || _rgb.energy;
  }

  // false while Motion is Off, or while a click-to-replay is playing some OTHER animation (see replay.js)
  const motionHere = () => window.MOTION_ENABLED !== false && (!window.__replayTarget || window.__replayTarget === 'honeycomb');

  function spawnExciton() {
    if (!motionHere()) return;
    if (!canSpawn || outerHexes.length === 0) return;
    let total = 0, candidates = [];
    for (const h of hexes) {
      if (h.dist === 0) continue;
      const w = Math.pow(h.dist, 1.5);
      candidates.push({ hex: h, weight: w });
      total += w;
    }
    if (total === 0) return;
    let rand = Math.random() * total, chosen = null;
    for (const c of candidates) {
      rand -= c.weight;
      if (rand <= 0) { chosen = c.hex; break; }
    }
    if (!chosen) return;
    exciton = { hex: chosen, hopCounter: 0, hopsTaken: 0, alive: true };
    chosen.kind = 'photon';                       // the hex that absorbs the photon
    chosen.glow = Math.min(1, chosen.glow + 0.8);
    chosen.trail = Math.min(1, chosen.trail + 0.5);
    canSpawn = false;
    updateLabelState();
  }

  // start over from a clean grid (used when the column is expanded/collapsed)
  // Motion Off: no animation, but the grid is not left empty — one photon absorbed at the rim, its energy
  // hopped part of the way in, the charge at the centre, and all three legend lines lit
  function populateStatic() {
    if (!hexes.length || !centerHex || !outerHexes.length) return;
    for (const h of hexes) { h.glow = 0; h.trail = 0; if (h.dist !== 0) h.kind = 'energy'; }
    let cur = outerHexes[Math.floor(outerHexes.length * 0.62)];
    cur.kind = 'photon'; cur.glow = 1; cur.trail = 0.5;
    let step = 0;
    while (cur.dist > 0 && step < 20) {
      const nxt = cur.neighbors.filter(n => n.dist < cur.dist).sort((a, b) => a.dist - b.dist)[0];
      if (!nxt) break;
      step++;
      cur = nxt;
      cur.kind = cur.dist === 0 ? 'electron' : 'energy';
      cur.glow = cur.dist === 0 ? 1 : Math.max(0.35, 0.8 - step * 0.1);
      cur.trail = 0.4;
    }
    labelState.photon = true; labelState.energy = true; labelState.electron = true;
    staticDrawn = false;
  }
  window.honeycombRestart = () => {
    if (!motionHere()) { populateStatic(); updateLabelState(); return; }
    for (const h of hexes) { h.glow = 0; h.trail = 0; if (h.dist !== 0) h.kind = 'energy'; }
    exciton = null; canSpawn = true;
    labelState.photon = false; labelState.energy = false; labelState.electron = false;
    if (window.honeycombRedraw) window.honeycombRedraw();
    updateLabelState();
    setTimeout(spawnExciton, 400);
  };

  function updateExciton() {
    frame++;
    if (!exciton || !exciton.alive) return;
    exciton.hopCounter++;
    if (exciton.hopCounter < HOP_INTERVAL) return;
    exciton.hopCounter = 0;
    const current = exciton.hex;
    const neighbors = current.neighbors;
    if (neighbors.length === 0) return;
    let total = 0, weights = [];
    for (const n of neighbors) {
      let w = 0;
      if (n.dist < current.dist) w = 1.0;
      else if (n.dist === current.dist) w = 0.4;
      else w = 0.05;
      weights.push(w);
      total += w;
    }
    let next = null;
    if (total === 0) { next = neighbors[0]; }
    else {
      let rand = Math.random() * total;
      for (let i = 0; i < neighbors.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { next = neighbors[i]; break; }
      }
    }
    if (!next) return;
    exciton.hex = next;
    exciton.hopsTaken++;
    next.kind = next.dist === 0 ? 'electron' : 'energy';   // hexes carrying the excited state / the charge transfer
    next.glow = Math.min(1, next.glow + 0.65);
    next.trail = Math.min(1, next.trail + 0.45);
    current.trail = Math.min(1, current.trail + 0.35);
    if (next.dist === 0) {
      exciton.alive = false;
      next.glow = Math.min(1, next.glow + 0.6);
      labelState.photon = true;
      labelState.energy = true;
      labelState.electron = true;
      setTimeout(() => {
        labelState.photon = false;
        labelState.energy = false;
        labelState.electron = false;
        canSpawn = true;
      }, 1500);
    } else {
      updateLabelState();
    }
  }

  function updateLabelState() {
    labelState.photon = false;
    labelState.energy = false;
    labelState.electron = false;
    if (!exciton || !exciton.alive) return;
    const dist = exciton.hex.dist;
    const hops = exciton.hopsTaken || 0;
    if (dist === 0) {
      labelState.electron = true;
      labelState.photon = true;
      labelState.energy = true;
    } else if (hops === 0) {
      labelState.photon = true;
    } else {
      labelState.photon = true;
      labelState.energy = true;
    }
  }

  function decayGlow() {
    for (const h of hexes) {
      h.glow *= GLOW_DECAY;
      h.trail *= TRAIL_DECAY;
      if (h.glow < 0.001) h.glow = 0;
      if (h.trail < 0.001) h.trail = 0;
    }
  }

  function getHexPoints(cx, cy, size) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 6 + i * Math.PI / 3;
      pts.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
    }
    return pts;
  }

  function render() {
    if (W === 0 || H === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';   // same tracking as the LIGHT / PHOTOREDOX labels
    ctx.clearRect(0, 0, W, H);
    const gridH = H * (1 - (window.S2_LEGEND_RATIO || HONEYCOMB_LEGEND_HEIGHT_RATIO)); // top region the grid lives in
    const hexH = (3 * R + 2) * hexSize;
    const cx = W / 2, cy = window.S2_LEGEND_RATIO ? hexH / 2 + Math.max(0, gridH - hexH) * 0.1 : gridH / 2; // grid is centered in the top region, shifted up off the legend band

    // fill hexes
    for (const hex of hexes) {
      const pts = getHexPoints(cx + hex.x, cy + hex.y, hexSize);
      const glow = Math.min(1, hex.glow + hex.trail * 0.6);
      let fill = 'rgba(255,255,255,0.02)';
      if (glow > 0.01) {
        const alpha = 0.2 + Math.min(1, glow * 1.2) * 0.7;
        const col = processRGB(hex.isCenter ? 'electron' : hex.kind);   // same colours as the legend bullets
        fill = `rgba(${col}, ${Math.min(1, alpha * 1.3)})`;
      }
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
    }

    // stroke hexes
    for (const hex of hexes) {
      const pts = getHexPoints(cx + hex.x, cy + hex.y, hexSize);
      const glow = Math.min(1, hex.glow + hex.trail * 0.6);
      ctx.strokeStyle = glow > 0.01 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = glow > 0.01 ? 1.5 : 1.0;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[(i+1)%6].x, pts[(i+1)%6].y);
        ctx.stroke();
      }
    }

        // ── labels & bullets (responsive sizing & positioning) ──
    const labelCount = HONEYCOMB_LABELS.length;
    const legendH = H - gridH; // the reserved band below the grid
    const minMargin = Math.min(W, legendH) * 0.08;

    // 1. Calculate available space (within the legend band only)
    const availHeight = legendH - 2 * minMargin;
    const availWidth = W - 2 * minMargin;

    // 2. Start with base font size from CSS
    let baseFS = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-size-base')) || 14;
    let fs = clamp(baseFS * 1.1, 8, 20); // allow 8px min

    // 3. Shrink to fit vertically (each label uses lineHeight = fs * 1.5)
    const neededV = labelCount * fs * 1.5 + fs * 0.5;
    if (neededV > availHeight) {
      fs = Math.max(6, availHeight / (labelCount * 1.5 + 0.5));
    }

    if (window.S2_LEGEND_MIN_FS) fs = Math.max(fs, window.S2_LEGEND_MIN_FS);   // column opened wide on a phone: legend as big as the reactor labels

    // 4. Now measure the longest label text to check horizontal fit
    ctx.font = `bold ${fs}px "Departure Mono", monospace`;
    let maxTextWidth = 0;
    HONEYCOMB_LABELS.forEach(label => {
      const metrics = ctx.measureText(label.text);
      if (metrics.width > maxTextWidth) maxTextWidth = metrics.width;
    });
    const bulletSize = fs * 0.8;
    const totalLabelWidth = bulletSize + 6 + maxTextWidth;

    // If the widest label + bullet exceeds available width, shrink font
    if (totalLabelWidth > availWidth) {
      const maxAllowedWidth = availWidth * 0.95; // leave a tiny margin
      const scale = maxAllowedWidth / totalLabelWidth;
      fs = Math.max(5, fs * scale);
      // Recalculate bulletSize and total width after scaling
      const newBulletSize = fs * 0.8;
      ctx.font = `bold ${fs}px "Departure Mono", monospace`;
      let newMaxWidth = 0;
      HONEYCOMB_LABELS.forEach(label => {
        const metrics = ctx.measureText(label.text);
        if (metrics.width > newMaxWidth) newMaxWidth = metrics.width;
      });
      // Update for positioning
      const finalTotalWidth = newBulletSize + 6 + newMaxWidth;
    }

    // Re-measure after final fs
    const finalBulletSize = fs * 0.8;
    const lineHeight = fs * 1.5;
    ctx.font = `bold ${fs}px "Departure Mono", monospace`;

    // Expose the final font size so LIGHT/PHOTOREDOX can match it exactly
    document.documentElement.style.setProperty('--honeycomb-legend-fs', fs + 'px');
    let finalMaxWidth = 0;
    HONEYCOMB_LABELS.forEach(label => {
      const metrics = ctx.measureText(label.text);
      if (metrics.width > finalMaxWidth) finalMaxWidth = metrics.width;
    });
    const finalTotalWidth = finalBulletSize + 6 + finalMaxWidth;

    // ── POSITIONING ──
    const isSmall = W < 550;
    let blockX, blockY;

    if (isSmall) {
      // Small screens: center horizontally, with a configurable Y offset
      const smallScreenYOffset = -0; // move honeycomb legend on mobile
      blockX = (W - finalTotalWidth) / 2;
      blockY = H - minMargin - (labelCount * lineHeight) - smallScreenYOffset;
    } else {
      // Large screens: centered under the grid (which is centered at W/2 too),
      // with an optional nudge via config
      blockX = (W - finalTotalWidth) / 2 + HONEYCOMB_LABEL_OFFSET_X;
      blockY = H - minMargin - (labelCount * lineHeight) + HONEYCOMB_LABEL_OFFSET_Y;
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = `bold ${fs}px "Departure Mono", monospace`;

    const still = !motionHere();   // Motion Off: the legend is fully lit and steady, matching the coloured hexes
    const pulse = still ? 1 : 0.7 + 0.3 * Math.sin(labelPulse);
    const inactiveColor = getComputedStyle(document.documentElement).getPropertyValue('--honeycomb-bullet-inactive').trim() || 'rgba(255,255,255,0.3)';
    const activeColors = {
      photon: getComputedStyle(document.documentElement).getPropertyValue('--honeycomb-bullet-active-photon').trim() || '#b22d64',
      energy: getComputedStyle(document.documentElement).getPropertyValue('--honeycomb-bullet-active-energy').trim() || '#894495',
      electron: getComputedStyle(document.documentElement).getPropertyValue('--honeycomb-bullet-active-electron').trim() || '#512940'
    };

    const IS_SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);   // Safari already thickens bold text, so the extra stroke looked like a glow there
    if (IS_SAFARI) document.documentElement.classList.add('is-safari');
    HONEYCOMB_LABELS.forEach((label, idx) => {
      const isActive = still || labelState[label.key];
      const y = blockY + (idx + 1) * lineHeight;
      if (isActive) {
        ctx.fillStyle = activeColors[label.key] || '#b22d64';
        ctx.globalAlpha = pulse;
      } else {
        ctx.fillStyle = inactiveColor;
        ctx.globalAlpha = 0.5;
        ctx.shadowBlur = 0;
      }
      ctx.fillText(isActive ? '●' : '○', blockX, y);
      ctx.fillText(label.text, blockX + finalBulletSize + 6, y);
      if (!IS_SAFARI) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.5; ctx.strokeText(label.text, blockX + finalBulletSize + 6, y); }   // same faux-bold stroke as the HTML LIGHT / PHOTOREDOX labels
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Only draw while the honeycomb is actually on screen (the canvas used to redraw every frame, even on other sections)
  let hcVisible = true, hcDrawnOnce = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => {
    const was = hcVisible; hcVisible = es[es.length - 1].isIntersecting;
    if (hcVisible && !was && window._honeycombStarted) spawnExciton();   // start a photon as soon as the honeycomb comes into view, instead of waiting for the next 3 s tick
  }).observe(container);

  const SAFARI_HC = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  let hcSkip = false;
  function loop() {
    if (SAFARI_HC && motionHere()) { hcSkip = !hcSkip; if (hcSkip) { requestAnimationFrame(loop); return; } }   // Safari: draw every other frame (30 fps) -- the honeycomb is slow-moving
    // sit out a section slide only once the grid has been drawn at least once, otherwise the honeycomb is blank until the slide ends
    if (!hcVisible || (window.__sliding && hcDrawnOnce && window.currentSection !== 1)) { requestAnimationFrame(loop); return; }
    hcDrawnOnce = true;
    if (motionHere()) {
      labelPulse += 0.05;
      if (labelPulse > Math.PI * 2) labelPulse -= Math.PI * 2;
      updateExciton();
      decayGlow();
      render();
      staticDrawn = false;
    } else if (!staticDrawn) {
      // Motion Off: draw one still frame (and redraw after any resize) so the honeycomb is always visible
      if (!staticFilled) { staticFilled = true; populateStatic(); }
      render();
      staticDrawn = true;
    }
    requestAnimationFrame(loop);
  }

  // ── initialise ──
  let attempts = 0;
  function tryInit() {
    attempts++;
    resize();
    if (W > 50 && H > 50 && hexes.length > 0) {
      if (!window._honeycombStarted) {
        window._honeycombStarted = true;
        setTimeout(spawnExciton, 300);
        canvas.addEventListener('click', spawnExciton);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); spawnExciton(); }, { passive: false });
        setInterval(spawnExciton, 3000);
        loop();
      }
      return;
    }
    if (attempts < 10) setTimeout(tryInit, 200);
  }
  tryInit();

  // ── resize observer ──
  const ro = new ResizeObserver(() => { resize(); });
  ro.observe(container);
}