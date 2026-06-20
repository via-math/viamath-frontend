// home.js — Beranda. Sambutan, peta petualangan (bahasa anak), tujuan, dashboard progres.

import { STEPS } from '../config.js';
import { Store } from '../store.js';
import { Router } from '../router.js';
import { renderIcons } from '../components/toast.js';

const TUJUAN = [
  'Memahami pecahan sebagai bagian dari keseluruhan',
  'Menemukan pecahan senilai dengan caramu sendiri',
  'Membandingkan pecahan memakai tanda <, >, dan =',
  'Menyelesaikan masalah pecahan dalam kehidupan sehari-hari',
];

// Langkah petualangan = STEPS tanpa 'home'. Label bahasa anak; TANPA kata "Fase".
const PETUALANGAN = STEPS.filter((s) => s.id !== 'home');

export function renderHome(container) {
  const st = Store.get();
  const pct = Store.overallPct();
  const el = document.createElement('div');
  el.className = 'fade-up space-y-6';

  el.innerHTML = `
    <!-- Hero -->
    <section class="vm-card overflow-hidden relative p-7 md:p-9"
      style="background:linear-gradient(135deg,#EEF2FF,#FAF5FF 60%,#fff)">
      <div class="absolute right-4 bottom-2 text-[8rem] md:text-[10rem] floaty opacity-20 pointer-events-none select-none" aria-hidden="true">🦉</div>
      <div class="relative z-10 max-w-lg">
        <span class="vm-chip" style="background:#fff;color:var(--indigo);box-shadow:var(--shadow-card)">
          <span style="width:8px;height:8px;border-radius:9px;background:var(--indigo);display:inline-block"></span>
          Petualangan Pecahan
        </span>
        <h2 class="text-2xl md:text-3xl font-black text-slate-800 mt-4 leading-tight">
          Selamat datang, <span style="background:linear-gradient(135deg,var(--indigo),var(--purple));-webkit-background-clip:text;background-clip:text;color:transparent">${st.student ? st.student.name : 'Sobat Pintar'}!</span>
        </h2>
        <p class="text-slate-600 font-semibold mt-2">Ayo belajar pecahan lewat cerita seru, menyelidiki bersama tim, dan memamerkan hasil temuanmu.</p>
        <button id="home-start" class="vm-btn vm-btn-primary mt-5"><i data-lucide="rocket"></i> Mulai Petualangan</button>
      </div>
    </section>

    <!-- Peta petualangan -->
    <section>
      <h3 class="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
        <i data-lucide="map" style="color:var(--indigo)"></i> Peta Petualanganmu
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        ${PETUALANGAN.map((s, i) => {
          const done = isStepDone(s.id, st);
          return `
          <button data-go="${s.id}" class="vm-card p-4 text-left card-step hover:-translate-y-1 transition-transform"
            style="transition:transform .2s,box-shadow .2s">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                style="background:${done ? 'rgba(16,185,129,.12)' : 'rgba(91,141,239,.1)'}">
                <i data-lucide="${done ? 'check' : s.icon}" style="color:${done ? 'var(--ok)' : 'var(--indigo)'}"></i>
              </div>
              <span class="text-[10px] font-black tracking-widest text-slate-400">LANGKAH ${i + 1}</span>
            </div>
            <p class="font-black text-slate-800 mt-3">${s.label}</p>
            <p class="text-xs text-slate-500 font-semibold mt-1">${deskripsi(s.id)}</p>
          </button>`;
        }).join('')}
      </div>
    </section>

    <!-- Tujuan + Progres -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="vm-card p-6">
        <h3 class="font-black text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <i data-lucide="target" style="color:var(--indigo)"></i> Tujuan Belajar
        </h3>
        <ul class="space-y-3">
          ${TUJUAN.map((t) => `
            <li class="flex items-start gap-3 text-sm text-slate-600 font-semibold">
              <span style="width:22px;height:22px;border-radius:8px;background:rgba(16,185,129,.12);color:var(--ok);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                <i data-lucide="check" style="width:15px;height:15px"></i></span>
              ${t}
            </li>`).join('')}
        </ul>
      </section>

      <section class="vm-card p-6">
        <h3 class="font-black text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <i data-lucide="bar-chart-3" style="color:var(--purple)"></i> Kemajuanmu
        </h3>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-bold text-slate-500">Progres belajar</span>
          <span class="vm-chip" style="background:#EEF2FF;color:var(--indigo)">${pct}%</span>
        </div>
        <div style="height:14px;background:#EEF2F7;border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;border-radius:99px;transition:width .8s ease;background:linear-gradient(90deg,var(--indigo),var(--purple),var(--mint))"></div>
        </div>
        <div class="grid grid-cols-3 gap-3 mt-5 text-center">
          <div class="p-3 rounded-2xl" style="background:#FEF9C3">
            <p class="text-2xl font-black" style="color:#A16207">${st.score}</p>
            <p class="text-[10px] font-black text-amber-800/70 uppercase mt-0.5">Skor</p>
          </div>
          <div class="p-3 rounded-2xl" style="background:#F3E8FF">
            <p class="text-2xl font-black" style="color:#7C3AED">${st.badges.length}</p>
            <p class="text-[10px] font-black text-purple-800/70 uppercase mt-0.5">Badge</p>
          </div>
          <div class="p-3 rounded-2xl" style="background:#DCFCE7">
            <p class="text-2xl font-black" style="color:#15803D">${countDone(st)}/6</p>
            <p class="text-[10px] font-black text-emerald-800/70 uppercase mt-0.5">Langkah</p>
          </div>
        </div>
      </section>
    </div>`;

  el.querySelector('#home-start').addEventListener('click', () => Router.go('masalah'));
  el.querySelectorAll('[data-go]').forEach((b) =>
    b.addEventListener('click', () => Router.go(b.dataset.go)));

  setTimeout(renderIcons, 0);
  return el;
}

function deskripsi(id) {
  return {
    masalah: 'Temukan masalah pecahan dalam cerita',
    organisasi: 'Bentuk tim & pahami masalahnya',
    penyelidikan: 'Selidiki dan temukan jawabannya',
    pameran: 'Tunjukkan hasil temuan timmu',
    asesmen: 'Uji seberapa hebat kamu',
    refleksi: 'Renungkan apa yang kamu pelajari',
  }[id] || '';
}
function isStepDone(id, st) {
  const v = st.progress[id];
  return typeof v === 'number' ? v >= 1 : !!v;
}
function countDone(st) {
  return ['masalah', 'organisasi', 'penyelidikan', 'pameran', 'asesmen', 'refleksi']
    .filter((id) => isStepDone(id, st)).length;
}
