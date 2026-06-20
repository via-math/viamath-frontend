// penyelidikan.js — Fase 3 (Membimbing penyelidikan). Label siswa: "Mari Selidiki".
// Dua bagian: (A) Materi Sumber interaktif, (B) Aktivitas penyelidikan.
// Level Kelas 5 diutamakan; perkalian/pembagian pecahan ditandai "PENGAYAAN" (audit K-2).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { fractionCircle, fracHTML, interactiveBar, barModel } from '../components/fraction-circle.js';
import { checkAnswer } from '../components/fraction-math.js';
import { pageHeader, mascotNote } from '../components/page-kit.js';
import { renderIcons, toast, playSound, celebrate } from '../components/toast.js';
import { Router } from '../router.js';

let tab = 'materi';

export function renderPenyelidikan(container) {
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  el.innerHTML = `
    ${pageHeader('search', 'Mari Selidiki', 'Saatnya jadi penyelidik pecahan! Pelajari sumbernya, lalu pecahkan setiap tantangan.')}
    ${mascotNote('Pelajari dulu "Sumber Belajar" untuk membantumu, lalu kerjakan "Tantangan Penyelidikan". Kamu pasti bisa!')}
    <div class="flex gap-2 vm-scroll-x pb-1">
      <button data-tab="materi" class="vm-btn"><i class="ph-duotone ph-book-open"></i> Sumber Belajar</button>
      <button data-tab="aktivitas" class="vm-btn"><i class="ph-duotone ph-flask"></i> Tantangan Penyelidikan</button>
    </div>
    <div id="peny-body"></div>`;

  function paintTabs() {
    el.querySelectorAll('[data-tab]').forEach((b) => {
      b.className = 'vm-btn ' + (b.dataset.tab === tab ? 'vm-btn-primary' : 'vm-btn-ghost');
    });
  }
  el.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => { tab = b.dataset.tab; paintTabs(); paint(); }));

  function paint() {
    const body = el.querySelector('#peny-body');
    body.innerHTML = '';
    body.appendChild(tab === 'materi' ? renderMateri() : renderAktivitas());
    setTimeout(renderIcons, 0);
  }

  paintTabs(); paint();
  setTimeout(renderIcons, 0);
  return el;
}

// ---------- BAGIAN A: MATERI SUMBER ----------
function renderMateri() {
  const wrap = document.createElement('div');
  wrap.className = 'space-y-5 fade-up';

  // 1. Pengertian
  const pengertian = document.createElement('section');
  pengertian.className = 'vm-card p-6';
  pengertian.innerHTML = `
    <h3 class="font-black text-slate-800 mb-3 flex items-center gap-2"><i class="ph-duotone ph-book-open" style="color:var(--indigo)"></i> Apa itu Pecahan?</h3>
    <p class="text-slate-600 font-semibold">Pecahan adalah bilangan yang menunjukkan <b>bagian dari keseluruhan</b>, ditulis dengan dua angka dipisah garis.</p>
    <div class="flex items-center justify-center gap-6 my-4">
      ${fracHTML('a', 'b')}
      <div class="text-sm text-slate-600 font-semibold">
        <p><b style="color:var(--indigo)">a</b> = Pembilang (bagian yang diambil)</p>
        <p><b style="color:var(--purple)">b</b> = Penyebut (banyak bagian seluruhnya)</p>
      </div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
      ${[['pizza', 3, 8, 'Pizza'], ['orange-slice', 1, 2, 'Semangka'], ['cookie', 3, 8, 'Cokelat'], ['cake', 1, 4, 'Kue']].map(
        ([ic, a, b, nama]) => `<div class="vm-card p-3 text-center" style="box-shadow:none">
          <div><i class="ph-duotone ph-${ic}" style="font-size:2rem;color:var(--peach)"></i></div>${fracHTML(a, b)}<p class="text-xs text-slate-500 font-bold mt-1">${nama}</p></div>`
      ).join('')}
    </div>`;

  // 2. Visualisasi: lingkaran + bar interaktif
  const visual = document.createElement('section');
  visual.className = 'vm-card p-6';
  visual.innerHTML = `
    <h3 class="font-black text-slate-800 mb-3 flex items-center gap-2"><i class="ph-duotone ph-circle-dashed" style="color:#0D9488"></i> Lihat & Coba Sendiri</h3>
    <p class="text-slate-500 font-semibold text-sm mb-4">Bandingkan bentuk pecahan lewat lingkaran berikut:</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
      ${[[1, 2, '#6EE7B7'], [1, 4, '#FCD34D'], [2, 3, '#A78BFA'], [3, 8, '#FDBA74']].map(
        ([a, b, c]) => `<div class="text-center">${fractionCircle(a, b, c, 120)}<div class="mt-1">${fracHTML(a, b)}</div></div>`
      ).join('')}
    </div>
    <div id="bar-slot" class="mt-5"></div>`;

  // 3. Pecahan senilai (latihan klik)
  const senilai = renderSenilaiLatihan();

  // 4. Membandingkan (latihan klik)
  const banding = renderBandingLatihan();

  wrap.append(pengertian, visual, senilai, banding);

  // pasang bar interaktif setelah masuk DOM
  setTimeout(() => {
    const slot = wrap.querySelector('#bar-slot');
    if (slot) {
      const note = document.createElement('p');
      note.className = 'text-sm font-bold text-slate-500 mb-2';
      note.innerHTML = '<i class="ph-duotone ph-hand-pointing" style="color:var(--indigo)"></i> Geser untuk mengubah banyak bagian yang terisi:';
      slot.append(note, interactiveBar(8, 3, '#5B8DEF', null));
    }
    renderIcons();
  }, 0);

  return wrap;
}

