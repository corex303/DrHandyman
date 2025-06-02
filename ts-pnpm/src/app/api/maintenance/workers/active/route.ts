import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // REMOVED
// import { UserRole, Prisma } from '@prisma/client'; // UserRole might not be needed, Prisma might be if more complex queries arise
import { PrismaClient } from '@prisma/client'; // Ensure PrismaClient is imported

import prisma from '@/lib/prisma'; // Assuming this is your pre-configured Prisma client instance
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // REMOVED

// GET /api/maintenance/workers/active
// Fetches active maintenance workers.
// Assumes middleware has already validated the maintenance_session cookie.
export async function GET(request: Request) {
  // const session = await getServerSession(authOptions); // REMOVED

  // if (!session || !session.user || (session.user.role !== UserRole.MAINTENANCE && session.user.role !== UserRole.ADMIN)) { // REMOVED
  //   return NextResponse.json({ error: 'Unauthorized: Maintenance or Admin access required' }, { status: 401 }); // REMOVED
  // }

  try {
    const workers = await prisma.maintenanceWorker.findMany({
      where: {
        isActive: true, 
      },
      select: {
        id: true,
        name: true,
        // userId: true, // Include if the frontend needs to link back to a User record
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(workers);

  } catch (error) {
    console.error('Error fetching active maintenance workers:', error);
    return NextResponse.json({ error: 'Failed to fetch active maintenance workers' }, { status: 500 });
  }
}
