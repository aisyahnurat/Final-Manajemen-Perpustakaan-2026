"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuth(roleDiizinkan) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  // diubah ke string supaya aman dipakai sebagai dependency useEffect
  const kunci = [].concat(roleDiizinkan).join(",");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      router.push("/login");
      return;
    }
    const data = JSON.parse(saved);
    if (!kunci.split(",").includes(data.role)) {
      router.push("/login");
      return;
    }
    setUser(data);
  }, [router, kunci]);

  function logout() {
    localStorage.removeItem("user");
    router.push("/login");
  }

  return { user, logout };
}