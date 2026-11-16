"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";

export default function MahasiswaPage() {
  const { user, logout } = useAuth("mahasiswa");
  const [pinjaman, setPinjaman] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/loans?user_id=${user.id}`)
      .then((r) => r.json())
      .then(setPinjaman);
  }, [user]);

  if (!user) return <p>Memuat...</p>;

  const tunggakan = pinjaman.filter((p) => p.status_denda === "Tertunggak");
  const totalTunggakan = tunggakan.reduce((n, p) => n + p.denda_nominal, 0);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>Dashboard Mahasiswa</h1>
      <p>Selamat datang, {user.nama_lengkap}!</p>
      <p><Link href="/katalog">Katalog Buku</Link></p>

      {tunggakan.length > 0 && (
        <div style={{ border: "2px solid red", padding: 10, margin: "10px 0" }}>
          <strong>Denda tertunggak: Rp {totalTunggakan.toLocaleString("id-ID")}</strong>
          <p>Pengajuan peminjaman baru diblokir sampai denda dilunasi di meja sirkulasi.</p>
        </div>
      )}

      <h2>Peminjaman Saya</h2>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Buku</th><th>Status</th><th>Tgl Pinjam</th>
            <th>Jatuh Tempo</th><th>Denda</th>
          </tr>
        </thead>
        <tbody>
          {pinjaman.map((p) => (
            <tr key={p.id}>
              <td>{p.judul}</td>
              <td>
                {p.status}
                {p.alasan_penolakan && ` (${p.alasan_penolakan})`}
              </td>
              <td>{p.tanggal_pinjam || "-"}</td>
              <td>{p.tanggal_jatuh_tempo || "-"}</td>
              <td>
                {p.status === "Sedang Dipinjam" && p.denda_berjalan > 0
                  ? `Rp ${Number(p.denda_berjalan).toLocaleString("id-ID")} (berjalan)`
                  : p.denda_nominal > 0
                  ? `Rp ${p.denda_nominal.toLocaleString("id-ID")} (${p.status_denda})`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button onClick={logout}>Logout</button>
    </main>
  );
}