import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This record ID will be used to ensure only one record exists and is updated.
const GLOBAL_STAFF_ACTIVITY_RECORD_ID = 'singleton_staff_activity';

export async function POST() {
  try {
    // Upsert the record: update if exists, create if not.
    // The ID is fixed, so this will always target the same record.
    await prisma.globalStaffActivity.upsert({
      where: { id: GLOBAL_STAFF_ACTIVITY_RECORD_ID },
      update: {
        lastActivePing: new Date(), // This will trigger @updatedAt implicitly as well
      },
      create: {
        id: GLOBAL_STAFF_ACTIVITY_RECORD_ID,
        lastActivePing: new Date(), // Set on creation
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in staff ping activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 