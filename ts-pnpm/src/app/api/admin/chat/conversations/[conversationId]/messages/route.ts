import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { UserRole, Prisma } from '@prisma/client'; // Adjusted based on previous successful change
import type { ChatMessage } from '@prisma/client'; // Adjusted

import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface MessagesRouteParams {
  params: {
    conversationId: string;
  };
}

// GET /api/admin/chat/conversations/[conversationId]/messages
// Get all messages for a specific conversation, ensuring admin access
export async function GET(request: Request, { params }: MessagesRouteParams) {
  const session = await getServerSession(authOptions);
  const { conversationId } = params;

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    // First, verify the conversation exists, though not strictly necessary if just fetching messages
    // Optional: Add check if admin should only see messages from conversations they have rights to (e.g. if further scoping is needed)
    // For now, assuming admin can see all messages for any valid conversationId

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        // Potentially include read receipts if implemented
      },
      orderBy: {
        createdAt: 'asc', // Typically messages are ordered oldest to newest
      },
      // TODO: Add pagination if conversations can have very large numbers of messages
    });

    if (!messages) { // findMany returns [], so this check might not be what you intend unless conversation must exist
      // If you want to ensure the conversation itself exists, you might query ChatConversation first
      // return NextResponse.json({ error: 'Conversation not found or no messages' }, { status: 404 });
    }

    return NextResponse.json(messages);

  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        // Invalid UUID format for conversationId
        return NextResponse.json({ error: 'Invalid Conversation ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/admin/chat/conversations/[conversationId]/messages
// Admin sends a message to a specific conversation
export async function POST(request: Request, { params }: MessagesRouteParams) {
  const session = await getServerSession(authOptions);
  const { conversationId } = params;

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const adminUserId = session.user.id;

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { content, attachmentUrl, attachmentType, attachmentFilename, attachmentSize } = body;

    if (!content && !attachmentFilename) {
      return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
    }
    if (content && typeof content !== 'string') {
        return NextResponse.json({ error: 'Invalid message content type' }, { status: 400 });
    }

    // Verify the conversation exists and the admin is implicitly a participant 
    // or allowed to send messages to this type of conversation.
    // For admin-to-maintenance chats, this check is simpler.
    const conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: { id: true, role: true} } }
    });

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Optional: Check if the conversation involves at least one MAINTENANCE role if this API is specific to admin-maintenance chat
    const hasMaintenanceParticipant = conversation.participants.some(p => p.role === UserRole.MAINTENANCE);
    if (!hasMaintenanceParticipant) {
        // This might be a stricter rule than necessary if admins can also observe customer-maintenance chats
        // For now, let's assume admins can message any conversation they have access to.
        // console.warn(`Admin messaging a conversation without a maintenance participant: ${conversationId}`);
    }

    const newMessageData: Prisma.ChatMessageCreateInput = {
      content: content?.trim(),
      sender: { connect: { id: adminUserId } },
      conversation: { connect: { id: conversationId } },
      attachmentUrl,
      attachmentType,
      attachmentFilename,
      attachmentSize,
      // readAt will be updated when other participants read it
    };

    const newMessage = await prisma.chatMessage.create({
      data: newMessageData,
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    });

    // Update conversation's updatedAt timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessage: content, lastMessageAt: newMessage.createdAt },
    });

    // Here, you would typically broadcast the message via a real-time service (e.g., Supabase)
    // This is handled on the client-side in this setup for optimistic updates and broadcasting.

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error(`Error sending message to conversation ${conversationId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2025') { // Record to update not found (e.g. conversationId)
        return NextResponse.json({ error: 'Conversation not found for message' }, { status: 404 });
      }
       if (error.code === 'P2023') { // Invalid UUID format for conversationId
        return NextResponse.json({ error: 'Invalid Conversation ID format' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 