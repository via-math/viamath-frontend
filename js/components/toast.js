// toast.js — notifikasi ringan + feedback suara + perayaan.
// Ikon memakai Phosphor (CSS murni), jadi TIDAK perlu langkah render JS.

export function toast(msg, type = '') {
  let wrap = document.getElementById('vm-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'vm-toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'vm-toast ' + type;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
}

// Phosphor adalah ikon CSS murni → tidak perlu render JS.
// Shim no-op dipertahankan agar pemanggil lama tetap aman (tanpa mengubah 24 titik).
export function renderIcons() { /* no-op: Phosphor render via CSS */ }

// Suara feedback (file di assets/audio). Aman bila file belum ada.
export function playSound(ok) {
  try {
    const a = new Audio(ok ? 'assets/audio/benar.mp3' : 'assets/audio/salah.mp3');
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

// Perayaan tuntas: hujan ikon Phosphor (bukan emoji). Hormati reduced-motion.
export function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const icons = ['ph-star', 'ph-confetti', 'ph-sparkle', 'ph-trophy', 'ph-medal'];
  const colors = ['#FCD34D', '#A78BFA', '#5B8DEF', '#6EE7B7', '#FDBA74'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('i');
    s.className = 'ph-fill ' + icons[i % icons.length];
    s.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-2rem;` +
      `font-size:${1.2 + Math.random() * 1.4}rem;color:${colors[i % colors.length]};` +
      `z-index:200;pointer-events:none;transition:transform 2.5s ease-in,opacity 2.5s;`;
    document.body.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translateY(110vh) rotate(${Math.random() * 720 - 360}deg)`;
      s.style.opacity = '0';
    });
    setTimeout(() => s.remove(), 2600);
  }
}
