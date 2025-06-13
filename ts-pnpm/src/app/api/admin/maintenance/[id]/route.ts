import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  serviceFusionId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const worker = await prisma.maintenanceWorker.findUnique({
      where: { id: params.id },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error(`Error fetching worker ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const { name, email, serviceFusionId, isActive } = validation.data;

    const existingWorker = await prisma.maintenanceWorker.findUnique({ where: { id: params.id } });
    if (!existingWorker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Check for unique constraints
    if (email && email !== existingWorker.email) {
        const existingByEmail = await prisma.maintenanceWorker.findUnique({ where: { email } });
        if (existingByEmail) {
            return NextResponse.json({ error: { email: ['Email already in use.'] } }, { status: 409 });
        }
    }
    if (name !== existingWorker.name) {
        const existingByName = await prisma.maintenanceWorker.findUnique({ where: { name } });
        if (existingByName) {
            return NextResponse.json({ error: { name: ['Name already in use.'] } }, { status: 409 });
        }
    }

    const updatedWorker = await prisma.maintenanceWorker.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        serviceFusionId: serviceFusionId || null,
        isActive,
      },
    });

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error(`Error updating worker ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const worker = await prisma.maintenanceWorker.findUnique({
        where: { id: params.id },
    });

    if (!worker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    await prisma.maintenanceWorker.delete({
      where: { id: params.id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting worker ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 