function renderSenilaiLatihan() {
  const sec = document.createElement('section');
  sec.className = 'vm-card p-6';
  // Soal senilai: target → pilihan {teks, benar}
  const soal = [
    { target: [1, 3], pil: [[2, 6, true], [1, 2, false], [2, 5, false]] },
    { target: [1, 2], pil: [[3, 6, true], [2, 4, true], [1, 3, false]] },
    { target: [2, 4], pil: [[1, 2, true], [3, 6, true], [2, 3, false]] },
  ];
  sec.innerHTML = `
    <h3 class="font-black text-slate-800 mb-1 flex items-center gap-2"><i class="ph-duotone ph-equals" style="color:#CA8A04"></i> Pecahan Senilai</h3>
    <p class="text-slate-500 font-semibold text-sm mb-4">Pecahan senilai = nilainya sama walau angkanya beda. Klik yang <b>senilai</b> dengan soal!</p>
    <div class="space-y-4">
      ${soal.map((s, i) => `
        <div class="vm-card p-3" style="box-shadow:none;background:#FEFCE8">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-sm font-bold text-slate-600">Soal ${i + 1}: senilai dengan</span> ${fracHTML(s.target[0], s.target[1])}
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${s.pil.map(([a, b, benar]) => `
              <button class="vm-btn vm-btn-ghost senilai-opt" data-soal="${i}" data-benar="${benar}" style="flex-direction:column;min-height:64px">
                ${fracHTML(a, b)}</button>`).join('')}
          </div>
          <p class="senilai-fb text-sm font-bold text-center mt-2" data-fb="${i}"></p>
        </div>`).join('')}
    </div>`;
  sec.querySelectorAll('.senilai-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.soal;
      const fb = sec.querySelector(`[data-fb="${i}"]`);
      const benar = btn.dataset.benar === 'true';
      if (benar) { fb.innerHTML = '<i class="ph-duotone ph-check-circle"></i> Benar! Itu senilai.'; fb.style.color = 'var(--ok)'; playSound(true); btn.classList.add('pop'); }
      else { fb.innerHTML = '<i class="ph-duotone ph-x-circle"></i> Belum tepat, coba lagi ya.'; fb.style.color = 'var(--no)'; playSound(false); btn.classList.add('shake'); }
      setTimeout(() => btn.classList.remove('pop', 'shake'), 500);
    });
  });
  return sec;
}

