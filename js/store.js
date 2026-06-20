// store.js — state aplikasi + persistensi localStorage (offline-first).
// Sumber kebenaran sisi-klien. Backend hanya tujuan sinkronisasi (lihat api.js).

import { CONFIG } from './config.js';

const DEFAULT_STATE = {
  student: null,            // { id, name, school, className, classCode, groupName }
  progress: {              // status tiap langkah
    masalah: false,
    organisasi: false,
    penyelidikan: 0,        // 0..1 (proporsi aktivitas selesai)
    pameran: false,
    asesmen: false,
    refleksi: false,
  },
  score: 0,
  badges: [],              // daftar id badge yang diraih
  answers: {},             // { activityId: text } — cache jawaban form
  showcases: [],           // produk Fase 4 buatan siswa (lokal)
  assessment: null,        // hasil asesmen terakhir
  createdAt: null,
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch (_) { /* korup → reset */ }
  return structuredClone(DEFAULT_STATE);
}

function persist() {
  try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  listeners.forEach((fn) => fn(state));
}

export const Store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  reset() { state = structuredClone(DEFAULT_STATE); persist(); },

  setStudent(student) {
    state.student = student;
    if (!state.createdAt) state.createdAt = new Date().toISOString();
    persist();
  },

  hasStudent() { return !!(state.student && state.student.name); },

  // Tandai sebuah langkah selesai (boolean) atau set proporsi (number 0..1)
  setProgress(stepId, value = true) {
    state.progress[stepId] = value;
    persist();
  },

  addScore(n) {
    state.score = Math.max(0, state.score + n);
    persist();
  },

  addBadge(id) {
    if (!state.badges.includes(id)) { state.badges.push(id); persist(); }
  },

  saveAnswer(activityId, text) {
    state.answers[activityId] = text;
    persist();
  },
  getAnswer(activityId) { return state.answers[activityId] || ''; },

  addShowcase(item) {
    state.showcases.push({ ...item, createdAt: new Date().toISOString() });
    persist();
  },

  setAssessment(result) { state.assessment = result; persist(); },

  // Persentase progres keseluruhan (untuk header & dashboard)
  overallPct() {
    const p = state.progress;
    const parts = [
      p.masalah ? 1 : 0,
      p.organisasi ? 1 : 0,
      typeof p.penyelidikan === 'number' ? p.penyelidikan : (p.penyelidikan ? 1 : 0),
      p.pameran ? 1 : 0,
      p.asesmen ? 1 : 0,
      p.refleksi ? 1 : 0,
    ];
    return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  },
};
