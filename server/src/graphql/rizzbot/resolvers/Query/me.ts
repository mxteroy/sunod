import { GraphQLError } from "graphql";
import type { QueryResolvers } from "./../../../../schema/types.generated";

export const me: NonNullable<QueryResolvers["me"]> = async (_p, _a, ctx) => {
  // If client sent a token but it failed verification, force 401 to trigger refresh
  const hadAuthHeader = Boolean(ctx.req.headers.authorization);
  console.log("me ctx", ctx.userId);
  if (!ctx.userId) {
    if (hadAuthHeader && ctx.tokenProblem) {
      throw new GraphQLError("Unauthorized", {
        // The 401 lets the client know to try refresh tokens
        extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
      });
    }
    return null; // truly anonymous
  }
  console.log("hadAuthHeader", ctx.userRole);

  return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
};
