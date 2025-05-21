import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Validation schema for updating a service
const updateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and hyphenated e.g. concrete-repair').optional(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json(service);
  } catch (error) {
    console.error(`Error fetching service ${params.serviceId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  const token = await getToken({ req });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serviceId } = params;
  const body = await req.json();
  const validation = updateServiceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
  }

  const { name, description, slug, imageUrl } = validation.data;
  
  // Check if the service exists
  const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
  });

  if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // If slug is being updated, check for uniqueness
  if (slug && slug !== existingService.slug) {
    const existingServiceBySlug = await prisma.service.findUnique({
      where: { slug },
    });
    if (existingServiceBySlug) {
      return NextResponse.json({ error: 'Slug already exists. Please use a unique slug.' }, { status: 409 });
    }
  }
  
  // If name is being updated, check for uniqueness
  if (name && name !== existingService.name) {
      const existingServiceByName = await prisma.service.findUnique({
          where: { name },
      });
      if (existingServiceByName) {
          return NextResponse.json({ error: 'Service name already exists. Please use a unique name.' }, { status: 409 });
      }
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: {
      name,
      description,
      slug,
      imageUrl,
    },
  });
  return NextResponse.json(updatedService);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  const token = await getToken({ req });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serviceId } = params;

  try {
    // Check if the service exists before attempting to delete
    const existingService = await prisma.service.findUnique({
        where: { id: serviceId },
    });

    if (!existingService) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Add a check for related PortfolioItems. If any exist, prevent deletion or handle accordingly.
    const relatedPortfolioItems = await prisma.portfolioItem.count({
      where: { serviceId: serviceId },
    });

    if (relatedPortfolioItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service as it has related portfolio items. Please remove them first or reassign them.' },
        { status: 409 } // 409 Conflict is appropriate here
      );
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });
    return NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 }); // 200 OK or 204 No Content
  } catch (error) {
    console.error(`Error deleting service ${serviceId}:`, error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
} 