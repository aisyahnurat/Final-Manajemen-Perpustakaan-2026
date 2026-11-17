import { SignJWT, jwtVerify } from "jose";

export const NAMA_COOKIE = "sesi";

const kunci = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function buatToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(kunci());
}

export async function bacaToken(token) {
  try {
    const { payload } = await jwtVerify(token, kunci());
    return payload;
  } catch {
    return null; // token palsu atau kedaluwarsa
  }
}