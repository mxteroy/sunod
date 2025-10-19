/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import { UserRole } from "@prisma/client";
import type { Resolvers } from "./types.generated";
import { me as Query_me } from "./../graphql/rizzbot/resolvers/Query/me";
import { loginAnonymous as Mutation_loginAnonymous } from "./../graphql/rizzbot/resolvers/Mutation/loginAnonymous";
import { loginWithEmail as Mutation_loginWithEmail } from "./../graphql/rizzbot/resolvers/Mutation/loginWithEmail";
import { loginWithGoogle as Mutation_loginWithGoogle } from "./../graphql/rizzbot/resolvers/Mutation/loginWithGoogle";
import { logout as Mutation_logout } from "./../graphql/rizzbot/resolvers/Mutation/logout";
import { refreshSession as Mutation_refreshSession } from "./../graphql/rizzbot/resolvers/Mutation/refreshSession";
import { registerWithEmail as Mutation_registerWithEmail } from "./../graphql/rizzbot/resolvers/Mutation/registerWithEmail";
import { AuthPayload } from "./../graphql/rizzbot/resolvers/AuthPayload";
import { RefreshPayload } from "./../graphql/rizzbot/resolvers/RefreshPayload";
import { User } from "./../graphql/rizzbot/resolvers/User";
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
  User: User,
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  UserRole: UserRole,
};
