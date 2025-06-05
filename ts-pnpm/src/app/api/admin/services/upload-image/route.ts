import { v2 as cloudinary } from 'cloudinary';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import streamifier from 'streamifier';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

// Configure Cloudinary SDK
// Ensure these environment variables are set in your .env.local or Vercel environment
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  const adminCookie = (await cookies()).get(ADMIN_COOKIE_NAME);

  if (!adminCookie || adminCookie.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Promisify Cloudinary upload stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_SERVICE_IMAGE_PRESET || 'Services',
          folder: 'service_images', // Optional: specify a folder in Cloudinary
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Stream Error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });

    const result = await uploadPromise as { secure_url: string, public_id: string }; // Type assertion

    return NextResponse.json({ 
      secure_url: result.secure_url, 
      public_id: result.public_id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    return NextResponse.json({ error: 'Failed to upload image', details: error.message || String(error) }, { status: 500 });
  }
} 