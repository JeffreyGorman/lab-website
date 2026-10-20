// ──────────────────────────────────────────────────────────────
//  MAIN – imports and initialises all modules
// ──────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';
import { calculateOffsets, syncVisuals, settleTitleForSection, getTitleFinalBottom } from './title.js';
import { initNavigation } from './navigation.js';
import { initDNA } from './dna.js';
import { initHoneycomb } from './honeycomb.js';
import { initReactor, positionPhotonArrows, positionReactorLabels, restartReactorAnimations } from './reactor.js';
import { getVH, getVW, clamp } from './utils.js';
import { renderTeamTiles } from './team-render.js';
import { renderNewsStrip } from './news-render.js';
import { initDnaBackground } from './dna-bg.js';
import { initTeamBio } from './team-bio.js';
import './s2-expand.js';
import './replay.js';
if (/firefox|fxios/i.test(navigator.userAgent)) document.documentElement.classList.add('is-firefox');   // Firefox rasterises will-change layers at a fixed low resolution (blurry bulb/flask on phones)
if (/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)) document.documentElement.classList.add('is-safari');   // lets the CSS drop the effects Safari renders slowly
import { getStoredMotionPreference, setStoredMotionPreference } from './motion-state.js';

// ─── SECTION 2 SIZING ──────────────────────────────────────
function sizeSection2() {
  const vh = getVH();
  const lines = Math.max(3, Math.round(vh / 140));
  // Section 2 paragraphs only — team cards size their own text to the
  // space actually left in each card (see fitTeamCards in team-render.js)
  document.querySelectorAll('#s2 .truncatable-wrapper').forEach(el => {
    el.style.setProperty('--lines', lines);
  });

  const vw = getVW();
  const minPad = vh * 0.05;
  // ...and always below the title's resting place (on short screens,
  // e.g. phones held sideways, 25% of the height is above the title's bottom)
  const topPad = Math.max(vh * (CONFIG.TEXT_START_PERCENT / 100), minPad, getTitleFinalBottom() + 10);
  const bottomPad = clamp(vh * 0.02, 12, 30);
  const sidePad = clamp(vw * 0.03, 16, 50);
  const pad = topPad + 'px ' + sidePad + 'px ' + bottomPad + 'px';
  const colLeft = document.getElementById('colLeft');
  const colRight = document.getElementById('colRight');
  if (colLeft) colLeft.style.setProperty('--col-padding', pad);
  if (colRight) colRight.style.setProperty('--col-padding', pad);

  // Honeycomb / reactor max height
  const textHeight = clamp(vh * 0.12, 40, 90);
  const avail = vh - topPad - bottomPad - textHeight;
  const honeyMax = clamp(Math.min(avail * 0.9, vh * 0.45), 120, 640);
  const hc = document.getElementById('honeycomb-container');
  const rw = document.getElementById('reactor-site-wrapper');
  if (hc) hc.style.setProperty('--honeycomb-max-height', honeyMax + 'px');
  if (rw) {
    rw.style.height = honeyMax + 'px';
    rw.style.maxHeight = honeyMax + 'px';
  }

  // Stacked (tablet/phone) layout: the 45%-of-screen cap above left a
  // band of empty space under the honeycomb / reactor. Let each one grow
  // into whatever height its column actually has left below the text.
  if (window.matchMedia(`(max-width: ${CONFIG.REACTOR_VERTICAL_BREAKPOINT}px)`).matches) {
    [[colLeft, hc], [colRight, rw]].forEach(([col, el]) => {
      if (!col || !el) return;
      const grid = col.querySelector('.content-grid, .content-grid-reactor');
      const text = col.querySelector('.reveal');
      if (!grid || !text) return;
      const cs = getComputedStyle(col);
      const inner = col.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const free = inner - text.offsetHeight - (parseFloat(getComputedStyle(grid).rowGap) || 0) - 8;
      const reserve = document.getElementById('s2').className.indexOf('s2-open') >= 0 ? 56 : 0;   // opened wide: keep clear of the scroll-down arrow
      const h = Math.max(100, Math.min(free - reserve, vh * 0.65));
      if (el === hc) el.style.setProperty('--honeycomb-max-height', h + 'px');
      else { el.style.height = h + 'px'; el.style.maxHeight = h + 'px'; }
    });
  }

  // Re-check truncation
  setupTruncation();
  if (window.fitTeamCards) window.fitTeamCards();

  // Text size
  const textSize = clamp(vw * 0.013, 11, 18);
  document.querySelectorAll('.content-grid .reveal p, .content-grid-reactor .reveal p').forEach(p => {
    p.style.fontSize = textSize + 'px';
  });

  // Trigger photon arrows & labels reposition
  requestAnimationFrame(() => {
    positionPhotonArrows();
    positionReactorLabels();
  });
}
window.sizeSection2 = sizeSection2;

