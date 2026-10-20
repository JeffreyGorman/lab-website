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
}