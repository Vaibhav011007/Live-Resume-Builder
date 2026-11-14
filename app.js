 'use strict';
/* Folio – Live Resume Builder
   Flow: state (S) -> render functions -> one set of delegated events. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const KEY = 'folio.resume.v1';
const TPL = ['modern', 'classic', 'minimal', 'executive'];   // add a template name here + CSS block in style.css
const FONTS = {
  sans: '"Inter Tight",system-ui,sans-serif',
  serif: '"Source Serif 4",Georgia,serif',
  display: '"Bricolage Grotesque",system-ui,sans-serif'
};
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SEC = {   // list sections share one shape: a, b, c, d
  exp:  { t: 'Experience', a: 'Role', b: 'Company', c: 'Dates', d: 'Achievements (one per line)' },
  edu:  { t: 'Education', a: 'Degree', b: 'Institution', c: 'Years', d: 'Details (optional)' },
  proj: { t: 'Projects', a: 'Project name', b: 'Tech used', c: 'Year or link', d: 'What it does (one per line)' },
  cert: { t: 'Certifications', a: 'Certificate', b: 'Issuer', c: 'Year', d: 'Details (optional)' }
};
const NAMES = { summary: 'Profile', exp: 'Experience', proj: 'Projects', edu: 'Education', skills: 'Skills', cert: 'Certifications', lang: 'Languages' };
const PRESET = {   // fresher: education and projects first. experienced: experience first
  fresher: ['summary', 'edu', 'proj', 'skills', 'exp', 'cert', 'lang'],
  pro: ['summary', 'exp', 'proj', 'edu', 'skills', 'cert', 'lang']
};

/* Contact line with clickable email, phone and link */
const url = v => /^(https?:)?\/\//i.test(v) ? v : 'https://' + v;
function contact(P) {
  const a = (t, h) => `<span><a href="${esc(h)}">${esc(t)}</a></span>`;
  return [
    P.email && a(P.email, 'mailto:' + P.email),
    P.phone && a(P.phone, 'tel:' + P.phone.replace(/\s+/g, '')),
    P.loc && `<span>${esc(P.loc)}</span>`,
    P.link && a(P.link, url(P.link))
  ].filter(Boolean).join('');
}

/* ---------- State ---------- */
const sample = () => ({
  tpl: 'modern', accent: '#17766d', font: 'sans', space: 1, hidden: [],
  order: [...PRESET.fresher], showPhoto: true, showLevels: false,
  cert: [{ a: 'Responsive Web Design', b: 'freeCodeCamp', c: '2025', d: '' }],
  lang: 'English (Fluent), Hindi (Native)',
  p: {
    name: 'Riya Sharma', title: 'Frontend Developer', email: 'riya.sharma@example.com',
    phone: '+91 98765 43210', loc: 'Pune, India', link: 'linkedin.com/in/riyasharma', photo: '',
    summary: 'Frontend developer who builds fast, accessible interfaces with HTML, CSS and JavaScript. Shipped 12 student and client projects, and cares about clean code and smooth user experience.'
  },
  exp: [{ a: 'Frontend Intern', b: 'Pixelwave Studio', c: 'Jun 2025 – Dec 2025',
    d: 'Built 6 responsive landing pages used by 3 clients\nCut page load time by 38% by optimising images and CSS\nWorked with designers to ship a reusable component library' }],
  edu: [{ a: 'B.Tech, Computer Science', b: 'Savitribai Phule Pune University', c: '2022 – 2026', d: 'CGPA 8.4. Core member of the coding club.' }],
  proj: [{ a: 'Live Resume Builder', b: 'HTML, CSS, JavaScript', c: '2026',
    d: 'Real-time resume editor with 4 templates and PDF export\nAutosaves in the browser and imports or exports JSON' }],
  skills: [{ n: 'JavaScript', l: 'Advanced' }, { n: 'HTML & CSS', l: 'Expert' }, { n: 'Git', l: 'Intermediate' }, { n: 'C++', l: 'Intermediate' }, { n: 'Figma', l: 'Beginner' }]
});
let S;
try { S = Object.assign(sample(), JSON.parse(localStorage.getItem(KEY))); } catch { S = sample(); }

