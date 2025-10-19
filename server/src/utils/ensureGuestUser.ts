// src/infra/prisma/ensureGuestUser.ts
import type { PrismaClient } from "@prisma/client";

export async function ensureGuestUser(prisma: PrismaClient, deviceId: string) {
  // Use externalId to make it idempotent; prefix with "guest:"
  const ext = `guest:${deviceId}`;
  let u = await prisma.user.findUnique({ where: { externalId: ext } });
  if (!u) {
    u = await prisma.user.create({
      data: {
        externalId: ext,
        authProvider: "anon",
        country: null,
        role: "USER",
      },
    });
  }
  return u;
}
