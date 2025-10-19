// src/auth/validate.ts
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function isValidPassword(pw: string) {
  return typeof pw === "string" && pw.length >= 8; // add complexity if desired
}
