import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920; // Max width or height
const IMAGE_QUALITY = 80; // For JPEG/WebP compression

// Placeholder for a more robust solution like a cloud service or ORM integration
async function savePhotoMetadata(metadata: {
  workerId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  serviceCategory: string;
  description: string;
  uploadedAt: string;
}) {
  console.log("Saving photo metadata with Prisma:", metadata);
  try {
    const newPhotoSet = await prisma.photoSet.create({
      data: {
        uploadedById: metadata.workerId,
        beforeImageUrl: metadata.beforeImageUrl,
        afterImageUrl: metadata.afterImageUrl,
        serviceCategory: metadata.serviceCategory,
        description: metadata.description,
        // uploadedAt is handled by @default(now()) in schema if not provided
        // approvalStatus defaults to PENDING in schema
      },
    });
    return newPhotoSet;
  } catch (error) {
    console.error("Prisma Error saving photo metadata:", error);
    throw new Error("Could not save photo metadata to database.");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Worker authentication is handled by a global password mechanism as per user.
    // For associating uploads, a workerId might still be relevant.
    // If uploads are anonymous or tied to a single 'global' worker, adjust as needed.
    const workerId = "temp_worker_id_global_auth"; // Simplified placeholder

    const formData = await request.formData();

    const beforeImage = formData.get("beforeImage") as File | null;
    const afterImage = formData.get("afterImage") as File | null;
    const serviceCategory = formData.get("serviceCategory") as string | null;
    const description = formData.get("description") as string | null;

    if (!beforeImage || !afterImage || !serviceCategory) {
      return NextResponse.json(
        { message: "Missing required fields: beforeImage, afterImage, or serviceCategory." },
        { status: 400 }
      );
    }

    // --- 1. File Validation (Subtask 13.2) ---
    if (!ALLOWED_FILE_TYPES.includes(beforeImage.type) || 
        !ALLOWED_FILE_TYPES.includes(afterImage.type)) {
      return NextResponse.json(
        { message: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (beforeImage.size > MAX_FILE_SIZE_BYTES || 
        afterImage.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    console.log("Received beforeImage:", beforeImage.name, beforeImage.size, beforeImage.type);
    console.log("Received afterImage:", afterImage.name, afterImage.size, afterImage.type);

    // --- 2. Image Processing (Subtask 13.2) ---
    let processedBeforeImageBuffer, processedAfterImageBuffer;
    try {
      const beforeImageBuffer = Buffer.from(await beforeImage.arrayBuffer());
      processedBeforeImageBuffer = await sharp(beforeImageBuffer)
        .resize({ 
          width: MAX_IMAGE_DIMENSION, 
          height: MAX_IMAGE_DIMENSION, 
          fit: "inside", // Preserves aspect ratio, fits within dimensions
          withoutEnlargement: true // Don't enlarge if smaller than max dimensions
        })
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer();

      const afterImageBuffer = Buffer.from(await afterImage.arrayBuffer());
      processedAfterImageBuffer = await sharp(afterImageBuffer)
        .resize({ 
          width: MAX_IMAGE_DIMENSION, 
          height: MAX_IMAGE_DIMENSION, 
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer();
      
      console.log(`Processed beforeImage: ${beforeImage.name}, new size: ${processedBeforeImageBuffer.length} bytes`);
      console.log(`Processed afterImage: ${afterImage.name}, new size: ${processedAfterImageBuffer.length} bytes`);

    } catch (processingError) {
      console.error("Error processing images with Sharp:", processingError);
      return NextResponse.json(
        { message: "Failed to process images.", error: processingError instanceof Error ? processingError.message : "Image processing error" },
        { status: 500 }
      );
    }

    // Security scanning is not required as per user specification.

    // --- 4. Cloud Storage Upload (Subtask 13.3) ---
    let beforeBlob, afterBlob;
    try {
      // Use processed buffers for upload, generate a new name with .webp extension
      const beforeImageName = `${Date.now()}_${beforeImage.name.split('.').slice(0, -1).join('.') || beforeImage.name}.webp`;
      const afterImageName = `${Date.now()}_${afterImage.name.split('.').slice(0, -1).join('.') || afterImage.name}.webp`;

      beforeBlob = await put(beforeImageName, processedBeforeImageBuffer, {
        access: "public",
        contentType: "image/webp", // Set content type for the blob
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      afterBlob = await put(afterImageName, processedAfterImageBuffer, {
        access: "public",
        contentType: "image/webp",
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
    } catch (uploadError) {
      console.error("Error uploading to Vercel Blob:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload images to cloud storage.", error: uploadError instanceof Error ? uploadError.message : "Blob upload error" },
        { status: 500 }
      );
    }

    const beforeImageUrl = beforeBlob.url;
    const afterImageUrl = afterBlob.url;

    console.log("Uploaded before image URL:", beforeImageUrl);
    console.log("Uploaded after image URL:", afterImageUrl);

    // --- 5. Save Metadata to Database (Subtask 13.4) ---
    const photoSetMetadata = {
      workerId, // Now using workerId from auth placeholder
      beforeImageUrl,
      afterImageUrl,
      serviceCategory,
      description: description || "",
      uploadedAt: new Date().toISOString(),
      // status will be set by savePhotoMetadata, default to 'pending_approval'
    };

    const savedRecord = await savePhotoMetadata(photoSetMetadata);

    return NextResponse.json(
      { 
        message: "Photos submitted successfully and pending approval.", 
        data: savedRecord 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error processing photo upload:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Failed to process photo upload.", error: errorMessage },
      { status: 500 }
    );
  }
} 