/* ---------- Editor form ---------- */
const inp = (attrs, label, val, type = 'text') => `<label>${label}<input type="${type}" ${attrs} value="${esc(val)}"></label>`;
const sw = k => `<label class="sw" title="Show on resume"><input type="checkbox" data-vis="${k}" ${S.hidden.includes(k) ? '' : 'checked'} aria-label="Show ${k} section on resume"><i></i></label>`;

function listCard(k) {
  const c = SEC[k], at = (i, f) => `data-s="${k}" data-i="${i}" data-k="${f}"`;
  const items = S[k].map((it, i) => `<div class="item">
    <div class="grid2">${inp(at(i, 'a'), c.a, it.a)}${inp(at(i, 'c'), c.c, it.c)}</div>
    ${inp(at(i, 'b'), c.b, it.b)}
    <label>${c.d}<textarea rows="3" ${at(i, 'd')}>${esc(it.d)}</textarea></label>
    <div class="acts">
      <button class="btn sm ghost" data-act="dup" data-s="${k}" data-i="${i}">Duplicate</button>
      <button class="btn sm ghost" data-act="del" data-s="${k}" data-i="${i}">Delete</button>
    </div></div>`).join('');
  return `<details class="card" open><summary>${c.t}${sw(k)}</summary>
    ${items || `<p class="empty">Nothing here yet. Add your first ${c.t.toLowerCase()} entry.</p>`}
    <button class="btn sm" data-act="add" data-s="${k}">Add entry</button></details>`;
}

function skillsCard() {
  const chips = S.skills.map((s, i) => `<span class="chip">${esc(s.n)}<small>${s.l}</small><button data-act="rm" data-i="${i}" aria-label="Remove ${esc(s.n)}">×</button></span>`).join('');
  return `<details class="card" open><summary>Skills${sw('skills')}</summary>
    <div class="chips">${chips || '<p class="empty">Add skills so recruiters can scan fast.</p>'}</div>
    <div class="grid2"><label>Skill<input id="skN" placeholder="e.g. React"></label>
    <label>Level<select id="skL">${LEVELS.map((l, i) => `<option${i === 2 ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <button class="btn sm" data-act="skill">Add skill</button></details>`;
}

function layoutCard() {
  const rows = S.order.map(k => `<li><span>${NAMES[k]}</span><span class="mv">
    <button class="btn sm ghost" data-act="up" data-s="${k}" aria-label="Move ${NAMES[k]} up">↑</button>
    <button class="btn sm ghost" data-act="down" data-s="${k}" aria-label="Move ${NAMES[k]} down">↓</button></span></li>`).join('');
  return `<details class="card" open><summary>Section order</summary>
    <div class="acts pre"><button class="btn sm" data-act="preset" data-s="fresher">Fresher layout</button>
    <button class="btn sm ghost" data-act="preset" data-s="pro">Experienced layout</button></div>
    <ol class="ord">${rows}</ol></details>`;
}
const langCard = () => `<details class="card" open><summary>Languages${sw('lang')}</summary>
  <label>Languages you know<input data-d="lang" value="${esc(S.lang)}" placeholder="English (Fluent), Hindi (Native)"></label></details>`;

function renderForm() {
  const open = $$('#form details').map(d => d.open), P = S.p;
  const fields = [['name', 'Full name'], ['title', 'Job title'], ['email', 'Email'], ['phone', 'Phone'], ['loc', 'City, country'], ['link', 'Website or LinkedIn']];
  $('#form').innerHTML = `${layoutCard()}<details class="card" open><summary>Personal info</summary>
    <div class="grid2">${fields.map(([k, l]) => inp(`data-p="${k}"${k === 'email' ? ' inputmode="email" aria-describedby="eEmail"' : ''}`, l, P[k])).join('')}</div>
    <p class="err" id="eEmail" role="alert"></p>
    <label>Photo (optional)<input type="file" id="photo" accept="image/*"></label></details>
    <details class="card" open><summary>Summary${sw('summary')}</summary>
    <label>Two or three sentences about you<textarea rows="4" data-p="summary">${esc(P.summary)}</textarea></label></details>
    ${Object.keys(SEC).map(listCard).join('')}${skillsCard()}${langCard()}`;
  $$('#form details').forEach((d, i) => { if (open[i] === false) d.open = false; });
}

/* ---------- Live preview ---------- */
function renderPaper() {
  const P = S.p, show = k => !S.hidden.includes(k), el = $('#paper');
  const pts = t => { const l = String(t).split('\n').map(x => x.trim()).filter(Boolean); return l.length ? `<ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''; };
  const list = k => S[k].map(i => `<div class="it"><div class="row"><b>${esc(i.a)}</b><span>${esc(i.c)}</span></div>${i.b ? `<div class="org">${esc(i.b)}</div>` : ''}${pts(i.d)}</div>`).join('');
  const sec = (k, h, body) => show(k) && body ? `<section class="sec"><h3>${h}</h3>${body}</section>` : '';
  const lv = s => S.showLevels ? `<small>${s.l}</small>` : '';
  const body = {
    summary: P.summary ? `<p>${esc(P.summary)}</p>` : '',
    exp: list('exp'), proj: list('proj'), edu: list('edu'), cert: list('cert'),
    skills: S.skills.length ? `<div class="chips">${S.skills.map(s => `<span class="chip">${esc(s.n)}${lv(s)}</span>`).join('')}</div>` : '',
    lang: S.lang.trim() ? `<p>${esc(S.lang)}</p>` : ''
  };
  el.dataset.tpl = S.tpl;
  el.style.setProperty('--pa', S.accent);
  el.style.setProperty('--ff', FONTS[S.font]);
  el.style.setProperty('--sp', S.space);
  el.innerHTML = `<header class="hd">${P.photo && S.showPhoto ? `<img src="${P.photo}" alt="Profile photo">` : ''}<div>
      <h1>${esc(P.name) || 'Your name'}</h1><p class="role">${esc(P.title)}</p>
      <p class="ct">${contact(P)}</p></div></header>`
    + S.order.map(k => sec(k, NAMES[k], body[k])).join('');
}

