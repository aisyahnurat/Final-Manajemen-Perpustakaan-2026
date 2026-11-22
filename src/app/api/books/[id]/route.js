import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiBuku } from "@/lib/validasiBuku";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const buku = await pool.query(
      `SELECT b.*, c.nama AS kategori,
              ROUND(AVG(r.rating), 1)::float AS rating_rata
       FROM books b
       JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.book_id = b.id
       WHERE b.id = $1
       GROUP BY b.id, c.nama`,
      [id]
    );
    if (buku.rows.length === 0) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    const ulasan = await pool.query(
      `SELECT r.rating, r.komentar, u.nama_lengkap,
              to_char(r.created_at, 'YYYY-MM-DD') AS tanggal
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.book_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    return NextResponse.json({ buku: buku.rows[0], ulasan: ulasan.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  let b = {};
  try {
    const { id } = await params;
    b = await request.json();
    const galat = validasiBuku(b);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }
    const sinopsis = String(b.sinopsis || "").trim() || null;

    // stok_tersedia ikut disesuaikan dengan selisih stok_total yang baru
    const result = await pool.query(
      `UPDATE books SET
         judul = $1, pengarang = $2, penerbit = $3, tahun_terbit = $4,
         category_id = $5,
         stok_tersedia = stok_tersedia + ($6::int - stok_total),
         stok_total = $6::int,
         durasi_maks_pinjam = $7, denda_per_hari = $8, cover_url = $9,
         sinopsis = $10
       WHERE id = $11
       RETURNING isbn`,
      [b.judul, b.pengarang, b.penerbit, b.tahun_terbit, b.category_id,
       b.stok_total, b.durasi_maks_pinjam, b.denda_per_hari,
       b.cover_url || null, sinopsis, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({
      message: `Buku "${b.judul}" (ISBN ${result.rows[0].isbn}) berhasil diperbarui`,
    });
  } catch (error) {
    if (error.code === "23514") {
      return NextResponse.json(
        { message: `Stok buku "${b.judul}" tidak boleh lebih kecil dari jumlah yang sedang dipinjam` },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let nama = "ini"; // diisi setelah data buku diambil, dipakai juga oleh catch
  try {
    const { id } = await params;

    const buku = await pool.query(
      "SELECT judul, isbn FROM books WHERE id = $1",
      [id]
    );
    if (buku.rows.length === 0) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }
    nama = `"${buku.rows[0].judul}" (ISBN ${buku.rows[0].isbn})`;

    const aktif = await pool.query(
      `SELECT COUNT(*)::int AS total FROM loans
       WHERE book_id = $1
         AND status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam')`,
      [id]
    );
    if (aktif.rows[0].total > 0) {
      return NextResponse.json(
        { message: `Buku ${nama} masih punya ${aktif.rows[0].total} transaksi aktif, tidak bisa dihapus` },
        { status: 409 }
      );
    }

    await pool.query("DELETE FROM books WHERE id = $1", [id]);
    return NextResponse.json({ message: `Buku ${nama} berhasil dihapus` });
  } catch (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { message: `Buku ${nama} punya riwayat transaksi, tidak bisa dihapus` },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}