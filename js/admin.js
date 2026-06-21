// admin.js — Dashboard Peneliti ViaMath (halaman terpisah, di luar alur siswa).
// Akses dengan PIN tunggal (ditegakkan di backend via header X-Admin-Token).
// Fungsi: ringkasan, telusur per koleksi + filter kelas, detail siswa,
// anonimisasi, dan EKSPOR CSV/JSON untuk pengolahan data penelitian.

import { CONFIG } from './config.js';

const API = CONFIG.BASE_URL;
const PIN_KEY = 'viamath_admin_pin';
const root = document.getElementById('admin-root');

const TABS = [
  { id: 'students', label: 'Siswa', coll: 'students', icon: 'student' },
  { id: 'answers', label: 'Jawaban', coll: 'answers', icon: 'chat-text' },
  { id: 'assessments', label: 'Asesmen', coll: 'assessments', icon: 'exam' },
  { id: 'showcases', label: 'Karya', coll: 'showcases', icon: 'images' },
];

// Urutan & label fase (label siswa) untuk pengelompokan jawaban per siswa.
const PHASE_ORDER = [
  { key: 'masalah', label: 'Tantangan Cerita' },
  { key: 'organisasi', label: 'Bentuk Tim' },
  { key: 'penyelidikan', label: 'Mari Selidiki' },
  { key: 'asesmen', label: 'Uji Kemampuan' },
  { key: 'refleksi', label: 'Renungkan' },
];

const state = {
  pin: sessionStorage.getItem(PIN_KEY) || '',
  data: { students: [], answers: [], assessments: [], showcases: [] },
  studentMap: {},
  tab: 'students',
  classFilter: '',
  studentFilter: '',
  detailStudent: null,
  anonymize: false,
  error: '',
};

// ───────────────────────── API ─────────────────────────
async function api(path) {
  const res = await fetch(API + path, { headers: { 'X-Admin-Token': state.pin } });
  if (res.status === 401) throw { code: 401, msg: 'PIN admin salah.' };
  if (res.status === 503) throw { code: 503, msg: 'Dashboard belum dikonfigurasi di server (ADMIN_TOKEN kosong).' };
  if (!res.ok) throw { code: res.status, msg: 'Gagal memuat (HTTP ' + res.status + ').' };
  return (await res.json()).data;
}

async function loadAll() {
  const [students, answers, assessments, showcases] = await Promise.all(
    TABS.map((t) => api('/admin/data?collection=' + t.coll))
  );
  state.data = { students, answers, assessments, showcases };
  state.studentMap = {};
  (students || []).forEach((s) => { state.studentMap[s._id] = s; });
}

// ─────────────────────── Helpers ───────────────────────
function studentOf(row) { return state.studentMap[row.studentId] || null; }
function classOf(row) {
  if (row.classCode) return row.classCode;
  const s = studentOf(row);
  return (s && s.classCode) || '';
}
function nameOf(row) {
  if (state.anonymize) return row.studentId ? 'S-' + String(row.studentId).slice(-6) : '(anon)';
  const s = studentOf(row);
  return (s && s.name) || row.studentName || row.by || '';
}
function schoolOf(row) {
  if (state.anonymize) return '';
  const s = studentOf(row);
  return (s && s.school) || '';
}
function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function allClasses() {
  const set = new Set();
  (state.data.students || []).forEach((s) => s.classCode && set.add(s.classCode));
  return [...set].sort();
}

