"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

const kosong = { nama: "", kode: "", kelompok: "Fiksi", deskripsi: "" };

const kolom =
  "w-full rounded-xl border border-[#a9ae88] bg-white px-3 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";

export default function KategoriPage() {
  const { user } = useAuth("admin");
  const [daftar, setDaftar] = useState([]);
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);

  async function muatData() {
    const res = await fetch("/api/categories");
    setDaftar(await res.json());
  }

  useEffect(() => {
    if (user) muatData();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editId ? `/api/categories/${editId}` : "/api/categories";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({...form, admin_id: user.id}),
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

  function mulaiEdit(k) {
    setEditId(k.id);
    setForm({ nama: k.nama, kode: k.kode, kelompok: k.kelompok, deskripsi: k.deskripsi || "" });
    window.scrollTo({ top: 0, behavior: "smooth" }); // naik ke form
  }

  async function hapus(id) {
    if (!confirm("Hapus kategori ini?")) return;
    const res = await fetch(`/api/categories/${id}?admin_id=${user.id}`, { method: "DELETE" });
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
          <Link href="/admin" className="text-sm font-semibold text-[#2f3b22] hover:underline">
            ← Kembali ke dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#2f3b22]">Kelola Kategori</h1>
        </div>

        {/* Form tambah / ubah */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">
            {editId ? "Ubah Kategori" : "Tambah Kategori"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Nama kategori</span>
              <input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
                className={kolom}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Kode</span>
              <input
                value={form.kode}
                onChange={(e) => setForm({ ...form, kode: e.target.value })}
                required
                className={kolom}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Kelompok</span>
              <select
                value={form.kelompok}
                onChange={(e) => setForm({ ...form, kelompok: e.target.value })}
                className={kolom}
              >
                <option value="Fiksi">Fiksi</option>
                <option value="Non-Fiksi">Non-Fiksi</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Deskripsi</span>
              <input
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className={kolom}
              />
            </label>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
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
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                berhasil ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              {pesan}
            </p>
          )}
        </section>

        {/* Daftar kategori */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">Daftar Kategori ({daftar.length})</h2>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#5e6b45] text-white">
                <tr>
                  <th className="px-3 py-2">Kode</th>
                  <th className="px-3 py-2">Kelompok</th>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Deskripsi</th>
                  <th className="px-3 py-2">Jml Buku</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 text-[#4a4a3f]">
                {daftar.map((k) => (
                  <tr key={k.id} className="border-t border-[#a9ae88]/40">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{k.kode}</td>
                    <td className="px-3 py-2">
                      <span
                        className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: k.kelompok === "Fiksi" ? "#827148" : "#5D9253" }}
                      >
                        {k.kelompok}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-[#2f3b22]">{k.nama}</td>
                    <td className="px-3 py-2 [overflow-wrap:anywhere]">{k.deskripsi}</td>
                    <td className="px-3 py-2">{k.jumlah_buku}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        onClick={() => mulaiEdit(k)}
                        className="mr-2 rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white hover:bg-[#8f9570]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => hapus(k.id)}
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
              <p className="p-6 text-center text-[#4a4a3f]/70">Belum ada kategori.</p>
            )}
          </div>
        </section>
      </main>
    </Latar>
  );
}