// ──────────────────────────────────────────────────────────────
//  MOTION OFF: click / tap an animation to play it once.
//  - a tap is a short press that barely moves (a swipe or scroll is not a tap, so scrolling past never triggers it)
//  - the nav arrows, links, buttons and menus are never treated as the animation
//  - on phones the research columns are tap-to-expand: a tap on the animation of an OPEN column replays it,
//    anywhere else in the column still closes it (see s2-expand.js)
//  - the site's Motion setting stays Off (the switch is not touched); the animation stops by itself afterwards
// ──────────────────────────────────────────────────────────────
const REGIONS = [
  { sel: '#honeycomb-container', section: 1, ms: 9000, target: 'honeycomb' },
  { sel: '#reactor-site-wrapper', section: 1, ms: 7000, target: 'reactor' },
  { sel: '#dna-root', section: 2, ms: 6500, target: 'dna' }
];
const MAX_MOVE = 10;        // px a finger may drift and still count as a tap
const MAX_TIME = 600;       // ms
const SKIP = 'a, button, input, label, select, textarea, [role="button"], .section-nav, .navbar, .mobile-menu-overlay, .hamburger, .motion-switch, .s2-tab';
const phone = window.matchMedia('(max-width: 768px)');

let down = null, timer = 0, active = false;

function regionAt(x, y) {
  for (const r of REGIONS) {
    const el = document.querySelector(r.sel);
    if (!el) continue;
    const b = el.getBoundingClientRect();
    if (b.width && b.height && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return r;
  }
  return null;
}

export function endReplay() {
  clearTimeout(timer);
  if (!active) return;
  active = false;
  const cb = document.getElementById('motionCheckbox');
  if (cb && cb.checked) return;                     // the reader switched Motion On meanwhile: nothing to undo
  if (window.__replayMotion) window.__replayMotion(false);
}
window.__endReplay = endReplay;

function play(r) {
  if (!window.__replayMotion) return;
  clearTimeout(timer);
  window.__replayTap = true; setTimeout(() => { window.__replayTap = false; }, 400);   // the click that follows this tap must not also close the column
  active = true;
  window.__replayMotion(true, r.target);   // only the clicked animation plays; the other one stays still
  timer = setTimeout(endReplay, r.ms);
}

document.addEventListener('pointerdown', e => {
  if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) { down = null; return; }
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
}, { passive: true });
document.addEventListener('pointermove', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > MAX_MOVE) down = null;
}, { passive: true });
document.addEventListener('pointercancel', () => { down = null; }, { passive: true });
document.addEventListener('pointerup', e => {
  const d = down; down = null;
  if (!d || window.MOTION_ENABLED !== false) return;
  if (performance.now() - d.t > MAX_TIME || Math.hypot(e.clientX - d.x, e.clientY - d.y) > MAX_MOVE) return;
  if (window.__sliding || e.target.closest(SKIP)) return;
  const r = regionAt(e.clientX, e.clientY);
  if (!r || window.currentSection !== r.section) return;
  const s2 = document.getElementById('s2');
  if (r.section === 1 && phone.matches && !(s2 && /s2-open-/.test(s2.className))) return;   // closed column: the tap opens it instead
  play(r);
}, { passive: true });
