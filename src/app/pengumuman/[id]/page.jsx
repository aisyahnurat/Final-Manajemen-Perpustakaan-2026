"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function DetailPengumumanPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    fetch(`/api/announcements/${id}`).then(async (res) => {
      const json = await res.json();
      if (!res.ok) setGalat(json.message);
      else setData(json);
    });
  }, [id]);

  if (galat) return <p>{galat}</p>;
  if (!data) return <p>Memuat...</p>;

  return (
    <main style={{ maxWidth: 700, margin: "40px auto" }}>
      <p><Link href="/">← Kembali ke beranda</Link></p>
      <small>{data.kategori} - {data.tanggal_rilis}</small>
      <h1>{data.judul}</h1>
      <p style={{ whiteSpace: "pre-line" }}>{data.konten}</p>
    </main>
  );
}