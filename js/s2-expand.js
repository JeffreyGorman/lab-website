// ──────────────────────────────────────────────────────────────
//  RESEARCH SECTION (phones): tap a column to expand it to ~88% of the screen
//  with the full paragraph; the other column shrinks to a narrow tab.
//  Tap the tab to swap, or tap the open column to go back to the split view.
//  The split view and everything on tablets/desktop is unchanged.
// ──────────────────────────────────────────────────────────────
const sec = document.getElementById('s2');
const L = document.getElementById('colLeft');
const R = document.getElementById('colRight');
const lw = document.getElementById('lw');
const rw = document.getElementById('rw');
const mq = window.matchMedia('(max-width: 768px)');
const BIG = 0.88;           // open column's share of the screen width
let open = null;            // 'left' | 'right' | null
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (isIOS) document.documentElement.classList.add('is-ios');

if (sec && L && R) {
  // small cues, built here so the markup stays as it was
  const mk = (col, title) => {
    const tab = document.createElement('div');
    tab.className = 's2-tab'; tab.setAttribute('aria-hidden', 'true'); tab.textContent = title;
    col.appendChild(tab);
    const wrap = col.querySelector('.truncatable-wrapper');
    if (wrap) {
      const hint = document.createElement('span');
      hint.className = 's2-hint'; hint.setAttribute('aria-hidden', 'true'); hint.textContent = '⤢ tap to expand';
      wrap.appendChild(hint);
    }
    col.setAttribute('aria-expanded', 'false');
  };
  mk(L, 'Excitonics'); mk(R, 'Photochemistry');

  let rebuilt = false, tRebuild;
  const settle = (rebuild) => {
    if (typeof window.sizeSection2 === 'function') window.sizeSection2();
    if (window.honeycombResize) window.honeycombResize();
    if (!rebuild || rebuilt) return;
    rebuilt = true;   // only ONE rebuild per expand/collapse: a second restart is what showed up as a flicker
    const off = window.MOTION_ENABLED === false;
    clearTimeout(tRebuild);
    // let the reactor re-measure itself first (this is what used to flip the arrows' layout late and reset them),
    // then rebuild, restart both animations from zero and reveal them in the very same moment
    if (window.reactorRefit) window.reactorRefit();   // (not a window 'resize': that also re-measures the big titles against the narrow column and shrinks them)
    tRebuild = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (window.rebuildPhotonArrows) window.rebuildPhotonArrows();
      if (off && window.freezeArrowsAtGoodFrame) window.freezeArrowsAtGoodFrame();   // motion off: show the resting frame straight away
      sec.classList.remove('s2-busy');
      if (window.restartReactorAnimations) window.restartReactorAnimations();
      if (window.honeycombRestart) window.honeycombRestart();
    })), 60);
  };
  let t1, t2, t3, t4;
  function commit(on) {
    sec.classList.toggle('s2-open-left', on === 'left');
    sec.classList.toggle('s2-open-right', on === 'right');
    window.S2_REACTOR_WIDE = (on === 'right');
    window.S2_LEGEND_RATIO = on === 'left' ? 0.36 : 0;
    window.S2_LEGEND_MIN_FS = on === 'left' ? 15 : 0;
    rebuilt = false; clearTimeout(tRebuild);
    sec.classList.add('s2-busy');   // hide the animations while the columns move and refit, so nothing flickers
    L.setAttribute('aria-expanded', String(on === 'left'));
    R.setAttribute('aria-expanded', String(on === 'right'));
    // the big title words follow their columns (the closed column's word gives way to its tab)
    const vw = window.innerWidth, d = (BIG / 2 - 0.25) * vw;
    const tr = 'translate .38s cubic-bezier(.4,0,.2,1), opacity .25s ease';;
    [lw, rw].forEach(w => { if (w) w.style.transition = tr; });
    if (lw) { lw.style.translate = on === 'left' ? d + 'px' : '0px'; lw.style.opacity = on === 'right' ? '0' : ''; }
    if (rw) { rw.style.translate = on === 'right' ? -d + 'px' : '0px'; rw.style.opacity = on === 'left' ? '0' : ''; }
    // once the columns have settled, let the animations refit the free space under the text
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    // iPhone/iPad: the columns switch at once (no width transition, so no transitionend either), so use short timers and bring the text back straight away
    const k = isIOS ? 0.3 : 1;
    if (isIOS) setTimeout(showText, 120);
    t1 = setTimeout(settle, 450 * k); t2 = setTimeout(settle, 700 * k); t3 = setTimeout(() => settle(true), 900 * k); clearTimeout(t4); t4 = setTimeout(() => sec.classList.remove('s2-busy'), 3500);   // safety net
  }

  // refit the animations the moment the columns have really finished moving (slow phones take longer than the timers)
  sec.addEventListener('transitionend', e => {
    if (e.target === sec && String(e.propertyName).indexOf('grid-template-columns') === 0) { settle(); settle(true); showText(); }
  });

  // Text moves calmly: it fades out first, the columns then change width while it is invisible (so no live re-wrapping),
  // and the new text (short or full) fades in once the columns have settled.
  let seq = 0, tHide, tShow;
  function showText() {
    sec.classList.add('s2-fadein');
    sec.classList.remove('s2-text-hide');
    setTimeout(() => sec.classList.remove('s2-fadein'), 500);
  }
  function apply() {
    const on = mq.matches ? open : null;
    const cur = sec.classList.contains('s2-open-left') ? 'left' : sec.classList.contains('s2-open-right') ? 'right' : null;
    if (on === cur) { commit(on); return; }
    // Motion off: nothing is animated, so there are no transitions to wait for -- switch at once
    if (window.MOTION_ENABLED === false || document.body.classList.contains('motion-off')) {
      seq++; clearTimeout(tHide); clearTimeout(tShow);
      sec.classList.remove('s2-text-hide', 's2-fadein');
      commit(on);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);   // the slower timers are only for animated transitions
      setTimeout(() => settle(true), 60);
      setTimeout(() => settle(false), 250);
      return;
    }
    const my = ++seq;
    clearTimeout(tHide); clearTimeout(tShow);
    sec.classList.remove('s2-fadein');
    sec.classList.add('s2-text-hide');
    tHide = setTimeout(() => { if (my === seq) commit(on); }, 100);
    tShow = setTimeout(() => { if (my === seq) showText(); }, 1500);      // safety net
  }
  window.s2ShowText = showText;

  [[L, 'left'], [R, 'right']].forEach(([col, side]) => {
    col.addEventListener('click', e => {
      if (!mq.matches || e.target.closest('a')) return;
      if (open === side && (window.MOTION_ENABLED === false || window.__replayTap) && e.target.closest('#honeycomb-container, #reactor-site-wrapper')) return;   // Motion Off: tapping the animation of an open column replays it (replay.js)
      open = (open === side) ? null : side;
      apply();
    });
  });

  // leaving the research section (or turning the phone / widening the window) resets to the split view
  setInterval(() => { if (open && window.currentSection !== 1) { open = null; apply(); } }, 250);
  const reset = () => { if (open || sec.classList.contains('s2-open-left') || sec.classList.contains('s2-open-right')) { open = null; apply(); } };
  if (mq.addEventListener) mq.addEventListener('change', reset);
  window.addEventListener('orientationchange', reset);
}
