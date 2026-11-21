"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// warna sampul untuk buku yang belum punya gambar (sama dengan rak buku)
const WARNA = ["#5D9253", "#827148", "#8a6a6a", "#4f6b8a", "#a9774a", "#6b5b95", "#3f7f7a", "#b0694b"];

// ubah angka rating jadi bintang, misalnya 4 -> ★★★★☆
const bintang = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export default function DetailBukuPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState("");
  const [user, setUser] = useState(null);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${id}`).then(async (res) => {
      const json = await res.json();
      if (!res.ok) setGalat(json.message);
      else setData(json);
    });
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  async function ajukan() {
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, book_id: buku.id }),
    });
    const json = await res.json();
    setBerhasil(res.ok);
    setPesan(json.message);
  }

  if (galat || !data) {
    return (
      <Latar>
        <Navbar />
        <p className="mx-auto max-w-4xl px-4 py-16 text-center text-[#2f3b22]">
          {galat || "Memuat..."}
        </p>
      </Latar>
    );
  }

  const { buku, ulasan } = data;

  // rincian dibuat sebagai daftar supaya tampilannya cukup satu perulangan
  const rincian = [
    ["ISBN", buku.isbn],
    ["Penerbit", buku.penerbit],
    ["Tahun terbit", buku.tahun_terbit],
    ["Kategori", buku.kategori],
    ["Stok tersedia", `${buku.stok_tersedia} dari ${buku.stok_total}`],
    ["Maksimal pinjam", `${buku.durasi_maks_pinjam} hari`],
    ["Denda", `Rp ${buku.denda_per_hari.toLocaleString("id-ID")} / hari`],
  ];

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <Link href="/katalog" className="inline-block text-sm font-semibold text-[#2f3b22] hover:underline">
          ← Kembali ke katalog
        </Link>

        {/* Bagian atas: sampul + identitas buku */}
        <section className="grid items-center gap-8 md:grid-cols-[260px_1fr]">
          <div className="mx-auto w-48 md:w-full">
            <div className="relative aspect-[2/3] overflow-hidden rounded-l-sm rounded-r-xl shadow-[8px_14px_28px_rgba(0,0,0,0.4)]">
              {buku.cover_url ? (
                <img src={buku.cover_url} alt={buku.judul} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full flex-col justify-between p-4 pl-6 text-white"
                  style={{ backgroundColor: WARNA[buku.id % WARNA.length] }}
                >
                  <span className="text-lg font-bold leading-tight">{buku.judul}</span>
                  <span className="text-sm opacity-90">{buku.pengarang}</span>
                </div>
              )}
              <span className="absolute inset-y-0 left-0 w-2 bg-black/20" />
            </div>
          </div>

          <div>
            <span className="inline-block rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white">
              {buku.kategori}
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2f3b22] md:text-5xl">
              {buku.judul}
            </h1>
            <p className="mt-2 text-lg font-semibold text-[#4a4a3f]">{buku.pengarang}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-[#827148]">
                ⭐ {buku.rating_rata ?? "Belum ada rating"}
                {buku.rating_rata && <span className="font-normal text-[#4a4a3f]/70"> ({ulasan.length} ulasan)</span>}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  buku.stok_tersedia > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                }`}
              >
                {buku.stok_tersedia > 0 ? `Tersedia: ${buku.stok_tersedia}` : "Stok habis"}
              </span>
            </div>

            {/* Tombol pinjam */}
            <div className="mt-6">
              {!user && (
                <Link
                  href="/login"
                  className="inline-block rounded-full bg-[#2f3b22] px-6 py-2.5 font-semibold text-white hover:bg-[#1f2815]"
                >
                  Login sebagai mahasiswa untuk meminjam
                </Link>
              )}
              {user?.role === "mahasiswa" && (
                <button
                  onClick={ajukan}
                  disabled={buku.stok_tersedia <= 0}
                  className="rounded-full bg-[#2f3b22] px-8 py-2.5 font-semibold text-white hover:bg-[#1f2815] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {buku.stok_tersedia <= 0 ? "Stok habis" : "Ajukan Pinjam"}
                </button>
              )}
              {pesan && (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    berhasil ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  {pesan}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Panel bawah: sinopsis, rincian, ulasan */}
        <section className="grid gap-8 rounded-3xl bg-[#fffaf0]/90 p-6 shadow-lg md:grid-cols-[2fr_1fr] md:p-10">
          <div>
            <h2 className="text-lg font-bold text-[#2f3b22]">Sinopsis</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-[#4a4a3f]">
              {buku.sinopsis || "Belum ada sinopsis untuk buku ini."}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#2f3b22]">Rincian Buku</h2>
            <dl className="mt-3 text-sm">
              {rincian.map(([nama, nilai]) => (
                <div key={nama} className="flex justify-between gap-4 border-b border-[#a9ae88]/40 py-2">
                  <dt className="text-[#4a4a3f]/70">{nama}</dt>
                  <dd className="text-right font-semibold text-[#2f3b22]">{nilai}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-bold text-[#2f3b22]">Ulasan ({ulasan.length})</h2>
            {ulasan.length === 0 && <p className="mt-3 text-[#4a4a3f]/70">Belum ada ulasan.</p>}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {ulasan.map((u, i) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-[#fff0c5]/70 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5e6b45] font-bold text-white">
                    {u.nama_lengkap?.[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2f3b22]">{u.nama_lengkap}</p>
                    <p className="text-sm text-[#827148]">
                      {bintang(u.rating)} <span className="text-[#4a4a3f]/70">· {u.tanggal}</span>
                    </p>
                    {u.komentar && <p className="mt-1 break-words text-[#4a4a3f]">{u.komentar}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Latar>
  );
}