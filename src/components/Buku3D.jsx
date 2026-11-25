"use client";
import { useState } from "react";

// Sampul buku bergaya 3D (murni CSS): punggung, tepi halaman, dan bayangan.
// Klik buku untuk membaliknya. Sisi belakang dibuat dari data buku
// (sinopsis, pengarang, penerbit, ISBN), jadi tidak butuh gambar tambahan.
const WARNA = ["#5D9253", "#827148", "#8a6a6a", "#4f6b8a", "#a9774a", "#6b5b95", "#3f7f7a", "#b0694b"];

export default function Buku3D({ buku }) {
  const [terbalik, setTerbalik] = useState(false);
  const warna = WARNA[buku.id % WARNA.length];

  return (
    <div className="mx-auto w-44 py-4 md:w-full md:max-w-[260px]">
      <button
        type="button"
        onClick={() => setTerbalik(!terbalik)}
        aria-label={terbalik ? "Lihat sampul depan" : "Lihat sampul belakang"}
        className="block w-full cursor-pointer [perspective:1200px]"
      >
        <div
          className={`relative aspect-[2/3] transition-transform duration-700 ease-out motion-reduce:transition-none [transform-style:preserve-3d] ${
            terbalik
              ? "[transform:rotateY(202deg)]"
              : "[transform:rotateY(22deg)] hover:[transform:rotateY(6deg)]"
          }`}
        >
          {/* sampul belakang (dibalik 180 derajat, diletakkan di belakang) */}
          <div
            className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-l-md rounded-r-sm p-4 text-left text-[#fff0c5] [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(14px)]"
            style={{ backgroundColor: "#243019" }}
          >
            <div>
              <p className="line-clamp-2 text-xs font-bold leading-tight [overflow-wrap:anywhere]">{buku.judul}</p>
              <p className="mt-2 line-clamp-[8] text-[10px] leading-snug [overflow-wrap:anywhere] text-[#fff0c5]/85 md:text-[11px]">
                {buku.sinopsis || "Belum ada sinopsis untuk buku ini."}
              </p>
            </div>
            <div>
              <p className="truncate text-[10px] [overflow-wrap:anywhere] font-semibold">{buku.pengarang}</p>
              <p className="mb-2 truncate text-[10px] [overflow-wrap:anywhere] opacity-70">{buku.penerbit}</p>
              <div className="rounded-sm bg-white px-2 py-1">
                <div
                  className="h-6"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg,#000 0 1px,#fff 1px 3px,#000 3px 4px,#fff 4px 5px,#000 5px 8px,#fff 8px 9px)",
                  }}
                />
                <p className="mt-0.5 text-center text-[9px] tracking-wider text-black">{buku.isbn}</p>
              </div>
            </div>
          </div>

          {/* punggung buku (kiri) */}
          <div
            className="absolute -left-[14px] top-0 h-full w-[28px] [transform:rotateY(90deg)]"
            style={{ backgroundColor: warna, filter: "brightness(0.55)" }}
          />

          {/* tepi halaman (kanan) */}
          <div
            className="absolute -right-[14px] top-0 h-full w-[28px] [transform:rotateY(90deg)]"
            style={{ background: "repeating-linear-gradient(90deg, #f5ecd7 0 2px, #e4d9bd 2px 3px)" }}
          />

          {/* sampul depan */}
          <div className="absolute inset-0 overflow-hidden rounded-l-sm rounded-r-md [backface-visibility:hidden] [transform:translateZ(14px)]">
            {buku.cover_url ? (
              <img src={buku.cover_url} alt={buku.judul} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full flex-col justify-between p-4 pl-6 text-left text-white"
                style={{ backgroundColor: warna }}
              >
                <span className="line-clamp-4 text-lg font-bold leading-tight [overflow-wrap:anywhere]">{buku.judul}</span>
                <span className="text-sm opacity-90 [overflow-wrap:anywhere]">{buku.pengarang}</span>
              </div>
            )}
            {/* lipatan di sisi punggung */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent" />
          </div>
        </div>
      </button>

      {/* bayangan di bawah buku */}
      <div className="mx-auto mt-5 h-4 w-4/5 rounded-full bg-black/30 blur-md" />
      <p className="mt-3 text-center text-xs text-[#4a4a3f]/70">
        {terbalik ? "Klik untuk melihat sampul depan" : "Klik buku untuk melihat sampul belakang"}
      </p>
    </div>
  );
}
