// Import type
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import prisma from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; // Import the admin client

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// Note: Supabase client for real-time events would be initialized elsewhere (e.g., in a lib file)
// import { supabase } from '@/lib/supabaseClient'; 

interface MessagesContext {
  params: {
    conversationId: string;
  };
}

// GET /api/portal/chat/conversations/:conversationId/messages
// Get message history for a specific conversation
export async function GET(request: Request, { params }: MessagesContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  console.log('GET /messages: Received params:', JSON.stringify(params, null, 2));
  const { conversationId } = params;
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    // First, check if the user is a participant of this conversation
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: session.user.id,
          },
        },
        deletedAt: null,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Fetch messages for the conversation
    // Implement pagination later if needed (e.g., using cursor-based pagination)
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Typically, messages are shown oldest to newest
      },
      // take: 50, // Example: limit the number of messages initially loaded
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/portal/chat/conversations/:conversationId/messages
// Send a new message to a specific conversation
export async function POST(request: Request, { params }: MessagesContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { conversationId } = params;
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  const { content } = await request.json();
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  try {
    // Check if the user is a participant of this conversation before allowing them to post
    const conversationExists = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: session.user.id,
          },
        },
        deletedAt: null,
      },
      select: { id: true }, // Only need to know if it exists and user is part of it
    });

    if (!conversationExists) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Create the new message in Neon DB via Prisma
    const newMessage = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Update the conversation's updatedAt timestamp and last message in Neon DB
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        lastMessage: newMessage.content,
        lastMessageAt: newMessage.createdAt,
      },
    });

    // Broadcast the new message using Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const channelName = `chat:${conversationId}`;
      const sendStatus = await supabaseAdmin
        .channel(channelName)
        .send({
          type: 'broadcast',
          event: 'new_message', // Custom event name
          payload: { ...newMessage }, // Send the full message object including sender details
        });

      if (sendStatus !== 'ok') {
        console.error(`Supabase broadcast error for ${channelName}. Status: ${sendStatus}`);
        // Optionally, you could decide if this error should fail the request or just be logged
        // For actual error objects, consider channel.onError() listeners if detailed error info is needed here.
      }
    } else {
      console.warn('Supabase admin client not initialized. Skipping broadcast.');
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error(`Error sending message to conversation ${conversationId}:`, error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 