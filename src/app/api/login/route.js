import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { buatToken, NAMA_COOKIE } from "@/lib/token";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const result = await pool.query(
      `SELECT id, nama_lengkap, email, role, is_active, password
       FROM users WHERE email = $1`,
      [email]
    );
    const u = result.rows[0];

    // bandingkan password yang diketik dengan hash di database
    const cocok =
      u && typeof password === "string" && (await bcrypt.compare(password, u.password));
    if (!cocok) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }
    if (!u.is_active) {
      return NextResponse.json(
        { message: "Akun Anda dinonaktifkan" },
        { status: 403 }
      );
    }

    const token = await buatToken({ id: u.id, role: u.role });
    const res = NextResponse.json({
      message: "Login berhasil",
      user: { id: u.id, nama_lengkap: u.nama_lengkap, email: u.email, role: u.role },
    });
    res.cookies.set(NAMA_COOKIE, token, {
      httpOnly: true, // tidak bisa dibaca atau diubah lewat JavaScript browser
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}