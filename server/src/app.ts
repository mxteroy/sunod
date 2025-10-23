import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import logger from "morgan";

import { startGraphQL } from "@/graphql";

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

// Export async function to initialize GraphQL and return httpServer
export async function initializeServer() {
  console.log("starting GraphQL server...");
  const httpServer = await startGraphQL(app);
  console.log("GraphQL server initialized");
  return httpServer;
}

export default app;
