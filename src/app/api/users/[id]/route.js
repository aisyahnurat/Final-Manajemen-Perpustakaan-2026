import { NextResponse } from "next/server";
import pool from "@/lib/db";
import cekAdmin from "@/lib/cekAdmin";
import { validasiUser } from "@/lib/validasiUser";
import { emailUnhas } from "@/lib/validasiEmail";

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

    const result = await pool.query(
      `UPDATE users SET nama_lengkap = $1, email = $2, role = $3, is_active = $4
       WHERE id = $5`,
      [u.nama_lengkap, u.email, u.role, u.is_active, id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Pengguna diperbarui" });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Email sudah dipakai" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    const aktif = await pool.query(
      `SELECT COUNT(*)::int AS total FROM loans
       WHERE user_id = $1
         AND status IN ('Menunggu Konfirmasi', 'Sedang Dipinjam')`,
      [id]
    );
    if (aktif.rows[0].total > 0) {
      return NextResponse.json(
        { message: "Pengguna masih punya transaksi aktif, tidak bisa dihapus" },
        { status: 409 }
      );
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return NextResponse.json({ message: "Pengguna dihapus" });
  } catch (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { message: "Pengguna punya riwayat transaksi atau ulasan. Nonaktifkan saja lewat Edit." },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
  }
}