function renderBandingLatihan() {
  const sec = document.createElement('section');
  sec.className = 'vm-card p-6';
  const soal = [
    { tanya: 'Mana yang lebih besar?', a: [3, 8], b: [2, 8], benar: 'a' },
    { tanya: 'Mana yang lebih besar?', a: [1, 2], b: [1, 4], benar: 'a' },
    { tanya: 'Mana yang lebih kecil?', a: [1, 3], b: [2, 3], benar: 'a' },
  ];
  sec.innerHTML = `
    <h3 class="font-black text-slate-800 mb-1 flex items-center gap-2"><i class="ph-duotone ph-scales" style="color:#0D9488"></i> Membandingkan Pecahan</h3>
    <p class="text-slate-500 font-semibold text-sm mb-4">Gunakan tanda &lt;, &gt;, = . Klik pecahan yang diminta!</p>
    <div class="space-y-4">
      ${soal.map((s, i) => `
        <div class="vm-card p-3" style="box-shadow:none;background:#F0FDFA">
          <p class="text-sm font-bold text-slate-600 text-center mb-3">Soal ${i + 1}: ${s.tanya}</p>
          <div class="flex items-center justify-center gap-6">
            <button class="vm-btn vm-btn-ghost banding-opt" data-soal="${i}" data-pick="a" data-benar="${s.benar === 'a'}" style="flex-direction:column;min-height:90px">
              ${fracHTML(s.a[0], s.a[1])}<div class="mt-1">${barModel(s.a[0], s.a[1], '#5B8DEF')}</div></button>
            <span class="text-2xl font-black text-slate-300">?</span>
            <button class="vm-btn vm-btn-ghost banding-opt" data-soal="${i}" data-pick="b" data-benar="${s.benar === 'b'}" style="flex-direction:column;min-height:90px">
              ${fracHTML(s.b[0], s.b[1])}<div class="mt-1">${barModel(s.b[0], s.b[1], '#A78BFA')}</div></button>
          </div>
          <p class="banding-fb text-sm font-bold text-center mt-2" data-fb="${i}"></p>
        </div>`).join('')}
    </div>`;
  sec.querySelectorAll('.banding-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fb = sec.querySelector(`[data-fb="${btn.dataset.soal}"]`);
      const benar = btn.dataset.benar === 'true';
      if (benar) { fb.innerHTML = '<i class="ph-duotone ph-check-circle"></i> Tepat sekali!'; fb.style.color = 'var(--ok)'; playSound(true); btn.classList.add('pop'); }
      else { fb.innerHTML = '<i class="ph-duotone ph-x-circle"></i> Hampir! Lihat panjang bar warnanya.'; fb.style.color = 'var(--no)'; playSound(false); btn.classList.add('shake'); }
      setTimeout(() => btn.classList.remove('pop', 'shake'), 500);
    });
  });
  return sec;
}

// ---------- BAGIAN B: AKTIVITAS PENYELIDIKAN ----------
const AKTIVITAS = [
  {
    id: 'a1', judul: 'Penyelidikan 1: Mengenal Bagian', pengayaan: false,
    masalah: 'Bu Via membawa kue yang dipotong berbeda-beda: Kue A jadi 4 bagian, Kue B jadi 2 bagian, Kue C jadi 8 bagian. Ina mengambil 1 bagian dari tiap kue.',
    soal: [
      { t: 'Tulis pecahan bagian Ina dari Kue A, B, dan C!', jawab: ['1/4', '1/2', '1/8'] },
      { t: 'Jika Ina mengambil 3 bagian dari Kue C, berapa pecahannya?', jawab: ['3/8'] },
    ],
  },
  {
    id: 'a2', judul: 'Penyelidikan 2: Membandingkan', pengayaan: false,
    masalah: 'Ani mendapat 1/2 bagian roti, dan Doni mendapat 2/4 bagian roti yang sama besar.',
    soal: [
      { t: 'Siapa yang mendapat lebih banyak? (tulis "sama" jika sama)', jawab: ['sama', '1/2', '2/4'] },
      { t: 'Tulis pecahan yang senilai dengan 1/2 (selain 2/4)!', jawab: ['3/6', '4/8', '2/4'] },
    ],
  },
  {
    id: 'a3', judul: 'Penyelidikan 3: Menjumlah Pecahan', pengayaan: false,
    masalah: 'Rara makan 2/8 pizza, lalu makan 1/8 pizza lagi dari loyang yang sama.',
    soal: [
      { t: 'Berapa total pizza yang dimakan Rara? (penyebut sama)', jawab: ['3/8'] },
    ],
  },
  {
    id: 'a4', judul: 'Penyelidikan 4: Tantangan Pengayaan', pengayaan: true,
    masalah: 'Pak Ahmad punya pita 3/4 meter, dipotong-potong sepanjang 1/8 meter.',
    soal: [
      { t: 'Berapa banyak potongan 1/8 meter dari pita 3/4 meter? (Petunjuk: 3/4 ÷ 1/8)', jawab: ['6'] },
    ],
  },
];

