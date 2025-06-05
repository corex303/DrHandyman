// import { PrismaClient, ApprovalStatus, PhotoSet } from "../../../../../generated/prisma-client"; // REMOVE
import { Prisma } from "@prisma/client";
import { del } from "@vercel/blob"; // Import del
import { NextRequest, NextResponse } from "next/server";

import prisma from '@/lib/prisma';

import { ApprovalStatus } from "../../../../../generated/prisma-client";

// const prisma = new PrismaClient(); // REMOVE

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ApprovalStatus | null;
  const maintenanceWorkerId = searchParams.get("maintenanceWorkerId") as string | null;
  const serviceCategory = searchParams.get("serviceCategory") as string | null;
  const sortBy = searchParams.get("sortBy") as string | null;
  const sortOrder = searchParams.get("sortOrder") as string | null; // 'asc' or 'desc'
  const searchTerm = searchParams.get("searchTerm") as string | null;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.PhotoSetWhereInput = {}; // Typed for better autocompletion

    if (status && Object.values(ApprovalStatus).includes(status)) {
      whereClause.status = status;
    }
    if (maintenanceWorkerId) {
      whereClause.maintenanceWorkerId = maintenanceWorkerId;
    }
    if (serviceCategory) {
      whereClause.serviceCategory = serviceCategory;
    }

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { maintenanceWorker: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { maintenanceWorker: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
        { maintenanceWorker: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } },
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } }, // Search by customer name
        { customer: { email: { contains: searchTerm, mode: 'insensitive' } } } // Search by customer email
      ];
    }

    let orderByClause: Prisma.PhotoSetOrderByWithRelationInput | Prisma.PhotoSetOrderByWithRelationInput[] = 
        { submittedAt: 'desc' }; // Default sort

    if (sortBy && sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      if (sortBy === 'workerName') {
        orderByClause = { maintenanceWorker: { user: { name: sortOrder as Prisma.SortOrder } } };
      } else if (sortBy === 'serviceCategory') {
        orderByClause = { serviceCategory: sortOrder as Prisma.SortOrder };
      } else if (sortBy === 'submittedAt') {
        orderByClause = { submittedAt: sortOrder as Prisma.SortOrder };
      }
      // Add other sortable fields as needed
    }

    const photoSets = await prisma.photoSet.findMany({
      where: whereClause,
      include: {
        maintenanceWorker: {
          include: {
            user: true, // Include the User details related to the MaintenanceWorker
          },
        },
        photos: true, // Include all related photos
        customer: true, // Include customer details
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalPhotoSets = await prisma.photoSet.count({ where: whereClause });

    return NextResponse.json(
      {
        data: photoSets,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPhotoSets / limit),
          totalResults: totalPhotoSets,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching photo sets:", error);
    return NextResponse.json({ message: "Error fetching photo sets", error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { photoSetId, newStatus, title, description, serviceCategory } = await request.json();

    if (!photoSetId) {
      return NextResponse.json({ message: "Missing photoSetId" }, { status: 400 });
    }

    const dataToUpdate: any = {};

    if (newStatus) {
      if (!Object.values(ApprovalStatus).includes(newStatus as ApprovalStatus)) {
        return NextResponse.json({ message: "Invalid approval status provided" }, { status: 400 });
      }
      dataToUpdate.status = newStatus as ApprovalStatus;
    }

    if (title !== undefined) { // Allow empty string for title
      dataToUpdate.title = title;
    }
    if (description !== undefined) { // Allow empty string for description
      dataToUpdate.description = description;
    }
    if (serviceCategory) {
      // Optional: Add validation for serviceCategory if it should match existing categories
      dataToUpdate.serviceCategory = serviceCategory;
    }
    
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    const updatedPhotoSet = await prisma.photoSet.update({
      where: { id: photoSetId as string },
      data: dataToUpdate,
      include: {
        maintenanceWorker: true,
        photos: true,
      }
    });

    return NextResponse.json(updatedPhotoSet, { status: 200 });
  } catch (error) {
    console.error("Error updating photo set status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.includes("Record to update not found")) {
        return NextResponse.json({ message: "PhotoSet not found", error: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ message: "Error updating photo set status", error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoSetId = searchParams.get("photoSetId");

    if (!photoSetId) {
      return NextResponse.json({ message: "Missing photoSetId" }, { status: 400 });
    }

    // Fetch the photoset and its photos to get their URLs for blob deletion
    const photoSetToDelete = await prisma.photoSet.findUnique({
      where: { id: photoSetId },
      include: { photos: true },
    });

    if (!photoSetToDelete) {
      return NextResponse.json({ message: "PhotoSet not found" }, { status: 404 });
    }

    // Delete images from Vercel Blob storage
    if (photoSetToDelete.photos && photoSetToDelete.photos.length > 0) {
      const photoUrls = photoSetToDelete.photos.map(p => p.url);
      try {
        // Ensure BLOB_READ_WRITE_TOKEN is available in environment
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          console.error("BLOB_READ_WRITE_TOKEN is not set. Cannot delete blobs.");
          throw new Error("Storage access token not configured. Cannot delete images.");
        }
        await del(photoUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
        console.log(`Successfully deleted ${photoUrls.length} images from blob storage for PhotoSet ${photoSetId}`);
      } catch (blobError) {
        console.error(`Error deleting images from blob storage for PhotoSet ${photoSetId}:`, blobError);
        // Decide if you want to proceed with DB deletion if blob deletion fails.
        // For now, we'll log the error and proceed, but this could be a soft-delete strategy instead.
        // Or return an error to prevent DB deletion if blob deletion is critical.
      }
    }

    // Delete the PhotoSet and its related Photo records from the database
    // (Photo records should be deleted automatically due to onDelete: Cascade in schema)
    await prisma.photoSet.delete({
      where: { id: photoSetId },
    });

    return NextResponse.json({ message: `PhotoSet ${photoSetId} and associated images deleted successfully` }, { status: 200 });

  } catch (error) {
    console.error("Error deleting photo set:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Error deleting photo set", error: errorMessage }, { status: 500 });
  }
} 