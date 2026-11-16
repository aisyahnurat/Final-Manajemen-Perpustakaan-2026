import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Daftar transaksi. Tanpa user_id = semua (untuk pegawai/admin).
export async function GET(request) {
  const userId = new URL(request.url).searchParams.get("user_id");

  const result = await pool.query(
    `SELECT l.id, l.user_id, l.book_id, l.status, l.status_perpanjangan,
            l.status_denda, l.denda_nominal, l.alasan_penolakan,
            to_char(l.tanggal_pengajuan, 'YYYY-MM-DD') AS tanggal_pengajuan,
            to_char(l.tanggal_pinjam, 'YYYY-MM-DD') AS tanggal_pinjam,
            to_char(l.tanggal_jatuh_tempo, 'YYYY-MM-DD') AS tanggal_jatuh_tempo,
            to_char(l.tanggal_kembali, 'YYYY-MM-DD') AS tanggal_kembali,
            b.judul, u.nama_lengkap, u.nomor_identitas,
            CASE WHEN l.status = 'Sedang Dipinjam'
                 THEN GREATEST(CURRENT_DATE - l.tanggal_jatuh_tempo, 0)
                 ELSE 0 END AS hari_terlambat,
            CASE WHEN l.status = 'Sedang Dipinjam'
                 THEN GREATEST(CURRENT_DATE - l.tanggal_jatuh_tempo, 0) * b.denda_per_hari
                 ELSE 0 END AS denda_berjalan
     FROM loans l
     JOIN books b ON b.id = l.book_id
     JOIN users u ON u.id = l.user_id
     WHERE ($1::int IS NULL OR l.user_id = $1)
     ORDER BY l.id DESC`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

// Mahasiswa mengajukan peminjaman
export async function POST(request) {
  try {
    const { user_id, book_id } = await request.json();
    if (!user_id || !book_id) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const mhs = await pool.query(
      "SELECT role, is_active FROM users WHERE id = $1",
      [user_id]
    );
    if (mhs.rows.length === 0 || mhs.rows[0].role !== "mahasiswa" || !mhs.rows[0].is_active) {
      return NextResponse.json(
        { message: "Hanya mahasiswa aktif yang dapat meminjam" },
        { status: 403 }
      );
    }

    // blokir kalau masih ada denda tertunggak
    const denda = await pool.query(
      `SELECT COUNT(*)::int AS total FROM loans
       WHERE user_id = $1 AND status_denda = 'Tertunggak'`,
      [user_id]
    );
    if (denda.rows[0].total > 0) {
      return NextResponse.json(
        { message: "Pengajuan diblokir: masih ada denda tertunggak" },
        { status: 403 }
      );
    }

    const buku = await pool.query(
      "SELECT stok_tersedia FROM books WHERE id = $1",
      [book_id]
    );
    if (buku.rows.length === 0) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }
    if (buku.rows[0].stok_tersedia <= 0) {
      return NextResponse.json({ message: "Stok buku sedang habis" }, { status: 400 });
    }

    // satu buku tidak boleh diajukan dua kali selama masih aktif
    const dobel = await pool.query(
      `SELECT COUNT(*)::int AS total FROM loans
       WHERE user_id = $1 AND book_id = $2
         AND status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam')`,
      [user_id, book_id]
    );
    if (dobel.rows[0].total > 0) {
      return NextResponse.json(
        { message: "Kamu sudah mengajukan atau sedang meminjam buku ini" },
        { status: 409 }
      );
    }

    await pool.query(
      "INSERT INTO loans (user_id, book_id) VALUES ($1, $2)",
      [user_id, book_id]
    );
    return NextResponse.json(
      { message: "Pengajuan terkirim, silakan datang ke meja sirkulasi" },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}