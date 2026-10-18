import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent creating a new Prisma connection pool during hot reload in development.
  // eslint-disable-next-line no-var
  var outlierPrisma: PrismaClient | undefined;
}

export const db = globalThis.outlierPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.outlierPrisma = db;
