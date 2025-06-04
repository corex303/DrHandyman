// Import type
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { Prisma, UserRole } from '@prisma/client';
import { z } from 'zod';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; // Corrected: Only import getSupabaseAdmin
import prisma from '@/lib/prisma'; // Corrected: Import the singleton instance
import { authOptions } from '@/lib/auth/options';
// Note: Supabase client for real-time events would be initialized elsewhere (e.g., in a lib file)
// import { supabase } from '@/lib/supabaseClient'; 
// import { pusherServer } from '@/lib/pusher/server'; // Commented out as the path/module doesn't exist

interface MessagesContext {
  params: Promise<{
    conversationId: string;
  }>;
}

// Define the expected request body structure including optional attachment fields
interface PostMessageRequestBody {
  content?: string; // Content is now optional if there's an attachment
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentFilename?: string;
  attachmentSize?: number;
}

// GET /api/portal/chat/conversations/:conversationId/messages
// Get message history for a specific conversation
export async function GET(request: Request, props: MessagesContext) {
  const params = await props.params;
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
export async function POST(
  request: NextRequest,
  context: MessagesContext,
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized: No user session found' }, { status: 401 });
  }
  const userId = token.sub;

  const actualParams = await context.params;
  const { conversationId } = actualParams;

  if (!conversationId) {
    console.error('POST message: Conversation ID is required but was not provided in params.');
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }
  console.log(`POST message: Received request for conversationId: ${conversationId}, userId: ${userId}`);

  let body;
  try {
    body = await request.json() as PostMessageRequestBody;
    console.log(`POST message: Parsed request body for conversation ${conversationId}:`, body);
  } catch (error) {
    console.error(`POST message: Error parsing JSON body for conversation ${conversationId}:`, error);
    return NextResponse.json({ error: 'Invalid request body: Could not parse JSON.' }, { status: 400 });
  }

  const { content, attachmentUrl, attachmentType, attachmentFilename, attachmentSize } = body;

  if (!content?.trim() && !attachmentUrl) {
    console.log(`POST message: Attempt to send empty message (no content and no attachment) for conversation ${conversationId}.`);
    return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
  }

  try {
    console.log(`POST message: Verifying user ${userId} is part of conversation ${conversationId}.`);
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: {
          select: { id: true, name: true, image: true, role: true }
        }
      }
    });

    if (!conversation) {
      console.warn(`POST message: User ${userId} is not part of conversation ${conversationId} or conversation does not exist.`);
      return NextResponse.json({ error: 'Forbidden: You are not a participant of this conversation or it does not exist.' }, { status: 403 });
    }
    console.log(`POST message: User ${userId} confirmed as participant in conversation ${conversationId}.`);

    const messageData: Prisma.ChatMessageCreateInput = {
      sender: { connect: { id: userId } },
      conversation: { connect: { id: conversationId } },
    };

    if (content?.trim()) {
      messageData.content = content.trim();
    }
    if (attachmentUrl) {
      messageData.attachmentUrl = attachmentUrl;
      messageData.attachmentType = attachmentType;
      messageData.attachmentFilename = attachmentFilename;
      messageData.attachmentSize = attachmentSize;
    }
    
    console.log(`POST message: Creating message in DB for conversation ${conversationId} with data:`, JSON.stringify(messageData));
    const newMessage = await prisma.chatMessage.create({
      data: messageData,
      include: {
        sender: { 
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });
    console.log(`POST message: Message ${newMessage.id} created successfully in DB for conversation ${conversationId}.`);

    const lastMessageContent = content ? (content.length > 100 ? content.substring(0, 97) + '...' : content) : 
                               attachmentFilename ? `Attachment: ${attachmentFilename}` : 'Attachment sent';

    console.log(`POST message: Updating conversation ${conversationId} last message and updatedAt.`);
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        lastMessage: lastMessageContent,
        lastMessageAt: newMessage.createdAt,
      },
    });
    console.log(`POST message: Conversation ${conversationId} updated successfully.`);

    const broadcastPayload = {
      ...newMessage,
    };

    const channelName = `chat:${conversationId}`;
    console.log(`POST message: Broadcasting new_message event to channel ${channelName} with payload:`, JSON.stringify(broadcastPayload));
    
    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      try {
        await adminClient.channel(channelName).send({
          type: 'broadcast',
          event: 'new_message',
          payload: broadcastPayload,
        });
        console.log(`POST message: Message ${newMessage.id} broadcasted successfully to ${channelName}.`);
      } catch (broadcastError: any) {
        console.error(`POST message: Supabase broadcast error for channel ${channelName}:`, broadcastError?.message || broadcastError);
      }
    } else {
      console.warn(`POST message: supabaseAdmin client not initialized. Skipping broadcast for message ${newMessage.id}.`);
    }
    
    // --- Email Notification Logic for Offline Users ---
    try {
      const conversationParticipants = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        select: {
          participants: {
            select: { id: true, email: true, name: true },
            where: { NOT: { id: userId } }, // Exclude the sender
          },
        },
      });

      if (conversationParticipants?.participants) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        for (const participant of conversationParticipants.participants) {
          const activityInfo = await prisma.chatParticipantInfo.findUnique({
            where: {
              userId_conversationId: {
                userId: participant.id,
                conversationId: conversationId,
              },
            },
          });

          // If no activity info or last accessed is older than 5 minutes, consider inactive
          if (!activityInfo || activityInfo.lastAccessedAt < fiveMinutesAgo) {
            console.log(`User ${participant.email} is inactive in conversation ${conversationId}. TODO: Send email notification.`);
            // TODO: Implement actual email sending logic here
            // e.g., await sendChatNotificationEmail(participant.email, conversation.participants.find(p => p.id === userId)?.name, newMessage.content, conversationId);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error during email notification logic:', notificationError);
      // Do not fail the entire message sending process if notification logic fails
    }
    // --- END Email Notification Logic ---

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error(`POST message: Error processing request for conversation ${conversationId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`POST message: Prisma error - Code: ${error.code}, Meta: ${JSON.stringify(error.meta)}, Message: ${error.message}`);
      return NextResponse.json({ error: 'Database error while sending message.', details: error.message, code: error.code }, { status: 500 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`POST message: General error - Message: ${errorMessage}, Stack: ${error?.stack}`);
    return NextResponse.json({ error: 'Failed to send message due to an internal server error.', details: errorMessage }, { status: 500 });
  }
} 