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
    deskripsi TEXT,
	kelompok VARCHAR(20) NOT NULL CHECK (kelompok IN ('Fiksi', 'Non-Fiksi'))
);

-- 3. BOOKS
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(150) NOT NULL,
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
INSERT INTO users (nama_lengkap, email, password, role, nomor_identitas)
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

INSERT INTO books(judul, isbn, pengarang, penerbit, tahun_terbit, category_id, stok_total, stok_tersedia, durasi_maks_pinjam, denda_per_hari, sinopsis)
VALUES
  ('Once Upon a Broken Heart', '978-623-242-350-3', 'Stephanie Garber', 'Noura Books', 2022,
   (SELECT id FROM categories WHERE nama = 'Fantasi'),
   2, 2, 7, 1000,
   'Seumur hidupnya, Evangeline Fox selalu percaya pada cinta sejati dan akhir bahagia selamanya. Namun, dunianya runtuh saat ia mengetahui bahwa pria yang dicintainya akan segera menikahi saudari tirinya. Putus asa untuk menghentikan pernikahan tersebut, Evangeline nekat membuat kesepakatan dengan Jacks, sang Pangeran Hati yang karismatik namun berbahaya. Sebagai imbalan atas bantuannya, Jacks hanya meminta tiga ciuman yang harus diberikan kapan saja dan kepada siapa saja yang ia tentukan. Setelah ciuman pertama terjadi, Evangeline sadar bahwa berurusan dengan makhluk abadi pembawa kutukan jauh lebih mematikan dari yang ia bayangkan, dan Jacks memiliki rencana besar yang bisa membawanya menuju kebahagiaan abadi atau tragedi paling mengerikan.'),
  ('Shadow and Bone: Bayang dan Belulang', '978-602-481-554-7', 'Leigh Bardugo', 'Kepustakaan Populer Gramedia', 2021,
   (SELECT id FROM categories WHERE nama = 'Fantasi'),
   3, 3, 7, 1000,
   'Kerajaan Ravka yang dulunya megah kini terbelah dua oleh Shadow Fold, hamparan kabut kegelapan abadi yang dipenuhi monster pemangsa daging bernama Volcra. Alina Starkov, seorang gadis yatim piatu yang bekerja sebagai pembuat peta di pasukan kerajaan, tidak pernah menganggap dirinya istimewa. Namun, ketika resimennya diserang secara brutal saat melintasi Shadow Fold dan nyawa sahabat masa kecilnya, Mal, terancam, Alina tanpa sengaja melepaskan kekuatan sihir cahaya matahari yang telah lama dianggap punah. Kekuatan langka ini menjadikan Alina harapan terakhir untuk menghancurkan kabut kegelapan tersebut, sekaligus membawanya masuk ke lingkungan istana mewah para Grisha yang penuh intrik politik, pengkhianatan, dan ambisi gelap sang pemimpin misterius, The Darkling.'),
  ('The Name of the Wind (Nama Angin)', '978-602-03-8490-0', 'Patrick Rothfuss', 'Gramedia Pustaka Utama', 2018,
   (SELECT id FROM categories WHERE nama = 'Fantasi'),
   4, 4, 7, 1000,
   'Di sebuah penginapan terpencil di pedesaan, seorang pria berambut merah menyamar sebagai pemilik penginapan sederhana bernama Kote untuk menyembunyikan identitas aslinya sebagai Kvothe—seorang penyihir jenius, musisi ulung, sekaligus tokoh legenda yang kisahnya dibicarakan di seluruh penjuru dunia. Ketika seorang pencatat sejarah menemukannya, Kvothe setuju menceritakan kebenaran di balik berbagai rumor tentang dirinya selama tiga hari. Kisahnya dimulai dari masa kecilnya yang bahagia di kelompok seniman keliling hingga tragedi pembantaian keluarganya oleh makhluk mitos misterius bernama Chandrian, yang mendorongnya bertahan hidup sebagai gelandangan di jalanan kota Tarbean sebelum akhirnya berjuang menembus Universitas untuk mempelajari rahasia sihir simpati dan nama-nama sejati alam semesta.'),
  ('Malam Terakhir', '978-602-424-823-9', 'Leila S. Chudori', 'Kepustakaan Populer Gramedia', 2018,
   (SELECT id FROM categories WHERE nama = 'Fiksi Sejarah'),
   1, 1, 7, 1000,
   'Malam Terakhir merupakan kumpulan sembilan cerita pendek yang ditulis dengan gaya intelektual, puitis, sekaligus tajam dalam menggugat norma-norma sosial dan politik yang mapan. Berlatar berbagai kota di dunia—mulai dari Jakarta, Paris, Inggris, hingga Kanada—kesembilan kisah di dalamnya menyoroti tema seputar kejujuran, keyakinan, kebebasan berekspresi, kesetiaan perempuan, hingga pergulatan batin manusia saat menghadapi tekanan sejarah dan kematian. Melalui peristiwa-peristiwa krusial seperti dampak tragedi politik 1965 dan gejolak akhir 1980-an, Leila S. Chudori merangkai potret karakter yang berani mempertahankan prinsip hidup dan martabatnya sendiri hingga detik-detik paling menentukan.'),
  ('Gadis Kretek', '978-979-22-8141-5', 'Ratih Kumala', 'Gramedia Pustaka Utama', 2012,
   (SELECT id FROM categories WHERE nama = 'Fiksi Sejarah'),
   3, 3, 7, 1000,
   'Menjelang ajalnya, Soeraja—pemilik pabrik kretek besar Djagad Raja—terus mengigau memanggil nama seorang perempuan bernama Jeng Yah yang bukan istrinya. Demi memenuhi keinginan terakhir sang ayah sekaligus meredam kecemburuan ibu mereka, ketiga anak Soeraja (Lebas, Karim, dan Tegar) melakukan perjalanan menyusuri berbagai kota di Jawa Tengah untuk mencari sosok Jeng Yah. Pencarian tersebut membuka lembaran sejarah tersembunyi keluarga mereka sejak era penjajahan Belanda, masa pendudukan Jepang, hingga gejolak politik pasca-1965, sekaligus mengungkap persaingan bisnis kretek, rahasia racikan saus tembakau terbaik, dan kisah cinta tragis antara Soeraja dengan Dasiyah, peracik kretek perempuan berbakat di balik kejayaan merek Kretek Gadis.'),
  ('All the Light We Cannot See', '978-602-03-3290-1', 'Anthony Doerr', 'Gramedia Pustaka Utama', 2016,
   (SELECT id FROM categories WHERE nama = 'Fiksi Sejarah'),
   2, 2, 7, 1000,
   'Berlatar gejolak Perang Dunia II di Eropa, novel ini mengikuti dua garis kehidupan yang perlahan saling bersinggungan di kota benteng pesisir Saint-Malo, Prancis. Marie-Laure adalah gadis Prancis yang kehilangan penglihatannya pada usia enam tahun dan melarikan diri dari Paris bersama ayahnya, seorang kepala tukang kunci Museum Sejarah Alam yang diam-diam membawa permata legendaris bernilai tinggi. Sementara itu di Jerman, Werner Pfennig adalah anak yatim piatu berbakat luar biasa dalam merakit dan memperbaiki radio, yang kecerdasannya membawanya direkrut paksa ke akademi militer Nazi untuk melacak siaran perlawanan musuh. Di tengah kehancuran perang dan pilihan moral yang sulit, keduanya berusaha mempertahankan kemanusiaan mereka.'),
  ('Wingit', '978-623-00-2153-4', 'Sara Wijayanto', 'Elex Media Komputindo', 2020,
   (SELECT id FROM categories WHERE nama = 'Horror'),
   5, 5, 7, 1000,
   'Wingit merangkum kisah-kisah nyata dari pengalaman penelusuran supranatural Sara Wijayanto ke berbagai bangunan tua, rumah terbengkalai, dan lokasi angker yang menyimpan energi mistis kuat. Melalui kemampuan indra keenamnya, Sara berkomunikasi langsung dengan sosok-sosok tak kasatmata yang menghuni tempat-tempat tersebut untuk mendengarkan kisah kelam di balik keberadaan mereka. Setiap bab tidak hanya menghadirkan ketegangan teror gaib yang mencekam, tetapi juga mengungkap latar belakang sejarah kelam, dendam masa lalu, serta tragedi kemanusiaan yang membuat roh-roh tersebut terperangkap dan enggan meninggalkan lokasi wingit tersebut.'),
  ('Kisah Tanah Jawa: Jagat Lelembut', '978-979-780-944-7', 'Bonaventura D. Genta, dkk.', 'GagasMedia', 2019,
   (SELECT id FROM categories WHERE nama = 'Horror'),
   2, 2, 7, 1000,
   'Disusun berdasarkan hasil investigasi lapangan dan penelusuran retrokognisi tim Kisah Tanah Jawa, buku ini mengupas secara mendalam seluk-beluk dunia tak kasatmata dan berbagai entitas gaib yang mengakar dalam tradisi masyarakat Jawa. Pembaca diajak menelusuri asal-usul berbagai jenis lelembut—seperti pocong, kuntilanak, genderuwo, tuyul, hingga banaspati—lengkap dengan karakter, habitat, serta pola interaksi mereka dengan manusia. Selain mengulas sisi mistis tempat-tempat angker dan praktik persekutuan gaib seperti pesugihan, buku ini juga memaparkan kearifan lokal tentang batas antara dunia manusia dan dimensi gaib.'),
  ('The Shining', '978-602-06-2348-1', 'Stephen King', 'Gramedia Pustaka Utama', 2019,
   (SELECT id FROM categories WHERE nama = 'Horror'),
   3, 3, 7, 1000,
   'Jack Torrance, seorang mantan guru yang berjuang mengatasi masalah kecanduan alkohol dan amarah, menerima pekerjaan sebagai penjaga musim dingin di Hotel Overlook yang terisolasi di pegunungan Colorado. Ia membawa serta istrinya, Wendy, dan putra kecil mereka, Danny, yang diam-diam memiliki kemampuan telepati dan prekognisi kuat yang disebut ''the shining''. Saat badai salju memutus seluruh akses jalan keluar selama berbulan-bulan, kekuatan jahat kuno yang bersemayam di dalam sejarah kelam hotel tersebut mulai bangkit, merasuki pikiran Jack yang rapuh, dan mengubahnya menjadi ancaman mematikan bagi keluarganya sendiri.'),
  ('Salvation of a Saint (Dosa Malaikat)', '978-602-06-5037-1', 'Keigo Higashino', 'Gramedia Pustaka Utama', 2021,
   (SELECT id FROM categories WHERE nama = 'Misteri & Thriller'),
   2, 2, 7, 1000,
   'Yoshitaka Mashiba ditemukan tewas tergeletak di lantai apartemennya akibat keracunan arsenik yang tercampur di dalam kopi yang ia minum. Penyelidikan kepolisian segera mengarah pada istrinya, Ayane, yang memiliki motif kuat karena suaminya berniat menceraikannya. Namun, Ayane memiliki alibi yang sangat kokoh: saat pembunuhan terjadi, ia sedang berada ratusan kilometer jauhnya di kota lain dan tidak ada jejak racun maupun perangkat otomatis di rumah tersebut. Merasa buntu menghadapi kasus yang tampak mustahil dilakukan dari jarak jauh ini, Detektif Kusanagi dan Kaoru Utsumi meminta bantuan Profesor Manabu Yukawa—seorang fisikawan jenius yang dijuluki ''Detektif Galileo''—untuk membongkar trik pembunuhan sempurna tersebut.'),
  ('Keajaiban Toko Kelontong Namiya', '978-602-06-4829-3', 'Keigo Higashino', 'Gramedia Pustaka Utama', 2020,
   (SELECT id FROM categories WHERE nama = 'Misteri & Thriller'),
   5, 5, 7, 1000,
   'Tiga pemuda berandal—Atsuya, Shota, dan Kohei—bersembunyi di sebuah toko kelontong tua tak berpenghuni setelah melakukan pencurian. Di tengah malam, mereka dikejutkan oleh sepucuk surat yang tiba-tiba diselipkan melalui lubang surat pintu toko, berisi permintaan saran dari seseorang yang hidup di tahun 1980. Mereka segera menyadari bahwa toko milik mendiang Kakek Namiya tersebut memiliki anomali waktu yang menghubungkan masa kini dengan masa 30 tahun silam. Ketika mereka memutuskan membalas surat-surat keluh kesah yang masuk dari masa lalu, setiap saran yang mereka tuliskan ternyata saling terhubung dan mengubah takdir banyak orang.'),
  ('Gone Girl', '978-602-03-0956-9', 'Gillian Flynn', 'Gramedia Pustaka Utama', 2014,
   (SELECT id FROM categories WHERE nama = 'Misteri & Thriller'),
   4, 4, 7, 1000,
   'Pada pagi hari perayaan ulang tahun pernikahan mereka yang kelima, Nick Dunne pulang ke rumah dan mendapati istrinya, Amy, menghilang secara misterius dengan tanda-tanda perlawanan di ruang tamu. Di bawah sorotan media nasional dan tekanan penyelidikan kepolisian, perilaku Nick yang tampak dingin serta serangkaian kebohongan kecil perlahan menjadikannya tersangka utama pembunuhan istrinya sendiri. Namun, melalui buku harian rahasia Amy dan teka-teki perburuan harta karun tahunan yang ditinggalkannya, terungkap sisi gelap pernikahan mereka serta manipulasi psikologis kejam yang tidak terduga.'),
  ('Hujan', '978-602-03-2478-4', 'Tere Liye', 'Gramedia Pustaka Utama', 2016,
   (SELECT id FROM categories WHERE nama = 'Romantis'),
   5, 5, 7, 1000,
   'Berlatar tahun 2042 di dunia yang telah mencapai kemajuan teknologi mutakhir, Lail mendatangi sebuah pusat terapi saraf untuk menghapus kenangan menyakitkan dari ingatannya. Melalui proses pemindaian memori, terungkap kisah hidup Lail sejak usia 13 tahun ketika letusan gunung api purba dahsyat menghancurkan kotanya, menewaskan kedua orang tuanya, dan mempertemukannya dengan Esok, pemuda cerdas yang menyelamatkannya. Persahabatan yang tumbuh menjadi cinta di tengah pemulihan bencana itu diuji oleh jarak, pengorbanan besar demi kemanusiaan, dan luka batin yang membuat Lail harus memilih antara melupakan segalanya atau memeluk kenangan pahit tersebut.'),
  ('Critical Eleven', '978-602-03-1892-9', 'Ika Natassa', 'Gramedia Pustaka Utama', 2015,
   (SELECT id FROM categories WHERE nama = 'Romantis'),
   4, 4, 7, 1000,
   'Dalam dunia penerbangan, ''critical eleven'' adalah sebelas menit paling krusial—tiga menit setelah lepas landas dan delapan menit sebelum mendarat—di mana sebagian besar kecelakaan terjadi. Filosofi itulah yang dirasakan Ale dan Anya ketika pertemuan pertama mereka di pesawat rute Jakarta–Sydney langsung memicu ketertarikan mendalam hingga berujung pada pernikahan bahagia di New York. Namun, setelah lima tahun membangun rumah tangga yang tampak sempurna, sebuah tragedi besar menghantam kehidupan mereka, memicu kesalahpahaman, amarah terpendam, dan keheningan yang menguji apakah cinta mereka mampu bertahan melewati titik paling kritis.'),
  ('Perahu Kertas', '978-979-1227-78-0', 'Dee Lestari', 'Bentang Pustaka', 2009,
   (SELECT id FROM categories WHERE nama = 'Romantis'),
   5, 5, 7, 1000,
   'Kugy adalah gadis unik yang gemar menulis dongeng dan menghanyutkan surat-surat berisi curahan hatinya dalam bentuk perahu kertas ke aliran sungai, sementara Keenan adalah pelukis muda berbakat yang terpaksa kuliah di fakultas ekonomi demi memenuhi tuntutan ayahnya. Dipertemukan di Bandung melalui sahabat mereka, Eko dan Noni, keduanya langsung terhubung secara emosional dan saling menginspirasi untuk mengejar impian sejati masing-masing. Namun, kesalahpahaman, kehadiran orang ketiga, serta pilihan hidup yang berbeda memisahkan jalan mereka selama bertahun-tahun sebelum takdir kembali mempertemukan keduanya.'),
  ('Ready Player One', '978-602-03-8359-0', 'Ernest Cline', 'Gramedia Pustaka Utama', 2018,
   (SELECT id FROM categories WHERE nama = 'Sci-Fi'),
   2, 2, 7, 1000,
   'Di tahun 2045, dunia nyata dilanda krisis energi, kemiskinan, dan kehancuran lingkungan yang parah, membuat umat manusia melarikan diri ke dalam OASIS, sebuah semesta realitas virtual raksasa. Ketika pencipta OASIS, James Halliday, wafat, ia meninggalkan wasiat berupa perburuan harta karun digital berhadiah seluruh kekayaannya serta kendali penuh atas OASIS. Wade Watts, seorang remaja miskin yang terobsesi pada budaya pop tahun 1980-an, berhasil memecahkan petunjuk pertama dan seketika menjadi incaran jutaan pemain sekaligus korporasi raksasa kejam yang rela membunuh di dunia nyata demi memenangkan permainan tersebut.'),
  ('The Martian (Si Penghuni Mars)', '978-602-03-1983-4', 'Andy Weir', 'Gramedia Pustaka Utama', 2015,
   (SELECT id FROM categories WHERE nama = 'Sci-Fi'),
   6, 6, 7, 1000,
   'Saat badai debu dahsyat menghantam lokasi pendaratan misi Ares 3 di planet Mars, astronaut sekaligus ahli botani Mark Watney terhantam puing antena dan dinyatakan tewas oleh rekan-rekannya yang terpaksa melakukan evakuasi darurat. Namun, Mark ternyata selamat dan terbangun sendirian di planet tandus tanpa sarana komunikasi ke Bumi dengan persediaan makanan yang hanya cukup untuk beberapa bulan. Mengandalkan kecerdasan ilmiah, rekayasa teknik, dan humor di tengah keputusasaan, Mark berjuang menanam kentang, memproduksi air, dan mencari cara menghubungi NASA sebelum bantuan berikutnya tiba empat tahun kemudian.'),
  ('Project Hail Mary', '978-602-06-6847-5', 'Andy Weir', 'Gramedia Pustaka Utama', 2023,
   (SELECT id FROM categories WHERE nama = 'Sci-Fi'),
   4, 4, 7, 1000,
   'Ryland Grace terbangun dari tidur koma di dalam sebuah pesawat luar angkasa tanpa mengingat namanya sendiri maupun alasan mengapa ia berada jutaan kilometer dari Bumi. Seiring ingatannya perlahan pulih, Ryland menyadari bahwa dirinya adalah mantan guru sains yang direkrut untuk misi bunuh diri terakhir umat manusia: menyelamatkan matahari yang energinya terus meredup akibat parasit luar angkasa misterius bernama Astrophage. Di tengah kesendirian di sistem bintang Tau Ceti, Ryland justru menemukan sekutu tak terduga dari peradaban asing yang membantunya memecahkan teka-teki ilmiah demi menyelamatkan dua dunia.'),
  ('Catatan Seorang Demonstran', '978-979-3330-35-8', 'Soe Hok Gie', 'LP3ES', 2005,
   (SELECT id FROM categories WHERE nama = 'Biografi & Autobiografi'),
   6, 6, 14, 1000,
   'Buku ini memuat kumpulan catatan harian autentik Soe Hok Gie sejak masa remaja di bangku SMA hingga beberapa hari sebelum ia wafat di puncak Gunung Semeru pada tahun 1969. Melalui tulisan-tulisannya yang jujur, kritis, dan reflektif, pembaca diajak menyaksikan langsung dinamika pergolakan politik Indonesia pada akhir era Orde Lama dan awal Orde Baru dari sudut pandang seorang aktivis mahasiswa yang menolak tunduk pada kemunafikan kekuasaan, sekaligus sisi melankolis dan kecintaannya yang mendalam pada persahabatan dan alam bebas.'),
  ('Shoe Dog: Memoar Pendiri Nike', '978-602-03-8509-9', 'Phil Knight', 'Gramedia Pustaka Utama', 2018,
   (SELECT id FROM categories WHERE nama = 'Biografi & Autobiografi'),
   3, 3, 14, 1000,
   'Dalam memoar yang blak-blakan dan inspiratif ini, pendiri Nike, Phil Knight, mengisahkan perjalanan penuh liku di balik lahirnya salah satu merek olahraga paling ikonik di dunia. Dimulai pada tahun 1962 ketika ia baru lulus kuliah dan meminjam uang 50 dolar dari ayahnya untuk mengimpor sepatu lari berkualitas tinggi dari Jepang, Phil menceritakan berbagai krisis arus kas, pengkhianatan mitra bisnis, tuntutan hukum bernilai jutaan dolar, hingga perannya bersama tim eksentriknya dalam menciptakan inovasi sepatu olahraga yang mengubah industri global.'),
  ('Steve Jobs', '978-602-8811-66-8', 'Walter Isaacson', 'Bentang Pustaka', 2012,
   (SELECT id FROM categories WHERE nama = 'Biografi & Autobiografi'),
   5, 5, 14, 1000,
   'Disusun berdasarkan lebih dari empat puluh wawancara eksklusif dengan Steve Jobs selama dua tahun terakhir hidupnya serta wawancara dengan lebih dari seratus anggota keluarga, rekan kerja, dan pesaingnya, biografi ini memotret kehidupan sang visioner pendiri Apple secara menyeluruh. Walter Isaacson mengulas perjalanan Jobs sejak masa kecilnya di Silicon Valley, penciptaan komputer pribadi Macintosh, pemecatannya dari Apple, kebangkitannya melalui Pixar dan NeXT, hingga revolusi iPod, iPhone, dan iPad, tanpa menutupi sisi kepribadiannya yang keras, perfeksionis, dan penuh kontradiksi.'),
  ('Zero to One', '978-602-03-1523-2', 'Peter Thiel & Blake Masters', 'Gramedia Pustaka Utama', 2015,
   (SELECT id FROM categories WHERE nama = 'Bisnis & Keuangan'),
   7, 7, 14, 1000,
   'Berdasarkan catatan kuliah yang disampaikan oleh salah satu pendiri PayPal dan investor awal Facebook, Peter Thiel, di Universitas Stanford, buku ini memaparkan prinsip membangun perusahaan rintisan (startup) yang mampu menciptakan masa depan baru. Thiel berargumen bahwa kemajuan sejati bukan berasal dari meniru kesuksesan yang sudah ada (bergerak dari 1 ke n), melainkan menciptakan inovasi unik yang belum pernah ada sebelumnya (bergerak dari 0 ke 1), membangun monopoli kreatif melalui keunggulan teknologi, serta merumuskan visi jangka panjang yang jelas.'),
  ('The Intelligent Investor', '978-602-290-049-8', 'Benjamin Graham', 'Serambi Ilmu Semesta', 2015,
   (SELECT id FROM categories WHERE nama = 'Bisnis & Keuangan'),
   4, 4, 14, 1000,
   'Dianggap sebagai kitab suci investasi nilai (value investing) dan menjadi rujukan utama Warren Buffett, karya klasik Benjamin Graham ini mengajarkan strategi berinvestasi di pasar saham dengan meminimalkan risiko kerugian jangka panjang. Graham membedakan secara tegas antara investor yang melakukan analisis fundamental mendalam dengan spekulan yang mengejar keuntungan jangka pendek, memperkenalkan konsep metafora ''Mr. Market'' untuk menggambarkan fluktuasi emosi pasar, serta menekankan prinsip ''margin of safety'' dalam membeli saham di bawah nilai intrinsiknya.'),
  ('Start With Why', '978-602-06-2883-7', 'Simon Sinek', 'Gramedia Pustaka Utama', 2019,
   (SELECT id FROM categories WHERE nama = 'Bisnis & Keuangan'),
   6, 6, 14, 1000,
   'Simon Sinek meneliti mengapa sejumlah pemimpin dan organisasi—seperti Apple, Martin Luther King Jr., dan Wright Bersaudara—mampu menginspirasi loyalitas mendalam sementara yang lain hanya bersaing lewat harga dan fitur. Melalui kerangka berpikir ''The Golden Circle'' (Why, How, What), Sinek menjelaskan bahwa sebagian besar perusahaan berkomunikasi dari luar ke dalam (dimulai dari apa yang mereka jual), sedangkan pemimpin hebat selalu memulai dari dalam ke luar dengan mengomunikasikan alasan utama, tujuan, dan keyakinan di balik keberadaan organisasi mereka.'),
  ('Mindhunter: Inside the FBI''s Elite Serial Crime Unit', '978-0-671-52890-4', 'John E. Douglas & Mark Olshaker', 'Pocket Books', 1996,
   (SELECT id FROM categories WHERE nama = 'Kejahatan Nyata'),
   3, 3, 14, 1000,
   'John Douglas, salah satu pelopor unit ilmu perilaku FBI (Behavioral Science Unit), menceritakan pengalamannya selama lebih dari dua dekade mewawancarai langsung puluhan pembunuh berantai dan pelaku kejahatan seksual paling kejam di Amerika Serikat—termasuk Charles Manson, Ted Bundy, dan Ed Kemper. Melalui percakapan mendalam di balik jeruji besi tersebut, Douglas memetakan pola pikir, trauma masa kecil, dan modus operandi para pelaku untuk merumuskan metode modern ''criminal profiling'' yang membantu kepolisian memecahkan berbagai kasus pembunuhan berantai.'),
  ('Bad Blood: Rahasia dan Kebohongan di Sebuah Startup Silicon Valley', '978-602-06-3262-9', 'John Carreyrou', 'Gramedia Pustaka Utama', 2019,
   (SELECT id FROM categories WHERE nama = 'Kejahatan Nyata'),
   5, 5, 14, 1000,
   'Buku ini mendokumentasikan investigasi jurnalistik pemenang Pulitzer oleh jurnalis The Wall Street Journal, John Carreyrou, mengenai kebangkitan dan kehancuran Theranos, perusahaan bioteknologi yang didirikan oleh Elizabeth Holmes. Sempat dipuja sebagai revolusioner dunia medis dengan valuasi mencapai sembilan miliar dolar berkat klaim alat tes darah portabel dari setetes darah ujung jari, Theranos ternyata menjalankan penipuan sistematis dengan menyembunyikan kegagalan mesin mereka, mengintimidasi para mantan karyawan, dan membahayakan nyawa ribuan pasien.'),
  ('Say Nothing: A True Story of Murder and Memory in Northern Ireland', '978-0-385-52131-4', 'Patrick Radden Keefe', 'Doubleday', 2019,
   (SELECT id FROM categories WHERE nama = 'Kejahatan Nyata'),
   7, 7, 14, 1000,
   'Pada Desember 1972 di Belfast, Irlandia Utara, Jean McConville—seorang janda berusia 38 tahun dengan sepuluh anak—diculik dari rumahnya oleh sekelompok anggota bertopeng dan tidak pernah kembali. Menggunakan kasus hilangnya McConville sebagai titik awal, Patrick Radden Keefe menelusuri sejarah kelam konflik berdarah ''The Troubles'' selama tiga dekade, mengungkap keterlibatan tokoh-tokoh utama Tentara Republik Irlandia (IRA), budaya bungkam yang mengakar kuat, serta trauma moral yang menghantui para pelaku maupun keluarga korban.'),
  ('Guns, Germs & Steel: Rangkuman Riwayat Masyarakat Manusia (Bedil, Kuman, & Baja)', '978-602-424-138-4', 'Jared Diamond', 'Kepustakaan Populer Gramedia', 2013,
   (SELECT id FROM categories WHERE nama = 'Sejarah & Sains'),
   1, 1, 14, 1000,
   'Peraih Hadiah Pulitzer ini menjawab pertanyaan fundamental dalam sejarah manusia: mengapa peradaban di Eurasia berkembang jauh lebih cepat dan mampu menaklukkan benua lain, bukan sebaliknya? Dengan memadukan geografi, biologi evolusioner, antropologi, dan teknologi, Jared Diamond membuktikan bahwa ketimpangan kekuasaan antarperadaban sejak 11.000 SM tidak disebabkan oleh keunggulan ras atau kecerdasan genetik, melainkan oleh faktor lingkungan seperti ketersediaan tanaman dan hewan yang dapat didomestikasi, penyebaran kuman penyakit mematikan, serta penguasaan teknologi baja dan tulisan.'),
  ('Cosmos', '978-602-424-224-4', 'Carl Sagan', 'Kepustakaan Populer Gramedia', 2016,
   (SELECT id FROM categories WHERE nama = 'Sejarah & Sains'),
   6, 6, 14, 1000,
   'Diadaptasi dari serial dokumenter televisi legendaris, astronom Carl Sagan mengajak pembaca melakukan perjalanan melintasi ruang dan waktu untuk memahami tempat umat manusia di dalam alam semesta yang luas. Dengan bahasa yang puitis namun tetap berpijak kuat pada metode ilmiah, Sagan mengulas sejarah perkembangan sains dari perpustakaan kuno Aleksandria, evolusi kehidupan di Bumi, anatomi tata surya, kelahiran serta kematian bintang-bintang, hingga pencarian peradaban cerdas di luar angkasa dan pentingnya menjaga kelangsungan planet kita.'),
  ('The Selfish Gene (Gen Egois)', '978-602-424-728-7', 'Richard Dawkins', 'Kepustakaan Populer Gramedia', 2017,
   (SELECT id FROM categories WHERE nama = 'Sejarah & Sains'),
   3, 3, 14, 1000,
   'Dalam karya klasik biologi evolusioner ini, Richard Dawkins menawarkan cara pandang baru yang revolusioner terhadap teori seleksi alam Charles Darwin. Alih-alih melihat spesies atau individu sebagai unit utama evolusi, Dawkins menjelaskan bahwa gen-lah yang menjadi unit dasar seleksi alam yang berupaya mereplikasi dirinya dari generasi ke generasi, sementara organisme hidup hanyalah ''mesin penyintas'' bagi gen-gen tersebut. Melalui pendekatan ini, ia menguraikan asal-usul perilaku egois maupun altruisme di dunia hewan serta memperkenalkan konsep ''meme'' dalam evolusi budaya manusia.'),
  ('Sebuah Seni untuk Bersikap Bodo Amat', '978-602-452-698-6', 'Mark Manson', 'Grasindo', 2018,
   (SELECT id FROM categories WHERE nama = 'Self-Improvement'),
   5, 5, 14, 1000,
   'Melawan arus buku pengembangan diri konvensional yang selalu menuntut pikiran positif tanpa henti, Mark Manson menawarkan pendekatan yang jujur, lugas, dan realistis tentang cara menjalani hidup yang bermakna. Ia berpendapat bahwa manusia memiliki kapasitas perhatian yang terbatas, sehingga kunci ketenangan batin bukanlah berusaha peduli pada segala hal, melainkan memilih dengan bijak hal-hal apa saja yang benar-benar layak diperjuangkan, menerima keterbatasan serta penderitaan sebagai bagian alami kehidupan, dan bertanggung jawab penuh atas setiap pilihan nilai yang kita ambil.'),
  ('Berani Tidak Disukai', '978-602-06-3321-3', 'Ichiro Kishimi & Fumitake Koga', 'Gramedia Pustaka Utama', 2019,
   (SELECT id FROM categories WHERE nama = 'Self-Improvement'),
   7, 7, 14, 1000,
   'Dikemas dalam bentuk dialog mendalam selama lima malam antara seorang pemuda yang dipenuhi keraguan hidup dengan seorang filsuf di pinggiran kota Kyoto, buku ini memperkenalkan ajaran psikologi Alfred Adler yang praktis dan membebaskan. Pembaca diajak memahami bahwa manusia tidak dikendalikan oleh trauma masa lalu, melainkan oleh tujuan yang mereka pilih saat ini; bahwa semua persoalan hidup bersumber dari hubungan interpersonal; dan bahwa kebebasan sejati hanya dapat diraih ketika seseorang memiliki keberanian untuk tidak bergantung pada pengakuan orang lain.'),
  ('Deep Work', '978-602-291-668-0', 'Cal Newport', 'Bentang Pustaka', 2020,
   (SELECT id FROM categories WHERE nama = 'Self-Improvement'),
   4, 4, 14, 1000,
   'Di tengah gempuran notifikasi media sosial, surel, dan gangguan digital yang memecah perhatian setiap beberapa menit, Cal Newport menjelaskan mengapa kemampuan untuk fokus penuh tanpa distraksi—yang ia sebut sebagai ''deep work''—menjadi keterampilan paling berharga sekaligus semakin langka di era ekonomi modern. Melalui kombinasi riset neurosains dan studi kasus nyata, Newport membagikan empat aturan praktis untuk melatih konsentrasi mendalam, merancang rutinitas kerja yang terstruktur, membatasi penggunaan media sosial, dan menghasilkan karya intelektual bermutu tinggi dalam waktu lebih efisien.')
