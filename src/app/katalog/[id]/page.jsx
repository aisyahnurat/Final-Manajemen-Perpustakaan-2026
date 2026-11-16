"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function DetailBukuPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) setGalat(json.message);
        else setData(json);
      });
  }, [id]);

    const [user, setUser] = useState(null);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  async function ajukan() {
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, book_id: buku.id }),
    });
    const json = await res.json();
    setPesan(json.message);
  }

  if (galat) return <p>{galat}</p>;
  if (!data) return <p>Memuat...</p>;

  const { buku, ulasan } = data;

  return (
    <main style={{ maxWidth: 800, margin: "40px auto" }}>
      <p><Link href="/katalog">← Kembali ke katalog</Link></p>

      <div style={{ display: "flex", gap: 24 }}>
        {buku.cover_url ? (
          <img src={buku.cover_url} alt={buku.judul} style={{ width: 200 }} />
        ) : (
          <div style={{ width: 200, height: 280, background: "#eee" }}>Tanpa sampul</div>
        )}
        <div>
          <h1>{buku.judul}</h1>
          <p>ISBN: {buku.isbn}</p>
          <p>Pengarang: {buku.pengarang}</p>
          <p>Penerbit: {buku.penerbit} ({buku.tahun_terbit})</p>
          <p>Kategori: {buku.kategori}</p>
          <p>Stok tersedia: {buku.stok_tersedia} dari {buku.stok_total}</p>
          <p>Maksimal pinjam: {buku.durasi_maks_pinjam} hari</p>
          <p>Denda: Rp {buku.denda_per_hari.toLocaleString("id-ID")} / hari</p>
          <p>Rating rata-rata: {buku.rating_rata ?? "belum ada"}</p>
          {!user && (
            <p><Link href="/login">Login sebagai mahasiswa untuk meminjam</Link></p>
          )}
          {user?.role === "mahasiswa" && (
            <button onClick={ajukan} disabled={buku.stok_tersedia <= 0}>
              Ajukan Pinjam
            </button>
          )}
          {pesan && <p>{pesan}</p>}
        </div>
      </div>

      <h2>Ulasan</h2>
      {ulasan.length === 0 && <p>Belum ada ulasan.</p>}
      {ulasan.map((u, i) => (
        <div key={i} style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}>
          <strong>{u.nama_lengkap}</strong> - {u.rating}/5 ({u.tanggal})
          <p>{u.komentar}</p>
        </div>
      ))}
    </main>
  );
}