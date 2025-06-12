import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

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
  { params }: { params: { conversationId: string } }
) {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (adminCookie?.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = params;

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        // attachments: true, // Leaving this commented out as the relation is unclear
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Sort messages by creation time
    const sortedMessages = messages.sort(
      (a: { createdAt: string | number | Date }, b: { createdAt: string | number | Date }) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json(sortedMessages);

  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        return NextResponse.json({ error: 'Invalid Conversation ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/admin/chat/conversations/[conversationId]/messages
// Send a new message to a specific conversation, as an admin
export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (adminCookie?.value !== ADMIN_EXPECTED_COOKIE_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { conversationId } = params;

  // For admin, we don't need a session token to get user ID. We can assume a generic admin sender,
  // or you could have a dedicated admin user ID in your database.
  // For this example, let's find the first admin user and use their ID.
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!adminUser) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { content, attachments } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachments are required' }, { status: 400 });
    }

    const conversationExists = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversationExists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    const newMessage = await prisma.chatMessage.create({
      data: {
        content: content || '',
        sender: { connect: { id: adminUser.id } },
        conversation: { connect: { id: conversationId } },
        ...(attachments && attachments.length > 0
          ? {
              attachmentUrl: attachments[0].url,
              attachmentType: attachments[0].type,
              attachmentFilename: attachments[0].filename,
              attachmentSize: attachments[0].size,
            }
          : {}),
      },
      include: {
        sender: true,
      },
    });

    // Broadcast the new message to the chat channel
    // if (pusher) {
    //   try {
    //     await pusher.trigger(`chat-${conversationId}`, 'new_message', newMessage);
    //   } catch (error) {
    //     console.error('Pusher trigger failed:', error);
    //   }
    // }

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessage: content || attachments?.map((a: {filename: string}) => a.filename).join(', '), lastMessageAt: newMessage.createdAt },
    });

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error('Failed to post message:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 