ON CONFLICT (isbn) DO UPDATE SET
  judul = EXCLUDED.judul,
  pengarang = EXCLUDED.pengarang,
  penerbit = EXCLUDED.penerbit,
  tahun_terbit = EXCLUDED.tahun_terbit,
  category_id = EXCLUDED.category_id,
  sinopsis = EXCLUDED.sinopsis;

UPDATE books SET cover_url = '/covers/once-upon.png' WHERE isbn = '978-623-242-350-3';
UPDATE books SET cover_url = '/covers/shadow-bone.png' WHERE isbn = '978-602-481-554-7';
UPDATE books SET cover_url = '/covers/the-name-of-the-wind.png' WHERE isbn = '978-602-03-8490-0';
UPDATE books SET cover_url = '/covers/malam-terakhir.png' WHERE isbn = '978-602-424-823-9';
UPDATE books SET cover_url = '/covers/gadis-kretek.png' WHERE isbn = '978-979-22-8141-5';
UPDATE books SET cover_url = '/covers/all-the-light.png' WHERE isbn = '978-602-03-3290-1';
UPDATE books SET cover_url = '/covers/wingit.png' WHERE isbn = '978-623-00-2153-4';
UPDATE books SET cover_url = '/covers/kisah-tanah-jawa.png' WHERE isbn = '978-979-780-944-7';
UPDATE books SET cover_url = '/covers/the-shining.png' WHERE isbn = '978-602-06-2348-1';
UPDATE books SET cover_url = '/covers/salvation.png' WHERE isbn = '978-602-06-5037-1';
UPDATE books SET cover_url = '/covers/keajaiban-toko-kelontong.png' WHERE isbn = '978-602-06-4829-3';
UPDATE books SET cover_url = '/covers/gone-girl.png' WHERE isbn = '978-602-03-0956-9';
UPDATE books SET cover_url = '/covers/hujan.png' WHERE isbn = '978-602-03-2478-4';
UPDATE books SET cover_url = '/covers/critical-eleven.png' WHERE isbn = '978-602-03-1892-9';
UPDATE books SET cover_url = '/covers/perahu-kertas.png' WHERE isbn = '978-979-1227-78-0';
UPDATE books SET cover_url = '/covers/ready-player-one.png' WHERE isbn = '978-602-03-8359-0';
UPDATE books SET cover_url = '/covers/the-martian.png' WHERE isbn = '978-602-03-1983-4';
UPDATE books SET cover_url = '/covers/project-hail-mary.png' WHERE isbn = '978-602-06-6847-5';
UPDATE books SET cover_url = '/covers/catatan-seorang-demonstran.png' WHERE isbn = '978-979-3330-35-8';
UPDATE books SET cover_url = '/covers/shoe-dog.png' WHERE isbn = '978-602-03-8509-9';
UPDATE books SET cover_url = '/covers/steve-jobs.png' WHERE isbn = '978-602-8811-66-8';
UPDATE books SET cover_url = '/covers/zero-to-one.png' WHERE isbn = '978-602-03-1523-2';
UPDATE books SET cover_url = '/covers/the-intelligent-investor.png' WHERE isbn = '978-602-290-049-8';
UPDATE books SET cover_url = '/covers/start-with-why.png' WHERE isbn = '978-602-06-2883-7';
UPDATE books SET cover_url = '/covers/mindhunter.png' WHERE isbn = '978-0-671-52890-4';
UPDATE books SET cover_url = '/covers/bad-blood.png' WHERE isbn = '978-602-06-3262-9';
UPDATE books SET cover_url = '/covers/say-nothing.png' WHERE isbn = '978-0-385-52131-4';
UPDATE books SET cover_url = '/covers/guns-germs-steel.png' WHERE isbn = '978-602-424-138-4';
UPDATE books SET cover_url = '/covers/kosmos.png' WHERE isbn = '978-602-424-224-4';
UPDATE books SET cover_url = '/covers/the-selfish-gene.png' WHERE isbn = '978-602-424-728-7';
UPDATE books SET cover_url = '/covers/sebuah-seni.png' WHERE isbn = '978-602-452-698-6';
UPDATE books SET cover_url = '/covers/berani-tidak-disukai.png' WHERE isbn = '978-602-06-3321-3';
UPDATE books SET cover_url = '/covers/deep-work.png' WHERE isbn = '978-602-291-668-0';

