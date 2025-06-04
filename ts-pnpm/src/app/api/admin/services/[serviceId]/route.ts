import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';

import prisma from '@/lib/prisma';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

// Validation schema for updating a service
const updateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and hyphenated e.g. concrete-repair').optional(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

export async function GET(request: NextRequest, props: { params: Promise<{ serviceId: string }> }) {
  const params = await props.params;
  const adminCookie = (await cookies()).get(ADMIN_COOKIE_NAME);
  if (!adminCookie || adminCookie.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
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

export async function PUT(req: NextRequest, props: { params: Promise<{ serviceId: string }> }) {
  const params = await props.params;
  const adminCookie = (await cookies()).get(ADMIN_COOKIE_NAME);
  if (!adminCookie || adminCookie.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serviceId } = params;
  const body = await req.json();
  const validation = updateServiceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
  }

  const { name, description, slug, imageUrl } = validation.data;

  const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
  });

  if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  if (slug && slug !== existingService.slug) {
    const existingServiceBySlug = await prisma.service.findUnique({
      where: { slug },
    });
    if (existingServiceBySlug) {
      return NextResponse.json({ error: 'Slug already exists. Please use a unique slug.' }, { status: 409 });
    }
  }

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

export async function DELETE(req: NextRequest, props: { params: Promise<{ serviceId: string }> }) {
  const params = await props.params;
  const adminCookie = (await cookies()).get(ADMIN_COOKIE_NAME);
  if (!adminCookie || adminCookie.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serviceId } = params;

  try {
    const existingService = await prisma.service.findUnique({
        where: { id: serviceId },
    });

    if (!existingService) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const relatedPortfolioItems = await prisma.portfolioItem.count({
      where: { serviceId: serviceId },
    });

    if (relatedPortfolioItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service as it has related portfolio items. Please remove them first or reassign them.' },
        { status: 409 }
      );
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });
    return NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting service ${serviceId}:`, error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
} 