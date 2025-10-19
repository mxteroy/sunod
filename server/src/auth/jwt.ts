// src/auth/jwt.ts
import type { UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";

const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET || "dev-secret";
const ACCESS_TTL_SEC = Number(process.env.ACCESS_TTL_SEC ?? 10 * 60); // 10 min
const ISSUER = process.env.JWT_ISSUER || "rizzbot";
const AUDIENCE = process.env.JWT_AUDIENCE || "rizzbot-web";

export type AccessClaims = {
  sub: string;
  anon?: boolean;
  role?: UserRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

export function signAccessToken(userId: string, anon = false, role?: UserRole) {
  // Put sub in *options* (subject), not just the payload
  return jwt.sign({ anon, role }, ACCESS_JWT_SECRET, {
    algorithm: "HS256",
    subject: userId, // <-- sets `sub`
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_TTL_SEC,
    header: { typ: "JWT", alg: "HS256" },
  });
}

export function verifyAccessToken(token: string): AccessClaims | null {
  try {
    return jwt.verify(token, ACCESS_JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as AccessClaims;
  } catch {
    return null;
  }
}
