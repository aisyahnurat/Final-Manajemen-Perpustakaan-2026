import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { nama, email, nim, password } = await request.json();

    if (!nama || !email || !nim || !password) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // validasi email kampus (harus berakhiran .ac.id)
    const emailKampus = /^[^\s@]+@[^\s@]+\.ac\.id$/;
    if (!emailKampus.test(email)) {
      return NextResponse.json(
        { message: "Gunakan email kampus (berakhiran .ac.id)" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO users (nama_lengkap, email, password, role, nomor_identitas)
       VALUES ($1, $2, $3, 'mahasiswa', $4)`,
      [nama, email, password, nim]
    );

    return NextResponse.json(
      { message: "Registrasi berhasil! Silakan login." },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Email atau NIM sudah terdaftar" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}