import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import prisma from '@/lib/prisma';

import { ApprovalStatus,PhotoType } from "../../../../../../generated/prisma-client"; // Adjusted path

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920; 
const IMAGE_QUALITY = 80;

interface ProcessedPhotoData {
  url: string;
  type: PhotoType;
}

async function processAndUploadImage(file: File, fileType: PhotoType): Promise<ProcessedPhotoData> {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.name} (${file.type}). Allowed: ${ALLOWED_FILE_TYPES.join(", ")}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

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
  } catch (processingError) {
    console.error(`Error processing image ${file.name} with Sharp:`, processingError);
    throw new Error(`Failed to process image: ${file.name}.`);
  }

  let blob;
  try {
    const imageName = `${Date.now()}_${file.name.split('.').slice(0, -1).join('.') || file.name}.webp`;
    blob = await put(imageName, processedImageBuffer, {
      access: "public",
      contentType: "image/webp",
      token: process.env.BLOB_READ_WRITE_TOKEN, // Ensure this token is available
    });
    return { url: blob.url, type: fileType };
  } catch (uploadError) {
    console.error(`Error uploading image ${file.name} to Vercel Blob:`, uploadError);
    throw new Error(`Failed to upload image to cloud storage: ${file.name}.`);
  }
}

async function createDirectApprovedPhotoSet(data: {
  title?: string; // Title is now part of PhotoSet
  maintenanceWorkerId: string; // Or a generic admin user ID / null if allowed by schema
  serviceCategory: string;
  description: string;
  uploadedPhotosData: ProcessedPhotoData[];
}) {
  try {
    const newPhotoSet = await prisma.photoSet.create({
      data: {
        title: data.title, // Add title
        maintenanceWorkerId: data.maintenanceWorkerId,
        serviceCategory: data.serviceCategory,
        description: data.description,
        status: ApprovalStatus.APPROVED, // Direct approve
        photos: {
          create: data.uploadedPhotosData.map(photo => ({
            url: photo.url,
            type: photo.type,
          })),
        },
      },
      include: {
        photos: true,
      },
    });
    return newPhotoSet;
  } catch (error) {
    console.error("Prisma Error creating direct PhotoSet:", error);
    throw new Error("Could not save directly approved photo set to database.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const beforeImageFiles = formData.getAll("beforeImages") as File[];
    const afterImageFiles = formData.getAll("afterImages") as File[];
    const title = formData.get("title") as string | null;
    const serviceCategory = formData.get("serviceCategory") as string | null;
    const description = formData.get("description") as string | null;
    // For admin uploads, worker ID might be optional or a default admin user ID.
    // For now, let's assume it's provided or we handle it appropriately.
    // This example assumes it's still passed as 'maintenanceWorkerId'.
    // A more robust solution might use the authenticated admin's ID or a system ID.
    const maintenanceWorkerId = formData.get("maintenanceWorkerId") as string | null; 

    if (beforeImageFiles.length === 0 || afterImageFiles.length === 0 || !serviceCategory || !maintenanceWorkerId || !title) {
      return NextResponse.json(
        { message: "Missing required fields: at least one before/after image, title, serviceCategory, or maintenanceWorkerId." },
        { status: 400 }
      );
    }
    
    const beforePhotoPromises = beforeImageFiles.map(file => processAndUploadImage(file, PhotoType.BEFORE));
    const afterPhotoPromises = afterImageFiles.map(file => processAndUploadImage(file, PhotoType.AFTER));

    const settledBeforePhotos = await Promise.allSettled(beforePhotoPromises);
    const settledAfterPhotos = await Promise.allSettled(afterPhotoPromises);

    const uploadedBeforePhotosData: ProcessedPhotoData[] = [];
    const uploadErrors: string[] = [];

    settledBeforePhotos.forEach(result => {
      if (result.status === 'fulfilled') {
        uploadedBeforePhotosData.push(result.value);
      } else {
        uploadErrors.push(result.reason.message || 'An unknown error occurred during before image upload.');
      }
    });

    const uploadedAfterPhotosData: ProcessedPhotoData[] = [];
    settledAfterPhotos.forEach(result => {
      if (result.status === 'fulfilled') {
        uploadedAfterPhotosData.push(result.value);
      } else {
        uploadErrors.push(result.reason.message || 'An unknown error occurred during after image upload.');
      }
    });

    if (uploadErrors.length > 0) {
      console.error("Errors during image processing/upload (admin direct):", uploadErrors);
      return NextResponse.json(
        { message: "One or more images failed to process or upload.", errors: uploadErrors },
        { status: 500 }
      );
    }
    
    if (uploadedBeforePhotosData.length === 0 && uploadedAfterPhotosData.length === 0 ) {
         return NextResponse.json(
            { message: "No images were successfully processed and uploaded." },
            { status: 500 }
         );
    }

    const allUploadedPhotosData = [...uploadedBeforePhotosData, ...uploadedAfterPhotosData];
    
    const savedRecord = await createDirectApprovedPhotoSet({
      title: title, // Pass title
      maintenanceWorkerId, // Consider how to handle this for admin uploads
      serviceCategory,
      description: description || "",
      uploadedPhotosData: allUploadedPhotosData,
    });

    return NextResponse.json(
      {
        message: "Photos submitted and approved directly.",
        data: savedRecord,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error processing admin direct photo upload request:", error);
    let errorMessage = "An unknown error occurred processing the upload request.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Failed to process admin direct photo upload.", error: errorMessage },
      { status: 500 }
    );
  }
} 