# Aksara — AI Content Agent

Web app internal untuk tim kecil: tulis konten, riset SEO, copywriting, dan desain konten — semua ditenagai Google Gemini (gratis, tidak perlu kartu kredit).

> **Catatan keamanan:** API key Gemini kini disimpan **hanya di server** (Cloudflare Pages Functions), tidak lagi dikirim ke browser. Sebelumnya versi awal project ini memakai variabel `VITE_...` yang membuat key bisa dilihat siapa pun lewat DevTools. Ikuti langkah di bawah — variabelnya sekarang bernama `GEMINI_API_KEY` (tanpa prefix `VITE_`).

## Langkah 1 — Dapatkan API key gratis (sekali saja, 2 menit)

1. Buka https://aistudio.google.com/apikey
2. Login dengan akun Google kamu
3. Klik **Create API key**, lalu salin key yang muncul

Simpan key ini, dibutuhkan di langkah 3.

## Langkah 2 — Upload ke GitHub

Kalau belum punya akun GitHub, daftar gratis di https://github.com/signup.

1. Buka https://github.com/new, beri nama repo (misalnya `aksara-ai-agent`), klik **Create repository**.
2. Di komputer kamu, buka folder project ini lewat terminal, lalu jalankan:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME-KAMU/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME-KAMU` dan `NAMA-REPO` sesuai punya kamu. File `.dev.vars` (kalau sudah dibuat) **tidak akan ikut ter-upload** — itu otomatis dijaga oleh `.gitignore`, supaya API key kamu tetap aman.

## Langkah 3 — Deploy ke Cloudflare Pages (gratis)

1. Buka https://dash.cloudflare.com, daftar gratis kalau belum punya akun.
2. Klik **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
3. Pilih repo GitHub yang baru kamu upload, beri izin akses.
4. Di halaman setting build, isi:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Buka bagian **Environment variables**, tambahkan satu baris:
   - Name: `GEMINI_API_KEY`
   - Value: (tempel API key dari Langkah 1)
   - **Klik ikon "Encrypt"/tandai sebagai Secret** kalau tersedia, supaya key tidak tampil di dashboard.
6. Klik **Save and Deploy**.

Cloudflare otomatis mendeteksi folder `functions/` di project ini dan menjalankannya sebagai backend proxy — jadi `GEMINI_API_KEY` hanya bisa diakses dari server, tidak pernah masuk ke bundle JavaScript yang dikirim ke browser.

Tunggu 1-2 menit. Cloudflare akan memberi link seperti `https://aksara-ai-agent.pages.dev` — itu alamat web app kamu, siap dibagikan ke tim.

## Update setelah ada perubahan

Setiap kali ada perubahan kode dan ingin diterapkan ke web yang sudah online:

```bash
git add .
git commit -m "Update"
git push
```

Cloudflare otomatis build ulang dan update web-nya sendiri — tidak perlu klik apa-apa lagi.

## Coba dulu di komputer sendiri (opsional)

Butuh Node.js (https://nodejs.org), versi 18 atau lebih baru.

```bash
npm install
```

**Mode cepat (hanya UI, tanpa fitur AI):**

```bash
npm run dev
```

Berguna untuk mengedit tampilan/komponen. Tombol generate tidak akan berfungsi karena belum ada backend function lokal yang melayani `/api/generate`.

**Mode penuh (UI + fitur AI, lewat Pages Functions lokal):**

1. Salin `.dev.vars.example` jadi `.dev.vars`, lalu isi `GEMINI_API_KEY=` dengan key dari Langkah 1. File ini otomatis diabaikan git.
2. Buka dua terminal:
   - Terminal 1: `npm run build:watch` (build ulang otomatis tiap ada perubahan kode)
   - Terminal 2: `npm run pages:dev` (menjalankan seluruh app + functions di `http://localhost:8788`)
3. Buka `http://localhost:8788` di browser.

## Kuota gratis

Gemini API gratis sampai sekitar 500 gambar/hari dan kuota teks yang cukup besar untuk pemakaian tim kecil harian. Tidak perlu kartu kredit kapan pun. Kalau suatu saat kuota harian habis, tinggal tunggu sampai besok — kuota reset otomatis.

## Struktur folder

```
├── functions/
│   └── api/
│       ├── generate.js        ← proxy server untuk generate teks (Gemini)
│       └── generate-image.js  ← proxy server untuk generate gambar (Gemini)
├── src/
│   ├── App.jsx                 ← shell aplikasi (sidebar + routing modul)
│   ├── styles.css              ← seluruh styling
│   ├── lib/
│   │   ├── geminiClient.js     ← pemanggil endpoint /api/* dari client
│   │   └── prompts.js          ← system prompt bersama
│   ├── components/
│   │   └── Shared.jsx          ← komponen UI kecil yang dipakai berulang
│   └── modules/
│       ├── AutoMode.jsx
│       ├── ContentWriter.jsx
│       ├── SeoAssistant.jsx
│       ├── Copywriting.jsx
│       └── DesignContent.jsx
├── index.html
├── package.json
├── .dev.vars.example            ← template secret untuk development lokal
└── .gitignore                   ← memastikan .dev.vars & node_modules tidak ter-upload
```
