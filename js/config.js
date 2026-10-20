// ──────────────────────────────────────────────────────────────
//  CONFIG – change any value below to tweak the site
// ──────────────────────────────────────────────────────────────

export const CONFIG = {
  // ----- TITLE ANIMATION -----
  TITLE_FINAL_PERCENT: 15,   // % from top of viewport when Section 2 is reached
  TITLE_OFFSET_VH: 0.02,     // extra % of viewport height to compensate for title height
  TEXT_START_PERCENT: 25,    // % from top where text starts in Section 2

  // ----- TITLE HERO ZOOM (big "ExP Lab" that shrinks as it splits) -----
  TITLE_START_WIDTH: 0.3,        // "ExP" width as a fraction of screen width in the hero (0.3 = 30%)
  TITLE_START_MAX_HEIGHT: 0.2,    // ...but the "ExP / Lab" block never taller than this fraction of screen height
  TITLE_START_MAX_SCALE: 6,      // ...and never more than this many times the end size
  TITLE_END_MAX_COL_FRACTION: 0.88, // split words must fit within this fraction of their column (auto-shrinks font if not)

  // ----- REACTOR (3D bulb & flask) -----
  REACTOR_SIZE_MULTIPLIER: 1, // overall size multiplier (1 = default)

  // ----- PHOTON ARROWS (light beam) -----
  PHOTON_ARROW_START_OFFSET: -30,  // px from bulb's right edge (negative = move left)
  PHOTON_ARROW_END_OFFSET: -20,    // px from flask's left edge (negative = move left)
  PHOTON_ARROW_FAN_HEIGHT_RATIO: 0.6, // fan height = beam width * this
  PHOTON_ARROW_FAN_HEIGHT_MAX: 160,   // max fan height in px (at 1x scale)

  // ----- PHOTOREDOX LABEL (under the flask) -----
  PHOTOREDOX_OFFSET_X: 0,    // px from flask centre (positive = right)
  PHOTOREDOX_OFFSET_Y: 60,   // px from flask bottom (positive = down)
  LIGHT_ABOVE_BULB_OFFSET: 10, // px above the bulb for the LIGHT label (side-by-side layout, at 1x scale)

// ----- REACTOR RESPONSIVE (vertical stacking) -----
// 1024 = shared "tablet + mobile" breakpoint (see styles.css) so iPad and
// phone both get the vertical/stacked reactor layout; anything wider
// (laptop/desktop) keeps the horizontal layout, just scaled.
REACTOR_VERTICAL_BREAKPOINT: 1024,
// Phones held sideways: short, wide screens. These keep the side-by-side
// reactor (there's width to spare but no height) and get the compact
// layout in the "SHORT LANDSCAPE" block at the end of styles.css —
// keep the 500px there in step with this.
SHORT_LANDSCAPE_QUERY: '(orientation: landscape) and (max-height: 500px)',

// --- sizing & layout ---
VERTICAL_SCALE_MULTIPLIER: 1,     // overall size of the stacked (tablet/phone) bulb + flask — they now fill the space available (width AND height); lower to shrink
VERTICAL_SCALE_MAX: 0.45,        // absolute cap on the stacked scale (0.45 = 225px boxes) so tablets don't get oversized
VERTICAL_WIDTH_FILL: 0.95,       // how much of the column width the flask may use (0.95 = 95%)
// (the gap between bulb and flask is --reactor-vertical-gap in styles.css)
VERTICAL_BULB_FLEX: 1,
VERTICAL_FLASK_FLEX: 1,

// --- arrow gaps (vertical) ---
VERTICAL_ARROW_START_OFFSET: 25,    // no gap = 0 – arrows start right at bulb bottom
VERTICAL_ARROW_END_OFFSET: 25,      // 0 = no gap – arrows end right at flask top

// --- arrows ---
VERTICAL_ARROW_WIDTH_RATIO: 0.4,   // wider arrows
VERTICAL_ARROW_RAY_COUNT: 3,       // more rays for visibility

// --- labels ---
VERTICAL_LIGHT_ABOVE_BULB: true,   // LIGHT above bulb
VERTICAL_LIGHT_OFFSET: 8,
VERTICAL_PHOTOREDOX_OFFSET_Y: 10,

// --- 3D tilt ---
HORIZONTAL_TILT_DEG: 5,
VERTICAL_TILT_DEG: 5,              // keep small – container already has -20deg rotateX

  // ----- HONEYCOMB -----
  HEX_GRID_RADIUS: 5,        // larger = more hexagons
  HOP_INTERVAL: 35,          // frames between exciton hops
  GLOW_DECAY: 0.975,         // glow fade speed (0–1, lower = faster fade)
  TRAIL_DECAY: 0.99,         // trail fade speed

  // ----- HONEYCOMB LABELS (edit these strings) -----
  HONEYCOMB_LABELS: [
    { key: 'photon', text: 'PHOTON ABSORBED' },
    { key: 'energy', text: 'ENERGY TRANSFER' },
    { key: 'electron', text: 'CHARGE TRANSFER' }
  ],

    // ----- HONEYCOMB LABEL POSITION (canvas) -----
  HONEYCOMB_LABEL_OFFSET_X: 0,    // positive = right, negative = left (was 50, tuned for the old left-aligned layout; now centered under the grid by default)
  HONEYCOMB_LABEL_OFFSET_Y: 0,   // negative = up, positive = down (was -20, a workaround for the old overlap — no longer needed)
  HONEYCOMB_LEGEND_HEIGHT_RATIO: 0.24, // fraction of canvas height reserved for the legend band below the grid (grid no longer overlaps it)

  // ----- DNA -----
  // A–T pair, then C–G pair (first colour = first base). G is a mid purple so it no longer matches the page background.
  DNA_PAIR_COLORS: [
    ['#b22d64', '#D4A5C3'],
    ['#4B3B61', '#7653b0']
  ],
  DNA_PAIR_BASES: [['A', 'T'], ['C', 'G']],
  DNA_BASE_COLORS: { A: '#b22d64', T: '#D4A5C3', C: '#4B3B61', G: '#7653b0' },
  DNA_TOTAL_PAIRS: 13,

  // ----- NAVIGATION (section order & labels) -----
  SECTION_IDS: ['#s1', '#s2', '#s3', '#s4', '#s5', '#s6'],
  SECTION_LABELS: ['Home', 'Research', 'DNA', 'Team', 'Publications', 'Join'],

  // ----- PLACEHOLDER ALERTS (for arrow links in Section 2) -----
  // NOTE: the section-2 arrows now navigate straight to research.html (see main.js initArrowLinks()) — no alert text needed anymore.

  // ----- TEAM PHOTO COLOR FILTER -----
  // Toggle on/off, and set the two gradient colors, for the brand-tint
  // overlay shown over every team photo (carousel + Team Members page).
  TEAM_PHOTO_FILTER_ENABLED: true,
  TEAM_PHOTO_FILTER_COLOR_1: 'rgba(184,165,214,0.45)', // purple
  TEAM_PHOTO_FILTER_COLOR_2: 'rgba(200,149,189,0.45)', // pink
};