import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

import prisma from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import type { ChatConversation, ChatMessage, User } from '@prisma/client';

// Auth Helper
async function getAuth(req: NextRequest) {
  // Check for NextAuth token first
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token && token.sub) {
    return { type: 'next-auth', userId: token.sub, role: token.role as UserRole };
  }

  // If no token, check for maintenance cookie
  const cookieStore = cookies();
  const maintenanceCookie = cookieStore.get('maintenance_session');
  if (maintenanceCookie?.value === 'maintenance_session_active_marker') {
    return { type: 'maintenance', userId: null, role: 'MAINTENANCE' as UserRole };
  }

  return null;
}

const conversationInclude = {
  participants: {
    select: { id: true, name: true, email: true, image: true, role: true },
  },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { content: true, createdAt: true, senderId: true, attachmentFilename: true, attachmentType: true },
  },
  participantActivity: {
    select: {
      userId: true,
      lastAccessedAt: true,
    },
  },
} satisfies Prisma.ChatConversationInclude;

const userConversationInclude = {
  ...conversationInclude,
  participants: {
    ...conversationInclude.participants,
    where: {
      role: {
        not: UserRole.ADMIN,
      },
    },
  },
};

type ConversationWithDetails = Prisma.ChatConversationGetPayload<{
  include: typeof conversationInclude;
}>;

// Helper type for processing conversations
interface ProcessedChatConversation extends Omit<ChatConversation, 'lastMessage'> { // Omit the original lastMessage to redefine it safely if needed, or ensure alignment
  participants: Partial<User>[];
  messages: Partial<ChatMessage>[]; // This implies messages array might be empty or contain partial messages
  title: string | null;
  image?: string | null;
  lastMessage?: string | null; // Align with schema: this should be the string content
  // If you need the full last message object for other purposes, add a new field:
  // lastMessageObject?: Partial<ChatMessage> | null;
}

// GET /api/portal/chat/conversations
// List all conversations for the authenticated user
export async function GET(request: NextRequest) {
  const auth = await getAuth(request);

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized: No user session found' }, { status: 401 });
  }

  try {
    let conversations: ConversationWithDetails[];

    if (auth.type === 'maintenance') {
      // Maintenance role sees all conversations involving customers
      conversations = await prisma.chatConversation.findMany({
        where: {
          participants: {
            some: { role: UserRole.CUSTOMER }
          }
        },
        include: conversationInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else if (auth.type === 'next-auth' && auth.userId) {
      // Existing logic for logged-in NextAuth users
      const userId = auth.userId;
      conversations = await prisma.chatConversation.findMany({
        where: {
          participants: {
            some: { id: userId },
          },
        },
        include: userConversationInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else {
      conversations = [];
    }

    const processedConversations = conversations.map(conv => {
      const currentUserId = auth.type === 'next-auth' ? auth.userId : null;
      const otherParticipants = conv.participants.filter(p => p.id !== currentUserId);
      
      let displayTitle = conv.participants.map(p => p.name || p.email).join(', ');
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

      if (otherParticipants.length === 1) {
        displayTitle = otherParticipants[0].name || otherParticipants[0].email || 'Chat User';
        displayImage = otherParticipants[0].image;
      } else if (otherParticipants.length === 0 && conv.participants.length === 1) { // Chat with self / notes
        const currentUserParticipant = currentUserId ? conv.participants.find(p => p.id === currentUserId) : null;
        displayTitle = currentUserParticipant?.name || currentUserParticipant?.email || 'My Notes';
        displayImage = currentUserParticipant?.image;
      } else if (otherParticipants.length > 1) {
        displayTitle = otherParticipants.map(p => p.name || p.email).join(', ');
      }
      
      // Determine other participants' last active time
      let otherParticipantsLastActive: Date | null = null;
      if (conv.participantActivity && conv.participantActivity.length > 0) {
        const otherParticipantActivity = conv.participantActivity
          .filter(activity => otherParticipants.some(p => p.id === activity.userId))
          .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
        
        if (otherParticipantActivity.length > 0) {
          otherParticipantsLastActive = otherParticipantActivity[0].lastAccessedAt;
        }
      }

      return {
        id: conv.id,
        participants: conv.participants,
        updatedAt: conv.updatedAt.toISOString(),
        title: displayTitle,
        displayImage,
        lastMessagePreview,
        lastMessageAt: lastMessageAt ? new Date(lastMessageAt).toISOString() : new Date(conv.updatedAt).toISOString(),
        lastMessageSenderId,
        otherParticipantsLastActive: otherParticipantsLastActive ? otherParticipantsLastActive.toISOString() : null,
      };
    });

    return NextResponse.json(processedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/portal/chat/conversations
// Initiate a new conversation
export async function POST(request: NextRequest) {
  const auth = await getAuth(request);

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized: No user session found or role missing' }, { status: 401 });
  }

  const initiatorId = auth.userId; // This can be null for maintenance user
  const initiatorRole = auth.role;

  try {
    const body = await request.json();
    const { participantIds, initialMessage, maintenanceSenderId } = body;

    // Allow CUSTOMER, ADMIN, or MAINTENANCE to initiate.
    if (![UserRole.ADMIN, UserRole.MAINTENANCE, UserRole.CUSTOMER].includes(initiatorRole)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to initiate conversations.' }, { status: 403 });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs are required to initiate a conversation' }, { status: 400 });
    }
    
    let finalInitiatorId: string | null = initiatorId;
    if (auth.type === 'maintenance') {
        if (!maintenanceSenderId) {
            return NextResponse.json({ error: 'maintenanceSenderId is required for maintenance users' }, { status: 400 });
        }
        finalInitiatorId = maintenanceSenderId;
    }

    if (!finalInitiatorId) {
        return NextResponse.json({ error: 'Could not determine the initiator of the conversation.' }, { status: 400 });
    }

    // Ensure the initiator is part of the participant list, or add them
    const allParticipantIds = Array.from(new Set([...participantIds, finalInitiatorId]));

    if (allParticipantIds.length < 2) {
        return NextResponse.json({ error: 'A conversation requires at least two distinct participants.' }, { status: 400 });
    }

    // Check if all provided participant IDs exist (optional, but good practice)
    const existingUsers = await prisma.user.findMany({
        where: { id: { in: allParticipantIds } },
        select: { id: true }
    });
    if (existingUsers.length !== allParticipantIds.length) {
        const foundIds = existingUsers.map(u => u.id);
        const missingIds = allParticipantIds.filter(id => !foundIds.includes(id));
        return NextResponse.json({ error: `Invalid participant IDs: The following users do not exist: ${missingIds.join(', ')}` }, { status: 400 });
    }

    const newConversation = await prisma.chatConversation.create({
      data: {
        participants: {
          connect: allParticipantIds.map(id => ({ id })),
        },
        // Add createdBy if your schema supports it
        // createdById: finalInitiatorId,
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // If an initial message is provided, create it
    if (initialMessage && typeof initialMessage === 'string' && initialMessage.trim() !== '') {
      await prisma.chatMessage.create({
        data: {
          content: initialMessage.trim(),
          senderId: finalInitiatorId, // Use the determined initiator ID
          conversationId: newConversation.id,
        },
      });
      // Update conversation's last message details
      await prisma.chatConversation.update({
        where: { id: newConversation.id },
        data: {
            updatedAt: new Date(),
            lastMessage: initialMessage.trim().substring(0,100), // Truncate for preview
            lastMessageAt: new Date(),
        }
      });
    }

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    // Check for Prisma-specific errors if needed, e.g., unique constraint violation
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
} 