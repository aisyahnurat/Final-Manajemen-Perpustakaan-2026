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

  // data rincian dibuat sebagai daftar supaya tampilannya cukup satu perulangan
  const rincian = [
    ["ISBN", buku.isbn],
    ["Penerbit", `${buku.penerbit} (${buku.tahun_terbit})`],
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

        {/* Sampul + informasi buku */}
        <section className="grid gap-6 rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:grid-cols-[260px_1fr] md:p-8">
          <div className="mx-auto w-48 md:w-full">
            <div className="relative aspect-[2/3] overflow-hidden rounded-l-sm rounded-r-xl shadow-[4px_8px_16px_rgba(0,0,0,0.35)]">
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
            <h1 className="mt-2 text-2xl font-bold text-[#2f3b22] md:text-4xl">{buku.judul}</h1>
            <p className="mt-1 text-[#4a4a3f]">oleh {buku.pengarang}</p>
            <p className="mt-2 font-semibold text-[#827148]">
              ⭐ {buku.rating_rata ?? "Belum ada rating"}
            </p>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {rincian.map(([nama, nilai]) => (
                <div key={nama} className="rounded-xl bg-[#fff0c5]/70 px-4 py-2">
                  <dt className="text-xs text-[#4a4a3f]/70">{nama}</dt>
                  <dd className="font-semibold text-[#2f3b22]">{nilai}</dd>
                </div>
              ))}
            </dl>

            {/* Tombol pinjam */}
            <div className="mt-6">
              {!user && (
                <Link
                  href="/login"
                  className="inline-block rounded-full bg-[#5e6b45] px-6 py-2.5 font-semibold text-white hover:bg-[#4a5636]"
                >
                  Login sebagai mahasiswa untuk meminjam
                </Link>
              )}
              {user?.role === "mahasiswa" && (
                <button
                  onClick={ajukan}
                  disabled={buku.stok_tersedia <= 0}
                  className="rounded-full bg-[#5e6b45] px-8 py-2.5 font-semibold text-white hover:bg-[#4a5636] disabled:cursor-not-allowed disabled:bg-gray-400"
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

        {/* Ulasan */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="text-2xl font-bold text-[#2f3b22]">Ulasan ({ulasan.length})</h2>
          {ulasan.length === 0 && <p className="mt-3 text-[#4a4a3f]/70">Belum ada ulasan.</p>}
          <div className="mt-4 space-y-3">
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
        </section>
      </main>
    </Latar>
  );
}