"use client";
import { useState, useEffect } from "react";
import useAuth from "@/lib/useAuth";

const kosong = { nama: "", kode: "", deskripsi: "", kelompok: "Fiksi", deskripsi: "" };

export default function KategoriPage() {
  const { user } = useAuth("admin");
  const [daftar, setDaftar] = useState([]);
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState("");

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
      body: JSON.stringify(form),
    });
    const data = await res.json();
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
  }

  async function hapus(id) {
    if (!confirm("Hapus kategori ini?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) muatData();
  }

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Kelola Kategori</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Nama kategori" value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })} required />{" "}
        <input placeholder="Kode" value={form.kode}
          onChange={(e) => setForm({ ...form, kode: e.target.value })} required />{" "}
        <select value={form.kelompok}
          onChange={(e) => setForm({ ...form, kelompok: e.target.value })}>
          <option value="Fiksi">Fiksi</option>
          <option value="Non-Fiksi">Non-Fiksi</option>
        </select>{" "}
        <input placeholder="Deskripsi" value={form.deskripsi}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />{" "}
        <button type="submit">{editId ? "Simpan" : "Tambah"}</button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setForm(kosong); }}>
            Batal
          </button>
        )}
      </form>

      {pesan && <p>{pesan}</p>}

      <table border="1" cellPadding="6" style={{ marginTop: 20, width: "100%" }}>
        <thead>
          <tr><th>Kode</th><th>Kelompok</th><th>Nama</th><th>Deskripsi</th><th>Jml Buku</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {daftar.map((k) => (
            <tr key={k.id}>
              <td>{k.kode}</td>
              <td>{k.kelompok}</td>
              <td>{k.nama}</td>
              <td>{k.deskripsi}</td>
              <td>{k.jumlah_buku}</td>
              <td>
                <button onClick={() => mulaiEdit(k)}>Edit</button>{" "}
                <button onClick={() => hapus(k.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}