DROP TABLE IF EXISTS reviews, loans, announcements, books, categories, users CASCADE;

-- 1. USERS (Admin, Pegawai, Mahasiswa)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,  -- plaintext sesuai Bab 10 (nanti bisa diganti hash)
    role VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'pegawai', 'mahasiswa')),
    nomor_identitas VARCHAR(30) NOT NULL UNIQUE,  -- NIM / NIP
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE,
    kode VARCHAR(20)  NOT NULL UNIQUE,
    deskripsi TEXT
);

-- 3. BOOKS
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(200) NOT NULL,
    isbn VARCHAR(20)  NOT NULL UNIQUE,
    pengarang VARCHAR(150) NOT NULL,
    penerbit VARCHAR(150) NOT NULL,
    tahun_terbit INT NOT NULL,
    category_id INT NOT NULL REFERENCES categories(id),
    stok_total INT NOT NULL CHECK (stok_total >= 0),
    stok_tersedia INT NOT NULL CHECK (stok_tersedia >= 0),
    durasi_maks_pinjam INT NOT NULL CHECK (durasi_maks_pinjam > 0), -- hari
    denda_per_hari INT NOT NULL CHECK (denda_per_hari >= 0),
    cover_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. ANNOUNCEMENTS
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(200) NOT NULL,
    konten TEXT NOT NULL,
    kategori VARCHAR(20) NOT NULL CHECK (kategori IN ('Operasional', 'Layanan', 'Acara')),
    tanggal_rilis DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- 5. LOANS (peminjaman + perpanjangan + denda dalam satu tabel)
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    book_id INT NOT NULL REFERENCES books(id),
    -- alur peminjaman
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu Konfirmasi' CHECK (status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam', 'Selesai', 'Ditolak')),
    tanggal_pengajuan TIMESTAMP NOT NULL DEFAULT NOW(),
    tanggal_pinjam DATE,
    tanggal_jatuh_tempo DATE,
    tanggal_kembali DATE,
    alasan_penolakan TEXT,
    diproses_oleh INT REFERENCES users(id),
    -- alur perpanjangan
    status_perpanjangan VARCHAR(30) NOT NULL DEFAULT 'Tidak Ada' CHECK (status_perpanjangan IN ('Tidak Ada', 'Perpanjangan Diajukan', 'Perpanjangan Disetujui', 'Perpanjangan Ditolak')),
    -- denda (dihitung saat buku dikembalikan, lalu dicatat)
    denda_nominal INT NOT NULL DEFAULT 0 CHECK (denda_nominal >= 0),
    status_denda VARCHAR(20) NOT NULL DEFAULT 'Tidak Ada' CHECK (status_denda IN ('Tidak Ada', 'Tertunggak', 'Lunas'))
);

-- 6. REVIEWS (satu ulasan per transaksi yang sudah Selesai)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL UNIQUE REFERENCES loans(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id),
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    rating  INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    komentar TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DATA AWAL
INSERT INTO users (nama_lengkap, email, password, role, nomor_identitas) 
VALUES
 ('Admin Perpustakaan',   'admin@kampus.ac.id',   'admin123',   'admin',   'ADM001'),
 ('Pegawai Perpustakaan', 'pegawai@kampus.ac.id', 'pegawai123', 'pegawai', 'PGW001');

INSERT INTO categories (nama, kode, deskripsi) 
VALUES
 ('Teknologi Informasi', 'TI',  'Buku seputar komputer dan pemrograman'),
 ('Sastra & Bahasa',     'SB',  'Novel, puisi, dan buku bahasa');

SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM books;

UPDATE loans SET tanggal_jatuh_tempo = CURRENT_DATE - 3 WHERE id = 1;

INSERT INTO books (judul, isbn, pengarang, penerbit, tahun_terbit, category_id, stok_total, stok_tersedia, durasi_maks_pinjam, denda_per_hari)
VALUES
 ('Pemrograman Web dengan Next.js', '978-6020000001', 'Andi Pratama', 'Informatika', 2023,
   (SELECT id FROM categories WHERE kode = 'TI'), 5, 5, 7, 1000),
 ('Basis Data dan SQL', '978-6020000002', 'Budi Santoso', 'Informatika', 2021,
   (SELECT id FROM categories WHERE kode = 'TI'), 3, 3, 7, 1000),
 ('Algoritma dan Struktur Data', '978-6020000003', 'Citra Dewi', 'Erlangga', 2020,
   (SELECT id FROM categories WHERE kode = 'TI'), 4, 4, 14, 2000),
 ('Kumpulan Cerita Nusantara', '978-6020000004', 'Dian Lestari', 'Gramedia', 2019,
   (SELECT id FROM categories WHERE kode = 'SB'), 2, 2, 14, 500),
 ('Tata Bahasa Indonesia', '978-6020000005', 'Eko Wijaya', 'Gramedia', 2018,
   (SELECT id FROM categories WHERE kode = 'SB'), 6, 6, 7, 500)
ON CONFLICT (isbn) DO NOTHING;

UPDATE loans SET tanggal_jatuh_tempo = CURRENT_DATE - 2 WHERE id = 3;