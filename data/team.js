// ──────────────────────────────────────────────────────────────
//  TEAM ROSTER — the ONLY file you edit to add or remove people.
//  (No build step: save this file, refresh the browser.)
//
//  To add a team member:
//    1. Put their photo in  images/team/  (square-ish JPEG, about 600 px wide — see UPDATING.md for a one-line resize command).
//       Name it  photo_<INITIALS>.jpg  (e.g. photo_AB.jpg) — or use any file name and give it as  photo: 'my-file.jpg'  below.
//    2. Copy one line below and change it:
//         initials : two letters, used for the default photo name
//         name     : full name (the list sorts itself by surname)
//         title    : short label over the photo, top left  (PI, Postdoc, PhD Student, MChem Student, UROP …)
//         role     : longer role shown in the bio panel
//         bio      : optional paragraph shown when the photo is clicked
//         photo    : optional. false = no photo yet (shows the default avatar);
//                    'file.jpg' = a photo with a different file name
//  A person with no photo yet just shows the default avatar, so a new entry never shows a broken image.
// ──────────────────────────────────────────────────────────────

window.TEAM_MEMBERS = [
  {
    initials: 'JG',
    name: 'Jeffrey Gorman',
    title: 'PI',                       // short label shown over the photo (top left)
    role: 'Materials Research Fellow',
    bio: "Jeff leads the 'Excitonics and Photochemistry Lab' at Durham as the Materials Research Fellow. Jeff earned his PhD from Cambridge University in 2020, where he worked with Prof. Sir Richard Friend to pioneer new molecular assembly methods for semiconductors crucial for solar energy harvesting. He focused on deterministic, size-defined structures to study the evolution of excitons. Next, Jeff spent five years at MIT, working with Prof. Mark Bathe to develop DNA 'origami' nanoparticles that array hundreds of molecular systems with high spatial and orientation fidelity, advancing applications in molecular computing."
  },
  {
    initials: 'AW',
    name: 'Anna Wantenaar',
    title: 'MChem Student',
    role: 'MChem student',
    bio: "I'm Anna, a master's student at Durham University working on photoredox catalysis."
  },
  {
    initials: 'KM',
    name: 'Katharina Mills',
    title: 'UROP',
    role: 'Undergraduate summer research student',
    bio: "I'm Kat, an undergraduate summer research student. My project involves screening the triplet activity of photoredox catalysts and the synthesis of organic photosensitisers."
  },
  {
    initials: 'RL',
    name: 'Rebecca Lawson',
    title: 'PhD Student',
    role: 'PhD student',
    photo: false,   // photo: false = no photo yet, use the default avatar
    bio: "I'm Becca, a PhD student working on on-DNA semiconductor reactivity. I did my MChem at Newcastle University."
  },   // photo: false = no photo yet, use the default avatar
  {
    initials: 'JD',
    name: 'Jessica Dixon',
    title: 'MChem Student',
    role: 'MChem student',
    bio: "Hi! I'm Jess, a Masters student at Durham. My project is exploring organic dyes as visible light-activated photocages for biological molecules."
  },
  // ── Add new team members here (the list sorts itself by surname) ──
  // { initials: 'AB', name: 'Ada Bye', title: 'Postdoc', role: 'Postdoctoral researcher', bio: '...' },
];;
