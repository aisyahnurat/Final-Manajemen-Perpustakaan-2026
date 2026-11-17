"use client";
import { useState, useEffect } from "react";
import useAuth from "@/lib/useAuth";

const kosong = {
  judul: "", isbn: "", pengarang: "", penerbit: "", tahun_terbit: "",
  category_id: "", stok_total: "", durasi_maks_pinjam: "",
  denda_per_hari: "", cover_url: "",
};

export default function BukuPage() {
  const { user } = useAuth(["pegawai", "admin"]);
  const [buku, setBuku] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");

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
    });
  }

  async function hapus(id) {
    if (!confirm("Hapus buku ini?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) muatBuku(cari);
  }

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>Kelola Buku</h1>

      <form onSubmit={handleSubmit}>
        <input name="judul" placeholder="Judul" value={form.judul} onChange={ubah} required />{" "}
        <input name="isbn" placeholder="ISBN" value={form.isbn} onChange={ubah}
          required disabled={editId !== null} />{" "}
        <input name="pengarang" placeholder="Pengarang" value={form.pengarang} onChange={ubah} required />{" "}
        <input name="penerbit" placeholder="Penerbit" value={form.penerbit} onChange={ubah} required />
        <br /><br />
        <input name="tahun_terbit" type="number" placeholder="Tahun terbit"
          value={form.tahun_terbit} onChange={ubah} required />{" "}
        <select name="category_id" value={form.category_id} onChange={ubah} required>
          <option value="">-- Pilih kategori --</option>
          {["Fiksi", "Non-Fiksi"].map((g) => (
            <optgroup key={g} label={g}>
              {kategori.filter((k) => k.kelompok === g).map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </optgroup>
          ))}
        </select>{" "}
        <input name="stok_total" type="number" min="0" placeholder="Stok"
          value={form.stok_total} onChange={ubah} required />{" "}
        <input name="durasi_maks_pinjam" type="number" min="1" placeholder="Maks pinjam (hari)"
          value={form.durasi_maks_pinjam} onChange={ubah} required />{" "}
        <input name="denda_per_hari" type="number" min="0" placeholder="Denda/hari"
          value={form.denda_per_hari} onChange={ubah} required />
        <br /><br />
        <input name="cover_url" placeholder="Link gambar sampul (opsional)"
          value={form.cover_url} onChange={ubah} style={{ width: 400 }} />{" "}
        <button type="submit">{editId ? "Simpan" : "Tambah Buku"}</button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setForm(kosong); }}>
            Batal
          </button>
        )}
      </form>

      {pesan && <p>{pesan}</p>}

      <hr />
      <input placeholder="Cari judul / pengarang"
        value={cari}
        onChange={(e) => { setCari(e.target.value); muatBuku(e.target.value); }} />

      <table border="1" cellPadding="6" style={{ marginTop: 20, width: "100%" }}>
        <thead>
          <tr>
            <th>Judul</th><th>ISBN</th><th>Pengarang</th><th>Kategori</th>
            <th>Stok (tersedia/total)</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {buku.map((b) => (
            <tr key={b.id}>
              <td>{b.judul}</td>
              <td>{b.isbn}</td>
              <td>{b.pengarang}</td>
              <td>{b.kategori}</td>
              <td>{b.stok_tersedia} / {b.stok_total}</td>
              <td>
                <button onClick={() => mulaiEdit(b)}>Edit</button>{" "}
                <button onClick={() => hapus(b.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}