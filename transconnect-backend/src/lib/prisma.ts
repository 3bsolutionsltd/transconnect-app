import { DatabaseService } from '../services/database.service';

// Shared Prisma client singleton — import from here instead of from index.ts
// to avoid circular dependencies between index.ts and route files.
const dbService = DatabaseService.getInstance();
export const prisma = dbService.getPrismaClient();
