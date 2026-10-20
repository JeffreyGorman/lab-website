// ──────────────────────────────────────────────────────────────
//  NAVIGATION – scroll, side dots, mobile menu
// ──────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';
import { syncVisuals, settleTitleForSection } from './title.js';
import { positionPhotonArrows, positionReactorLabels, restartReactorAnimations } from './reactor.js';
import { prefersReducedMotion } from './motion-state.js';

const { SECTION_IDS, SECTION_LABELS } = CONFIG;

const content = document.getElementById('smooth-content');
// Mid-tone of each section's background, used for the browser bars (home, research, DNA, team, publications, join)
const SECTION_BARS = ['#D4A5C3', '#C9A5D1', '#9D88BE', '#746494', '#84749F', '#746494'];
let currentSection = 0;
let isAnimating = false;
let s3Done = false;
let s3Progress = 0;
const S3_STOPS = [750, 1250, 1750];   // reveal pauses here: bullet 1 + label, bullet 2 + label, bullet 3 + label (scrollAmount 1.5 / 2.5 / 3.5)
let s3Completed = false;

export function initNavigation() {
  window.currentSection = currentSection;
  updateNavUI(0);

  // ── the logo takes you back to the top (home) ──
  const logo = document.querySelector('.navbar-logo');
  if (logo) {
    logo.setAttribute('role', 'link'); logo.setAttribute('tabindex', '0'); logo.setAttribute('aria-label', 'ExP Lab home'); logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => { if (currentSection !== 0) goToSection(0); });
    logo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (currentSection !== 0) goToSection(0); } });
  }

  // ── build side dots ──
  const sideNav = document.getElementById('side-nav');
  if (sideNav) {
    SECTION_IDS.forEach((id, i) => {
      const dot = document.createElement('button'); // button: reachable with Tab, announced by screen readers
      dot.type = 'button';
      dot.className = 'nav-dot' + (i === 0 ? ' active' : '') + (i === 1 ? ' nav-dot--joined' : ''); // Research and DNA are one topic: joined dots
      dot.dataset.label = SECTION_LABELS[i];
      dot.setAttribute('aria-label', SECTION_LABELS[i]);
      if (i === 0) dot.setAttribute('aria-current', 'true');
      dot.addEventListener('click', () => goToSection(i));
      sideNav.appendChild(dot);
    });
  }

  // ── navigation arrows ──
  const arrowMap = {
    's2NavUp': 0,
    's2NavDown': 2,
    's3NavUp': 1,
    's3NavDown': 3,
    's4NavUp': 2,
    's4NavDown': 4,
    's5NavUp': 3,
    's5NavDown': 5,
    's6NavUp': 4
  };

  for (const [id, target] of Object.entries(arrowMap)) {
    const el = document.getElementById(id);
    if (el) {
      const go = () => {
        if (id === 's3NavDown') { s3Progress = 2000; s3Done = true; }
        goToSection(target);
      };
      el.addEventListener('click', go);
      onActivateKey(el, go);
    }
  }

  // ── nav links ──
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionMap = { 's1':0, 's2':1, 's3':2, 's4':3, 's5':4, 's6':5 };
      const target = link.getAttribute('data-section');
      let idx = sectionMap[target];
      // "Research" covers two sections (its underline has a left and a right half): the right half opens the DNA part
      if (target === 's2' && link.classList.contains('nav-link')) {
        const r = link.getBoundingClientRect();
        if (e.clientX > r.left + r.width / 2) idx = 2;
      }
      if (idx !== undefined) goToSection(idx);
    });
  });

  // ── deep links from the sub-pages (index.html#s4 etc.) ──
  // The section ids (#s4 ...) are also real element ids, so the browser itself scrolls the page body to that section on
  // arrival; the page moves with a transform instead, so that native scroll would double the offset and leave a blank
  // pink screen. Keep the body at 0 and never let it keep a native scroll.
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  const resetNativeScroll = () => { if (document.body.scrollTop) document.body.scrollTop = 0; if (document.documentElement.scrollTop) document.documentElement.scrollTop = 0; };
  resetNativeScroll();
  window.addEventListener('load', resetNativeScroll);
  window.addEventListener('pageshow', resetNativeScroll);
  document.addEventListener('scroll', resetNativeScroll, true);
  const hashIndex = SECTION_IDS.indexOf(location.hash);
  if (location.hash && hashIndex > 0) {
    let tries = 0;
    const goHash = () => {
      if (!window.gsap && tries++ < 50) return setTimeout(goHash, 100);   // GSAP loads async: moving the page with the CSS fallback first corrupts GSAP's transform
      goToSection(hashIndex);
    };
    setTimeout(goHash, 700);
  }

  // ── hamburger ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    const setMenu = (open) => {
      hamburger.classList.toggle('active', open);
      mobileMenu.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    };
    hamburger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('active')));
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) { setMenu(false); hamburger.focus(); }
    });
  }

  // ── scroll prompt ──
  const prompt = document.getElementById('scrollPrompt');
  if (prompt) {
    prompt.addEventListener('click', () => goToSection(1));
    onActivateKey(prompt, () => goToSection(1));
  }

  // ── get next section with DNA logic ──
  function getNextSection(dir) {
    // If we're in the DNA section (index 2) and not finished
    if (currentSection === 2 && !s3Done) {
      if (s3Completed) {
        return dir === 1 ? 3 : 1;
      }
      // PHONE SWIPES: one swipe = one stop (bullet 1, bullet 2, bullet 3, then the next page); swiping back retraces them
      if (window.__touchStep) {
        const tn = Date.now();
        if (tn - (window.__s3LastStep || 0) < 250) return null;
        window.__s3LastStep = tn;
        if (dir === 1) {
          const nxt = S3_STOPS.find(sp => sp > s3Progress + 1);
          if (nxt === undefined) { s3Done = true; s3Completed = true; updateDNA(2000); return 3; }
          s3Progress = nxt; updateDNA(nxt);
          return null;
        }
        const prev = [...S3_STOPS].reverse().find(sp => sp < s3Progress - 1);
        if (prev !== undefined) { s3Progress = prev; updateDNA(prev); return null; }
        if (s3Progress > 0) { s3Progress = 0; updateDNA(0); return null; }
        return 1;
      }
      const nowT = Date.now();
      // STAGE HOLD: the reveal pauses at each bullet/label (see S3_STOPS); to go on, the reader has to start a fresh
      // scroll/swipe (a quiet gap) after a short pause, so trackpad momentum can't blast through a stage
      const gap = nowT - (window.__s3Evt || 0);
      window.__s3Evt = nowT;
      // a "fresh" scroll = a short pause in the wheel events, or a swipe that is getting stronger (trackpad momentum only ever fades)
      const absd = window.__wheelAbs || 0, rising = absd > (window.__s3LastAbs || 0) + 2;
      window.__s3LastAbs = absd;
      if (window.__s3Hold) {
        if (nowT > window.__s3Hold && (gap >= 100 || rising)) window.__s3Hold = 0;
        else return null;
      }
      if (nowT - (window.__s3LastStep || 0) < 90) return null;   // throttle: one step per 90 ms
      window.__s3LastStep = nowT;
      if (dir === 1) {
        const before = s3Progress;
        if (before >= S3_STOPS[S3_STOPS.length - 1]) {   // last bullet (π + glow) is showing: the next scroll leaves, no extra empty step
          s3Done = true; s3Completed = true;
          updateDNA(2000);
          return 3;
        }
        s3Progress += Math.min(560, Math.max(350, absd * 3.5));   // a firmer scroll moves a little further (still snaps to each stop)
        const stop = S3_STOPS.find(sp => sp > before && sp <= s3Progress);
        if (stop !== undefined) { s3Progress = stop; window.__s3Hold = nowT + 300; }
        updateDNA(s3Progress);
        if (s3Progress > 1900) {      // everything is revealed by ~1800, so leave soon after
          s3Done = true;
          s3Completed = true;
          // Shorter cooldown here specifically — still requires a separate
          // scroll gesture (don't advance on the same continuous scroll
          // that just finished revealing the bullets) but the full 1100ms
          // general cooldown felt too strict right at this point.
          lastWheelNavTime = Date.now() - (WHEEL_COOLDOWN_MS - 450);
          return null;
        }
        return null; // stay in section 2 while scrolling DNA
      } else {
        const before = s3Progress;
        s3Progress -= Math.min(560, Math.max(350, absd * 3.5));
        const stopUp = [...S3_STOPS].reverse().find(sp => sp < before && sp >= s3Progress && s3Progress >= 0);
        if (stopUp !== undefined) { s3Progress = stopUp; window.__s3Hold = nowT + 300; }
        if (s3Progress < 0) {
          s3Progress = 0;
          return 1;
        }
        updateDNA(s3Progress);
        return null;
      }
    }
    // Normal section navigation
    const next = currentSection + dir;
    if (next >= 0 && next < SECTION_IDS.length) {
      return next;
    }
    return null;
  }

  // ── wheel ──
  let lastWheelNavTime = 0;
  const WHEEL_COOLDOWN_MS = 1100; // ignore further wheel-triggered navigation for this long after each jump
  function wheelHandler(e) {
    e.preventDefault();
    if (isFree()) {
      cancelAnimationFrame(freeRaf);
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      freeSet(freeBase() + dy);
      return;
    }
    if (isAnimating) return;
    if (Math.abs(e.deltaY) < 4) return; // filter trackpad/mouse noise
    if (Date.now() - lastWheelNavTime < WHEEL_COOLDOWN_MS) return;
    const direction = e.deltaY > 0 ? 1 : -1;
    window.__wheelAbs = Math.abs(e.deltaY);
    const next = getNextSection(direction);
    if (next !== null) {
      lastWheelNavTime = Date.now();
      goToSection(next);
    }
  }
  window.addEventListener('wheel', wheelHandler, { passive: false });

  // ── keyboard ──
  function keydownHandler(e) {
    if (isFree()) {
      const k = e.key, vh = window.innerHeight;
      const d = k === 'ArrowDown' || k === 'Down' ? 70 : k === 'ArrowUp' || k === 'Up' ? -70 : k === 'PageDown' ? vh * 0.9 : k === 'PageUp' ? -vh * 0.9 : k === 'Home' ? -1e6 : k === 'End' ? 1e6 : 0;
      if (d) { e.preventDefault(); cancelAnimationFrame(freeRaf); freeSet(freeBase() + d); }
      return;
    }
    if (isAnimating) return;
    if (e.key === 'ArrowDown' || e.key === 'Down') {
      e.preventDefault();
      const next = getNextSection(1);
      if (next !== null) goToSection(next);
    }
    if (e.key === 'ArrowUp' || e.key === 'Up') {
      e.preventDefault();
      const next = getNextSection(-1);
      if (next !== null) goToSection(next);
    }
  }
  window.addEventListener('keydown', keydownHandler);

  // ── DNA helix only animates while visible ──
  document.body.classList.add('dna-off');
  const dnaEl = document.querySelector('.section-3 .dna');
  if (dnaEl && 'IntersectionObserver' in window) new IntersectionObserver(es => {
    document.body.classList.toggle('dna-off', !es[es.length - 1].isIntersecting);
  }).observe(dnaEl);

  // ── resize (Safari: window drag, toolbar show/hide, zoom) ──
  // The page is a stack of full-height sections moved by a pixel offset, so after the window size changes that
  // offset is stale and the DNA ends up sliced between sections. Re-seat on the current section once resizing settles.
  let lastRW = window.innerWidth, lastRH = window.innerHeight, resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const w = window.innerWidth, h = window.innerHeight;
      if (Math.abs(w - lastRW) < 2 && Math.abs(h - lastRH) < 2) return;
      // The helix balls move by a distance written in the keyframes (--destination, from the screen height). A paused animation
      // keeps the old value in Safari, so after a resize the balls no longer lined up with the bars: re-create the animations.
      const reseatDNA = () => { document.body.classList.add('dna-restart'); void document.body.offsetWidth; document.body.classList.remove('dna-restart'); };
      if (isAnimating) { setTimeout(() => window.dispatchEvent(new Event('resize')), 300); return; }
      lastRW = w; lastRH = h;
      const t = document.querySelector(SECTION_IDS[currentSection]);
      if (!t) return;
      const y = Math.min(t.offsetTop, Math.max(0, content.scrollHeight - h));
      if (window.gsap) { window.gsap.killTweensOf(content); window.gsap.set(content, { y: -y }); }
      else content.style.transform = 'translateY(' + (-y) + 'px)';
      syncVisuals(y);
      if (window.sizeSection2) window.sizeSection2();
      reseatDNA();
    }, 140);
  });

  // ── touch ──
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  // Motion Off: the page follows the finger, then coasts a little
  let lastTY = 0, lastTT = 0, velY = 0, dragOK = false;
  const ownScroller = (el) => { for (; el && el !== document.body; el = el.parentElement) { const cs = getComputedStyle(el); if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 2) return true; } return false; };
  document.addEventListener('touchstart', (e) => { lastTY = e.touches[0].clientY; lastTT = performance.now(); velY = 0; dragOK = !ownScroller(e.target); cancelAnimationFrame(freeRaf); }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!isFree() || !dragOK) return;
    const y = e.touches[0].clientY, now = performance.now(), dy = lastTY - y;
    velY = dy / Math.max(1, now - lastTT); lastTY = y; lastTT = now;
    freeSet(freeBase() + dy);
    e.preventDefault();
  }, { passive: false });
  function glide() {
    if (Math.abs(velY) < 0.03) return;
    freeSet(freeBase() + velY * 16); velY *= 0.94;
    freeRaf = requestAnimationFrame(glide);
  }

  function touchEndHandler(e) {
    if (isFree()) { if (dragOK && performance.now() - lastTT < 80) glide(); return; }
    if (isAnimating) return;
    if (Date.now() - lastWheelNavTime < WHEEL_COOLDOWN_MS) return;
    const touchEndY = e.changedTouches[0].screenY;
    const swipeDistance = touchStartY - touchEndY;
    if (Math.abs(swipeDistance) > 50) {
      const direction = swipeDistance > 0 ? 1 : -1;
      window.__wheelAbs = 0; window.__s3LastAbs = 0;
      window.__touchStep = true;
      const next = getNextSection(direction);
      window.__touchStep = false;
      if (next !== null) {
        lastWheelNavTime = Date.now();
        goToSection(next);
      }
    }
  }
  document.addEventListener('touchend', touchEndHandler);

  // ── keyboard focus follows into other sections ──
  // Every section is on one long strip that's slid into view, so Tab could
  // land on a link in a section that's off-screen. Bring that section in.
  // (If a slide is already running, check again once it's done, so
  // tabbing quickly through several sections still ends on the right one.)
  function followFocus() {
    const el = document.activeElement;
    const sec = el && el.closest && el.closest('#smooth-content > section');
    if (!sec) return;
    const idx = SECTION_IDS.indexOf('#' + sec.id);
    if (idx < 0 || idx === currentSection) return;
    if (isAnimating) { setTimeout(followFocus, 150); return; }
    goToSection(idx);
  }
  // Focusing something off-screen also makes the browser scroll its
  // clipped (overflow:hidden) containers to reveal it, which fights the
  // GSAP slide and leaves the page misaligned. Undo that native scroll —
  // the slide above (and the carousels' own paging) do the revealing.
  function undoNativeScroll(el) {
    for (let p = el && el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') p.scrollLeft = 0;
      if (cs.overflowY === 'hidden' || cs.overflowY === 'clip') p.scrollTop = 0;
    }
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
  }
  document.addEventListener('focusin', (e) => {
    undoNativeScroll(e.target);
    requestAnimationFrame(() => undoNativeScroll(e.target));
    followFocus();
  });
}

