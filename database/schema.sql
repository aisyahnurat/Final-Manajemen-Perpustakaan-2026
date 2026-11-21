-- SELECT * FROM users;
-- SELECT * FROM categories;
-- SELECT * FROM books;
-- SELECT COUNT(*) FROM books;
-- SELECT COUNT(*) FROM categories;
-- SELECT id, email, role FROM users;
-- SELECT email, password FROM users;
-- SELECT judul, cover_url FROM books;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
DROP TABLE IF EXISTS reviews, loans, announcements, books, categories, users CASCADE;

-- 1. USERS (Admin, Pegawai, Mahasiswa)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,  -- hash bcrypt
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
    isbn VARCHAR(20) NOT NULL UNIQUE,
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

-- 6. REVIEWS (satu ulasan per transaksi yang sudah selesai)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL UNIQUE REFERENCES loans(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id),
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    rating  INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    komentar TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DATA
INSERT INTO (nama_lengkap, email, password, role, nomor_identitas)
VALUES
	('Admin Perpustakaan', 'admin@unhas.ac.id', crypt('admin123', gen_salt('bf', 10)), 'admin', 'ADM001'),
	('Pegawai Perpustakaan', 'pegawai@unhas.ac.id', crypt('pegawai123', gen_salt('bf', 10)), 'pegawai', 'PGW001');

INSERT INTO categories (nama, kode, kelompok, deskripsi) 
VALUES
 ('Romantis', 'FIK-ROM', 'Fiksi', 'Kisah cinta dan hubungan'),
 ('Fantasi', 'FIK-FAN', 'Fiksi', 'Dunia imajinatif dan sihir'),
 ('Sci-Fi', 'FIK-SCI', 'Fiksi', 'Fiksi ilmiah dan teknologi masa depan'),
 ('Misteri & Thriller', 'FIK-MIS', 'Fiksi', 'Teka-teki, kriminal, dan ketegangan'),
 ('Horror', 'FIK-HOR', 'Fiksi', 'Cerita seram dan supernatural'),
 ('Fiksi Sejarah', 'FIK-SEJ', 'Fiksi', 'Cerita rekaan berlatar sejarah'),
 ('Self-Improvement', 'NF-SELF', 'Non-Fiksi', 'Pengembangan diri'),
 ('Biografi & Autobiografi', 'NF-BIO', 'Non-Fiksi', 'Kisah hidup tokoh'),
 ('Bisnis & Keuangan', 'NF-BIS', 'Non-Fiksi', 'Bisnis, investasi, dan keuangan'),
 ('Sejarah & Sains', 'NF-SAINS', 'Non-Fiksi', 'Sejarah dan ilmu pengetahuan'),
 ('Kejahatan Nyata', 'NF-KRIM', 'Non-Fiksi', 'Kasus kriminal berdasarkan kejadian nyata');

