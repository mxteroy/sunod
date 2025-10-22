import type { AuthPayloadResolvers } from "./../../../schema/types.generated";
export const AuthPayload: AuthPayloadResolvers = {
  user: (parent) => parent.user,
  accessToken: (parent) => parent.accessToken,
};
