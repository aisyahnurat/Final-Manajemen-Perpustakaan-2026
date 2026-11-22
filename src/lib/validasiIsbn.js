import ISBN from "isbn3";

// Menerima ISBN dengan/tanpa strip atau spasi, mengembalikan { isbn } atau { error }
export function formatIsbn(input) {
  // 1. bersihkan tanda hubung & spasi, huruf X dibuat kapital
  const bersih = String(input || "").replace(/[\s-]/g, "").toUpperCase();

  // 2. harus 10 atau 13 karakter
  if (bersih.length !== 10 && bersih.length !== 13) {
    return { error: "ISBN harus 10 atau 13 karakter (tanda strip boleh diketik, akan dirapikan otomatis)" };
  }

  // 3. karakter hanya angka (X boleh jadi karakter terakhir untuk ISBN-10)
  if (!/^\d{9}[\dX]$|^\d{13}$/.test(bersih)) {
    return { error: "ISBN hanya boleh berisi angka (huruf X hanya untuk digit terakhir ISBN-10)" };
  }

  // 4. beri strip otomatis; ISBN-10 disamakan menjadi format ISBN-13
  const hasil = ISBN.parse(bersih);
  if (!hasil || !hasil.isValid) {
    return { error: "ISBN tidak valid, periksa kembali digitnya" };
  }
  return { isbn: hasil.isbn13h };
}