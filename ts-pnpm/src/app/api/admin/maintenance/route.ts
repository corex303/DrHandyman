import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  serviceFusionId: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const workers = await prisma.maintenanceWorker.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return NextResponse.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = workerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, serviceFusionId } = validation.data;

    // Check for unique constraints
    if (email) {
        const existingByEmail = await prisma.maintenanceWorker.findUnique({ where: { email } });
        if (existingByEmail) {
            return NextResponse.json({ error: { email: ['Email already in use.'] } }, { status: 409 });
        }
    }
    const existingByName = await prisma.maintenanceWorker.findUnique({ where: { name } });
    if (existingByName) {
        return NextResponse.json({ error: { name: ['Name already in use.'] } }, { status: 409 });
    }
    

    const newWorker = await prisma.maintenanceWorker.create({
      data: {
        name,
        email: email || null,
        serviceFusionId: serviceFusionId || null,
      },
    });

    return NextResponse.json(newWorker, { status: 201 });
  } catch (error) {
    console.error('Error creating worker:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 