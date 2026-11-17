"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";

export default function LogTransaksiPage() {
  const { user } = useAuth("admin");
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/loans").then((r) => r.json()).then(setData);
  }, [user]);

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto" }}>
      <p><Link href="/admin">← Kembali</Link></p>
      <h1>Log Semua Transaksi</h1>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>#</th><th>Mahasiswa</th><th>Buku</th><th>Status</th>
            <th>Pinjam</th><th>Jatuh Tempo</th><th>Kembali</th><th>Denda</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l) => (
            <tr key={l.id}>
              <td>{l.id}</td>
              <td>{l.nama_lengkap}</td>
              <td>{l.judul}</td>
              <td>{l.status}</td>
              <td>{l.tanggal_pinjam || "-"}</td>
              <td>{l.tanggal_jatuh_tempo || "-"}</td>
              <td>{l.tanggal_kembali || "-"}</td>
              <td>
                {l.denda_nominal > 0
                  ? `Rp ${l.denda_nominal.toLocaleString("id-ID")} (${l.status_denda})`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}