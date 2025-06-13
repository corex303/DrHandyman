import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/inquiries/[id]
 * Retrieves a single inquiry.
 */
export async function GET(req: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
    });
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error(`Error fetching inquiry ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/inquiries/[id]
 * Updates an inquiry.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(updatedInquiry);
  } catch (error) {
    console.error(`Error updating inquiry ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/inquiries/[id]
 * Deletes an inquiry.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    await prisma.inquiry.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error(`Error deleting inquiry ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 