// Definisi kolom per koleksi: { key, label, get } — dipakai tabel & CSV.
function columnsFor(tab) {
  const id = (r) => String(r._id || '');
  switch (tab) {
    case 'students': return [
      { label: 'id', get: id },
      { label: 'nama', get: (r) => state.anonymize ? 'S-' + String(r._id).slice(-6) : r.name },
      { label: 'sekolah', get: (r) => state.anonymize ? '' : r.school },
      { label: 'kelas', get: (r) => r.className },
      { label: 'kodeKelas', get: (r) => r.classCode },
      { label: 'kelompok', get: (r) => r.groupName || '' },
      { label: 'dibuat', get: (r) => fmtDate(r.createdAt) },
    ];
    case 'answers': return [
      { label: 'id', get: id },
      { label: 'studentId', get: (r) => r.studentId || '' },
      { label: 'nama', get: nameOf },
      { label: 'kodeKelas', get: classOf },
      { label: 'fase', get: (r) => r.phase || '' },
      { label: 'activityId', get: (r) => r.activityId || '' },
      { label: 'pertanyaan', get: (r) => r.questionText || '' },
      { label: 'jawaban', get: (r) => r.answerText || '' },
      { label: 'benar', get: (r) => r.isCorrect == null ? '' : (r.isCorrect ? 'ya' : 'tidak') },
      { label: 'dibuat', get: (r) => fmtDate(r.createdAt) },
    ];
    case 'assessments': return [
      { label: 'id', get: id },
      { label: 'studentId', get: (r) => r.studentId || '' },
      { label: 'nama', get: nameOf },
      { label: 'kodeKelas', get: classOf },
      { label: 'skorTotal', get: (r) => r.totalScore == null ? '' : r.totalScore },
      { label: 'dimensi', get: (r) => r.dimensions ? JSON.stringify(r.dimensions) : '' },
      { label: 'dikirim', get: (r) => fmtDate(r.submittedAt) },
    ];
    case 'showcases': return [
      { label: 'id', get: id },
      { label: 'studentId', get: (r) => r.studentId || '' },
      { label: 'nama', get: nameOf },
      { label: 'kelompok', get: (r) => r.groupName || '' },
      { label: 'kodeKelas', get: classOf },
      { label: 'judul', get: (r) => r.title || '' },
      { label: 'situasi', get: (r) => r.situation || '' },
      { label: 'soal', get: (r) => r.problem || '' },
      { label: 'jawaban', get: (r) => r.solution || '' },
      { label: 'dibuat', get: (r) => fmtDate(r.createdAt) },
    ];
    default: return [];
  }
}

// Baris terfilter untuk tab aktif (filter kelas + filter siswa).
function rowsFor(tab) {
  let rows = state.data[tab] || [];
  if (state.classFilter) {
    rows = rows.filter((r) => (tab === 'students' ? r.classCode : classOf(r)) === state.classFilter);
  }
  if (state.studentFilter) {
    rows = rows.filter((r) => (tab === 'students' ? r._id : r.studentId) === state.studentFilter);
  }
  return rows;
}

