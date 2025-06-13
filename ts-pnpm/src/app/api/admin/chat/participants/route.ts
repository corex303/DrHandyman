import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';

export async function GET(req: Request) {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  try {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(conversation.participants);
  } catch (error) {
    console.error('Failed to fetch chat participants:', error);
    return NextResponse.json({ error: 'Failed to fetch chat participants' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { conversationId, participantId, role } = await req.json();

    if (!conversationId || !participantId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newParticipant = await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          connect: { id: participantId },
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(newParticipant.participants);
  } catch (error) {
    console.error('Failed to add chat participant:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
} 