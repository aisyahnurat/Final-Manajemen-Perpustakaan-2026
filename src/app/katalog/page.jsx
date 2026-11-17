"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function KatalogPage() {
  const [buku, setBuku] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("");
  const [urut, setUrut] = useState("terbaru");

  useEffect(() => {
    const awal = new URLSearchParams(window.location.search).get("q");
    if (awal) setQ(awal);
  }, []);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setKategori);
  }, []);

  // dijalankan ulang setiap pencarian, filter, atau urutan berubah
  useEffect(() => {
    const params = new URLSearchParams({ q, kategori: kat, urut });
    fetch(`/api/books?${params}`).then((r) => r.json()).then(setBuku);
  }, [q, kat, urut]);

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Katalog Buku</h1>
      <p><Link href="/login">Login</Link></p>

      <input placeholder="Cari judul / pengarang" value={q}
        onChange={(e) => setQ(e.target.value)} />{" "}
      <select value={kat} onChange={(e) => setKat(e.target.value)}>
        <option value="">Semua kategori</option>
            {["Fiksi", "Non-Fiksi"].map((g) => (
            <optgroup key={g} label={g}>
              {kategori.filter((k) => k.kelompok === g).map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </optgroup>
          ))}
      </select>{" "}
      <select value={urut} onChange={(e) => setUrut(e.target.value)}>
        <option value="terbaru">Terbaru ditambahkan</option>
        <option value="tahun">Tahun terbit terbaru</option>
        <option value="rating">Rating tertinggi</option>
      </select>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
        {buku.map((b) => (
          <Link key={b.id} href={`/katalog/${b.id}`}
            style={{ width: 200, border: "1px solid #ccc", padding: 10 }}>
            {b.cover_url ? (
              <img src={b.cover_url} alt={b.judul}
                style={{ width: "100%", height: 240, objectFit: "cover" }} />
            ) : (
              <div style={{ height: 240, background: "#eee" }}>Tanpa sampul</div>
            )}
            <h3>{b.judul}</h3>
            <p>{b.pengarang}</p>
            <p>{b.kategori}</p>
            <p>Stok: {b.stok_tersedia}</p>
            <p>Rating: {b.rating_rata ?? "belum ada"}</p>
          </Link>
        ))}
      </div>
      {buku.length === 0 && <p>Buku tidak ditemukan.</p>}
    </main>
  );
}