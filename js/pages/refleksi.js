// refleksi.js — Fase 5 (Menganalisis & mengevaluasi proses). Label siswa: "Renungkan".
// Pertanyaan reflektif + penilaian diri (skala emoji — feedback emosional sengaja dipertahankan).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { pageHeader, mascotNote, finishButton, wireFinish } from '../components/page-kit.js';
import { renderIcons, toast, celebrate } from '../components/toast.js';

const PERTANYAAN = [
  'Apa hal baru yang kamu pelajari hari ini?',
  'Bagian mana yang paling seru menurutmu?',
  'Apa bagian yang menurutmu sulit?',
  'Bagaimana timmu bekerja sama hari ini?',
  'Di mana kamu bisa memakai pecahan dalam kehidupan sehari-hari?',
];

const SKALA = [
  { e: '😟', label: 'Belum paham' },
  { e: '😐', label: 'Sedikit paham' },
  { e: '🙂', label: 'Paham' },
  { e: '😄', label: 'Sangat paham' },
];

const PERNYATAAN = [
  'Aku memahami konsep pecahan',
  'Aku bisa membandingkan pecahan',
  'Aku percaya diri belajar matematika',
];

export function renderRefleksi(container) {
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  const selfState = {}; // pernyataanIdx -> nilai 1..4

  el.innerHTML = `
    ${pageHeader('heart', 'Renungkan', 'Petualangan hebat selalu diakhiri dengan merenung. Ceritakan pengalamanmu hari ini!')}
    ${mascotNote('Kamu sudah melewati seluruh petualangan! Yuk, renungkan sejenak apa yang kamu rasakan dan pelajari.')}

    <section class="vm-card p-6 space-y-4">
      ${PERTANYAAN.map((q, i) => `
        <div>
          <label class="text-sm font-black text-slate-700 block mb-1.5">${i + 1}. ${q}</label>
          <textarea data-refleksi="${i}" class="vm-textarea" placeholder="Tulis perasaan & pendapatmu...">${Store.getAnswer('refleksi-' + i)}</textarea>
        </div>`).join('')}
    </section>

    <section class="vm-card p-6">
      <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="smile" style="color:var(--purple)"></i> Penilaian Diri</h3>
      <div class="space-y-4">
        ${PERNYATAAN.map((p, i) => `
          <div class="vm-card p-4" style="box-shadow:none;background:#F8FAFC">
            <p class="font-bold text-slate-700 mb-2 text-sm">${p}</p>
            <div class="flex gap-2 justify-center flex-wrap">
              ${SKALA.map((s, j) => `
                <button class="self-btn vm-btn vm-btn-ghost" data-p="${i}" data-v="${j + 1}" title="${s.label}"
                  style="flex-direction:column;min-height:64px;min-width:64px">
                  <span style="font-size:1.6rem">${s.e}</span>
                  <span style="font-size:.6rem">${s.label}</span></button>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </section>

    <div id="ref-finish"></div>

    <section class="vm-card p-7 text-center" style="background:linear-gradient(135deg,#EEF2FF,#FAF5FF)">
      <div class="text-5xl mb-2">🎉</div>
      <h3 class="text-xl font-black text-slate-800">Selamat, Penjelajah Pecahan!</h3>
      <p class="text-slate-600 font-semibold mt-1">Kamu telah menuntaskan seluruh Petualangan Pecahan. Teruslah menemukan pecahan di sekitarmu!</p>
    </section>`;

  // simpan jawaban refleksi
  el.querySelectorAll('[data-refleksi]').forEach((ta) =>
    ta.addEventListener('change', () => Store.saveAnswer('refleksi-' + ta.dataset.refleksi, ta.value)));

  // penilaian diri
  el.querySelectorAll('.self-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.p;
      selfState[p] = Number(btn.dataset.v);
      el.querySelectorAll(`.self-btn[data-p="${p}"]`).forEach((b) =>
        b.className = 'self-btn vm-btn ' + (b === btn ? 'vm-btn-primary' : 'vm-btn-ghost'));
    });
  });

  el.querySelector('#ref-finish').innerHTML = finishButton('Kirim Renungan & Selesai');
  wireFinish(el, {
    stepId: 'refleksi', score: 10, badge: 'penjelajah-tuntas', nextStep: 'home',
    validate: () => {
      const isi = el.querySelector('[data-refleksi="0"]').value.trim();
      if (!isi) { toast('Tulis dulu satu renungan ya!', 'no'); return false; }
      const sid = Store.get().student?.id;
      PERTANYAAN.forEach((q, i) => Api.saveAnswer({ studentId: sid, phase: 'refleksi',
        activityId: 'q' + i, questionText: q, answerText: el.querySelector(`[data-refleksi="${i}"]`).value }));
      Api.saveAnswer({ studentId: sid, phase: 'refleksi', activityId: 'penilaian-diri',
        questionText: 'Penilaian diri', answerText: JSON.stringify(selfState) });
      celebrate();
      return true;
    },
  });

  setTimeout(renderIcons, 0);
  return el;
}
