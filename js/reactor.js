// false while Motion is Off, or while a click-to-replay is playing some OTHER animation (see replay.js)
const reactorMotion = () => window.MOTION_ENABLED !== false && (!window.__replayTarget || window.__replayTarget === 'reactor');
// ──────────────────────────────────────────────────────────────
//  REACTOR – 3D bulb + flask, photon arrows, labels
//            Fully configurable (see config.js)
// ──────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';
import { clamp } from './utils.js';

// ── Destructure config values ──
const {
  REACTOR_SIZE_MULTIPLIER,
  PHOTON_ARROW_START_OFFSET,
  PHOTON_ARROW_END_OFFSET,
  PHOTON_ARROW_FAN_HEIGHT_RATIO,
  PHOTON_ARROW_FAN_HEIGHT_MAX,
  PHOTOREDOX_OFFSET_X,
  PHOTOREDOX_OFFSET_Y,
  REACTOR_VERTICAL_BREAKPOINT,
  VERTICAL_SCALE_MULTIPLIER,
  VERTICAL_SCALE_MAX,
  VERTICAL_WIDTH_FILL,
  LIGHT_ABOVE_BULB_OFFSET,
  VERTICAL_BULB_FLEX,
  VERTICAL_FLASK_FLEX,
  VERTICAL_ARROW_START_OFFSET,
  VERTICAL_ARROW_END_OFFSET,
  VERTICAL_ARROW_WIDTH_RATIO,
  VERTICAL_ARROW_RAY_COUNT,
  VERTICAL_LIGHT_ABOVE_BULB,
  VERTICAL_LIGHT_OFFSET,
  VERTICAL_PHOTOREDOX_OFFSET_Y,
  HORIZONTAL_TILT_DEG,
  VERTICAL_TILT_DEG
} = CONFIG;

// ── Shared vertical/horizontal check ──
// IMPORTANT: this must match the CSS breakpoint that actually flips
// #master-layout to flex-direction:column (see styles.css, the
// "TABLET + MOBILE" tier). We deliberately check the *viewport* width
// here, not the reactor container's own width — the container is
// roughly half the viewport (it lives in a 2-column grid), so
// comparing container width against the same number CSS uses for
// viewport width caused CSS and JS to disagree (bulb/flask laid out
// horizontally by CSS while JS still built vertical-oriented arrows,
// or vice versa) — e.g. on landscape iPad.
function isVerticalLayout() {
  if (window.S2_REACTOR_WIDE) return false;          // phone, Photochemistry column opened wide: bulb and flask side by side (see s2-expand.js)
  if (window.FORCE_REACTOR_HORIZONTAL) return false; // pages that always keep bulb/flask side-by-side (e.g. research.html) set this
  return window.matchMedia(`(max-width: ${REACTOR_VERTICAL_BREAKPOINT}px)`).matches
    && !window.matchMedia(CONFIG.SHORT_LANDSCAPE_QUERY).matches; // sideways phones: side by side
}

// ── Arrow cache for JS-driven animation ──
let arrowCache = {
  initialized: false,
  orientation: null,
  group: null,
  rays: [],          // { path, sx, ex, sy, ey, totalLen }
  tips: [],          // { tip, sx, ex, sy, ey, angle }
  animationId: null,
  startTime: 0
};

