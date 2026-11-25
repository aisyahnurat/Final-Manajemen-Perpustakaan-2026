const KATEGORI = ["Operasional", "Layanan", "Acara"];
const STATUS = ["Draft", "Published"];

export function validasiPengumuman(p) {
  const judul = String(p.judul || "").trim();
  const konten = String(p.konten || "").trim();

  if (!judul || !konten) {
    return "Judul dan konten wajib diisi";
  }
  if (judul.length < 3 || judul.length > 150) {
    return "Judul pengumuman harus 3–150 karakter";
  }
  if (konten.length < 5 || konten.length > 5000) {
    return "Isi pengumuman harus 5–5000 karakter";
  }
  if (!KATEGORI.includes(p.kategori)) return "Kategori tidak valid";
  if (!STATUS.includes(p.status)) return "Status tidak valid";
  if (!p.tanggal_rilis) return "Tanggal rilis wajib diisi";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(p.tanggal_rilis) ||
    Number.isNaN(new Date(p.tanggal_rilis).getTime())
  ) {
    return "Format tanggal rilis tidak valid";
  }
  return null;
}