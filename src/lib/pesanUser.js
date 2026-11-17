export function labelIdentitas(role) {
  return role === "mahasiswa" ? "NIM" : "NIP";
}

// contoh hasil: "Aisyah AT (NIM H071251087)"
export function namaPengguna(nama, role, nomor) {
  return `${nama} (${labelIdentitas(role)} ${nomor})`;
}

// membedakan email kembar dan NIM/NIP kembar
export function pesanDuplikat(error) {
  const bagian =
    error.constraint === "users_nomor_identitas_key"
      ? "Nomor identitas (NIM/NIP)"
      : "Email";
  return `${bagian} sudah terdaftar, gunakan yang lain`;
}