import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiBuku } from "@/lib/validasiBuku";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const b = await request.json();
    const galat = validasiBuku(b);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }

    // stok_tersedia ikut disesuaikan dengan selisih stok_total yang baru
    await pool.query(
      `UPDATE books SET
         judul = $1, pengarang = $2, penerbit = $3, tahun_terbit = $4,
         category_id = $5,
         stok_tersedia = stok_tersedia + ($6::int - stok_total),
         stok_total = $6::int,
         durasi_maks_pinjam = $7, denda_per_hari = $8, cover_url = $9
       WHERE id = $10`,
      [b.judul, b.pengarang, b.penerbit, b.tahun_terbit, b.category_id,
       b.stok_total, b.durasi_maks_pinjam, b.denda_per_hari,
       b.cover_url || null, id]
    );
    return NextResponse.json({ message: "Buku diperbarui" });
  } catch (error) {
    if (error.code === "23514") {
      return NextResponse.json(
        { message: "Stok total tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam" },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const aktif = await pool.query(
      `SELECT COUNT(*)::int AS total FROM loans
       WHERE book_id = $1
         AND status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam')`,
      [id]
    );
    if (aktif.rows[0].total > 0) {
      return NextResponse.json(
        { message: "Buku sedang dipinjam atau diajukan, tidak bisa dihapus" },
        { status: 409 }
      );
    }

    await pool.query("DELETE FROM books WHERE id = $1", [id]);
    return NextResponse.json({ message: "Buku dihapus" });
  } catch (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { message: "Buku punya riwayat transaksi, tidak bisa dihapus" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}