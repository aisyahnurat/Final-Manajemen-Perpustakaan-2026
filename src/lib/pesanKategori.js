// membedakan nama kembar dan kode kembar
export function pesanKembar(error) {
  return error.constraint === "categories_kode_key"
    ? "Kode kategori sudah dipakai, gunakan kode lain"
    : "Nama kategori sudah dipakai, gunakan nama lain";
}