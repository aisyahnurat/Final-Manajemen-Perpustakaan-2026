import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiPengumuman } from "@/lib/validasiPengumuman";

export async function GET(request, { params }) {
  const { id } = await params;
  const result = await pool.query(
    `SELECT id, judul, konten, kategori,
            to_char(tanggal_rilis, 'YYYY-MM-DD') AS tanggal_rilis
     FROM announcements
     WHERE id = $1 AND status = 'Published'`,
    [id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ message: "Pengumuman tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const p = await request.json();
    const galat = validasiPengumuman(p);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }
    const result = await pool.query(
      `UPDATE announcements
       SET judul = $1, konten = $2, kategori = $3,
           tanggal_rilis = $4, status = $5
       WHERE id = $6`,
      [p.judul, p.konten, p.kategori, p.tanggal_rilis, p.status, id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Pengumuman tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({
      message: `Pengumuman "${p.judul}" berhasil diperbarui (status: ${p.status})`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await pool.query(
      "DELETE FROM announcements WHERE id = $1 RETURNING judul",
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Pengumuman tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({
      message: `Pengumuman "${result.rows[0].judul}" berhasil dihapus`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}