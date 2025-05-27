import { NextResponse } from "next/server";

import prisma from '@/lib/prisma';

import { ApprovalStatus } from "../../../../../../generated/prisma-client";

export async function GET() {
  try {
    const pendingCount = await prisma.photoSet.count({
      where: {
        status: ApprovalStatus.PENDING,
      },
    });
    return NextResponse.json({ count: pendingCount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending photoset count:", error);
    return NextResponse.json(
      { message: "Error fetching pending count", error: (error as Error).message },
      { status: 500 }
    );
  }
} 