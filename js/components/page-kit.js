// page-kit.js — potongan UI yang dipakai berulang antar-halaman (konsisten = "cantik").

import { Store } from '../store.js';
import { Router } from '../router.js';
import { celebrate, toast, playSound } from './toast.js';

// Judul halaman dengan ikon Lucide (BUKAN emoji — sesuai kebijakan ikon §13).
export function pageHeader(icon, title, subtitle) {
  return `
    <div class="mb-5">
      <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2.5">
        <span style="width:42px;height:42px;border-radius:14px;background:rgba(91,141,239,.1);display:inline-flex;align-items:center;justify-content:center">
          <i data-lucide="${icon}" style="color:var(--indigo)"></i></span>
        ${title}
      </h2>
      ${subtitle ? `<p class="text-slate-500 font-semibold mt-1.5 ml-1">${subtitle}</p>` : ''}
    </div>`;
}

// Kartu maskot memberi pesan (pemandu).
export function mascotNote(text) {
  return `
    <div class="vm-card p-4 flex items-start gap-3" style="background:linear-gradient(135deg,#EEF2FF,#fff)">
      <div class="text-3xl floaty shrink-0" aria-hidden="true">🦉</div>
      <p class="text-sm text-slate-600 font-semibold italic leading-relaxed pt-1">${text}</p>
    </div>`;
}

// Tombol "selesai & lanjut" yang menandai langkah selesai, memberi skor, lalu pindah.
// Pasang via wireFinish(container, ...).
export function finishButton(label = 'Selesai & Lanjut') {
  return `<button data-finish class="vm-btn vm-btn-primary w-full" style="min-height:52px">
    <i data-lucide="check-circle-2"></i> ${label}</button>`;
}

export function wireFinish(container, { stepId, score = 10, badge = null, nextStep, validate } = {}) {
  const btn = container.querySelector('[data-finish]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (validate && !validate()) return; // validate menampilkan pesannya sendiri
    Store.setProgress(stepId, true);
    Store.addScore(score);
    if (badge) Store.addBadge(badge);
    playSound(true);
    celebrate();
    toast('Hebat! Langkah selesai 🎉', 'ok');
    if (nextStep) setTimeout(() => Router.go(nextStep), 900);
  });
}
