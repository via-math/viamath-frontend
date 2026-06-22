// config.js — konstanta global aplikasi ViaMath
// Diimpor semua modul. Ubah BASE_URL saat backend sudah live.

export const CONFIG = {
  // Backend Go @ GCF. Kosongkan ('') untuk mode offline-only (frontend tetap jalan penuh).
  BASE_URL: 'https://asia-southeast2-viamath.cloudfunctions.net/viamath',

  APP_NAME: 'ViaMath',
  APP_TAGLINE: 'Petualangan Pecahan',
  KELAS: 'Kelas 5 SD',

  // Kunci localStorage
  STORAGE_KEY: 'viamath_state_v1',
  QUEUE_KEY: 'viamath_syncqueue_v1',

  // Timeout fetch (ms)
  FETCH_TIMEOUT: 5000,

  // Skor & gamifikasi
  SCORE_PER_STEP: 10,
  PASS_THRESHOLD: 0.7, // 70% untuk lulus asesmen
};

// Urutan langkah petualangan (label SISWA — tanpa kata "Fase").
// Pemetaan ke fase PBL Arends ada di kolom `phase` (dipakai backend/penelitian, bukan tampil ke anak).
export const STEPS = [
  { id: 'home',         label: 'Beranda',          icon: 'house',            phase: null },
  { id: 'masalah',      label: 'Tantangan Cerita', icon: 'puzzle-piece',     phase: 'orientasi' },
  { id: 'organisasi',   label: 'Bentuk Tim',       icon: 'users',            phase: 'mengorganisasi' },
  { id: 'penyelidikan', label: 'Mari Selidiki',    icon: 'magnifying-glass', phase: 'penyelidikan' },
  { id: 'pameran',      label: 'Pamerkan Hasil',   icon: 'sparkle',          phase: 'menyajikan' },
  { id: 'asesmen',      label: 'Uji Kemampuan',    icon: 'clipboard-text',   phase: 'asesmen' },
  { id: 'refleksi',     label: 'Renungkan',        icon: 'heart',            phase: 'evaluasi' },
];

// Masalah utama (driving problem) — benang merah lintas fase PBL Arends (revisi A′).
// Satu masalah ini dirujuk di tiap fase: orientasi → organisasi → penyelidikan → menyajikan → evaluasi.
export const DRIVING_PROBLEM = {
  img: 'pizza', // ikon SVG di frontend/img/
  title: 'Pesta Pizza Rara',
  story: 'Rara berulang tahun. Ibu membeli 1 pizza dan memotongnya menjadi 8 bagian sama besar. Rara dan 3 temannya (4 anak) masing-masing mengambil 2 potong.',
  question: 'Berapa bagian pizza tiap anak, berapa total yang dimakan semua anak, dan adakah sisanya? Tulis dalam pecahan.',
};