// ─── TRUNCATION DETECTION ──────────────────────────────────
function setupTruncation() {
  document.querySelectorAll('.truncatable-wrapper').forEach(wrapper => {
    const para = wrapper.querySelector('.truncatable-para');
    const arrow = wrapper.querySelector('.arrow-link');
    if (!para || !arrow) return;
    void para.offsetHeight;
    const overflowing = para.scrollHeight > para.clientHeight;
    if (overflowing) {
      wrapper.classList.add('is-truncated');
      arrow.style.display = 'inline-block';
    } else {
      wrapper.classList.remove('is-truncated');
      arrow.style.display = 'none';
    }
    arrow.removeEventListener('click', handleArrowClick);
    arrow.addEventListener('click', handleArrowClick);
  });
}

function handleArrowClick(e) {
  if (this.getAttribute('href') && this.getAttribute('href') !== '#') return; // real link (e.g. team card → Team page) — let it navigate
  e.preventDefault();
  if (this.id === 'arrowLeft' || this.id === 'arrowRight') return; // these navigate to research.html instead — see initArrowLinks()
  const wrapper = this.closest('.truncatable-wrapper');
  if (!wrapper) return;
  const expanded = wrapper.classList.toggle('expanded');
  this.textContent = expanded ? '←' : '→';
  this.setAttribute('aria-expanded', expanded);
}

// ─── ARROW LINKS (Section 2) — open the Research page ───
function initArrowLinks() {
  document.getElementById('arrowLeft')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'research.html';
  });
  document.getElementById('arrowRight')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'research.html';
  });
}

// Keeps the bottom-right corner label ("Department of Chemistry") sitting
// just above the scroll prompt ("What we do"), at any breakpoint — computed
// from the prompt's own fixed layout offset (its CSS `bottom` + its own
// height), NOT its live on-screen position. The prompt lives inside
// section-1, which the page's scroll transform moves off-screen as you
// scroll — reading getBoundingClientRect() there would capture wherever
// it happened to be at that moment (including scrolled away), and that
// wrong value would stick around even after scrolling back to section 1.
function positionBottomRightCornerLabel() {
  const label = document.querySelector('.hero-corner-label.bottom-right');
  const prompt = document.getElementById('scrollPrompt');
  if (!label || !prompt) return;
  const gap = 14; // px breathing room above the scroll prompt
  const promptBottom = parseFloat(getComputedStyle(prompt).bottom) || 40;
  label.style.bottom = (promptBottom + prompt.offsetHeight + gap) + 'px';
}

// Durham University aligns to the navbar logo's left edge; Department of
// Chemistry aligns to the right edge of the last nav item (or the
// hamburger button, when the full menu is collapsed on tablet/mobile).
// The navbar is position:fixed, so its rects are scroll-independent —
// safe to read directly, unlike the scroll-prompt-based calc above.
function alignCornerLabelsToNavbar() {
  const topLeft = document.querySelector('.hero-corner-label.top-left');
  const bottomRight = document.querySelector('.hero-corner-label.bottom-right');
  const logo = document.querySelector('.navbar-logo');
  if (topLeft && logo) {
    topLeft.style.left = logo.getBoundingClientRect().left + 'px';
  }
  if (bottomRight) {
    const menuLinks = document.querySelectorAll('.navbar-menu a');
    const hamburger = document.querySelector('.hamburger');
    const menuVisible = menuLinks.length && getComputedStyle(menuLinks[0].closest('.navbar-menu')).display !== 'none';
    const refEl = menuVisible ? menuLinks[menuLinks.length - 1] : hamburger;
    if (refEl) {
      const rect = refEl.getBoundingClientRect();
      bottomRight.style.right = (window.innerWidth - rect.right) + 'px';
    }
  }
}