// Enter / Space on a role="button" element acts like a click
function onActivateKey(el, fn) {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  });
}

// ─── GO TO SECTION ─────────────────────────────────────────────
// ─── FREE SCROLL (Motion Off) ──────────────────────────────────
// With Motion Off there is no snapping or sliding: the page scrolls freely, like an ordinary web page.
const isFree = () => false;   // Motion Off keeps the section snapping (jumps instantly, no slide) — free scroll was juddery
let freeRaf = 0;
function freeBase() {
  const y = window.gsap ? parseFloat(window.gsap.getProperty(content, 'y')) : 0;
  return Math.abs(y) || 0;
}
function freeSet(y) {
  const max = Math.max(0, content.scrollHeight - window.innerHeight);
  y = Math.min(Math.max(y, 0), max);
  if (window.gsap) { window.gsap.killTweensOf(content); window.gsap.set(content, { y: -y }); }
  else content.style.transform = 'translateY(' + (-y) + 'px)';
  window.__freeScroll = true;
  syncVisuals(y);
  const mid = y + window.innerHeight / 2;
  let idx = 0;
  SECTION_IDS.forEach((id, i) => { const el = document.querySelector(id); if (el && el.offsetTop <= mid) idx = i; });
  if (idx !== currentSection) {
    currentSection = idx; window.currentSection = idx;
    if (idx === 2) completeDNA();
    updateNavUI(idx);
    if (window.sizeSection2) window.sizeSection2();
  }
}
// leaving Motion Off: settle back onto the nearest section
window.__snapSection = () => {
  window.__freeScroll = false;
  cancelAnimationFrame(freeRaf);
  goToSection(currentSection);
};

