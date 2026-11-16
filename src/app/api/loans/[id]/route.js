import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { aksi, pegawai_id, alasan } = await request.json();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // hanya pegawai/admin yang boleh memproses
    const p = await client.query(
      "SELECT role FROM users WHERE id = $1 AND is_active = true",
      [pegawai_id]
    );
    if (!["pegawai", "admin"].includes(p.rows[0]?.role)) {
      throw { status: 403, message: "Tidak punya akses" };
    }

    // kunci baris transaksi dan buku selama proses berlangsung
    const cek = await client.query(
      `SELECT l.status, l.status_denda, l.book_id,
              b.stok_tersedia, b.durasi_maks_pinjam,
              GREATEST(CURRENT_DATE - l.tanggal_jatuh_tempo, 0) * b.denda_per_hari AS denda
       FROM loans l
       JOIN books b ON b.id = l.book_id
       WHERE l.id = $1
       FOR UPDATE`,
      [id]
    );
    if (cek.rows.length === 0) {
      throw { status: 404, message: "Transaksi tidak ditemukan" };
    }
    const loan = cek.rows[0];
    let pesan = "";

    if (aksi === "setujui") {
      if (loan.status !== "Menunggu Konfirmasi") {
        throw { status: 409, message: "Transaksi ini sudah diproses" };
      }
      if (loan.stok_tersedia <= 0) {
        throw { status: 400, message: "Stok buku habis, tidak bisa disetujui" };
      }
      await client.query(
        "UPDATE books SET stok_tersedia = stok_tersedia - 1 WHERE id = $1",
        [loan.book_id]
      );
      await client.query(
        `UPDATE loans
         SET status = 'Sedang Dipinjam',
             tanggal_pinjam = CURRENT_DATE,
             tanggal_jatuh_tempo = CURRENT_DATE + $1::int,
             diproses_oleh = $2
         WHERE id = $3`,
        [loan.durasi_maks_pinjam, pegawai_id, id]
      );
      pesan = "Peminjaman disetujui, stok berkurang 1";

    } else if (aksi === "tolak") {
      if (loan.status !== "Menunggu Konfirmasi") {
        throw { status: 409, message: "Transaksi ini sudah diproses" };
      }
      if (!alasan?.trim()) {
        throw { status: 400, message: "Alasan penolakan wajib diisi" };
      }
      await client.query(
        `UPDATE loans
         SET status = 'Ditolak', alasan_penolakan = $1, diproses_oleh = $2
         WHERE id = $3`,
        [alasan, pegawai_id, id]
      );
      pesan = "Pengajuan ditolak";

    } else if (aksi === "kembali") {
      if (loan.status !== "Sedang Dipinjam") {
        throw { status: 409, message: "Buku ini tidak sedang dipinjam" };
      }
      const denda = Number(loan.denda);
      await client.query(
        "UPDATE books SET stok_tersedia = stok_tersedia + 1 WHERE id = $1",
        [loan.book_id]
      );
      await client.query(
        `UPDATE loans
         SET status = 'Selesai', tanggal_kembali = CURRENT_DATE,
             denda_nominal = $1, status_denda = $2, diproses_oleh = $3
         WHERE id = $4`,
        [denda, denda > 0 ? "Tertunggak" : "Tidak Ada", pegawai_id, id]
      );
      pesan = denda > 0
        ? `Buku dikembalikan. Denda Rp ${denda.toLocaleString("id-ID")} tercatat`
        : "Buku dikembalikan tepat waktu";

    } else if (aksi === "lunas") {
      if (loan.status_denda !== "Tertunggak") {
        throw { status: 409, message: "Tidak ada denda tertunggak" };
      }
      await client.query(
        "UPDATE loans SET status_denda = 'Lunas' WHERE id = $1",
        [id]
      );
      pesan = "Denda ditandai lunas";

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