// ── Main initialisation ───────────────────────────────────────
export function initReactor() {
  const bulb = document.getElementById('bulb');
  const flaskContainer = document.getElementById('flask-container');
  const stirrer = document.getElementById('stirrer');
  if (!bulb || !flaskContainer) return;

  // ---- Stirrer bar: a smooth cylinder built from thin slices (circular cross-section), shaded bottom-dark to top-bright ----
  if (stirrer && !stirrer.dataset.built) {
    stirrer.dataset.built = '1';
    const R = 12, L = 100, mix = (a, b, t) => Math.round(a + (b - a) * t);
    for (let z = -11; z <= 11; z += 1.5) {
      const w = 2 * Math.sqrt(R * R - z * z), len = L - 2 * R + w;
      const t = (z + R) / (2 * R);                       // 0 bottom .. 1 top
      const s = Math.pow(t, 1.6);
      const col = 'rgb(' + mix(120, 255, s) + ',' + mix(98, 250, s) + ',' + mix(122, 255, s) + ')';
      const el = document.createElement('i');
      el.style.cssText = 'position:absolute;left:50%;top:50%;border-radius:999px;background:' + col +
        ';width:' + len + 'px;height:' + w + 'px;margin-left:' + (-len / 2) + 'px;margin-top:' + (-w / 2) + 'px;transform:translateZ(' + z + 'px)';
      stirrer.appendChild(el);
    }
  }

  // ---- Build bulb structure ----
  // Two glitches fixed here:
  //  1. A ring turned exactly side-on (90°) collapses to a zero-width
  //     sliver, which graphics cards draw as a thick, dark, flickering line
  //     down the middle — so the 90° rib is skipped (it only ever showed as
  //     that line). The 0° rib stays: it's the bulb's outline.
  //  2. The middle glass envelope sat in exactly the same plane and size as
  //     the 60° rib, so the two flickered against each other ("z-fighting");
  //     the envelopes are now turned 10° off the ribs.
  const maxR = 180, glassH = 460, baseTop = 230, sphereR = 250;
  for (let i = 0; i < 6; i++) {
    if (i * 30 === 90) continue; // edge-on: see note above
    const rib = document.createElement('div');
    rib.className = 'wire tech-line';
    rib.style.width = '360px';
    rib.style.height = glassH + 'px';
    rib.style.marginLeft = '-180px';
    rib.style.marginTop = -(glassH - baseTop) + 'px';
    rib.style.borderRadius = '50%';
    rib.style.transform = 'rotateY(' + (i * 30) + 'deg)';
    bulb.appendChild(rib);
  }
  const baseR = 70;
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'base-panel';
    const w = (2 * Math.PI * baseR / 24) + 1;
    p.style.width = w + 'px';
    p.style.height = '110px';
    p.style.marginLeft = -(w / 2) + 'px';
    p.style.transform = 'rotateY(' + (i * 15 + 7.5) + 'deg) translateZ(' + baseR + 'px) translateY(' + baseTop + 'px)';
    bulb.appendChild(p);
  }
  [160, 180, 200].forEach((rad, idx) => {
    const envelope = document.createElement('div');
    envelope.className = 'glass-envelope';
    envelope.style.width = (rad * 2) + 'px';
    envelope.style.height = glassH + 'px';
    envelope.style.marginLeft = -rad + 'px';
    envelope.style.marginTop = -(glassH - baseTop) + 'px';
    envelope.style.borderRadius = '50%';
    envelope.style.transform = 'rotateY(' + (idx * 60 + 10) + 'deg)';
    envelope.style.opacity = 0.3 - (idx * 0.08);
    bulb.appendChild(envelope);
  });

  // ---- Build flask structure ----
  // (same edge-on fix: the 90° meridian is skipped; 0° stays as the outline)
  for (let i = 0; i < 8; i++) {
    if (i * 22.5 === 90) continue; // edge-on: see note above
    const lon = document.createElement('div');
    lon.className = 'wire tech-line';
    lon.style.width = '500px';
    lon.style.height = '500px';
    lon.style.marginLeft = '-250px';
    lon.style.marginTop = '-250px';
    lon.style.borderRadius = '50%';
    lon.style.transform = 'rotateY(' + (i * 22.5) + 'deg)';
    flaskContainer.appendChild(lon);
  }
  const neckR = 80, neckH = 90;
  for (let i = 0; i < 8; i++) {
    const side = document.createElement('div');
    side.className = 'neck-side';
    const w = (2 * Math.PI * neckR / 8) + 1;
    side.style.width = w + 'px';
    side.style.height = neckH + 'px';
    side.style.marginLeft = -(w / 2) + 'px';
    side.style.marginTop = -(neckH / 2) + 'px';
    side.style.transform = 'rotateY(' + (i * 45 + 22.5) + 'deg) translateZ(' + neckR + 'px) translateY(-' + (sphereR + neckH / 2) + 'px)';
    flaskContainer.appendChild(side);
  }
  const rimR = neckR * 1.3;
  const rim = document.createElement('div');
  rim.className = 'neck-rim';
  rim.style.width = (rimR * 2) + 'px';
  rim.style.height = (rimR * 2) + 'px';
  rim.style.marginLeft = -rimR + 'px';
  rim.style.marginTop = -rimR + 'px';
  rim.style.transform = 'translateY(-' + (sphereR + neckH) + 'px) rotateX(90deg) scaleY(0.7)';
  flaskContainer.appendChild(rim);

  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * sphereR;
    const r = Math.sqrt(sphereR * sphereR - y * y);
    const layer = document.createElement('div');
    layer.className = 'liquid-layer';
    layer.style.width = (r * 2) + 'px';
    layer.style.height = (r * 2) + 'px';
    layer.style.marginLeft = -r + 'px';
    layer.style.marginTop = -r + 'px';
    layer.style.transform = 'translateY(' + y + 'px) rotateX(90deg)';
    layer.style.animationDelay = (i * 0.04) + 's';
    flaskContainer.appendChild(layer);
  }

  for (let i = 0; i < 6; i++) {
    const r = 40 + (i / 6) * 200;
    const ring = document.createElement('div');
    ring.className = 'vortex-ring';
    ring.dataset.idx = i;
    ring.style.width = (r * 2) + 'px';
    ring.style.height = (r * 2) + 'px';
    ring.style.marginLeft = -r + 'px';
    ring.style.marginTop = -r + 'px';
    ring.style.animationDelay = '-' + ((5 - i) * 0.08) + 's';
    flaskContainer.appendChild(ring);
  }

  for (let i = 0; i < 12; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    const angle = (i / 12) * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    sparkle.style.setProperty('--sx', Math.cos(angle) * distance + 'px');
    sparkle.style.setProperty('--sy', Math.sin(angle) * distance + 'px');
    sparkle.style.left = '50%';
    sparkle.style.top = '50%';
    sparkle.style.transform = 'translate(-2px, -2px)';
    sparkle.style.animationDelay = (i * 0.02) + 's';
    flaskContainer.appendChild(sparkle);
  }

  // ---- Animate rings & stirrer (unchanged) ----
  const rings = document.querySelectorAll('.vortex-ring');
  let startTime = performance.now();
  let frozenReactor = false;
  function animateReactor() {
    if (!window.__reactorVisible || window.__sliding) { requestAnimationFrame(animateReactor); return; }
    if (!reactorMotion()) {
      // Motion Off: lay the vortex rings and stirrer out neatly once (as at the start of a cycle)
      if (!frozenReactor) {
        frozenReactor = true;
        rings.forEach((r, idx) => {
          const d = 70 * Math.pow(1 - (idx / 6), 2);
          r.style.transform = 'translateY(' + (d - 10) + 'px) rotateX(90deg) rotateZ(' + (idx * 25) + 'deg)';
        });
        if (stirrer) stirrer.style.transform = 'translateY(230px) rotateX(90deg) rotateZ(0deg)';
      }
    } else frozenReactor = false;
    if (reactorMotion()) {
      const elapsed = (performance.now() - startTime) / 1000;
      rings.forEach((r, idx) => {
        const d = 70 * Math.pow(1 - (idx / 6), 2);
        r.style.transform = 'translateY(' + (d - 10) + 'px) rotateX(90deg) rotateZ(' + (-(elapsed * (1 + idx / 4) * 80)) + 'deg)';
      });
      if (stirrer) {
        stirrer.style.transform = 'translateY(230px) rotateX(90deg) rotateZ(' + (-(elapsed * 600)) + 'deg)';
      }
    }
    requestAnimationFrame(animateReactor);
  }
  animateReactor();

  // ---- Apply flex ratios for vertical mode ----
  const lampWrapper = document.getElementById('lamp-wrapper');
  const flaskScene = document.getElementById('flask-scene');
  if (lampWrapper && flaskScene) {
    lampWrapper.style.flex = VERTICAL_BULB_FLEX + ' 1 0';
    flaskScene.style.flex = VERTICAL_FLASK_FLEX + ' 1 0';
  }

  // ---- Dynamic scale & tilt updates ----
  function updateScaleAndTilt() {
    const wrapper = document.getElementById('reactor-site-wrapper');
    const layout = document.getElementById('master-layout');
    if (!wrapper || !layout) return;
    const rect = wrapper.getBoundingClientRect();
    const cw = rect.width || 400;
    const ch = rect.height || 300;
    const isVertical = isVerticalLayout();

    let s;
    if (isVertical) {
      // Fit the bulb + flask (each a 500px box before scaling) to BOTH the
      // column's width and its height, less the arrow gap between them and
      // room for the LIGHT / PHOTOREDOX labels. (Previously width-only with
      // a 0.72 multiplier, which left them small on phones even though the
      // column had plenty of height.)
      const gapPx = parseFloat(getComputedStyle(layout).rowGap) || 0;
      const labelRoom = 80;
      const byWidth = (cw * VERTICAL_WIDTH_FILL) / 500;
      const byHeight = (ch - gapPx - labelRoom) / 1000;
      s = Math.min(byWidth, byHeight) * VERTICAL_SCALE_MULTIPLIER;
      s = clamp(s, 0.08, VERTICAL_SCALE_MAX);
    } else {
      const cap = 0.55 * REACTOR_SIZE_MULTIPLIER;
      s = Math.min((cw / 1050) * REACTOR_SIZE_MULTIPLIER, (ch / 720) * REACTOR_SIZE_MULTIPLIER, cap);
      s = clamp(s, 0.08 * REACTOR_SIZE_MULTIPLIER, cap);
      if (window.S2_REACTOR_WIDE) s *= 0.78;   // phone, column opened wide: leave room for the arrows between bulb and flask
    }
    layout.style.setProperty('--reactor-scale', s);
    rerasterIfScaleChanged(layout, s);

    const tiltDeg = isVertical ? VERTICAL_TILT_DEG : HORIZONTAL_TILT_DEG;
    layout.style.transform = `rotateX(${tiltDeg}deg) rotateY(0deg)`;

    requestAnimationFrame(() => {
      positionPhotonArrows();
      positionReactorLabels();
    });
  }

  const ro = new ResizeObserver(updateScaleAndTilt);
  const s2 = document.getElementById('s2');
  if (s2) ro.observe(s2);
  // also its own box: main.js resizes it after layout (e.g. to fill the
  // column on phones), and the bulb/flask must re-fit when that happens
  const ownBox = document.getElementById('reactor-site-wrapper');
  if (ownBox) ro.observe(ownBox);
  window.addEventListener('resize', updateScaleAndTilt);
  window.reactorRefit = updateScaleAndTilt;
  setTimeout(updateScaleAndTilt, 100);
}

