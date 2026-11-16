import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { user_id, loan_id, rating, komentar } = await request.json();

    const nilai = Number(rating);
    if (!Number.isInteger(nilai) || nilai < 1 || nilai > 5) {
      return NextResponse.json({ message: "Rating harus 1 sampai 5" }, { status: 400 });
    }

    const loan = await pool.query(
      "SELECT user_id, book_id, status FROM loans WHERE id = $1",
      [loan_id]
    );
    if (loan.rows.length === 0) {
      return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
    }
    const l = loan.rows[0];

    if (l.user_id !== Number(user_id)) {
      return NextResponse.json({ message: "Bukan transaksi milikmu" }, { status: 403 });
    }
    if (l.status !== "Selesai") {
      return NextResponse.json(
        { message: "Ulasan hanya untuk buku yang sudah selesai dipinjam" },
        { status: 403 }
      );
    }

    await pool.query(
      `INSERT INTO reviews (loan_id, user_id, book_id, rating, komentar)
       VALUES ($1, $2, $3, $4, $5)`,
      [loan_id, user_id, l.book_id, nilai, komentar || null]
    );
    return NextResponse.json({ message: "Ulasan terkirim, terima kasih!" }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Kamu sudah memberi ulasan untuk transaksi ini" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}