// ─────────────────────── Ekspor ───────────────────────
function toCSV(rows, cols) {
  const escCSV = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = cols.map((c) => escCSV(c.label)).join(',');
  const body = rows.map((r) => cols.map((c) => escCSV(c.get(r))).join(',')).join('\n');
  return '﻿' + head + '\n' + body; // BOM agar Excel baca UTF-8
}
function download(filename, text, mime) {
  const blob = new Blob([text], { type: (mime || 'text/csv') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function stamp() { return new Date().toISOString().slice(0, 10); }
function exportCSV(tab) {
  const cols = columnsFor(tab);
  download(`viamath-${tab}-${stamp()}.csv`, toCSV(rowsFor(tab), cols));
}
function exportAllJSON() {
  const payload = state.anonymize ? anonymizedData() : state.data;
  download(`viamath-semua-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}
function anonymizedData() {
  const idShort = (x) => x ? 'S-' + String(x).slice(-6) : '';
  return {
    students: state.data.students.map((s) => ({ ...s, name: idShort(s._id), school: '' })),
    answers: state.data.answers.map((a) => ({ ...a })),
    assessments: state.data.assessments.map((a) => { const c = { ...a }; delete c.studentName; return c; }),
    showcases: state.data.showcases.map((s) => { const c = { ...s }; delete c.by; return c; }),
  };
}

// ─────────────────────── Render: gerbang PIN ───────────────────────
function renderGate(msg) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-5">
      <div class="vm-card p-7 w-full max-w-sm fade-up">
        <div class="text-center mb-5">
          <div class="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-3"
               style="background:linear-gradient(135deg,var(--indigo),var(--purple))">π</div>
          <h1 class="text-xl font-black text-slate-800">Dashboard Peneliti</h1>
          <p class="text-sm text-slate-500 font-semibold mt-1">Masukkan PIN admin untuk melihat & mengekspor data.</p>
        </div>
        <input id="pin" type="password" class="vm-input" placeholder="PIN admin" autocomplete="off" />
        ${msg ? `<p class="text-sm font-bold mt-2" style="color:var(--no)"><i class="ph-duotone ph-warning-circle"></i> ${esc(msg)}</p>` : ''}
        <button id="pin-go" class="vm-btn vm-btn-primary w-full mt-4" style="min-height:48px">
          <i class="ph-duotone ph-sign-in"></i> Masuk</button>
        <p class="text-[11px] text-slate-400 font-semibold mt-3 text-center">Akses read-only · data dilindungi PIN di server.</p>
      </div>
    </div>`;
  const input = root.querySelector('#pin');
  const go = async () => {
    state.pin = input.value.trim();
    if (!state.pin) { renderGate('PIN tidak boleh kosong.'); return; }
    sessionStorage.setItem(PIN_KEY, state.pin);
    await boot();
  };
  root.querySelector('#pin-go').addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  input.focus();
}

// ─────────────────────── Render: dashboard ───────────────────────
function renderDash() {
  if (state.detailStudent) { renderDetail(state.detailStudent); return; }
  const c = { students: state.data.students.length, answers: state.data.answers.length,
    assessments: state.data.assessments.length, showcases: state.data.showcases.length };
  const cards = [
    ['Siswa', c.students, 'student', '#5B8DEF'],
    ['Jawaban', c.answers, 'chat-text', '#A78BFA'],
    ['Asesmen', c.assessments, 'exam', '#0D9488'],
    ['Karya', c.showcases, 'images', '#D97706'],
  ];
  const classes = allClasses();
  const tab = state.tab;
  const cols = columnsFor(tab);
  const rows = rowsFor(tab);

  root.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-5">
      <header class="flex items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black"
               style="background:linear-gradient(135deg,var(--indigo),var(--purple))">π</div>
          <div>
            <h1 class="text-lg font-black text-slate-800 leading-tight">Dashboard Peneliti</h1>
            <p class="text-xs text-slate-500 font-semibold">ViaMath · data terkumpul (read-only)</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button id="reload" class="vm-btn vm-btn-ghost" style="min-height:40px" title="Muat ulang"><i class="ph-duotone ph-arrows-clockwise"></i></button>
          <button id="logout" class="vm-btn vm-btn-ghost" style="min-height:40px"><i class="ph-duotone ph-sign-out"></i> Keluar</button>
        </div>
      </header>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        ${cards.map(([label, n, ic, col]) => `
          <div class="vm-card p-4">
            <div class="flex items-center gap-2 text-slate-500 text-xs font-black"><i class="ph-duotone ph-${ic}" style="color:${col}"></i> ${label}</div>
            <div class="text-2xl font-black text-slate-800 mt-1">${n}</div>
          </div>`).join('')}
      </div>

      <div class="vm-card p-3 mb-4 flex flex-wrap items-center gap-3">
        <div class="flex gap-1.5 flex-wrap">
          ${TABS.map((t) => `<button data-tab="${t.id}" class="vm-btn ${t.id === tab ? 'vm-btn-primary' : 'vm-btn-ghost'}" style="min-height:40px">
            <i class="ph-duotone ph-${t.icon}"></i> ${t.label}</button>`).join('')}
        </div>
        <div class="flex items-center gap-2 ml-auto flex-wrap">
          <select id="classFilter" class="vm-input" style="min-height:40px;width:auto;padding:.4rem .7rem">
            <option value="">Semua kelas</option>
            ${classes.map((cc) => `<option value="${esc(cc)}" ${cc === state.classFilter ? 'selected' : ''}>${esc(cc)}</option>`).join('')}
          </select>
          <label class="flex items-center gap-1.5 text-xs font-black text-slate-600 cursor-pointer select-none">
            <input id="anon" type="checkbox" ${state.anonymize ? 'checked' : ''}> Anonim
          </label>
          <button id="exportCSV" class="vm-btn vm-btn-ghost" style="min-height:40px"><i class="ph-duotone ph-download-simple"></i> CSV</button>
          <button id="exportJSON" class="vm-btn vm-btn-ghost" style="min-height:40px"><i class="ph-duotone ph-brackets-curly"></i> JSON</button>
        </div>
      </div>

      ${state.studentFilter ? `<div class="mb-3 text-sm font-bold text-slate-600">
        Menyaring siswa: <span class="vm-chip" style="background:#EEF2FF;color:#4F46E5">${esc(nameById(state.studentFilter))}</span>
        <button id="clearStudent" class="vm-btn vm-btn-ghost ml-1" style="min-height:32px;padding:0 .6rem"><i class="ph-duotone ph-x"></i> hapus filter</button></div>` : ''}

      <div class="vm-card p-0 overflow-hidden">
        <div class="px-4 py-2.5 text-xs font-black text-slate-500 border-b border-slate-100 flex items-center justify-between">
          <span>${rows.length} baris</span>
          ${tab === 'students' ? '<span class="text-slate-400">klik baris untuk lihat detail per fase</span>' : ''}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left text-slate-500 font-black bg-slate-50">
              ${cols.map((c) => `<th class="px-3 py-2 whitespace-nowrap">${esc(c.label)}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${rows.length === 0 ? `<tr><td class="px-3 py-6 text-center text-slate-400 font-semibold" colspan="${cols.length}">Belum ada data.</td></tr>`
                : rows.map((r) => `<tr class="border-t border-slate-50 hover:bg-indigo-50/40 ${tab === 'students' ? 'cursor-pointer' : ''}" ${tab === 'students' ? `data-sid="${esc(r._id)}"` : ''}>
                  ${cols.map((c) => `<td class="px-3 py-2 align-top" style="max-width:320px">${esc(c.get(r))}</td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  // events
  root.querySelector('#reload').addEventListener('click', boot);
  root.querySelector('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(PIN_KEY); state.pin = ''; renderGate('');
  });
  root.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => { state.tab = b.dataset.tab; renderDash(); }));
  root.querySelector('#classFilter').addEventListener('change', (e) => { state.classFilter = e.target.value; renderDash(); });
  root.querySelector('#anon').addEventListener('change', (e) => { state.anonymize = e.target.checked; renderDash(); });
  root.querySelector('#exportCSV').addEventListener('click', () => exportCSV(tab));
  root.querySelector('#exportJSON').addEventListener('click', exportAllJSON);
  const cs = root.querySelector('#clearStudent');
  if (cs) cs.addEventListener('click', () => { state.studentFilter = ''; renderDash(); });
  if (tab === 'students') {
    root.querySelectorAll('[data-sid]').forEach((tr) =>
      tr.addEventListener('click', () => { state.detailStudent = tr.dataset.sid; renderDash(); }));
  }
  if (window.renderIconsFallback) window.renderIconsFallback();
}

function nameById(id) {
  const s = state.studentMap[id];
  return state.anonymize ? 'S-' + String(id).slice(-6) : (s ? s.name : id);
}

// Detail satu siswa: jawaban dikelompokkan per fase + asesmen + karya.
function renderDetail(sid) {
  const s = state.studentMap[sid] || { _id: sid };
  const ans = (state.data.answers || []).filter((a) => a.studentId === sid)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const asmt = (state.data.assessments || []).find((a) => a.studentId === sid);
  const works = (state.data.showcases || []).filter((w) => w.studentId === sid);
  const nm = state.anonymize ? 'S-' + String(sid).slice(-6) : (s.name || '(tanpa nama)');
  const sch = state.anonymize ? '' : (s.school || '');

  const known = new Set(PHASE_ORDER.map((p) => p.key));
  const groups = PHASE_ORDER.map((p) => ({ ...p, items: ans.filter((a) => a.phase === p.key) }));
  const others = ans.filter((a) => !known.has(a.phase));
  if (others.length) groups.push({ key: 'lainnya', label: 'Lainnya', items: others });

  const answerRow = (a) => `
    <div class="px-4 py-3">
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm font-bold text-slate-700">${esc(a.questionText || a.activityId || '(tanpa teks)')}</p>
        ${a.isCorrect == null ? '' : `<span class="vm-chip shrink-0" style="background:${a.isCorrect ? '#DCFCE7;color:#15803D' : '#FEE2E2;color:#B91C1C'}">${a.isCorrect ? 'benar' : 'salah'}</span>`}
      </div>
      <p class="text-sm text-slate-600 mt-1"><span class="text-slate-400 font-bold">Jawab:</span> ${esc(a.answerText || '—')}</p>
      <p class="text-[11px] text-slate-400 font-semibold mt-1">${esc(a.activityId || '')} · ${esc(fmtDate(a.createdAt))}</p>
    </div>`;

  root.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-5">
      <button id="back" class="vm-btn vm-btn-ghost mb-4" style="min-height:40px"><i class="ph-duotone ph-arrow-left"></i> Kembali ke daftar</button>

      <div class="vm-card p-5 mb-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-xl font-black text-slate-800">${esc(nm)}</h2>
            <p class="text-sm text-slate-500 font-semibold">${esc([sch, s.className, s.groupName].filter(Boolean).join(' · '))}
              ${s.classCode ? `<span class="vm-chip ml-1" style="background:#EEF2FF;color:#4F46E5">${esc(s.classCode)}</span>` : ''}</p>
          </div>
          <div class="text-right">
            <div class="text-xs font-black text-slate-400">JAWABAN</div>
            <div class="text-2xl font-black text-slate-800">${ans.length}</div>
          </div>
        </div>
      </div>

      ${groups.map((g) => {
        const benar = g.items.filter((a) => a.isCorrect === true).length;
        const adaNilai = g.items.some((a) => a.isCorrect != null);
        return `
        <div class="vm-card p-0 mb-3 overflow-hidden">
          <div class="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100" style="background:#F8FAFC">
            <div class="font-black text-slate-800 flex items-center gap-2"><i class="ph-duotone ph-flag" style="color:var(--indigo)"></i> ${esc(g.label)}
              <span class="text-xs font-bold text-slate-400">(${esc(g.key)})</span></div>
            <div class="text-xs font-black text-slate-500">${g.items.length} jawaban${adaNilai ? ` · ${benar} benar` : ''}</div>
          </div>
          ${g.items.length === 0
            ? `<div class="px-4 py-3 text-sm text-slate-400 font-semibold">Belum ada jawaban di fase ini.</div>`
            : `<div class="divide-y divide-slate-50">${g.items.map(answerRow).join('')}</div>`}
        </div>`;
      }).join('')}

      ${asmt ? `
        <div class="vm-card p-4 mb-3">
          <div class="font-black text-slate-800 flex items-center gap-2 mb-1"><i class="ph-duotone ph-exam" style="color:#0D9488"></i> Hasil Asesmen</div>
          <p class="text-sm text-slate-600 font-semibold">Skor total: <b>${esc(asmt.totalScore)}</b> · ${esc(fmtDate(asmt.submittedAt))}</p>
          ${asmt.dimensions ? `<pre class="text-xs text-slate-500 mt-2 overflow-x-auto">${esc(JSON.stringify(asmt.dimensions, null, 2))}</pre>` : ''}
        </div>` : ''}

      ${works.length ? `
        <div class="vm-card p-4">
          <div class="font-black text-slate-800 flex items-center gap-2 mb-2"><i class="ph-duotone ph-images" style="color:#D97706"></i> Karya (${works.length})</div>
          ${works.map((w) => `<div class="p-3 rounded-xl mb-2" style="background:#FFF7ED">
            <p class="font-black text-slate-700 text-sm">${esc(w.title || '(tanpa judul)')}</p>
            ${w.situation ? `<p class="text-sm text-slate-600 mt-0.5">${esc(w.situation)}</p>` : ''}
            <p class="text-sm text-slate-700 mt-1"><b>Soal:</b> ${esc(w.problem || '')}</p>
            <p class="text-sm text-slate-600"><b>Jawaban:</b> ${esc(w.solution || '')}</p>
          </div>`).join('')}
        </div>` : ''}
    </div>`;

  root.querySelector('#back').addEventListener('click', () => { state.detailStudent = null; renderDash(); });
}

function renderLoading() {
  root.innerHTML = `<div class="min-h-screen flex items-center justify-center">
    <div class="text-slate-500 font-bold"><i class="ph-duotone ph-circle-notch"></i> Memuat data…</div></div>`;
}

// ─────────────────────── Boot ───────────────────────
async function boot() {
  if (!API) { renderGate('BASE_URL backend belum di-set di config.js.'); return; }
  if (!state.pin) { renderGate(''); return; }
  renderLoading();
  try {
    await loadAll();
    renderDash();
  } catch (e) {
    sessionStorage.removeItem(PIN_KEY);
    state.pin = '';
    renderGate(e && e.msg ? e.msg : 'Gagal memuat data.');
  }
}

boot();
