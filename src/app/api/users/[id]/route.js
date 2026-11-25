import { NextResponse } from "next/server";
import pool from "@/lib/db";
import cekAdmin from "@/lib/cekAdmin";
import { validasiUser } from "@/lib/validasiUser";
import { cekIdentitas } from "@/lib/validasiIdentitas";
import { labelIdentitas, namaPengguna, pesanDuplikat } from "@/lib/pesanUser";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const u = await request.json();

    if (!(await cekAdmin(u.admin_id))) {
      return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
    }
    const galat = validasiUser(u, false);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }
    if (Number(id) === Number(u.admin_id) && (u.role !== "admin" || !u.is_active)) {
      return NextResponse.json(
        { message: "Tidak bisa mengubah role atau menonaktifkan akun sendiri" },
        { status: 400 }
      );
    }

    const lama = await pool.query(
      "SELECT role, nomor_identitas FROM users WHERE id = $1",
      [id]
    );
    if (lama.rows.length === 0) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    const { role: roleLama, nomor_identitas: nomor } = lama.rows[0];

    // kalau role diganti, nomor identitas lama harus cocok dengan format role baru
    if (roleLama !== u.role && cekIdentitas(u.role, nomor)) {
      return NextResponse.json(
        {
          message: `Role tidak bisa diganti ke ${u.role}: ${labelIdentitas(roleLama)} ${nomor} tidak sesuai format role baru`,
        },
        { status: 400 }
      );
    }

    const namaBersih = String(u.nama_lengkap || "").trim();
    if (namaBersih.length < 2 || namaBersih.length > 100) {
      return NextResponse.json(
        { message: "Nama lengkap harus 2–100 karakter" },
        { status: 400 }
      );
    }
    if (String(u.email || "").length > 100) {
      return NextResponse.json({ message: "Email maksimal 100 karakter" }, { status: 400 });
    }

    await pool.query(
      `UPDATE users SET nama_lengkap = $1, email = $2, role = $3, is_active = $4
       WHERE id = $5`,
      [namaBersih, u.email, u.role, u.is_active, id]
    );
    return NextResponse.json({
      message: `Data pengguna ${namaPengguna(u.nama_lengkap, u.role, nomor)} berhasil diperbarui`,
    });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: pesanDuplikat(error) }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let nama = "ini"; // diisi setelah data pengguna diambil, dipakai juga oleh catch
  try {
    const { id } = await params;
    const adminId = new URL(request.url).searchParams.get("admin_id");

    if (!(await cekAdmin(adminId))) {
      return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
    }
    if (Number(id) === Number(adminId)) {
      return NextResponse.json(
        { message: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    const target = await pool.query(
      "SELECT nama_lengkap, role, nomor_identitas FROM users WHERE id = $1",
      [id]
    );
    if (target.rows.length === 0) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    const t = target.rows[0];
    nama = namaPengguna(t.nama_lengkap, t.role, t.nomor_identitas);

    const aktif = await pool.query(
      `SELECT COUNT(*)::int AS total FROM loans
       WHERE user_id = $1
         AND status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam')`,
      [id]
    );
    if (aktif.rows[0].total > 0) {
      return NextResponse.json(
        {
          message: `Pengguna ${nama} masih punya ${aktif.rows[0].total} transaksi aktif, tidak bisa dihapus`,
        },
        { status: 409 }
      );
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return NextResponse.json({ message: `Pengguna ${nama} berhasil dihapus` });
  } catch (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        {
          message: `Pengguna ${nama} punya riwayat transaksi atau ulasan, jadi tidak bisa dihapus. Nonaktifkan saja lewat Edit.`,
        },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}