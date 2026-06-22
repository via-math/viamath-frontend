// pameran.js — Fase 4 (Mengembangkan & menyajikan hasil karya). Label siswa: "Pamerkan Hasil".
// Inti perbaikan dari versi lama: momen MENYAJIKAN jadi halaman berdiri sendiri.
// Siswa membuat karya (soal/temuan) → pamerkan → lihat karya kelompok lain (galeri).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { pageHeader, mascotNote, finishButton, wireFinish } from '../components/page-kit.js';
import { renderIcons, toast, celebrate, playSound } from '../components/toast.js';

export function renderPameran(container) {
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  const st = Store.get();

  el.innerHTML = `
    ${pageHeader('sparkles', 'Pamerkan Hasil', 'Penyelidik hebat membagikan temuannya! Buat satu karya pecahan, lalu pamerkan ke teman-temanmu.')}
    ${mascotNote('Inilah saat membanggakan: tunjukkan hasil kerja timmu! Ceritakan caramu menyelesaikan masalah pizza, atau buat soal pecahanmu sendiri lengkap dengan jawabannya.')}

    <section class="vm-card p-6">
      <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2"><i class="ph-duotone ph-pencil-ruler" style="color:var(--indigo)"></i> Buat Karya Pecahanmu</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-black text-slate-700 mb-1.5 flex items-center gap-1.5"><i class="ph-duotone ph-book-open" style="color:var(--indigo)"></i> Judul Karya</label>
          <input id="pm-title" class="vm-input" placeholder="Contoh: Membagi Martabak Manis">
        </div>
        <div>
          <label class="text-sm font-black text-slate-700 mb-1.5 flex items-center gap-1.5"><i class="ph-duotone ph-globe-hemisphere-west" style="color:var(--indigo)"></i> Ceritakan situasinya</label>
          <textarea id="pm-situ" class="vm-textarea" placeholder="Contoh: Ibu membeli martabak yang dipotong 8 bagian..."></textarea>
        </div>
        <div>
          <label class="text-sm font-black text-slate-700 mb-1.5 flex items-center gap-1.5"><i class="ph-duotone ph-question" style="color:var(--indigo)"></i> Soal pecahan buatanmu</label>
          <textarea id="pm-soal" class="vm-textarea" placeholder="Contoh: Jika 3 potong dimakan, berapa pecahan yang dimakan?"></textarea>
        </div>
        <div>
          <label class="text-sm font-black text-slate-700 mb-1.5 flex items-center gap-1.5"><i class="ph-duotone ph-check-circle" style="color:var(--ok)"></i> Jawaban & penjelasan</label>
          <textarea id="pm-jawab" class="vm-textarea" placeholder="Contoh: 3/8, karena 3 dari 8 bagian..."></textarea>
        </div>
        <button id="pm-publish" class="vm-btn vm-btn-primary w-full" style="min-height:50px">
          <i class="ph-duotone ph-megaphone"></i> Pamerkan Karyaku!</button>
      </div>
    </section>

    <section>
      <h3 class="font-black text-slate-800 mb-3 flex items-center gap-2"><i class="ph-duotone ph-images" style="color:var(--purple)"></i> Galeri Karya</h3>
      <div id="pm-gallery" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
    </section>

    <div id="pm-finish"></div>`;

  const gallery = el.querySelector('#pm-gallery');

  function paintGallery() {
    const mine = Store.get().showcases;
    if (!mine.length) {
      gallery.innerHTML = `<div class="vm-card p-6 text-center text-slate-400 font-semibold sm:col-span-2">
        <div class="mb-2"><i class="ph-duotone ph-image-square" style="font-size:2.5rem;color:#CBD5E1"></i></div>Belum ada karya. Jadilah yang pertama memamerkan!</div>`;
      return;
    }
    gallery.innerHTML = mine.map((s) => `
      <div class="vm-card p-5 fade-up" style="border-left:5px solid var(--purple)">
        <div class="flex items-center gap-2 mb-2">
          <i class="ph-duotone ph-sparkle" style="color:var(--purple);font-size:1.3rem"></i>
          <h4 class="font-black text-slate-800">${escapeHtml(s.title || 'Tanpa Judul')}</h4>
        </div>
        <p class="text-xs text-slate-500 font-bold mb-2">oleh ${escapeHtml(s.by || 'Aku')} ${s.groupName ? '· ' + escapeHtml(s.groupName) : ''}</p>
        ${s.situation ? `<p class="text-sm text-slate-600 font-semibold mb-1">${escapeHtml(s.situation)}</p>` : ''}
        <p class="text-sm font-bold text-indigo-brand mt-2 flex items-start gap-1.5"><i class="ph-duotone ph-question" style="margin-top:2px"></i> ${escapeHtml(s.problem || '')}</p>
        <details class="mt-2">
          <summary class="text-xs font-black text-emerald-700 cursor-pointer">Lihat jawaban</summary>
          <p class="text-sm text-slate-600 font-semibold mt-1">${escapeHtml(s.solution || '')}</p>
        </details>
      </div>`).join('');
  }

  el.querySelector('#pm-publish').addEventListener('click', () => {
    const title = el.querySelector('#pm-title').value.trim();
    const situation = el.querySelector('#pm-situ').value.trim();
    const problem = el.querySelector('#pm-soal').value.trim();
    const solution = el.querySelector('#pm-jawab').value.trim();
    if (!title || !problem || !solution) {
      toast('Lengkapi judul, soal, dan jawaban dulu ya!', 'no'); return;
    }
    const item = { title, situation, problem, solution, by: st.student?.name, groupName: st.student?.groupName };
    Store.addShowcase(item);
    Api.sendShowcase({ studentId: st.student?.id, ...item }); // dilihat kelompok lain via backend
    playSound(true); celebrate(); toast('Karyamu berhasil dipamerkan!', 'ok');
    // bersihkan form
    ['#pm-title', '#pm-situ', '#pm-soal', '#pm-jawab'].forEach((s) => { el.querySelector(s).value = ''; });
    paintGallery();
  });

  el.querySelector('#pm-finish').innerHTML = finishButton('Selesai Memamerkan');
  wireFinish(el, {
    stepId: 'pameran', score: 15, badge: 'bintang-panggung', nextStep: 'asesmen',
    validate: () => {
      if (!Store.get().showcases.length) { toast('Pamerkan minimal 1 karya dulu ya!', 'no'); return false; }
      return true;
    },
  });

  paintGallery();
  setTimeout(renderIcons, 0);
  return el;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
