import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure the route is always dynamic

// Define the context interface, typing params as a Promise
// interface RouteContext { // REMOVED
// params: Promise<{ // Params is now a Promise // REMOVED
// conversationId: string; // REMOVED
//   }>; // REMOVED
// } // REMOVED

// GET /api/admin/chat/conversations/[conversationId]/messages
// Get all messages for a specific conversation, ensuring admin access
export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ conversationId: string }> }
) {
  // const actualParams = await context.params; // Await params // REMOVED
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await paramsPromise; // Await the promise
  const { conversationId } = params; // Use awaited params

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId, // Removed parseInt
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        // attachments: true, // Removed due to linter error
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        return NextResponse.json({ error: 'Invalid Conversation ID format (if it were not a string)' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/admin/chat/conversations/[conversationId]/messages
// Admin sends a message to a specific conversation
export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ conversationId: string }> }
) {
  // const actualParams = await context.params; // Await params // REMOVED
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await paramsPromise; // Await the promise
  const { conversationId } = params; // Use awaited params
  const body = await request.json();
  const { content, senderId, attachmentUrl, attachmentType, attachmentFilename, attachmentSize } = body; // Assuming these fields from prior edit

  if (!content && !attachmentFilename) { // Adjusted check based on single attachment fields
    return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
  }
  if (content && typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid message content type' }, { status: 400 });
  }

  const conversationExists = await prisma.chatConversation.findUnique({
      where: { id: conversationId }, // Removed parseInt
  });

  if (!conversationExists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  
  try {
    const newMessageData: Prisma.ChatMessageCreateInput = {
      content: content?.trim(),
      sender: { connect: { id: session.user.id } },
      conversation: { connect: { id: conversationId } }, // Removed parseInt
      // Assuming single attachment fields are correct for Prisma schema
      attachmentUrl: attachmentUrl,
      attachmentType: attachmentType,
      attachmentFilename: attachmentFilename,
      attachmentSize: attachmentSize,
    };

    const newMessage = await prisma.chatMessage.create({
      data: newMessageData,
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        // attachments: true, // Removed due to linter error
      },
    });

    await prisma.chatConversation.update({
      where: { id: conversationId }, // Removed parseInt
      data: { updatedAt: new Date(), lastMessage: content || attachmentFilename, lastMessageAt: newMessage.createdAt },
    });

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
} 