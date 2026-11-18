"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Satu kolom isian: label di atas, input bentuk pil
function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#4a4a3f] mb-1 pl-4">{label}</span>
      <input
        {...props}
        required
        className="w-full rounded-full bg-[#a9ae88] text-white placeholder-white/90 px-5 py-3 outline-none focus:ring-2 focus:ring-[#5e6b45]"
      />
    </label>
  );
}

// Dipakai untuk saling memudarkan dua lapisan yang bertumpuk
const tampil = (aktif) =>
  `transition-all duration-500 ${aktif ? "opacity-100 visible" : "opacity-0 invisible"}`;

export default function AuthPage({ mulai = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(mulai); // "login" atau "register"
  const login = mode === "login";

  // state form login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesanLogin, setPesanLogin] = useState("");
  const [sukses, setSukses] = useState("");

  // state form registrasi
  const [nama, setNama] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [nim, setNim] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [pesanDaftar, setPesanDaftar] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setPesanLogin("");
    setSukses("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPesanLogin(data.message);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    const tujuan = {
      admin: "/admin",
      pegawai: "/pegawai",
      mahasiswa: "/mahasiswa",
    }[data.user.role];
    router.push(tujuan);
  }

  async function handleDaftar(e) {
    e.preventDefault();
    setPesanDaftar("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, email: regEmail, nim, password: regPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPesanDaftar(data.message);
      return;
    }

    // berhasil: geser kembali ke login, email sudah terisi
    setEmail(regEmail);
    setPassword("");
    setSukses("Registrasi berhasil, silakan login.");
    setMode("login");
  }

  return (
    <main
      className="min-h-screen md:h-screen md:overflow-hidden flex items-center justify-center p-4 bg-[#3f4a2e] bg-cover bg-center bg-[url('/bg-perpus-fix.png')]"
    >
      <div className="relative w-full max-w-md md:max-w-5xl md:h-full md:max-h-[640px]">
        {/* ===== Kartu krem: berisi form login dan form registrasi ===== */}
        <div
          className={`grid md:content-center bg-[#fff1d6]/90 rounded-[2.5rem] shadow-2xl p-8 md:p-10
            md:absolute md:top-0 md:h-full md:w-[46%] md:overflow-y-auto md:transition-all md:duration-700 md:ease-in-out
            ${login ? "md:left-[54%]" : "md:left-0"}`}
        >
          {/* Form login */}
          <form
            onSubmit={handleLogin}
            className={`col-start-1 row-start-1 space-y-4 ${tampil(login)}`}
          >
            <h1 className="text-3xl font-bold text-center text-[#4a4a3f] mb-2">Login</h1>

            <Field
              label="Email Address"
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {sukses && (
              <p className="text-sm bg-green-100 text-green-800 rounded-lg px-3 py-2">{sukses}</p>
            )}
            {pesanLogin && (
              <p className="text-sm bg-red-100 text-red-700 rounded-lg px-3 py-2">{pesanLogin}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-full border-2 border-[#5e6b45] text-[#4a4a3f] font-semibold py-3 hover:bg-[#5e6b45] hover:text-white transition"
            >
              Login
            </button>

            <Link
              href="/"
              className="block text-center font-semibold text-[#4a4a3f] hover:underline pt-2"
            >
              Masuk sebagai tamu
            </Link>

            {/* hanya muncul di HP */}
            <p className="md:hidden text-center text-sm text-[#4a4a3f]">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-semibold underline"
              >
                Daftar
              </button>
            </p>
          </form>

          {/* Form registrasi */}
          <form
            onSubmit={handleDaftar}
            className={`col-start-1 row-start-1 space-y-3 ${tampil(!login)}`}
          >
            <h1 className="text-3xl font-bold text-center text-[#4a4a3f] mb-1">Registration</h1>

            <Field
              label="Nama"
              type="text"
              placeholder="Masukkan nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
            <Field
              label="Email Address"
              type="email"
              placeholder="Masukkan email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
            <Field
              label="Nomor Induk Mahasiswa"
              type="text"
              placeholder="Masukkan NIM"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
            />

            {pesanDaftar && (
              <p className="text-sm bg-red-100 text-red-700 rounded-lg px-3 py-2">{pesanDaftar}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-full border-2 border-[#5e6b45] text-[#4a4a3f] font-semibold py-3 mt-6 hover:bg-[#5e6b45] hover:text-white transition"
            >
              Register
            </button>

            {/* hanya muncul di HP */}
            <p className="md:hidden text-center text-sm text-[#4a4a3f]">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold underline"
              >
                Login
              </button>
            </p>
          </form>
        </div>

        {/* ===== Kartu kaca: hanya di layar lebar, bergeser berlawanan arah ===== */}
        <div
          className={`hidden md:grid place-content-center absolute top-[20%] h-[58%] w-[46%]
            rounded-[3rem] border border-white/40 bg-white/15  shadow-xl
            transition-all duration-700 ease-in-out
            ${login ? "left-0" : "left-[54%]"}`}
        >
          {/* Teks saat mode login */}
          <div className={`col-start-1 row-start-1 text-center px-8 ${tampil(login)}`}>
            <h2 className="text-4xl font-bold text-[#2f3b22] drop-shadow-lg">Hello, Welcome</h2>
            <p className="mt-3 text-[#2f3b22] drop-shadow">Belum punya akun?</p>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="mt-8 w-full max-w-[260px] rounded-full bg-[#2f3b22]/80 py-3 font-semibold text-white hover:bg-[#2f3b22]/100 transition"
            >
              Register
            </button>
          </div>

          {/* Teks saat mode registrasi */}
          <div className={`col-start-1 row-start-1 text-center px-8 ${tampil(!login)}`}>
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">Welcome, Back!</h2>
            <p className="mt-3 text-white drop-shadow">Sudah punya akun?</p>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="mt-8 w-full max-w-[260px] rounded-full bg-white/60 py-3 font-semibold text-[#4f6b34] hover:bg-white/90 transition"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}