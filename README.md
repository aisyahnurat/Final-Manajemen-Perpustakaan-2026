# 📚 Sistem Manajemen Perpustakaan

Aplikasi web manajemen perpustakaan kampus: katalog buku, pengumuman, peminjaman bertingkat (ajukan → setujui → kembali), perpanjangan, denda otomatis, serta rating dan ulasan buku.

> **Tugas Final Praktikum Pemrograman Web 2026**, Individual Project 5: Manajemen Perpustakaan
> Nama: _Nur Aisyah AT_ · NIM: _H071251087_

---

## ✨ Fitur Utama

| Peran | Yang bisa dilakukan |
|---|---|
| **Guest** | Melihat katalog, detail buku (beserta ulasan), beranda, dan pengumuman publik |
| **Mahasiswa** | Mengajukan peminjaman dan perpanjangan, memantau status dan denda, memberi rating dan ulasan |
| **Pegawai** | CRUD buku dan pengumuman, menyetujui atau menolak peminjaman, konfirmasi pengembalian, mencatat pelunasan denda |
| **Admin** | Statistik sistem, manajemen pengguna, manajemen kategori, log seluruh transaksi (juga dapat mengelola buku dan pengumuman) |

### Aturan sistem
- **Alur peminjaman:** `Menunggu Konfirmasi` → `Sedang Dipinjam` → `Selesai` (atau `Ditolak` disertai alasan). Stok berkurang saat disetujui dan bertambah saat dikembalikan, dalam satu transaksi SQL.
- **Perpanjangan:** `Perpanjangan Diajukan` → `Perpanjangan Disetujui` / `Perpanjangan Ditolak`. Hanya untuk buku yang masih dipinjam dan belum lewat jatuh tempo.
- **Denda:** dihitung otomatis di backend dari selisih hari keterlambatan × tarif denda per hari. Status denda: `Tertunggak` → `Lunas`.
- **Blokir pinjam:** mahasiswa dengan denda `Tertunggak` tidak dapat mengajukan peminjaman baru.
- **Ulasan:** hanya untuk transaksi yang berstatus `Selesai`, satu ulasan per transaksi (rating 1-5).
- **Validasi akun:** email wajib berakhiran `unhas.ac.id`. NIM mahasiswa berformat 1 huruf (A-H, M, N, P, R) diikuti 9 angka, contoh `H071231001`. NIP admin ADM + 3 angka dan NIP pegawai PGW + 3 angka, contoh `ADM002`.
- **Kategori buku:** dikelompokkan menjadi **Fiksi** dan **Non-Fiksi**.

---

## 🛠️ Teknologi

- [Next.js](https://nextjs.org/) (App Router) dan React
- PostgreSQL dengan library `pg` (**Raw SQL**, query berparameter)
- `bcryptjs` untuk hash password
- `jose` untuk token sesi (JWT) yang disimpan di cookie `httpOnly`
- Middleware Next.js (`src/middleware.js`) untuk proteksi route per peran
- Tailwind CSS

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Node.js 18 atau lebih baru
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
   File ini membuat semua tabel dan mengisi data awal (akun Admin dan Pegawai, 11 kategori buku, serta 22 buku contoh).

> ⚠️ `schema.sql` diawali dengan `DROP TABLE`, sehingga menjalankannya ulang akan **mereset seluruh data**.

### 4. Buat file `.env.local`
Buat file bernama `.env.local` di folder utama (sejajar dengan `package.json`):

```env
DATABASE_URL=postgresql://postgres:PASSWORD_POSTGRES_KAMU@localhost:5432/nama_database_kamu
JWT_SECRET=isi-dengan-kalimat-acak-yang-panjang
```

Ganti `PASSWORD_POSTGRES_KAMU` dan nama database sesuai milikmu.

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Setiap kali `.env.local` diubah, hentikan server (`Ctrl+C`) lalu jalankan ulang.

---

## 🔑 Akun Awal

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@unhas.ac.id` | `admin123` |
| Pegawai | `pegawai@unhas.ac.id` | `pegawai123` |
| Mahasiswa | daftar sendiri lewat halaman **Register** | _(sesuai isian)_ |

Password disimpan dalam bentuk hash bcrypt.

---

## 🗂️ Struktur Folder

```
database/
└── schema.sql            # skema tabel + data awal (di luar src/app)
src/
├── middleware.js         # proteksi route berdasarkan cookie sesi
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
- Seluruh query SQL memakai parameter (`$1`, `$2`, ...) untuk mencegah SQL Injection.
- Aturan penting (stok, denda, blokir pinjam, kepemilikan data) divalidasi di sisi backend.