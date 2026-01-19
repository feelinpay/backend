import { PrismaClient } from '@prisma/client';

// Singleton pattern for serverless environments
// Prevents creating multiple Prisma instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;