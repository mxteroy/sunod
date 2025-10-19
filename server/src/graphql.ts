import type { Express } from "express";

import { resolvers } from "@/schema/resolvers.generated";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { PrismaClient } from "@prisma/client";
import { buildContext, Context } from "@src/auth/context";
import cors from "cors";
import express from "express";
import { PubSub } from "graphql-subscriptions";
import http from "http";
import { typeDefs } from "./schema/typeDefs.generated";

const pubsub = new PubSub();
const prisma = new PrismaClient();

export async function startGraphQL(app: Express) {
  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // Ensure we wait for our server to start
  await server.start();

  // Set up our Express middleware to handle CORS, body parsing,
  // and our expressMiddleware function.
  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGINS?.split(",") || [],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF"],
      methods: ["POST", "GET", "OPTIONS"],
    }),
    express.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware<Context>(server, {
      context: buildContext(prisma, pubsub),
    }),
  );
}
