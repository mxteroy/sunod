import { setRefreshCookie } from "@src/auth/cookies";
import { signAccessToken } from "@src/auth/jwt";
import { verifyPassword } from "@src/auth/password";
import { newRefreshToken, persistRefresh } from "@src/auth/refresh";
import type { MutationResolvers } from "../../../../schema/types.generated";

export const loginWithEmail: NonNullable<
  MutationResolvers["loginWithEmail"]
> = async (_parent, { email, password }, ctx) => {
  const user = await ctx.prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new Error("Invalid credentials");

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new Error("Invalid credentials");

  console.log("User logged in:", user.id, user.email, user.role);

  const accessToken = signAccessToken(user.id, false);
  const refresh = newRefreshToken();
  await persistRefresh(ctx.prisma, user.id, refresh, {
    ua: ctx.req.headers["user-agent"],
    ip: ctx.req.ip,
  });
  setRefreshCookie(ctx.res, refresh);

  return { user, accessToken };
};
