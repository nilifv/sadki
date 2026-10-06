/* =====================================================================
   Садки Карелии — настройки сайта
   Всё, что может понадобиться поменять, собрано здесь.
   ===================================================================== */

/* Контакты — меняются сразу по всему сайту */
const CONTACTS = {
  phone: '+7 (814) 123-45-67',
  telegram: 'sadki_karelii',          // ник без @
  email: 'info@sadki-karelii.ru',     // на этот же адрес приходят заявки
  address: 'Республика Карелия, с.\u00a0Янишполе, ул.\u00a0Скалистая,\u00a01/1',
  // точка на карте (широта, долгота) — для кнопок «Открыть на карте» и «Построить маршрут»
  lat: 62.122157,
  lon: 34.271501,
  hours: 'Пн–Пт, 9:00–18:00',
};

/* Объекты клиентов. Пока список пуст — блок «Объекты» на сайте скрыт.
   Пример заполнения (фото кладите в img/projects/):
   { title: 'Форелевое хозяйство', region: 'Карелия, Онежское озеро',
     text: 'Поставка и монтаж под ключ.', tags: ['12 садков', '25 м', '50 т'],
     photo: 'img/projects/1.jpg' },
*/
const PROJECTS = [];

/* Заявки на почту через FormSubmit (без своего сервера).
   При первой заявке на адрес придёт письмо — его нужно один раз подтвердить. */
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + CONTACTS.email;

/* Галерея: фото лежат в img/gallery/round | square | pontoon и называются 1.jpg, 2.jpg, …
   Галерея сама находит все фото подряд, пока не встретит пропуск в нумерации. */
const GALLERY_DIR = 'img/gallery/';
const GALLERY_MAX = 40;

/* ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Контакты ---------- */
(function applyContacts() {
  const tel = 'tel:+' + CONTACTS.phone.replace(/\D/g, '');
  const tg = 'https://t.me/' + CONTACTS.telegram;
  $$('[data-contact="phone"]').forEach(a => { a.href = tel; if (!a.children.length) a.textContent = CONTACTS.phone; });
  $$('[data-contact="telegram"]').forEach(a => { a.href = tg; });
  $$('[data-contact="email"]').forEach(a => { a.href = 'mailto:' + CONTACTS.email; if (!a.children.length) a.textContent = CONTACTS.email; });
  $$('[data-contact="address"]').forEach(el => { el.textContent = CONTACTS.address; });
  const map = $('#map');
  if (map) map.src = `https://yandex.ru/map-widget/v1/?ll=${CONTACTS.lon}%2C${CONTACTS.lat}&z=15&pt=${CONTACTS.lon}%2C${CONTACTS.lat}%2Cpm2orl`;
  const routeWeb = `https://yandex.ru/maps/?rtext=~${CONTACTS.lat},${CONTACTS.lon}&rtt=auto`;
  const routeApp = `yandexmaps://maps.yandex.ru/?rtext=~${CONTACTS.lat},${CONTACTS.lon}&rtt=auto`;
  $$('[data-map="route"]').forEach(a => {
    a.href = routeWeb;
    // на телефоне: сначала пробуем открыть приложение Яндекс Карт, если его нет — веб-версию
    a.addEventListener('click', e => {
      if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
      e.preventDefault();
      let left = false;
      const onHide = () => { left = true; };
      document.addEventListener('visibilitychange', onHide, { once: true });
      window.location.href = routeApp;
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onHide);
        if (!left && !document.hidden) window.location.href = routeWeb;
      }, 1200);
    });
  });
  $$('[data-contact="hours"]').forEach(el => { el.textContent = CONTACTS.hours; });
  $$('[data-contact-text="telegram"]').forEach(el => { el.textContent = '@' + CONTACTS.telegram; });
  $$('[data-contact-text="phone"]').forEach(el => { el.textContent = CONTACTS.phone; });
  $$('[data-contact-text="email"]').forEach(el => { el.textContent = CONTACTS.email; });
})();

