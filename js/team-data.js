// Reads the roster from data/team.js (edit that file, not this one).
export const TEAM_MEMBERS = (window.TEAM_MEMBERS || []).slice();
if (!window.TEAM_MEMBERS) console.error('data/team.js did not load (check the <script> tag order).');

// always shown in surname order
const surname = m => m.name.trim().split(/\s+/).pop();
TEAM_MEMBERS.sort((a, b) => surname(a).localeCompare(surname(b), 'en', { sensitivity: 'base' }));

export function photoPath(initials) {
  const m = TEAM_MEMBERS.find(x => x.initials === initials);
  if (m && typeof m.photo === 'string') return `images/team/${m.photo}`;
  return `images/team/photo_${initials}.jpg`;
}
