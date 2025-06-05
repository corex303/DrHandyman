import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import prisma from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; // Fully replaced line

// Define the context interface, typing params as a Promise
interface RouteContext {
  params: Promise<{ // Params is now a Promise
    conversationId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) { // Changed params to context: RouteContext
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized: No user session found' }, { status: 401 });
  }
  const userId = token.sub;
  const actualParams = await context.params; // Await params
  const { conversationId } = actualParams; // Use awaited params

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    // First, ensure the user is a participant in the conversation
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden: User is not a participant in this conversation' }, { status: 403 });
    }

    // Upsert ChatParticipantInfo: create if not exists, update lastAccessedAt if exists
    const participantInfo = await prisma.chatParticipantInfo.upsert({
      where: {
        userId_conversationId: {
          userId: userId,
          conversationId: conversationId,
        },
      },
      update: {
        lastAccessedAt: new Date(),
      },
      create: {
        userId: userId,
        conversationId: conversationId,
        lastAccessedAt: new Date(), // Also set on create
      },
    });

    // Broadcast the activity update to other participants in the conversation
    const supabaseAdminClient = getSupabaseAdmin(); // Get the client instance

    if (supabaseAdminClient) { // Check if client is available
      const otherParticipantIds = conversation.participants
        .filter(p => p.id !== userId)
        .map(p => p.id);

      if (otherParticipantIds.length > 0) {
        const channel = supabaseAdminClient.channel(`chat:${conversationId}`);
        const broadcastPayload = {
          type: 'broadcast' as const,
          event: 'activity_update',
          payload: {
            conversationId: conversationId,
            userId: userId,
            lastAccessedAt: participantInfo.lastAccessedAt.toISOString(),
            // Optionally, send senderName if needed on the client without an extra lookup
            // senderName: token.name || token.email || 'A user' 
          },
        };
        // We don't strictly need to await this, but it's good to know if it errors out immediately.
        try {
          await channel.send(broadcastPayload);
          // console.log(`Activity broadcast sent for user ${userId} in conversation ${conversationId}`);
        } catch (broadcastError) {
          console.error('Supabase broadcast error in /active:', broadcastError);
          // Non-critical error, so we don't return an error response for this.
          // The main activity update to DB was successful.
        }
      }
    }

    return NextResponse.json({ message: 'Activity updated successfully', lastAccessedAt: participantInfo.lastAccessedAt }, { status: 200 });

  } catch (error) {
    console.error('Error updating participant activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 