function fit() {   // scale A4 paper down to fit narrow screens
  const w = $('.stage').clientWidth;
  if (w < 50) return;
  $('#paper').style.zoom = Math.min(1, (w - 28) / 794);
}

/* ---------- Insight widgets ---------- */
function checks() {
  const P = S.p, ok = (c, l) => ({ ok: !!c, l });
  const rich = k => S[k].some(i => i.d.trim().length >= 30);
  return [
    ok(P.name && P.title, 'Name and job title'),
    ok(/^\S+@\S+\.\S+$/.test(P.email) && P.phone, 'Valid email and phone'),
    ok(P.summary.trim().length >= 60, 'Summary of 60+ characters'),
    ok(rich('exp'), 'Experience with detailed points'),
    ok(S.edu.length, 'Education added'),
    ok(rich('proj'), 'Projects with details'),
    ok(S.skills.length >= 4, 'At least 4 skills'),
    ok(P.link, 'Profile or portfolio link')
  ];
}

function stats() {
  const c = checks(), score = Math.round(c.filter(x => x.ok).length / c.length * 100), paper = $('#paper');
  $('#ring').style.strokeDashoffset = 213.6 * (1 - score / 100);
  $('#score').textContent = score;
  $('#checks').innerHTML = c.map(x => `<li class="${x.ok ? 'ok' : ''}">${x.l}</li>`).join('');
  $('#words').textContent = (paper.innerText.match(/\S+/g) || []).length;
  $('#pages').textContent = Math.max(1, Math.ceil((paper.offsetHeight - 2) / 1123));
  const next = c.find(x => !x.ok);
  $('#tip').textContent = next ? `Next: ${next.l.toLowerCase()}.` : 'Looks complete. Export it and send it.';
}

/* ---------- Save, toast, template bar ---------- */
let saveTimer;
function save() {
  const s = $('#saved'); s.textContent = 'Saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); s.textContent = 'Saved just now'; }
    catch { s.textContent = 'Could not save (storage full)'; }
  }, 500);
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2800);
}
const renderTpl = () => { $('#tplSeg').innerHTML = TPL.map(t => `<button data-tpl="${t}" aria-pressed="${t === S.tpl}">${t[0].toUpperCase() + t.slice(1)}</button>`).join(''); };
function update() { renderPaper(); fit(); stats(); save(); }

