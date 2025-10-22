import type { SpaceResolvers } from "./../../../schema/types.generated";
export const Space: SpaceResolvers = {
  id: (parent) => parent.id,
  schema: (parent) => parent.schema,
  createdAt: (parent) =>
    typeof parent.createdAt === "string"
      ? parent.createdAt
      : parent.createdAt.toISOString(),
  updatedAt: (parent) =>
    typeof parent.updatedAt === "string"
      ? parent.updatedAt
      : parent.updatedAt.toISOString(),
};
