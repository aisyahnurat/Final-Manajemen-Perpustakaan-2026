import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pesanKembar } from "@/lib/pesanKategori";
import { validasiKategori } from "@/lib/validasiKategori";
import cekAdmin from "@/lib/cekAdmin";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    const result = await pool.query(
      "UPDATE categories SET nama = $1, kode = $2, kelompok = $3, deskripsi = $4 WHERE id = $5",
      [nama, kode, k.kelompok, deskripsi, id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({
      message: `Kategori "${nama}" (${k.kelompok}, kode ${kode}) berhasil diperbarui`,
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

    const adminId = new URL(request.url).searchParams.get("admin_id");
    if (!(await cekAdmin(adminId))) {
      return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
    }

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