import { NextResponse } from "next/server";
import pool from "@/lib/db";

const KELOMPOK = ["Fiksi", "Non-Fiksi"];

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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
      "UPDATE categories SET nama = $1, kode = $2, kelompok = $3, deskripsi = $4 WHERE id = $5",
      [nama, kode, kelompok, deskripsi, id]
    );
    return NextResponse.json({ message: "Kategori diperbarui" });
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

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cek = await pool.query(
      "SELECT COUNT(*)::int AS total FROM books WHERE category_id = $1",
      [id]
    );
    if (cek.rows[0].total > 0) {
      return NextResponse.json(
        { message: "Tidak bisa dihapus, masih ada buku di kategori ini" },
        { status: 409 }
      );
    }
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    return NextResponse.json({ message: "Kategori dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}