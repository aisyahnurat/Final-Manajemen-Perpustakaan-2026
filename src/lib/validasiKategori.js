// Mengembalikan pesan error (string) atau null kalau valid.
export function validasiKategori(k) {
  const nama = String(k.nama || "").trim();
  const kode = String(k.kode || "").trim().toUpperCase();
  const deskripsi = String(k.deskripsi || "").trim();

  if (nama.length < 2 || nama.length > 50) {
    return "Nama kategori harus 2–50 karakter";
  }
  if (!["Fiksi", "Non-Fiksi"].includes(k.kelompok)) {
    return "Kelompok harus Fiksi atau Non-Fiksi";
  }
  const pola = k.kelompok === "Fiksi" ? /^FIK-[A-Z]{2,6}$/ : /^NF-[A-Z]{2,6}$/;
  if (!pola.test(kode)) {
    return k.kelompok === "Fiksi"
      ? "Kode kategori Fiksi harus berawalan FIK- diikuti 2–6 huruf (contoh: FIK-ROM)"
      : "Kode kategori Non-Fiksi harus berawalan NF- diikuti 2–6 huruf (contoh: NF-SAINS)";
  }
  if (deskripsi.length > 300) {
    return "Deskripsi maksimal 300 karakter";
  }
  return null;
}