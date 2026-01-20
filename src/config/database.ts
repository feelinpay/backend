import { PrismaClient } from '@prisma/client';

// Singleton pattern for serverless environments
// Prevents creating multiple Prisma instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['warn', 'error'],
  // Disable prepared statements for Vercel serverless compatibility
  // Fixes "prepared statement already exists" error
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1',
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;