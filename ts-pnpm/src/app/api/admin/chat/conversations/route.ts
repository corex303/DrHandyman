import { Prisma,UserRole } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

// GET /api/admin/chat/conversations
// List all conversations for admins, with potential filtering
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (adminCookie?.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
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

// POST /api/admin/chat/conversations
// Admin initiating a new conversation
export async function POST(req: Request) {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, customerId, staffId } = await req.json();

    if (!title || !customerId || !staffId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newConversation = await prisma.chatConversation.create({
      data: {
        title,
        customerId,
        staffId,
        participants: {
          connect: [{ id: customerId }, { id: staffId }],
        },
      },
      include: {
        participants: true,
        messages: true,
      },
    });

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
} 