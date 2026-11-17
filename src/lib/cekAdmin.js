import pool from "@/lib/db";

export default async function cekAdmin(id) {
  if (!id || !Number.isInteger(Number(id))) return false;
  const r = await pool.query(
    "SELECT 1 FROM users WHERE id = $1 AND role = 'admin' AND is_active = true",
    [id]
  );
  return r.rows.length > 0;
}