import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Mahasiswa mengajukan perpanjangan
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { user_id } = await request.json();

    const cek = await pool.query(
      `SELECT user_id, status, status_perpanjangan,
              tanggal_jatuh_tempo < CURRENT_DATE AS terlambat
       FROM loans WHERE id = $1`,
      [id]
    );
    if (cek.rows.length === 0) {
      return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
    }
    const l = cek.rows[0];

    if (l.user_id !== Number(user_id)) {
      return NextResponse.json({ message: "Bukan transaksi milikmu" }, { status: 403 });
    }
    if (l.status !== "Sedang Dipinjam") {
      return NextResponse.json(
        { message: "Hanya buku yang sedang dipinjam yang bisa diperpanjang" },
        { status: 409 }
      );
    }
    if (l.terlambat) {
      return NextResponse.json(
        { message: "Sudah lewat jatuh tempo, tidak bisa diperpanjang" },
        { status: 400 }
      );
    }
    if (l.status_perpanjangan !== "Tidak Ada") {
      return NextResponse.json(
        { message: "Perpanjangan untuk transaksi ini sudah pernah diajukan" },
        { status: 409 }
      );
    }

    await pool.query(
      "UPDATE loans SET status_perpanjangan = 'Perpanjangan Diajukan' WHERE id = $1",
      [id]
    );
    return NextResponse.json({ message: "Perpanjangan diajukan, menunggu pegawai" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

// Pegawai menyetujui / menolak perpanjangan
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { aksi, pegawai_id } = await request.json();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const p = await client.query(
      "SELECT role FROM users WHERE id = $1 AND is_active = true",
      [pegawai_id]
    );
    if (!["pegawai", "admin"].includes(p.rows[0]?.role)) {
      throw { status: 403, message: "Tidak punya akses" };
    }

    const cek = await client.query(
      `SELECT l.status_perpanjangan, b.durasi_maks_pinjam
       FROM loans l JOIN books b ON b.id = l.book_id
       WHERE l.id = $1
       FOR UPDATE OF l`,
      [id]
    );
    if (cek.rows.length === 0) {
      throw { status: 404, message: "Transaksi tidak ditemukan" };
    }
    if (cek.rows[0].status_perpanjangan !== "Perpanjangan Diajukan") {
      throw { status: 409, message: "Tidak ada pengajuan perpanjangan" };
    }

    let pesan = "";
    if (aksi === "setujui") {
      // jatuh tempo bertambah sebanyak durasi maksimal pinjam buku itu
      await client.query(
        `UPDATE loans
         SET tanggal_jatuh_tempo = tanggal_jatuh_tempo + $1::int,
             status_perpanjangan = 'Perpanjangan Disetujui',
             diproses_oleh = $2
         WHERE id = $3`,
        [cek.rows[0].durasi_maks_pinjam, pegawai_id, id]
      );
      pesan = "Perpanjangan disetujui, jatuh tempo diperbarui";
    } else if (aksi === "tolak") {
      await client.query(
        `UPDATE loans
         SET status_perpanjangan = 'Perpanjangan Ditolak', diproses_oleh = $1
         WHERE id = $2`,
        [pegawai_id, id]
      );
      pesan = "Perpanjangan ditolak";
    } else {
      throw { status: 400, message: "Aksi tidak dikenal" };
    }

    await client.query("COMMIT");
    return NextResponse.json({ message: pesan });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.status) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  } finally {
    client.release();
  }
}