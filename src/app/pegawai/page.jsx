"use client";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// daftar menu dashboard pegawai
const MENU = [
  {
    href: "/pegawai/buku",
    ikon: "📚",
    judul: "Kelola Buku",
    teks: "Tambah, ubah, dan hapus koleksi buku perpustakaan.",
  },
  {
    href: "/pegawai/pengumuman",
    ikon: "📢",
    judul: "Kelola Pengumuman",
    teks: "Tulis dan terbitkan pengumuman operasional.",
  },
  {
    href: "/pegawai/peminjaman",
    ikon: "🔁",
    judul: "Peminjaman & Sirkulasi",
    teks: "Setujui pengajuan, konfirmasi pengembalian, dan catat pelunasan denda.",
  },
];

export default function PegawaiPage() {
  const { user, logout } = useAuth("pegawai");

  if (!user) {
    return (
      <Latar>
        <Navbar />
        <p className="px-4 py-16 text-center text-[#2f3b22]">Memuat...</p>
      </Latar>
    );
  }

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#2f3b22]">Dashboard Pegawai</h1>
            <p className="text-[#4a4a3f]">Selamat datang, {user.nama_lengkap}!</p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-[#5e6b45] px-5 py-2 text-sm font-semibold text-[#5e6b45] hover:bg-[#5e6b45] hover:text-white"
          >
            Logout
          </button>
        </div>

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
              <h2 className="mt-4 text-lg font-bold text-[#2f3b22]">{m.judul}</h2>
              <p className="mt-1 text-sm text-[#4a4a3f]">{m.teks}</p>
              <p className="mt-4 text-sm font-semibold text-[#5e6b45] group-hover:underline">
                Buka →
              </p>
            </Link>
          ))}
        </div>
      </main>
    </Latar>
  );
}