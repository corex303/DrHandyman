import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const workers = await prisma.maintenanceWorker.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    console.log("Fetched workers from DB:", workers);
    return NextResponse.json(workers);
  } catch (error) {
    console.error('Error fetching maintenance workers from DB:', error);
    return NextResponse.json(
      { message: 'Failed to fetch workers.', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
