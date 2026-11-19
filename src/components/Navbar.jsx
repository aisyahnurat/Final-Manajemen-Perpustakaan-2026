"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [buka, setBuka] = useState(false); // menu HP terbuka atau tidak

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const tautan = "text-[#4a4a3f] font-medium hover:text-[#5e6b45] hover:underline";
  const tombol = "rounded-full bg-[#5e6b45] text-white font-semibold px-5 py-2 hover:bg-[#4a5636]";

  return (
    <header className="sticky top-0 z-20 bg-[#fff1d6] shadow">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-bold text-[#5e6b45]">
          PIKUN
        </Link>

        {/* Menu layar lebar */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/katalog" className={tautan}>Katalog Buku</Link>
          <Link href="/pengumuman" className={tautan}>Pengumuman</Link>
          {user ? (
            <Link href={`/${user.role}`} className={tombol}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className={tautan}>Login</Link>
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
          <Link href="/katalog" className={tautan}>Katalog Buku</Link>
          <Link href="/pengumuman" className={tautan}>Pengumuman</Link>
          {user ? (
            <Link href={`/${user.role}`} className={tombol + " text-center"}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className={tautan}>Login</Link>
              <Link href="/register" className={tombol + " text-center"}>Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}