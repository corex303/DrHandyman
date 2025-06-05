import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';

// Define allowed file types and max size (e.g., 5MB)
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // --- Placeholder for actual file storage logic ---
    // In a real application, you would upload the file to a service like Cloudinary,
    // AWS S3, or save it to your server's filesystem.
    // For now, we'll just simulate an upload and return a dummy URL.

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    // This would be the public URL after uploading to a storage service
    const dummyPublicUrl = `/uploads/images/${filename}`; 

    // --- Placeholder for Prisma Image model interaction ---
    // After successful upload, create an Image record in the database:
    /*
    const imageRecord = await prisma.image.create({
      data: {
        filename: filename,
        url: dummyPublicUrl, // Store the actual public URL from your storage provider
        size: file.size,
        mimeType: file.type,
        // Optional: associate with a user or other entity if needed
        // uploadedBy: session.user.id, 
      },
    });
    console.log('Image record created:', imageRecord);
    */
   
    // For the purpose of this placeholder, we return the dummy URL directly.
    // In a real scenario, you'd return imageRecord.url or the direct URL from the storage service.
    return NextResponse.json({ 
      message: 'File uploaded successfully (simulated).',
      url: dummyPublicUrl, // This is the dummy URL
      // In a real scenario, you might return more details from the imageRecord
      // e.g., imageId: imageRecord.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Failed to process upload.', details: error.message }, { status: 500 });
  }
}

// Optional: GET handler to retrieve images (example)
// export async function GET() {
//   try {
//     const images = await prisma.image.findMany({
//       orderBy: { uploadedAt: 'desc' },
//     });
//     return NextResponse.json(images);
//   } catch (error: any) {
//     console.error('Get Images API error:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch images.', details: error.message },
//       { status: 500 }
//     );
//   }
// } 