export function validasiBuku(b) {
  const wajib = [
    "judul", "isbn", "pengarang", "penerbit", "tahun_terbit",
    "category_id", "stok_total", "durasi_maks_pinjam", "denda_per_hari",
  ];
  for (const f of wajib) {
    if (b[f] === undefined || b[f] === null || String(b[f]).trim() === "") {
      return "Semua field wajib diisi (kecuali link sampul dan sinopsis)";
    }
  }

  const judul = String(b.judul).trim();
  if (judul.length > 150) {
    return "Judul maksimal 150 karakter (termasuk spasi)";
  }

  const pengarang = String(b.pengarang).trim();
  if (pengarang.length < 2 || pengarang.length > 100) {
    return "Nama pengarang harus 2 sampai 100 karakter";
  }
  if (!/\p{L}/u.test(pengarang)) {
    return "Nama pengarang harus mengandung huruf";
  }
  if (String(b.penerbit).trim().length > 150) {
    return "Penerbit maksimal 150 karakter";
  }
  if (b.cover_url && String(b.cover_url).length > 500) {
    return "Link gambar sampul maksimal 500 karakter";
  }

  const angka = {
    tahun_terbit: "Tahun terbit",
    stok_total: "Stok",
    durasi_maks_pinjam: "Durasi maksimal pinjam",
    denda_per_hari: "Denda per hari",
  };
  for (const [kolom, label] of Object.entries(angka)) {
    if (!/^-?[0-9]+$/.test(String(b[kolom]).trim())) {
      return `${label} harus berupa bilangan bulat tanpa titik atau koma (contoh: 1000)`;
    }
  }

  const TAHUN_MIN = 1800;
  const tahunIni = new Date().getFullYear();
  const tahun = String(b.tahun_terbit).trim();
  if (!/^\d{4}$/.test(tahun)) {
    return "Tahun terbit harus 4 digit angka (contoh: 2018)";
  }
  if (Number(tahun) < TAHUN_MIN || Number(tahun) > tahunIni) {
    return `Tahun terbit harus antara ${TAHUN_MIN} dan ${tahunIni}`;
  }
  if (Number(b.stok_total) < 0 || Number(b.denda_per_hari) < 0) {
    return "Stok dan denda tidak boleh negatif";
  }
  if (Number(b.durasi_maks_pinjam) <= 0) {
    return "Durasi maksimal pinjam harus lebih dari 0";
  }
  if (Number(b.stok_total) > 100) {
    return "Stok maksimal 100";
  }
  if (Number(b.durasi_maks_pinjam) > 365) {
    return "Durasi maksimal pinjam tidak boleh lebih dari 365 hari";
  }
  if (Number(b.denda_per_hari) > 100000) {
    return "Denda per hari maksimal Rp100.000";
  }
  if (b.sinopsis && String(b.sinopsis).length > 5000) {
    return "Sinopsis maksimal 5000 karakter";
  }
  return null; // null = lolos validasi
}