// ──────────────────────────────────────────────────────────────
//  UTILITY FUNCTIONS – used across multiple modules
// ──────────────────────────────────────────────────────────────

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function getVH() {
  return window.innerHeight;
}

export function getVW() {
  return window.innerWidth;
}

/**
 * Read a CSS custom property from the root element.
 * @param {string} name - e.g. '--font-size-base'
 * @param {string} fallback - value if property not found
 * @returns {string}
 */
export function getCSSVar(name, fallback = '14px') {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

/**
 * Parse a CSS variable that holds a pixel value, returning a number.
 */
export function getCSSVarNum(name, fallback = 14) {
  const str = getCSSVar(name, fallback + 'px');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}