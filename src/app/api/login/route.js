import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const result = await pool.query(
      `SELECT id, nama_lengkap, email, role, is_active
       FROM users WHERE email = $1 AND password = $2`,
      [email, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return NextResponse.json(
        { message: "Akun Anda dinonaktifkan" },
        { status: 403 }
      );
    }

    return NextResponse.json({ message: "Login berhasil", user });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}