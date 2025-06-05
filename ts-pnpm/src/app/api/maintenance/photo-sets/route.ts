import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // const session = await getServerSession(authOptions);

  // if (!session || !session.user || session.user.role !== UserRole.MAINTENANCE) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // Assuming middleware has already validated the maintenance_session cookie.
  // If not, a middleware check would be needed here or at the Edge.

  try {
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email! }, 
    //   include: {
    //     maintenanceWorker: true, 
    //   },
    // });

    // if (!user || !user.maintenanceWorker) {
    //   return NextResponse.json({ error: 'Maintenance worker profile not found for this user.' }, { status: 404 });
    // }

    // const maintenanceWorkerId = user.maintenanceWorker.id;

    const photoSets = await prisma.photoSet.findMany({
      // if (!maintenanceWorkerId) {
      //   return NextResponse.json({ error: 'Maintenance worker ID not found' }, { status: 500 });
      // }
      include: {
        photos: { // Include related photos for dashboard preview
          orderBy: {
            // Optional: order by type then by upload time if desired
            // type: 'asc',
            uploadedAt: 'asc',
          },
          take: 6, // Show up to 6 photos in the dashboard preview
        },
        // We could also include customer details if needed via the customer relation on PhotoSet
        // customer: true, 
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json(photoSets);

  } catch (error) {
    console.error('Failed to fetch photo sets:', error);
    return NextResponse.json({ error: 'Failed to fetch photo sets' }, { status: 500 });
  }
} 