"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [buka, setBuka] = useState(false); // menu HP terbuka atau tidak

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const menu = [
    { href: "/", label: "Beranda" },
    { href: "/katalog", label: "Katalog Buku" },
    { href: "/pengumuman", label: "Pengumuman" },
  ];

  // halaman aktif: "/" harus persis sama, yang lain cukup diawali
  const aktif = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const tombol = "rounded-full bg-[#5e6b45] text-white font-semibold px-5 py-2 hover:bg-[#4a5636]";

  return (
    <header className="bg-[#fff0c5]/50 rounded-full backdrop-blur-md backdrop-brightness-100 sticky top-3 z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5e6b45] text-xl">
            📚
          </span>
          <span className="leading-tight">
            <span className="block text-xl font-bold text-[#2f3b22]">PIKUN</span>
            <span className="hidden sm:block text-[11px] text-[#4a4a3f]/70">Baca. Pinjam. Berkembang.</span>
          </span>
        </Link>

        {/* Menu tengah (layar lebar) */}
        <div className="hidden md:flex items-center gap-8">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`border-b-2 py-1 font-medium transition ${
                aktif(m.href)
                  ? "border-[#5e6b45] text-[#5e6b45]"
                  : "border-transparent text-[#4a4a3f] hover:text-[#5e6b45]"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>

        {/* Kanan (layar lebar) */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link href={`/${user.role}`} className={tombol}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="font-medium text-[#4a4a3f] hover:text-[#5e6b45]">Login</Link>
              <Link href="/register" className={tombol}>Register</Link>
            </>
          )}
        </div>

        {/* Tombol menu HP */}
        <button
          type="button"
          onClick={() => setBuka(!buka)}
          aria-label="Menu"
          className="md:hidden text-3xl leading-none text-[#5e6b45]"
        >
          {buka ? "✕" : "☰"}
        </button>
      </nav>

      {/* Menu HP */}
      {buka && (
        <div className="md:hidden flex flex-col gap-3 px-4 pb-4">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setBuka(false)}
              className={aktif(m.href) ? "font-semibold text-[#5e6b45]" : "text-[#4a4a3f]"}
            >
              {m.label}
            </Link>
          ))}
          {user ? (
            <Link href={`/${user.role}`} className={tombol + " text-center"}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-[#4a4a3f]">Login</Link>
              <Link href="/register" className={tombol + " text-center"}>Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}