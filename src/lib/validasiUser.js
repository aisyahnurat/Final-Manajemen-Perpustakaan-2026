import { emailUnhas } from "@/lib/validasiEmail";

const ROLE = ["admin", "pegawai", "mahasiswa"];

export function validasiUser(u, baru) {
  if (!u.nama_lengkap?.trim() || !u.email?.trim()) {
    return "Nama dan email wajib diisi";
  }
  if (!emailUnhas(u.email)) {
    return "Gunakan email kampus (berakhiran unhas.ac.id)";
  }
  if (!ROLE.includes(u.role)) return "Role tidak valid";
  if (baru && (!u.password?.trim() || !u.nomor_identitas?.trim())) {
    return "Password dan nomor identitas wajib diisi";
  }
  return null;
}