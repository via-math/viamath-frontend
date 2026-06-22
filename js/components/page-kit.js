// page-kit.js — potongan UI yang dipakai berulang antar-halaman (konsisten = "cantik").

import { Store } from '../store.js';
import { Router } from '../router.js';
import { DRIVING_PROBLEM } from '../config.js';
import { celebrate, toast, playSound } from './toast.js';

// Banner "masalah petualangan kita" — pengingat driving problem di tiap fase (A′).
// Menjaga benang merah satu masalah lintas sintaks Arends.
export function problemBanner() {
  const p = DRIVING_PROBLEM;
  return `
    <div class="vm-card p-4" style="background:linear-gradient(135deg,#FFF7ED,#fff);border-left:5px solid var(--peach)">
      <p class="text-xs font-black text-amber-700 flex items-center gap-1.5"><i class="ph-duotone ph-target"></i> MASALAH PETUALANGAN KITA</p>
      <p class="font-black text-slate-800 mt-1 flex items-center gap-1.5"><img src="img/${p.img}.svg" alt="" style="width:1.4rem;height:1.4rem"> ${p.title}</p>
      <p class="text-sm text-slate-600 font-semibold mt-0.5">${p.story}</p>
      <p class="text-sm font-bold text-indigo-brand mt-1.5"><i class="ph-duotone ph-question"></i> ${p.question}</p>
    </div>`;
}

// Judul halaman dengan ikon Phosphor (BUKAN emoji — sesuai kebijakan ikon §13).
export function pageHeader(icon, title, subtitle) {
  return `
    <div class="mb-5">
      <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2.5">
        <span style="width:42px;height:42px;border-radius:14px;background:rgba(91,141,239,.1);display:inline-flex;align-items:center;justify-content:center">
          <i class="ph-duotone ph-${icon}" style="color:var(--indigo)"></i></span>
        ${title}
      </h2>
      ${subtitle ? `<p class="text-slate-500 font-semibold mt-1.5 ml-1">${subtitle}</p>` : ''}
    </div>`;
}

// Kartu maskot memberi pesan (pemandu).
export function mascotNote(text) {
  return `
    <div class="vm-card p-4 flex items-start gap-3" style="background:linear-gradient(135deg,#EEF2FF,#fff)">
      <div class="floaty shrink-0" aria-hidden="true"><i class="ph-duotone ph-bird" style="font-size:2.2rem;color:var(--indigo)"></i></div>
      <p class="text-sm text-slate-600 font-semibold italic leading-relaxed pt-1">${text}</p>
    </div>`;
}

// Tombol "selesai & lanjut" yang menandai langkah selesai, memberi skor, lalu pindah.
// Pasang via wireFinish(container, ...).
export function finishButton(label = 'Selesai & Lanjut') {
  return `<button data-finish class="vm-btn vm-btn-primary w-full" style="min-height:52px">
    <i class="ph-duotone ph-check-circle"></i> ${label}</button>`;
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
    toast('Hebat! Langkah ini selesai', 'ok');
    if (nextStep) setTimeout(() => Router.go(nextStep), 900);
  });
}

// Dialog konfirmasi bergaya ViaMath (pengganti window.confirm bawaan).
// Mengembalikan Promise<boolean>: true bila tombol setuju ditekan.
export function confirmDialog({
  title = 'Yakin?',
  message = '',
  confirmText = 'Ya',
  cancelText = 'Batal',
  icon = 'question',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.style.cssText =
      'position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;' +
      'padding:1rem;background:rgba(15,23,42,.45);backdrop-filter:blur(2px);';
    const accent = danger ? 'var(--no)' : 'var(--indigo)';
    back.innerHTML = `
      <div class="vm-card pop" style="max-width:24rem;width:100%;padding:1.75rem;text-align:center" role="dialog" aria-modal="true">
        <div class="floaty" style="margin-bottom:.5rem">
          <i class="ph-duotone ph-bird" style="font-size:3.2rem;color:${accent}"></i>
        </div>
        <div style="display:inline-flex;align-items:center;gap:.5rem;justify-content:center;margin-bottom:.25rem">
          <i class="ph-duotone ph-${icon}" style="color:${accent};font-size:1.4rem"></i>
          <h3 class="font-black text-slate-800" style="font-size:1.15rem">${title}</h3>
        </div>
        <p class="text-slate-600 font-semibold" style="font-size:.95rem;line-height:1.5;margin:.25rem 0 1.25rem">${message}</p>
        <div style="display:flex;gap:.6rem">
          <button data-no class="vm-btn vm-btn-ghost" style="flex:1">${cancelText}</button>
          <button data-yes class="vm-btn vm-btn-primary" style="flex:1;${danger ? 'background:linear-gradient(135deg,#FB7185,#F43F5E)' : ''}">${confirmText}</button>
        </div>
      </div>`;

    function close(result) {
      back.style.opacity = '0';
      back.style.transition = 'opacity .2s';
      setTimeout(() => back.remove(), 200);
      resolve(result);
    }
    back.querySelector('[data-yes]').addEventListener('click', () => close(true));
    back.querySelector('[data-no]').addEventListener('click', () => close(false));
    back.addEventListener('click', (e) => { if (e.target === back) close(false); }); // klik luar = batal
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); }
    });
    document.body.appendChild(back);
    back.querySelector('[data-no]').focus();
  });
}
