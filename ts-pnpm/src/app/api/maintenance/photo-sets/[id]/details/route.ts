import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define the context interface, typing params as a Promise
interface RouteContext {
  params: Promise<{ // Params is now a Promise
    id: string;
  }>;
}

const updateDetailsSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) { // Changed params to context: RouteContext
  const actualParams = await context.params; // Await params
  const { id } = actualParams; // Use awaited params

  if (!id) {
    return NextResponse.json({ error: 'PhotoSet ID is required' }, { status: 400 });
  }

  // Authentication & Authorization:
  // Assuming middleware has validated the maintenance_session cookie.
  // Further checks might be needed to ensure only an ADMIN role can perform this.
  // For now, proceeding with the assumption that only authorized users reach this.

  try {
    const body = await request.json();
    const validation = updateDetailsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data provided', details: validation.error.flatten() }, { status: 400 });
    }

    const { title, description } = validation.data;

    // Construct update data object conditionally
    const updateData: { title?: string; description?: string } = {};
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const updatedPhotoSet = await prisma.photoSet.update({
      where: { id },
      data: updateData,
      include: { // Return the updated photoset with worker details
        maintenanceWorker: {
          select: {
            id: true,
            name: true,
          },
        },
        photos: { // Also include photos as the detail page might need to re-render them
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
        }
      },
    });

    if (!updatedPhotoSet) {
      return NextResponse.json({ error: 'PhotoSet not found or could not be updated' }, { status: 404 });
    }

    return NextResponse.json(updatedPhotoSet);

  } catch (error) {
    console.error(`Failed to update details for photo set ${id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: `Failed to update details for photo set ${id}` }, { status: 500 });
  }
} 