// ─── MOTION TOGGLE ──────────────────────────────────────
window.MOTION_ENABLED = getStoredMotionPreference();
function initMotionToggle() {
  const checkboxes = [
    document.getElementById('motionCheckbox'),
    document.getElementById('motionCheckboxMobile')
  ].filter(Boolean);
  if (!checkboxes.length) return;

  // replay = a one-off "play this animation" while Motion is Off (see replay.js): same switching, but the switch, the stored setting,
  // the hero video and the section snapping are left alone
  function applyMotionState(enabled, persist = true, replay = false, target = null) {
    window.MOTION_ENABLED = enabled;
    window.__replayTarget = (replay && enabled) ? target : null;   // which single animation a click-to-replay is playing (null = all)
    if (persist && !replay) setStoredMotionPreference(enabled);
    // replaying only the honeycomb: keep the page-wide Motion-Off look so the reactor beside it stays still
    document.body.classList.toggle('motion-off', !enabled || window.__replayTarget === 'honeycomb');
    if (!replay) checkboxes.forEach(cb => { cb.checked = enabled; });

    const labelState = document.getElementById('motionLabelState');
    if (labelState && !replay) labelState.textContent = enabled ? 'On' : 'Off';

    // Hero video: pause/resume with motion
    const video = document.querySelector('.hero-video');
    if (video && !replay) {
      if (enabled) video.play().catch(() => {});
      else video.pause();
    }

    // Snap the photon arrows to a complete-looking frame (fully drawn,
    // both arrows + labels visible) instead of freezing wherever the
    // 6s cycle happened to land — it spends ~45% of each cycle with the
    // arrows invisible, which looks broken when frozen.
    if (!enabled && window.freezeArrowsAtGoodFrame) {
      window.freezeArrowsAtGoodFrame();
    }

    // Restart cleanly from the beginning when re-enabled — resuming
    // with the old elapsed-time clock caused a jump, since real time
    // kept advancing while paused.
    if (enabled) {
      if (window.__replayTarget !== 'honeycomb') restartReactorAnimations();
      if (replay) { document.body.classList.add('dna-restart'); void document.body.offsetWidth; document.body.classList.remove('dna-restart'); }
    } else {
      settleTitleForSection(window.currentSection !== undefined ? window.currentSection : 0);
      if (window.currentSection === 2 && window.__completeDNA) window.__completeDNA();
      // switching Motion Off while the helix was moving left it frozen on whatever frame it had reached; restart its
      // animations so it stops on the proper still frame (white base on a full-width rung)
      document.body.classList.add('dna-restart'); void document.body.offsetWidth; document.body.classList.remove('dna-restart');
    }
    if (window.honeycombRedraw) window.honeycombRedraw();
    if (enabled && window.honeycombRestart) window.honeycombRestart();
    if (enabled && !replay && window.__snapSection) window.__snapSection();   // Motion On again: snap back onto the nearest section
  }

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => { if (window.__endReplay) window.__endReplay(); applyMotionState(cb.checked); });
  });
  window.__replayMotion = (on, target) => applyMotionState(on, false, true, target);

  // Sync UI/state to whatever was stored from a previous page, if it's off
  if (window.MOTION_ENABLED === false) {
    applyMotionState(false, false);
  }
}

