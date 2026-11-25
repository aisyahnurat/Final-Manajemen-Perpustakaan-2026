"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Latar from "@/components/Latar";

// warna label tiap kategori
const WARNA = {
  Operasional: "#a9ae88",
  Layanan: "#827148",
  Acara: "#5D9253",
};

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

  if (galat || !data) {
    return (
      <Latar>
        <Navbar />
        <p className="mx-auto max-w-3xl px-4 py-16 text-center text-[#2f3b22]">
          {galat || "Memuat..."}
        </p>
      </Latar>
    );
  }

  return (
    <Latar>
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Link href="/pengumuman" className="inline-block text-sm font-semibold text-[#2f3b22] hover:underline">
          ← Kembali ke pengumuman
        </Link>

        <article className="rounded-3xl bg-white/70 p-6 shadow backdrop-blur md:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: WARNA[data.kategori] || "#a9ae88" }}
            >
              {data.kategori}
            </span>
            <span className="text-sm text-[#4a4a3f]/70">{data.tanggal_rilis}</span>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-[#2f3b22] [overflow-wrap:anywhere] md:text-4xl">{data.judul}</h1>

          <p className="mt-6 whitespace-pre-line [overflow-wrap:anywhere] leading-relaxed text-[#4a4a3f]">
            {data.konten}
          </p>
        </article>
      </main>
    </Latar>
  );
}