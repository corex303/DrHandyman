import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define the context interface, typing params as a Promise
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const actualParams = await context.params;
  const { id } = actualParams;

  if (!id) {
    return NextResponse.json({ error: 'PhotoSet ID is required' }, { status: 400 });
  }

  // Optional: Add authentication/authorization checks here if needed
  // e.g., ensure only an admin or the relevant maintenance worker can fetch.
  // For now, assuming it's open or handled by a broader middleware.

  try {
    const photoSet = await prisma.photoSet.findUnique({
      where: { id },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            type: true,
            uploadedAt: true,
            photoSetId: true,
            filename: true,
            size: true,
            contentType: true,
          }
        },
        maintenanceWorker: {
          select: {
            id: true,
            name: true 
          }
        }
      },
    });

    if (!photoSet) {
      return NextResponse.json({ error: 'PhotoSet not found' }, { status: 404 });
    }

    return NextResponse.json(photoSet);
  } catch (error) {
    console.error(`Failed to fetch photo set ${id}:`, error);
    return NextResponse.json({ error: `Failed to fetch photo set ${id}` }, { status: 500 });
  }
} 