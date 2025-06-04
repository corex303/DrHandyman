import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v2 as cloudinary } from 'cloudinary';

import prisma from '@/lib/prisma'; // Assuming prisma client is at lib/prisma

import { authOptions } from '@/lib/auth/options';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uploaderId = session.user.id;

  const { searchParams } = new URL(request.url);
  const originalFilename = searchParams.get('filename');

  if (!originalFilename) {
    return NextResponse.json(
      { error: 'Missing filename query parameter' },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { error: 'Missing request body' },
      { status: 400 }
    );
  }

  // Construct the desired pathname, including the folder
  const pathname = `maintenance-photos/${originalFilename}`;

  try {
    const blob = await put(pathname, request.body, {
      access: 'public',
      addRandomSuffix: true, // Vercel will add a random suffix for uniqueness
    });

    // Save image metadata to database
    const imageRecord = await prisma.image.create({
      data: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        uploaderId: uploaderId,
        purpose: 'MAINTENANCE_PHOTO', // Categorize the image
        // altText and description can be added later if needed
      },
    });

    return NextResponse.json({ ...blob, imageId: imageRecord.id }); // Return blob info and new image ID
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Upload error:", error); // Log the full error for debugging
    return NextResponse.json(
      { error: `Failed to upload or save image: ${message}` },
      { status: 500 }
    );
  }
} 