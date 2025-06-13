import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';
import { ApprovalStatus } from '@prisma/client';

export async function GET(request: Request) {
  const { isAuthenticated } = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  try {
    const [pendingPhotoSets, total] = await prisma.$transaction([
      prisma.photoSet.findMany({
        where: {
          status: ApprovalStatus.PENDING,
        },
        include: {
          maintenanceWorker: {
            select: {
              name: true,
            },
          },
          photos: {
            take: 1, // Only take one photo for thumbnail preview
            orderBy: {
              uploadedAt: 'asc',
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.photoSet.count({
        where: {
          status: ApprovalStatus.PENDING,
        },
      }),
    ]);

    return NextResponse.json({
      data: pendingPhotoSets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch pending portfolio approvals:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 