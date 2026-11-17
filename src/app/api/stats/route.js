import { NextResponse } from "next/server";
import pool from "@/lib/db";
import cekAdmin from "@/lib/cekAdmin";

export async function GET(request) {
  const adminId = new URL(request.url).searchParams.get("admin_id");
  if (!(await cekAdmin(adminId))) {
    return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM books)::int AS total_judul,
      (SELECT COALESCE(SUM(stok_total), 0) FROM books)::int AS total_eksemplar,
      (SELECT COUNT(*) FROM users WHERE role = 'mahasiswa')::int AS total_mahasiswa,
      (SELECT COUNT(*) FROM loans
        WHERE status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam'))::int AS transaksi_aktif,
      (SELECT COALESCE(SUM(denda_nominal), 0) FROM loans
        WHERE status_denda = 'Lunas')::int AS denda_lunas`
  );
  return NextResponse.json(result.rows[0]);
}