"use client";
import { useState, useEffect } from "react";
import useAuth from "@/lib/useAuth";

export default function PeminjamanPage() {
  const { user } = useAuth(["pegawai", "admin"]);
  const [semua, setSemua] = useState([]);
  const [pesan, setPesan] = useState("");

  async function muat() {
    const res = await fetch("/api/loans");
    setSemua(await res.json());
  }

  useEffect(() => {
    if (user) muat();
  }, [user]);

  async function kirimAksi(id, aksi, alasan) {
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi, pegawai_id: user.id, alasan }),
    });
    const data = await res.json();
    setPesan(data.message);
    muat();
  }

  function tolak(id) {
    const alasan = prompt("Alasan penolakan:");
    if (!alasan) return;
    kirimAksi(id, "tolak", alasan);
  }

  if (!user) return <p>Memuat...</p>;

  const menunggu = semua.filter((l) => l.status === "Menunggu Konfirmasi");
  const dipinjam = semua.filter((l) => l.status === "Sedang Dipinjam");
  const tunggakan = semua.filter((l) => l.status_denda === "Tertunggak");

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Peminjaman & Sirkulasi</h1>
      {pesan && <p><strong>{pesan}</strong></p>}

      <h2>Antrean Pengajuan ({menunggu.length})</h2>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr><th>Mahasiswa</th><th>NIM</th><th>Buku</th><th>Diajukan</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {menunggu.map((l) => (
            <tr key={l.id}>
              <td>{l.nama_lengkap}</td>
              <td>{l.nomor_identitas}</td>
              <td>{l.judul}</td>
              <td>{l.tanggal_pengajuan}</td>
              <td>
                <button onClick={() => kirimAksi(l.id, "setujui")}>Setujui</button>{" "}
                <button onClick={() => tolak(l.id)}>Tolak</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Sedang Dipinjam ({dipinjam.length})</h2>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Mahasiswa</th><th>Buku</th><th>Jatuh Tempo</th>
            <th>Terlambat</th><th>Denda Berjalan</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {dipinjam.map((l) => (
            <tr key={l.id}>
              <td>{l.nama_lengkap}</td>
              <td>{l.judul}</td>
              <td>{l.tanggal_jatuh_tempo}</td>
              <td>{l.hari_terlambat} hari</td>
              <td>Rp {Number(l.denda_berjalan).toLocaleString("id-ID")}</td>
              <td>
                <button onClick={() => kirimAksi(l.id, "kembali")}>
                  Konfirmasi Pengembalian
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Denda Tertunggak ({tunggakan.length})</h2>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr><th>Mahasiswa</th><th>Buku</th><th>Denda</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {tunggakan.map((l) => (
            <tr key={l.id}>
              <td>{l.nama_lengkap}</td>
              <td>{l.judul}</td>
              <td>Rp {l.denda_nominal.toLocaleString("id-ID")}</td>
              <td>
                <button onClick={() => kirimAksi(l.id, "lunas")}>Tandai Lunas</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}