"use client";
import Link from "next/link";
import useAuth from "@/lib/useAuth";

export default function PegawaiPage() {
  const { user, logout } = useAuth("pegawai");

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Dashboard Pegawai</h1>
      <p>Selamat datang, {user.nama_lengkap}!</p>

      <p><Link href="/pegawai/buku">Kelola Buku</Link></p>
      <p><Link href="/pegawai/pengumuman">Kelola Pengumuman</Link></p>
      <p><Link href="/pegawai/peminjaman">Peminjaman & Sirkulasi</Link></p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}