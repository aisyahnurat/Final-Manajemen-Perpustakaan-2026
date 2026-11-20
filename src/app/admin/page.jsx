"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// daftar menu dashboard admin
const MENU = [
  { href: "/admin/users", ikon: "👥", judul: "Kelola Pengguna", teks: "Tambah, ubah, dan nonaktifkan akun Admin, Pegawai, dan Mahasiswa." },
  { href: "/admin/kategori", ikon: "🏷️", judul: "Kelola Kategori", teks: "Atur kategori buku beserta kelompok Fiksi dan Non-Fiksi." },
  { href: "/pegawai/buku", ikon: "📚", judul: "Kelola Buku", teks: "Tambah, ubah, dan hapus koleksi buku." },
  { href: "/pegawai/pengumuman", ikon: "📢", judul: "Kelola Pengumuman", teks: "Tulis dan terbitkan pengumuman operasional." },
  { href: "/pegawai/peminjaman", ikon: "🔁", judul: "Peminjaman & Sirkulasi", teks: "Proses pengajuan, pengembalian, dan pelunasan denda." },
  { href: "/admin/transaksi", ikon: "🧾", judul: "Log Semua Transaksi", teks: "Pantau seluruh riwayat transaksi perpustakaan." },
];

export default function AdminPage() {
  const { user, logout } = useAuth("admin");
  const [stat, setStat] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/stats?admin_id=${user.id}`)
      .then((r) => r.json())
      .then(setStat);
  }, [user]);

  if (!user) {
    return (
      <Latar>
        <Navbar />
        <p className="px-4 py-16 text-center text-[#2f3b22]">Memuat...</p>
      </Latar>
    );
  }

  const kartu = stat && [
    ["📖", "Total judul buku", stat.total_judul],
    ["📦", "Total eksemplar", stat.total_eksemplar],
    ["🎓", "Mahasiswa terdaftar", stat.total_mahasiswa],
    ["🔄", "Transaksi aktif", stat.transaksi_aktif],
    ["💰", "Denda terkumpul (lunas)", `Rp ${stat.denda_lunas.toLocaleString("id-ID")}`],
  ];

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#2f3b22]">Dashboard Admin</h1>
            <p className="text-[#4a4a3f]">Selamat datang, {user.nama_lengkap}!</p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-[#5e6b45] px-5 py-2 text-sm font-semibold text-[#5e6b45] hover:bg-[#5e6b45] hover:text-white"
          >
            Logout
          </button>
        </div>

        {/* Statistik */}
        <section>
          <h2 className="mb-3 text-xl font-bold text-[#2f3b22]">Statistik</h2>
          {!kartu && <p className="text-[#4a4a3f]/70">Memuat statistik...</p>}
          {kartu && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {kartu.map(([ikon, label, nilai]) => (
                <div key={label} className="rounded-2xl bg-white/70 p-4 shadow backdrop-blur">
                  <span className="text-2xl">{ikon}</span>
                  <p className="mt-2 text-xl font-bold text-[#5e6b45] md:text-2xl">{nilai}</p>
                  <p className="text-xs text-[#4a4a3f] md:text-sm">{label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Menu */}
        <section>
          <h2 className="mb-3 text-xl font-bold text-[#2f3b22]">Menu</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="group rounded-3xl bg-white/70 p-6 shadow backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0c5] text-3xl">
                  {m.ikon}
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#2f3b22]">{m.judul}</h3>
                <p className="mt-1 text-sm text-[#4a4a3f]">{m.teks}</p>
                <p className="mt-4 text-sm font-semibold text-[#5e6b45] group-hover:underline">Buka →</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Latar>
  );
}