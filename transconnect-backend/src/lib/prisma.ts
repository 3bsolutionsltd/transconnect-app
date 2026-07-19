import { PrismaClient } from '@prisma/client';

// Shared Prisma client singleton — import from here instead of from index.ts
// to avoid circular dependencies between index.ts and route files.
// Using a direct PrismaClient (not DatabaseService) so routes work correctly
// in both test and production environments without URL parameter manipulation.
declare global {
  // eslint-disable-next-line no-var
  var __prismaLib: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prismaLib ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaLib = prisma;
}
