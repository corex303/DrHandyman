import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

// This record ID will be used to ensure only one record exists and is updated.
const GLOBAL_STAFF_ACTIVITY_RECORD_ID = 'singleton_staff_activity';

export async function GET() {
  try {
    const activityRecord = await prisma.globalStaffActivity.findUnique({
      where: { id: GLOBAL_STAFF_ACTIVITY_RECORD_ID },
    });

    if (!activityRecord || !activityRecord.lastActivePing) {
      return NextResponse.json({ isActive: false, lastSeen: null });
    }

    const now = new Date();
    const isActive = (now.getTime() - new Date(activityRecord.lastActivePing).getTime()) < FIVE_MINUTES_IN_MS;

    return NextResponse.json({
      isActive: isActive,
      lastSeen: activityRecord.lastActivePing.toISOString(),
    });

  } catch (error) {
    console.error('Error fetching global staff activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 