"use client";
import { useState, useEffect } from "react";
import useAuth from "@/lib/useAuth";

const kosong = {
  nama_lengkap: "", email: "", nomor_identitas: "",
  password: "", role: "mahasiswa", is_active: true,
};

export default function UsersPage() {
  const { user } = useAuth("admin");
  const [daftar, setDaftar] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState("");

  async function muat() {
    const res = await fetch(`/api/users?admin_id=${user.id}&role=${filter}`);
    setDaftar(await res.json());
  }

  useEffect(() => {
    if (user) muat();
  }, [user, filter]);

  function ubah(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editId ? `/api/users/${editId}` : "/api/users";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, admin_id: user.id }),
    });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) {
      setForm(kosong);
      setEditId(null);
      muat();
    }
  }

  function mulaiEdit(u) {
    setEditId(u.id);
    setForm({
      nama_lengkap: u.nama_lengkap, email: u.email,
      nomor_identitas: u.nomor_identitas, password: "",
      role: u.role, is_active: u.is_active,
    });
  }

  async function hapus(id) {
    if (!confirm("Hapus pengguna ini?")) return;
    const res = await fetch(`/api/users/${id}?admin_id=${user.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setPesan(data.message);
    if (res.ok) muat();
  }

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Kelola Pengguna</h1>

      <form onSubmit={handleSubmit}>
        <input name="nama_lengkap" placeholder="Nama lengkap" value={form.nama_lengkap}
          onChange={ubah} required />{" "}
        <input name="email" type="email" placeholder="Email" value={form.email}
          onChange={ubah} required />{" "}
        {!editId && (
          <>
            <input name="nomor_identitas" placeholder="NIM / NIP"
              value={form.nomor_identitas} onChange={ubah} required />{" "}
            <input name="password" type="password" placeholder="Password"
              value={form.password} onChange={ubah} required />{" "}
          </>
        )}
        <select name="role" value={form.role} onChange={ubah}>
          <option value="admin">admin</option>
          <option value="pegawai">pegawai</option>
          <option value="mahasiswa">mahasiswa</option>
        </select>{" "}
        {editId && (
          <label>
            <input name="is_active" type="checkbox" checked={form.is_active}
              onChange={ubah} /> Aktif{" "}
          </label>
        )}
        <button type="submit">{editId ? "Simpan" : "Tambah Pengguna"}</button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setForm(kosong); }}>
            Batal
          </button>
        )}
      </form>

      {pesan && <p><strong>{pesan}</strong></p>}

      <p style={{ marginTop: 20 }}>
        Filter role:{" "}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Semua</option>
          <option value="admin">admin</option>
          <option value="pegawai">pegawai</option>
          <option value="mahasiswa">mahasiswa</option>
        </select>
      </p>

      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Nama</th><th>Email</th><th>NIM/NIP</th><th>Role</th>
            <th>Aktif</th><th>Terdaftar</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((u) => (
            <tr key={u.id}>
              <td>{u.nama_lengkap}</td>
              <td>{u.email}</td>
              <td>{u.nomor_identitas}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? "Ya" : "Tidak"}</td>
              <td>{u.terdaftar}</td>
              <td>
                <button onClick={() => mulaiEdit(u)}>Edit</button>{" "}
                <button onClick={() => hapus(u.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}