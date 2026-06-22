// organisasi.js — Fase 2 (Mengorganisasi siswa). Label siswa: "Bentuk Tim".
// Daftar anggota tim + "Mari Pahami" (apa diketahui/ditanya/info penting/rencana cara).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { pageHeader, mascotNote, problemBanner, finishButton, wireFinish } from '../components/page-kit.js';
import { renderIcons, toast } from '../components/toast.js';

const KOTAK = [
  { id: 'tahu', icon: 'magnifying-glass', warna: 'var(--indigo)', label: 'Apa yang sudah kita ketahui?', hint: 'Tulis angka & fakta dari cerita tadi. Contoh: kue dipotong 8 bagian.' },
  { id: 'tanya', icon: 'question', warna: 'var(--purple)', label: 'Apa yang harus kita cari?', hint: 'Tuliskan pertanyaan yang harus dijawab.' },
  { id: 'penting', icon: 'lightbulb', warna: '#0D9488', label: 'Petunjuk paling penting?', hint: 'Angka atau kata mana yang paling membantu?' },
  { id: 'cara', icon: 'path', warna: '#D97706', label: 'Bagaimana cara menyelesaikannya?', hint: 'Langkah apa yang akan kamu coba lebih dulu?' },
];

export function renderOrganisasi(container) {
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  const st = Store.get();
  const members = st.student?.groupName ? [st.student.name] : [st.student?.name || ''];

  el.innerHTML = `
    ${pageHeader('users', 'Bentuk Tim', 'Petualangan lebih seru bersama tim! Tuliskan anggota timmu, lalu pahami masalahnya bersama-sama.')}
    ${mascotNote('Penyelidik hebat selalu memahami masalahnya dulu, baru mencari jawaban. Ayo pahami bersama timmu!')}
    ${problemBanner()}

    <section class="vm-card p-6">
      <h3 class="font-black text-slate-800 flex items-center gap-2 mb-3">
        <i class="ph-duotone ph-users" style="color:var(--purple)"></i> Anggota Tim
        ${st.student?.groupName ? `<span class="vm-chip ml-1" style="background:#F3E8FF;color:#7C3AED">${st.student.groupName}</span>` : ''}
      </h3>
      <div id="members" class="space-y-2"></div>
      <button id="add-member" class="vm-btn vm-btn-ghost mt-3" style="min-height:40px">
        <i class="ph-duotone ph-plus"></i> Tambah Anggota</button>
    </section>

    <section>
      <h3 class="font-black text-slate-800 flex items-center gap-2 mb-1">
        <i class="ph-duotone ph-lightbulb" style="color:var(--indigo)"></i> Mari Pahami Masalahnya
      </h3>
      <p class="text-slate-500 font-semibold text-sm mb-3">Ingat cerita pizza atau kue tadi, lalu isi 4 kotak ini bersama timmu.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${KOTAK.map((k) => `
          <div class="vm-card p-4">
            <p class="font-black text-sm mb-2 flex items-center gap-2" style="color:${k.warna}">
              <i class="ph-duotone ph-${k.icon}"></i> ${k.label}</p>
            <textarea data-pahami="${k.id}" class="vm-textarea" placeholder="${k.hint}">${Store.getAnswer('organisasi-' + k.id)}</textarea>
          </div>`).join('')}
      </div>
    </section>

    <div id="finish-wrap"></div>`;

  // anggota tim
  const box = el.querySelector('#members');
  function addRow(value = '') {
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';
    row.innerHTML = `<input class="vm-input member-input" placeholder="Nama anggota..." value="${value}">
      <button class="vm-btn vm-btn-ghost del" style="min-height:44px;padding:0 .7rem" aria-label="Hapus"><i class="ph-duotone ph-trash"></i></button>`;
    row.querySelector('.del').addEventListener('click', () => { row.remove(); });
    box.appendChild(row);
    renderIcons();
  }
  members.forEach((m) => addRow(m));
  el.querySelector('#add-member').addEventListener('click', () => addRow());

  // simpan jawaban "mari pahami" saat mengetik
  el.querySelectorAll('[data-pahami]').forEach((ta) => {
    ta.addEventListener('change', () => Store.saveAnswer('organisasi-' + ta.dataset.pahami, ta.value));
  });

  const fin = el.querySelector('#finish-wrap');
  fin.innerHTML = finishButton('Tim Siap Menyelidiki!');

  wireFinish(el, {
    stepId: 'organisasi', score: 10, badge: 'tim-hebat', nextStep: 'penyelidikan',
    validate: () => {
      const tahu = el.querySelector('[data-pahami="tahu"]').value.trim();
      const tanya = el.querySelector('[data-pahami="tanya"]').value.trim();
      if (!tahu || !tanya) { toast('Isi dulu "yang diketahui" dan "yang harus dicari" ya!', 'no'); return false; }
      // kirim ringkas ke backend
      const sid = Store.get().student?.id;
      KOTAK.forEach((k) => Api.saveAnswer({ studentId: sid, phase: 'organisasi',
        activityId: k.id, questionText: k.label, answerText: el.querySelector(`[data-pahami="${k.id}"]`).value }));
      return true;
    },
  });

  setTimeout(renderIcons, 0);
  return el;
}
