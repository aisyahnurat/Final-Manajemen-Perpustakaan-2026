import { NextResponse } from "next/server";
import pool from "@/lib/db";
import cekAdmin from "@/lib/cekAdmin";
import { validasiUser } from "@/lib/validasiUser";
import { validasiNim } from "@/lib/validasiNim";
import { emailUnhas } from "@/lib/validasiEmail";
import bcrypt, { hash } from "bcryptjs";

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  if (!(await cekAdmin(sp.get("admin_id")))) {
    return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
  }
  const role = sp.get("role") || "";

  const result = await pool.query(
    `SELECT id, nama_lengkap, email, role, nomor_identitas, is_active,
            to_char(created_at, 'YYYY-MM-DD') AS terdaftar
     FROM users
     WHERE ($1::text = '' OR role = $1::text)
     ORDER BY id`,
    [role]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  try {
    const u = await request.json();
    if (!(await cekAdmin(u.admin_id))) {
      return NextResponse.json({ message: "Tidak punya akses" }, { status: 403 });
    }
    const galat = validasiUser(u, true);
    if (galat) {
      return NextResponse.json({ message: galat }, { status: 400 });
    }

    u.nomor_identitas = String(u.nomor_identitas).trim().toUpperCase();
    if (u.role === "mahasiswa" && !validasiNim(u.nomor_identitas)) {
      return NextResponse.json(
        { message: "Format NIM tidak valid (1 huruf A-H/M/N/P/R diikuti 9 angka)" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (nama_lengkap, email, password, role, nomor_identitas)
       VALUES ($1, $2, $3, $4, $5)`,
      [u.nama_lengkap, u.email, hash, u.role, u.nomor_identitas]
    );
    return NextResponse.json({ message: "Pengguna ditambahkan" }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Email atau nomor identitas sudah terdaftar" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Kesalahan server" }, { status: 500 });
    }
}