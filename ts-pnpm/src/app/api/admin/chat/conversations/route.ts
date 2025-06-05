import { Prisma,UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Assuming NextAuth for admin session management as well

import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
// import { pusherServer } from '@/lib/pusher/server'; // Commented out as the path/module doesn't exist

// GET /api/admin/chat/conversations
// List all conversations for admins, with potential filtering
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions); // Use existing authOptions

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Potential query parameters for filtering, e.g.:
  const customerId = searchParams.get('customerId');
  const workerId = searchParams.get('workerId');
  const workOrderId = searchParams.get('workOrderId'); // If conversations are directly linked to work orders
  const searchTerm = searchParams.get('searchTerm'); // For searching message content or participant names
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  const whereClause: Prisma.ChatConversationWhereInput = {};

  if (customerId) {
    whereClause.participants = {
      some: { id: customerId, role: UserRole.CUSTOMER },
    };
  }
  // Add more filters as needed, e.g., for workerId, workOrderId
  // if (workerId) { ... }
  // if (workOrderId) { /* This depends on how work orders are linked to chats */ }

  if (searchTerm) {
    // Simple search example: looks in message content or participant names
    // More complex search might require full-text search capabilities of the DB
    whereClause.OR = [
      {
        messages: {
          some: { content: { contains: searchTerm, mode: 'insensitive' } },
        },
      },
      {
        participants: {
          some: { name: { contains: searchTerm, mode: 'insensitive' } },
        },
      },
      {
        participants: {
          some: { email: { contains: searchTerm, mode: 'insensitive' } },
        },
      },
    ];
  }

  try {
    const conversations = await prisma.chatConversation.findMany({
      where: whereClause,
      include: {
        participants: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // For last message preview
          select: { content: true, createdAt: true, senderId: true, attachmentFilename: true, attachmentType: true },
        },
        participantActivity: {
          select: {
            userId: true,
            lastAccessedAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const totalConversations = await prisma.chatConversation.count({ where: whereClause });

    // Reuse processing logic if similar to portal, or adapt for admin needs
    const processedConversations = conversations.map(conv => {
      const otherParticipants = conv.participants; // For admin view, all participants might be 'other'
      
      const displayTitle = conv.participants.map(p => p.name || p.email).join(', ');
      let displayImage: string | null | undefined = null;
      let lastMessagePreview = 'No messages yet';
      const lastMessageAt: string | Date | null = conv.messages[0]?.createdAt || conv.updatedAt;
      const lastMessageSenderId = conv.messages[0]?.senderId || null;

      if (conv.messages[0]) {
        if (conv.messages[0].attachmentFilename) {
          lastMessagePreview = `Attachment: ${conv.messages[0].attachmentFilename}`;
        } else if (conv.messages[0].content) {
          lastMessagePreview = conv.messages[0].content;
        }
      }
      
      // Admin view might prefer a consistent title or more detailed participant info
      if (otherParticipants.length === 1) {
        displayImage = otherParticipants[0].image;
      } else if (otherParticipants.length > 1) {
        // Potentially a generic group icon or a composite of participant images
        // displayImage = computeGroupImage(otherParticipants.map(p => p.image));
      }

      return {
        id: conv.id,
        participants: conv.participants,
        updatedAt: conv.updatedAt.toISOString(),
        displayTitle,
        displayImage,
        lastMessagePreview,
        lastMessageAt: lastMessageAt ? new Date(lastMessageAt).toISOString() : new Date(conv.updatedAt).toISOString(),
        lastMessageSenderId,
        // otherParticipantsLastActive can be adapted if needed for admin view
      };
    });

    return NextResponse.json({
      data: processedConversations,
      pagination: {
        page,
        limit,
        totalItems: totalConversations,
        totalPages: Math.ceil(totalConversations / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch admin conversations' }, { status: 500 });
  }
}

// POST /api/admin/chat/conversations - REMOVED as admins are observers only
// Admin initiating a new conversation (similar to portal POST, but ensured admin role)
// export async function POST(request: NextRequest) { ... } 

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const adminUserId = session.user.id;

  try {
    const body = await request.json();
    const { maintenanceWorkerId, initialMessageContent } = body;

    if (!maintenanceWorkerId) {
      return NextResponse.json({ error: 'Maintenance worker ID is required' }, { status: 400 });
    }

    if (!initialMessageContent || typeof initialMessageContent !== 'string' || initialMessageContent.trim() === '') {
      return NextResponse.json({ error: 'Initial message content is required' }, { status: 400 });
    }

    const maintenanceWorker = await prisma.user.findUnique({
      where: { id: maintenanceWorkerId, role: UserRole.MAINTENANCE },
    });

    if (!maintenanceWorker) {
      return NextResponse.json({ error: 'Maintenance worker not found or user is not a maintenance worker' }, { status: 404 });
    }

    // Check if a conversation already exists between the admin and this maintenance worker
    // For simplicity, we'll assume one admin user for now, or a generic admin participant.
    // A more complex system might involve specific admin-to-worker chats.
    // This example creates a new conversation or finds one with the specific admin and worker.

    const existingConversation = await prisma.chatConversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: adminUserId } } },
          { participants: { some: { id: maintenanceWorkerId } } },
        ],
        // Add more conditions if conversations are scoped differently, e.g., by work order
      },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (existingConversation) {
      // If a conversation exists, add the new message to it
      const newMessage = await prisma.chatMessage.create({
        data: {
          content: initialMessageContent,
          senderId: adminUserId,
          conversationId: existingConversation.id,
        },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      });
      // Update the conversation's updatedAt timestamp
      await prisma.chatConversation.update({
        where: { id: existingConversation.id },
        data: { updatedAt: new Date() },
      });
      return NextResponse.json(newMessage, { status: 200 });
    }

    // Create a new conversation
    const newConversation = await prisma.chatConversation.create({
      data: {
        participants: {
          connect: [{ id: adminUserId }, { id: maintenanceWorkerId }],
        },
        // Optional: link to customer, staffMember if there's a related customer context
        // customerId: customerIdIfApplicable,
        // staffMemberId: maintenanceWorkerId, // Can also be used to quickly identify the staff member
        messages: {
          create: [
            {
              content: initialMessageContent,
              senderId: adminUserId,
            },
          ],
        },
        updatedAt: new Date(),
      },
      include: {
        participants: { select: { id: true, name: true, email: true, image: true, role: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, email: true, image: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json(newConversation, { status: 201 });

  } catch (error) {
    console.error('Error creating/updating admin conversation:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed
      return NextResponse.json({ error: 'Database error creating conversation' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create or update conversation' }, { status: 500 });
  }
} 