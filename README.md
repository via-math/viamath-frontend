# ViaMath — Frontend (Petualangan Pecahan)

Media pembelajaran **pecahan** interaktif untuk **siswa Kelas 5 SD** dengan model
**Problem Based Learning (PBL — Arends)**. Dibangun ulang dari nol mengikuti
[BLUEPRINT-PENGEMBANGAN.md](../BLUEPRINT-PENGEMBANGAN.md).

## Teknologi
- HTML + **Tailwind (CDN)** + **JavaScript murni (ES Modules)** — tanpa build step.
- Ikon **Lucide**, font **Nunito**.
- **Offline-first**: progres disimpan di `localStorage`; sinkronisasi ke backend saat online
  (antrean otomatis bila offline).

## Menjalankan secara lokal
Karena memakai ES Modules, jalankan lewat server statis (bukan buka file langsung):

```bash
cd frontend
python3 -m http.server 5173
# buka http://localhost:5173
```

## Menghubungkan ke backend
Edit [js/config.js](js/config.js) → isi `BASE_URL` dengan URL Cloud Function:
```js
BASE_URL: 'https://asia-southeast2-PROJECT.cloudfunctions.net/viamath'
```
Bila dikosongkan (`''`), aplikasi tetap berjalan penuh **mode offline** (semua data lokal).

## Struktur
```
frontend/
├── index.html              # shell aplikasi
├── assets/css/styles.css   # design tokens & komponen (§13 Blueprint)
├── js/
│   ├── config.js           # BASE_URL + daftar langkah (STEPS) + pemetaan fase PBL
│   ├── store.js            # state + localStorage (offline-first)
│   ├── api.js              # fetch + sync queue
│   ├── router.js           # navigasi hash
│   ├── app.js              # perangkai shell + onboarding gate
│   ├── components/         # toast, ikon, visual pecahan, validasi pecahan, page-kit
│   └── pages/              # onboarding, home, masalah, organisasi, penyelidikan,
│                             pameran, asesmen, refleksi
└── .github/workflows/deploy.yml
```

## Alur (layar siswa ↔ fase PBL)
Label di layar memakai **bahasa anak** (tanpa kata "Fase"). Pemetaan fase hanya untuk
guru/peneliti (lihat kolom `phase` di `config.js`):

| Layar siswa | Fase PBL (Arends) |
|---|---|
| Kenalan dulu | registrasi (nama + sekolah + kelas) |
| Tantangan Cerita | Fase 1 — Orientasi pada masalah |
| Bentuk Tim | Fase 2 — Mengorganisasi siswa |
| Mari Selidiki | Fase 3 — Membimbing penyelidikan |
| Pamerkan Hasil | Fase 4 — Menyajikan hasil karya |
| Uji Kemampuan | Asesmen kecakapan (Kilpatrick) |
| Renungkan | Fase 5 — Menganalisis & mengevaluasi |

## Perbaikan dari versi lama (audit)
- Validasi jawaban **berbasis nilai** (terima 1/2, 0,5, "1 1/2" yang setara) — tidak menolak
  jawaban benar.
- Soal asesmen **kunci jawaban terverifikasi**; operasi perkalian/pembagian pecahan ditandai
  **PENGAYAAN** (di luar kompetensi inti Kelas 5).
- **Fase 4 (Pamerkan Hasil)** jadi halaman berdiri sendiri (sebelumnya lemah).
- Emoji judul/label diganti **ikon Lucide**; maskot, feedback, & benda materi tetap.
- Kunci jawaban cerita **disembunyikan** sampai siswa menjawab.

## Deploy
Push ke `main` → GitHub Pages otomatis (workflow `deploy.yml`). Aktifkan **Settings → Pages →
Source: GitHub Actions**.
