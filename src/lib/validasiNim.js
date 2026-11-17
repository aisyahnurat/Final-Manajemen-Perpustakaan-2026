const POLA_NIM = /^[A-HMNPR][0-9]{9}$/;

export function validasiNim(nim) {
  return POLA_NIM.test(nim);
}