// ──────────────────────────────────────────────────────────────
//  TEAM BIO PANEL — click a photo on the homepage grid and that
//  person's bio opens in a panel while the grid blurs behind it.
//
//  Close it by: the × button · clicking anywhere on the blurred
//  background · pressing Esc · scrolling to another section.
//  (Focus goes to the × when it opens and back to the photo you
//  clicked when it closes, so keyboard users aren't lost.)
//
//  Markup lives in index.html (#teamBio); styles in css/styles.css
//  (.team-bio, .team-tiles.is-dimmed).
// ──────────────────────────────────────────────────────────────

import { TEAM_MEMBERS } from './team-data.js';
import { buildPhotoEl } from './team-render.js';

export function initTeamBio() {
  const grid = document.getElementById('teamTiles');
  const panel = document.getElementById('teamBio');
  const section = document.getElementById('s4');
  if (!grid || !panel || !section) return;

  const photoSlot = panel.querySelector('.team-bio-photo');
  const nameEl = panel.querySelector('.team-bio-name');
  const roleEl = panel.querySelector('.team-bio-role');
  const textEl = panel.querySelector('.team-bio-text');
  const closeBtn = panel.querySelector('.team-bio-close');
  let lastBtn = null;

  const isOpen = () => panel.classList.contains('is-open');

  function open(member, btn) {
    lastBtn = btn;
    photoSlot.innerHTML = '';
    photoSlot.appendChild(buildPhotoEl(member));
    nameEl.textContent = member.name;
    roleEl.textContent = member.role || '';
    roleEl.hidden = !member.role;
    textEl.textContent = member.bio || '';
    textEl.hidden = !member.bio;
    panel.scrollTop = 0;
    panel.classList.add('is-open');
    grid.classList.add('is-dimmed');
    grid.inert = true;            // keeps focus + stray clicks off the blurred grid
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen()) return;
    panel.classList.remove('is-open');
    grid.classList.remove('is-dimmed');
    grid.inert = false;
    if (lastBtn) lastBtn.focus({ preventScroll: true });
  }

  // open: click on a photo/name
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.team-tile-btn');
    if (!btn || isOpen()) return;
    const member = TEAM_MEMBERS.find(m => m.initials === btn.dataset.initials);
    if (member) open(member, btn);
  });

  // close: × button, anything outside the panel, Esc
  closeBtn.addEventListener('click', close);
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (panel.contains(e.target)) return;
    if (e.target.closest('.team-tile-btn')) return; // the click that just opened it
    close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // close if the visitor scrolls on to another section
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      if (entries.some(en => en.intersectionRatio < 0.3)) close();
    }, { threshold: [0, 0.3, 1] }).observe(section);
  }
}
