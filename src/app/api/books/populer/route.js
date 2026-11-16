import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const result = await pool.query(
    `SELECT b.id, b.judul, b.pengarang, b.cover_url,
            COUNT(l.id)::int AS jumlah_pinjam
     FROM books b
     LEFT JOIN loans l
       ON l.book_id = b.id AND l.status IN ('Sedang Dipinjam', 'Selesai')
     GROUP BY b.id
     ORDER BY jumlah_pinjam DESC, b.judul
     LIMIT 5`
  );
  return NextResponse.json(result.rows);
}