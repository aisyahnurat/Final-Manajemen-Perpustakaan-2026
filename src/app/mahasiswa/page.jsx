"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// warna label tiap status peminjaman
const WARNA_STATUS = {
  "Menunggu Konfirmasi": "bg-amber-100 text-amber-800",
  "Sedang Dipinjam": "bg-green-100 text-green-800",
  Selesai: "bg-gray-200 text-gray-700",
  Ditolak: "bg-red-100 text-red-700",
};

const kolom =
  "rounded-full border border-[#a9ae88] bg-white px-4 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";
const tombol =
  "rounded-full bg-[#5e6b45] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#4a5636]";
const tombolTipis =
  "rounded-full border border-[#5e6b45] px-4 py-1.5 text-sm font-semibold text-[#5e6b45] hover:bg-[#5e6b45] hover:text-white";

export default function MahasiswaPage() {
  const { user, logout } = useAuth("mahasiswa");
  const [pinjaman, setPinjaman] = useState([]);
  const [pesan, setPesan] = useState("");
  const [ulasanId, setUlasanId] = useState(null);
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState("");

  async function muat() {
    const res = await fetch(`/api/loans?user_id=${user.id}`);
    setPinjaman(await res.json());
  }

  useEffect(() => {
    if (user) muat();
  }, [user]);

  async function ajukanPerpanjangan(id) {
    const res = await fetch(`/api/loans/${id}/perpanjangan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    const data = await res.json();
    setPesan(data.message);
    muat();
  }

  async function kirimUlasan(loanId) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, loan_id: loanId, rating, komentar }),
    });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) {
      setUlasanId(null);
      setRating(5);
      setKomentar("");
      muat();
    }
  }

  if (!user) {
    return (
      <Latar>
        <Navbar />
        <p className="px-4 py-16 text-center text-[#2f3b22]">Memuat...</p>
      </Latar>
    );
  }

  const tunggakan = pinjaman.filter((p) => p.status_denda === "Tertunggak");
  const totalTunggakan = tunggakan.reduce((n, p) => n + p.denda_nominal, 0);

  // aktif = belum selesai diproses, riwayat = sudah selesai atau ditolak
  const aktif = pinjaman.filter((p) => p.status === "Menunggu Konfirmasi" || p.status === "Sedang Dipinjam");
  const riwayat = pinjaman.filter((p) => p.status === "Selesai" || p.status === "Ditolak");

  // teks denda pada satu peminjaman
  function teksDenda(p) {
    if (p.status === "Sedang Dipinjam" && p.denda_berjalan > 0) {
      return `Rp ${Number(p.denda_berjalan).toLocaleString("id-ID")} (berjalan)`;
    }
    if (p.denda_nominal > 0) {
      return `Rp ${p.denda_nominal.toLocaleString("id-ID")} (${p.status_denda})`;
    }
    return "-";
  }

  // satu kartu peminjaman
  function kartu(p) {
    const info = [
      ["Tgl Pinjam", p.tanggal_pinjam || "-"],
      ["Jatuh Tempo", p.tanggal_jatuh_tempo || "-"],
      ["Perpanjangan", p.status_perpanjangan === "Tidak Ada" ? "-" : p.status_perpanjangan],
      ["Denda", teksDenda(p)],
    ];

    return (
      <div key={p.id} className="rounded-2xl bg-white/80 p-4 shadow">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-[#2f3b22]">{p.judul}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${WARNA_STATUS[p.status] || "bg-gray-200"}`}>
            {p.status}
          </span>
        </div>

        {p.alasan_penolakan && (
          <p className="mt-2 text-sm text-red-700">Alasan penolakan: {p.alasan_penolakan}</p>
        )}

        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {info.map(([nama, nilai]) => (
            <div key={nama} className="rounded-lg bg-[#fff0c5]/70 px-3 py-1.5">
              <dt className="text-xs text-[#4a4a3f]/70">{nama}</dt>
              <dd className="font-medium text-[#2f3b22]">{nilai}</dd>
            </div>
          ))}
        </dl>

        {/* Aksi */}
        <div className="mt-3 space-y-2">
          {p.status === "Sedang Dipinjam" && p.status_perpanjangan === "Tidak Ada" && (
            <button onClick={() => ajukanPerpanjangan(p.id)} className={tombol}>
              Ajukan Perpanjangan
            </button>
          )}

          {p.status === "Selesai" && !p.sudah_ulasan && ulasanId !== p.id && (
            <button onClick={() => setUlasanId(p.id)} className={tombolTipis}>
              Tulis Ulasan
            </button>
          )}
          {p.status === "Selesai" && p.sudah_ulasan && (
            <p className="text-sm font-semibold text-[#5e6b45]">✓ Sudah diulas</p>
          )}

          {ulasanId === p.id && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select value={rating} onChange={(e) => setRating(e.target.value)} className={kolom}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} bintang</option>
                ))}
              </select>
              <input
                placeholder="Komentar"
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                className={kolom + " flex-1"}
              />
              <div className="flex gap-2">
                <button onClick={() => kirimUlasan(p.id)} className={tombol}>Kirim</button>
                <button onClick={() => setUlasanId(null)} className={tombolTipis}>Batal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const ringkasan = [
    ["Sedang dipinjam", pinjaman.filter((p) => p.status === "Sedang Dipinjam").length],
    ["Menunggu konfirmasi", pinjaman.filter((p) => p.status === "Menunggu Konfirmasi").length],
    ["Selesai", pinjaman.filter((p) => p.status === "Selesai").length],
  ];

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Judul + tombol */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#2f3b22]">Dashboard Mahasiswa</h1>
            <p className="text-[#4a4a3f]">Selamat datang, {user.nama_lengkap}!</p>
          </div>
          <div className="flex gap-2">
            <Link href="/katalog" className={tombol + " px-5 py-2"}>Katalog Buku</Link>
            <button onClick={logout} className={tombolTipis + " px-5 py-2"}>Logout</button>
          </div>
        </div>

        {/* Peringatan denda */}
        {tunggakan.length > 0 && (
          <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-4">
            <p className="font-bold text-red-700">
              Denda tertunggak: Rp {totalTunggakan.toLocaleString("id-ID")}
            </p>
            <p className="text-sm text-red-700">
              Pengajuan peminjaman baru diblokir sampai denda dilunasi di meja sirkulasi.
            </p>
          </div>
        )}

        {pesan && (
          <p className="rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-[#2f3b22]">{pesan}</p>
        )}

        {/* Ringkasan */}
        <div className="grid grid-cols-3 gap-3">
          {ringkasan.map(([nama, jumlah]) => (
            <div key={nama} className="rounded-2xl bg-white/70 p-3 text-center shadow backdrop-blur md:p-4">
              <p className="text-2xl font-bold text-[#5e6b45] md:text-3xl">{jumlah}</p>
              <p className="text-xs text-[#4a4a3f] md:text-sm">{nama}</p>
            </div>
          ))}
        </div>

        {/* Peminjaman aktif */}
        <section className="rounded-3xl bg-white/60 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-xl font-bold text-[#2f3b22]">Peminjaman Aktif</h2>
          {aktif.length === 0 && <p className="text-[#4a4a3f]/70">Tidak ada peminjaman aktif.</p>}
          <div className="grid gap-4 md:grid-cols-2">{aktif.map(kartu)}</div>
        </section>

        {/* Riwayat */}
        <section className="rounded-3xl bg-white/60 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-xl font-bold text-[#2f3b22]">Riwayat Peminjaman</h2>
          {riwayat.length === 0 && <p className="text-[#4a4a3f]/70">Belum ada riwayat.</p>}
          <div className="grid gap-4 md:grid-cols-2">{riwayat.map(kartu)}</div>
        </section>
      </main>
    </Latar>
  );
}