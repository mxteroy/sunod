/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import { UserRole } from "@prisma/client";
import type { Resolvers } from "./types.generated";
import { me as Query_me } from "./../graphql/sunod/resolvers/Query/me";
import { loginAnonymous as Mutation_loginAnonymous } from "./../graphql/sunod/resolvers/Mutation/loginAnonymous";
import { loginWithEmail as Mutation_loginWithEmail } from "./../graphql/sunod/resolvers/Mutation/loginWithEmail";
import { loginWithGoogle as Mutation_loginWithGoogle } from "./../graphql/sunod/resolvers/Mutation/loginWithGoogle";
import { logout as Mutation_logout } from "./../graphql/sunod/resolvers/Mutation/logout";
import { refreshSession as Mutation_refreshSession } from "./../graphql/sunod/resolvers/Mutation/refreshSession";
import { registerWithEmail as Mutation_registerWithEmail } from "./../graphql/sunod/resolvers/Mutation/registerWithEmail";
import { AuthPayload } from "./../graphql/sunod/resolvers/AuthPayload";
import { RefreshPayload } from "./../graphql/sunod/resolvers/RefreshPayload";
import { Space } from "./../graphql/sunod/resolvers/Space";
import { User } from "./../graphql/sunod/resolvers/User";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
export const resolvers: Resolvers = {

  Query: { me: Query_me },
  Mutation: {
    loginAnonymous: Mutation_loginAnonymous,
    loginWithEmail: Mutation_loginWithEmail,
    loginWithGoogle: Mutation_loginWithGoogle,
    logout: Mutation_logout,
    refreshSession: Mutation_refreshSession,
    registerWithEmail: Mutation_registerWithEmail,
  },

  AuthPayload: AuthPayload,
  RefreshPayload: RefreshPayload,
  Space: Space,
  User: User,
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  UserRole: UserRole,
};
