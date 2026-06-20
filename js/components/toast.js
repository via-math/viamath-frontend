// toast.js — notifikasi ringan + util ikon Lucide + feedback suara.

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

// Render ulang ikon Lucide setelah DOM berubah (Lucide dimuat via CDN sebagai global `lucide`).
export function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Suara feedback (file disediakan di assets/audio). Aman bila file belum ada.
export function playSound(ok) {
  try {
    const a = new Audio(ok ? 'assets/audio/benar.mp3' : 'assets/audio/salah.mp3');
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

// Konfeti sederhana berbasis emoji (perayaan tuntas). Hormati reduced-motion.
export function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const emojis = ['🎉', '⭐', '✨', '🎊', '🏆'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div');
    s.textContent = emojis[i % emojis.length];
    s.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-2rem;font-size:${1 + Math.random() * 1.5}rem;z-index:200;pointer-events:none;transition:transform 2.5s ease-in,opacity 2.5s;`;
    document.body.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translateY(110vh) rotate(${Math.random() * 720 - 360}deg)`;
      s.style.opacity = '0';
    });
    setTimeout(() => s.remove(), 2600);
  }
}