// ─── CRISP LINES AFTER A SIZE CHANGE ─────────────────────────
// The bulb/flask rings are marked `will-change: transform`, so the
// browser draws each one ONCE and then only moves that saved picture.
// If the reactor's size changes afterwards (first layout, window resize,
// rotating a phone/tablet), the saved pictures get stretched instead of
// redrawn — which is why the lines sometimes looked thicker, darker and
// softer than normal. Briefly switching will-change off makes the
// browser redraw them at the new size.
let lastRasterScale = null;
let rerasterTimer = null;
function rerasterIfScaleChanged(layout, s) {
  if (lastRasterScale !== null && Math.abs(s - lastRasterScale) < 0.005) return;
  lastRasterScale = s;
  clearTimeout(rerasterTimer);
  rerasterTimer = setTimeout(() => {           // after the size has settled
    layout.classList.add('reactor-reraster');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      layout.classList.remove('reactor-reraster');
    }));
  }, 150);
}

// ─── POSITION PHOTON ARROWS ──────────────────────────────────
// Rebuild the photon arrows from scratch (used once the research columns have finished resizing — building them
// mid-transition measured a half-way bulb/flask and left the arrows missing or tiny for the first few cycles)
export function rebuildPhotonArrows() {
  arrowCache.initialized = false;
  positionPhotonArrows();
}
window.rebuildPhotonArrows = rebuildPhotonArrows;

