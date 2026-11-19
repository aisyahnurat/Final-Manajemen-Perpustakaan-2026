"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import RakBuku from "@/components/RakBuku";

const KEUNGGULAN = [
  { ikon: "📚", judul: "Koleksi Lengkap", teks: "Fiksi dan Non-Fiksi dari 11 kategori" },
  { ikon: "📝", judul: "Pinjam Online", teks: "Ajukan peminjaman dari mana saja" },
  { ikon: "🔁", judul: "Perpanjangan Mudah", teks: "Perpanjang sebelum jatuh tempo" },
  { ikon: "⭐", judul: "Rating & Ulasan", teks: "Baca dan tulis ulasan buku" },
];

export default function HomePage() {
  const [populer, setPopuler] = useState([]);
  const [koleksi, setKoleksi] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/books/populer").then((r) => r.json()).then(setPopuler);
    fetch("/api/books")
      .then((r) => r.json())
      .then((d) => setKoleksi(Array.isArray(d) ? d.slice(0, 12) : []));
    fetch("/api/announcements?published=1")
      .then((r) => r.json())
      .then((d) => setPengumuman(d.slice(0, 3)));
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen"
    style={{
        backgroundColor: "#FFF0C5",
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #637545 0%, transparent 45%), radial-gradient(circle at 100% 100%, #BFA28C 0%, transparent 50%)",
        backgroundAttachment: "fixed",
      }}>
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative -mt-24">
        {/* foto di kanan, memudar ke kiri dan ke bawah */}
        <div
          className="absolute inset-0 bg-[url('/bg-perpus-fix.png')] bg-cover bg-center opacity-40 md:opacity-100 md:left-[5%]"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 35%), linear-gradient(to bottom, black 70%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 35%), linear-gradient(to bottom, black 70%, transparent)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
        
        <div className="relative mx-auto max-w-6xl px-4 pt-36 pb-24 md:pt-24 md:pb-32">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#4a4a3f]">
            SELAMAT DATANG DI PERPUSTAKAAN
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#2f3b22] md:text-6xl">
            Temukan Buku.
            <br />
            <span className="text-[#5e6b45] underline decoration-[#827148] decoration-4 underline-offset-8">
              Temukan Duniamu.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[#4a4a3f]">
            Ribuan halaman menunggu. Tempat di mana ngelamun pun tetap dapet ilmu karena dikelilingi buku.
          </p>
          <Link
            href="/katalog"
            className="mt-8 inline-block rounded-full bg-[#827148] px-7 py-3 font-semibold text-white shadow hover:bg-[#6b5c3b]"
          >
            Jelajahi Katalog →
          </Link>
        </div>

        {/* kolom pencarian melayang di tepi bawah hero */}
        <div className="relative z-10 mx-auto -mb-8 max-w-4xl px-4">
          {/* form GET biasa: mengirim ke /katalog?q=kata */}
          <form action="/katalog" className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl">
            <span className="pl-3 text-xl">🔍</span>
            <input
              name="q"
              placeholder="Cari judul atau pengarang"
              className="min-w-0 flex-1 px-2 py-3 text-[#4a4a3f] outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#2f3b22] px-6 py-3 font-semibold text-white hover:bg-[#1f2815]"
            >
              Cari
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 pb-16 pt-20">
        {/* ===== Keunggulan ===== */}
        <section className="grid grid-cols-2 gap-4 rounded-2xl bg-white/70 p-5 shadow backdrop-blur md:grid-cols-4">
          {KEUNGGULAN.map((k) => (
            <div key={k.judul} className="flex items-start gap-3">
              <span className="text-3xl">{k.ikon}</span>
              <div>
                <h3 className="text-sm font-semibold text-[#2f3b22]">{k.judul}</h3>
                <p className="text-xs text-[#4a4a3f]/80">{k.teks}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ===== Rak: buku terpopuler ===== */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-[#2f3b22]">Buku Terpopuler</h2>
          <RakBuku buku={populer} urutan />
        </section>

        {/* ===== Rak: koleksi buku ===== */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-[#2f3b22]">Koleksi Buku</h2>
            <Link href="/katalog" className="text-sm font-semibold text-[#5e6b45] hover:underline">
              Lihat semua →
            </Link>
          </div>
          <RakBuku buku={koleksi} />
        </section>

        {/* ===== Pengumuman ===== */}
        <section className="grid gap-6 rounded-3xl bg-white/60 p-6 shadow backdrop-blur md:grid-cols-[1fr_2fr] md:p-8">
          <div>
            <p className="text-sm font-semibold text-[#827148]">Kabar Perpustakaan</p>
            <h2 className="mt-1 text-2xl font-bold text-[#2f3b22]">Pengumuman Terbaru</h2>
            <p className="mt-3 text-[#4a4a3f]">
              Informasi jam layanan, acara, dan pembaruan terbaru dari perpustakaan.
            </p>
            <Link
              href="/pengumuman"
              className="mt-5 inline-block rounded-full bg-[#2f3b22] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f2815]"
            >
              Lihat Semua →
            </Link>
          </div>

          <div>
            {pengumuman.length === 0 && (
              <p className="text-[#4a4a3f]/70">Belum ada pengumuman.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pengumuman.map((p) => (
                <Link
                  key={p.id}
                  href={`/pengumuman/${p.id}`}
                  className="block rounded-2xl bg-[#fff0c5] p-4 shadow-sm transition hover:shadow-md"
                >
                  <span className="inline-block rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white">
                    {p.kategori}
                  </span>
                  <h3 className="mt-3 line-clamp-2 font-semibold text-[#2f3b22]">{p.judul}</h3>
                  <p className="mt-2 text-xs text-[#4a4a3f]/70">{p.tanggal_rilis}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Banner ajakan ===== */}
        <section className="grid overflow-hidden rounded-3xl shadow-lg md:grid-cols-2">
          <div className="h-48 bg-[url('/perpustakaan.jpg')] bg-cover bg-center md:h-auto" />
          <div className="bg-[#2f3b22] p-8 text-white md:p-10">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#FFF0C5]">MULAI SEKARANG</p>
            <h2 className="mt-2 text-3xl font-bold">Petualangan Bacamu Dimulai di Sini</h2>
            <p className="mt-3 text-white/80">
              Daftar sebagai mahasiswa, ajukan peminjaman, dan tulis ulasan untuk buku yang sudah kamu baca.
            </p>
            <Link
              href={user ? "/katalog" : "/register"}
              className="mt-6 inline-block rounded-full bg-[#FFF0C5] px-6 py-3 font-semibold text-[#2f3b22] hover:bg-white"
            >
              {user ? "Jelajahi Katalog →" : "Daftar Sekarang →"}
            </Link>
          </div>
        </section>
      </div>

      {/* ===== Footer ===== */}
      <footer className="bg-[#2f3b22] text-[#FFF0C5]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-xl font-bold">📚 PIKUN</p>
            <p className="mt-2 text-sm text-[#FFF0C5]/80">
              Perpustakaan Intelektual Kaya Usaha Ngelamun.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Jelajahi</h4>
            <ul className="mt-2 space-y-1 text-sm text-[#FFF0C5]/80">
              <li><Link href="/katalog" className="hover:underline">Katalog Buku</Link></li>
              <li><Link href="/pengumuman" className="hover:underline">Pengumuman</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Akun</h4>
            <ul className="mt-2 space-y-1 text-sm text-[#FFF0C5]/80">
              <li><Link href="/login" className="hover:underline">Login</Link></li>
              <li><Link href="/register" className="hover:underline">Register</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Layanan</h4>
            <ul className="mt-2 space-y-1 text-sm text-[#FFF0C5]/80">
              <li>Peminjaman Online</li>
              <li>Perpanjangan</li>
              <li>Rating dan Ulasan</li>
            </ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-[#FFF0C5]/70">
          © 2026 PIKUN. Tugas Final Praktikum Pemrograman Web.
        </p>
      </footer>
    </div>
  );
}