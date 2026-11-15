"use client";
import { useState, useEffect } from "react";
import useAuth from "@/lib/useAuth";

const kosong = {
  judul: "", konten: "", kategori: "Operasional",
  tanggal_rilis: "", status: "Draft",
};

export default function PengumumanPage() {
  const { user } = useAuth(["pegawai", "admin"]);
  const [daftar, setDaftar] = useState([]);
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState("");

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
  }

  async function hapus(id) {
    if (!confirm("Hapus pengumuman ini?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) muatData();
  }

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Kelola Pengumuman</h1>

      <form onSubmit={handleSubmit}>
        <input name="judul" placeholder="Judul" value={form.judul}
          onChange={ubah} required style={{ width: 400 }} />
        <br /><br />
        <textarea name="konten" placeholder="Isi pengumuman" value={form.konten}
          onChange={ubah} required rows={4} style={{ width: 400 }} />
        <br /><br />
        <select name="kategori" value={form.kategori} onChange={ubah}>
          <option>Operasional</option>
          <option>Layanan</option>
          <option>Acara</option>
        </select>{" "}
        <input name="tanggal_rilis" type="date" value={form.tanggal_rilis}
          onChange={ubah} required />{" "}
        <select name="status" value={form.status} onChange={ubah}>
          <option>Draft</option>
          <option>Published</option>
        </select>{" "}
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
          <tr><th>Judul</th><th>Kategori</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {daftar.map((p) => (
            <tr key={p.id}>
              <td>{p.judul}</td>
              <td>{p.kategori}</td>
              <td>{p.tanggal_rilis}</td>
              <td>{p.status}</td>
              <td>
                <button onClick={() => mulaiEdit(p)}>Edit</button>{" "}
                <button onClick={() => hapus(p.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}