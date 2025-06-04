import { PrismaClient } from '../../generated/prisma-client';

console.log("[lib/prisma.ts] Initializing Prisma Client...");
console.log("[lib/prisma.ts] DATABASE_URL from env:", process.env.DATABASE_URL);

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
console.log("[lib/prisma.ts] Prisma Client instance created/retrieved.");

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  console.log("[lib/prisma.ts] Prisma Client stored in global for development.");
}

export default prisma; 