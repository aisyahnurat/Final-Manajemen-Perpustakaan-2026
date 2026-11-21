"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

const kosong = {
  nama_lengkap: "", email: "", nomor_identitas: "",
  password: "", role: "mahasiswa", is_active: true,
};

const kolom =
  "w-full rounded-xl border border-[#a9ae88] bg-white px-3 py-2 text-sm text-[#4a4a3f] outline-none focus:ring-2 focus:ring-[#5e6b45]";

// warna label tiap role
const WARNA_ROLE = {
  admin: "#827148",
  pegawai: "#5D9253",
  mahasiswa: "#a9ae88",
};

// petunjuk isian nomor identitas menurut role
const PLACEHOLDER = {
  mahasiswa: "NIM (contoh: H071231001)",
  admin: "NIP (contoh: ADM002)",
  pegawai: "NIP (contoh: PGW002)",
};

export default function UsersPage() {
  const { user } = useAuth("admin");
  const [daftar, setDaftar] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);

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
    setBerhasil(res.ok);
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
    window.scrollTo({ top: 0, behavior: "smooth" }); // naik ke form
  }

  async function hapus(id) {
    if (!confirm("Hapus pengguna ini?")) return;
    const res = await fetch(`/api/users/${id}?admin_id=${user.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setBerhasil(res.ok);
    setPesan(data.message);
    if (res.ok) muat();
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
          <Link href="/admin" className="text-sm font-semibold text-[#2f3b22] hover:underline">
            ← Kembali ke dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-[#2f3b22]">Kelola Pengguna</h1>
        </div>

        {/* Form tambah / ubah */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <h2 className="mb-4 text-lg font-bold text-[#2f3b22]">
            {editId ? "Ubah Pengguna" : "Tambah Pengguna"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Nama lengkap</span>
              <input name="nama_lengkap" value={form.nama_lengkap} onChange={ubah} required className={kolom} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Email</span>
              <input name="email" type="email" value={form.email} onChange={ubah} required className={kolom} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Role</span>
              <select name="role" value={form.role} onChange={ubah} className={kolom}>
                <option value="admin">admin</option>
                <option value="pegawai">pegawai</option>
                <option value="mahasiswa">mahasiswa</option>
              </select>
            </label>

            {/* hanya saat menambah pengguna baru */}
            {!editId && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">
                    {form.role === "mahasiswa" ? "NIM" : "NIP"}
                  </span>
                  <input
                    name="nomor_identitas"
                    placeholder={PLACEHOLDER[form.role]}
                    value={form.nomor_identitas}
                    onChange={ubah}
                    required
                    className={kolom}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#2f3b22]">Password</span>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={ubah}
                    required
                    className={kolom}
                  />
                </label>
              </>
            )}

            {/* hanya saat mengubah pengguna */}
            {editId && (
              <label className="flex items-center gap-2 self-end rounded-xl bg-[#fff0c5]/70 px-3 py-2 text-sm font-semibold text-[#2f3b22]">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={ubah}
                  className="h-4 w-4 accent-[#5e6b45]"
                />
                Akun aktif
              </label>
            )}

            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-full bg-[#5e6b45] px-6 py-2 text-sm font-semibold text-white hover:bg-[#4a5636]"
              >
                {editId ? "Simpan" : "Tambah Pengguna"}
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
              className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
                berhasil ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              {pesan}
            </p>
          )}
        </section>

        {/* Daftar pengguna */}
        <section className="rounded-3xl bg-white/70 p-5 shadow backdrop-blur md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#2f3b22]">Daftar Pengguna ({daftar.length})</h2>
            <label className="flex items-center gap-2 text-sm text-[#2f3b22]">
              Filter role
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={kolom + " w-auto"}>
                <option value="">Semua</option>
                <option value="admin">admin</option>
                <option value="pegawai">pegawai</option>
                <option value="mahasiswa">mahasiswa</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#5e6b45] text-white">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">NIM/NIP</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Aktif</th>
                  <th className="px-3 py-2">Terdaftar</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 text-[#4a4a3f]">
                {daftar.map((u) => (
                  <tr key={u.id} className="border-t border-[#a9ae88]/40">
                    <td className="px-3 py-2 font-semibold text-[#2f3b22]">{u.nama_lengkap}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{u.nomor_identitas}</td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: WARNA_ROLE[u.role] || "#a9ae88" }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {u.is_active ? "Ya" : "Tidak"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{u.terdaftar}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        onClick={() => mulaiEdit(u)}
                        className="mr-2 rounded-full bg-[#a9ae88] px-3 py-1 text-xs font-semibold text-white hover:bg-[#8f9570]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => hapus(u.id)}
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
              <p className="p-6 text-center text-[#4a4a3f]/70">Tidak ada pengguna.</p>
            )}
          </div>
        </section>
      </main>
    </Latar>
  );
}