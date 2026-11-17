const POLA_EMAIL_UNHAS = /^[^\s@]+@([a-z0-9-]+\.)*unhas\.ac\.id$/i;

export function emailUnhas(email) {
  return POLA_EMAIL_UNHAS.test(email);
}