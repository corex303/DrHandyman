import { NextResponse } from 'next/server';
import { PrismaClient, ApprovalStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for status update validation
const updateStatusSchema = z.object({
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'PhotoSet ID is required' }, { status: 400 });
  }

  // Assuming middleware has already validated the maintenance_session cookie
  // AND that only authorized admins can perform this action.
  // Additional role checks might be needed here if not handled by a generic middleware.

  try {
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid status provided', details: validation.error.flatten() }, { status: 400 });
    }

    const { status } = validation.data;

    const updatedPhotoSet = await prisma.photoSet.update({
      where: { id },
      data: {
        status: status,
        // Optionally, set an reviewedAt timestamp or reviewedBy admin ID if your schema supports it
      },
    });

    if (!updatedPhotoSet) {
      return NextResponse.json({ error: 'PhotoSet not found or could not be updated' }, { status: 404 });
    }

    return NextResponse.json(updatedPhotoSet);

  } catch (error) {
    console.error(`Failed to update status for photo set ${id}:`, error);
    if (error instanceof SyntaxError) { // Handle cases where request body is not valid JSON
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: `Failed to update status for photo set ${id}` }, { status: 500 });
  }
} 