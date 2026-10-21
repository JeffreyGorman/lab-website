// ──────────────────────────────────────────────────────────────
//  TITLE ANIMATION (hero split & fade)
// ──────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';
import { getVH, getVW } from './utils.js';

const {
  TITLE_FINAL_PERCENT, TITLE_OFFSET_VH,
  TITLE_START_WIDTH, TITLE_START_MAX_HEIGHT, TITLE_START_MAX_SCALE,
  TITLE_END_MAX_COL_FRACTION
} = CONFIG;

let leftTargetX = 0;
let rightTargetX = 0;
// Each word's centre relative to the screen centre (the zoom origin) at
// scale 1, before it moves — used to keep the slide in step with the zoom.
let leftHome = 0;
let rightHome = 0;

// Hero "zoom": the title's font-size is set for the END state (the split
// words have to fit inside their columns). In the hero we scale the whole
// title up by startScale, centred on the "x", and shrink it back to 1 as
// you scroll — so the opening "ExP Lab" can be big on every screen without
// limiting how big "Photochemistry" can be at the end (and vice versa).
let startScale = 1;
let heroShiftY = 0;   // phones/tablets: lifts the opening title so its middle sits at the middle of the screen
let lastProgress = 0; // last applied 0..1 progress, re-applied after a resize

// Font-size shrink applied when the split words wouldn't fit their columns
// (e.g. "Photochemistry" on a very narrow phone). 1 = CSS size untouched.
let fitFontScale = 1;

// Shrink quickly at first (ease-out), so the big hero title is already
// close to its end size by the time the words are far enough apart to
// fade in their full names — otherwise the huge letters overlap each
// other and run off the screen mid-scroll.
function easeOut(progress) {
  return 1 - Math.pow(1 - progress, 3);
}
function titleScaleAt(progress) {
  // back to normal size by 70% of the scroll
  return startScale + (1 - startScale) * easeOut(Math.min(1, progress / 0.7));
}
// The words also slide apart on an ease-out, so they've mostly reached
// their columns before their full names fade in.
function splitAt(progress) {
  return easeOut(Math.min(1, progress * 1.25));
}

// "citonics" / "hotochemistry" fade in over the second half of the scroll,
// once the words have separated (was: fading from the very start).
function fadeAt(progress) {
  return Math.min(1, Math.max(0, (progress - 0.5) / 0.45));
}

// The words sit inside the zoomed title, so any translateX we give them is
// multiplied by the current zoom. Work out where each word should be ON
// SCREEN (a straight glide from its zoomed hero spot to its column) and
// divide back out by the zoom — otherwise the words overshoot off-screen
// while the title is still big.
function applyWordPositions(progress) {
  const sc = titleScaleAt(progress);
  const k = splitAt(progress);
  const place = (home, target) => {
    const screenX = startScale * home + ((home + target) - startScale * home) * k;
    return screenX / sc - home;
  };
  lw.style.transform = `translateX(${place(leftHome, leftTargetX)}px)`;
  rw.style.transform = `translateX(${place(rightHome, rightTargetX)}px)`;
}

// How far the title travels down to its resting place over the research
// columns. Normally TITLE_FINAL_PERCENT of the screen height — but never
// so high that it ends up under the navbar (happened on phones held
// sideways, where 15% of a short screen is less than the navbar height).
function titleTargetY(vh) {
  let target = vh * (0.5 + TITLE_FINAL_PERCENT / 100 + TITLE_OFFSET_VH);
  const navbar = document.getElementById('navbar');
  if (masterTitle && navbar) {
    const finalTop = masterTitle.offsetTop + target - vh; // relative to the research section's top
    const minTop = navbar.offsetHeight + 4;
    if (finalTop < minTop) target += minTop - finalTop;
  }
  return target;
}

// Where the bottom of the title ends up, measured from the top of the
// research section — main.js starts the column text below this.
export function getTitleFinalBottom() {
  if (!masterTitle) return 0;
  const vh = getVH();
  return masterTitle.offsetTop + titleTargetY(vh) - vh + masterTitle.offsetHeight;
}

function applyTitleTransform(progress, vh) {
  const targetY = titleTargetY(vh);
  masterTitle.style.transform =
    `translateY(${progress * targetY + (1 - progress) * heroShiftY}px) scale(${titleScaleAt(progress)})`;
  scheduleCrispTitle();
}

// Safari rasterises the title's text once, at whatever size its layer first
// had, and then just stretches that bitmap as the zoom changes — so the big
// hero "ExP Lab" looks soft. Once the title has stopped moving, rebuild its
// layer so Safari redraws the text sharply at the current size.
let crispTimer = 0;
function scheduleCrispTitle() {
  if (!document.documentElement.classList.contains('is-safari')) return;
  clearTimeout(crispTimer);
  crispTimer = setTimeout(() => {
    if (!masterTitle) return;
    const t = masterTitle.style.transform;
    masterTitle.style.display = 'none';
    masterTitle.style.transform = 'none';
    masterTitle.style.willChange = 'auto';
    void masterTitle.offsetHeight;
    masterTitle.style.display = '';
    requestAnimationFrame(() => { masterTitle.style.transform = t; });
  }, 160);
}
// also after the window has stopped being resized (Safari keeps the old,
// now wrongly sized bitmap otherwise)
window.addEventListener('resize', () => {
  clearTimeout(crispTimer);
  crispTimer = setTimeout(scheduleCrispTitle, 350);
});

