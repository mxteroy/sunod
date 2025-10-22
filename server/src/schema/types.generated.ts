import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from "graphql";
import {
  UserRole as PrismaUserRole,
  User as PrismaUser,
  Space as PrismaSpace,
} from "@prisma/client";
import { Context } from "@src/auth/context";
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
export type EnumResolverSignature<T, AllowedValues = any> = {
  [key in keyof T]?: AllowedValues;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string | number };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: Date | string; output: Date | string };
  JSON: { input: any; output: any };
  _FieldSet: { input: any; output: any };
};

export type AuthPayload = {
  __typename?: "AuthPayload";
  accessToken: Scalars["String"]["output"];
  user: User;
};

export type Mutation = {
  __typename?: "Mutation";
  loginAnonymous: AuthPayload;
  loginWithEmail: AuthPayload;
  loginWithGoogle: AuthPayload;
  logout: Scalars["Boolean"]["output"];
  refreshSession: RefreshPayload;
  registerWithEmail: AuthPayload;
};

export type MutationloginWithEmailArgs = {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type MutationloginWithGoogleArgs = {
  idToken: Scalars["String"]["input"];
};

export type MutationregisterWithEmailArgs = {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type Query = {
  __typename?: "Query";
  me: Maybe<User>;
};

export type RefreshPayload = {
  __typename?: "RefreshPayload";
  accessToken: Scalars["String"]["output"];
};

export type Space = {
  __typename?: "Space";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  schema: Scalars["JSON"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type User = {
  __typename?: "User";
  country: Maybe<Scalars["String"]["output"]>;
  handle: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  role: UserRole;
};

export type UserRole = "ADMIN" | "MOD" | "USER";

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AuthPayload: ResolverTypeWrapper<
    Omit<AuthPayload, "user"> & { user: ResolversTypes["User"] }
  >;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  Mutation: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Query: ResolverTypeWrapper<{}>;
  RefreshPayload: ResolverTypeWrapper<RefreshPayload>;
  Space: ResolverTypeWrapper<PrismaSpace>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  User: ResolverTypeWrapper<PrismaUser>;
  UserRole: ResolverTypeWrapper<PrismaUserRole>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AuthPayload: Omit<AuthPayload, "user"> & {
    user: ResolversParentTypes["User"];
  };
  String: Scalars["String"]["output"];
  DateTime: Scalars["DateTime"]["output"];
  JSON: Scalars["JSON"]["output"];
  Mutation: {};
  Boolean: Scalars["Boolean"]["output"];
  Query: {};
  RefreshPayload: RefreshPayload;
  Space: PrismaSpace;
  ID: Scalars["ID"]["output"];
  User: PrismaUser;
}>;

export type AuthPayloadResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["AuthPayload"] = ResolversParentTypes["AuthPayload"],
> = ResolversObject<{
  accessToken: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  user: Resolver<ResolversTypes["User"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export interface JSONScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type MutationResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  loginAnonymous: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType
  >;
  loginWithEmail: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType,
    RequireFields<MutationloginWithEmailArgs, "email" | "password">
  >;
  loginWithGoogle: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType,
    RequireFields<MutationloginWithGoogleArgs, "idToken">
  >;
  logout: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  refreshSession: Resolver<
    ResolversTypes["RefreshPayload"],
    ParentType,
    ContextType
  >;
  registerWithEmail: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType,
    RequireFields<MutationregisterWithEmailArgs, "email" | "password">
  >;
}>;

export type QueryResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  me: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>;
}>;

export type RefreshPayloadResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["RefreshPayload"] = ResolversParentTypes["RefreshPayload"],
> = ResolversObject<{
  accessToken: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SpaceResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Space"] = ResolversParentTypes["Space"],
> = ResolversObject<{
  createdAt: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  schema: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  updatedAt: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["User"] = ResolversParentTypes["User"],
> = ResolversObject<{
  country: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  handle: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  id: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  role: Resolver<ResolversTypes["UserRole"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserRoleResolvers = EnumResolverSignature<
  { ADMIN: any; MOD: any; USER: any },
  ResolversTypes["UserRole"]
>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  AuthPayload: AuthPayloadResolvers<ContextType>;
  DateTime: GraphQLScalarType;
  JSON: GraphQLScalarType;
  Mutation: MutationResolvers<ContextType>;
  Query: QueryResolvers<ContextType>;
  RefreshPayload: RefreshPayloadResolvers<ContextType>;
  Space: SpaceResolvers<ContextType>;
  User: UserResolvers<ContextType>;
  UserRole: UserRoleResolvers;
}>;
