import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientGithub } from "@prisma/github-client";

import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
const createPrismaClientGithub = () =>
  new PrismaClientGithub({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  prismaGithub: ReturnType<typeof createPrismaClientGithub> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();
export const dbGithub =
  globalForPrisma.prismaGithub ?? createPrismaClientGithub();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
if (env.NODE_ENV !== "production") globalForPrisma.prismaGithub = dbGithub;
