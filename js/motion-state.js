// ──────────────────────────────────────────────────────────────
//  MOTION STATE — shared Motion on/off preference, persisted via
//  localStorage so it carries over between index.html, research.html,
//  publications.html, and join.html.
// ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'expLabMotionEnabled';

export function getStoredMotionPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // No choice made yet → follow the device's "Reduce motion" setting
    // (iOS/macOS/Windows/Android accessibility option). Anyone who has
    // asked their device for less motion starts with Motion: Off.
    if (stored === null) return !prefersReducedMotion();
    return stored === 'true';
  } catch (e) {
    return true; // localStorage unavailable (e.g. private browsing) — default on
  }
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

export function setStoredMotionPreference(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (e) {
    // ignore — localStorage unavailable
  }
}
