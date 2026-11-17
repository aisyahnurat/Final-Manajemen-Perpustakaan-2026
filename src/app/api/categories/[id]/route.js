import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pesanKembar } from "@/lib/pesanKategori";

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
    const result = await pool.query(
      "UPDATE categories SET nama = $1, kode = $2, kelompok = $3, deskripsi = $4 WHERE id = $5",
      [nama, kode, kelompok, deskripsi, id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({
      message: `Kategori "${nama}" (${kelompok}, kode ${kode}) berhasil diperbarui`,
    });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: pesanKembar(error) }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const kat = await pool.query("SELECT nama FROM categories WHERE id = $1", [id]);
    if (kat.rows.length === 0) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }
    const nama = kat.rows[0].nama;

    const cek = await pool.query(
      "SELECT COUNT(*)::int AS total FROM books WHERE category_id = $1",
      [id]
    );
    if (cek.rows[0].total > 0) {
      return NextResponse.json(
        { message: `Kategori "${nama}" tidak bisa dihapus, masih ada ${cek.rows[0].total} buku di dalamnya` },
        { status: 409 }
      );
    }

    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    return NextResponse.json({ message: `Kategori "${nama}" berhasil dihapus` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}