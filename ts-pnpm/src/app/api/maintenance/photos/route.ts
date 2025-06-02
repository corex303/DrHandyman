import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PrismaClient, PhotoType, ApprovalStatus } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920; // Max width or height
const IMAGE_QUALITY = 80; // For JPEG/WebP compression

interface ProcessedPhotoData {
  url: string;
  type: PhotoType;
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'maintenance-photos');

async function ensureUploadsDirExists() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating uploads directory:", error);
    // Optionally re-throw or handle as per application's error handling strategy
  }
}

// Zod schema for validation (can be expanded)
const photoSetSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  serviceCategory: z.string(), 
  maintenanceWorkerId: z.string(), // Assuming worker ID is passed
});

// Helper function to process and upload a single image
async function processAndUploadImage(file: File, fileType: PhotoType): Promise<ProcessedPhotoData> {
  // 1. Validate individual file
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.name} (${file.type}). Allowed: ${ALLOWED_FILE_TYPES.join(", ")}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // 2. Process image with Sharp
  let processedImageBuffer;
  try {
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    processedImageBuffer = await sharp(imageBuffer)
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_QUALITY })
      .toBuffer();
    console.log(`Processed ${fileType.toLowerCase()} image: ${file.name}, new size: ${processedImageBuffer.length} bytes`);
  } catch (processingError) {
    console.error(`Error processing ${fileType.toLowerCase()} image ${file.name} with Sharp:`, processingError);
    throw new Error(`Failed to process image: ${file.name}.`);
  }

  // 3. Upload to Vercel Blob
  let blob;
  try {
    const imageName = `${Date.now()}_${file.name.split('.').slice(0, -1).join('.') || file.name}.webp`;
    blob = await put(imageName, processedImageBuffer, {
      access: "public",
      contentType: "image/webp",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`Uploaded ${fileType.toLowerCase()} image to Vercel Blob: ${blob.url}`);
    return { url: blob.url, type: fileType };
  } catch (uploadError) {
    console.error(`Error uploading ${fileType.toLowerCase()} image ${file.name} to Vercel Blob:`, uploadError);
    // Attempt to delete blob if upload fails partway through other operations, though 'put' is usually atomic.
    // If blob object exists and has a url, consider trying to delete it: await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    throw new Error(`Failed to upload image to cloud storage: ${file.name}.`);
  }
}

async function createPhotoSetWithPhotos(formData: FormData) {
  await ensureUploadsDirExists();

  const rawTitle = formData.get('title') as string | null;
  const rawDescription = formData.get('description') as string | null;
  const rawServiceCategory = formData.get('serviceCategory') as string | null;
  const rawMaintenanceWorkerId = formData.get('maintenanceWorkerId') as string | null;

  if (!rawServiceCategory) {
    throw new Error('Service category is required');
  }
  if (!rawMaintenanceWorkerId) {
    throw new Error('Maintenance worker ID is required');
  }

  const photoSetData = {
    title: rawTitle || undefined,
    description: rawDescription || undefined,
    serviceCategory: rawServiceCategory,
    status: ApprovalStatus.PENDING, // Default status
    maintenanceWorkerId: rawMaintenanceWorkerId,
    submittedAt: new Date(),
  };

  // Validate with Zod (optional, but good practice)
  // photoSetSchema.parse(photoSetData);

  const createdPhotoSet = await prisma.photoSet.create({
    data: photoSetData,
  });

  const photosToCreate = [];
  const beforeFiles = formData.getAll('beforePhotos') as File[];
  const afterFiles = formData.getAll('afterPhotos') as File[];

  for (const file of beforeFiles) {
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const processedBuffer = await sharp(buffer).rotate().toBuffer(); // Auto-rotate
      const filename = `${createdPhotoSet.id}-${PhotoType.BEFORE}-${Date.now()}-${file.name}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await fs.writeFile(filepath, processedBuffer); // Save processed buffer
      photosToCreate.push({
        url: `/uploads/maintenance-photos/${filename}`,
        type: PhotoType.BEFORE,
        photoSetId: createdPhotoSet.id,
        uploadedAt: new Date(),
        filename: file.name,
        size: processedBuffer.length, // Size of the processed file
        contentType: file.type,
      });
    }
  }

  for (const file of afterFiles) {
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const processedBuffer = await sharp(buffer).rotate().toBuffer(); // Auto-rotate
      const filename = `${createdPhotoSet.id}-${PhotoType.AFTER}-${Date.now()}-${file.name}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await fs.writeFile(filepath, processedBuffer); // Save processed buffer
      photosToCreate.push({
        url: `/uploads/maintenance-photos/${filename}`,
        type: PhotoType.AFTER,
        photoSetId: createdPhotoSet.id,
        uploadedAt: new Date(),
        filename: file.name,
        size: processedBuffer.length, // Size of the processed file
        contentType: file.type,
      });
    }
  }

  if (photosToCreate.length > 0) {
    await prisma.photo.createMany({
      data: photosToCreate,
    });
  }

  return createdPhotoSet;
}

// POST /api/maintenance/photos
// Handles photo set creation with before/after photo uploads
export async function POST(request: NextRequest) {
  // Authentication should be handled by middleware before this point
  // e.g., checking for a valid maintenance_session cookie.

  try {
    const formData = await request.formData();
    const newPhotoSet = await createPhotoSetWithPhotos(formData);
    return NextResponse.json(newPhotoSet, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create photo set:", error);
    // Consider more specific error handling based on error type
    if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process photo upload.' }, { status: 500 });
  }
} 