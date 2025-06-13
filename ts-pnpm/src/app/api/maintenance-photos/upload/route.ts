import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyMaintenanceSession } from '@/lib/auth/maintenance';

export async function POST(request: Request): Promise<NextResponse> {
  const { isAuthenticated } = verifyMaintenanceSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return NextResponse.json(blob);
} 