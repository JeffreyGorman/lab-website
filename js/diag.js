// Diagnostic overlay: open the site with ?diag on the end of the address. Shows what this browser is doing with the publication cards.
(function () {
  var box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:4px;right:4px;bottom:4px;z-index:99999;margin:0;padding:8px;background:rgba(0,0,0,.85);color:#7CFC9A;font:11px/1.3 monospace;white-space:pre-wrap;max-height:48vh;overflow:auto;pointer-events:none';
  document.body.appendChild(box);
  var errs = [];
  window.addEventListener('error', function (e) { errs.push('ERR ' + e.message + ' ' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { errs.push('REJ ' + (e.reason && e.reason.message || e.reason)); });
  var r = function (e) { if (!e) return '-'; var b = e.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); };
  function show() {
    var mm = function (q) { try { return matchMedia(q).matches ? 'Y' : 'n'; } catch (x) { return '?'; } };
    var L = [];
    L.push(innerWidth + 'x' + innerHeight + ' dpr' + devicePixelRatio + ' ' + navigator.userAgent.replace(/.*\((.*?)\).*(Chrome|Firefox|SamsungBrowser)\/([\d.]+).*/, '$1 $2 $3'));
    L.push('portrait(max-aspect 1/1):' + mm('(max-aspect-ratio: 1/1)') + ' maxw600:' + mm('(max-width:600px)') + ' reduceMotion:' + mm('(prefers-reduced-motion: reduce)'));
    L.push('svh:' + (CSS.supports('height', '10svh') ? 'Y' : 'n') + ' aspect-ratio:' + (CSS.supports('aspect-ratio', '1/1') ? 'Y' : 'n') + ' inset:' + (CSS.supports('inset', '0') ? 'Y' : 'n') + ' clamp:' + (CSS.supports('width', 'clamp(1px,2px,3px)') ? 'Y' : 'n'));
    L.push('PUBLICATIONS:' + (window.PUBLICATIONS ? window.PUBLICATIONS.length : 'MISSING') + ' PUBS_READY:' + (window.PUBS_READY ? 'Y' : 'n') + ' motion:' + window.MOTION_ENABLED + ' body:' + document.body.className);
    var g = document.getElementById('pubsGrid');
    L.push('grid:' + r(g) + ' cols:' + (g ? getComputedStyle(g).gridTemplateColumns : '-'));
    document.querySelectorAll('.pub-card').forEach(function (c, i) {
      var im = c.querySelector('.pub-img'), s = c.querySelector('svg'), cs = im && getComputedStyle(im);
      L.push('card' + i + ' ' + r(c) + ' img:' + r(im) + ' svg:' + r(s) + (cs ? ' disp:' + cs.display + ' flex:' + cs.flex + ' minH:' + cs.minHeight + ' pos:' + cs.position : ' NO .pub-img') + ' cls:' + c.className.replace(/card pub-card /, ''));
    });
    L.push(errs.join(' | '));
    box.textContent = L.join('\n');
  }
  show(); setInterval(show, 1500);
  fetch('animations/jacs-2026-card.svg').then(function (x) { errs.push('fetch card svg: ' + x.status); }).catch(function (e) { errs.push('fetch card svg FAILED ' + e.message); });
})();
