// asesmen.js — Uji Kemampuan. 4 dimensi kecakapan matematis (Kilpatrick).
// Pilihan ganda dengan kunci jawaban TERVERIFIKASI (memperbaiki soal cacat versi lama).
// Lulus 70% per dimensi untuk lanjut. Semua jawaban dikirim ke backend (per individu).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { CONFIG } from '../config.js';
import { pageHeader, mascotNote } from '../components/page-kit.js';
import { renderIcons, toast, playSound, celebrate } from '../components/toast.js';
import { Router } from '../router.js';

// Tiap soal: pertanyaan, opsi, indeks jawaban benar, petunjuk. SEMUA sudah diverifikasi.
const DIMENSI = [
  {
    key: 'konseptual', nama: 'Pemahaman Konsep', icon: 'lightbulb',
    soal: [
      { q: 'Pizza dipotong 4 bagian sama. Kamu makan 1 potong. Berapa bagian yang kamu makan?',
        opt: ['1/4', '1/3', '4/1', '1/2'], benar: 0, hint: 'Atas = yang diambil (1), bawah = total (4).' },
      { q: 'Roti dibagi 8 bagian sama. Ani mengambil 3 bagian. Berapa pecahannya?',
        opt: ['3/8', '8/3', '3/5', '5/8'], benar: 0, hint: 'Diambil 3 dari 8 → 3/8.' },
      { q: 'Semangka dipotong 6 bagian. Rina makan 2, Toni makan 1. Berapa bagian yang TIDAK dimakan?',
        opt: ['3/6', '2/6', '4/6', '1/6'], benar: 0, hint: 'Dimakan 2+1=3, sisa 6−3=3 → 3/6.' },
    ],
  },
  {
    key: 'prosedural', nama: 'Kelancaran Berhitung', icon: 'calculator',
    soal: [
      { q: 'Pecahan mana yang senilai dengan 1/2?',
        opt: ['2/4', '1/3', '2/5', '3/4'], benar: 0, hint: '1/2 = (1×2)/(2×2) = 2/4.' },
      { q: 'Hitung 2/8 + 3/8 = ...',
        opt: ['5/8', '5/16', '6/8', '1/8'], benar: 0, hint: 'Penyebut sama → jumlahkan pembilang: 2+3=5.' },
      { q: 'Hitung 5/6 − 2/6 = ...',
        opt: ['3/6', '3/12', '7/6', '2/6'], benar: 0, hint: 'Penyebut sama → kurangkan pembilang: 5−2=3.' },
    ],
  },
  {
    key: 'strategis', nama: 'Memecahkan Masalah', icon: 'puzzle-piece',
    soal: [
      { q: 'Mana yang lebih besar: 3/8 atau 5/8?',
        opt: ['5/8', '3/8', 'Sama', 'Tak bisa dibanding'], benar: 0, hint: 'Penyebut sama → pembilang lebih besar lebih besar.' },
      { q: 'Ani makan 3/4 roti, Budi makan 2/4 roti yang sama. Siapa lebih banyak?',
        opt: ['Ani', 'Budi', 'Sama', 'Tak bisa diketahui'], benar: 0, hint: '3/4 > 2/4 karena 3 > 2.' },
      { q: 'Bagian mana yang paling kecil: 1/2, 1/4, atau 1/8?',
        opt: ['1/8', '1/4', '1/2', 'Sama besar'], benar: 0, hint: 'Makin besar penyebut (potongan makin banyak), tiap potong makin kecil.' },
    ],
  },
  {
    key: 'adaptif', nama: 'Berpikir Cermat', icon: 'brain',
    soal: [
      { q: 'Aldi bilang "1/2 = 2/4". Citra bilang "tidak sama karena angkanya beda". Siapa benar?',
        opt: ['Aldi', 'Citra', 'Keduanya', 'Tak ada'], benar: 0, hint: '1/2 dan 2/4 senilai — nilainya sama walau angkanya beda.' },
      { q: 'Ibu punya 6/6 kue (utuh), memberikan 2/6. Berapa sisa kue?',
        opt: ['4/6', '2/6', '8/6', '6/6'], benar: 0, hint: '6/6 − 2/6 = 4/6.' },
      { q: 'Kue dibagi: 1/4 untuk kakak, 1/4 untuk adik. Berapa bagian yang sudah dibagi?',
        opt: ['2/4', '1/8', '2/8', '1/4'], benar: 0, hint: '1/4 + 1/4 = 2/4 (penyebut sama).' },
    ],
  },
];

let dimIdx = 0;
let jawaban = {}; // dimIdx -> { soalIdx: pilihan }

export function renderAsesmen(container) {
  dimIdx = 0; jawaban = {};
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  el.innerHTML = `
    ${pageHeader('clipboard-check', 'Uji Kemampuan', 'Tunjukkan kehebatanmu! Jawab tiap soal. Kamu perlu benar minimal 70% untuk lanjut ke tahap berikutnya.')}
    ${mascotNote('Tenang saja, kerjakan pelan-pelan. Kalau salah, kamu boleh mencoba lagi!')}
    <div id="dim-progress" class="vm-card p-4"></div>
    <div id="dim-body"></div>`;

  paintProgress(el);
  paintDimensi(el);
  setTimeout(renderIcons, 0);
  return el;
}

