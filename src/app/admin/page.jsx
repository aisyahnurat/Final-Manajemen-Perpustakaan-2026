"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";

export default function AdminPage() {
  const { user, logout } = useAuth("admin");
  const [stat, setStat] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/stats?admin_id=${user.id}`)
      .then((r) => r.json())
      .then(setStat);
  }, [user]);

  if (!user) return <p>Memuat...</p>;

  const kartu = stat && [
    ["Total judul buku", stat.total_judul],
    ["Total eksemplar", stat.total_eksemplar],
    ["Mahasiswa terdaftar", stat.total_mahasiswa],
    ["Transaksi aktif", stat.transaksi_aktif],
    ["Denda terkumpul (lunas)", `Rp ${stat.denda_lunas.toLocaleString("id-ID")}`],
  ];

  return (
    <main style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>Dashboard Admin</h1>
      <p>Selamat datang, {user.nama_lengkap}!</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "20px 0" }}>
        {kartu
          ? kartu.map(([label, nilai]) => (
              <div key={label} style={{ border: "1px solid #ccc", padding: 14, minWidth: 150 }}>
                <small>{label}</small>
                <h2>{nilai}</h2>
              </div>
            ))
          : <p>Memuat statistik...</p>}
      </div>

      <h2>Menu</h2>
      <p><Link href="/admin/users">Kelola Pengguna</Link></p>
      <p><Link href="/admin/kategori">Kelola Kategori</Link></p>
      <p><Link href="/pegawai/buku">Kelola Buku</Link></p>
      <p><Link href="/pegawai/pengumuman">Kelola Pengumuman</Link></p>
      <p><Link href="/admin/transaksi">Log Semua Transaksi</Link></p>

      <button onClick={logout}>Logout</button>
    </main>
  );
}