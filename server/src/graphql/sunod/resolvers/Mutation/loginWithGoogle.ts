import { setRefreshCookie } from "@src/auth/cookies";
import { signAccessToken } from "@src/auth/jwt";
import { newRefreshToken, persistRefresh } from "@src/auth/refresh";
import { OAuth2Client } from "google-auth-library";
import { GraphQLError } from "graphql";
import type { MutationResolvers } from "./../../../../schema/types.generated";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const badRequest = (msg: string) =>
  new GraphQLError(msg, { extensions: { code: "BAD_USER_INPUT" } });

export const loginWithGoogle: NonNullable<
  MutationResolvers["loginWithGoogle"]
> = async (_parent, { idToken }, ctx) => {
  if (!googleClient) throw badRequest("Google OAuth not configured");
  if (!idToken) throw badRequest("Missing Google ID token");

  // 1) Verify Google token (includes exp/iat/aud checks)
  let payload: Record<string, any> | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    payload = ticket.getPayload() ?? undefined;
  } catch {
    throw badRequest("Invalid Google token");
  }
  if (!payload) throw badRequest("Invalid Google token");

  const sub = payload.sub as string | undefined; // stable Google user id
  const email = (payload.email as string | undefined) ?? null;
  const emailVerified = payload.email_verified === true;

  if (!sub) throw badRequest("Google token missing subject");
  if (!email || !emailVerified) throw badRequest("Google email not verified");

  // 2) Find or create user (link by externalId first; else merge by email)
  // Use a transaction to avoid races on unique constraints
  const user = await ctx.prisma.$transaction(async (tx) => {
    // Try externalId
    let u = await tx.user.findUnique({ where: { externalId: sub } });
    if (u) {
      // Keep latest email/provider
      return tx.user.update({
        where: { id: u.id },
        data: { authProvider: "oauth-google", externalId: sub, email },
      });
    }

    // Try email (merge existing email-based account)
    if (email) {
      u = await tx.user.findUnique({ where: { email } });
      if (u) {
        return tx.user.update({
          where: { id: u.id },
          data: { authProvider: "oauth-google", externalId: sub, email },
        });
      }
    }

    // Create new user; best-effort handle
    const baseHandle =
      email
        ?.split("@")[0]
        .replace(/[^a-zA-Z0-9_]+/g, "")
        .slice(0, 24) ?? null;

    // Attempt with handle; on collision, fall back to null
    try {
      return await tx.user.create({
        data: {
          authProvider: "oauth-google",
          externalId: sub,
          email,
          handle: baseHandle,
        },
      });
    } catch {
      return tx.user.create({
        data: {
          authProvider: "oauth-google",
          externalId: sub,
          email,
          handle: null,
        },
      });
    }
  });

  // 3) Issue tokens
  const accessToken = signAccessToken(user.id, /* isAnon */ false, user.role);
  const refreshToken = newRefreshToken();

  // 4) Persist refresh (hash in DB) + set HttpOnly cookie (web)
  await persistRefresh(ctx.prisma, user.id, refreshToken, {
    ua: ctx.req.headers["user-agent"] as string | undefined,
    ip: ctx.req.ip,
  });
  setRefreshCookie(ctx.res, refreshToken);

  // 5) Return AuthPayload
  return { user, accessToken };
};
