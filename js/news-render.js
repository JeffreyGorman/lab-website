// Renders the news strip (homepage) and the full list (news.html) from news-data.js
import { NEWS } from './news-data.js';

const fmt = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function renderNewsStrip(listEl, count = 3) {
  if (!listEl) return;
  listEl.textContent = '';
  NEWS.slice(0, count).forEach(n => {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.dateTime = n.date; time.textContent = fmt(n.date);
    const text = n.url ? Object.assign(document.createElement('a'), { href: n.url, target: '_blank', rel: 'noopener' }) : document.createElement('span');
    text.textContent = n.text; text.className = 'news-text';
    li.append(time, text);
    listEl.append(li);
  });
}

export function renderNewsArchive(rootEl) {
  if (!rootEl) return;
  rootEl.textContent = '';
  NEWS.forEach(n => {
    const art = document.createElement('article'); art.className = 'news-item';
    const time = document.createElement('time'); time.className = 'news-date'; time.dateTime = n.date; time.textContent = fmt(n.date);
    const body = document.createElement('div');
    const h = document.createElement('h2');
    if (n.url) { const a = document.createElement('a'); a.href = n.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = n.text; h.append(a); } else h.textContent = n.text;
    body.append(h);
    if (n.more) { const p = document.createElement('p'); p.textContent = n.more; body.append(p); }
    art.append(time, body); rootEl.append(art);
  });
}
