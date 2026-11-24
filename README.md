# 📚 PIKUN — Sistem Manajemen Perpustakaan

**PIKUN** (Perpustakaan Intelektual Kaya Usaha Ngelamun) adalah aplikasi web manajemen perpustakaan kampus: katalog buku bergaya rak, pengumuman, peminjaman bertingkat (ajukan → setujui → kembali), perpanjangan, denda otomatis, serta rating dan ulasan buku.

> **Tugas Final Praktikum Pemrograman Web 2026**, Individual Project 5: Manajemen Perpustakaan
> Nama: _Nur Aisyah AT_ · NIM: _H071251087_

---

## 🖼️ Tampilan Aplikasi

| Beranda | Katalog (filter, urutan, A–Z) |
|---|---|
| ![Beranda](docs/beranda.png) | ![Katalog](docs/katalog.png) |

| Detail buku (sinopsis, rating, buku serupa) | Login dan Register |
|---|---|
| ![Detail buku](docs/detail-buku.png) | ![Login](docs/login.png) |

| Kelola buku (Pegawai) | Dashboard Admin |
|---|---|
| ![Kelola buku](docs/pegawai-buku.png) | ![Admin](docs/admin.png) |

| Tampilan HP (responsif) |
|---|
| ![Mobile](docs/mobile.png) |

---

## ✨ Fitur Utama

| Peran | Yang bisa dilakukan |
|---|---|
| **Guest** | Melihat katalog, detail buku (sinopsis, rating, ulasan, buku serupa), beranda, dan pengumuman publik |
| **Mahasiswa** | Mengajukan peminjaman dan perpanjangan, memantau status dan denda, memberi rating dan ulasan |
| **Pegawai** | CRUD buku (termasuk sinopsis dan sampul) dan pengumuman, menyetujui atau menolak peminjaman, konfirmasi pengembalian, mencatat pelunasan denda |
| **Admin** | Statistik sistem, manajemen pengguna, manajemen kategori, log seluruh transaksi (juga dapat mengelola buku dan pengumuman) |

### Fitur katalog dan tampilan
- **Pencarian** berdasarkan judul atau pengarang.
- **Filter kategori** (dikelompokkan menjadi Fiksi dan Non-Fiksi) dan **urutan** terbaru, tahun terbit, atau rating tertinggi.
- **Telusuri abjad (A–Z):** menampilkan buku yang judulnya diawali huruf tertentu.
- **Buku populer** dan koleksi di beranda, ditampilkan seperti rak buku.
- **Detail buku:** sampul 3D yang bisa dibalik (sisi belakang menampilkan cuplikan sinopsis, pengarang, penerbit, dan ISBN), sinopsis, rincian, rating rata-rata, ulasan, dan **rekomendasi buku serupa** (satu kategori, urut rating tertinggi).
- **Responsif:** dirancang mobile-first dengan Tailwind CSS, nyaman di HP, tablet, maupun desktop.

### Aturan sistem
- **Alur peminjaman:** `Menunggu Konfirmasi` → `Sedang Dipinjam` → `Selesai` (atau `Ditolak` disertai alasan). Stok berkurang saat disetujui dan bertambah saat dikembalikan, dalam satu transaksi SQL.
- **Perpanjangan:** `Perpanjangan Diajukan` → `Perpanjangan Disetujui` / `Perpanjangan Ditolak`. Hanya untuk buku yang masih dipinjam dan belum lewat jatuh tempo.
- **Denda:** dihitung otomatis di backend dari selisih hari keterlambatan × tarif denda per hari. Status denda: `Tertunggak` → `Lunas`.
- **Blokir pinjam:** mahasiswa dengan denda `Tertunggak` tidak dapat mengajukan peminjaman baru.
- **Ulasan:** hanya untuk transaksi yang berstatus `Selesai`, satu ulasan per transaksi (rating 1-5). Rating buku dihitung sebagai rata-rata (`AVG`) seluruh ulasannya.
- **Validasi akun:** email wajib berakhiran `unhas.ac.id`. NIM mahasiswa berformat 1 huruf (A-H, M, N, P, R) diikuti 9 angka, contoh `H071231001`. NIP admin ADM + 3 angka dan NIP pegawai PGW + 3 angka, contoh `ADM002`.
- **Kategori buku:** dikelompokkan menjadi **Fiksi** dan **Non-Fiksi**.

### Validasi data buku (di sisi server)
- **ISBN:** boleh diketik dengan atau tanpa tanda hubung, spasi dibuang otomatis. Wajib 10 atau 13 karakter dan digit pengecek harus benar. Sistem **otomatis memberi tanda strip** sesuai aturan rentang ISBN internasional, dan ISBN-10 disamakan menjadi format ISBN-13 (contoh: `9780735211292` disimpan sebagai `978-0-7352-1129-2`). ISBN yang sudah terdaftar ditolak.
- **Judul** maksimal 150 karakter, **pengarang** 2–100 karakter dan memuat huruf, **penerbit** maksimal 150 karakter.
- **Tahun terbit** harus 4 digit, dari 1800 sampai tahun berjalan (dihitung otomatis).
- **Stok** 0–100, **durasi pinjam** 1–365 hari, **denda** Rp0–Rp100.000 per hari.
- **Sinopsis** bersifat opsional, maksimal 5000 karakter.
- Batas di formulir (`maxLength`, `min`, `max`) hanya kemudahan bagi pengguna. Pemeriksaan yang sebenarnya selalu dilakukan ulang di backend.

