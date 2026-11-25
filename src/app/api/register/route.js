import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validasiNim } from "@/lib/validasiNim";
import { emailUnhas } from "@/lib/validasiEmail";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { nama, email, nim, password } = await request.json();

    if (!nama || !email || !nim || !password) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // validasi email kampus Unhas
    if (!emailUnhas(email)) {
      return NextResponse.json(
        { message: "Gunakan email kampus (berakhiran unhas.ac.id)" },
        { status: 400 }
      );
    }
    if (String(email || "").length > 100) {
      return NextResponse.json({ message: "Email maksimal 100 karakter" }, { status: 400 });
    }

    // validasi NIM: 1 huruf (A-H, M, N, P, R) + 9 angka
    const nimBersih = String(nim).trim().toUpperCase();
    if (!validasiNim(nimBersih)) {
      return NextResponse.json(
        { message: "Format NIM tidak valid (1 huruf A-H/M/N/P/R diikuti 9 angka)" },
        { status: 400 }
      );
    }

    const namaBersih = String(nama || "").trim();
    if (namaBersih.length < 2 || namaBersih.length > 100) {
      return NextResponse.json(
        { message: "Nama lengkap harus 2–100 karakter" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (nama_lengkap, email, password, role, nomor_identitas)
       VALUES ($1, $2, $3, 'mahasiswa', $4)`,
      [namaBersih, email, hash, nimBersih]
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