import { validasiPengumuman } from "@/lib/validasiPengumuman";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  const hanyaPublished =
    new URL(request.url).searchParams.get("published") === "1";

  const result = await pool.query(
    `SELECT id, judul, konten, kategori, status,
            to_char(tanggal_rilis, 'YYYY-MM-DD') AS tanggal_rilis
     FROM announcements
     WHERE ($1::boolean = false OR status = 'Published')
     ORDER BY tanggal_rilis DESC, id DESC`,
    [hanyaPublished]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  try {
    const p = await request.json();
    const galat = validasiPengumuman(p);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }
    await pool.query(
      `INSERT INTO announcements
        (judul, konten, kategori, tanggal_rilis, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [p.judul, p.konten, p.kategori, p.tanggal_rilis, p.status, p.created_by || null]
    );
    return NextResponse.json({ message: "Pengumuman ditambahkan" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}