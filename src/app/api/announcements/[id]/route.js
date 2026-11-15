import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiPengumuman } from "@/lib/validasiPengumuman";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const p = await request.json();
    const galat = validasiPengumuman(p);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }
    await pool.query(
      `UPDATE announcements
       SET judul = $1, konten = $2, kategori = $3,
           tanggal_rilis = $4, status = $5
       WHERE id = $6`,
      [p.judul, p.konten, p.kategori, p.tanggal_rilis, p.status, id]
    );
    return NextResponse.json({ message: "Pengumuman diperbarui" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await pool.query("DELETE FROM announcements WHERE id = $1", [id]);
    return NextResponse.json({ message: "Pengumuman dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}