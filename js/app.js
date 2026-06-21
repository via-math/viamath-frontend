// app.js — titik masuk aplikasi. Merangkai shell, sidebar, header, onboarding gate, dan halaman.

import { CONFIG, STEPS } from './config.js';
import { Store } from './store.js';
import { Api } from './api.js';
import { Router } from './router.js';
import { renderIcons } from './components/toast.js';
import { confirmDialog } from './components/page-kit.js';

import { renderOnboarding } from './pages/onboarding.js';
import { renderHome } from './pages/home.js';
import { renderMasalah } from './pages/masalah.js';
import { renderOrganisasi } from './pages/organisasi.js';
import { renderPenyelidikan } from './pages/penyelidikan.js';
import { renderPameran } from './pages/pameran.js';
import { renderAsesmen } from './pages/asesmen.js';
import { renderRefleksi } from './pages/refleksi.js';

// Daftarkan rute
Router.register('home', renderHome);
Router.register('masalah', renderMasalah);
Router.register('organisasi', renderOrganisasi);
Router.register('penyelidikan', renderPenyelidikan);
Router.register('pameran', renderPameran);
Router.register('asesmen', renderAsesmen);
Router.register('refleksi', renderRefleksi);

// ---- Sidebar ----
function buildSidebar() {
  const nav = document.getElementById('vm-nav');
  if (!nav) return;
  nav.innerHTML = STEPS.map((s) => `
    <button class="nav-item" data-step="${s.id}">
      <i class="ph-duotone ph-${s.icon}"></i><span>${s.label}</span>
    </button>`).join('');
  nav.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      Router.go(btn.dataset.step);
      closeSidebar();
    });
  });
  renderIcons();
}

function toggleSidebar() { document.getElementById('vm-sidebar').classList.toggle('open'); document.getElementById('vm-overlay').classList.toggle('open'); }
function closeSidebar() { document.getElementById('vm-sidebar').classList.remove('open'); document.getElementById('vm-overlay').classList.remove('open'); }
window.vmToggleSidebar = toggleSidebar;

// ---- Keluar / ganti pemain ----
// Bukan "logout" berpassword: membersihkan identitas & progres DI PERANGKAT INI, lalu kembali
// ke layar awal. Data yang sudah terkirim ke guru/peneliti TIDAK terhapus (sudah di server).
async function logout() {
  closeSidebar();
  const ok = await confirmDialog({
    title: 'Mau keluar?',
    message: 'Kamu akan kembali ke layar awal, dan perangkat ini siap untuk pemain lain. ' +
      'Progres di perangkat ini dimulai dari awal.',
    confirmText: 'Ya, keluar',
    cancelText: 'Batal',
    icon: 'sign-out',
    danger: true,
  });
  if (!ok) return;
  Api.flush();          // pastikan antrean tersinkron dulu (best-effort)
  Store.reset();        // bersihkan state lokal
  location.hash = '';   // kembali ke awal
  document.getElementById('vm-shell').classList.add('hidden');
  launchOnboarding();   // tampilkan layar "Kenalan dulu" lagi
}
window.vmLogout = logout;

// Tampilkan onboarding di overlay terpisah; setelah selesai → mulai app.
function launchOnboarding() {
  const ob = document.createElement('div');
  ob.id = 'vm-onboarding';
  ob.style.cssText = 'position:fixed;inset:0;z-index:60;background:var(--bg);overflow:auto';
  document.body.appendChild(ob);
  renderOnboarding(ob, () => { ob.remove(); startApp(); });
}

// ---- Header & progres ----
function refreshChrome(activeId) {
  // tandai nav aktif
  document.querySelectorAll('[data-step]').forEach((b) =>
    b.classList.toggle('active', b.dataset.step === activeId));
  // header
  const st = Store.get();
  const pct = Store.overallPct();
  const scoreEl = document.getElementById('vm-score');
  const pctEl = document.getElementById('vm-pct');
  const badgeEl = document.getElementById('vm-badges');
  const nameEl = document.getElementById('vm-headname');
  if (scoreEl) scoreEl.textContent = st.score;
  if (pctEl) pctEl.textContent = pct + '%';
  if (badgeEl) badgeEl.textContent = st.badges.length;
  if (nameEl) nameEl.textContent = st.student ? st.student.name : '';
  renderIcons();
}
Router.onAfterRender(refreshChrome);
Store.subscribe(() => refreshChrome(Router.current()));

// ---- Onboarding gate ----
function boot() {
  document.getElementById('vm-overlay').addEventListener('click', closeSidebar);
  document.getElementById('vm-tagline').textContent = CONFIG.APP_TAGLINE;

  Api.flush(); // coba sinkronkan antrean tertunda

  if (!Store.hasStudent()) {
    launchOnboarding();
  } else {
    startApp();
  }
}

function startApp() {
  document.getElementById('vm-shell').classList.remove('hidden');
  buildSidebar();
  Router.start('home');
  refreshChrome('home');
}

document.addEventListener('DOMContentLoaded', boot);
