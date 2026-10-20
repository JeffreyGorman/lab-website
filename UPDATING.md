# Updating the ExP Lab website

Everyday content lives in three plain files in the `data/` folder. **Edit, save, refresh the browser. There is no build step.**

| To change… | Edit this file |
|---|---|
| People on the team | `data/team.js` (+ a photo in `images/team/`) |
| Publications (list, cards and animations) | `data/publications.js` (+ animation files in `animations/`) |
| News items | `data/news.js` |

> To preview locally, serve the folder (opening `index.html` by double-click will not load the animations):
> `cd` into the site folder and run `python3 -m http.server 8000`, then open <http://localhost:8000>.

---

## Add a team member

1. Make a web-ready photo (square-ish, about 700 px wide, under 100 KB). On a Mac, one command does it:
   `sh tools/add-team-photo.sh ~/Downloads/their-photo.png AB`   → creates `images/team/photo_AB.jpg`
   (no photo yet? skip this, and put `photo: false` on their line, the default avatar is shown).
2. Open `data/team.js`, copy one line, change it:
   ```js
   { initials: 'AB', name: 'Ada Byte', title: 'Postdoc', role: 'Postdoctoral researcher', bio: 'A sentence or two…' },
   ```
   `title` is the label over the photo (PI, Postdoc, PhD Student, MChem Student, UROP…). The list sorts itself by surname and the grid works out its own rows and columns.
3. To remove someone, delete their line.

## Add a publication (no animation)

Open `data/publications.js` and copy this block to the top of the list:
```js
{ year: 2027, topics: ['dna'], title: 'Title of the paper', url: 'https://doi.org/…',
  authors: 'A. Student, J. Gorman*', journal: 'Nature, 1, 1–10' },
```
- `topics`: any of `'dna'`, `'excitons'`, `'other'` (these drive the filter chips).
- "J. Gorman" is made bold automatically (with or without the `*`).
- The Publications page sorts by year and rebuilds its year filter by itself.

## Add a publication animation (figure on the Publications page and/or a homepage card)

1. Put the animated SVG(s) in `animations/`, e.g. `animations/nature-2027-figure.svg` (and `-card.svg` if the homepage card should be cropped differently).
   An animation is a normal SVG that uses SVG's built-in `<animate>` tags with times in seconds. Use the site colour variables (`var(--pah-line)`, `var(--pah-face)`, `var(--honeycomb-bullet-active-photon)` …) as in the existing ones, copy `animations/jacs-2026-figure.svg` as a starting point. (Claude can build one from a description of the science.)
2. In the paper's block in `data/publications.js` add an `id` and a `figure` and/or `card`:
   ```js
   { id: 'nature-2027', year: 2027, topics: ['dna'], title: '…', url: '…', authors: '…', journal: '…',
     figure: { file: 'animations/nature-2027-figure.svg', end: 9,
               legend: [ ['photon','PHOTON ABSORBED', 2.0, 3.0], ['energy','ENERGY TRANSFER', 3.0, 6.0] ],
               caption: 'One or two sentences describing the figure.' },
     card:   { file: 'animations/nature-2027-card.svg', end: 9, label: 'Nature (2027)' },
   },
   ```
   - `end` = how many seconds the animation lasts (the page freezes on the last frame; Replay restarts it).
   - `legend` is optional: `[colour, label, lights up at (s), switches off at (s)]`; colours are `'photon'`, `'energy'`, `'electron'`.
   - The homepage shows the **first three papers (newest first) that have a `card`**.
   - Want randomised outcomes on each play? Wrap the alternatives in `<g class="pah-var">…</g>` groups (see `chem-2024-figure.svg`).

## Add a news item

In `data/news.js`, copy one line to the **top** of the list (`date`, `text`, optional `more` and `url`). The homepage shows the latest 3, `news.html` shows all.

---

## Publishing

The site is plain files, Cloudflare serves whatever is in the GitHub repo. `.gitignore` already keeps these out of the repo: `_to_delete/`, `_source_media/` (original big video and PNG photos), `*.bak*` files and `.DS_Store`. So: edit, preview, `git add -A`, commit, push. Cloudflare redeploys.

If you cannot see a change after deploying, hard-refresh (⇧⌘R). Big media (images, video, fonts) is cached by browsers on purpose (see `_headers`): if you replace a photo, give the new file a new name.

## Only needed when you change the *design* (rare)

Layout/animation code is in `css/` and `js/`. The homepage loads minified bundles (`css/styles.min.css`, `js/main.min.js`, `js/pah-card.min.js`). After editing `css/styles.css` or any `js/*.js` (other than `contact.js` / `pubs-render.js`), run `sh build.sh` (needs Node) and bump the `?v=…` number on the script/CSS links in `index.html` so browsers fetch the new files.
