import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiBuku } from "@/lib/validasiBuku";
import { formatIsbn } from "@/lib/validasiIsbn";

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const q = sp.get("q") || "";
  const kategori = sp.get("kategori") || "";
  const urut = sp.get("urut") || "terbaru";
  const hurufMasuk = sp.get("huruf") || "";
  const huruf = /^[A-Za-z]$/.test(hurufMasuk) ? hurufMasuk : "";
  // daftar tetap (whitelist), karena nama kolom tidak bisa memakai $1
  const orderBy =
    {
      terbaru: "b.id DESC",
      tahun: "b.tahun_terbit DESC",
      rating: "rating_rata DESC NULLS LAST",
    }[urut] || "b.id DESC";

  const result = await pool.query(
    `SELECT b.*, c.nama AS kategori,
            ROUND(AVG(r.rating), 1)::float AS rating_rata
     FROM books b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN reviews r ON r.book_id = b.id
     WHERE (b.judul ILIKE $1 OR b.pengarang ILIKE $1)
       AND ($2::text = '' OR b.category_id = NULLIF($2::text, '')::int)
       AND ($3::text = '' OR b.judul ILIKE $3::text || '%')
     GROUP BY b.id, c.nama
     ORDER BY ${orderBy}`,
    [`%${q}%`, kategori, huruf]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  let b = {}; // di luar try supaya bisa dipakai di catch
  try {
    b = await request.json();
    const galat = validasiBuku(b);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }

    const hasilIsbn = formatIsbn(b.isbn);
    if (hasilIsbn.error) {
      // pakai bentuk response error yang sama seperti validasiBuku-mu
      return NextResponse.json({ pesan: hasilIsbn.error }, { status: 400 });
    }
    b.isbn = hasilIsbn.isbn;

    await pool.query(
      `INSERT INTO books
        (judul, isbn, pengarang, penerbit, tahun_terbit, category_id,
         stok_total, stok_tersedia, durasi_maks_pinjam, denda_per_hari, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10)`,
      [b.judul, b.isbn, b.pengarang, b.penerbit, b.tahun_terbit, b.category_id,
       b.stok_total, b.durasi_maks_pinjam, b.denda_per_hari, b.cover_url || null]
    );
    return NextResponse.json(
      { message: `Buku "${b.judul}" (ISBN ${b.isbn}) berhasil ditambahkan dengan stok ${b.stok_total}` },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: `ISBN ${b.isbn} sudah terdaftar, gunakan ISBN lain` },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}