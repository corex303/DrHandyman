import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMaintenanceSession } from '@/lib/auth/maintenance';
import { UserRole } from '@prisma/client';

// This new API route provides the necessary user context for the chat system.
// It is protected by the simple cookie-based session.

export async function GET() {
  // First, verify the simple maintenance session cookie exists.
  const { isAuthenticated } = verifyMaintenanceSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Next, fetch the dedicated, shared maintenance user account.
  // The email for this account MUST be set as an environment variable.
  const maintenanceEmail = process.env.MAINTENANCE_USER_EMAIL;
  if (!maintenanceEmail) {
    console.error('CRITICAL: MAINTENANCE_USER_EMAIL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const maintenanceUser = await prisma.user.findUnique({
      where: {
        email: maintenanceEmail,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!maintenanceUser || maintenanceUser.role !== UserRole.MAINTENANCE) {
      console.error(`A user with email ${maintenanceEmail} was not found or is not a maintenance user.`);
      return NextResponse.json({ error: 'Maintenance user account not found or misconfigured.' }, { status: 500 });
    }

    // Return the essential details of the shared maintenance user.
    return NextResponse.json({
      id: maintenanceUser.id,
      name: maintenanceUser.name,
    });

  } catch (error) {
    console.error('Failed to fetch maintenance user session:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 