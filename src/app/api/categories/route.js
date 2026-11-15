import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const result = await pool.query(
    `SELECT c.id, c.nama, c.kode, c.deskripsi, COUNT(b.id)::int AS jumlah_buku
     FROM categories c
     LEFT JOIN books b ON b.category_id = c.id
     GROUP BY c.id
     ORDER BY c.nama`
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  try {
    const { nama, kode, deskripsi } = await request.json();
    if (!nama || !kode) {
      return NextResponse.json(
        { message: "Nama dan kode kategori wajib diisi" },
        { status: 400 }
      );
    }
    await pool.query(
      "INSERT INTO categories (nama, kode, deskripsi) VALUES ($1, $2, $3)",
      [nama, kode, deskripsi]
    );
    return NextResponse.json({ message: "Kategori ditambahkan" }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Nama atau kode kategori sudah dipakai" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}