---

## 🛠️ Teknologi

- [Next.js](https://nextjs.org/) (App Router) dan React
- PostgreSQL dengan library `pg` (**Raw SQL**, query berparameter)
- `bcryptjs` untuk hash password
- `jose` untuk token sesi (JWT) yang disimpan di cookie `httpOnly`
- `isbn3` untuk validasi dan pemformatan ISBN
- Middleware Next.js (`src/middleware.js`) untuk proteksi route per peran
- Tailwind CSS

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Node.js 20.9 atau lebih baru
- PostgreSQL (dan pgAdmin)

### 2. Clone dan install

```bash
git clone https://github.com/aisyahnurat/Final-Manajemen-Perpustakaan-2026.git
cd Final-Manajemen-Perpustakaan-2026
npm install
```

### 3. Siapkan database
1. Buka pgAdmin, lalu buat database baru, misalnya `perpustakaan`.
2. Buka **Query Tool** pada database tersebut, lalu jalankan seluruh isi file **`database/schema.sql`**.
   File ini membuat semua tabel dan mengisi data awal: akun Admin, Pegawai, dan 10 mahasiswa demo, 11 sub-kategori, 55 buku (lengkap dengan sinopsis dan sampul), serta 35 ulasan.

> ⚠️ `schema.sql` diawali dengan `DROP TABLE`, sehingga menjalankannya ulang akan **mereset seluruh data**.

### 4. Buat file `.env.local`
Buat file bernama `.env.local` di folder utama (sejajar dengan `package.json`):

```env
DATABASE_URL=postgresql://postgres:PASSWORD_POSTGRES_KAMU@localhost:5432/nama_database_kamu
JWT_SECRET=isi-dengan-kalimat-acak-yang-panjang
```

Ganti `PASSWORD_POSTGRES_KAMU` dan nama database sesuai milikmu. File ini tidak ikut di-commit.

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Setiap kali `.env.local` diubah, hentikan server (`Ctrl+C`) lalu jalankan ulang.

---

## 🔑 Akun untuk Mencoba

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@unhas.ac.id` | `admin123` |
| Pegawai | `pegawai@unhas.ac.id` | `pegawai123` |
| Mahasiswa | daftar sendiri lewat halaman **Register** | _(sesuai isian)_ |
| Mahasiswa (demo) | `mhs01@unhas.ac.id` sampai `mhs10@unhas.ac.id` | `mahasiswa123` |

Password disimpan dalam bentuk hash bcrypt. Akun-akun di atas adalah data uji.

---

## 🗂️ Struktur Folder

```
database/
└── schema.sql            # skema tabel + data awal (di luar src/app)
docs/                     # screenshot untuk README
public/
├── covers/               # gambar sampul buku
└── logo.png ...
src/
├── middleware.js         # proteksi route berdasarkan cookie sesi
├── components/           # Navbar, Latar, RakBuku, AuthPage
├── lib/                  # db.js, token.js, useAuth.js, validasi*, cekAdmin.js
└── app/
    ├── page.js           # beranda
    ├── login/ register/
    ├── katalog/          # katalog dan detail buku
    ├── pengumuman/       # daftar dan detail pengumuman
    ├── mahasiswa/        # dashboard mahasiswa
    ├── pegawai/          # dashboard, buku, pengumuman, peminjaman
    ├── admin/            # dashboard, pengguna, kategori, transaksi
    └── api/              # route handlers (books, loans, users, ...)
```

---

## 🗃️ Tabel Database

`users` · `categories` · `books` · `announcements` · `loans` · `reviews`

---

## 🔒 Keamanan

- Password di-hash dengan **bcrypt** (`bcryptjs`).
- Sesi disimpan di cookie **`httpOnly`** berisi token JWT bertanda tangan, sehingga tidak dapat dibaca atau diubah dari JavaScript di browser.
- **Middleware** memeriksa token dan peran di server sebelum halaman dimuat. Pengguna yang tidak berhak langsung dialihkan ke halaman login.
- Seluruh query SQL memakai parameter (`$1`, `$2`, ...) untuk mencegah SQL Injection. Nama kolom pada pengurutan memakai daftar tetap (whitelist).
- Aturan penting (stok, denda, blokir pinjam, kepemilikan data, validasi input buku) divalidasi di sisi backend.

---

## 🔭 Rencana Pengembangan

- **Isi otomatis dari ISBN:** mengambil judul, penulis, penerbit, dan tahun terbit dari layanan seperti Open Library saat ISBN diketik, dengan isian manual sebagai cadangan.
- **Pratinjau isi buku:** cuplikan beberapa halaman sebelum meminjam. Ini memerlukan izin penerbit, sehingga untuk saat ini calon peminjam dibantu oleh sinopsis dan ulasan.
- Menampilkan jumlah ulasan di samping rating pada kartu buku.
- Unggah gambar sampul belakang asli sebagai opsi (kolom tambahan di data buku). Saat ini sisi belakang dibuat otomatis dari data buku.