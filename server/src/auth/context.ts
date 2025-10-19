import type { PrismaClient } from "@prisma/client";
import { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { GraphQLError } from "graphql";
import { PubSub } from "graphql-subscriptions";
import { verifyAccessToken } from "./jwt";

export type Context = {
  prisma: PrismaClient;
  pubsub: PubSub;
  req: Request;
  res: Response;
  userId: string | null;
  anon: boolean;
  userRole?: UserRole;
  tokenProblem: "invalid" | "expired" | null;
  now: () => Date;
  requireUser: () => string;
  requireMod: () => void;
};

export function buildContext(prisma: PrismaClient, pubsub: PubSub) {
  return async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }): Promise<Context> => {
    // buildContext.ts
    const rawAuth = req.headers.authorization || null;
    const header = rawAuth?.replace(/^Bearer\s+/i, "") || null;

    let userId: string | null = null;
    let anon = false;
    let userRole: UserRole | undefined;
    let tokenProblem: "invalid" | "expired" | null = null;

    if (header) {
      // verifyAccessToken returns null on invalid/expired
      const claims = verifyAccessToken(header);
      if (claims) {
        userId = claims.sub ?? null;
        anon = !!claims.anon;
        userRole = claims.role;
      } else {
        tokenProblem = "invalid"; // or "expired" if you can distinguish
      }
    }

    if (userId && !userRole) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      userRole = u?.role;
    }

    console.log(
      `[${(req as any).rid}] userId=${userId} tokenProblem=${tokenProblem ?? "none"}`,
    );

    return {
      prisma,
      pubsub,
      req,
      res,
      userId,
      anon,
      userRole,
      tokenProblem, // <-- expose it
      now: () => new Date(),
      requireUser() {
        if (!userId)
          throw new GraphQLError("Unauthorized", {
            extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
          });
        return userId;
      },
      requireMod() {
        if (userRole !== "MOD" && userRole !== "ADMIN") {
          throw new GraphQLError("Forbidden: Moderator access required", {
            extensions: { code: "FORBIDDEN", http: { status: 403 } },
          });
        }
      },
    };
  };
}
