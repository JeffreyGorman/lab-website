// ──────────────────────────────────────────────────────────────
//  DNA – builds and animates the DNA helix
// ──────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';

const { DNA_PAIR_COLORS, DNA_TOTAL_PAIRS, DNA_PAIR_BASES } = CONFIG;

export function initDNA() {
  const dnaRoot = document.getElementById('dna-root');
  if (!dnaRoot) return;
  dnaRoot.style.setProperty('--total', DNA_TOTAL_PAIRS);

  for (let i = 1; i <= DNA_TOTAL_PAIRS; i++) {
    const strand = document.createElement('div');
    strand.className = 'strand';
    strand.style.setProperty('--index', i);
    const node1 = document.createElement('div');
    node1.className = 'strand__node';
    const node2 = document.createElement('div');
    node2.className = 'strand__node';
    strand.appendChild(node1);
    strand.appendChild(node2);
    dnaRoot.appendChild(strand);
  }

  document.querySelectorAll('.strand').forEach(strand => {
    const nodes = strand.querySelectorAll('.strand__node');
    const pi = Math.floor(Math.random() * DNA_PAIR_COLORS.length);
    const pair = DNA_PAIR_COLORS[pi];
    const bases = DNA_PAIR_BASES[pi];
    const flipped = Math.random() > 0.5;
    if (nodes.length === 2) {
      nodes[0].style.setProperty('--bg', flipped ? pair[0] : pair[1]);
      nodes[1].style.setProperty('--bg', flipped ? pair[1] : pair[0]);
      strand.dataset.left = flipped ? bases[0] : bases[1];    // the base each ball stands for (used by the background letters)
      strand.dataset.right = flipped ? bases[1] : bases[0];
    }
  });

  // (helix animation is now handled entirely by CSS :hover — see styles.css)
  startHelixSync();
}

// Keep the balls and bars in step.  Each ball and each bar runs its own CSS animation; on a slow or busy phone they can start,
// pause or resume a frame or two apart, and the gaps add up: the helix goes lopsided and the bars drift off their balls.
// Every second (and after each play/pause) put them all back on one shared clock; their different delays still give the helix its shape.
export function syncHelix() {
  if (window.MOTION_ENABLED === false || !document.getAnimations) return;
  const list = document.getAnimations().filter(a => (a.animationName === 'jump' || a.animationName === 'scale')
    && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.dna'));
  if (list.length < 2) return;
  const ref = list.find(a => a.playState === 'running') || list[0];
  const t = ref.currentTime;
  if (t == null) return;
  list.forEach(a => { if (a !== ref && a.playState === ref.playState && Math.abs((a.currentTime || 0) - t) > 16) a.currentTime = t; });
}
function startHelixSync() {
  window.dnaSync = syncHelix;
  setInterval(() => { if (!document.hidden && !document.body.classList.contains('dna-off')) syncHelix(); }, 1000);
}