INSERT INTO books(judul, isbn, pengarang, penerbit, tahun_terbit, category_id, stok_total, stok_tersedia, durasi_maks_pinjam, denda_per_hari)
VALUES
 ('Dilan: Dia adalah Dilanku Tahun 1990', '978-602-7870-86-4', 'Pidi Baiq', 'Pastel Books', 2014,
   (SELECT id FROM categories WHERE kode = 'FIK-ROM'), 3, 3, 7, 1000),
 ('Pride and Prejudice', '978-0-14-143951-8', 'Jane Austen', 'Penguin Classics', 1813,
   (SELECT id FROM categories WHERE kode = 'FIK-ROM'), 3, 3, 7, 1000),
 ('Bumi', '978-602-03-0112-9', 'Tere Liye', 'Gramedia Pustaka Utama', 2014,
   (SELECT id FROM categories WHERE kode = 'FIK-FAN'), 3, 3, 7, 1000),
 ('Harry Potter and the Sorcerer''s Stone', '978-0-545-06967-0', 'J.K. Rowling', 'Scholastic', 1998,
   (SELECT id FROM categories WHERE kode = 'FIK-FAN'), 3, 3, 7, 1000),
 ('Supernova: Ksatria, Puteri, dan Bintang Jatuh', '978-602-291-118-0', 'Dee Lestari', 'Bentang Pustaka', 2001,
   (SELECT id FROM categories WHERE kode = 'FIK-SCI'), 3, 3, 7, 1000),
 ('Dune', '978-0-441-17271-9', 'Frank Herbert', 'Ace Books', 1965,
   (SELECT id FROM categories WHERE kode = 'FIK-SCI'), 3, 3, 7, 1000),
 ('Katarsis', '978-979-22-9756-0', 'Anastasia Aemilia', 'Gramedia Pustaka Utama', 2012,
   (SELECT id FROM categories WHERE kode = 'FIK-MIS'), 3, 3, 7, 1000),
 ('The Da Vinci Code', '978-0-307-47427-8', 'Dan Brown', 'Doubleday', 2003,
   (SELECT id FROM categories WHERE kode = 'FIK-MIS'), 3, 3, 7, 1000),
 ('Danur', '978-602-220-080-2', 'Risa Saraswati', 'Bukune', 2011,
   (SELECT id FROM categories WHERE kode = 'FIK-HOR'), 3, 3, 7, 1000),
 ('It', '978-1-5011-4297-0', 'Stephen King', 'Scribner', 1986,
   (SELECT id FROM categories WHERE kode = 'FIK-HOR'), 3, 3, 7, 1000),
 ('Laut Bercerita', '978-602-424-694-5', 'Leila S. Chudori', 'Kepustakaan Populer Gramedia', 2017,
   (SELECT id FROM categories WHERE kode = 'FIK-SEJ'), 3, 3, 7, 1000),
 ('Bumi Manusia', '978-979-97312-3-4', 'Pramoedya Ananta Toer', 'Lentera Dipantara', 1980,
   (SELECT id FROM categories WHERE kode = 'FIK-SEJ'), 3, 3, 7, 1000),
 ('Filosofi Teras', '978-602-412-518-9', 'Henry Manampiring', 'Penerbit Buku Kompas', 2018,
   (SELECT id FROM categories WHERE kode = 'NF-SELF'), 3, 3, 14, 1000),
 ('Atomic Habits', '978-0-7352-1129-2', 'James Clear', 'Avery', 2018,
   (SELECT id FROM categories WHERE kode = 'NF-SELF'), 3, 3, 14, 1000),
 ('Habibie & Ainun', '978-979-1255-13-4', 'B.J. Habibie', 'THC Mandiri', 2010,
   (SELECT id FROM categories WHERE kode = 'NF-BIO'), 3, 3, 14, 1000),
 ('Becoming', '978-1-5247-6313-8', 'Michelle Obama', 'Crown', 2018,
   (SELECT id FROM categories WHERE kode = 'NF-BIO'), 3, 3, 14, 1000),
 ('The Psychology of Money', '978-0-85719-768-9', 'Morgan Housel', 'Harriman House', 2020,
   (SELECT id FROM categories WHERE kode = 'NF-BIS'), 3, 3, 14, 1000),
 ('Rich Dad Poor Dad', '978-1-61268-019-4', 'Robert T. Kiyosaki', 'Plata Publishing', 1997,
   (SELECT id FROM categories WHERE kode = 'NF-BIS'), 3, 3, 14, 1000),
 ('Sapiens: Riwayat Singkat Umat Manusia', '978-602-424-416-3', 'Yuval Noah Harari', 'Kepustakaan Populer Gramedia', 2017,
   (SELECT id FROM categories WHERE kode = 'NF-SAINS'), 3, 3, 14, 1000),
 ('A Brief History of Time', '978-0-553-38016-3', 'Stephen Hawking', 'Bantam Books', 1988,
   (SELECT id FROM categories WHERE kode = 'NF-SAINS'), 3, 3, 14, 1000),
 ('In Cold Blood', '978-0-679-74558-7', 'Truman Capote', 'Random House', 1966,
   (SELECT id FROM categories WHERE kode = 'NF-KRIM'), 3, 3, 14, 1000),
 ('I''ll Be Gone in the Dark', '978-0-06-231978-4', 'Michelle McNamara', 'Harper', 2018,
   (SELECT id FROM categories WHERE kode = 'NF-KRIM'), 3, 3, 14, 1000)
ON CONFLICT (isbn) DO NOTHING;

UPDATE books SET cover_url = '/covers/dilan.png' WHERE isbn = '978-602-7870-86-4';
UPDATE books SET cover_url = '/covers/pride-and-prejudice.png' WHERE isbn = '978-0-14-143951-8';
UPDATE books SET cover_url = '/covers/bumi.png' WHERE isbn = '978-602-03-0112-9';
UPDATE books SET cover_url = '/covers/harry-potter.png' WHERE isbn = '978-0-545-06967-0';
UPDATE books SET cover_url = '/covers/supernova.png' WHERE isbn = '978-602-291-118-0';
UPDATE books SET cover_url = '/covers/dune.png' WHERE isbn = '978-0-441-17271-9';
UPDATE books SET cover_url = '/covers/katarsis.png' WHERE isbn = '978-979-22-9756-0';
UPDATE books SET cover_url = '/covers/da-vinci-code.png' WHERE isbn = '978-0-307-47427-8';
UPDATE books SET cover_url = '/covers/danur.png' WHERE isbn = '978-602-220-080-2';
UPDATE books SET cover_url = '/covers/it.png' WHERE isbn = '978-1-5011-4297-0';
UPDATE books SET cover_url = '/covers/laut-bercerita.png' WHERE isbn = '978-602-424-694-5';
UPDATE books SET cover_url = '/covers/bumi-manusia.png' WHERE isbn = '978-979-97312-3-4';
UPDATE books SET cover_url = '/covers/filosofi-teras.png' WHERE isbn = '978-602-412-518-9';
UPDATE books SET cover_url = '/covers/atomic-habits.png' WHERE isbn = '978-0-7352-1129-2';
UPDATE books SET cover_url = '/covers/habibie-ainun.png' WHERE isbn = '978-979-1255-13-4';
UPDATE books SET cover_url = '/covers/becoming.png' WHERE isbn = '978-1-5247-6313-8';
UPDATE books SET cover_url = '/covers/psychology-of-money.png' WHERE isbn = '978-0-85719-768-9';
UPDATE books SET cover_url = '/covers/rich-dad-poor-dad.png' WHERE isbn = '978-1-61268-019-4';
UPDATE books SET cover_url = '/covers/sapiens.png' WHERE isbn = '978-602-424-416-3';
UPDATE books SET cover_url = '/covers/brief-history-of-time.png' WHERE isbn = '978-0-553-38016-3';
UPDATE books SET cover_url = '/covers/in-cold-blood.png' WHERE isbn = '978-0-679-74558-7';
UPDATE books SET cover_url = '/covers/ill-be-gone-in-the-dark.png' WHERE isbn = '978-0-06-231978-4';