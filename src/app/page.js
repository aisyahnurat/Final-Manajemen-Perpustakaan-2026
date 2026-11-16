"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [populer, setPopuler] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/books/populer").then((r) => r.json()).then(setPopuler);
    fetch("/api/announcements?published=1")
      .then((r) => r.json())
      .then((d) => setPengumuman(d.slice(0, 3)));
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Perpustakaan Kampus</h1>

      <p>
        <Link href="/katalog">Katalog Buku</Link>{" | "}
        <Link href="/pengumuman">Pengumuman</Link>{" | "}
        {user ? (
          <Link href={`/${user.role}`}>Dashboard</Link>
        ) : (
          <>
            <Link href="/login">Login</Link>{" | "}
            <Link href="/register">Register</Link>
          </>
        )}
      </p>

      {/* form GET biasa: mengirim ke /katalog?q=kata */}
      <form action="/katalog">
        <input name="q" placeholder="Cari judul atau pengarang" />{" "}
        <button type="submit">Cari</button>
      </form>

      <h2>Pengumuman Terbaru</h2>
      {pengumuman.length === 0 && <p>Belum ada pengumuman.</p>}
      {pengumuman.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8 }}>
          <small>{p.kategori} - {p.tanggal_rilis}</small>
          <h3><Link href={`/pengumuman/${p.id}`}>{p.judul}</Link></h3>
        </div>
      ))}

      <h2>5 Buku Terpopuler</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {populer.map((b, i) => (
          <Link key={b.id} href={`/katalog/${b.id}`}
            style={{ width: 170, border: "1px solid #ccc", padding: 10 }}>
            {b.cover_url ? (
              <img src={b.cover_url} alt={b.judul}
                style={{ width: "100%", height: 200, objectFit: "cover" }} />
            ) : (
              <div style={{ height: 200, background: "#eee" }}>Tanpa sampul</div>
            )}
            <strong>#{i + 1}</strong>
            <h4>{b.judul}</h4>
            <p>{b.pengarang}</p>
            <small>Dipinjam {b.jumlah_pinjam}x</small>
          </Link>
        ))}
      </div>
    </main>
  );
}