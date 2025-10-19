// src/auth/password.ts
import * as argon2 from "argon2";

export async function hashPassword(pw: string) {
  // argon2id with sane defaults (memoryCost/timeCost can be tuned)
  return argon2.hash(pw, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw);
}
