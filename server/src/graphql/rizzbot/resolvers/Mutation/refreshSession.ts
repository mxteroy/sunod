import { REFRESH_COOKIE } from "@src/auth/constants";
import { setRefreshCookie } from "@src/auth/cookies";
import { signAccessToken } from "@src/auth/jwt";
import { hashRefresh, newRefreshToken } from "@src/auth/refresh";
import { GraphQLError } from "graphql";
import type { MutationResolvers } from "./../../../../schema/types.generated";

const unauth = (msg = "Unauthorized") =>
  new GraphQLError(msg, {
    extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
  });

export const refreshSession: NonNullable<
  MutationResolvers["refreshSession"]
> = async (_parent, _arg, ctx) => {
  // 1) Read refresh token from cookie (web flow)
  const rt = ctx.req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rt) throw unauth("No refresh token");

  const now = new Date();
  const rtHash = hashRefresh(rt);

  // 2) Look up refresh session by hash
  const existing = await ctx.prisma.authSession.findUnique({
    where: { refreshHash: rtHash },
  });

  if (!existing) throw unauth("Invalid refresh token");

  // If this token was already rotated/revoked, treat as reuse
  if (existing.revokedAt) {
    // Optional stricter policy: revoke entire family on reuse
    // await ctx.prisma.authSession.updateMany({
    //   where: { familyId: existing.familyId ?? existing.id, revokedAt: null },
    //   data: { revokedAt: now, revokedReason: "replay-detected" },
    // });
    throw unauth("Refresh token reused or revoked");
  }

  if (existing.expiresAt <= now) throw unauth("Refresh token expired");

  // 3) Load user (defense in depth)
  const user = await ctx.prisma.user.findUnique({
    where: { id: existing.userId },
    select: { id: true, authProvider: true, role: true },
  });
  if (!user) {
    await ctx.prisma.authSession.update({
      where: { id: existing.id },
      data: { revokedAt: now, revokedReason: "user-missing" },
    });
    throw unauth("User not found");
  }

  // 4) Rotate refresh (atomic)
  const nextRt = newRefreshToken();
  const nextHash = hashRefresh(nextRt);
  const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS ?? 30);
  const nextExpiresAt = new Date(
    now.getTime() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await ctx.prisma.$transaction([
    ctx.prisma.authSession.update({
      where: { id: existing.id },
      data: {
        lastUsedAt: now,
        revokedAt: now,
        revokedReason: "rotated",
      },
    }),
    ctx.prisma.authSession.create({
      data: {
        userId: existing.userId,
        refreshHash: nextHash,
        familyId: existing.familyId ?? existing.id, // seed family with self if null
        rotatedFromId: existing.id,
        ip: ctx.req.ip,
        userAgent:
          (ctx.req.headers["user-agent"] as string | undefined) ?? null,
        expiresAt: nextExpiresAt,
      },
    }),
  ]);

  // 5) Send new refresh cookie (HttpOnly; Secure; SameSite as configured)
  setRefreshCookie(ctx.res, nextRt);

  // 6) Mint short-lived access token
  const accessToken = signAccessToken(
    user.id,
    user.authProvider === "anon",
    user.role, // include if your signer supports role; otherwise remove
  );

  return { accessToken };
};
