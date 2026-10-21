// Builds the publication cards (homepage) and the full list with animated figures (publications.html)
// from data/publications.js.  Plain script, no build step: edit data/publications.js and refresh.
(function () {
  var PUBS = (window.PUBLICATIONS || []).slice();
  var HIGHLIGHT = window.HIGHLIGHT_AUTHORS || [];
  if (!window.PUBLICATIONS) console.error('data/publications.js did not load (check the <script> tag order).');

  // newest year first; within a year keep the order written in the data file
  PUBS = PUBS.map(function (p, i) { return { p: p, i: i }; })
    .sort(function (a, b) { return (b.p.year - a.p.year) || (a.i - b.i); })
    .map(function (x) { return x.p; });

  var tasks = [];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reEsc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  function authorsHtml(a) {
    var h = a || '';
    HIGHLIGHT.forEach(function (n) { h = h.replace(new RegExp(reEsc(n) + '\\*?', 'g'), '<strong>$&</strong>'); });
    return h;
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // fetch an animated SVG and put it inline (so the page can play/pause/replay it and style it with the site colours)
  function inlineSvg(holder, file, svgClass, end) {
    var t = fetch(file).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (txt) {
      var box = document.createElement('div'); box.innerHTML = txt.replace(/<\?xml[^>]*\?>/, '');
      var svg = box.querySelector('svg'); if (!svg) throw new Error('no <svg> in ' + file);
      svg.querySelectorAll('metadata').forEach(function (m) { m.remove(); });   // drop provenance/editor metadata (can be several KB)
      svg.classList.add(svgClass); svg.setAttribute('data-end', String(end));
      holder.insertBefore(svg, holder.firstChild);
    }).catch(function (e) {
      console.warn('Could not load animation ' + file + ' (' + e.message + '). Open the site through a web server, not by double-clicking the file.');
    });
    tasks.push(t);
  }

  // ── homepage cards ──
  var grid = document.getElementById('pubsGrid');
  if (grid) {
    grid.textContent = '';
    PUBS.filter(function (p) { return p.card && p.card.file; }).slice(0, 3).forEach(function (p) {
      var art = el('article', 'card pub-card reveal');
      var img = el('div', 'paper-img pah-img'); img.setAttribute('role', 'button'); img.setAttribute('tabindex', '0'); img.setAttribute('aria-label', 'Replay the animation');
      var body = el('div', 'pub-body');
      body.appendChild(el('h3', null, esc(p.card.label || p.journal || '')));
      var t = el('p', 'pub-title'); var a = el('a', 'pub-card-link', p.title); a.href = 'publications.html#fig-' + (p.id || ''); t.appendChild(a); body.appendChild(t);
      art.appendChild(img); art.appendChild(body); grid.appendChild(art);
      inlineSvg(img, p.card.file, 'pah-card-svg', p.card.end || 8);
    });
  }

  // ── publications page ──
  var list = document.querySelector('.pub-list');
  if (list) {
    list.textContent = '';
    PUBS.forEach(function (p) {
      var row = el('div', 'pub-entry'); row.dataset.year = p.year; row.dataset.topics = (p.topics || []).join(' ');
      row.appendChild(el('div', 'pub-year', String(p.year)));
      var c = document.createElement('div');
      var h = el('h2'); 
      if (p.url) { var a = el('a', null, p.title + '<span class="sr-only"> (opens in a new tab)</span>'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; h.appendChild(a); } else h.innerHTML = p.title;
      c.appendChild(h);
      if (p.authors) c.appendChild(el('p', 'authors', authorsHtml(p.authors)));
      if (p.journal) c.appendChild(el('span', 'journal', p.journal));
      if (p.figure && p.figure.file) {
        var f = p.figure, fig = el('figure', 'pah-figure'); fig.id = 'fig-' + (p.id || ''); fig.dataset.end = f.end || 8;
        if (f.legend && f.legend.length) {
          var ul = el('ul', 'pah-legend'); ul.setAttribute('aria-label', 'Colour key');
          f.legend.forEach(function (l) { var li = el('li', null, esc(l[1])); li.dataset.k = l[0]; li.dataset.win = l[2] + ',' + l[3]; ul.appendChild(li); });
          fig.appendChild(ul);
        }
        var cap = el('figcaption'); cap.appendChild(el('span', null, f.caption || ''));
        var btn = el('button', 'pah-replay', 'Replay'); btn.type = 'button'; cap.appendChild(btn);
        fig.appendChild(cap); c.appendChild(fig);
        inlineSvg(fig, f.file, 'pah-svg', f.end || 8);
      }
      row.appendChild(c); list.appendChild(row);
    });
  }

  // other scripts wait on this before touching the animations
  window.PUBS_READY = Promise.all(tasks).then(function () {
    document.dispatchEvent(new Event('pubs-ready'));
    if (location.hash && list) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
  });
})();
