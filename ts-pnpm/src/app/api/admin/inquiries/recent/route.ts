import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';

export async function GET() {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inquiries = await prisma.inquiry.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        subject: true,
        createdAt: true,
      },
    });

    return NextResponse.json(inquiries);
  } catch (err) {
    console.error('Error fetching recent inquiries:', err);
    return NextResponse.json({ error: 'Failed to fetch recent inquiries' }, { status: 500 });
  }
} 