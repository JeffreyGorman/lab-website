// ──────────────────────────────────────────────────────────────
//  TEAM RENDER — builds the homepage team grid from team-data.js.
//  Each tile is a photo + name (a button: click → bio panel, see
//  js/team-bio.js).
// ──────────────────────────────────────────────────────────────

import { TEAM_MEMBERS, photoPath } from './team-data.js';

const DEFAULT_PHOTO = 'images/team/default.png';

// A photo <img> that falls back to a default avatar if the person's own
// photo doesn't exist yet, and to an initials circle as a last resort
// if even the default avatar is missing.
export function buildPhotoEl(member) {
  const wrap = document.createElement('div');
  wrap.className = 'team-photo member-photo';

  const img = document.createElement('img');
  // dummy/placeholder people go straight to the default avatar (no 404 first)
  img.src = (member.dummy || member.photo === false) ? DEFAULT_PHOTO : photoPath(member.initials);
  img.alt = member.name;

  img.addEventListener('error', () => {
    if (img.src.indexOf(DEFAULT_PHOTO) === -1) {
      img.src = DEFAULT_PHOTO; // try the shared default avatar next
      return;
    }
    // Default avatar is also missing — fall back to an initials circle
    wrap.querySelectorAll('img').forEach(i => i.remove());   // (keep the role label, if any)
    const placeholder = document.createElement('div');
    placeholder.className = 'team-photo-placeholder';
    placeholder.textContent = member.initials;
    wrap.appendChild(placeholder);
  });

  wrap.appendChild(img);
  return wrap;
}

// Column/row counts are set from the headcount so the grid stays balanced
// and fits on one screen — see .team-tiles in css/styles.css. Four layouts:
//   d   desktop / tablet: 1–4 people one row · 5–6: 3 cols · 7–8: 4 · 9: 3×3 · 10–12: 4×3
//   p3  tall phones (≥ ~19:9): 3 columns
//   p4  shorter phones (16:9 and the like): 4 columns
//   l   short landscape phones: two rows
function shape(cols, n) { return { cols, rows: Math.ceil(n / cols) }; }
// phones: pick the column count (2..max) that leaves the fewest empty cells,
// then the most square-looking grid (5 -> 3+2, 9 -> 3x3, 16 -> 4x4, 6 -> 3x2)
function squareish(n, max) {
  if (n <= 2) return shape(Math.max(n, 1), n);
  let best = null;
  for (let c = 2; c <= Math.min(max, n); c++) {
    const r = Math.ceil(n / c), empty = c * r - n, skew = Math.abs(c - r);
    const score = empty * 10 + skew;
    if (!best || score < best.score || (score === best.score && c > best.c)) best = { c, score };
  }
  return shape(best.c, n);
}
function gridShapes(n) {
  let d;
  if (n <= 4) d = Math.max(n, 1);
  else if (n <= 6) d = 3;
  else if (n <= 8) d = 4;
  else if (n === 9) d = 3;
  else d = 4;
  const m = Math.max(n, 1);
  // wide desktop/laptop screens: one or two broad rows (photos get much bigger)
  const w = n <= 6 ? m : Math.min(6, Math.ceil(n / 2));
  return {
    w: shape(w, n),
    d: shape(d, n),
    p3: squareish(n, 3),
    p4: squareish(n, 4),
    l: shape(Math.min(Math.ceil(n / 2), 6), n)
  };
}

export function renderTeamTiles(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  TEAM_MEMBERS.forEach(member => {
    const li = document.createElement('li');
    li.className = 'team-tile';
    // the whole tile is a button: click → bio panel (js/team-bio.js)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'team-tile-btn';
    btn.dataset.initials = member.initials;
    btn.setAttribute('aria-haspopup', 'dialog');
    const photoEl = buildPhotoEl(member);
    if (member.title) {            // role label in the photo's top-left corner
      const tag = document.createElement('span');
      tag.className = 'team-photo-title';
      tag.textContent = member.title;
      photoEl.appendChild(tag);
    }
    btn.appendChild(photoEl);
    const name = document.createElement('span');
    name.className = 'team-tile-name';
    name.textContent = member.name;
    btn.appendChild(name);
    li.appendChild(btn);
    containerEl.appendChild(li);
  });
  const sh = gridShapes(TEAM_MEMBERS.length);
  Object.entries(sh).forEach(([k, v]) => {
    containerEl.style.setProperty(`--cols-${k}`, v.cols);
    containerEl.style.setProperty(`--rows-${k}`, v.rows);
  });
}
