import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiBuku } from "@/lib/validasiBuku";

export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const result = await pool.query(
    `SELECT b.*, c.nama AS kategori
     FROM books b
     JOIN categories c ON c.id = b.category_id
     WHERE b.judul ILIKE $1 OR b.pengarang ILIKE $1
     ORDER BY b.id DESC`,
    [`%${q}%`]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  try {
    const b = await request.json();
    const galat = validasiBuku(b);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO books
        (judul, isbn, pengarang, penerbit, tahun_terbit, category_id,
         stok_total, stok_tersedia, durasi_maks_pinjam, denda_per_hari, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10)`,
      [b.judul, b.isbn, b.pengarang, b.penerbit, b.tahun_terbit, b.category_id,
       b.stok_total, b.durasi_maks_pinjam, b.denda_per_hari, b.cover_url || null]
    );
    return NextResponse.json({ message: "Buku ditambahkan" }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "ISBN sudah terdaftar" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}