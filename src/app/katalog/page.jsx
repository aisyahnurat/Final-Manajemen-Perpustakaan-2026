"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";
import RakBuku from "@/components/RakBuku";

const HURUF = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const kolom =
  "w-full rounded-full border border-[#a9ae88] bg-white px-5 py-2.5 text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";

export default function KatalogPage() {
  const [buku, setBuku] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("");
  const [urut, setUrut] = useState("terbaru");
  const [huruf, setHuruf] = useState("");

  // ambil ?q= dan ?huruf= dari alamat (dari beranda)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("q")) setQ(sp.get("q"));
    if (sp.get("huruf")) setHuruf(sp.get("huruf").toUpperCase());
  }, []);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setKategori);
  }, []);

  // dijalankan ulang setiap pencarian, filter, urutan, atau huruf berubah
  useEffect(() => {
    const params = new URLSearchParams({ q, kategori: kat, urut, huruf });
    fetch(`/api/books?${params}`)
      .then((r) => r.json())
      .then((d) => setBuku(Array.isArray(d) ? d : []));
  }, [q, kat, urut, huruf]);

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-bold text-[#2f3b22]">Katalog Buku</h1>

        {/* Pencarian, kategori, urutan */}
        <section className="grid gap-3 rounded-2xl bg-white/70 p-4 shadow backdrop-blur md:grid-cols-[2fr_1fr_1fr]">
          <input
            placeholder="Cari judul / pengarang"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={kolom}
          />
          <select value={kat} onChange={(e) => setKat(e.target.value)} className={kolom}>
            <option value="">Semua kategori</option>
            {["Fiksi", "Non-Fiksi"].map((g) => (
              <optgroup key={g} label={g}>
                {kategori
                  .filter((k) => k.kelompok === g)
                  .map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
              </optgroup>
            ))}
          </select>
          <select value={urut} onChange={(e) => setUrut(e.target.value)} className={kolom}>
            <option value="terbaru">Terbaru ditambahkan</option>
            <option value="tahun">Tahun terbit terbaru</option>
            <option value="rating">Rating tertinggi</option>
          </select>
        </section>

        {/* Cari berdasarkan abjad */}
        <section className="rounded-2xl bg-white/70 p-4 shadow backdrop-blur">
          <p className="mb-2 text-sm font-semibold text-[#2f3b22]">Telusuri berdasarkan huruf awal judul</p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => setHuruf("")}
              className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
                huruf === "" ? "bg-[#5e6b45] text-white" : "bg-white text-[#4a4a3f] hover:bg-[#a9ae88] hover:text-white"
              }`}
            >
              Semua
            </button>
            {HURUF.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHuruf(h)}
                className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
                  huruf === h ? "bg-[#5e6b45] text-white" : "bg-white text-[#4a4a3f] hover:bg-[#a9ae88] hover:text-white"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </section>

        {/* Hasil */}
        <p className="text-sm text-[#2f3b22]">{buku.length} buku ditemukan</p>
        {buku.length === 0 ? (
          <p className="rounded-2xl bg-white/70 p-6 text-center text-[#4a4a3f]">Buku tidak ditemukan.</p>
        ) : (
          <RakBuku buku={buku} detail />
        )}
      </main>
    </Latar>
  );
}