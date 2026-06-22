// masalah.js — Fase 1 (Orientasi pada masalah). Label siswa: "Tantangan Cerita".
// Dua cerita kontekstual + visual interaktif. Kunci "habis" DISEMBUNYIKAN sampai anak menjawab (audit K-3).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { fractionCircle, fracHTML } from '../components/fraction-circle.js';
import { pageHeader, mascotNote, problemBanner, finishButton, wireFinish } from '../components/page-kit.js';
import { renderIcons, toast } from '../components/toast.js';

const CERITA = {
  1: {
    icon: 'pizza', judul: 'Pesta Pizza Rara',
    teks: 'Hari ini Rara berulang tahun! Ibu membeli 1 pizza besar lalu memotongnya menjadi 8 bagian sama besar. Rara dan 3 temannya masing-masing mengambil 2 potong pizza.',
    total: 8, filled: 8, color: '#FCD34D',
    orang: [['Rara', 2], ['Teman 1', 2], ['Teman 2', 2], ['Teman 3', 2]],
    tanya: [
      'Berapa bagian pizza yang dimakan Rara? Tulis dalam bentuk pecahan!',
      'Berapa bagian pizza yang dimakan semua anak?',
      'Apakah masih ada pizza yang tersisa? Berapa bagian?',
    ],
  },
  2: {
    icon: 'cake', judul: 'Berbagi Kue Bersama',
    teks: 'Budi membawa 1 kue ke sekolah untuk berbagi. Kue dipotong menjadi 6 bagian sama besar. Budi memberi 2 potong kepada Ani, 1 potong kepada Doni, dan sisanya untuk dirinya sendiri.',
    total: 6, filled: 6, color: '#A78BFA',
    orang: [['Ani', 2], ['Doni', 1], ['Budi', 3]],
    tanya: [
      'Berapa bagian kue yang diterima Ani? Tulis dalam pecahan!',
      'Siapa yang mendapat bagian kue paling banyak?',
      'Menurutmu, apakah pembagian ini adil? Mengapa?',
    ],
  },
};

let aktif = 1;

export function renderMasalah(container) {
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  el.innerHTML = `
    ${pageHeader('puzzle', 'Tantangan Cerita', 'Bacalah cerita berikut, lalu pikirkan jawabannya. Petualangan dimulai dari sebuah masalah!')}
    ${mascotNote('Setiap petualangan hebat dimulai dari sebuah masalah. Yuk, baca ceritanya dan temukan pecahannya!')}
    ${problemBanner()}
    <div class="flex gap-2 vm-scroll-x pb-1">
      <button data-cerita="1" class="vm-btn cerita-tab"></button>
      <button data-cerita="2" class="vm-btn cerita-tab"></button>
    </div>
    <div id="cerita-box"></div>`;

  function paintTabs() {
    el.querySelectorAll('[data-cerita]').forEach((b) => {
      const id = Number(b.dataset.cerita);
      const on = id === aktif;
      b.className = 'vm-btn ' + (on ? 'vm-btn-primary' : 'vm-btn-ghost');
      b.innerHTML = `<i class="ph-duotone ph-${CERITA[id].icon}"></i> Cerita ${id}: ${id === 1 ? 'Pizza' : 'Kue'}`;
    });
  }

  function paintCerita() {
    const c = CERITA[aktif];
    const box = el.querySelector('#cerita-box');
    box.innerHTML = `
      <div class="vm-card p-6 md:p-7 fade-up">
        <h3 class="text-xl font-black text-slate-800 mb-1 flex items-center gap-2"><i class="ph-duotone ph-${c.icon}" style="color:var(--indigo)"></i> ${c.judul}</h3>
        <p class="text-slate-600 font-semibold leading-relaxed">${c.teks}</p>

        <div class="my-6 flex flex-col items-center">
          ${fractionCircle(c.filled, c.total, c.color, 190)}
          <p class="text-xs font-bold text-slate-500 mt-3">${c.total} potongan sama besar</p>
        </div>

        <!-- siapa makan apa -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          ${c.orang.map(([nama, n]) => `
            <div class="vm-card p-3 text-center" style="box-shadow:none;border-color:#EEF2F7">
              <p class="font-black text-slate-700 text-sm mb-1">${nama}</p>
              ${fracHTML(n, c.total)}
            </div>`).join('')}
        </div>

        <!-- pertanyaan pemantik -->
        <div class="mt-6 p-5 rounded-2xl" style="background:#EEF2FF">
          <p class="font-black text-indigo-brand mb-2 flex items-center gap-2"><i class="ph-duotone ph-question"></i> Ayo Pikirkan</p>
          <div class="space-y-3">
            ${c.tanya.map((t, i) => `
              <div>
                <label class="block text-sm text-slate-700 font-semibold mb-1">${i + 1}. ${t}</label>
                <textarea data-q="${i}" rows="2" class="vm-textarea" placeholder="Tulis jawabanmu di sini..."></textarea>
              </div>`).join('')}
          </div>
          <button id="cek-cerita" class="vm-btn vm-btn-ghost mt-3"><i class="ph-duotone ph-eye"></i> Lihat Petunjuk Jawaban</button>
        </div>

        <!-- kunci: disembunyikan sampai anak menjawab -->
        <div id="kunci-box" class="mt-4 p-4 rounded-2xl hidden" style="background:#DCFCE7">
          <p class="font-black text-emerald-700 flex items-center gap-2"><i class="ph-duotone ph-check-circle"></i> Petunjuk</p>
          <p class="text-sm text-emerald-900 font-semibold mt-1">
            Semua ${c.total} potongan ${aktif === 1 ? 'habis dimakan' : 'terbagi'} →
            ${fracHTML(c.total, c.total)} = 1 utuh.
            ${aktif === 1 ? 'Jadi tidak ada sisa!' : 'Budi mendapat bagian terbanyak (3/6).'}
          </p>
        </div>
      </div>`;

    box.querySelector('#cek-cerita').addEventListener('click', () => {
      const inputs = [...box.querySelectorAll('[data-q]')];
      const vals = inputs.map((t) => t.value.trim());
      if (vals.some((v) => v.length < 1)) { toast('Jawab semua pertanyaan dulu ya, baru lihat petunjuk!', 'no'); return; }
      const sid = Store.get().student?.id;
      vals.forEach((v, i) => {
        Store.saveAnswer(`masalah-cerita-${aktif}-q${i + 1}`, v);
        Api.saveAnswer({ studentId: sid, phase: 'masalah',
          activityId: `cerita-${aktif}-q${i + 1}`, questionText: CERITA[aktif].tanya[i], answerText: v });
      });
      box.querySelector('#kunci-box').classList.remove('hidden');
      box.querySelector('#kunci-box').classList.add('pop');
    });

    renderIcons();
  }

  el.querySelectorAll('[data-cerita]').forEach((b) =>
    b.addEventListener('click', () => { aktif = Number(b.dataset.cerita); paintTabs(); paintCerita(); }));

  // tombol selesai (di luar box agar selalu di bawah)
  const finish = document.createElement('div');
  finish.innerHTML = finishButton('Aku Sudah Paham Masalahnya');
  el.appendChild(finish);

  paintTabs();
  paintCerita();
  setTimeout(renderIcons, 0);

  wireFinish(el, { stepId: 'masalah', score: 10, badge: 'penjelajah-cerita', nextStep: 'organisasi' });
  return el;
}
