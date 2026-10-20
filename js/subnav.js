/* Mobile menu toggle for the shared sub-page top bar. */
(function () {
  if (/firefox|fxios/i.test(navigator.userAgent)) document.documentElement.classList.add('is-firefox');
  if (/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)) document.documentElement.classList.add('is-safari');   // lets the CSS drop effects Safari draws slowly
  var b = document.getElementById('siteNavBurger'), m = document.getElementById('siteNavMenu');
  // the phone/tablet Motion switch (beside the burger) drives the same setting as the one in the bar
  var mc = document.getElementById('motionCheckboxMobile'), main = document.getElementById('motionCheckbox');
  if (mc && main) {
    var sync = function () { mc.checked = main.checked; };
    mc.addEventListener('change', function () { main.checked = mc.checked; main.dispatchEvent(new Event('change', { bubbles: true })); });
    main.addEventListener('change', sync);
    sync(); window.addEventListener('load', sync); setTimeout(sync, 400);
  }
  if (!b || !m) return;
  function set(open) { m.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); }
  b.addEventListener('click', function () { set(!m.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m.classList.contains('open')) { set(false); b.focus(); } });
  document.addEventListener('click', function (e) { if (!m.contains(e.target) && !b.contains(e.target)) set(false); });
})();