export function positionPhotonArrows() {
  const wrapper = document.getElementById('reactor-site-wrapper');
  const bulb = document.getElementById('bulb');
  const flaskContainer = document.getElementById('flask-container');
  const pWrapper = document.getElementById('photon-field-wrapper');
  const svg = document.getElementById('photon-arrows-svg');
  const group = document.getElementById('photon-lines-group');
  const lightLabel = document.getElementById('light-label');
  if (!wrapper || !bulb || !flaskContainer || !pWrapper || !svg || !group) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const bulbRect = bulb.getBoundingClientRect();
  const flaskRect = flaskContainer.getBoundingClientRect();
  if (wrapperRect.width === 0 || bulbRect.width === 0 || flaskRect.width === 0) return;

  const isVertical = isVerticalLayout();
  const orientation = isVertical ? 'vertical' : 'horizontal';

  // Rebuild if not initialised or orientation changed
  if (!arrowCache.initialized || arrowCache.orientation !== orientation) {
    group.innerHTML = '';
    arrowCache.rays = [];
    arrowCache.tips = [];
    arrowCache.group = group;
    arrowCache.orientation = orientation;
    arrowCache.initialized = true;
    arrowCache.startTime = performance.now();

    buildArrows(group, isVertical, wrapperRect, bulbRect, flaskRect, pWrapper, svg, lightLabel);

    if (!arrowCache.animationId) {
      arrowCache.animationId = requestAnimationFrame(animateArrows);
    }
  } else {
    // Just update positions (resize)
    updateArrowPositions(isVertical, wrapperRect, bulbRect, flaskRect, pWrapper, svg, lightLabel);
  }
}

