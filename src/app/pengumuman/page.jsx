"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// warna label tiap kategori
const WARNA = {
  Operasional: "#a9ae88",
  Layanan: "#827148",
  Acara: "#5D9253",
};

export default function DaftarPengumumanPage() {
  const [daftar, setDaftar] = useState([]);

  useEffect(() => {
    fetch("/api/announcements?published=1")
      .then((r) => r.json())
      .then(setDaftar);
  }, []);

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2f3b22]">Pengumuman</h1>
          <p className="mt-1 text-[#4a4a3f]">
            Informasi jam layanan, acara, dan kabar terbaru dari perpustakaan.
          </p>
        </div>

        {daftar.length === 0 && (
          <p className="rounded-2xl bg-white/70 p-6 text-center text-[#4a4a3f]">
            Belum ada pengumuman.
          </p>
        )}

        <div className="space-y-4">
          {daftar.map((p) => (
            <Link
              key={p.id}
              href={`/pengumuman/${p.id}`}
              className="block rounded-2xl bg-white/70 p-5 shadow backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: WARNA[p.kategori] || "#a9ae88" }}
                >
                  {p.kategori}
                </span>
                <span className="text-sm text-[#4a4a3f]/70">{p.tanggal_rilis}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[#2f3b22] [overflow-wrap:anywhere] md:text-xl">{p.judul}</h2>
              <p className="mt-2 text-sm font-semibold text-[#5e6b45]">Baca selengkapnya →</p>
            </Link>
          ))}
        </div>
      </main>
    </Latar>
  );
}