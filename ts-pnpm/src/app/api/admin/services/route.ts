import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

// Validation schema for creating a service
const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and hyphenated e.g. concrete-repair'),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!adminCookie || adminCookie.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!adminCookie || adminCookie.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = createServiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const { name, description, slug, imageUrl } = validation.data;

    // Check if slug is unique
    const existingServiceBySlug = await prisma.service.findUnique({
      where: { slug },
    });

    if (existingServiceBySlug) {
      return NextResponse.json({ error: 'Slug already exists. Please use a unique slug.' }, { status: 409 });
    }
    
    // Check if name is unique
    const existingServiceByName = await prisma.service.findUnique({
      where: { name },
    });

    if (existingServiceByName) {
        return NextResponse.json({ error: 'Service name already exists. Please use a unique name.' }, { status: 409 });
    }

    const newService = await prisma.service.create({
      data: {
        name,
        description,
        slug,
        imageUrl,
      },
    });
    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('slug')) {
          return NextResponse.json({ error: 'Slug already exists. Please use a unique slug.' }, { status: 409 });
        }
        if (target?.includes('name')) {
            return NextResponse.json({ error: 'Service name already exists. Please use a unique name.' }, { status: 409 });
        }
      }
    }
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
} 