const masterTitle = document.getElementById('masterTitle');
const centeringContainer = document.getElementById('centering-container');
const lw = document.getElementById('lw');
const rw = document.getElementById('rw');
const xChar = document.getElementById('x-char');
const fades = document.querySelectorAll('.fade-text');
const labSubtitle = document.getElementById('labSubtitle');
const cornerLabels = document.querySelectorAll('.hero-corner-label');
const videoElement = document.querySelector('.hero-video');

export function calculateOffsets() {
  const vw = getVW();
  if (centeringContainer && xChar && lw && rw) {
    // Measure at scale 1 (the hero zoom would otherwise distort every rect)
    if (masterTitle) masterTitle.style.transform = '';
    if (!calculateOffsets._refitting) {
      [lw, rw, labSubtitle].forEach(el => { if (el) el.style.fontSize = ''; });
      fitFontScale = 1;
    }
    if (window.gsap) {
      window.gsap.set([centeringContainer, lw, rw], { x: 0, xPercent: 0 });
    } else {
      [centeringContainer, lw, rw].forEach(el => { el.style.transform = ''; });
    }
    const leftFade = lw.querySelector('.fade-text');
    const rightFade = rw.querySelector('.fade-text');
    if (leftFade) leftFade.style.opacity = '1';
    if (rightFade) rightFade.style.opacity = '1';
    void lw.offsetHeight;
    void rw.offsetHeight;

    const xRect = xChar.getBoundingClientRect();
    const xCenter = xRect.left + (xRect.width / 2);
    const screenCenter = vw / 2;
    const initialNudge = screenCenter - xCenter;
    if (window.gsap) {
      window.gsap.set(centeringContainer, { x: initialNudge });
    } else {
      centeringContainer.style.transform = `translateX(${initialNudge}px)`;
    }
    void centeringContainer.offsetHeight;

    // Left-align "Lab" with the actual rendered left edge of "Ex".
    // (Previously centered under the "Ex"+"P" midpoint — CSS's `left:50%`
    // centers over word-box's own layout box, a different point than the
    // 'x'-character anchor used for initialNudge above, so positioning
    // it explicitly avoids that drift either way.)
    if (labSubtitle) {
      const lwRect0 = lw.getBoundingClientRect();
      const containerRect = centeringContainer.getBoundingClientRect();
      labSubtitle.style.left = (lwRect0.left - containerRect.left) + 'px';
      labSubtitle.style.transform = 'translateX(0)';
    }

    const leftCol = document.querySelector('.col-left');
    const rightCol = document.querySelector('.col-right');
    let leftTargetPixel = leftCol ? leftCol.getBoundingClientRect().left + (leftCol.getBoundingClientRect().width / 2) : vw * 0.25;
    let rightTargetPixel = rightCol ? rightCol.getBoundingClientRect().left + (rightCol.getBoundingClientRect().width / 2) : vw * 0.75;

    const lwRect = lw.getBoundingClientRect();
    const rwRect = rw.getBoundingClientRect();
    const leftFadeRect = leftFade ? leftFade.getBoundingClientRect() : { width: 0, left: lwRect.right };
    const rightFadeRect = rightFade ? rightFade.getBoundingClientRect() : { width: 0, left: rwRect.right };
    const lwFullWidth = (leftFadeRect.left + leftFadeRect.width) - lwRect.left;
    const rwFullWidth = (rightFadeRect.left + rightFadeRect.width) - rwRect.left;
    // If the longer word wouldn't fit inside its column at the end, shrink
    // the title font just enough (then re-measure from scratch).
    if (leftCol && rightCol && !calculateOffsets._refitting) {
      const colW = Math.min(leftCol.getBoundingClientRect().width, rightCol.getBoundingClientRect().width);
      const widest = Math.max(lwFullWidth, rwFullWidth);
      const maxW = colW * TITLE_END_MAX_COL_FRACTION;
      if (widest > maxW) {
        const k = maxW / widest;
        [lw, rw, labSubtitle].forEach(el => {
          if (el) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * k) + 'px';
        });
        if (leftFade) leftFade.style.opacity = '';
        if (rightFade) rightFade.style.opacity = '';
        calculateOffsets._refitting = true;
        try { calculateOffsets(); } finally { calculateOffsets._refitting = false; }
        fitFontScale = k;
        reapplyTitleState();
        return;
      }
    }

    // Hero zoom: make "ExP" span TITLE_START_WIDTH of the screen, but keep
    // the whole "ExP / Lab" block under TITLE_START_MAX_HEIGHT of the
    // screen height (matters on landscape phones) and under the max scale.
    const expWidth = rwRect.right - lwRect.left;           // "Ex" + gap + "P"
    const labRect = labSubtitle ? labSubtitle.getBoundingClientRect() : lwRect;
    const blockHeight = Math.max(lwRect.bottom, labRect.bottom) - Math.min(lwRect.top, labRect.top);
    const byWidth = (vw * TITLE_START_WIDTH) / Math.max(expWidth, 1);
    const byHeight = (getVH() * TITLE_START_MAX_HEIGHT) / Math.max(blockHeight, 1);
    startScale = Math.max(1, Math.min(byWidth, byHeight, TITLE_START_MAX_SCALE));

    // On phones and tablets the title wrapper starts at 50% of the screen height, so the title sits below the middle.
    // Measure how far to lift it so the opening "ExP / Lab" is centred vertically; the lift fades out as the title travels down.
    heroShiftY = 0;
    if (masterTitle && window.innerWidth <= 1024) {
      heroShiftY = getVH() / 2 - (masterTitle.offsetTop + masterTitle.offsetHeight / 2);
    }

    const lwCurrentCenter = lwRect.left + (lwFullWidth / 2);
    const rwCurrentCenter = rwRect.left + (rwFullWidth / 2);
    leftHome = lwCurrentCenter - vw / 2;
    rightHome = rwCurrentCenter - vw / 2;
    leftTargetX = leftTargetPixel - lwCurrentCenter;
    rightTargetX = rightTargetPixel - rwCurrentCenter;
    if (leftFade) leftFade.style.opacity = '';
    if (rightFade) rightFade.style.opacity = '';

    // Re-apply the current scroll state (previously a resize left the
    // words snapped back together until the next scroll)
    if (!calculateOffsets._refitting) reapplyTitleState();
  }
}

