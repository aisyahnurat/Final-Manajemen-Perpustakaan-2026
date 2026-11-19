"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// warna sampul untuk buku yang belum punya gambar
const WARNA = ["#5D9253", "#827148", "#8a6a6a", "#4f6b8a", "#a9774a", "#6b5b95", "#3f7f7a", "#b0694b"];

// berapa buku per rak, tergantung lebar layar
function hitungPerRak() {
  const w = window.innerWidth;
  if (w < 640) return 3;
  if (w < 1024) return 4;
  return 6;
}

export default function RakBuku({ buku, urutan = false }) {
  const [perRak, setPerRak] = useState(6);

  useEffect(() => {
    const atur = () => setPerRak(hitungPerRak());
    atur();
    window.addEventListener("resize", atur);
    return () => window.removeEventListener("resize", atur);
  }, []);

  // potong daftar buku menjadi beberapa rak
  const rak = [];
  for (let i = 0; i < buku.length; i += perRak) {
    rak.push(buku.slice(i, i + perRak));
  }

  return (
    <div className="space-y-8 rounded-3xl bg-[#fff0c5]/50 p-4 md:p-8 shadow-inner">
      {rak.map((isi, r) => (
        <div key={r}>
          {/* deretan buku */}
          <div
            className="grid items-end gap-3 px-1 md:gap-5"
            style={{ gridTemplateColumns: `repeat(${perRak}, minmax(0, 1fr))` }}
          >
            {isi.map((b, i) => (
              <Link key={b.id} href={`/katalog/${b.id}`} title={b.judul} className="group block">
                <div className="relative aspect-[2/3] overflow-hidden rounded-l-sm rounded-r-md shadow-[2px_4px_8px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:-translate-y-2">
                  {b.cover_url ? (
                    <img src={b.cover_url} alt={b.judul} className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full flex-col justify-between p-2 pl-3 text-white"
                      style={{ backgroundColor: WARNA[b.id % WARNA.length] }}
                    >
                      <span className="line-clamp-4 text-[10px] font-bold leading-tight md:text-xs">{b.judul}</span>
                      <span className="line-clamp-2 text-[9px] opacity-90 md:text-[11px]">{b.pengarang}</span>
                    </div>
                  )}
                  {/* punggung buku */}
                  <span className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
                  {/* nomor peringkat */}
                  {urutan && (
                    <span className="absolute right-1 top-1 rounded-full bg-[#fff0c5] px-2 py-0.5 text-xs font-bold text-[#5e6b45]">
                      #{r * perRak + i + 1}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* papan rak kayu */}
          <div className="h-4 rounded-sm bg-gradient-to-b from-[#e8c98f] to-[#b9884a] shadow-lg" />
        </div>
      ))}
    </div>
  );
}