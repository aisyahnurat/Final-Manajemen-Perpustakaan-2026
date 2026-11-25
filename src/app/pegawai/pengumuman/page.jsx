"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

const kosong = {
  judul: "", konten: "", kategori: "Operasional",
  tanggal_rilis: "", status: "Draft",
};

const kolom =
  "w-full rounded-xl border border-[#a9ae88] bg-white px-3 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";

// warna label kategori (sama dengan halaman pengumuman publik)
const WARNA_KATEGORI = {
  Operasional: "#a9ae88",
  Layanan: "#827148",
  Acara: "#5D9253",
};

export default function PengumumanPage() {
  const { user } = useAuth(["pegawai", "admin"]);
  const [daftar, setDaftar] = useState([]);
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);

  async function muatData() {
    const res = await fetch("/api/announcements");
    setDaftar(await res.json());
  }

  useEffect(() => {
    if (user) muatData();
  }, [user]);

  function ubah(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editId ? `/api/announcements/${editId}` : "/api/announcements";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, created_by: user.id }),
    });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    if (res.ok) {
      setForm(kosong);
      setEditId(null);
      muatData();
    }
  }

  function mulaiEdit(p) {
    setEditId(p.id);
    setForm({
      judul: p.judul, konten: p.konten, kategori: p.kategori,
      tanggal_rilis: p.tanggal_rilis, status: p.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" }); // naik ke form
  }

  async function hapus(id) {
    if (!confirm("Hapus pengumuman ini?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    if (res.ok) muatData();
  }

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
        <div>
          <Link href={`/${user.role}`} className="text-sm font-semibold text-[#2f3b22] hover:underline">
            ← Kembali ke dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#2f3b22]">Kelola Pengumuman</h1>
        </div>

        {/* Form tambah / ubah */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">
            {editId ? "Ubah Pengumuman" : "Tambah Pengumuman"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-3">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Judul</span>
              <input name="judul" value={form.judul} onChange={ubah} required className={kolom} maxLength={150} />
            </label>

            <label className="block sm:col-span-3">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Isi pengumuman</span>
              <textarea
                name="konten"
                value={form.konten}
                onChange={ubah}
                required
                rows={5}
                className={kolom}
                maxLength={5000}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Kategori</span>
              <select name="kategori" value={form.kategori} onChange={ubah} className={kolom}>
                <option>Operasional</option>
                <option>Layanan</option>
                <option>Acara</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Tanggal rilis</span>
              <input
                name="tanggal_rilis"
                type="date"
                value={form.tanggal_rilis}
                onChange={ubah}
                required
                className={kolom}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Status</span>
              <select name="status" value={form.status} onChange={ubah} className={kolom}>
                <option>Draft</option>
                <option>Published</option>
              </select>
            </label>

            <div className="flex gap-2 sm:col-span-3">
              <button
                type="submit"
                className="rounded-full bg-[#5e6b45] px-6 py-2 text-sm font-semibold text-white hover:bg-[#4a5636]"
              >
                {editId ? "Simpan" : "Tambah"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => { setEditId(null); setForm(kosong); }}
                  className="rounded-full border border-[#5e6b45] px-6 py-2 text-sm font-semibold text-[#5e6b45] hover:bg-[#5e6b45] hover:text-white"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          {pesan && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm [overflow-wrap:anywhere] ${
                berhasil ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              {pesan}
            </p>
          )}
        </section>

        {/* Daftar pengumuman */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">Daftar Pengumuman ({daftar.length})</h2>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#5e6b45] text-white">
                <tr>
                  <th className="px-3 py-2">Judul</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 text-[#4a4a3f]">
                {daftar.map((p) => (
                  <tr key={p.id} className="border-t border-[#a9ae88]/40">
                    <td className="px-3 py-2 font-semibold text-[#2f3b22]">
                      <div className="line-clamp-2 max-w-xs [overflow-wrap:anywhere]" title={p.judul}>{p.judul}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: WARNA_KATEGORI[p.kategori] || "#a9ae88" }}
                      >
                        {p.kategori}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{p.tanggal_rilis}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.status === "Published" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        onClick={() => mulaiEdit(p)}
                        className="mr-2 rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white hover:bg-[#8f9570]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => hapus(p.id)}
                        className="rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500 hover:text-white"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {daftar.length === 0 && (
              <p className="p-6 text-center text-[#4a4a3f]/70">Belum ada pengumuman.</p>
            )}
          </div>
        </section>
      </main>
    </Latar>
  );
}