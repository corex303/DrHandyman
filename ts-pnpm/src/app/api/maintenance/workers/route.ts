import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMaintenanceSession } from '@/lib/auth/maintenance';
import { UserRole } from '@prisma/client';

export async function GET() {
  const { isAuthenticated } = verifyMaintenanceSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workers = await prisma.user.findMany({
      where: {
        role: UserRole.MAINTENANCE,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error('Failed to fetch maintenance workers:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 