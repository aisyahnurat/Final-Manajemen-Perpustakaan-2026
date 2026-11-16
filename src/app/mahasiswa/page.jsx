"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";

export default function MahasiswaPage() {
  const { user, logout } = useAuth("mahasiswa");
  const [pinjaman, setPinjaman] = useState([]);
  const [pesan, setPesan] = useState("");
  const [ulasanId, setUlasanId] = useState(null);
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState("");

  async function muat() {
    const res = await fetch(`/api/loans?user_id=${user.id}`);
    setPinjaman(await res.json());
  }

  useEffect(() => {
    if (user) muat();
  }, [user]);

  async function ajukanPerpanjangan(id) {
    const res = await fetch(`/api/loans/${id}/perpanjangan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    const data = await res.json();
    setPesan(data.message);
    muat();
  }

  async function kirimUlasan(loanId) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, loan_id: loanId, rating, komentar }),
    });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) {
      setUlasanId(null);
      setRating(5);
      setKomentar("");
      muat();
    }
  }

  if (!user) return <p>Memuat...</p>;

  const tunggakan = pinjaman.filter((p) => p.status_denda === "Tertunggak");
  const totalTunggakan = tunggakan.reduce((n, p) => n + p.denda_nominal, 0);

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Dashboard Mahasiswa</h1>
      <p>Selamat datang, {user.nama_lengkap}!</p>
      <p><Link href="/katalog">Katalog Buku</Link></p>

      {tunggakan.length > 0 && (
        <div style={{ border: "2px solid red", padding: 10, margin: "10px 0" }}>
          <strong>Denda tertunggak: Rp {totalTunggakan.toLocaleString("id-ID")}</strong>
          <p>Pengajuan peminjaman baru diblokir sampai denda dilunasi di meja sirkulasi.</p>
        </div>
      )}

      {pesan && <p><strong>{pesan}</strong></p>}

      <h2>Peminjaman Saya</h2>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Buku</th><th>Status</th><th>Tgl Pinjam</th><th>Jatuh Tempo</th>
            <th>Perpanjangan</th><th>Denda</th><th>Aksi</th>
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
              <td>{p.status_perpanjangan === "Tidak Ada" ? "-" : p.status_perpanjangan}</td>
              <td>
                {p.status === "Sedang Dipinjam" && p.denda_berjalan > 0
                  ? `Rp ${Number(p.denda_berjalan).toLocaleString("id-ID")} (berjalan)`
                  : p.denda_nominal > 0
                  ? `Rp ${p.denda_nominal.toLocaleString("id-ID")} (${p.status_denda})`
                  : "-"}
              </td>
              <td>
                {p.status === "Sedang Dipinjam" && p.status_perpanjangan === "Tidak Ada" && (
                  <button onClick={() => ajukanPerpanjangan(p.id)}>
                    Ajukan Perpanjangan
                  </button>
                )}

                {p.status === "Selesai" && !p.sudah_ulasan && ulasanId !== p.id && (
                  <button onClick={() => setUlasanId(p.id)}>Tulis Ulasan</button>
                )}
                {p.status === "Selesai" && p.sudah_ulasan && "Sudah diulas"}

                {ulasanId === p.id && (
                  <div>
                    <select value={rating} onChange={(e) => setRating(e.target.value)}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} bintang</option>
                      ))}
                    </select>{" "}
                    <input placeholder="Komentar" value={komentar}
                      onChange={(e) => setKomentar(e.target.value)} />{" "}
                    <button onClick={() => kirimUlasan(p.id)}>Kirim</button>{" "}
                    <button onClick={() => setUlasanId(null)}>Batal</button>
                  </div>
                )}
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