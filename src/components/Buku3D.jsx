// Sampul buku bergaya 3D (murni CSS): punggung, tepi halaman, dan bayangan.
// Miring sedikit, lalu hampir menghadap lurus saat kursor diarahkan.
const WARNA = ["#5D9253", "#827148", "#8a6a6a", "#4f6b8a", "#a9774a", "#6b5b95", "#3f7f7a", "#b0694b"];

export default function Buku3D({ buku }) {
  const warna = WARNA[buku.id % WARNA.length];

  return (
    <div className="mx-auto w-44 py-4 md:w-full md:max-w-[260px]">
      <div className="[perspective:1200px]">
        <div className="relative aspect-[2/3] transition-transform duration-500 ease-out motion-reduce:transition-none [transform-style:preserve-3d] [transform:rotateY(22deg)] hover:[transform:rotateY(6deg)]">
          {/* sisi belakang */}
          <div className="absolute inset-0 rounded-md bg-[#1f2815] [transform:translateZ(-14px)]" />

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
          <div className="absolute inset-0 overflow-hidden rounded-l-sm rounded-r-md [transform:translateZ(14px)]">
            {buku.cover_url ? (
              <img src={buku.cover_url} alt={buku.judul} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full flex-col justify-between p-4 pl-6 text-white"
                style={{ backgroundColor: warna }}
              >
                <span className="line-clamp-4 text-lg font-bold leading-tight">{buku.judul}</span>
                <span className="text-sm opacity-90">{buku.pengarang}</span>
              </div>
            )}
            {/* lipatan di sisi punggung */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* bayangan di bawah buku */}
      <div className="mx-auto mt-5 h-4 w-4/5 rounded-full bg-black/30 blur-md" />
    </div>
  );
}
