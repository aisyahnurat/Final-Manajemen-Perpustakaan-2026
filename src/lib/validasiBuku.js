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
  if (Number(b.stok_total) < 0 || Number(b.denda_per_hari) < 0) {
    return "Stok dan denda tidak boleh negatif";
  }
  if (Number(b.durasi_maks_pinjam) <= 0) {
    return "Durasi maksimal pinjam harus lebih dari 0";
  }
  return null; // null = lolos validasi
}