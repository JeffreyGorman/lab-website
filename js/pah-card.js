// Plays each card animation when its card scrolls into view, one after another (left to right):
// a card waits for the one before it to finish. Honours the site Motion toggle (window.MOTION_ENABLED / body.motion-off):
// with motion off it shows the finished frame. Figures with .pah-var groups (symmetry breaking) pick a random outcome on every play.
// The cards are built by js/pubs-render.js (from data/publications.js); wait until their animations are in the page.
(window.PUBS_READY || Promise.resolve()).then(function initPahCards() {
const motionOn = () => window.MOTION_ENABLED !== false && !document.body.classList.contains('motion-off');
const cards = [...document.querySelectorAll('.pah-card-svg')].map(svg => ({
  svg, zoomEl: svg.closest('[data-zoom]'), END: +svg.dataset.end || 8, vars: [...svg.querySelectorAll('.pah-var')], visible: false, playing: false, raf: 0, waiting: false, played: false
}));
// Portrait screens: the card that is playing grows to full width and the others shrink (see styles.css)
const grid = document.getElementById('pubsGrid');
const portrait = window.matchMedia('(max-aspect-ratio: 1/1)');
let focused = null;
function setFocus(c) {
  focused = c;
  if (!grid) return;
  const card = c && c.svg.closest('.pub-card');
  grid.querySelectorAll('.pub-card').forEach(el => el.classList.toggle('focus', el === card));
  grid.classList.toggle('has-focus', !!card);
}
const pick = c => { if (!c.vars.length) return; const k = Math.floor(Math.random() * c.vars.length); c.vars.forEach((v, i) => v.setAttribute('display', i === k ? 'inline' : 'none')); };
// A card inside a [data-zoom] holder (the PhD-advert card on the home page) grows vertically, in place, while it plays
// (title above, the picture wide, details below) and the rest of its section shrinks to make room, like the phone
// publication cards; when it finishes it settles back to the small card.
function flip(box, change) {
  const h0 = box.getBoundingClientRect().height; clearTimeout(box._ft);
  change(); box.style.height = ''; const h1 = box.getBoundingClientRect().height;
  box.classList.add('flipping'); box.style.overflow = 'hidden'; box.style.height = h0 + 'px'; void box.offsetHeight;
  box.style.transition = 'height 0.5s ease'; box.style.height = h1 + 'px';
  box._ft = setTimeout(() => { box.style.height = ''; box.style.transition = ''; box.style.overflow = ''; box.classList.remove('flipping'); }, 520);
}
function zoomIn(c) {
  const box = c.zoomEl.closest('.vacancy-mini'), sec = box.closest('section'); c.zoomed = true;
  flip(box, () => { box.classList.add('is-open'); if (sec) sec.classList.add('vacancy-open'); });
}
function zoomOut(c) {
  if (!c.zoomEl || !c.zoomed) return; c.zoomed = false; clearTimeout(c.zt);
  const box = c.zoomEl.closest('.vacancy-mini'), sec = box.closest('section');
  flip(box, () => { box.classList.remove('is-open'); if (sec) sec.classList.remove('vacancy-open'); });
}
const showEnd = c => { cancelAnimationFrame(c.raf); clearTimeout(c.zt); c.playing = false; if (focused === c) setFocus(null); c.svg.pauseAnimations(); c.svg.setCurrentTime(c.END); zoomOut(c); };
function finish(c) { c.playing = false; c.played = true; c.svg.pauseAnimations(); c.svg.dispatchEvent(new Event('pah-done')); if (c.zoomEl) c.zt = setTimeout(() => zoomOut(c), 1500); setTimeout(() => { if (focused === c && !c.playing) setFocus(null); }, 500); setTimeout(kick, 450); }
// after any card finishes (or is interrupted): start the first on-screen card that has not had its turn yet, so no card is left unplayed
function kick() {
  if (!motionOn() || cards.some(x => x.playing)) return;
  const n = cards.find(x => x.visible && !x.played && !x.waiting);
  if (n) play(n);
}
function play(c, force) {
  if (!force && !motionOn()) return showEnd(c);   // force = the reader pressed Replay: run once even with Motion Off
  cancelAnimationFrame(c.raf); pick(c); c.playing = true; if (!force) c.played = true;
  if (portrait.matches) setFocus(c);
  const start = () => {
    c.svg.setCurrentTime(0); c.svg.unpauseAnimations();
    const tick = () => { if (c.svg.getCurrentTime() >= c.END) finish(c); else c.raf = requestAnimationFrame(tick); };
    tick();
  };
  if (!c.zoomEl) return start();
  // grow first (once the page has stopped sliding), then run the animation at the bigger size
  const settle = () => { if (!c.playing) return; if (window.__sliding) return void (c.zt = setTimeout(settle, 120)); c.zt = setTimeout(() => { if (!c.playing) return; zoomIn(c); c.zt = setTimeout(() => { if (c.playing) start(); }, 600); }, 300); };
  settle();
}
function request(c) {
  // start now, unless an earlier card on screen is still playing: then wait for it
  const i = cards.indexOf(c);
  const prev = cards.slice(0, i).reverse().find(p => p.playing || p.waiting);
  if (!prev) return play(c);
  if (c.waiting) return;
  c.waiting = true;
  prev.svg.addEventListener('pah-done', () => { c.waiting = false; if (c.visible && !c.playing && !c.played) request(c); }, { once: true });
}
cards.forEach(c => {
  c.svg.pauseAnimations(); c.svg.setCurrentTime(c.END);   // start on the finished frame so there is always something to look at
  new IntersectionObserver(es => {
    const v = es[0].isIntersecting;
    if (v && !c.visible) { c.visible = true; request(c); }
    if (!v) { c.visible = false; c.waiting = false; showEnd(c); c.svg.dispatchEvent(new Event('pah-done')); }
  }, { threshold: 0.6 }).observe((c.zoomEl && c.zoomEl.closest('.vacancy-mini')) || c.svg);   // (a growing card is watched as a whole: its picture is clipped while the card changes height)
  // clicking (or pressing Enter on) the picture replays it once, even with Motion Off; the title links to the Publications page
  const holder = c.svg.closest('.pub-img') || c.svg.parentElement;
  // A reader's click always wins over the automatic sequence: any other card that is playing or queued is stopped on its
  // finished frame (and will still get its own turn afterwards, see kick())
  const go = () => {
    cards.forEach(o => { if (o === c) return; o.waiting = false; if (o.playing) { o.played = false; showEnd(o); } });
    c.waiting = false; play(c, true);
  };
  if (c.zoomEl) document.addEventListener('keydown', e => { if (e.key === 'Escape' && c.zoomed) showEnd(c); });
  if (c.zoomEl) document.addEventListener('click', e => { if (c.zoomed && !(e.target.closest && e.target.closest('.vacancy-mini'))) showEnd(c); });   // click anywhere outside the open card to close it   // (the thumbnail itself is a link to the Join page)
  else c.svg.addEventListener('click', go);
  if (holder && !c.zoomEl) holder.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
});
let last = motionOn();
new MutationObserver(() => { const now = motionOn(); if (now !== last) { last = now; cards.forEach(c => { if (c.visible) (now ? request(c) : showEnd(c)); }); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

});
