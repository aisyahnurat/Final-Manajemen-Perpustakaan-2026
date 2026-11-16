"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function DaftarPengumumanPage() {
  const [daftar, setDaftar] = useState([]);

  useEffect(() => {
    fetch("/api/announcements?published=1")
      .then((r) => r.json())
      .then(setDaftar);
  }, []);

  return (
    <main style={{ maxWidth: 700, margin: "40px auto" }}>
      <p><Link href="/">← Kembali ke beranda</Link></p>
      <h1>Pengumuman</h1>

      {daftar.length === 0 && <p>Belum ada pengumuman.</p>}
      {daftar.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8 }}>
          <small>{p.kategori} - {p.tanggal_rilis}</small>
          <h3><Link href={`/pengumuman/${p.id}`}>{p.judul}</Link></h3>
        </div>
      ))}
    </main>
  );
}