import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pesanKembar } from "@/lib/pesanKategori";

const KELOMPOK = ["Fiksi", "Non-Fiksi"];

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
    const { nama, kode, kelompok, deskripsi } = await request.json();
    if (!nama || !kode) {
      return NextResponse.json(
        { message: "Nama dan kode kategori wajib diisi" },
        { status: 400 }
      );
    }
    if (!KELOMPOK.includes(kelompok)) {
      return NextResponse.json(
        { message: "Kelompok harus Fiksi atau Non-Fiksi" },
        { status: 400 }
      );
    }
    await pool.query(
      "INSERT INTO categories (nama, kode, kelompok, deskripsi) VALUES ($1, $2, $3, $4)",
      [nama, kode, kelompok, deskripsi]
    );
    return NextResponse.json(
      { message: `Kategori "${nama}" (${kelompok}, kode ${kode}) berhasil ditambahkan` },
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