function completeDNA() {
  s3Progress = 2000; s3Completed = true;
  updateDNA(2000);
}
window.__completeDNA = completeDNA;

function goToSection(index) {
  if (window.__endReplay) window.__endReplay();   // a Motion Off replay never carries over into another section
  isAnimating = true;
  window.__sliding = true;   // heavy per-frame canvases/loops sit out the slide so it stays smooth
  clearTimeout(window.__slideT); window.__slideT = setTimeout(() => { window.__sliding = false; }, 2200);   // safety net
  currentSection = index;
  window.currentSection = index;
  const motionOff = window.MOTION_ENABLED === false;
  // Motion Off: no staged reveal. The DNA section is the finished page, titles are already in place.
  if (motionOff) {
    if (index === 2) completeDNA();
    settleTitleForSection(index);
  }

  const target = document.querySelector(SECTION_IDS[index]);
  if (!target) {
    isAnimating = false;
    window.__sliding = false;
    return;
  }

  // Compute target Y
  let targetY = target.offsetTop;
  // Fallback for section 1 if offsetTop is 0 (can happen)
  if (index === 1 && targetY === 0) {
    targetY = window.innerHeight;
  }

  const contentHeight = content.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = contentHeight - viewportHeight;
  targetY = Math.min(targetY, maxScroll);

  if (window.gsap) {
    window.gsap.to(content, {
      y: -targetY,
      // section slide-and-stick transition — intentionally NOT tied to the
      // Motion toggle, which only pauses decorative animations. Exception:
      // if the device asks for reduced motion, a big 1.4s full-screen slide
      // is exactly the kind of movement that can cause dizziness/nausea, so
      // it becomes a quick 0.3s move.
      duration: motionOff ? 0.01 : (prefersReducedMotion() ? 0.3 : 1.4),
      ease: 'power2.inOut',
      onUpdate: () => {
        const currentY = Math.abs(parseFloat(window.gsap.getProperty(content, 'y')));
        syncVisuals(currentY);
      },
      onComplete: () => {
        isAnimating = false;
        window.__sliding = false;
        syncVisuals(Math.abs(parseFloat(window.gsap.getProperty(content, 'y'))));   // settle the fade-ins on the final frame
        if (window.MOTION_ENABLED === false) settleTitleForSection(index);
        // If we reached Section 2, restart all reactor animations
        if (index === 1) {
          restartReactorAnimations();
          positionReactorLabels();
        }
        if (window.sizeSection2) window.sizeSection2();
      }
    });
  } else {
    // Fallback
    content.style.transition = 'transform 1.2s cubic-bezier(0.65, 0, 0.35, 1)';
    content.style.transform = `translateY(${-targetY}px)`;
    syncVisuals(targetY);
    setTimeout(() => {
      content.style.transition = '';
      isAnimating = false;
      window.__sliding = false;
      if (window.MOTION_ENABLED === false) settleTitleForSection(index);
      if (index === 1) {
        restartReactorAnimations();
        positionReactorLabels();
      }
      if (window.sizeSection2) window.sizeSection2();
    }, 1200);
  }

  updateNavUI(index);
}

