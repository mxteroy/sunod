import { setRefreshCookie } from "@src/auth/cookies";
import { signAccessToken } from "@src/auth/jwt";
import { newRefreshToken, persistRefresh } from "@src/auth/refresh";
import type { MutationResolvers } from "./../../../../schema/types.generated";

export const loginAnonymous: NonNullable<
  MutationResolvers["loginAnonymous"]
> = async (_parent, _arg, ctx) => {
  // TODO (optional): rate-limit by IP/UA to prevent anon abuse
  const user = await ctx.prisma.user.create({
    data: { authProvider: "anon" }, // ensure any NOT NULL defaults exist in your Prisma model
  });

  // Access: short-lived, mark anon and include role if your signer supports it
  const accessToken = signAccessToken(user.id, /* isAnon */ true, user.role);

  // Refresh: long-lived, persisted (hashed) and set as HttpOnly cookie for web
  const refreshToken = newRefreshToken();
  await persistRefresh(
    ctx.prisma,
    user.id,
    refreshToken,
    {
      ua: ctx.req.headers["user-agent"] as string | undefined,
      ip: ctx.req.ip,
    },
    true /* isAnon */,
  );

  // Web: cookie; Mobile: return token
  const isBrowser = !!ctx.req.headers.origin;
  if (isBrowser) {
    setRefreshCookie(ctx.res, refreshToken);
  }

  return {
    user, // your GraphQL type expects the full user
    accessToken,
    // If your schema allows, you can optionally return refreshToken for mobile:
    refreshToken: isBrowser ? null : refreshToken,
  };
};