// ─── BUILD ARROWS (creates SVG elements) ────────────────────
function buildArrows(group, isVertical, wrapperRect, bulbRect, flaskRect, pWrapper, svg, lightLabel) {
  if (isVertical) {
    const bulbBottom = bulbRect.bottom - wrapperRect.top;
    const flaskTop = flaskRect.top - wrapperRect.top;
    const centerX = (bulbRect.left + bulbRect.right) / 2 - wrapperRect.left;
    const arrowWidth = Math.min(bulbRect.width, flaskRect.width) * VERTICAL_ARROW_WIDTH_RATIO;

    let startY = bulbBottom + VERTICAL_ARROW_START_OFFSET;
    let endY = flaskTop - VERTICAL_ARROW_END_OFFSET;
    let arrowHeight = endY - startY;
    if (arrowHeight < 20) {
      const midY = (bulbBottom + flaskTop) / 2;
      arrowHeight = 20;
      startY = midY - arrowHeight / 2;
      endY = midY + arrowHeight / 2;
    }

    const leftX = centerX - arrowWidth / 2;
    const topY = startY;
    const width = arrowWidth;
    const height = arrowHeight;

    pWrapper.style.left = leftX + 'px';
    pWrapper.style.top = topY + 'px';
    pWrapper.style.width = width + 'px';
    pWrapper.style.height = height + 'px';
    pWrapper.style.transform = 'none';

    svg.setAttribute('viewBox', `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`);
    svg.setAttribute('width', width.toFixed(1));
    svg.setAttribute('height', height.toFixed(1));

    const rayCount = Math.max(1, VERTICAL_ARROW_RAY_COUNT);
    const spread = Math.max(4, width * 0.2);
    const startSpread = spread;
    const endSpread = spread;

    for (let i = 0; i < rayCount; i++) {
      const t = rayCount === 1 ? 0.5 : i / (rayCount - 1);
      const sx = width / 2 + (t - 0.5) * 2 * startSpread;
      const ex = width / 2 + (t - 0.5) * 2 * endSpread;
      const sy = 0;
      const ey = height;
      const dx = ex - sx;
      const dy = ey - sy;
      const totalLen = Math.sqrt(dx * dx + dy * dy);

      const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;

      // Solid line
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'growing-line');
      path.setAttribute('d', d);
      path.setAttribute('stroke-dasharray', totalLen);
      path.setAttribute('stroke-dashoffset', totalLen);
      path.setAttribute('opacity', '0'); // start hidden
      group.appendChild(path);

      // Arrowhead at the tip
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tip.setAttribute('class', 'arrow-tip');
      tip.setAttribute('d', 'M -10 -5 L 0 0 L -10 5 Z');
      tip.setAttribute('transform', `translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(90)`);
      tip.setAttribute('opacity', '0');
      group.appendChild(tip);

      arrowCache.rays.push({ path, sx, ex, sy, ey, totalLen });
      arrowCache.tips.push({ tip, sx, ex, sy, ey, angle: 90 });
    }

    // LIGHT label
    if (lightLabel) {
      const lightX = centerX;
      let lightY;
      if (VERTICAL_LIGHT_ABOVE_BULB) {
        const bulbTop = bulbRect.top - wrapperRect.top;
        lightY = bulbTop - VERTICAL_LIGHT_OFFSET;
      } else {
        lightY = topY + height + VERTICAL_LIGHT_OFFSET;
      }
      lightLabel.style.left = lightX + 'px';
      lightLabel.style.top = lightY + 'px';
      lightLabel.style.transform = 'translate(-50%, -50%)';
    }
    return;
  }

  // ---- HORIZONTAL ----
  const reactorScale = bulbRect.width / 500;
  const startOff = PHOTON_ARROW_START_OFFSET * reactorScale;
  const endOff = PHOTON_ARROW_END_OFFSET * reactorScale;
  const maxH = PHOTON_ARROW_FAN_HEIGHT_MAX * reactorScale;

  let leftX = bulbRect.right - wrapperRect.left + startOff;
  let rightX = flaskRect.left - wrapperRect.left + endOff;
  const minGap = 24;
  if (rightX - leftX < minGap) {
    const mid = (leftX + rightX) / 2;
    leftX = mid - minGap / 2;
    rightX = mid + minGap / 2;
  }
  const gw = rightX - leftX;
  const bulbCenterY = (bulbRect.top + bulbRect.bottom) / 2 - wrapperRect.top;
  const flaskCenterY = (flaskRect.top + flaskRect.bottom) / 2 - wrapperRect.top;
  const centerY = (bulbCenterY + flaskCenterY) / 2;
  const gh = clamp(gw * PHOTON_ARROW_FAN_HEIGHT_RATIO, 60, maxH);
  const topY = centerY - gh / 2;

  pWrapper.style.left = leftX + 'px';
  pWrapper.style.top = topY + 'px';
  pWrapper.style.width = gw + 'px';
  pWrapper.style.height = gh + 'px';
  pWrapper.style.transform = 'none';

  svg.setAttribute('viewBox', `0 0 ${gw.toFixed(1)} ${gh.toFixed(1)}`);
  svg.setAttribute('width', gw.toFixed(1));
  svg.setAttribute('height', gh.toFixed(1));

  const rayCount = 5;
  const startSpread = gh * 0.10;
  const endSpread = gh * 0.40;

  for (let i = 0; i < rayCount; i++) {
    const t = rayCount === 1 ? 0.5 : i / (rayCount - 1);
    const sx = 0;
    const ex = gw;
    const sy = gh / 2 + (t - 0.5) * 2 * startSpread;
    const ey = gh / 2 + (t - 0.5) * 2 * endSpread;
    const dx = ex - sx;
    const dy = ey - sy;
    const totalLen = Math.sqrt(dx * dx + dy * dy);

    const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'growing-line');
    path.setAttribute('d', d);
    path.setAttribute('stroke-dasharray', totalLen);
    path.setAttribute('stroke-dashoffset', totalLen);
    path.setAttribute('opacity', '0');
    group.appendChild(path);

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const tip = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tip.setAttribute('class', 'arrow-tip');
    tip.setAttribute('d', 'M -10 -5 L 0 0 L -10 5 Z');
    tip.setAttribute('transform', `translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${angle})`);
    tip.setAttribute('opacity', '0');
    group.appendChild(tip);

    arrowCache.rays.push({ path, sx, ex, sy, ey, totalLen });
    arrowCache.tips.push({ tip, sx, ex, sy, ey, angle });
  }

  // LIGHT label — centred ABOVE the bulb (as in the stacked phone/tablet
  // layout), diagonally opposite PHOTOREDOX below the flask, so the two
  // can never crowd each other. (It used to sit on the same line as
  // PHOTOREDOX, under the bulb/flask gap, where the long PHOTOREDOX word
  // reached back towards it.)
  if (lightLabel) {
    lightLabel.style.left = ((bulbRect.left + bulbRect.right) / 2 - wrapperRect.left) + 'px';
    if (window.S2_REACTOR_WIDE) {
      // phone, Photochemistry opened wide: the label's bottom edge sits a clear 8px above the bulb (it used to overlap it),
      // nudged 1px right to undo the trailing letter-spacing so the word is truly centred
      lightLabel.style.top = (bulbRect.top - wrapperRect.top - 8) + 'px';
      lightLabel.style.transform = 'translate(calc(-50% + 1px), -100%)';
    } else {
      lightLabel.style.top = (bulbRect.top - wrapperRect.top - (LIGHT_ABOVE_BULB_OFFSET * reactorScale)) + 'px';
      lightLabel.style.transform = 'translate(-50%, -50%)';
    }
  }
}

