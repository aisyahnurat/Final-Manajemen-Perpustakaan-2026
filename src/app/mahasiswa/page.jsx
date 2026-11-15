"use client";
import useAuth from "@/lib/useAuth";

export default function MahasiswaPage() {
  const { user, logout } = useAuth("mahasiswa");

  if (!user) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Dashboard Admin</h1>
      <p>Selamat datang, {user.nama_lengkap}!</p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}