function reapplyTitleState() {
  if (!masterTitle || !lw || !rw) return;
  const vh = getVH();
  applyTitleTransform(lastProgress, vh);
  applyWordPositions(lastProgress);
}

export function syncVisuals(yPos) {
  const vh = getVH();
  const rawProgress = Math.max(0, yPos / vh);
  const clamped = Math.min(rawProgress, 1);
  const motionOff = window.MOTION_ENABLED === false;
  const titleLive = !motionOff || window.__freeScroll;   // Motion Off + free scrolling: the title follows the scroll directly

  if (masterTitle && titleLive) {
    lastProgress = clamped;
    applyTitleTransform(clamped, vh);
    masterTitle.style.pointerEvents = 'none';
    if (rawProgress < 3) masterTitle.style.opacity = 1;
    else masterTitle.style.opacity = 0;
  }

  const currentSection = window.currentSection !== undefined ? window.currentSection : 0;
  if (lw && rw && currentSection <= 1 && titleLive) {
    applyWordPositions(clamped);
    fades.forEach(f => f.style.opacity = fadeAt(clamped));
    const cornerOpacity = 1 - (clamped * 2.5); // was 1.5 — clears the corners before the big words slide through them
    if (labSubtitle) labSubtitle.style.opacity = 1 - (clamped * 2.5); // "Lab" clears out early, before the words shrink onto it
    cornerLabels.forEach(el => el.style.opacity = cornerOpacity);
  }
  // When motion is off, the title/corner-label state is intentionally left
  // untouched here (no mid-transition changes at all, avoiding any flash)
  // — see settleTitleForSection(), called once after a transition completes.

  if (videoElement && yPos < vh) {
    videoElement.style.transform = `translateY(${yPos * 0.5}px)`;
  }

  // .reveal fade-ins: reading each element's position forces a layout, so do it at most every 100 ms (and on the last frame)
  const now = performance.now();
  if (!syncVisuals._els) syncVisuals._els = document.querySelectorAll('.reveal');
  if (motionOff) { syncVisuals._els.forEach(el => el.classList.add('active')); return; }   // keep content visible and settled
  if (now - (syncVisuals._t || 0) < 100 && !(window.__sliding === false)) return;
  syncVisuals._t = now;
  const lim = window.innerHeight * 0.85;
  const tops = Array.prototype.map.call(syncVisuals._els, el => el.getBoundingClientRect().top);
  syncVisuals._els.forEach((el, i) => { if (tops[i] < lim) el.classList.add('active'); else el.classList.remove('active'); });
}

// Applies the correct resting title/corner-label state for a given
// section in one clean step — used instead of the gradual scroll-linked
// update when motion is off, so there's no mid-transition flicker.
export function settleTitleForSection(sectionIndex) {
  const vh = getVH();
  const clamped = sectionIndex >= 1 ? 1 : 0;

  if (masterTitle) {
    lastProgress = clamped;
    applyTitleTransform(clamped, vh);
    masterTitle.style.pointerEvents = 'none';
    masterTitle.style.opacity = sectionIndex < 3 ? 1 : 0;
  }

  if (lw && rw && sectionIndex <= 1) {
    applyWordPositions(clamped);
    fades.forEach(f => f.style.opacity = clamped);
    const cornerOpacity = 1 - (clamped * 1.5);
    if (labSubtitle) labSubtitle.style.opacity = cornerOpacity;
    cornerLabels.forEach(el => el.style.opacity = cornerOpacity);
  }
}