// organisasi.js — Fase 2 (Mengorganisasi siswa). Label siswa: "Bentuk Tim".
// Daftar anggota tim + "Mari Pahami" (apa diketahui/ditanya/info penting/rencana cara).

import { Store } from '../store.js';
import { Api } from '../api.js';
import { pageHeader, mascotNote, finishButton, wireFinish } from '../components/page-kit.js';
import { renderIcons, toast } from '../components/toast.js';

const KOTAK = [
  { id: 'tahu', icon: 'search', warna: 'var(--indigo)', label: 'Apa yang sudah kita ketahui?', hint: 'Tulis angka & fakta dari cerita.' },
  { id: 'tanya', icon: 'help-circle', warna: 'var(--purple)', label: 'Apa yang ditanyakan?', hint: 'Apa yang harus kita cari?' },
  { id: 'penting', icon: 'lightbulb', warna: '#0D9488', label: 'Informasi paling penting?', hint: 'Bagian mana yang jadi kunci?' },
  { id: 'cara', icon: 'route', warna: '#D97706', label: 'Rencana cara menyelesaikan?', hint: 'Langkah apa yang akan dicoba?' },
];

export function renderOrganisasi(container) {
  const el = document.createElement('div');
  el.className = 'fade-up space-y-5';
  const st = Store.get();
  const members = st.student?.groupName ? [st.student.name] : [st.student?.name || ''];

  el.innerHTML = `
    ${pageHeader('users', 'Bentuk Tim', 'Petualangan lebih seru bersama tim! Tuliskan anggota timmu, lalu pahami masalahnya bersama-sama.')}
    ${mascotNote('Sebelum menyelidiki, hebatnya seorang penyelidik adalah memahami dulu masalahnya. Ayo isi bersama timmu!')}

    <section class="vm-card p-6">
      <h3 class="font-black text-slate-800 flex items-center gap-2 mb-3">
        <i data-lucide="users" style="color:var(--purple)"></i> Anggota Tim
        ${st.student?.groupName ? `<span class="vm-chip ml-1" style="background:#F3E8FF;color:#7C3AED">${st.student.groupName}</span>` : ''}
      </h3>
      <div id="members" class="space-y-2"></div>
      <button id="add-member" class="vm-btn vm-btn-ghost mt-3" style="min-height:40px">
        <i data-lucide="plus"></i> Tambah Anggota</button>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      ${KOTAK.map((k) => `
        <div class="vm-card p-4">
          <p class="font-black text-sm mb-2 flex items-center gap-2" style="color:${k.warna}">
            <i data-lucide="${k.icon}" style="width:18px;height:18px"></i> ${k.label}</p>
          <textarea data-pahami="${k.id}" class="vm-textarea" placeholder="${k.hint}">${Store.getAnswer('organisasi-' + k.id)}</textarea>
        </div>`).join('')}
    </section>

    <div id="finish-wrap"></div>`;

  // anggota tim
  const box = el.querySelector('#members');
  function addRow(value = '') {
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';
    row.innerHTML = `<input class="vm-input member-input" placeholder="Nama anggota..." value="${value}">
      <button class="vm-btn vm-btn-ghost del" style="min-height:44px;padding:0 .7rem" aria-label="Hapus"><i data-lucide="trash-2"></i></button>`;
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
      if (!tahu || !tanya) { toast('Isi dulu "yang diketahui" dan "yang ditanyakan" ya!', 'no'); return false; }
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
