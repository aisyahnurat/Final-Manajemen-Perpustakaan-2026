"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

const kolom =
  "w-full rounded-xl border border-[#a9ae88] bg-white px-3 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";
const tombolHijau =
  "whitespace-nowrap rounded-full bg-[#5e6b45] px-3 py-1 text-xs font-semibold text-white hover:bg-[#4a5636]";
const tombolMerah =
  "whitespace-nowrap rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500 hover:text-white";

// kerangka satu bagian: judul, tabel dengan kepala kolom, dan pesan kalau kosong
function Bagian({ judul, jumlah, kepala, kosong, children }) {
  return (
    <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
      <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">
        {judul} ({jumlah})
      </h2>
      <div className="overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-[#5e6b45] text-white">
            <tr>
              {kepala.map((k) => (
                <th key={k} className="px-3 py-2">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/80 text-[#4a4a3f]">{children}</tbody>
        </table>
        {jumlah === 0 && <p className="p-6 text-center text-[#4a4a3f]/70">{kosong}</p>}
      </div>
    </section>
  );
}

const sel = "border-t border-[#a9ae88]/40";
const td = "px-3 py-2";

export default function PeminjamanPage() {
  const { user } = useAuth(["pegawai", "admin"]);
  const [semua, setSemua] = useState([]);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);
  const [tolakId, setTolakId] = useState(null); // id peminjaman yang sedang ditolak
  const [alasan, setAlasan] = useState("");

  async function muat() {
    const res = await fetch("/api/loans");
    setSemua(await res.json());
  }

  useEffect(() => {
    if (user) muat();
  }, [user]);

  async function kirimAksi(id, aksi, alasan) {
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi, pegawai_id: user.id, alasan }),
    });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    muat();
  }

  async function aksiPerpanjangan(id, aksi) {
    const res = await fetch(`/api/loans/${id}/perpanjangan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi, pegawai_id: user.id }),
    });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    muat();
  }

  // buka modal penolakan (menggantikan prompt)
  function tolak(id) {
    setTolakId(id);
    setAlasan("");
  }

  // kirim penolakan dari modal
  function kirimPenolakan(e) {
    e.preventDefault();
    kirimAksi(tolakId, "tolak", alasan);
    setTolakId(null);
  }

  if (!user) {
    return (
      <Latar>
        <Navbar />
        <p className="px-4 py-16 text-center text-[#2f3b22]">Memuat...</p>
      </Latar>
    );
  }

  const menunggu = semua.filter((l) => l.status === "Menunggu Konfirmasi");
  const dipinjam = semua.filter((l) => l.status === "Sedang Dipinjam");
  const tunggakan = semua.filter((l) => l.status_denda === "Tertunggak");
  const perpanjangan = semua.filter(
    (l) => l.status === "Sedang Dipinjam" && l.status_perpanjangan === "Perpanjangan Diajukan"
  );

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <Link href={`/${user.role}`} className="text-sm font-semibold text-[#2f3b22] hover:underline">
            ← Kembali ke dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#2f3b22]">Peminjaman & Sirkulasi</h1>
        </div>

        {pesan && (
          <p
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              berhasil ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
            }`}
          >
            {pesan}
          </p>
        )}

        <Bagian
          judul="Antrean Pengajuan"
          jumlah={menunggu.length}
          kepala={["Mahasiswa", "NIM", "Buku", "Diajukan", "Aksi"]}
          kosong="Tidak ada pengajuan yang menunggu."
        >
          {menunggu.map((l) => (
            <tr key={l.id} className={sel}>
              <td className={td + " font-semibold text-[#2f3b22]"}>{l.nama_lengkap}</td>
              <td className={td}>{l.nomor_identitas}</td>
              <td className={td}>{l.judul}</td>
              <td className={td + " whitespace-nowrap"}>{l.tanggal_pengajuan}</td>
              <td className={td + " whitespace-nowrap"}>
                <button onClick={() => kirimAksi(l.id, "setujui")} className={tombolHijau + " mr-2"}>
                  Setujui
                </button>
                <button onClick={() => tolak(l.id)} className={tombolMerah}>Tolak</button>
              </td>
            </tr>
          ))}
        </Bagian>

        <Bagian
          judul="Pengajuan Perpanjangan"
          jumlah={perpanjangan.length}
          kepala={["Mahasiswa", "Buku", "Jatuh Tempo Sekarang", "Aksi"]}
          kosong="Tidak ada pengajuan perpanjangan."
        >
          {perpanjangan.map((l) => (
            <tr key={l.id} className={sel}>
              <td className={td + " font-semibold text-[#2f3b22]"}>{l.nama_lengkap}</td>
              <td className={td}>{l.judul}</td>
              <td className={td + " whitespace-nowrap"}>{l.tanggal_jatuh_tempo}</td>
              <td className={td + " whitespace-nowrap"}>
                <button onClick={() => aksiPerpanjangan(l.id, "setujui")} className={tombolHijau + " mr-2"}>
                  Setujui
                </button>
                <button onClick={() => aksiPerpanjangan(l.id, "tolak")} className={tombolMerah}>
                  Tolak
                </button>
              </td>
            </tr>
          ))}
        </Bagian>

        <Bagian
          judul="Sedang Dipinjam"
          jumlah={dipinjam.length}
          kepala={["Mahasiswa", "Buku", "Jatuh Tempo", "Terlambat", "Denda Berjalan", "Aksi"]}
          kosong="Tidak ada buku yang sedang dipinjam."
        >
          {dipinjam.map((l) => (
            <tr key={l.id} className={sel}>
              <td className={td + " font-semibold text-[#2f3b22]"}>{l.nama_lengkap}</td>
              <td className={td}>{l.judul}</td>
              <td className={td + " whitespace-nowrap"}>{l.tanggal_jatuh_tempo}</td>
              <td className={td + (l.hari_terlambat > 0 ? " font-semibold text-red-600" : "")}>
                {l.hari_terlambat} hari
              </td>
              <td className={td + " whitespace-nowrap"}>
                Rp {Number(l.denda_berjalan).toLocaleString("id-ID")}
              </td>
              <td className={td}>
                <button onClick={() => kirimAksi(l.id, "kembali")} className={tombolHijau}>
                  Konfirmasi Pengembalian
                </button>
              </td>
            </tr>
          ))}
        </Bagian>

        <Bagian
          judul="Denda Tertunggak"
          jumlah={tunggakan.length}
          kepala={["Mahasiswa", "Buku", "Denda", "Aksi"]}
          kosong="Tidak ada denda tertunggak."
        >
          {tunggakan.map((l) => (
            <tr key={l.id} className={sel}>
              <td className={td + " font-semibold text-[#2f3b22]"}>{l.nama_lengkap}</td>
              <td className={td}>{l.judul}</td>
              <td className={td + " whitespace-nowrap font-semibold text-red-600"}>
                Rp {l.denda_nominal.toLocaleString("id-ID")}
              </td>
              <td className={td}>
                <button onClick={() => kirimAksi(l.id, "lunas")} className={tombolHijau}>
                  Tandai Lunas
                </button>
              </td>
            </tr>
          ))}
        </Bagian>
      </main>

      {/* Modal alasan penolakan */}
      {tolakId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={kirimPenolakan}
            className="w-full max-w-md space-y-4 rounded-3xl bg-[#fff0c5] p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-[#2f3b22]">Tolak Pengajuan</h2>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">
                Alasan penolakan (wajib diisi)
              </span>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required
                rows={4}
                autoFocus
                className={kolom}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTolakId(null)}
                className="rounded-full border border-[#5e6b45] px-5 py-2 text-sm font-semibold text-[#5e6b45] hover:bg-[#5e6b45] hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Kirim Penolakan
              </button>
            </div>
          </form>
        </div>
      )}
    </Latar>
  );
}