import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { Prisma, UserRole } from '../../../../../../generated/prisma-client'; // Adjusted path
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: session.user.id, // Exclude the current admin
        },
        // Fetch customers, other admins, and maintenance staff
        role: {
          in: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MAINTENANCE],
        },
      },
      select: {
        id: true,
        name: true,
        email: true, // Good for identification, even if not displayed
        image: true,
        role: true,
      },
      orderBy: [
        { role: 'asc' }, // Group by role
        { name: 'asc' }, // Then by name
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching chat participants:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors
        return NextResponse.json({ error: 'Database error while fetching participants.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch chat participants' }, { status: 500 });
  }
} 