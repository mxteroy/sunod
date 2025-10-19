// src/auth/refresh.ts
import type { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { REFRESH_TOKEN_TTL_SEC } from "./constants";

/**
 * SECURITY: add a server-side pepper so stolen DB hashes are useless.
 * Set REFRESH_TOKEN_PEPPER in your env; fall back to a static string if missing (not recommended).
 */
const PEPPER = process.env.REFRESH_TOKEN_PEPPER ?? "change-me-in-env";

/**
 * Time-to-live for an anonymous user's refresh token in seconds.
 * 12 hours = 12 * 60 * 60 = 43200 seconds.
 */
const ANON_REFRESH_TOKEN_TTL_SEC = 12 * 60 * 60;

/** Generate a new opaque refresh token. */
export function newRefreshToken(): string {
  // 64 bytes -> 86 chars base64url. 48 is also fine; 64 gives extra margin.
  return crypto.randomBytes(64).toString("base64url");
}

/** Hash a refresh token with an HMAC(sha256, PEPPER). Never store the raw token. */
export function hashRefreshToken(token: string): string {
  return crypto.createHmac("sha256", PEPPER).update(token).digest("hex");
}

// Back-compat alias if other modules imported old name
export const hashRefresh = hashRefreshToken;

/**
 * Compute absolute expiry from now.
 * It now accepts an optional TTL in seconds, defaulting to the standard.
 */
function computeExpiry(ttlSec: number = REFRESH_TOKEN_TTL_SEC): Date {
  return new Date(Date.now() + ttlSec * 1000);
}

/**
 * Persist a brand-new refresh token.
 * - Creates an AuthSession row with its own familyId (new login).
 * - Stores ONLY the hash.
 * - Now accepts an `isAnon` flag to set the correct expiry.
 */
export async function persistRefresh(
  prisma: PrismaClient,
  userId: string,
  token: string,
  meta: { ua?: string; ip?: string },
  isAnon: boolean = false, // Added `isAnon` flag
) {
  const refreshHash = hashRefreshToken(token);
  const expiresAt = isAnon
    ? computeExpiry(ANON_REFRESH_TOKEN_TTL_SEC)
    : computeExpiry();

  // New login = new family
  const familyId = crypto.randomUUID();

  return prisma.authSession.create({
    data: {
      userId,
      refreshHash,
      familyId,
      rotatedFromId: null,
      userAgent: meta.ua,
      ip: meta.ip,
      expiresAt,
      lastUsedAt: null,
      revokedAt: null,
      revokedReason: null,
    },
  });
}

/**
 * Rotate a refresh token (used during refreshSession):
 * - Revokes the existing session row.
 * - Creates a NEW row in the same family, linked via rotatedFromId.
 * - Returns the new row.
 * - Infers if the user is anonymous to set the correct expiry.
 */
export async function rotateRefresh(
  prisma: PrismaClient,
  sessionId: string,
  newToken: string,
  meta?: { ua?: string; ip?: string },
) {
  const existing = await prisma.authSession.findUnique({
    where: { id: sessionId },
  });
  if (!existing) {
    throw new Error("refresh session not found");
  }

  const now = new Date();
  const refreshHash = hashRefreshToken(newToken);

  // Determine if the user is anonymous based on the existing session's expiry.
  // We assume a standard user TTL is greater than the anon TTL.
  // A more robust method would be to store an `isAnon` flag in the DB.
  const isAnon =
    existing.expiresAt.getTime() - existing.expiresAt.getTime() <
    REFRESH_TOKEN_TTL_SEC * 1000;
  const nextExpiry = isAnon
    ? computeExpiry(ANON_REFRESH_TOKEN_TTL_SEC)
    : computeExpiry();

  const next = await prisma.$transaction(async (tx) => {
    // Revoke old (and mark lastUsedAt)
    await tx.authSession.update({
      where: { id: existing.id },
      data: {
        lastUsedAt: now,
        revokedAt: now,
        revokedReason: "rotated",
      },
    });

    // Create new in same family
    return tx.authSession.create({
      data: {
        userId: existing.userId,
        refreshHash,
        familyId: existing.familyId || existing.id, // seed family with self if legacy row
        rotatedFromId: existing.id,
        userAgent: meta?.ua ?? existing.userAgent,
        ip: meta?.ip ?? existing.ip,
        expiresAt: nextExpiry,
        lastUsedAt: null,
        revokedAt: null,
        revokedReason: null,
      },
    });
  });

  return next;
}

/** Revoke a specific refresh session (soft logout of that device). */
export async function revokeRefresh(
  prisma: PrismaClient,
  sessionId: string,
  reason = "manual-revoke",
) {
  return prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

/**
 * Optional: revoke an entire token family (useful for replay detection).
 * Call this if you detect an old token being used again after rotation.
 */
export async function revokeFamily(
  prisma: PrismaClient,
  familyId: string,
  reason = "family-revoke",
) {
  const now = new Date();
  return prisma.authSession.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: now, revokedReason: reason },
  });
}

/** Touch usage timestamp (analytics/telemetry). */
export async function markRefreshUsed(prisma: PrismaClient, sessionId: string) {
  return prisma.authSession.update({
    where: { id: sessionId },
    data: { lastUsedAt: new Date() },
  });
}

/**
 * Lookup a refresh session by raw token (from cookie).
 * Validates existence and returns the DB row (no expiry/revocation checks here).
 */
export async function findSessionByToken(
  prisma: PrismaClient,
  rawToken: string,
) {
  const refreshHash = hashRefreshToken(rawToken);
  return prisma.authSession.findUnique({ where: { refreshHash } });
}
