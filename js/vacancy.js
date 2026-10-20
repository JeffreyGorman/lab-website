// Fills the PhD advert from data/vacancy.js (edit that file, not this one):
//   homepage → the small card above the news strip (hero) and a thumbnail card in the Join section;
//   join.html → the full advert, with the animated card, in the PhD block.
(function () {
  var v = window.VACANCY;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ── the animated card (an inline SVG with SMIL animation, see animations/sf-phd-2027-figure.svg)
  //    plays once when it scrolls into view, shows the finished frame when Motion is Off, replays on click (Join page only)
  function motionOn() {
    try {
      if (document.body.classList.contains('motion-off') || window.MOTION_ENABLED === false) return false;
      var st = localStorage.getItem('expLabMotionEnabled');
      if (st === null) return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return st === 'true';
    } catch (e) { return true; }
  }
  function mountArt(holder, file, clickToReplay) {
    if (!holder || !file) return;
    fetch(file).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (txt) {
      txt = txt.replace(/<metadata[\s\S]*?<\/metadata>/, '');
      holder.innerHTML = txt;
      var svg = holder.querySelector('svg'); if (!svg) throw new Error('no svg');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      var END = +svg.dataset.end || 11.5, raf = 0, visible = false, playing = false;
      var showEnd = function () { cancelAnimationFrame(raf); playing = false; svg.pauseAnimations(); svg.setCurrentTime(END); };
      var play = function (force) {
        if (!force && !motionOn()) return showEnd();
        cancelAnimationFrame(raf); playing = true; svg.setCurrentTime(0); svg.unpauseAnimations();
        var tick = function () { if (svg.getCurrentTime() >= END) { playing = false; svg.pauseAnimations(); } else raf = requestAnimationFrame(tick); };
        tick();
      };
      showEnd();
      new IntersectionObserver(function (es) {
        var on = es[0].isIntersecting;
        if (on && !visible) { visible = true; play(false); }
        if (!on) { visible = false; showEnd(); }
      }, { threshold: 0.6 }).observe(svg);
      if (clickToReplay) {
        svg.style.cursor = 'pointer'; svg.setAttribute('tabindex', '0');
        svg.addEventListener('click', function () { play(true); });
        svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(true); } });
      }
      var last = motionOn();
      var recheck = function () { var now = motionOn(); if (now !== last) { last = now; if (visible) (now ? play(false) : showEnd()); } };
      new MutationObserver(recheck).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      document.querySelectorAll('#motionCheckbox, #motionCheckboxMobile').forEach(function (c) { c.addEventListener('change', function () { setTimeout(recheck, 0); }); });
    }).catch(function () {
      var box = holder.closest('.vacancy-ad, .vacancy-mini');
      holder.remove(); if (box) box.classList.add('no-art');
    });
  }

  // ── homepage hero card
  var card = document.getElementById('vacancyCard');
  if (card) {
    if (!v || !v.title) { card.hidden = true; }
    else {
      var set = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
      set('vacancyTag', v.tag || 'PhD studentship');
      set('vacancyTitle', v.title);
      var note = document.getElementById('vacancyNote');
      if (note) { note.textContent = v.note || ''; note.hidden = !v.note; }
      var a = document.getElementById('vacancyLink');
      if (a) a.href = v.page || 'join.html#phd';
      card.hidden = false;
      document.body.classList.add('has-vacancy');
    }
  }

  // ── homepage Join-section thumbnail card
  var mini = document.getElementById('vacancyMini');
  if (mini) {
    if (!v || !v.title) { mini.hidden = true; }
    else {
      mini.href = v.page || 'join.html#phd';
      mini.innerHTML = '<span class="vacancy-mini-art" data-zoom aria-hidden="true"></span>' +
        '<span class="vacancy-mini-head"><span class="vacancy-mini-tag">' + esc(v.tag || 'PhD studentship') + '</span>' +
        '<span class="vacancy-mini-title">' + esc(v.title) + '</span></span>' +
        '<span class="vacancy-mini-foot">' + (v.note ? '<span class="vacancy-mini-note">' + esc(v.note) + '</span>' : '') +
        '<span class="vacancy-mini-go">Details &amp; apply <span aria-hidden="true">→</span></span></span>';
      mini.hidden = false;
      // the homepage thumbnail is played by js/pah-card.js, exactly like the publication cards (play when in view, Motion toggle,
      // finished frame when Motion is Off) and it also grows large while it plays; so just put the SVG in and tell pah-card.js to wait for it
      var holder = mini.querySelector('.vacancy-mini-art');
      var loaded = fetch(v.animation).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (txt) {
        var tmp = document.createElement('div'); tmp.innerHTML = txt.replace(/<\?xml[^>]*\?>/, '');
        var svg = tmp.querySelector('svg'); if (!svg) throw new Error('no svg');
        svg.querySelectorAll('metadata').forEach(function (m) { m.remove(); });
        svg.removeAttribute('width'); svg.removeAttribute('height');
        holder.appendChild(svg);
      }).catch(function () { holder.remove(); mini.classList.add('no-art'); });
      window.PUBS_READY = Promise.all([window.PUBS_READY || Promise.resolve(), loaded]);
    }
  }

  // ── Join page advert
  var ad = document.getElementById('vacancyAd');
  if (ad) {
    if (!v || !v.title) { ad.hidden = true; return; }
    var facts = (v.facts || []).map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('');
    var ext = ' target="_blank" rel="noopener"';
    var sr = '<span class="sr-only"> (opens in a new tab)</span>';
    var extra = (v.links || []).map(function (l) { return '<a class="vacancy-btn" href="' + esc(l[1]) + '"' + ext + '>' + esc(l[0]) + sr + '</a>'; }).join('');
    ad.innerHTML =
      '<div class="vacancy-ad-text">' +
        '<p class="vacancy-ad-tag">' + esc(v.tag || 'PhD studentship') + '</p>' +
        '<h3 class="vacancy-ad-title">' + esc(v.title) + '</h3>' +
        (v.summary ? '<p class="vacancy-ad-summary">' + esc(v.summary) + '</p>' : '') +
        (facts ? '<dl class="vacancy-ad-facts">' + facts + '</dl>' : '') +
        '<p class="vacancy-ad-buttons">' +
          (v.url ? '<a class="vacancy-btn vacancy-btn-main" href="' + esc(v.url) + '"' + ext + '>How to apply <span aria-hidden="true">→</span>' + sr + '</a>' : '') +
          extra +
          '<a class="vacancy-btn" href="#" data-mail>Informal enquiries</a>' +
        '</p>' +
      '</div>' +
      (v.animation ? '<div class="vacancy-ad-art" title="Click to replay"></div>' : '');
    ad.hidden = false;
    if (!v.animation) ad.classList.add('no-art');
    mountArt(ad.querySelector('.vacancy-ad-art'), v.animation, true);
  }
})();
