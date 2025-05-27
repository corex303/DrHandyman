import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import prisma from '@/lib/prisma';

import { ApprovalStatus,PhotoType } from '../../../../../generated/prisma-client';

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920; // Max width or height
const IMAGE_QUALITY = 80; // For JPEG/WebP compression

interface ProcessedPhotoData {
  url: string;
  type: PhotoType;
}

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


// Function to create PhotoSet and associated Photo records
async function createPhotoSetWithPhotos(data: {
  maintenanceWorkerId: string;
  serviceCategory: string;
  description: string;
  uploadedPhotosData: ProcessedPhotoData[]; // Combined list of before and after photo data
}) {
  console.log("Creating PhotoSet with Photos in Prisma:", data.maintenanceWorkerId, data.serviceCategory);
  try {
    const newPhotoSet = await prisma.photoSet.create({
      data: {
        maintenanceWorkerId: data.maintenanceWorkerId,
        serviceCategory: data.serviceCategory,
        description: data.description,
        status: ApprovalStatus.PENDING, // Default status
        photos: {
          create: data.uploadedPhotosData.map(photo => ({
            url: photo.url,
            type: photo.type,
          })),
        },
      },
      include: {
        photos: true, // Include the created photos in the return
      },
    });
    console.log("Successfully created PhotoSet with ID:", newPhotoSet.id, "and", newPhotoSet.photos.length, "photos.");
    return newPhotoSet;
  } catch (error) {
    console.error("Prisma Error creating PhotoSet with Photos:", error);
    throw new Error("Could not save photo set and photo metadata to database.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const beforeImageFiles = formData.getAll("beforeImages") as File[];
    const afterImageFiles = formData.getAll("afterImages") as File[];
    const serviceCategory = formData.get("serviceCategory") as string | null;
    const description = formData.get("description") as string | null;
    const maintenanceWorkerId = formData.get("maintenanceWorkerId") as string | null;

    if (beforeImageFiles.length === 0 || afterImageFiles.length === 0 || !serviceCategory || !maintenanceWorkerId) {
      return NextResponse.json(
        { message: "Missing required fields: at least one before/after image, serviceCategory, or maintenanceWorkerId." },
        { status: 400 }
      );
    }
    
    console.log(`Received ${beforeImageFiles.length} before images and ${afterImageFiles.length} after images.`);

    // Process and upload all images in parallel
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
      // TODO: Consider deleting successfully uploaded blobs if some uploads fail, to avoid orphaned files.
      // This would require collecting all successful blob URLs and then calling del() for each.
      console.error("Errors during image processing/upload:", uploadErrors);
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


    // Save metadata to database
    const allUploadedPhotosData = [...uploadedBeforePhotosData, ...uploadedAfterPhotosData];
    
    const savedRecord = await createPhotoSetWithPhotos({
      maintenanceWorkerId,
      serviceCategory,
      description: description || "",
      uploadedPhotosData: allUploadedPhotosData,
    });

    return NextResponse.json(
      {
        message: "Photos submitted successfully and pending approval.",
        data: savedRecord,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error processing photo upload request:", error);
    let errorMessage = "An unknown error occurred processing the upload request.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Failed to process photo upload.", error: errorMessage },
      { status: 500 }
    );
  }
} 