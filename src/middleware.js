import { NextResponse } from "next/server";
import { bacaToken, NAMA_COOKIE } from "@/lib/token";

function bolehAkses(path, role) {
  if (path.startsWith("/api/users") || path.startsWith("/api/stats")) {
    return role === "admin";
  }
  if (path.startsWith("/admin")) return role === "admin";
  if (path.startsWith("/mahasiswa")) return role === "mahasiswa";
  if (path.startsWith("/pegawai")) return role === "pegawai" || role === "admin";
  return false;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(NAMA_COOKIE)?.value;
  const sesi = token ? await bacaToken(token) : null;

  if (!sesi || !bolehAkses(pathname, sesi.role)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ message: "Tidak punya akses" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pegawai/:path*",
    "/mahasiswa/:path*",
    "/api/users/:path*",
    "/api/stats",
  ],
};