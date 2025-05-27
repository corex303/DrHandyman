import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrisma() {
  console.log(UserRole.ADMIN);
  const user = await prisma.user.findFirst();
  console.log(user);
}

testPrisma();
