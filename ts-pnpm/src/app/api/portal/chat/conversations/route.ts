import { UserRole, Prisma } from '../../../../../../generated/prisma-client'; // Direct relative import, bring in Prisma namespace
import type { ChatConversation, ChatMessage, User } from '../../../../../../generated/prisma-client'; // Corrected direct relative import for types
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

import prisma from '@/lib/prisma';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper type for processing conversations
interface ProcessedChatConversation extends Omit<ChatConversation, 'lastMessage'> { // Omit the original lastMessage to redefine it safely if needed, or ensure alignment
  participants: Partial<User>[];
  messages: Partial<ChatMessage>[]; // This implies messages array might be empty or contain partial messages
  title?: string;
  image?: string | null;
  lastMessage?: string | null; // Align with schema: this should be the string content
  // If you need the full last message object for other purposes, add a new field:
  // lastMessageObject?: Partial<ChatMessage> | null;
}

// GET /api/portal/chat/conversations
// List all conversations for the authenticated user
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized: No user session found' }, { status: 401 });
  }
  const userId = token.sub;

  try {
    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true, attachmentFilename: true, attachmentType: true },
        },
        // Include participant activity info to determine last active status of others
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
    });

    const processedConversations = conversations.map(conv => {
      const currentUserParticipant = conv.participants.find(p => p.id === userId);
      const otherParticipants = conv.participants.filter(p => p.id !== userId);
      
      let displayTitle = conv.participants.map(p => p.name || p.email).join(', ');
      let displayImage: string | null | undefined = null;
      let lastMessagePreview = 'No messages yet';
      let lastMessageAt: string | Date | null = conv.messages[0]?.createdAt || conv.updatedAt;
      let lastMessageSenderId = conv.messages[0]?.senderId || null;

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
        displayTitle,
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
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || !token?.role) { // Ensure role is present
    return NextResponse.json({ error: 'Unauthorized: No user session found or role missing' }, { status: 401 });
  }
  const initiatorId = token.sub;
  const initiatorRole = token.role as UserRole; // Assuming UserRole is imported from '@/generated/prisma-client' or similar

  try {
    const body = await request.json();
    const { participantIds, initialMessage } = body;

    // Only allow staff/admins to initiate chats directly via this endpoint for now
    // Corrected roles based on prisma schema
    if (initiatorRole !== UserRole.ADMIN && initiatorRole !== UserRole.MAINTENANCE) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to initiate conversations directly.' }, { status: 403 });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs are required to initiate a conversation' }, { status: 400 });
    }

    // Ensure the initiator is part of the participant list, or add them
    const allParticipantIds = Array.from(new Set([...participantIds, initiatorId]));

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
        // createdById: initiatorId,
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
          senderId: initiatorId,
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