// ─── UPDATE POSITIONS (on resize) ────────────────────────────
function updateArrowPositions(isVertical, wrapperRect, bulbRect, flaskRect, pWrapper, svg, lightLabel) {
  const group = arrowCache.group;
  if (!group) return;
  group.innerHTML = '';
  arrowCache.rays = [];
  arrowCache.tips = [];
  arrowCache.startTime = performance.now();
  buildArrows(group, isVertical, wrapperRect, bulbRect, flaskRect, pWrapper, svg, lightLabel);
}

// ─── APPLY A GOOD-LOOKING FROZEN FRAME ───────────────────────
// Used when Motion is switched off: forces the arrows to their fully
// drawn, fully visible state instead of freezing wherever the 6s cycle
// happened to land (which is invisible ~45% of the time). Applied every
// frame while paused (see animateArrows below) so it's self-correcting
// even if something else rebuilds the arrow cache mid-pause.
function applyGoodFrozenFrame() {
  const rays = arrowCache.rays;
  const tips = arrowCache.tips;
  if (!rays || !tips) return;
  for (let i = 0; i < rays.length; i++) {
    const ray = rays[i];
    const tipData = tips[i];
    if (!ray || !tipData) continue;
    ray.path.setAttribute('stroke-dashoffset', 0);
    ray.path.setAttribute('opacity', '1');
    tipData.tip.setAttribute('opacity', '1');
    tipData.tip.setAttribute('transform', `translate(${ray.ex.toFixed(1)}, ${ray.ey.toFixed(1)}) rotate(${tipData.angle})`);
  }
}
// true while the reactor is on screen — the per-frame JS below is skipped otherwise
window.__reactorVisible = true;
document.addEventListener('DOMContentLoaded', () => {
  const w = document.getElementById('reactor-site-wrapper');
  if (w && 'IntersectionObserver' in window) new IntersectionObserver(es => {
    const was = window.__reactorVisible; window.__reactorVisible = es[es.length - 1].isIntersecting;
    if (window.FORCE_REACTOR_HORIZONTAL) {   // the standalone Research page scrolls normally: rest the CSS animations off-screen, restart them together on return
      document.body.classList.toggle('reactor-off', !window.__reactorVisible);
      if (window.__reactorVisible && !was && window.restartReactorAnimations) window.restartReactorAnimations();
    }
  }).observe(w);
});
export function freezeArrowsAtGoodFrame() { applyGoodFrozenFrame(); }
if (typeof window !== 'undefined') window.freezeArrowsAtGoodFrame = freezeArrowsAtGoodFrame;

