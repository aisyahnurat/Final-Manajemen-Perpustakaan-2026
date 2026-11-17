"use client"; 
 
import { useState } from "react"; 
 
export default function RegisterPage() { 
  const [nama, setNama] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [pesan, setPesan] = useState(""); 
  const [nim, setNIM] = useState("");
 
  async function handleSubmit(e) { 
    e.preventDefault(); 
 
    const res = await fetch("/api/register", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ nama, email, nim, password }), 
    }); 
 
    const data = await res.json(); 
    setPesan(data.message); 
  } 
 
  return ( 
    <main style={{ maxWidth: 400, margin: "40px auto" }}> 
      <h1>Register</h1> 
      <form onSubmit={handleSubmit}> 
        <input 
          type="text" 
          placeholder="Nama" 
          value={nama} 
          onChange={(e) => setNama(e.target.value)} 
          required 
        /> 
        <br /><br /> 
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        /> 
        <br /><br />
        <input
          type="text"
          placeholder="NIM (contoh: H071231001)"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          maxLength={10}
          pattern="[A-HMNPRa-hmnpr][0-9]{9}"
          title="1 huruf (A-H, M, N, P, R) diikuti 9 angka"
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
        <button type="submit">Daftar</button> 
      </form> 
      {pesan && <p>{pesan}</p>} 
    </main> 
  ); 
} 