-- Data demo: 10 akun mahasiswa + peminjaman selesai + ulasan
-- Kata sandi semua akun mahasiswa demo: mahasiswa123 (di-hash bcrypt oleh pgcrypto, sama seperti akun admin dan pegawai)
-- Aturan sistem: ulasan hanya untuk peminjaman berstatus 'Selesai', satu ulasan per peminjaman.
-- Karena itu tiap ulasan dibuatkan satu peminjaman Selesai (stok tidak terpengaruh).
-- Aman dijalankan ulang: akun dan pasangan (mahasiswa, buku) yang sudah ada dilewati.
-- Buku diacu lewat ISBN; baris yang ISBN-nya tidak ada di database dilewati secara diam-diam,
-- jadi cek jumlah ulasan dengan query di bagian paling bawah.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (nama_lengkap, email, password, role, nomor_identitas)
VALUES
  ('Nabila Putri', 'mhs01@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259001'),
  ('Raka Aditya', 'mhs02@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259002'),
  ('Salsabila', 'mhs03@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259003'),
  ('Fadhil Akbar', 'mhs04@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259004'),
  ('Dewi Lestari', 'mhs05@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259005'),
  ('Rizky Saputra', 'mhs06@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259006'),
  ('Putri Maharani', 'mhs07@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259007'),
  ('Aryo Wibowo', 'mhs08@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259008'),
  ('Fadilah Hasan', 'mhs09@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259009'),
  ('Alif Rahman', 'mhs10@unhas.ac.id', crypt('mahasiswa123', gen_salt('bf', 10)), 'mahasiswa', 'A071259010')
