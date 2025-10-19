import type { UserResolvers } from "./../../../schema/types.generated";

export const User: UserResolvers = {
  id: (parent) => parent.id,
  country: (parent) => parent.country,
  handle: (parent) => parent.handle,
  role: (parent) => parent.role,
};
