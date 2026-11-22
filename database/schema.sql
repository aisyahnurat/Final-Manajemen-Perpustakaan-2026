-- SELECT * FROM users;
-- SELECT * FROM categories;
-- SELECT * FROM books;
-- SELECT COUNT(*) FROM books;
-- SELECT COUNT(*) FROM categories;
-- SELECT id, email, role FROM users;
-- SELECT email, password FROM users;
-- SELECT judul, cover_url FROM books;
-- SELECT judul, LEFT(sinopsis, 40) FROM books ORDER BY id;
-- SELECT judul, LENGTH(judul) FROM books WHERE LENGTH(judul) > 150;
-- SELECT id, judul, tahun_terbit FROM books
-- WHERE tahun_terbit < 1800 OR tahun_terbit > EXTRACT(YEAR FROM CURRENT_DATE);
-- SELECT judul, stok_total, denda_per_hari, durasi_maks_pinjam FROM books
-- WHERE stok_total > 100 OR denda_per_hari > 100000 OR durasi_maks_pinjam > 365;

ALTER TABLE books ALTER COLUMN judul TYPE VARCHAR(150);

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
	sinopsis TEXT,
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

UPDATE books SET sinopsis = 'Berlatar Bandung tahun 1990, Milea Adnan Hussain adalah siswi pindahan dari Jakarta yang cerdas dan menarik perhatian banyak siswa di SMA barunya. Di antara mereka muncul Dilan, seorang remaja eksentrik yang juga menjabat sebagai panglima tempur geng motor. Alih-alih mendekati Milea dengan cara konvensional, Dilan meramalnya akan bertemu dengannya di kantin, memberinya hadiah ulang tahun berupa buku teka-teki silang yang sudah diisi penuh agar tidak pusing, hingga mengirimkan "surat keputusan" resmi mengenai perasaannya. Di balik sikapnya yang konyol, puitis, dan suka berkelahi, Dilan menyimpan sisi lembut dan perlindungan yang tulus. Konflik muncul ketika keterlibatan Dilan dalam bentrokan geng motor mengancam keselamatan dirinya dan membuat Milea dilanda dilema antara rasa cinta dan ketakutan akan kehilangan.' WHERE isbn = '978-602-7870-86-4'; -- Dilan: Dia adalah Dilanku Tahun 1990
UPDATE books SET sinopsis = 'Di pedesaan Inggris abad ke-19, keluarga Bennet yang memiliki lima anak perempuan menghadapi tekanan ekonomi dan sosial untuk segera menikahkan putri-putri mereka dengan pria mapan demi menjamin masa depan keluarga. Elizabeth Bennet, putri kedua yang cerdas, kritis, dan mandiri, bertemu dengan Fitzwilliam Darcy, bangsawan kaya raya yang pendiam dan terkesan sombong. Kesan pertama yang buruk memicu kesalahpahaman beruntun—diperparah oleh fitnah dari perwira menawan bernama George Wickham dan campur tangan Darcy yang memisahkan kakak Elizabeth (Jane) dari sahabat Darcy (Charles Bingley). Melalui serangkaian peristiwa memalukan dalam keluarga Bennet dan surat pengakuan yang jujur dari Darcy, keduanya dipaksa menanggalkan keangkuhan (pride) dan prasangka (prejudice) masing-masing untuk menyadari ketulusan cinta mereka.' WHERE isbn = '978-0-14-143951-8'; -- Pride and Prejudice
UPDATE books SET sinopsis = 'Raib adalah remaja perempuan berusia 15 tahun yang tampak biasa saja, namun ia menyimpan rahasia besar: ia bisa menghilang hanya dengan menutup wajahnya menggunakan kedua telapak tangan. Kehidupannya berubah drastis saat kejadian aneh di sekolah mempertemukannya dengan Seli, teman sekelasnya yang ternyata memiliki kekuatan mengeluarkan petir, serta Ali, si biang kerok jenius yang diam-diam menyelidiki fenomena misterius di sekitar mereka. Kemunculan sosok asing bernama Tamus menyeret ketiganya masuk melalui portal menuju dunia paralel bernama Klan Bulan—sebuah peradaban maju yang tersembunyi dari manusia bumi. Di sana, Raib menyadari bahwa dirinya adalah keturunan bangsawan klan tersebut dan harus belajar mengendalikan kekuatannya demi menggagalkan rencana Tamus membebaskan "Tanpa Mahkota", musuh besar yang mengancam keseimbangan seluruh dunia paralel.' WHERE isbn = '978-602-03-0112-9'; -- Bumi
UPDATE books SET sinopsis = 'Setelah kedua orang tuanya meninggal, Harry Potter tumbuh sebagai anak yatim piatu yang tersiksa di bawah asuhan keluarga bibinya yang kejam, keluarga Dursley, dan dipaksa tidur di lemari bawah tangga. Tepat di ulang tahunnya yang ke-11, raksasa ramah bernama Rubeus Hagrid datang membawa fakta mengejutkan: Harry adalah seorang penyihir terkenal yang selamat dari kutukan penyihir hitam paling ditakuti, Lord Voldemort. Harry pun berangkat ke Sekolah Sihir Hogwarts, berteman dekat dengan Ron Weasley dan Hermione Granger, serta mulai mempelajari dunia sihir. Di balik keseruan pelajaran mantra dan olahraga Quidditch, ketiganya mencurigai adanya upaya pencurian Batu Bertuah (Sorcerer''s Stone)—artefak pemberi keabadian yang disembunyikan di dalam kastel—dan harus melewati berbagai jebakan mematikan untuk mencegah Voldemort bangkit kembali.' WHERE isbn = '978-0-545-06967-0'; -- Harry Potter and the Sorcerer''s Stone
UPDATE books SET sinopsis = 'Ruben dan Dimas, dua mahasiswa Indonesia yang menjalin hubungan asmara sesama jenis di Amerika Serikat, berjanji untuk menciptakan sebuah karya sastra agung yang memadukan sains, filsafat, dan romansa. Mereka merancang kisah tentang Ferre (sang Ksatria), seorang eksekutif muda sukses yang terobsesi pada Rana (sang Puteri), seorang jurnalis sekaligus istri pengusaha yang terjebak dalam pernikahan hampa. Di sisi lain, kisah mereka bersinggungan dengan Diva, seorang model papan atas sekaligus pekerja seks kelas atas yang memiliki kecerdasan luar biasa. Tanpa mereka sadari, kehidupan para tokoh fiksi tersebut perlahan menjadi nyata dan saling terhubung melalui sosok peretas (hacker) anonim jenius berjuluk "Supernova" yang menjadi tempat konsultasi spiritual sekaligus jembatan lintas dimensi kesadaran bagi mereka semua.' WHERE isbn = '978-602-291-118-0'; -- Supernova: Ksatria, Puteri, dan Bintang Jatuh
UPDATE books SET sinopsis = 'Ribuan tahun di masa depan, kekaisaran antargalaksi dikendalikan oleh sistem feodal dan monopoli atas "Melange" (rempah), zat langka yang memperpanjang usia, meningkatkan kesadaran mental, dan memungkinkan navigasi ruang angkasa. Rempah ini hanya bisa ditemukan di satu tempat: planet gurun tandus Arrakis yang dihuni oleh cacing pasir raksasa dan suku pribumi tangguh bernama Fremen. Kaisar menunjuk keluarga bangsawan Atreides untuk mengelola Arrakis sebagai bagian dari jebakan politik bekerja sama dengan musuh bebuyutan mereka, keluarga Harkonnen. Setelah pengkhianatan keji menghancurkan klan Atreides, pewaris muda bernama Paul Atreides bersama ibunya melarikan diri ke padang pasir, menyatu dengan bangsa Fremen, dan bangkit sebagai pemimpin mesianik berjuluk Muad''Dib untuk merebut kembali takhta serta mengubah nasib seluruh galaksi.' WHERE isbn = '978-0-441-17271-9'; -- Dune
UPDATE books SET sinopsis = 'Tara Johandi ditemukan dalam kondisi trauma berat di dalam kotak kayu setelah menjadi satu-satunya penyintas dari pembantaian dan perampokan sadis yang menewaskan paman, bibi, dan sepupunya di Bandung. Selama menjalani proses pemulihan dan pendampingan psikologis bersama psikiaternya, dr. Alfons, pihak kepolisian terus memburu pelaku perampokan yang masih berkeliaran. Namun, kehadiran Ello, pria misterius dari masa lalu Tara, justru memicu serangkaian kejanggalan dalam kesaksiannya. Seiring berjalannya penyelidikan, batas antara korban dan pelaku menjadi kabur ketika lapisan demi lapisan kepribadian Tara terkuak—menyingkap rahasia kelam, trauma masa kecil, dan sisi psikopat yang tersembunyi di balik wajah polosnya.' WHERE isbn = '978-979-22-9756-0'; -- Katarsis
UPDATE books SET sinopsis = 'Saat berada di Paris, profesor simbologi dari Universitas Harvard, Robert Langdon, dipanggil ke Museum Louvre setelah kurator senior Jacques Saunière ditemukan tewas terbunuh dengan posisi tubuh menyerupai lukisan Vitruvian Man karya Leonardo da Vinci. Bersama Sophie Neveu, seorang kriptografer kepolisian yang juga cucu sang korban, Langdon menyadari bahwa Saunière meninggalkan rangkaian teka-teki rahasia di balik mahakarya Da Vinci. Sambil diburu oleh polisi Prancis yang mencurigai Langdon sebagai tersangka utama serta seorang biarawan albino pembunuh bayaran dari sekte Opus Dei, keduanya berlomba melintasi Paris dan London untuk mengungkap rahasia besar mengenai Cawan Suci (Holy Grail) yang dijaga selama berabad-abad oleh perkumpulan rahasia Biarawan Sion.' WHERE isbn = '978-0-307-47427-8'; -- The Da Vinci Code
UPDATE books SET sinopsis = 'Dituturkan berdasarkan pengalaman pribadi penulisnya, kisah ini mengikuti masa kecil Risa yang kesepian setelah pindah ke rumah tua peninggalan kolonial Belanda di Bandung. Karena memiliki kemampuan indra keenam (indigo), Risa mulai melihat dan berteman akrab dengan lima hantu anak-anak keturunan Belanda yang meninggal pada masa pendudukan Jepang: Peter, William, Janshen, Hans, dan Hendrick. Persahabatan lintas alam ini awalnya membawa keceriaan bagi Risa, namun perlahan mengundang gangguan dari entitas gaib jahat lain yang jauh lebih kelam, termasuk sosok hantu perempuan berbau menyengat bernama Asih yang berusaha mencelakai Risa dan adiknya.' WHERE isbn = '978-602-220-080-2'; -- Danur
UPDATE books SET sinopsis = 'Di kota kecil Derry, Maine, anak-anak mulai menghilang dan tewas secara misterius setiap siklus 27 tahun sekali. Pada musim panas tahun 1958, tujuh anak yang terpinggirkan dan menamai diri mereka The Losers'' Club menyadari bahwa mereka semua diteror oleh entitas kuno pemangsa rasa takut yang paling sering menampakkan diri sebagai badut menakutkan bernama Pennywise. Setelah berhasil melukai dan memaksa makhluk itu tidur kembali, mereka bersumpah untuk kembali ke Derry jika teror itu muncul lagi. Dua puluh tujuh tahun kemudian (1985), ketika pembunuhan brutal kembali terjadi, keenam anggota yang masih hidup harus menghadapi trauma masa kecil yang sempat terlupakan demi memusnahkan "It" untuk selamanya.' WHERE isbn = '978-1-5011-4297-0'; -- It
UPDATE books SET sinopsis = 'Terbagi menjadi dua sudut pandang waktu, bagian pertama mengisahkan Biru Laut, seorang mahasiswa sastra sekaligus aktivis kelompok Winatra di era 1990-an yang memperjuangkan demokrasi dan keadilan sosial di bawah tekanan rezim otoriter Orde Baru. Bersama rekan-rekannya, Laut menjalani aktivitas bawah tanah, diskusi buku terlarang, hingga akhirnya diculik, disiksa, dan dihilangkan secara paksa pada tahun 1998. Bagian kedua mengambil sudut pandang Asmara Jati, adik perempuan Laut, bersama kedua orang tuanya yang terus hidup dalam ketidakpastian bertahun-tahun kemudian—menyiapkan piring makan untuk anak yang tak kunjung pulang sambil berjuang mencari kejelasan nasib para aktivis yang hilang.' WHERE isbn = '978-602-424-694-5'; -- Laut Bercerita
UPDATE books SET sinopsis = 'Sebagai bagian pertama dari Tetralogi Buru, novel ini berlatar Hindia Belanda pada pergantian abad ke-20 dan mengikuti perjalanan Minke, satu-satunya siswa pribumi yang bersekolah di HBS (sekolah elit khusus keturunan Eropa) di Surabaya. Minke yang gemar menulis dan mengagumi kemajuan ilmu pengetahuan Eropa bertemu dengan Annelies Mellema, gadis Indo-Belanda cantik namun rapuh, serta ibunya, Nyai Ontosoroh—seorang perempuan pribumi tangguh dan cerdas yang mengelola perusahaan pertanian besar meski berstatus gundik tanpa hak hukum kolonial. Melalui hubungannya dengan keluarga Mellema, Minke menyaksikan langsung betapa timpang dan kejamnya hukum kolonial yang merampas hak-hak pribumi, sekaligus membangkitkan kesadaran nasionalismenya.' WHERE isbn = '978-979-97312-3-4'; -- Bumi Manusia
UPDATE books SET sinopsis = 'Berangkat dari pengalaman pribadi penulis yang sempat didiagnosis mengalami depresi berat, buku ini memperkenalkan kembali filsafat Stoikisme (Filsafat Teras) yang lahir di Yunani dan Romawi kuno dalam bahasa yang ringan, jenaka, dan relevan bagi pembaca Indonesia masa kini. Buku ini mengupas konsep fundamental seperti "Dikotomi Kendali" (membedakan hal-hal yang berada di bawah kendali kita seperti pikiran dan sikap, dengan hal-hal di luar kendali seperti opini orang lain atau kemacetan), teknik mengelola emosi negatif (premeditatio malorum), serta cara melatih ketangguhan mental agar tidak mudah reaktif terhadap drama media sosial maupun tekanan hidup sehari-hari.' WHERE isbn = '978-602-412-518-9'; -- Filosofi Teras
UPDATE books SET sinopsis = 'James Clear memaparkan bahwa kesuksesan luar biasa bukanlah hasil dari perubahan drastis dalam semalam, melainkan akumulasi dari kebiasaan-kebiasaan kecil (atomic habits) yang membaik sebesar 1% setiap hari. Dengan memadukan riset psikologi, biologi, dan ilmu saraf, buku ini membedah empat kaidah perubahan perilaku: menjadikannya terlihat, menjadikannya menarik, menjadikannya mudah, dan menjadikannya memuaskan. Pembaca juga diajak mengubah fokus dari sekadar mengejar target hasil menjadi membangun identitas diri yang baru—karena kebiasaan bertahan lama ketika menjadi bagian dari jati diri seseorang.' WHERE isbn = '978-0-7352-1129-2'; -- Atomic Habits
UPDATE books SET sinopsis = 'Ditulis secara personal oleh Presiden ke-3 Republik Indonesia, B.J. Habibie, sebagai bentuk terapi duka setelah kepergian sang istri pada tahun 2010, memoar ini merekam perjalanan cinta mereka selama hampir lima dekade. Kisah dimulai sejak masa sekolah di Bandung, pertemuan kembali pada tahun 1962, perjuangan hidup sederhana sebagai mahasiswa teknik di Aachen (Jerman), hingga pengabdian besar mereka membangun industri dirgantara nasional dan memimpin Indonesia melewati krisis reformasi 1998. Buku ini menonjolkan sosok Hasri Ainun Besari sebagai pendamping setia yang merelakan karier dokternya demi menjadi penopang utama di balik kejeniusan dan dedikasi Habibie bagi bangsa.' WHERE isbn = '978-979-1255-13-4'; -- Habibie & Ainun
UPDATE books SET sinopsis = 'Dalam memoar yang jujur dan reflektif ini, Michelle Obama membagi perjalanan hidupnya ke dalam tiga fase utama: Becoming Me, Becoming Us, dan Becoming More. Ia menceritakan masa kecilnya di lingkungan kelas pekerja South Side Chicago, perjuangannya menembus Universitas Princeton dan Harvard Law School sebagai perempuan kulit hitam, pertemuan dengan Barack Obama di sebuah firma hukum, hingga dinamika menyeimbangkan karier dan peran sebagai ibu. Bagian akhir mengulas pengalamannya selama delapan tahun sebagai Ibu Negara Amerika Serikat di Gedung Putih, termasuk tekanan sorotan publik dan inisiatif sosial yang ia bangun.' WHERE isbn = '978-1-5247-6313-8'; -- Becoming
UPDATE books SET sinopsis = 'Melalui 19 esai pendek yang kaya akan kisah nyata, Morgan Housel menunjukkan bahwa keberhasilan mengelola uang tidak selalu ditentukan oleh seberapa pintar seseorang dalam rumus investasi, melainkan oleh bagaimana ia bersikap terhadap uang. Buku ini membahas perbedaan antara menjadi "kaya" (terlihat bermewah-mewah hari ini) dan menjadi "sejahtera" (uang yang tidak dibelanjakan dan memberi kebebasan waktu), kekuatan bunga majemuk (compounding) yang membutuhkan kesabaran, pentingnya menyisakan ruang untuk kesalahan (room for error), serta bagaimana ego dan rasa tidak pernah cukup dapat menghancurkan kekayaan yang sudah dibangun bertahun-tahun.' WHERE isbn = '978-0-85719-768-9'; -- The Psychology of Money
UPDATE books SET sinopsis = 'Robert Kiyosaki membandingkan dua pola pikir keuangan yang ia pelajari sejak kecil di Hawaii melalui dua figur ayah: "Ayah Miskin" (ayah kandungnya yang berpendidikan tinggi dan bekerja sebagai pegawai negeri namun selalu kesulitan keuangan) dan "Ayah Kaya" (ayah sahabatnya yang tidak tamat sekolah menengah namun menjadi pengusaha sukses dan investor kaya). Buku ini menekankan pentingnya literasi finansial yang tidak diajarkan di sekolah, perbedaan mendasar antara aset (sesuatu yang memasukkan uang ke kantong) dan liabilitas (sesuatu yang mengeluarkan uang dari kantong), serta cara keluar dari siklus kerja keras seumur hidup (rat race) dengan membuat uang bekerja untuk kita.' WHERE isbn = '978-1-61268-019-4'; -- Rich Dad Poor Dad
UPDATE books SET sinopsis = 'Yuval Noah Harari merangkum perjalanan spesies Homo sapiens selama ratusan ribu tahun—dari sekadar salah satu spesies kera tak signifikan di Afrika Timur hingga menjadi penguasa tunggal planet Bumi. Buku ini membagi sejarah manusia ke dalam empat tonggak besar: Revolusi Kognitif (kemampuan manusia bekerja sama dalam jumlah besar berkat kepercayaan pada mitos kolektif seperti agama, negara, dan uang), Revolusi Pertanian (yang menjebak manusia dalam kerja keras dan hierarki sosial), Unifikasi Umat Manusia, serta Revolusi Sains yang melahirkan kapitalisme modern dan teknologi yang kini berpotensi mengubah masa depan biologis manusia itu sendiri.' WHERE isbn = '978-602-424-416-3'; -- Sapiens: Riwayat Singkat Umat Manusia
UPDATE books SET sinopsis = 'Ditulis khusus untuk pembaca non-ilmuwan dengan meminimalkan rumus matematika rumit, fisikawan teoretis ternama Stephen Hawking mengajak pembaca memahami pertanyaan-pertanyaan paling mendasar tentang alam semesta. Ia menjelaskan evolusi pemikiran manusia dari model geosentris Aristoteles hingga teori relativitas umum Einstein dan mekanika kuantum. Pembaca diajak menelusuri asal-usul alam semesta melalui peristiwa Big Bang, sifat ruang dan waktu yang melengkung, misteri lubang hitam (black holes) yang memancarkan radiasi, hingga pencarian "Teori Segalanya" (Theory of Everything) yang menyatukan seluruh hukum fisika.' WHERE isbn = '978-0-553-38016-3'; -- A Brief History of Time
UPDATE books SET sinopsis = 'Dianggap sebagai pelopor genre non-fiction novel, karya ini merekonstruksi secara mendetail tragedi pembunuhan brutal terhadap empat anggota keluarga petani terpandang, keluarga Clutter, di kota kecil Holcomb, Kansas, pada November 1959. Berdasarkan ribuan halaman wawancara langsung, Truman Capote menyajikan cerita secara bergantian antara kehidupan damai keluarga korban menjelang tragedi, pelarian dua mantan narapidana pelaku perampokan (Perry Smith dan Richard Hickock), penyelidikan panjang kepolisian Kansas, hingga proses persidangan dan eksekusi mati yang mengupas kondisi psikologis para pelaku.' WHERE isbn = '978-0-679-74558-7'; -- In Cold Blood
UPDATE books SET sinopsis = 'Buku ini mendokumentasikan penyelidikan mendalam dan obsesif jurnalis kejahatan Michelle McNamara dalam melacak identitas seorang predator seksual dan pembunuh berantai yang meneror negara bagian California sepanjang tahun 1970-an hingga 1980-an—yang ia beri julukan Golden State Killer. Memadukan laporan kepolisian lama, bukti forensik DNA, kesaksian para penyintas, serta refleksi pribadinya tentang dampak obsesi tersebut terhadap hidupnya, McNamara menyusun peta petunjuk yang akhirnya membantu aparat penegak hukum menangkap pelaku aslinya pada tahun 2018, dua tahun setelah penulis wafat.' WHERE isbn = '978-0-06-231978-4'; -- I''ll Be Gone in the Dark