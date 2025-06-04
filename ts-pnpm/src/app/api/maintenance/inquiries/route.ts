import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Authentication & Authorization:
  // Assuming middleware has validated the maintenance_session cookie.
  // Further checks might be needed if only specific maintenance roles can view inquiries.

  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest inquiries first
      },
      include: {
        customer: { // Include customer details if linked
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: { // Include any attachments
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true, // This is the URL or path to the attachment
          },
        },
        // photoSets: { // Include associated photo sets -- REMOVED due to schema change
        //   include: {
        //     photos: true, // And their photos for the gallery
        //     maintenanceWorker: {
        //       select: {
        //         id: true,
        //         name: true,
        //       }
        //     }
        //   }
        // }
      },
    });

    return NextResponse.json(inquiries);

  } catch (error) {
    console.error("Failed to fetch inquiries:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
} 