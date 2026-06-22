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

// Pemetaan id-langkah → fase PBL Arends (D1: label fase pada data, diturunkan saat ekspor).
const PBL_PHASE = {
  masalah: 'orientasi',
  organisasi: 'mengorganisasi',
  penyelidikan: 'penyelidikan',
  asesmen: 'asesmen',
  refleksi: 'evaluasi',
};

// Label 4 dimensi kecakapan asesmen (Kilpatrick) — activityId asesmen = `<key>-<i>`.
const DIMENSI = {
  konseptual: 'Pemahaman Konsep',
  prosedural: 'Kelancaran Berhitung',
  strategis: 'Memecahkan Masalah',
  adaptif: 'Berpikir Cermat',
};

const state = {
  pin: sessionStorage.getItem(PIN_KEY) || '',
  data: { students: [], answers: [], assessments: [], showcases: [] },
  studentMap: {},
  studentStats: {},
  tab: 'students',
  classFilter: '',
  studentFilter: '',
  detailStudent: null,
  anonymize: false,
  search: '',
  sortCol: null,
  sortDir: 1,
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
  // Agregat per siswa (kolom ringkas tabel Siswa + statistik).
  state.studentStats = {};
  const stat = (sid) => state.studentStats[sid] || (state.studentStats[sid] = { answers: 0, correct: 0, phases: new Set(), assessment: null, firstAt: null, lastAt: null });
  (answers || []).forEach((a) => {
    const t = stat(a.studentId); t.answers++; if (a.isCorrect === true) t.correct++; if (a.phase) t.phases.add(a.phase);
    const ts = a.createdAt; if (ts) { if (!t.firstAt || ts < t.firstAt) t.firstAt = ts; if (!t.lastAt || ts > t.lastAt) t.lastAt = ts; }
  });
  (assessments || []).forEach((a) => { stat(a.studentId).assessment = a.totalScore; });
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
      { label: 'jawaban', get: (r) => (state.studentStats[r._id] || {}).answers || 0 },
      { label: 'benar', get: (r) => (state.studentStats[r._id] || {}).correct || 0 },
      { label: 'faseAktif', get: (r) => (((state.studentStats[r._id] || {}).phases) || new Set()).size },
      { label: 'skorAsesmen', get: (r) => { const v = (state.studentStats[r._id] || {}).assessment; return v == null ? '' : v; } },
      { label: 'dibuat', get: (r) => fmtDate(r.createdAt) },
    ];
    case 'answers': return [
      { label: 'id', get: id },
      { label: 'studentId', get: (r) => r.studentId || '' },
      { label: 'nama', get: nameOf },
      { label: 'kodeKelas', get: classOf },
      { label: 'fase', get: (r) => r.phase || '' },
      { label: 'pblPhase', get: (r) => PBL_PHASE[r.phase] || '' },
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

// Baris untuk DITAMPILKAN: rowsFor + pencarian + pengurutan (ekspor tetap pakai rowsFor).
function displayRows(tab) {
  let rows = rowsFor(tab).slice();
  const cols = columnsFor(tab);
  const q = state.search.trim().toLowerCase();
  if (q) rows = rows.filter((r) => cols.some((c) => String(c.get(r)).toLowerCase().includes(q)));
  if (state.sortCol != null && cols[state.sortCol]) {
    const c = cols[state.sortCol];
    rows.sort((a, b) => {
      const va = c.get(a), vb = c.get(b);
      const na = parseFloat(va), nb = parseFloat(vb);
      const bothNum = !isNaN(na) && !isNaN(nb) && String(va).trim() !== '' && String(vb).trim() !== '';
      return (bothNum ? na - nb : String(va).localeCompare(String(vb), 'id')) * state.sortDir;
    });
  }
  return rows;
}

// Durasi belajar dari waktu jawaban pertama→terakhir.
function fmtDur(firstAt, lastAt) {
  if (!firstAt || !lastAt) return '';
  const ms = new Date(lastAt) - new Date(firstAt);
  if (isNaN(ms) || ms < 0) return '';
  const min = Math.round(ms / 60000);
  return min < 60 ? `${min} mnt` : `${Math.floor(min / 60)} j ${min % 60} mnt`;
}

// ─────────────────────── Statistik agregat (hormati filter kelas) ───────────────────────
function statsView() {
  const students = state.data.students.filter((s) => !state.classFilter || s.classCode === state.classFilter);
  const sids = new Set(students.map((s) => s._id));
  const answers = state.data.answers.filter((a) => sids.has(a.studentId));
  const assessments = state.data.assessments.filter((a) => sids.has(a.studentId));
  const N = students.length;
  const phaseRows = PHASE_ORDER.map((p) => {
    const fa = answers.filter((a) => a.phase === p.key);
    const graded = fa.filter((a) => a.isCorrect != null);
    const correct = fa.filter((a) => a.isCorrect === true).length;
    const sIn = new Set(fa.map((a) => a.studentId)).size;
    return { label: p.label, key: p.key, siswa: sIn, pct: N ? Math.round(sIn / N * 100) : 0, benarPct: graded.length ? Math.round(correct / graded.length * 100) : null };
  });
  const scores = assessments.map((a) => a.totalScore).filter((v) => typeof v === 'number');
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const mn = scores.length ? Math.min(...scores) : null, mx = scores.length ? Math.max(...scores) : null;
  const cls = {};
  students.forEach((s) => { const cc = s.classCode || '(tanpa kelas)'; (cls[cc] = cls[cc] || { n: 0, sc: [] }).n++; });
  assessments.forEach((a) => { const s = state.studentMap[a.studentId]; const cc = (s && s.classCode) || '(tanpa kelas)'; if (cls[cc] && typeof a.totalScore === 'number') cls[cc].sc.push(a.totalScore); });
  const clsRows = Object.entries(cls).sort((a, b) => a[0].localeCompare(b[0])).map(([cc, v]) => ({ cc, n: v.n, selesai: v.sc.length, avg: v.sc.length ? Math.round(v.sc.reduce((a, b) => a + b, 0) / v.sc.length) : null }));
  const bar = (pct) => `<div style="background:#EEF2F7;border-radius:6px;height:8px;overflow:hidden;margin-top:4px"><div style="width:${pct}%;height:100%;background:var(--indigo)"></div></div>`;
  return `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="vm-card p-4"><div class="text-xs font-black text-slate-500">Siswa${state.classFilter ? ' (kelas ini)' : ''}</div><div class="text-2xl font-black text-slate-800 mt-1">${N}</div></div>
      <div class="vm-card p-4"><div class="text-xs font-black text-slate-500">Selesai asesmen</div><div class="text-2xl font-black text-slate-800 mt-1">${scores.length}</div></div>
      <div class="vm-card p-4"><div class="text-xs font-black text-slate-500">Rata-rata skor</div><div class="text-2xl font-black text-slate-800 mt-1">${avg == null ? '—' : avg}</div></div>
      <div class="vm-card p-4"><div class="text-xs font-black text-slate-500">Skor min–maks</div><div class="text-2xl font-black text-slate-800 mt-1">${mn == null ? '—' : mn + '–' + mx}</div></div>
    </div>
    <div class="vm-card p-5 mb-4">
      <h3 class="font-black text-slate-800 mb-3">Penyelesaian & ketepatan per fase</h3>
      <div class="space-y-3">
        ${phaseRows.map((r) => `<div>
          <div class="flex justify-between text-sm font-bold text-slate-700"><span>${esc(r.label)} <span class="text-slate-400 font-semibold">(${esc(r.key)})</span></span>
            <span>${r.siswa}/${N} · ${r.pct}%${r.benarPct != null ? ` · benar ${r.benarPct}%` : ''}</span></div>
          ${bar(r.pct)}</div>`).join('')}
      </div>
    </div>
    <div class="vm-card p-0 overflow-hidden">
      <div class="px-4 py-2.5 text-xs font-black text-slate-500 border-b border-slate-100">Per kelas</div>
      <div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="text-left text-slate-500 font-black bg-slate-50"><th class="px-3 py-2">kelas</th><th class="px-3 py-2">siswa</th><th class="px-3 py-2">selesai asesmen</th><th class="px-3 py-2">rata-rata skor</th></tr></thead>
        <tbody>${clsRows.length === 0 ? '<tr><td class="px-3 py-6 text-center text-slate-400 font-semibold" colspan="4">Belum ada data.</td></tr>'
          : clsRows.map((r) => `<tr class="border-t border-slate-50"><td class="px-3 py-2 font-bold">${esc(r.cc)}</td><td class="px-3 py-2">${r.n}</td><td class="px-3 py-2">${r.selesai}</td><td class="px-3 py-2">${r.avg == null ? '—' : r.avg}</td></tr>`).join('')}
        </tbody></table></div>
    </div>`;
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
  const isStats = tab === 'stats';
  const cols = isStats ? [] : columnsFor(tab);
  const rows = isStats ? [] : displayRows(tab);
  const arrow = (i) => state.sortCol === i ? (state.sortDir === 1 ? ' ▲' : ' ▼') : '';

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
          <button data-tab="stats" class="vm-btn ${isStats ? 'vm-btn-primary' : 'vm-btn-ghost'}" style="min-height:40px"><i class="ph-duotone ph-chart-bar"></i> Statistik</button>
        </div>
        <div class="flex items-center gap-2 ml-auto flex-wrap">
          ${!isStats ? `<input id="search" class="vm-input" placeholder="Cari…" value="${esc(state.search)}" style="min-height:40px;width:9rem;padding:.4rem .7rem">` : ''}
          <select id="classFilter" class="vm-input" style="min-height:40px;width:auto;padding:.4rem .7rem">
            <option value="">Semua kelas</option>
            ${classes.map((cc) => `<option value="${esc(cc)}" ${cc === state.classFilter ? 'selected' : ''}>${esc(cc)}</option>`).join('')}
          </select>
          ${!isStats ? `<label class="flex items-center gap-1.5 text-xs font-black text-slate-600 cursor-pointer select-none">
            <input id="anon" type="checkbox" ${state.anonymize ? 'checked' : ''}> Anonim
          </label>` : ''}
          ${!isStats ? `<button id="exportCSV" class="vm-btn vm-btn-ghost" style="min-height:40px"><i class="ph-duotone ph-download-simple"></i> CSV</button>` : ''}
          <button id="exportJSON" class="vm-btn vm-btn-ghost" style="min-height:40px"><i class="ph-duotone ph-brackets-curly"></i> JSON</button>
        </div>
      </div>

      ${isStats ? statsView() : `
      ${state.studentFilter ? `<div class="mb-3 text-sm font-bold text-slate-600">
        Menyaring siswa: <span class="vm-chip" style="background:#EEF2FF;color:#4F46E5">${esc(nameById(state.studentFilter))}</span>
        <button id="clearStudent" class="vm-btn vm-btn-ghost ml-1" style="min-height:32px;padding:0 .6rem"><i class="ph-duotone ph-x"></i> hapus filter</button></div>` : ''}
      <div class="vm-card p-0 overflow-hidden">
        <div class="px-4 py-2.5 text-xs font-black text-slate-500 border-b border-slate-100 flex items-center justify-between">
          <span>${rows.length} baris</span>
          ${tab === 'students' ? '<span class="text-slate-400">klik header untuk urut · tombol Detail untuk per fase</span>' : '<span class="text-slate-400">klik header untuk urutkan</span>'}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left text-slate-500 font-black bg-slate-50">
              ${tab === 'students' ? '<th class="px-3 py-2"></th>' : ''}
              ${cols.map((c, i) => `<th class="px-3 py-2 whitespace-nowrap cursor-pointer select-none" data-sort="${i}" title="urutkan">${esc(c.label)}${arrow(i)}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${rows.length === 0 ? `<tr><td class="px-3 py-6 text-center text-slate-400 font-semibold" colspan="${cols.length + (tab === 'students' ? 1 : 0)}">Belum ada data.</td></tr>`
                : rows.map((r) => `<tr class="border-t border-slate-50 hover:bg-indigo-50/40 ${tab === 'students' ? 'cursor-pointer' : ''}" ${tab === 'students' ? `data-sid="${esc(r._id)}"` : ''}>
                  ${tab === 'students' ? `<td class="px-3 py-2 whitespace-nowrap"><button class="vm-btn vm-btn-primary" data-detail="${esc(r._id)}" style="min-height:30px;padding:.15rem .7rem"><i class="ph-duotone ph-eye"></i> Detail</button></td>` : ''}
                  ${cols.map((c) => `<td class="px-3 py-2 align-top" style="max-width:320px">${esc(c.get(r))}</td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`}
    </div>`;

  // events
  root.querySelector('#reload').addEventListener('click', boot);
  root.querySelector('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(PIN_KEY); state.pin = ''; renderGate('');
  });
  root.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => { state.tab = b.dataset.tab; state.sortCol = null; state.search = ''; renderDash(); }));
  root.querySelector('#classFilter').addEventListener('change', (e) => { state.classFilter = e.target.value; renderDash(); });
  const anonEl = root.querySelector('#anon');
  if (anonEl) anonEl.addEventListener('change', (e) => { state.anonymize = e.target.checked; renderDash(); });
  const csvEl = root.querySelector('#exportCSV');
  if (csvEl) csvEl.addEventListener('click', () => exportCSV(tab));
  root.querySelector('#exportJSON').addEventListener('click', exportAllJSON);
  const searchEl = root.querySelector('#search');
  if (searchEl) searchEl.addEventListener('input', (e) => {
    state.search = e.target.value; renderDash();
    const n = root.querySelector('#search'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
  });
  root.querySelectorAll('[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const i = +th.dataset.sort;
    if (state.sortCol === i) state.sortDir *= -1; else { state.sortCol = i; state.sortDir = 1; }
    renderDash();
  }));
  const cs = root.querySelector('#clearStudent');
  if (cs) cs.addEventListener('click', () => { state.studentFilter = ''; renderDash(); });
  if (tab === 'students') {
    root.querySelectorAll('[data-sid]').forEach((tr) =>
      tr.addEventListener('click', () => { state.detailStudent = tr.dataset.sid; renderDash(); }));
    root.querySelectorAll('[data-detail]').forEach((b) =>
      b.addEventListener('click', (e) => { e.stopPropagation(); state.detailStudent = b.dataset.detail; renderDash(); }));
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
  const firstAt = ans.length ? ans[0].createdAt : null;
  const lastAt = ans.length ? ans[ans.length - 1].createdAt : null;
  const asesAns = ans.filter((a) => a.phase === 'asesmen');
  const dimRows = Object.keys(DIMENSI).map((k) => {
    const items = asesAns.filter((a) => String(a.activityId || '').split('-')[0] === k);
    return { key: k, label: DIMENSI[k], total: items.length, benar: items.filter((a) => a.isCorrect === true).length };
  }).filter((d) => d.total > 0);

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
            ${firstAt ? `<p class="text-xs text-slate-400 font-semibold mt-1"><i class="ph-duotone ph-clock"></i> ${esc(fmtDate(firstAt))} – ${esc(fmtDate(lastAt))} · durasi ${esc(fmtDur(firstAt, lastAt))}</p>` : ''}
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

      ${(asmt || dimRows.length) ? `
        <div class="vm-card p-4 mb-3">
          <div class="font-black text-slate-800 flex items-center gap-2 mb-1"><i class="ph-duotone ph-exam" style="color:#0D9488"></i> Hasil Asesmen</div>
          ${asmt ? `<p class="text-sm text-slate-600 font-semibold">Skor total: <b>${esc(asmt.totalScore)}</b> · ${esc(fmtDate(asmt.submittedAt))}</p>` : ''}
          ${dimRows.length ? `<div class="mt-2 space-y-1.5">
            ${dimRows.map((d) => { const pct = d.total ? Math.round(d.benar / d.total * 100) : 0; return `
              <div class="flex justify-between text-sm"><span class="font-bold text-slate-700">${esc(d.label)} <span class="text-slate-400 font-semibold">(${esc(d.key)})</span></span>
                <span class="font-black" style="color:${pct >= 70 ? 'var(--ok)' : 'var(--no)'}">${d.benar}/${d.total} · ${pct}%</span></div>`; }).join('')}
          </div>` : ''}
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
