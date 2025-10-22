import { REFRESH_COOKIE } from "@src/auth/constants";
import { clearAuthCookies } from "@src/auth/cookies";
import { hashRefresh, revokeRefresh } from "@src/auth/refresh";
import type { MutationResolvers } from "./../../../../schema/types.generated";

export const logout: NonNullable<MutationResolvers["logout"]> = async (
  _parent,
  _arg,
  _ctx,
) => {
  const token = (_ctx.req as any).cookies?.[REFRESH_COOKIE];
  if (token) {
    const s = await _ctx.prisma.authSession.findFirst({
      where: { refreshHash: hashRefresh(token) },
    });
    if (s) await revokeRefresh(_ctx.prisma, s.id);
  }
  clearAuthCookies(_ctx.res);
  return true;
};
