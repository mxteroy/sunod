import { Context } from "@src/auth/context";

// If you allow the daily challenge without an account, don't hard-require auth.
export async function requirePlayerIfNeeded(
  ctx: Context,
): Promise<string | null> {
  try {
    // your existing requirePlayer(ctx) could live here if session requires it
    return ctx.userId;
  } catch {
    return null;
  }
}
