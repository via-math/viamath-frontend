// onboarding.js — layar "Kenalan dulu": siswa ketik nama + pilih sekolah + kelas (tanpa password).
// Mengikuti §3.2/§5 Blueprint. Setelah submit → daftarkan ke backend (best-effort) & lanjut app.

import { Store } from '../store.js';
import { Api } from '../api.js';
import { toast, renderIcons } from '../components/toast.js';

// Normalisasi sederhana sisi-klien (backend tetap menormalkan lagi).
function norm(s) {
  return s.trim().replace(/\s+/g, ' ');
}
function titleCase(s) {
  return norm(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

export function renderOnboarding(container, onDone) {
  container.innerHTML = `
    <div class="min-h-full w-full flex items-center justify-center p-4"
         style="background:radial-gradient(1200px 600px at 70% -10%, rgba(167,139,250,.18), transparent), var(--bg)">
      <div class="vm-card fade-up w-full max-w-md p-7 md:p-9">
        <div class="text-center mb-6">
          <div class="floaty mb-2" aria-hidden="true"><i class="ph-duotone ph-bird" style="font-size:4.5rem;color:var(--indigo)"></i></div>
          <h1 class="text-2xl font-black text-slate-800">Selamat Datang di ViaMath!</h1>
          <p class="text-slate-500 font-semibold mt-1 text-sm">Aku <b>Sobat Pintar</b>, pemandu petualanganmu.<br>Kenalan dulu, yuk!</p>
        </div>

        <form id="ob-form" class="space-y-4">
          <div>
            <label class="block text-sm font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <i class="ph-duotone ph-user" style="width:18px;height:18px;color:var(--indigo)"></i> Nama Panggilanmu
            </label>
            <input id="ob-name" class="vm-input" placeholder="Contoh: Rara" autocomplete="off" required />
          </div>
          <div>
            <label class="block text-sm font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <i class="ph-duotone ph-student" style="width:18px;height:18px;color:var(--indigo)"></i> Asal Sekolah
            </label>
            <input id="ob-school" class="vm-input" placeholder="Contoh: SDN Mekar Jaya 1" autocomplete="off" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-black text-slate-700 mb-1.5">Kelas</label>
              <select id="ob-class" class="vm-select" required>
                <option value="">Pilih…</option>
                <option>5A</option><option>5B</option><option>5C</option>
                <option>5D</option><option>5E</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-black text-slate-700 mb-1.5">Kelompok</label>
              <select id="ob-group" class="vm-select">
                <option value="">(opsional)</option>
                <option>Kelompok 1</option><option>Kelompok 2</option>
                <option>Kelompok 3</option><option>Kelompok 4</option>
                <option>Kelompok 5</option><option>Kelompok 6</option>
              </select>
            </div>
          </div>

          <button type="submit" class="vm-btn vm-btn-primary w-full" style="min-height:50px">
            <i class="ph-duotone ph-rocket-launch"></i> Mulai Petualangan
          </button>
          <p class="text-[11px] text-center text-slate-400 font-semibold">
            Tanpa kata sandi. Datamu hanya untuk membantu gurumu memantau belajarmu.
          </p>
        </form>
      </div>
    </div>`;

  renderIcons();

  const form = container.querySelector('#ob-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = titleCase(container.querySelector('#ob-name').value);
    const school = titleCase(container.querySelector('#ob-school').value);
    const className = norm(container.querySelector('#ob-class').value).toUpperCase();
    const groupName = norm(container.querySelector('#ob-group').value);

    if (!name || !school || !className) {
      toast('Lengkapi nama, sekolah, dan kelas dulu ya!', 'no');
      return;
    }

    // classCode = penghubung ke dashboard guru (sekolah disingkat + kelas)
    const schoolCode = school.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 4);
    const classCode = `${className}-${schoolCode}`;

    const student = { name, school, className, groupName, classCode };

    // Daftarkan ke backend (best-effort; offline tetap lanjut)
    const res = await Api.registerStudent(student);
    if (res && res.data && res.data.id) student.id = res.data.id;

    Store.setStudent(student);
    toast(`Halo, ${name}! Ayo mulai!`, 'ok');
    if (onDone) onDone();
  });
}
