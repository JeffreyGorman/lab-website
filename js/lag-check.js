// ──────────────────────────────────────────────────────────────
//  LAG CHECK — once per page load.  If the device is clearly struggling, switch Motion off for this visit and flag it
//  ("Lag" beside the Motion switch, the switch glowing).  After that it is the reader's call: if they switch Motion back on,
//  it is not checked again.  Never saved as the reader's preference.
//    ?motion=on  → never check          ?lagtest  → pretend the device is slow (to see the notice)
// ──────────────────────────────────────────────────────────────
const MIN_FPS = 24;        // below this average frame rate (≈ a typical frame over 42 ms) counts as lag.  Battery-saver phones run at 30 fps: fine.
const WINDOW_MS = 3000;    // frame rate is averaged over a 3-second window (the average counts every slow frame, so uneven lag still shows)
const BAD_WINDOWS = 2;     // this many bad windows in a row before acting, so one busy moment never counts
const MAX_WINDOWS = 9;     // give up after this many windows (~27 s): the page is fine
const SETTLE_MS = 2500;    // let the page, fonts and hero video settle first

export function initLagCheck() {
  const q = new URLSearchParams(location.search);
  if (q.get('motion') === 'on') return;
  const force = q.has('lagtest');
  // laptops/desktops (mouse + 8 or more cores) are not checked: they can be busy for a moment but are not what this is for
  const strong = (navigator.hardwareConcurrency || 4) >= 8 && window.matchMedia && matchMedia('(pointer: fine)').matches;
  if (strong && !force) return;

  let bad = 0, windows = 0, done = false;
  document.addEventListener('change', e => { if (e.target && /^motionCheckbox/.test(e.target.id || '')) done = true; });   // the reader touched the switch: leave it to them

  function windowOnce() {
    let frames = 0, t0 = 0, spoiled = document.hidden || !!window.__sliding;
    const onVis = () => { spoiled = true; };
    document.addEventListener('visibilitychange', onVis);
    const f = t => {
      if (!t0) t0 = t;
      frames++;
      if (window.__sliding) spoiled = true;                    // a section slide is heavy by design: don't count it
      if (t - t0 < WINDOW_MS) return requestAnimationFrame(f);
      document.removeEventListener('visibilitychange', onVis);
      finish(frames / ((t - t0) / 1000), spoiled);
    };
    requestAnimationFrame(f);
  }
  function finish(fps, spoiled) {
    if (done || window.MOTION_ENABLED === false) return;       // already off (their setting, or the device's Reduce Motion), or they chose
    if (spoiled) return next();                                // measured while hidden or mid-slide: not a fair reading
    bad = (force || fps < MIN_FPS) ? bad + 1 : 0;
    if (bad >= BAD_WINDOWS) { if (window.__lagOff) window.__lagOff(); done = true; return; }
    next();
  }
  function next() { if (!done && ++windows < MAX_WINDOWS) setTimeout(windowOnce, 300); }
  // start SETTLE_MS after the page has loaded; on a slow device or connection 'load' can take very long (the hero video), so don't wait past 8 s
  let started = false;
  const go = () => { if (started) return; started = true; setTimeout(() => { if (!done && window.MOTION_ENABLED !== false) windowOnce(); }, SETTLE_MS); };
  if (document.readyState === 'complete') go(); else { window.addEventListener('load', go, { once: true }); setTimeout(go, 8000); }
}