ON CONFLICT (email) DO NOTHING;

WITH data(email, isbn, rating, komentar, hari_lalu) AS (
  VALUES
  ('mhs01@unhas.ac.id', '978-979-22-8141-5', 5, 'Ceritanya memikat, bikin penasaran dari bab awal sampai akhir. Latar kota-kotanya terasa hidup.', 95),
  ('mhs02@unhas.ac.id', '978-979-22-8141-5', 4, 'Alurnya bolak-balik antar zaman tapi tetap mudah diikuti.', 70),
  ('mhs03@unhas.ac.id', '978-979-22-8141-5', 5, 'Suka banget dengan sejarah industri kreteknya, jadi tahu banyak hal baru.', 40),
  ('mhs04@unhas.ac.id', '978-602-03-2478-4', 4, 'Dunia masa depannya menarik dan ceritanya menyentuh.', 88),
  ('mhs05@unhas.ac.id', '978-602-03-2478-4', 5, 'Endingnya bikin haru, cocok dibaca sambil hujan-hujan.', 52),
  ('mhs01@unhas.ac.id', '978-602-03-2478-4', 3, 'Bagus, tapi menurutku beberapa bagian terlalu cepat berpindah.', 33),
  ('mhs06@unhas.ac.id', '978-602-03-1892-9', 4, 'Ringan dibaca dan konfliknya dekat dengan kehidupan nyata.', 61),
  ('mhs02@unhas.ac.id', '978-602-03-1892-9', 5, 'Sekali duduk langsung habis. Dialognya natural.', 27),
  ('mhs07@unhas.ac.id', '978-979-1227-78-0', 5, 'Klasik yang tidak membosankan walau dibaca ulang.', 110),
  ('mhs03@unhas.ac.id', '978-602-03-8359-0', 4, 'Referensi budaya pop-nya seru terutama buat yang suka game.', 45),
  ('mhs08@unhas.ac.id', '978-602-03-8359-0', 3, 'Idenya keren, tapi ada bagian yang terasa agak panjang.', 20),
  ('mhs09@unhas.ac.id', '978-602-03-1983-4', 5, 'Humor dan sainsnya seimbang, susah berhenti membaca.', 78),
  ('mhs04@unhas.ac.id', '978-602-03-1983-4', 5, 'Seru melihat cara tokohnya memecahkan masalah satu per satu.', 36),
  ('mhs10@unhas.ac.id', '978-602-03-1983-4', 4, 'Banyak istilah teknis, tapi tetap enak diikuti.', 18),
  ('mhs09@unhas.ac.id', '978-602-06-6847-5', 5, 'Kejutannya di tengah cerita benar-benar tidak terduga.', 30),
  ('mhs05@unhas.ac.id', '978-602-06-6847-5', 4, 'Ceritanya hangat dan penuh harapan.', 24),
  ('mhs06@unhas.ac.id', '978-602-06-2348-1', 4, 'Seramnya pelan-pelan tapi menekan sampai akhir.', 84),
  ('mhs10@unhas.ac.id', '978-602-06-2348-1', 3, 'Awalnya terasa lambat, tapi bagian hotelnya mencekam.', 47),
  ('mhs07@unhas.ac.id', '978-602-03-0956-9', 4, 'Alurnya penuh kejutan dan membuat ingin terus membuka halaman berikutnya.', 58),
  ('mhs01@unhas.ac.id', '978-602-03-0956-9', 2, 'Alurnya menarik, tapi karakternya terlalu menyebalkan buatku.', 21),
  ('mhs08@unhas.ac.id', '978-623-00-2153-4', 4, 'Kisah nyata yang bikin merinding, jangan dibaca sendirian malam hari.', 66),
  ('mhs02@unhas.ac.id', '978-602-291-668-0', 5, 'Praktis, langsung bisa dicoba untuk mengatur jadwal belajar.', 92),
  ('mhs05@unhas.ac.id', '978-602-291-668-0', 4, 'Konsepnya jelas, contoh-contohnya relevan untuk mahasiswa.', 38),
  ('mhs10@unhas.ac.id', '978-602-291-668-0', 4, 'Perlu disiplin untuk menerapkannya, tapi hasilnya terasa.', 16),
  ('mhs03@unhas.ac.id', '978-602-06-3321-3', 5, 'Dialognya membuka sudut pandang baru soal hubungan dengan orang lain.', 100),
  ('mhs06@unhas.ac.id', '978-602-06-3321-3', 5, 'Mengubah cara pandangku tentang pengakuan orang lain.', 55),
  ('mhs07@unhas.ac.id', '978-602-06-3321-3', 4, 'Bahasanya mudah dicerna walau topiknya berat.', 29),
  ('mhs08@unhas.ac.id', '978-602-452-698-6', 4, 'Gaya bahasanya blak-blakan dan jujur.', 73),
  ('mhs09@unhas.ac.id', '978-602-452-698-6', 3, 'Ada benarnya, tapi sebagian terasa berulang.', 42),
  ('mhs01@unhas.ac.id', '978-0-7352-1129-2', 5, 'Langkah-langkah kecilnya mudah dipraktikkan setiap hari.', 105),
  ('mhs04@unhas.ac.id', '978-0-7352-1129-2', 5, 'Konsep kebiasaan kecil yang konsisten itu benar-benar berguna.', 63),
  ('mhs07@unhas.ac.id', '978-0-7352-1129-2', 4, 'Isinya padat, cocok buat yang ingin memperbaiki rutinitas.', 25),
  ('mhs09@unhas.ac.id', '978-602-8811-66-8', 4, 'Tebal, tapi isinya kaya dan memotivasi.', 81),
  ('mhs02@unhas.ac.id', '978-602-03-1523-2', 4, 'Pandangannya tentang startup terasa segar dan menantang.', 50),
  ('mhs03@unhas.ac.id', '978-602-424-224-4', 4, 'Penjelasan alam semesta yang puitis namun tetap ilmiah.', 35)
),
pinjam AS (
  INSERT INTO loans
    (user_id, book_id, status, tanggal_pengajuan, tanggal_pinjam,
     tanggal_jatuh_tempo, tanggal_kembali, diproses_oleh)
  SELECT u.id, b.id, 'Selesai',
         (CURRENT_DATE - d.hari_lalu - 1)::timestamp,
         CURRENT_DATE - d.hari_lalu,
         CURRENT_DATE - d.hari_lalu + 14,
         CURRENT_DATE - d.hari_lalu + 10,
         (SELECT id FROM users WHERE email = 'pegawai@unhas.ac.id')
  FROM data d
  JOIN users u ON u.email = d.email
  JOIN books b ON b.isbn  = d.isbn
  WHERE NOT EXISTS (
    SELECT 1 FROM loans l WHERE l.user_id = u.id AND l.book_id = b.id
  )
  RETURNING id, user_id, book_id, tanggal_kembali
)
INSERT INTO reviews (loan_id, user_id, book_id, rating, komentar, created_at)
SELECT p.id, p.user_id, p.book_id, d.rating, d.komentar,
       (p.tanggal_kembali + 1)::timestamp
FROM pinjam p
JOIN users u ON u.id = p.user_id
JOIN books b ON b.id = p.book_id
JOIN data  d ON d.email = u.email AND d.isbn = b.isbn;

COMMIT;