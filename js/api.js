// api.js — wrapper komunikasi ke backend (Go @ GCF).
// Offline-first: kegagalan jaringan TIDAK memblok pembelajaran; perubahan diantrekan.

import { CONFIG } from './config.js';

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(CONFIG.QUEUE_KEY) || '[]'); }
  catch { return []; }
}
function saveQueue(q) {
  try { localStorage.setItem(CONFIG.QUEUE_KEY, JSON.stringify(q)); } catch {}
}

async function rawFetch(path, options = {}) {
  if (!CONFIG.BASE_URL) throw new Error('offline-only'); // backend belum dikonfigurasi
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CONFIG.FETCH_TIMEOUT);
  try {
    const res = await fetch(CONFIG.BASE_URL + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('http ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export const Api = {
  online() { return !!CONFIG.BASE_URL && navigator.onLine; },

  // Kirim langsung; bila gagal → antre untuk dicoba lagi nanti. Tidak pernah throw ke pemanggil.
  async send(method, path, body) {
    try {
      return await rawFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      const q = loadQueue();
      q.push({ method, path, body, ts: Date.now() });
      saveQueue(q);
      return { ok: false, queued: true };
    }
  },

  // Coba kirim ulang semua yang tertunda (panggil saat online kembali).
  async flush() {
    if (!this.online()) return;
    let q = loadQueue();
    if (!q.length) return;
    const remaining = [];
    for (const item of q) {
      try {
        await rawFetch(item.path, {
          method: item.method,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
      } catch {
        remaining.push(item); // tetap antre
      }
    }
    saveQueue(remaining);
  },

  // ---- Endpoint spesifik (lihat §6 Blueprint) ----
  registerStudent(student) { return this.send('POST', '/students', student); },
  saveAnswer(payload) {
    // D2: sertakan label fase PBL (Arends) agar tersimpan permanen di backend.
    const map = { masalah: 'orientasi', organisasi: 'mengorganisasi', penyelidikan: 'penyelidikan', asesmen: 'asesmen', refleksi: 'evaluasi' };
    return this.send('POST', '/answers', { ...payload, pblPhase: map[payload.phase] || '' });
  },
  updateSession(id, patch) { return this.send('PATCH', `/sessions/${id}`, patch); },
  sendShowcase(payload)    { return this.send('POST', '/showcases', payload); },
  saveAssessment(payload)  { return this.send('POST', '/assessments', payload); },
};

// Auto-flush saat koneksi pulih
window.addEventListener('online', () => Api.flush());
