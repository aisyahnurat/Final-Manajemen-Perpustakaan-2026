import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pesanKembar } from "@/lib/pesanKategori";
import { validasiKategori } from "@/lib/validasiKategori";
import cekAdmin from "@/lib/cekAdmin";

export async function GET() {
  const result = await pool.query(
    `SELECT c.id, c.nama, c.kode, c.kelompok, c.deskripsi,
            COUNT(b.id)::int AS jumlah_buku
     FROM categories c
     LEFT JOIN books b ON b.category_id = c.id
     GROUP BY c.id
     ORDER BY c.kelompok, c.nama`
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  try {
    const k = await request.json();
    
    if (!(await cekAdmin(k.admin_id))) {
      return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
    }

    const galat = validasiKategori(k);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }

    const nama = String(k.nama).trim();
    const kode = String(k.kode).trim().toUpperCase();
    const deskripsi = String(k.deskripsi || "").trim() || null;

    await pool.query(
      "INSERT INTO categories (nama, kode, kelompok, deskripsi) VALUES ($1, $2, $3, $4)",
      [nama, kode, k.kelompok, deskripsi]
    );
    return NextResponse.json(
      { message: `Kategori "${nama}" (${k.kelompok}, kode ${kode}) berhasil ditambahkan` },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: pesanKembar(error) }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}