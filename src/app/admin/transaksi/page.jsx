"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// warna label tiap status (sama dengan dashboard mahasiswa)
const WARNA_STATUS = {
  "Menunggu Konfirmasi": "bg-amber-100 text-amber-800",
  "Sedang Dipinjam": "bg-green-100 text-green-800",
  Selesai: "bg-gray-200 text-gray-700",
  Ditolak: "bg-red-100 text-red-700",
};

const STATUS = ["Menunggu Konfirmasi", "Sedang Dipinjam", "Selesai", "Ditolak"];

const kolom =
  "rounded-xl border border-[#a9ae88] bg-white px-3 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";

export default function LogTransaksiPage() {
  const { user } = useAuth("admin");
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/loans").then((r) => r.json()).then(setData);
  }, [user]);

  if (!user) {
    return (
      <Latar>
        <Navbar />
        <p className="px-4 py-16 text-center text-[#2f3b22]">Memuat...</p>
      </Latar>
    );
  }

  // tampilkan semua, atau hanya yang statusnya sesuai filter
  const tampil = filter ? data.filter((l) => l.status === filter) : data;

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-[#2f3b22] hover:underline">
            ← Kembali ke dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#2f3b22]">Log Semua Transaksi</h1>
        </div>

        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#2f3b22]">Transaksi ({tampil.length})</h2>
            <label className="flex items-center gap-2 text-sm text-[#2f3b22]">
              Filter status
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={kolom}>
                <option value="">Semua</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#5e6b45] text-white">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Mahasiswa</th>
                  <th className="px-3 py-2">Buku</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Pinjam</th>
                  <th className="px-3 py-2">Jatuh Tempo</th>
                  <th className="px-3 py-2">Kembali</th>
                  <th className="px-3 py-2">Denda</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 text-[#4a4a3f]">
                {tampil.map((l) => (
                  <tr key={l.id} className="border-t border-[#a9ae88]/40">
                    <td className="px-3 py-2">{l.id}</td>
                    <td className="px-3 py-2 font-semibold text-[#2f3b22]">{l.nama_lengkap}</td>
                    <td className="px-3 py-2">{l.judul}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                          WARNA_STATUS[l.status] || "bg-gray-200"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{l.tanggal_pinjam || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{l.tanggal_jatuh_tempo || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{l.tanggal_kembali || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {l.denda_nominal > 0 ? (
                        <span className="font-semibold text-red-600">
                          Rp {l.denda_nominal.toLocaleString("id-ID")} ({l.status_denda})
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tampil.length === 0 && (
              <p className="p-6 text-center text-[#4a4a3f]/70">Tidak ada transaksi.</p>
            )}
          </div>
        </section>
      </main>
    </Latar>
  );
}