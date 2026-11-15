const KATEGORI = ["Operasional", "Layanan", "Acara"];
const STATUS = ["Draft", "Published"];

export function validasiPengumuman(p) {
  if (!p.judul?.trim() || !p.konten?.trim()) {
    return "Judul dan konten wajib diisi";
  }
  if (!KATEGORI.includes(p.kategori)) return "Kategori tidak valid";
  if (!STATUS.includes(p.status)) return "Status tidak valid";
  if (!p.tanggal_rilis) return "Tanggal rilis wajib diisi";
  return null;
}