// ─── RESIZE OBSERVER ──────────────────────────────────────
function setupResizeObserver() {
  const s2 = document.getElementById('s2');
  if (!s2) return;
  // One coalesced relayout per frame (Safari fires resize, ResizeObserver and visualViewport together, many times a second
  // while a window is dragged, and re-measuring on each one made the DNA/reactor judder).
  let raf = 0, lw = 0, lh = 0;
  const relayout = (delay) => {
    cancelAnimationFrame(raf);
    const run = () => { raf = requestAnimationFrame(() => {
      sizeSection2();
      calculateOffsets();
      positionPhotonArrows();
      positionReactorLabels();
      positionBottomRightCornerLabel();
      alignCornerLabelsToNavbar();
    }); };
    if (delay) setTimeout(run, delay); else run();
  };
  const ro = new ResizeObserver(() => {
    const r = s2.getBoundingClientRect();
    if (Math.abs(r.width - lw) < 1 && Math.abs(r.height - lh) < 1) return;
    lw = r.width; lh = r.height; relayout();
  });
  ro.observe(s2);
  window.addEventListener('resize', () => relayout());
  // orientationchange: wait for Safari to finish its own reflow
  window.addEventListener('orientationchange', () => relayout(300));
  if (window.visualViewport) {
    let vw = window.visualViewport.width, vh = window.visualViewport.height;
    window.visualViewport.addEventListener('resize', () => {
      const v = window.visualViewport;
      if (Math.abs(v.width - vw) < 1 && Math.abs(v.height - vh) < 1) return;
      vw = v.width; vh = v.height; relayout();
    });
  }
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // keep the hero tint in step with --color-secondary
  (function () {
    const f = document.getElementById('heroTint'); if (!f) return;
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim().replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return;
    ['R', 'G', 'B'].forEach((ch, i) => {
      const c = parseInt(hex.substr(i * 2, 2), 16) / 255, fn = f.querySelector('feFunc' + ch);
      if (fn) { fn.setAttribute('slope', (1 - c).toFixed(4)); fn.setAttribute('intercept', c.toFixed(4)); }
    });
  })();
  // Hero video only plays while the hero is on screen (a 1440p video with a grayscale filter was decoding behind every section)
  (function () {
    const v = document.querySelector('.hero-video');
    if (!v || !('IntersectionObserver' in window)) return;
    let vis = true;
    new IntersectionObserver(es => {
      vis = es[es.length - 1].isIntersecting;
      if (vis && window.MOTION_ENABLED !== false) v.play().catch(() => {}); else v.pause();
    }).observe(v);
    document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); else if (vis && window.MOTION_ENABLED !== false) v.play().catch(() => {}); });
  })();
  renderTeamTiles(document.getElementById('teamTiles'));
  try { renderNewsStrip(document.getElementById('newsStripList'), 3); } catch (e) { console.warn('News strip failed:', e); }
  try {
    initTeamBio();
  } catch (e) {
    console.warn('Team bio panel init failed:', e);
  }
  try {
    initDnaBackground();
  } catch (e) {
    console.warn('DNA background init failed:', e);
  }
  document.documentElement.style.setProperty('--team-photo-filter-color-1', CONFIG.TEAM_PHOTO_FILTER_COLOR_1);
  document.documentElement.style.setProperty('--team-photo-filter-color-2', CONFIG.TEAM_PHOTO_FILTER_COLOR_2);
  document.body.classList.toggle('team-photo-filter-off', !CONFIG.TEAM_PHOTO_FILTER_ENABLED);
  sizeSection2();
  calculateOffsets();
  syncVisuals(0);
  if (window.gsap) {
    window.gsap.set(document.getElementById('smooth-content'), { y: 0 });
  } else {
    console.warn('GSAP not loaded yet — skipping gsap.set, continuing init.');
  }
  setupTruncation();
  initNavigation();
  initHoneycomb();
  initReactor();
  initDNA();
  initArrowLinks();
  setupResizeObserver();
  initMotionToggle();
  positionBottomRightCornerLabel();
  alignCornerLabelsToNavbar();

  // Extra call after layout settles
  setTimeout(() => {
    sizeSection2();
    calculateOffsets();
    positionPhotonArrows();
    positionReactorLabels();
    positionBottomRightCornerLabel();
    alignCornerLabelsToNavbar();
  }, 500);

  // Carousels – fail silently if something's wrong
});