"use client"; 
 
import { useState } from "react"; 
import { useRouter } from "next/navigation"; 
 
export default function LoginPage() { 
  const router = useRouter(); 
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [pesan, setPesan] = useState(""); 
 
  async function handleSubmit(e) { 
    e.preventDefault(); 
 
    const res = await fetch("/api/login", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ email, password }), 
    }); 
 
    const data = await res.json(); 
 
    if (!res.ok) { 
      setPesan(data.message); 
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
 
  return ( 
    <main style={{ maxWidth: 400, margin: "40px auto" }}> 
      <h1>Login</h1>
       <form onSubmit={handleSubmit}> 
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        /> 
        <br /><br /> 
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        /> 
        <br /><br /> 
        <button type="submit">Login</button> 
      </form> 
      {pesan && <p style={{ color: "red" }}>{pesan}</p>} 
    </main> 
  ); 
} 