/* ---------- Actions ---------- */
function addSkill() {
  const n = $('#skN').value.trim();
  if (!n) { toast('Type a skill name first'); return; }
  S.skills.push({ n, l: $('#skL').value });
  renderForm(); update(); $('#skN').focus();
}
function exportJson() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
  a.download = (S.p.name || 'resume').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
  a.click(); toast('Exported as JSON');
}
function importJson(file) {
  file.text().then(t => {
    try {
      const d = JSON.parse(t);
      if (!d.p || !Array.isArray(d.exp)) throw new Error('shape');
      S = Object.assign(sample(), d); init(false); save(); toast('Resume imported');
    } catch { toast('That file is not a valid resume JSON'); }
  });
}
function setPhoto(file) {   // resize first so localStorage stays small
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 240 / Math.min(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      S.p.photo = c.toDataURL('image/jpeg', .82); update();
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

/* ---------- Events (delegated) ---------- */
document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.p) {
    S.p[d.p] = t.value;
    if (d.p === 'email') {
      const bad = t.value && !/^\S+@\S+\.\S+$/.test(t.value);
      t.setAttribute('aria-invalid', !!bad);
      $('#eEmail').textContent = bad ? 'Enter an email like name@example.com' : '';
    }
  } else if (d.k) S[d.s][d.i][d.k] = t.value;
  else if (d.d) S[d.d] = t.type === 'checkbox' ? t.checked : d.d === 'space' ? +t.value : t.value;
  else return;
  $('#paper').classList.remove('intro');
  update();
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.vis) {
    S.hidden = S.hidden.filter(x => x !== t.dataset.vis);
    if (!t.checked) S.hidden.push(t.dataset.vis);
    update();
  } else if (t.id === 'photo' && t.files[0]) setPhoto(t.files[0]);
  else if (t.id === 'imp' && t.files[0]) importJson(t.files[0]);
});

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset, k = d.s, i = +d.i;
  if (d.tpl) {
    S.tpl = d.tpl; renderTpl();
    const p = $('#paper'); p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap');
    update();
  } else if (d.t) {
    $('.app').dataset.view = d.t; $('#tabs').dataset.i = d.t === 'view' ? 1 : 0;
    $$('#tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); fit();
  } else if (d.act) {
    if (d.act === 'add') S[k].push({ a: '', b: '', c: '', d: '' });
    else if (d.act === 'dup') S[k].splice(i + 1, 0, { ...S[k][i] });
    else if (d.act === 'del') S[k].splice(i, 1);
    else if (d.act === 'rm') S.skills.splice(i, 1);
    else if (d.act === 'preset') S.order = [...PRESET[k]];
    else if (d.act === 'up' || d.act === 'down') {
      const j = S.order.indexOf(k), n = j + (d.act === 'up' ? -1 : 1);
      if (n >= 0 && n < S.order.length) [S.order[j], S.order[n]] = [S.order[n], S.order[j]];
    }
    else if (d.act === 'skill') return addSkill();
    renderForm(); update();
  } else if (b.id === 'theme') {
    const r = document.documentElement, next = r.dataset.theme === 'dark' ? 'light' : 'dark';
    r.dataset.theme = next; try { localStorage.setItem('folio.theme', next); } catch {}
  } else if (b.id === 'exp') exportJson();
  else if (b.id === 'pdf') { toast('In the print window, choose “Save as PDF” and set margins to None'); setTimeout(() => window.print(), 500); }
});

document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'skN') { e.preventDefault(); addSkill(); } });
window.addEventListener('resize', fit);

/* ---------- Init + intro animation ---------- */
function init(first) {
  renderTpl(); renderForm();
  $('#accent').value = S.accent; $('#font').value = S.font; $('#space').value = S.space;
  $('#showPhoto').checked = S.showPhoto; $('#showLevels').checked = S.showLevels;
  renderPaper(); fit();
  if (first) {   // the paper "writes itself" line by line while the ring fills
    const p = $('#paper'); p.classList.add('intro');
    $$('.hd,.sec,.it', p).forEach((n, n2) => n.style.setProperty('--d', n2 * 90 + 'ms'));
    setTimeout(() => p.classList.remove('intro'), 2000);
    requestAnimationFrame(() => requestAnimationFrame(stats));
  } else stats();
}
try { const th = localStorage.getItem('folio.theme'); if (th) document.documentElement.dataset.theme = th; } catch {}
init(true);