function paintProgress(el) {
  const box = el.querySelector('#dim-progress');
  box.innerHTML = `<div class="flex items-center gap-2">
    ${DIMENSI.map((d, i) => `
      <div class="flex-1 text-center ${i > dimIdx ? 'opacity-40' : ''}">
        <div class="w-9 h-9 mx-auto rounded-full flex items-center justify-center font-black text-white"
          style="background:${i < dimIdx ? 'var(--ok)' : i === dimIdx ? 'var(--indigo)' : '#CBD5E1'}">
          ${i < dimIdx ? '<i class="ph-bold ph-check"></i>' : i + 1}</div>
        <p class="text-[10px] font-black text-slate-500 mt-1 leading-tight">${d.nama}</p>
      </div>`).join('<div style="width:18px;height:2px;background:#E2E8F0;margin-top:18px"></div>')}
  </div>`;
}

function paintDimensi(el) {
  const dim = DIMENSI[dimIdx];
  const body = el.querySelector('#dim-body');
  jawaban[dimIdx] = jawaban[dimIdx] || {};

  body.innerHTML = `
    <section class="vm-card p-6 fade-up">
      <h3 class="font-black text-slate-800 flex items-center gap-2 mb-4">
        <i class="ph-duotone ph-${dim.icon}" style="color:var(--indigo)"></i> ${dim.nama}
      </h3>
      <div class="space-y-5">
        ${dim.soal.map((s, i) => `
          <div class="vm-card p-4" style="box-shadow:none;background:#F8FAFC" data-soal="${i}">
            <p class="font-bold text-slate-700 mb-3">${i + 1}. ${s.q}</p>
            <div class="grid grid-cols-2 gap-2">
              ${s.opt.map((o, j) => `
                <button class="vm-btn vm-btn-ghost opt" data-soal="${i}" data-pick="${j}">${o}</button>`).join('')}
            </div>
            <details class="mt-2"><summary class="text-xs font-black text-indigo-brand cursor-pointer"><i class="ph-duotone ph-lightbulb"></i> Petunjuk</summary>
              <p class="text-xs text-slate-500 font-semibold mt-1">${s.hint}</p></details>
            <p class="soal-fb text-sm font-bold mt-2" data-soal="${i}"></p>
          </div>`).join('')}
      </div>
      <button id="dim-submit" class="vm-btn vm-btn-primary w-full mt-5" style="min-height:50px">
        <i class="ph-duotone ph-paper-plane-tilt"></i> Kirim Jawaban</button>
    </section>`;

  // pilih opsi
  body.querySelectorAll('.opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const si = Number(btn.dataset.soal), pj = Number(btn.dataset.pick);
      jawaban[dimIdx][si] = pj;
      body.querySelectorAll(`.opt[data-soal="${si}"]`).forEach((b) =>
        b.className = 'vm-btn ' + (b === btn ? 'vm-btn-primary' : 'vm-btn-ghost'));
    });
  });

  body.querySelector('#dim-submit').addEventListener('click', () => submitDimensi(el));
  setTimeout(renderIcons, 0);
}

function submitDimensi(el) {
  const dim = DIMENSI[dimIdx];
  const ans = jawaban[dimIdx] || {};
  if (Object.keys(ans).length < dim.soal.length) {
    toast('Jawab semua soal dulu ya!', 'no'); return;
  }
  let benar = 0;
  const sid = Store.get().student?.id;
  dim.soal.forEach((s, i) => {
    const fb = el.querySelector(`.soal-fb[data-soal="${i}"]`);
    const ok = ans[i] === s.benar;
    if (ok) { benar++; fb.innerHTML = '<i class="ph-duotone ph-check-circle"></i> Benar!'; fb.style.color = 'var(--ok)'; }
    else { fb.innerHTML = `<i class="ph-duotone ph-x-circle"></i> Belum tepat. Jawaban: ${s.opt[s.benar]}`; fb.style.color = 'var(--no)'; }
    Api.saveAnswer({ studentId: sid, phase: 'asesmen', activityId: `${dim.key}-${i}`,
      questionText: s.q, answerText: s.opt[ans[i]], isCorrect: ok });
  });

  const pct = benar / dim.soal.length;
  const lulus = pct >= CONFIG.PASS_THRESHOLD;
  Store.addScore(benar * 5);

  if (lulus) {
    playSound(true);
    toast(`Hebat! Benar ${benar}/${dim.soal.length} (${Math.round(pct * 100)}%)`, 'ok');
    setTimeout(() => {
      if (dimIdx < DIMENSI.length - 1) {
        dimIdx++; paintProgress(el); paintDimensi(el);
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        finishAsesmen(el);
      }
    }, 1100);
  } else {
    playSound(false);
    toast(`Benar ${benar}/${dim.soal.length}. Perlu 70% untuk lanjut. Coba perbaiki ya!`, 'no');
  }
}

function finishAsesmen(el) {
  const st = Store.get();
  Store.setProgress('asesmen', true);
  Store.addBadge('juara-pecahan');
  const result = { studentId: st.student?.id, studentName: st.student?.name, totalScore: st.score, submittedAt: new Date().toISOString() };
  Store.setAssessment(result);
  Api.saveAssessment(result);
  celebrate(); playSound(true);
  el.querySelector('#dim-body').innerHTML = `
    <section class="vm-card p-8 text-center fade-up" style="background:linear-gradient(135deg,#ECFDF5,#fff)">
      <div class="pop mb-2"><i class="ph-duotone ph-trophy" style="font-size:4rem;color:var(--yellow)"></i></div>
      <h3 class="text-2xl font-black text-slate-800">Asesmen Selesai!</h3>
      <p class="text-slate-600 font-semibold mt-1">Kerja bagus, ${st.student?.name || 'Sobat'}! Kamu sudah melewati semua dimensi.</p>
      <button id="go-refleksi" class="vm-btn vm-btn-primary mt-5"><i class="ph-duotone ph-heart"></i> Lanjut ke Renungan</button>
    </section>`;
  el.querySelector('#go-refleksi').addEventListener('click', () => Router.go('refleksi'));
  setTimeout(renderIcons, 0);
}