/* ---------- Шапка, меню, нижняя панель ---------- */
const header = $('#header'), burger = $('#burger'), mnav = $('#mnav'), mbar = $('#mbar'), hero = $('.hero');

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('is-solid', y > 40);
  mbar.classList.toggle('is-shown', y > hero.offsetHeight * 0.6);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function closeMenu() {
  burger.setAttribute('aria-expanded', 'false');
  mnav.classList.remove('is-open');
  header.classList.remove('menu-open');
}
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', String(open));
  mnav.classList.toggle('is-open', open);
  header.classList.toggle('menu-open', open);
});
$$('#mnav a').forEach(a => a.addEventListener('click', closeMenu));

const navLinks = $$('.nav a');
const navObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) navObs.observe(s); });

/* ---------- Появление при прокрутке ---------- */
const revealEls = $$('.sec__head, .stat-card, .cage__info, .equip-card, .guarantee, .bp-card, .about__photo, .about__body, .request__side, .form, .contacts-card');
revealEls.forEach(el => el.classList.add('reveal'));
const revObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); revObs.unobserve(e.target); }
}), { threshold: 0.1 });
revealEls.forEach(el => revObs.observe(el));

/* ---------- Интерактив этапов полного цикла (Tracing Beam) ---------- */
const stations = $$('.cycle__station');
const bpCards = $$('.bp-card');
function setStepActive(step) {
  stations.forEach(st => st.classList.toggle('is-active', st.dataset.step === step));
  bpCards.forEach(cd => cd.classList.toggle('is-active', cd.dataset.step === step));
}
bpCards.forEach(cd => {
  cd.addEventListener('mouseenter', () => setStepActive(cd.dataset.step));
  cd.addEventListener('mouseleave', () => setStepActive(null));
});
stations.forEach(st => {
  st.addEventListener('mouseenter', () => setStepActive(st.dataset.step));
  st.addEventListener('mouseleave', () => setStepActive(null));
  st.addEventListener('click', () => {
    const target = $(`.bp-card[data-step="${st.dataset.step}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

const video = $('.hero__video');
if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();

/* ---------- Вкладки типов садков ---------- */
const tabs = $$('.tabs [role="tab"]');
function selectTab(tab, focus) {
  tabs.forEach(t => {
    const on = t === tab;
    t.classList.toggle('is-on', on);
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length], true);
    if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
  });
});

/* ---------- Схема «Из чего состоит садок» ---------- */
const svgNS = 'http://www.w3.org/2000/svg';
function buildCage() {
  const svg = $('#buildSvg');
  const cx = 300;
  const W = '#e9eef1', D = 'rgba(233,238,241,.35)';
  const ell = (cy, rx, ry, cls, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="${cls}" ${extra}/>`;
  const pt = (cy, rx, ry, a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  let s = '';

  // вода (фон)
  s += `<rect x="0" y="302" width="600" height="238" fill="rgba(46,127,134,.16)"/>`;
  s += `<path d="M0 302 ${Array.from({ length: 12 }, (_, i) => `Q ${25 + i * 50} 297 ${50 + i * 50} 302`).join(' ')}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>`;

  // Якорная система (временно скрыта)
  /*
  s += `<g class="layer" data-layer="anchor">`;
  [[70, 300, 22, 516], [530, 300, 578, 516], [175, 268, 128, 528], [425, 268, 472, 528]].forEach(([x1, y1, x2, y2], i) => {
    s += `<path d="M${x1} ${y1} L${x2} ${y2}" class="hl" stroke="${i > 1 ? D : W}" stroke-width="2" stroke-dasharray="${i > 1 ? '4 5' : '0'}" fill="none"/>`;
    s += `<rect x="${x2 - 14}" y="${y2 - 6}" width="28" height="14" rx="2" class="hlf" fill="${i > 1 ? D : W}"/>`;
  });
  s += `</g>`;
  */

  // 04 делевой мешок
  s += `<g class="layer" data-layer="net" fill="none">`;
  s += ell(320, 212, 39, 'hl', `stroke="${W}" stroke-width="2" stroke-dasharray="5 4"`);
  s += ell(368, 180, 32, 'hl', `stroke="${D}" stroke-width="1.5" stroke-dasharray="3 4"`);
  // нижнее огрузочное кольцо садка
  s += ell(418, 148, 26, 'hl', `stroke="${W}" stroke-width="3.5"`);
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * k / 10;            // передняя половина
    const [x1, y1] = pt(320, 212, 39, a), [x2, y2] = pt(418, 148, 26, a);
    s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" class="hl" stroke="${k === 0 || k === 10 ? W : D}" stroke-width="${k === 0 || k === 10 ? 2 : 1.2}"/>`;
  }
  s += `</g>`;

  // 05 мешок для отхода (конус продолжается вниз от нижнего кольца садка)
  s += `<g class="layer" data-layer="waste" fill="none">`;
  // сопряжение с нижним кольцом садка
  s += ell(418, 148, 26, 'hl', `stroke="${D}" stroke-width="1.5" stroke-dasharray="4 4"`);
  // промежуточное сечение конуса
  s += ell(454, 94, 16, 'hl', `stroke="${D}" stroke-width="1.2" stroke-dasharray="3 3"`);
  // горловина сборника отхода
  s += ell(486, 40, 7, 'hl', `stroke="${W}" stroke-width="2"`);

  // задние линии конуса
  for (let k = 1; k < 8; k++) {
    const a = Math.PI + Math.PI * k / 8;
    const [x1, y1] = pt(418, 148, 26, a), [x2, y2] = pt(486, 40, 7, a);
    s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" class="hl" stroke="${D}" stroke-width="1" stroke-dasharray="3 3"/>`;
  }
  // передние образующие конуса к сборнику
  for (let k = 0; k <= 8; k++) {
    const a = Math.PI * k / 8;
    const [x1, y1] = pt(418, 148, 26, a), [x2, y2] = pt(486, 40, 7, a);
    s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" class="hl" stroke="${k === 0 || k === 8 ? W : D}" stroke-width="${k === 0 || k === 8 ? 2 : 1.2}"/>`;
  }

  // сам мешок / стакан для сбора отхода
  s += `<path d="M${cx - 40} 486 L${cx - 36} 516 A 36 6 0 0 1 ${cx + 36} 516 L${cx + 40} 486 A 40 7 0 0 0 ${cx - 40} 486 Z" class="hlf" fill="rgba(233,238,241,.14)" stroke="none"/>`;
  s += `<path d="M${cx - 40} 486 L${cx - 36} 516 M${cx + 40} 486 L${cx + 36} 516" class="hl" stroke="${W}" stroke-width="2"/>`;
  s += ell(516, 36, 6, 'hl', `stroke="${W}" stroke-width="2"`);
  [-18, 0, 18].forEach(dx => {
    s += `<path d="M${cx + dx} 492 v24" class="hl" stroke="${D}" stroke-width="1.2"/>`;
  });
  // строп и концевое кольцо-груз
  s += `<path d="M${cx} 522 v6" class="hl" stroke="${W}" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="531" r="3.5" class="hl" stroke="${W}" stroke-width="2" fill="none"/>`;
  // строп / линия подъема отхода на поручень садка
  s += `<path d="M${cx} 242 L${cx} 486" class="hl" stroke="${D}" stroke-width="1.2" stroke-dasharray="3 4"/>`;
  s += `</g>`;

  // 01 плавучее кольцо (трубы)
  s += `<g class="layer" data-layer="ring" fill="none">`;
  [[236, 48, 0], [226, 46, 6], [216, 44, 12]].forEach(([rx, ry, dy]) => {
    s += ell(292 + dy / 3, rx, ry, 'hl', `stroke="${W}" stroke-width="7"`);
  });
  s += `</g>`;

  // 02 настил
  s += `<g class="layer" data-layer="deck">`;
  s += `<path fill-rule="evenodd" class="hlf" fill="#4f7f92" d="M${cx - 238} 252 a238 48 0 1 0 476 0 a238 48 0 1 0 -476 0 Z M${cx - 204} 252 a204 39 0 1 0 408 0 a204 39 0 1 0 -408 0 Z"/>`;
  for (let k = 0; k < 36; k++) {
    const a = 2 * Math.PI * k / 36;
    const [x1, y1] = pt(252, 238, 48, a), [x2, y2] = pt(252, 204, 39, a);
    s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="rgba(11,30,43,.35)" stroke-width="1"/>`;
  }
  s += `</g>`;

  // 03 поддержка (стойки и поручень)
  s += `<g class="layer" data-layer="rail" fill="none">`;
  for (let k = 0; k < 18; k++) {
    const a = 2 * Math.PI * k / 18;
    const [x, y] = pt(196, 230, 46, a);
    const back = Math.sin(a) < 0;
    s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} v46" class="hl" stroke="${back ? D : W}" stroke-width="3" stroke-linecap="round"/>`;
  }
  s += ell(196, 230, 46, 'hl', `stroke="${W}" stroke-width="3.5"`);
  s += `</g>`;

  // 05 защита от птиц
  s += `<g class="layer" data-layer="bird" fill="none">`;
  s += ell(150, 228, 44, 'hl', `stroke="${W}" stroke-width="2.5"`);
  s += `<path d="M72 150 C 80 40, 520 40, 528 150" class="hl" stroke="${W}" stroke-width="2"/>`;
  [0.25, 0.5, 0.75].forEach(f => {
    const x = 72 + 456 * f, yb = 150 + 44 * Math.sin(Math.acos((x - cx) / 228));
    s += `<path d="M${cx} 64 Q ${x} ${70} ${x.toFixed(1)} ${yb.toFixed(1)}" class="hl" stroke="${D}" stroke-width="1.5"/>`;
  });
  s += `<path d="M110 108 Q300 84 490 108" class="hl" stroke="${D}" stroke-width="1.5"/>`;
  s += ell(64, 34, 8, 'hl', `stroke="${W}" stroke-width="2.5"`);
  s += `</g>`;

  svg.innerHTML = s;

  const layers = $$('.layer', svg);
  const items = $$('.pt');
  const list = $('#parts');
  const touch = matchMedia('(hover: none), (max-width: 1024px)');
  let pinned = null;

  const setActive = key => {
    svg.classList.toggle('has-active', !!key);
    layers.forEach(l => l.classList.toggle('is-active', l.dataset.layer === key));
    items.forEach(it => {
      const on = it.dataset.layer === key;
      it.classList.toggle('is-active', on);
      $('.pt__btn', it).setAttribute('aria-expanded', String(on));
    });
  };

  items.forEach(it => {
    const key = it.dataset.layer, btn = $('.pt__btn', it);
    // компьютер: наведение
    it.addEventListener('mouseenter', () => { if (!touch.matches) setActive(key); });
    btn.addEventListener('focus', () => { if (!touch.matches) setActive(key); });
    // клик / тап: закрепить или снять
    btn.addEventListener('click', () => {
      pinned = pinned === key ? null : key;
      setActive(touch.matches ? pinned : key);
    });
  });
  // увели мышь со списка — вернуть закреплённый пункт или весь садок
  list.addEventListener('mouseleave', () => { if (!touch.matches) setActive(pinned); });
  list.addEventListener('focusout', e => { if (!list.contains(e.relatedTarget) && !touch.matches) setActive(pinned); });
}
buildCage();

/* ---------- Объекты ---------- */
if (PROJECTS.length) {
  $('#projectsList').innerHTML = PROJECTS.map(p => `
    <article class="project">
      <div class="project__img">${p.photo ? `<img src="${p.photo}" alt="${p.title}" loading="lazy">` : ''}</div>
      <h3>${p.title}</h3>
      <p>${p.region || ''}${p.text ? ' — ' + p.text : ''}</p>
      ${p.tags && p.tags.length ? `<div class="project__meta">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>` : ''}
    </article>`).join('');
  $('#projects').hidden = false;
}

/* ---------- Галерея ---------- */
const galleryCache = {};
const probe = src => new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = src; });
async function loadGallery(key) {
  if (galleryCache[key]) return galleryCache[key];
  const list = [];
  for (let i = 1; i <= GALLERY_MAX; i++) {
    const src = `${GALLERY_DIR}${key}/${i}.jpg`;
    if (!(await probe(src))) break;
    list.push(src);
  }
  return (galleryCache[key] = list);
}

const lb = $('#lightbox'), lbImg = $('#lbImg'), lbThumbs = $('#lbThumbs');
const lbPrev = $('#lbPrev'), lbNext = $('#lbNext'), lbCount = $('#lbCount');
let lbList = [], lbIndex = 0, lbPick = '', lbReturn = null;

function lbShow(i) {
  if (!lbList.length) return;
  lbIndex = (i + lbList.length) % lbList.length;
  lbImg.classList.add('is-loading');
  lbImg.onload = () => lbImg.classList.remove('is-loading');
  lbImg.src = lbList[lbIndex];
  lbImg.alt = `${$('#lbTitle').textContent} — фото ${lbIndex + 1}`;
  lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
  const btns = $$('button', lbThumbs);
  btns.forEach((b, n) => b.classList.toggle('is-on', n === lbIndex));
  if (btns[lbIndex]) btns[lbIndex].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  new Image().src = lbList[(lbIndex + 1) % lbList.length];
}

async function lbOpen(btn) {
  lbReturn = btn;
  lbPick = btn.closest('.cage')?.dataset.type || '';
  $('#lbTitle').textContent = btn.dataset.title;
  lbCount.textContent = ''; lbThumbs.innerHTML = ''; lbImg.removeAttribute('src');
  lb.hidden = false; document.body.classList.add('lb-open');
  $('.lightbox__close', lb).focus();
  lbList = await loadGallery(btn.dataset.gallery);
  if (!lbList.length) lbList = [$('img', btn).getAttribute('src')];
  const multi = lbList.length > 1;
  lbPrev.hidden = lbNext.hidden = lbThumbs.hidden = !multi;
  lbThumbs.innerHTML = lbList.map((src, n) => `<button type="button" aria-label="Фото ${n + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('');
  $$('button', lbThumbs).forEach((b, n) => b.addEventListener('click', () => lbShow(n)));
  lbShow(0);
}
function lbClose() {
  lb.hidden = true; document.body.classList.remove('lb-open');
  if (lbReturn) lbReturn.focus({ preventScroll: true });
}

$$('[data-gallery]').forEach(b => b.addEventListener('click', () => lbOpen(b)));
$$('[data-close]', lb).forEach(el => el.addEventListener('click', lbClose));
$('#lbCta').addEventListener('click', () => pick(lbPick));
lbPrev.addEventListener('click', () => lbShow(lbIndex - 1));
lbNext.addEventListener('click', () => lbShow(lbIndex + 1));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!lb.hidden) lbClose(); else closeMenu(); }
  if (lb.hidden) return;
  if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
  if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
});
let tx = null;
$('#lbStage').addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
$('#lbStage').addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 40) lbShow(lbIndex + (dx < 0 ? 1 : -1));
  tx = null;
});

// число фото на кнопках — считаем в фоне, когда страница загрузилась
window.addEventListener('load', () => setTimeout(async () => {
  for (const key of ['round', 'square']) {
    const n = (await loadGallery(key)).length;
    $$(`[data-count="${key}"]`).forEach(b => { b.textContent = n > 1 ? n : ''; });
  }
}, 1200));

/* ---------- Форма ---------- */
const form = $('#requestForm');
const PICK_MAP = { 
  'Круглый': 'Круглый садок', 
  'Квадратный': 'Квадратный садок', 
  'Понтон с манипулятором': 'Понтон с манипулятором',
  'Сачки': 'Сачки'
};
function pick(value) {
  const v = PICK_MAP[value];
  if (!v) return;
  const r = form.querySelector(`input[name="type"][value="${v}"]`);
  if (r) r.checked = true;
  if (value === 'Понтон с манипулятором') {
    const c = form.querySelector('input[name="opts"][value="Понтон с манипулятором"]');
    if (c) { c.checked = true; $('#params').open = true; }
  }
}
$$('[data-pick]').forEach(a => a.addEventListener('click', () => pick(a.dataset.pick)));

const phone = form.elements.phone;
phone.addEventListener('input', () => {
  let d = phone.value.replace(/\D/g, '');
  if (!d) { phone.value = ''; return; }
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  let o = '+7';
  if (d.length > 1) o += ' (' + d.slice(1, 4);
  if (d.length >= 4) o += ') ' + d.slice(4, 7);
  if (d.length >= 7) o += '-' + d.slice(7, 9);
  if (d.length >= 9) o += '-' + d.slice(9, 11);
  phone.value = o;
});

const status = $('#formStatus'), submitBtn = $('#submitBtn');
form.addEventListener('submit', async e => {
  e.preventDefault();
  status.className = 'form__status'; status.textContent = '';
  const name = form.elements.name;
  const checks = [[name, name.value.trim().length > 1], [phone, phone.value.replace(/\D/g, '').length === 11]];
  checks.forEach(([el, ok]) => el.closest('.input').classList.toggle('is-error', !ok));
  if (checks.some(([, ok]) => !ok)) {
    status.classList.add('err'); status.textContent = 'Пожалуйста, укажите имя и телефон';
    (checks.find(([, ok]) => !ok)[0]).focus();
    return;
  }

  const fd = new FormData(form);
  const val = k => (fd.get(k) || '').toString().trim() || '—';
  const opts = fd.getAll('opts');
  const payload = {
    _subject: 'Заявка с сайта: ' + val('type'),
    _template: 'table',
    _captcha: 'false',
    'Имя': val('name'),
    'Телефон': val('phone'),
    'Что нужно': val('type'),
    'Размер, м': val('size'),
    'Объём мешка, т': val('volume'),
    'Труб в кольце': val('pipes'),
    'Ø трубы, мм': val('dia'),
    'Настил': val('deck'),
    'Количество': val('qty'),
    'Дополнительно': opts.length ? opts.join(', ') : '—',
    'Регион / комментарий': val('comment'),
  };

  submitBtn.disabled = true; submitBtn.textContent = 'Отправляем…';
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(res.status);
    status.classList.add('ok');
    status.textContent = 'Спасибо! Заявка принята. Специалист свяжется с вами в ближайшее рабочее время.';
    form.reset();
  } catch (err) {
    const body = Object.entries(payload).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n');
    location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
    status.classList.add('err');
    status.textContent = 'Не удалось отправить заявку автоматически — открыто письмо в почтовой программе.';
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = 'Отправить заявку';
  }
});

/* ---------- Счётчики в полосе цифр ---------- */
const counters = $$('[data-count-to]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cntObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  cntObs.unobserve(e.target);
  if (reduce) return;
  const el = e.target, to = +el.dataset.countTo, from = +el.dataset.from, t0 = performance.now(), dur = 1400;
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    el.textContent = v;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}), { threshold: 0.6 });
counters.forEach(el => cntObs.observe(el));

$('#year').textContent = new Date().getFullYear();
