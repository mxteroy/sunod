import { setRefreshCookie } from "@src/auth/cookies";
import { signAccessToken } from "@src/auth/jwt";
import { hashPassword } from "@src/auth/password";
import { newRefreshToken, persistRefresh } from "@src/auth/refresh";
import { isValidEmail, isValidPassword } from "@src/auth/validate";
import type { MutationResolvers } from "../../../../schema/types.generated";

export const registerWithEmail: NonNullable<
  MutationResolvers["registerWithEmail"]
> = async (_parent, { email, password }, ctx) => {
  if (!isValidEmail(email)) throw new Error("Invalid email");
  if (!isValidPassword(password)) throw new Error("Password too weak");

  // Ensure not taken
  const existing = await ctx.prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await hashPassword(password);

  const user = await ctx.prisma.user.create({
    data: {
      email,
      passwordHash,
      authProvider: "password",
      // you can set handle later via profile screen
    },
  });

  const accessToken = signAccessToken(user.id, false);
  const refresh = newRefreshToken();
  await persistRefresh(ctx.prisma, user.id, refresh, {
    ua: ctx.req.headers["user-agent"],
    ip: ctx.req.ip,
  });
  setRefreshCookie(ctx.res, refresh);

  return { user, accessToken };
};