function renderAktivitas() {
  const wrap = document.createElement('div');
  wrap.className = 'space-y-5 fade-up';

  wrap.innerHTML = AKTIVITAS.map((a) => `
    <section class="vm-card p-6" data-akt="${a.id}">
      <div class="flex items-center justify-between gap-2 mb-2">
        <h3 class="font-black text-slate-800">${a.judul}</h3>
        ${a.pengayaan ? `<span class="vm-chip" style="background:#FEF3C7;color:#B45309"><i class="ph-duotone ph-star" style="width:14px;height:14px"></i> PENGAYAAN</span>` : ''}
      </div>
      <p class="text-sm text-slate-600 font-semibold p-3 rounded-xl mb-3 flex items-start gap-2" style="background:#F1F5F9"><i class="ph-duotone ph-book-open" style="margin-top:2px;color:var(--indigo)"></i> ${a.masalah}</p>
      <div class="space-y-3">
        ${a.soal.map((s, i) => `
          <div>
            <label class="text-sm font-bold text-slate-700 block mb-1.5">${s.t}</label>
            <div class="flex gap-2">
              <input class="vm-input akt-input" data-akt="${a.id}" data-soal="${i}" placeholder="Jawabanmu...">
              <button class="vm-btn vm-btn-ghost akt-check" data-akt="${a.id}" data-soal="${i}" style="min-height:44px"><i class="ph-duotone ph-check"></i></button>
            </div>
            <p class="akt-fb text-sm font-bold mt-1" data-akt="${a.id}" data-soal="${i}"></p>
          </div>`).join('')}
      </div>
    </section>`).join('') + `
    <button id="peny-finish" class="vm-btn vm-btn-primary w-full" style="min-height:52px">
      <i class="ph-duotone ph-check-circle"></i> Penyelidikan Selesai!</button>`;

  // cek tiap jawaban
  const solved = new Set();
  const totalSoal = AKTIVITAS.reduce((n, a) => n + a.soal.filter((s) => !a.pengayaan).length, 0);

  wrap.querySelectorAll('.akt-check').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aId = btn.dataset.akt, sIdx = Number(btn.dataset.soal);
      const akt = AKTIVITAS.find((a) => a.id === aId);
      const input = wrap.querySelector(`.akt-input[data-akt="${aId}"][data-soal="${sIdx}"]`);
      const fb = wrap.querySelector(`.akt-fb[data-akt="${aId}"][data-soal="${sIdx}"]`);
      const val = input.value;
      const benar = checkAnswer(val, akt.soal[sIdx].jawab);
      if (benar) {
        fb.innerHTML = '<i class="ph-duotone ph-check-circle"></i> Benar! Hebat!'; fb.style.color = 'var(--ok)';
        input.style.borderColor = 'var(--ok)'; playSound(true);
        if (!akt.pengayaan) solved.add(aId + '-' + sIdx);
        Store.saveAnswer(`penyelidikan-${aId}-${sIdx}`, val);
        Api.saveAnswer({ studentId: Store.get().student?.id, phase: 'penyelidikan',
          activityId: `${aId}-${sIdx}`, questionText: akt.soal[sIdx].t, answerText: val, isCorrect: true });
        // perbarui proporsi progres
        Store.setProgress('penyelidikan', Math.min(1, solved.size / totalSoal));
      } else {
        fb.innerHTML = '<i class="ph-duotone ph-x-circle"></i> Belum tepat. Coba periksa lagi ya!'; fb.style.color = 'var(--no)';
        input.style.borderColor = 'var(--no)'; input.classList.add('shake'); playSound(false);
        setTimeout(() => input.classList.remove('shake'), 500);
      }
    });
  });

  wrap.querySelector('#peny-finish').addEventListener('click', () => {
    if (solved.size < totalSoal) {
      toast(`Selesaikan dulu ${totalSoal - solved.size} soal wajib lagi ya! (Pengayaan boleh dilewati)`, 'no');
      return;
    }
    Store.setProgress('penyelidikan', 1);
    Store.addScore(20); Store.addBadge('penyelidik-ulung');
    playSound(true); celebrate(); toast('Luar biasa! Kamu penyelidik ulung', 'ok');
    setTimeout(() => Router.go('pameran'), 1000);
  });

  return wrap;
}
