import { NextResponse } from "next/server";

import prisma from '@/lib/prisma';
// import { PrismaClient } from "../../../../../generated/prisma-client"; // REMOVE

// const prisma = new PrismaClient(); // REMOVE

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      select: {
        name: true,
      },
      distinct: ['name'], // Ensures we only get unique names
      orderBy: {
        name: 'asc',
      },
    });

    const categoryNames = services.map(service => service.name);
    
    return NextResponse.json(categoryNames, { status: 200 });

  } catch (error) {
    console.error("Error fetching distinct service categories:", error);
    return NextResponse.json(
      { message: "Error fetching service categories", error: (error as Error).message },
      { status: 500 }
    );
  }
} 