// ─── ANIMATION LOOP ──────────────────────────────────────────
function animateArrows(timestamp) {
  if (!window.__reactorVisible || window.__sliding) { arrowCache.animationId = requestAnimationFrame(animateArrows); return; }
  if (!arrowCache.initialized) {
    arrowCache.animationId = null;
    return;
  }
  if (!reactorMotion()) {
    applyGoodFrozenFrame(); // keep enforcing it every frame while paused
    arrowCache.animationId = requestAnimationFrame(animateArrows);
    return;
  }

  const elapsed = (timestamp - arrowCache.startTime) / 1000;
  const cycle = elapsed % 6;
  const progress = cycle / 6; // 0 → 1

  // Visible from 0 to 0.55 of the cycle
  let visible = false;
  let t = 0;
  if (progress < 0.55) {
    visible = true;
    t = progress / 0.55; // 0 → 1 during visible phase
  }

  const rays = arrowCache.rays;
  const tips = arrowCache.tips;
  const len = rays.length;

  for (let i = 0; i < len; i++) {
    const ray = rays[i];
    const tipData = tips[i];
    if (!ray || !tipData) continue;

    const { sx, ex, sy, ey, totalLen } = ray;

    if (visible) {
      // Line grows from start to end: offset = totalLen * (1 - t)
      const offset = totalLen * (1 - t);
      ray.path.setAttribute('stroke-dashoffset', offset);
      ray.path.setAttribute('opacity', '1');

      // Arrowhead at the tip of the line
      const px = sx + (ex - sx) * t;
      const py = sy + (ey - sy) * t;
      const angle = tipData.angle;
      tipData.tip.setAttribute('opacity', '1');
      tipData.tip.setAttribute('transform', `translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${angle})`);
    } else {
      // Completely hide both line and arrowhead
      ray.path.setAttribute('stroke-dashoffset', totalLen);
      ray.path.setAttribute('opacity', '0');
      tipData.tip.setAttribute('opacity', '0');
    }
  }

  arrowCache.animationId = requestAnimationFrame(animateArrows);
}

