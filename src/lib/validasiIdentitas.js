import { validasiNim } from "@/lib/validasiNim";

const POLA_NIP = {
  admin: /^ADM[0-9]{3}$/,
  pegawai: /^PGW[0-9]{3}$/,
};

const PESAN = {
  mahasiswa: "Format NIM tidak valid (1 huruf A-H/M/N/P/R diikuti 9 angka)",
  admin: "Format NIP admin tidak valid (ADM diikuti 3 angka, contoh ADM002)",
  pegawai: "Format NIP pegawai tidak valid (PGW diikuti 3 angka, contoh PGW002)",
};

// mengembalikan null kalau valid, atau pesan kesalahan
export function cekIdentitas(role, nomor) {
  if (!PESAN[role]) return "Role tidak valid";
  const valid =
    role === "mahasiswa" ? validasiNim(nomor) : POLA_NIP[role].test(nomor);
  return valid ? null : PESAN[role];
}