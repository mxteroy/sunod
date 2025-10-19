import type { RefreshPayloadResolvers } from "./../../../schema/types.generated";
export const RefreshPayload: RefreshPayloadResolvers = {
  accessToken: (parent) => parent.accessToken,
};
