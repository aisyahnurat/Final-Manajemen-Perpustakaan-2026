"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  const [populer, setPopuler] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);

  useEffect(() => {
    fetch("/api/books/populer").then((r) => r.json()).then(setPopuler);
    fetch("/api/announcements?published=1")
      .then((r) => r.json())
      .then((d) => setPengumuman(d.slice(0, 3)));
  }, []);

  return (
    <div className="min-h-screen"
    style={{
        backgroundColor: "#FFF0C5",
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #5D9253 0%, transparent 45%), radial-gradient(circle at 100% 100%, #BFA28C 0%, transparent 50%)",
        backgroundAttachment: "fixed",
      }}
      >
      <Navbar />

      {/* Hero + pencarian */}
      <section className="bg-[url('/perpustakaan.jpg')] bg-cover bg-center">
        <div className="bg-[#2f3b22]/60 px-4 py-16 md:py-24 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold">PIKUN</h1>
          <p className="mt-2 md:text-lg">Perpustakaan Intelektual Kaya Usaha Ngelamun</p>

          {/* form GET biasa: mengirim ke /katalog?q=kata */}
          <form action="/katalog" className="mt-8 mx-auto flex max-w-xl gap-2">
            <input
              name="q"
              placeholder="Cari judul atau pengarang"
              className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#a9ae88]"
            />
            <button
              type="submit"
              className="rounded-full bg-[#5e6b45] px-6 py-3 font-semibold hover:bg-[#4a5636]"
            >
              Cari
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Pengumuman terbaru */}
        <section>
          <h2 className="text-2xl font-bold text-[#4a4a3f] mb-4">Pengumuman Terbaru</h2>
          {pengumuman.length === 0 && (
            <p className="text-[#4a4a3f]/70">Belum ada pengumuman.</p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {pengumuman.map((p) => (
              <Link
                key={p.id}
                href={`/pengumuman/${p.id}`}
                className="block rounded-2xl bg-[#fff1d6] p-5 shadow hover:shadow-md transition"
              >
                <span className="inline-block rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white">
                  {p.kategori}
                </span>
                <h3 className="mt-3 font-semibold text-[#4a4a3f] line-clamp-2">{p.judul}</h3>
                <p className="mt-2 text-sm text-[#4a4a3f]/70">{p.tanggal_rilis}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Buku terpopuler */}
        <section>
          <h2 className="text-2xl font-bold text-[#4a4a3f] mb-4">5 Buku Terpopuler</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {populer.map((b, i) => (
              <Link
                key={b.id}
                href={`/katalog/${b.id}`}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow hover:shadow-lg transition"
              >
                <div className="relative aspect-[3/4]">
                  {b.cover_url ? (
                    <img src={b.cover_url} alt={b.judul} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#a9ae88] to-[#5e6b45] text-5xl">
                      📖
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-[#fff1d6] px-3 py-1 text-sm font-bold text-[#5e6b45]">
                    #{i + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="font-semibold text-[#4a4a3f] line-clamp-2">{b.judul}</h3>
                  <p className="text-sm text-[#4a4a3f]/70 line-clamp-1">{b.pengarang}</p>
                  <p className="mt-auto pt-2 text-xs font-semibold text-[#5e6b45]">
                    Dipinjam {b.jumlah_pinjam}x
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="bg-[#5e6b45] py-6 text-center text-sm text-white">
        © 2026 PIKUN · Perpustakaan Intelektual Kaya Usaha Ngelamun
      </footer>
    </div>
  );
}