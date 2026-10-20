// ──────────────────────────────────────────────────────────────
//  CAROUSEL – responsive page‑based carousel (shared by Team and
//             Publications sections)
// ──────────────────────────────────────────────────────────────

// options:
//   trackId, dotsId          - element IDs for the track and dots container
//   prevBtnId, nextBtnId     - element IDs to use for the nav buttons
//   sectionId                - section ID, used for the one-time swipe hint
//   slidesPerViewFn          - () => number of cards visible at once
//   instanceKey              - property name to expose on window for debugging
function initCarousel({ trackId, dotsId, prevBtnId, nextBtnId, sectionId, slidesPerViewFn, instanceKey }) {
  const track = document.getElementById(trackId);
  const dotsContainer = document.getElementById(dotsId);
  const wrapper = track?.closest('.carousel-wrapper');

  // Safety check – if elements don't exist, exit silently
  if (!track || !dotsContainer || !wrapper) {
    console.warn(`Carousel (#${trackId}) elements not found – skipping init`);
    return;
  }

  const cards = track.querySelectorAll('.card');
  const totalCards = cards.length;
  if (totalCards === 0) return;

  // ── config ──
  const gap = 20; // spacing between cards
  let slidesPerView = 3;
  let currentPage = 0;
  let totalPages = 1;
  let isDragging = false;
  let startX = 0;
  let containerWidth = 0;

  // ── build/resize carousel ──
  function resize() {
    slidesPerView = Math.min(slidesPerViewFn(), totalCards);
    containerWidth = wrapper.clientWidth;

    // Calculate card width to fill exactly, accounting for gap
    const cardWidth = (containerWidth - (slidesPerView - 1) * gap) / slidesPerView;

    cards.forEach((card) => {
      card.style.flex = `0 0 ${cardWidth}px`;
      card.style.margin = '0';
    });
    track.style.gap = gap + 'px';

    // Calculate total pages
    totalPages = Math.ceil(totalCards / slidesPerView);
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    // Rebuild dots
    buildDots();

    // Snap to current page without animation
    goTo(currentPage, true);
    alignButtonsToWrapper();
    if (window.fitTeamCards) window.fitTeamCards();
  }

  // ── navigation ──
  function goTo(page, instant = false) {
    if (page < 0) page = totalPages - 1;
    if (page >= totalPages) page = 0;
    currentPage = page;

    track.style.transition = instant
      ? 'none'
      : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    // Pixel-based, not percentage — percentage would be relative to the
    // track's full width (all cards combined), not one page/screenful,
    // which only happens to work by coincidence when there's just one page.
    track.style.transform = `translateX(-${currentPage * (containerWidth + gap)}px)`;

    updateDots();
    updateButtons();
  }

  function next() {
    goTo(currentPage + 1);
  }

  function prev() {
    goTo(currentPage - 1);
  }

  // ── dots ──
  function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === currentPage ? ' active' : '');
      dot.dataset.index = i;
      dot.type = 'button';
      dot.setAttribute('aria-label', `Page ${i + 1} of ${totalPages}`);
      if (i === currentPage) dot.setAttribute('aria-current', 'true');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPage);
      if (i === currentPage) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
  }

  // ── prev/next buttons ──
  function updateButtons() {
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (prevBtn) prevBtn.style.opacity = currentPage === 0 ? '0.3' : '1';
    if (nextBtn) nextBtn.style.opacity = currentPage === totalPages - 1 ? '0.3' : '1';
  }

  function createButtons() {
    // Remove existing buttons if any
    document.getElementById(prevBtnId)?.remove();
    document.getElementById(nextBtnId)?.remove();

    const prevBtn = document.createElement('button');
    prevBtn.id = prevBtnId;
    prevBtn.className = 'carousel-btn prev';
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.innerHTML = '<span aria-hidden="true">‹</span>';
    prevBtn.addEventListener('click', prev);

    const nextBtn = document.createElement('button');
    nextBtn.id = nextBtnId;
    nextBtn.className = 'carousel-btn next';
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.innerHTML = '<span aria-hidden="true">›</span>';
    nextBtn.addEventListener('click', next);

    // Append to the section (not the wrapper) so the buttons can sit at
    // the true screen edges without being clipped by the wrapper's
    // overflow:hidden (needed for the sliding cards) and without
    // overlapping the card content itself.
    const host = wrapper.parentElement || wrapper;
    host.appendChild(prevBtn);
    host.appendChild(nextBtn);
    alignButtonsToWrapper();
    updateButtons();
  }

  // Buttons live in the section now, not the wrapper, so vertically
  // center them on the wrapper's position within that shared parent.
  function alignButtonsToWrapper() {
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (!prevBtn || !nextBtn) return;
    const top = wrapper.offsetTop + wrapper.offsetHeight / 2;
    prevBtn.style.top = top + 'px';
    nextBtn.style.top = top + 'px';
  }

  // ── touch events (mobile swipe) ──
  function onTouchStart(e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    isDragging = true;
    track.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const delta = touch.clientX - startX;
    const base = -currentPage * (containerWidth + gap);
    track.style.transform = `translateX(${base + delta}px)`;
  }

  function onTouchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const touch = e.changedTouches[0];
    const delta = touch.clientX - startX;
    const threshold = 50;

    if (delta < -threshold) {
      next();
    } else if (delta > threshold) {
      prev();
    } else {
      goTo(currentPage);
    }
  }

  // ── init ──
  createButtons();
  resize();

  // ── one-time swipe hint (touch devices) ──
  // Plays a brief left-right nudge the first time the section is
  // actually scrolled into view, so touch users get a clear physical
  // cue that the row is draggable — dots alone don't convey "action".
  const section = sectionId ? document.getElementById(sectionId) : null;
  if (section && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          track.classList.add('swipe-hint');
          track.addEventListener('animationend', () => track.classList.remove('swipe-hint'), { once: true });
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(section);
  }

  // ── event listeners ──
  // Keyboard: tabbing onto a card that's on another page turns to that page
  track.addEventListener('focusin', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const i = Array.prototype.indexOf.call(cards, card);
    const page = Math.floor(i / slidesPerView);
    if (i >= 0 && page !== currentPage) goTo(page);
  });
  track.addEventListener('touchstart', onTouchStart, { passive: true });
  track.addEventListener('touchmove', onTouchMove, { passive: true });
  track.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('resize', resize);

  // ── expose for debugging ──
  if (instanceKey) window[instanceKey] = { goTo, next, prev, resize };
}

export function initTeamCarousel() {
  initCarousel({
    trackId: 'teamCarousel',
    dotsId: 'teamDots',
    prevBtnId: 'carouselPrev',
    nextBtnId: 'carouselNext',
    sectionId: 's4',
    slidesPerViewFn: () => {
      const w = window.innerWidth;
      if (w < 768) return 1;
      if (w < 1024) return 2;
      return 3;
    },
    instanceKey: 'teamCarousel'
  });
}

export function initPublicationsCarousel() {
  initCarousel({
    trackId: 'pubsCarousel',
    dotsId: 'pubsDots',
    prevBtnId: 'pubsCarouselPrev',
    nextBtnId: 'pubsCarouselNext',
    sectionId: 's5',
    slidesPerViewFn: () => 1, // one card per screen on every device, per request
    instanceKey: 'pubsCarousel'
  });
}
