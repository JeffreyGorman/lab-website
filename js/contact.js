// "Get in touch" links: copy the email address instead of exposing it in the page.
// The address is stored back-to-front and only assembled when someone clicks, so address-harvesting bots
// that read the HTML (or just load the page) never see it. Clicking copies it and shows a small message
// with an "Open in email app" link as a fallback.
(function () {
  var r = 'ku.ca.mahrud@namrog.e.yerffej';
  var addr = function () { return r.split('').reverse().join(''); };
  var timer = 0, toast;

  function css() {
    if (document.getElementById('contact-toast-css')) return;
    var s = document.createElement('style'); s.id = 'contact-toast-css';
    s.textContent = '.contact-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);z-index:2147483000;max-width:min(92vw,460px);' +
      'background:#512940;color:#fff;border-radius:14px;padding:12px 18px;font:500 14px/1.4 Inter,system-ui,sans-serif;text-align:center;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.35);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}' +
      '.contact-toast.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}' +
      '.contact-toast b{font-weight:700;word-break:break-all;user-select:all;-webkit-user-select:all}' +
      '.contact-toast a{display:inline-block;margin-top:6px;color:#f08ab8;font-weight:600;text-decoration:underline}';
    document.head.appendChild(s);
  }
  function show(copied) {
    css();
    if (!toast) { toast = document.createElement('div'); toast.className = 'contact-toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
    var a = addr();
    toast.innerHTML = (copied ? 'Email address copied:' : 'Email address:') + '<br><b></b><br><a href="#">Open in your email app</a>';
    toast.querySelector('b').textContent = a;
    var link = toast.querySelector('a'); link.href = 'mailto:' + a;
    toast.classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { toast.classList.remove('show'); }, 7000);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      try { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
        var done = document.execCommand('copy'); t.remove(); done ? ok() : no(); } catch (e) { no(e); }
    });
  }
  function init() {
    document.querySelectorAll('a[data-mail]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        copy(addr()).then(function () { show(true); }, function () { show(false); });
      });
    });
    document.addEventListener('click', function (e) { if (toast && !toast.contains(e.target) && !e.target.closest('a[data-mail]')) toast.classList.remove('show'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
