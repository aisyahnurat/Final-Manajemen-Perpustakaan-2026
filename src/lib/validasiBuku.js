export function validasiBuku(b) {
  const wajib = [
    "judul", "isbn", "pengarang", "penerbit", "tahun_terbit",
    "category_id", "stok_total", "durasi_maks_pinjam", "denda_per_hari",
  ];
  for (const f of wajib) {
    if (b[f] === undefined || b[f] === null || String(b[f]).trim() === "") {
      return "Semua field wajib diisi (kecuali link sampul)";
    }
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

  if (Number(b.stok_total) < 0 || Number(b.denda_per_hari) < 0) {
    return "Stok dan denda tidak boleh negatif";
  }
  if (Number(b.durasi_maks_pinjam) <= 0) {
    return "Durasi maksimal pinjam harus lebih dari 0";
  }
  if (b.sinopsis && String(b.sinopsis).length > 5000) {
    return "Sinopsis maksimal 5000 karakter";
  }
  return null; // null = lolos validasi
}