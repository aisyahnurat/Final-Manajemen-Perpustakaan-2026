"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

const kosong = {
  judul: "", isbn: "", pengarang: "", penerbit: "", tahun_terbit: "",
  category_id: "", stok_total: "", durasi_maks_pinjam: "",
  denda_per_hari: "", cover_url: "", sinopsis: "",
};

const kolom =
  "w-full rounded-xl border border-[#a9ae88] bg-white px-3 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45] disabled:bg-gray-100 disabled:text-gray-500";

// satu kolom isian dengan label di atasnya
function Isian({ label, lebar = "", ...props }) {
  return (
    <label className={`block ${lebar}`}>
      <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">{label}</span>
      <input {...props} className={kolom} />
    </label>
  );
}

export default function BukuPage() {
  const { user } = useAuth(["pegawai", "admin"]);
  const [buku, setBuku] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);

  async function muatBuku(q = "") {
    const res = await fetch(`/api/books?q=${encodeURIComponent(q)}`);
    setBuku(await res.json());
  }

  useEffect(() => {
    if (!user) return;
    muatBuku();
    fetch("/api/categories").then((r) => r.json()).then(setKategori);
  }, [user]);

  function ubah(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editId ? `/api/books/${editId}` : "/api/books";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    if (res.ok) {
      setForm(kosong);
      setEditId(null);
      muatBuku(cari);
    }
  }

  function mulaiEdit(b) {
    setEditId(b.id);
    setForm({
      judul: b.judul, isbn: b.isbn, pengarang: b.pengarang,
      penerbit: b.penerbit, tahun_terbit: b.tahun_terbit,
      category_id: b.category_id, stok_total: b.stok_total,
      durasi_maks_pinjam: b.durasi_maks_pinjam,
      denda_per_hari: b.denda_per_hari, cover_url: b.cover_url || "",
      sinopsis: b.sinopsis || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" }); // naik ke form
  }

  async function hapus(id) {
    if (!confirm("Hapus buku ini?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    if (res.ok) muatBuku(cari);
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
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <Link href={`/${user.role}`} className="text-sm font-semibold text-[#2f3b22] hover:underline">
            ← Kembali ke dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#2f3b22]">Kelola Buku</h1>
        </div>

        {/* Form tambah / ubah */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">
            {editId ? "Ubah Buku" : "Tambah Buku"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Isian label="Judul" name="judul" value={form.judul} onChange={ubah} required lebar="lg:col-span-2" />
            <Isian label="ISBN (strip otomatis)" name="isbn" value={form.isbn} onChange={ubah} required disabled={editId !== null} />
            <Isian label="Pengarang" name="pengarang" value={form.pengarang} onChange={ubah} required />

            <Isian label="Penerbit" name="penerbit" value={form.penerbit} onChange={ubah} required />
            <Isian label="Tahun terbit" name="tahun_terbit" type="number" value={form.tahun_terbit} onChange={ubah} required />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Kategori</span>
              <select name="category_id" value={form.category_id} onChange={ubah} required className={kolom}>
                <option value="">-- Pilih kategori --</option>
                {["Fiksi", "Non-Fiksi"].map((g) => (
                  <optgroup key={g} label={g}>
                    {kategori.filter((k) => k.kelompok === g).map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <Isian label="Stok" name="stok_total" type="number" min="0" value={form.stok_total} onChange={ubah} required />

            <Isian label="Maks pinjam (hari)" name="durasi_maks_pinjam" type="number" min="1" value={form.durasi_maks_pinjam} onChange={ubah} required />
            <Isian label="Denda per hari (Rp)" name="denda_per_hari" type="number" min="0" value={form.denda_per_hari} onChange={ubah} required />
            <Isian label="Link gambar sampul (opsional)" name="cover_url" value={form.cover_url} onChange={ubah} lebar="sm:col-span-2" />

            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">
                Sinopsis (opsional)
              </span>
              <textarea
                name="sinopsis"
                value={form.sinopsis}
                onChange={ubah}
                rows={5}
                maxLength={5000}
                placeholder="Ringkasan isi buku..."
                className={kolom}
              />
              <span className="mt-1 block text-right text-xs text-[#4a4a3f]/70">
                {form.sinopsis.length} / 5000
              </span>
            </label>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-full bg-[#5e6b45] px-6 py-2 text-sm font-semibold text-white hover:bg-[#4a5636]"
              >
                {editId ? "Simpan" : "Tambah Buku"}
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

        {/* Daftar buku */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#2f3b22]">Daftar Buku ({buku.length})</h2>
            <input
              placeholder="Cari judul / pengarang"
              value={cari}
              onChange={(e) => { setCari(e.target.value); muatBuku(e.target.value); }}
              className={kolom + " sm:w-72"}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#5e6b45] text-white">
                <tr>
                  <th className="px-3 py-2">Judul</th>
                  <th className="px-3 py-2">ISBN</th>
                  <th className="px-3 py-2">Pengarang</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Stok (tersedia/total)</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 text-[#4a4a3f]">
                {buku.map((b) => (
                  <tr key={b.id} className="border-t border-[#a9ae88]/40">
                    <td className="px-3 py-2 font-semibold text-[#2f3b22]">{b.judul}</td>
                    <td className="px-3 py-2">{b.isbn}</td>
                    <td className="px-3 py-2">{b.pengarang}</td>
                    <td className="px-3 py-2">{b.kategori}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          b.stok_tersedia > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {b.stok_tersedia} / {b.stok_total}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        onClick={() => mulaiEdit(b)}
                        className="mr-2 rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white hover:bg-[#8f9570]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => hapus(b.id)}
                        className="rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500 hover:text-white"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {buku.length === 0 && (
              <p className="p-6 text-center text-[#4a4a3f]/70">Buku tidak ditemukan.</p>
            )}
          </div>
        </section>
      </main>
    </Latar>
  );
}