function updateNavUI(index) {
  // Safari/iPhone tints its top and bottom bars from the theme colour and the page background: follow the section on screen
  const bar = SECTION_BARS[index];
  if (bar) {
    let tc = document.querySelector('meta[name="theme-color"]');
    if (!tc) { tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.appendChild(tc); }
    tc.content = bar;
    document.documentElement.style.backgroundColor = bar;
    document.body.style.backgroundColor = bar;
  }
  document.body.classList.toggle('nav-on-dark', index >= 3); // section-4 onward has a dark bg — fade nav to white
  document.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
    if (i === index) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
  });
  const navMap = { 0:'s1', 1:'s2', 2:'s2', 3:'s4', 4:'s5', 5:'s6' };
  const activeSection = navMap[index];
  document.querySelectorAll('.nav-link').forEach(link => {
    const on = link.getAttribute('data-section') === activeSection;
    link.classList.toggle('active', on);
    // Research covers two sections: underline the left half for part 1, the right half for DNA
    if (on && activeSection === 's2') link.dataset.half = index === 2 ? 'right' : 'left';
    else delete link.dataset.half;
  });
}

// ─── DNA SCROLLING ─────────────────────────────────────────────
function updateDNA(prog) {
  const scrollAmount = Math.min(prog / 500, 6);
  const nodes = document.querySelectorAll('.strand__node');
  const strands = document.querySelectorAll('.strand');
  if (window.MOTION_ENABLED !== false) {
    nodes.forEach(n => n.style.animationPlayState = 'running');
    strands.forEach(s => s.style.setProperty('--bar-animation', 'running'));
  }

  window.__dnaProgress = scrollAmount;
  if (window.dnaGlowRepaint) window.dnaGlowRepaint();
  const heading = document.querySelector('.dna-info h3');
  const items = document.querySelectorAll('.dna-info li');
  if (heading) heading.style.opacity = 1;   // heading is visible from the start; only the bullets wait for the scroll
  document.querySelectorAll('.dna-annot [data-at]').forEach(el => { el.style.opacity = Math.min(Math.max(scrollAmount - (+el.dataset.at), 0), 1); });
  const cue = document.getElementById('dnaCue');
  if (cue) cue.style.opacity = 1 - Math.min(Math.max(scrollAmount - 0.5, 0), 1);
  items.forEach((item, i) => {
    const start = 0.5 + i * 1.0;     // bullet i appears together with its label
    const o = Math.min(Math.max(scrollAmount - start, 0), 1);
    item.style.opacity = o;
    item.style.setProperty('--p', o);
    item.classList.toggle('on', o > 0.15);   // time-based icon animations start once the bullet shows
  });

  // 3rd bullet ("Biotech. compatibility"): one base is swapped for a non-natural one: its ball turns white, its letter becomes "π"
  const modStrand = strands[8], modNode = modStrand && modStrand.querySelector('.strand__node');
  if (modNode) {
    if (!modNode.dataset.orig) modNode.dataset.orig = modNode.style.getPropertyValue('--bg') || '';
    const on = scrollAmount >= 2.7;
    modNode.style.setProperty('--bg', on ? '#ffffff' : modNode.dataset.orig);
    modStrand.dataset.mod = on ? '1' : '';
    modNode.classList.toggle('beacon', on);
  }

  clearTimeout(window.dnaTimer);
  window.dnaTimer = setTimeout(() => {
    if (window.dnaSync) window.dnaSync();
    nodes.forEach(n => n.style.animationPlayState = '');
    strands.forEach(s => s.style.setProperty('--bar-animation', 'paused'));
  }, 100);
}

// ─── Expose for debugging ──
window.goToSection = goToSection;