// ─── RESTART ARROW ANIMATION ─────────────────────────────────
export function restartArrowAnimation() {
  if (!arrowCache.initialized) {
    positionPhotonArrows();
    return;
  }
  arrowCache.startTime = performance.now();
  if (!arrowCache.animationId) {
    arrowCache.animationId = requestAnimationFrame(animateArrows);
  }
  positionPhotonArrows();
}

// ─── RESTART ALL REACTOR ANIMATIONS (CSS + arrows) ──────────
window.restartReactorAnimations = () => restartReactorAnimations();
export function restartReactorAnimations() {
  const wrapper = document.getElementById('reactor-site-wrapper');
  if (!wrapper) return;
  wrapper.classList.remove('reactor-active');
  void wrapper.offsetWidth;
  wrapper.classList.add('reactor-active');
  restartArrowAnimation();
}

// ─── POSITION PHOTOREDOX LABEL ──────────────────────────────
export function positionReactorLabels() {
  const wrapper = document.getElementById('reactor-site-wrapper');
  const flaskContainer = document.getElementById('flask-container');
  const label = document.getElementById('photoredox-label');
  if (!wrapper || !flaskContainer || !label) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const flaskRect = flaskContainer.getBoundingClientRect();
  if (wrapperRect.width === 0 || flaskRect.width === 0) return;

  const reactorScale = flaskRect.width / 500;
  const isVertical = isVerticalLayout();
  let x, y;
  if (isVertical) {
    x = (flaskRect.left + flaskRect.right) / 2 - wrapperRect.left;
    // + a share of the flask's height: its 3D tilt makes it draw a little
    // below its own box, so a fixed offset overlapped it at larger sizes
    y = flaskRect.bottom - wrapperRect.top + VERTICAL_PHOTOREDOX_OFFSET_Y + flaskRect.height * 0.1;
  } else {
    x = (flaskRect.left + flaskRect.right) / 2 - wrapperRect.left + (PHOTOREDOX_OFFSET_X * reactorScale);
    y = flaskRect.bottom - wrapperRect.top + (PHOTOREDOX_OFFSET_Y * reactorScale);
  }
  label.style.left = x + 'px';
  label.style.top = y + 'px';
  label.style.transform = window.S2_REACTOR_WIDE ? 'translate(calc(-50% + 1px), -50%)' : 'translate(-50%, -50%)';
}