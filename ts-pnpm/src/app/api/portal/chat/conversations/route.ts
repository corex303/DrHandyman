import { UserRole, Prisma } from '../../../../../../generated/prisma-client'; // Direct relative import, bring in Prisma namespace
import type { ChatConversation, ChatMessage, User } from '../../../../../../generated/prisma-client'; // Corrected direct relative import for types
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

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
// List conversations for the logged-in user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: {
            id: session.user.id,
          },
        },
        deletedAt: null, // Assuming soft delete
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the last message for preview
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) as ProcessedChatConversation[]; // Assert type here

    // Process conversations to add a more useful title/image, especially for 1-on-1 chats
    const processedConversations = conversations.map((conv: ProcessedChatConversation) => {
      const otherParticipants = conv.participants.filter((p: Partial<User>) => p.id !== session.user?.id);
      let conversationTitle = conv.participants.map((p: Partial<User>) => p.name).join(', ');
      let conversationImage: string | null | undefined = null;

      if (otherParticipants.length === 1) { // 1-on-1 chat
        conversationTitle = otherParticipants[0].name || 'Chat';
        conversationImage = otherParticipants[0].image;
      } else if (otherParticipants.length === 0 && conv.participants.length === 1) { // Chat with self (notes, etc.)
        conversationTitle = 'My Notes'; // Or keep as user's name
        conversationImage = conv.participants[0].image;
      }
      // For group chats with > 2 people, the joined names title is okay, or could be a custom group name if that feature is added.

      return {
        ...conv,
        title: conversationTitle,
        image: conversationImage,
        // Ensure lastMessage is the string content, matching the ProcessedChatConversation interface and schema
        lastMessage: conv.messages.length > 0 && conv.messages[0]?.content ? conv.messages[0].content : (conv.lastMessage || null),
      };
    });


    return NextResponse.json(processedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/portal/chat/conversations
// Initiate a new chat conversation
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: 'Unauthenticated or user role missing' }, { status: 401 });
  }

  const currentUserId = session.user.id;
  const currentUserRole = session.user.role as UserRole;

  const { participantIds: requestedParticipantIds, initialMessage } = await request.json();
  let finalParticipantIdsForCreation: string[];
  let staffUserIdsFound: string[] = []; // Initialize to prevent potential errors if not populated

  if (currentUserRole === 'CUSTOMER') {
    const staffUsers = await prisma.user.findMany({
      where: { 
        OR: [
          { role: UserRole.ADMIN },
          { role: UserRole.MAINTENANCE },
        ]
      },
      select: { id: true },
    });

    if (staffUsers.length === 0) {
      return NextResponse.json({ error: 'No staff available to chat with at the moment. Please try again later.' }, { status: 404 });
    }
    // For customers, participants are self + all staff
    staffUserIdsFound = staffUsers.map(staff => staff.id);
    finalParticipantIdsForCreation = [currentUserId, ...staffUserIdsFound];
  } else { // Initiator is ADMIN or MAINTENANCE_WORKER
    if (!requestedParticipantIds || !Array.isArray(requestedParticipantIds) || requestedParticipantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs are required for staff-initiated chats.' }, { status: 400 });
    }
    // For staff, participants are self + those they specified
    const containsCustomer = await prisma.user.count({
      where: {
        id: { in: requestedParticipantIds },
        role: UserRole.CUSTOMER,
      },
    });
    if (containsCustomer > 1 && currentUserRole !== UserRole.ADMIN) {
      // Prevent non-admin staff from creating chats between multiple customers
      // Or if the list implies a customer-to-customer chat not involving the current staff user
      return NextResponse.json({ error: 'Invalid participants for staff-initiated chat' }, { status: 400 });
    }
    finalParticipantIdsForCreation = Array.from(new Set([...requestedParticipantIds, currentUserId]));
  }

  // Universal Check: A conversation cannot have more than one customer.
  const participantsData = await prisma.user.findMany({
    where: { id: { in: finalParticipantIdsForCreation } },
    select: { id: true, role: true },
  });

  const customerCount = participantsData.filter(p => p.role === 'CUSTOMER').length;
  if (customerCount > 1) {
    return NextResponse.json({ error: 'Conversations cannot include more than one customer.' }, { status: 403 });
  }
  
  // Ensure there's at least one participant (should always be true as initiator is added)
  if (finalParticipantIdsForCreation.length < 1) { 
    return NextResponse.json({ error: 'Invalid participants: conversation requires at least one participant.' }, { status: 400 });
  }
  // Specifically for customer-initiated, ensure at least one staff member was found and added.
  if (currentUserRole === 'CUSTOMER' && finalParticipantIdsForCreation.length < 2) {
      return NextResponse.json({ error: 'Cannot initiate a chat without any staff members.' }, { status: 400 });
  }

  const uniqueFinalParticipantIds = Array.from(new Set(finalParticipantIdsForCreation));
  
  // Filter for valid, non-empty string IDs before attempting to connect
  const validParticipantIdsToConnect = uniqueFinalParticipantIds
    .filter(id => typeof id === 'string' && id.trim() !== '')
    .map(id => ({ id }));

  // TODO: Consider adding a check here to see if a conversation with the exact same participants 
  // (especially customer + all current staff) already exists and is active, to avoid duplicates.
  // For now, we'll allow creating new conversations.

  try {
    const dataForPrismaCreate: any = {
      participants: {
        connect: validParticipantIdsToConnect,
      },
      updatedAt: new Date(),
      // Conditionally add messages, lastMessage, lastMessageAt only if initialMessage is present and valid
      ...(initialMessage && typeof initialMessage === 'string' && initialMessage.trim() !== '' && {
        messages: {
          create: {
            content: initialMessage,
            senderId: session.user.id,
          },
        },
        lastMessage: initialMessage,
        lastMessageAt: new Date(),
      }),
    };

    console.log('--- Prisma Create Data ---');
    console.log('validParticipantIdsToConnect:', JSON.stringify(validParticipantIdsToConnect, null, 2));
    console.log('initialMessage:', initialMessage);
    console.log('dataForPrismaCreate:', JSON.stringify(dataForPrismaCreate, null, 2));
    console.log('--------------------------');

    const newConversation = await prisma.chatConversation.create({
      data: dataForPrismaCreate, // Use the logged data object
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        }
      },
    }) as ProcessedChatConversation; // Assert type here

    // Similar processing as GET to add title/image
    const otherParticipants = newConversation.participants.filter((p: Partial<User>) => p.id !== session.user?.id);
    let conversationTitle = newConversation.participants.map((p: Partial<User>) => p.name).join(', ');
    let conversationImage: string | null | undefined = null;
    if (otherParticipants.length === 1) {
      conversationTitle = otherParticipants[0].name || 'Chat';
      conversationImage = otherParticipants[0].image;
    } else if (otherParticipants.length === 0 && newConversation.participants.length === 1) {
      conversationTitle = 'My Notes';
      conversationImage = newConversation.participants[0].image;
    }
    
    // Create the new conversation with the first message content as lastMessage
    const processedNewConversation: ProcessedChatConversation = {
      ...newConversation, // newConversation is from prisma.chatConversation.create
      title: conversationTitle,
      image: conversationImage,
      // Ensure lastMessage field on ProcessedChatConversation is the string content from the first message
      lastMessage: newConversation.messages.length > 0 ? newConversation.messages[0].content : null,
      // If you had lastMessageObject: newConversation.messages.length > 0 ? newConversation.messages[0] : null,
    };


    // TODO: Trigger Supabase Realtime event here if needed for other clients to see the new conversation
    // This might be handled by Supabase's own DB replication if configured for ChatConversation table.

    return NextResponse.json(processedNewConversation, { status: 201 });
  } catch (error) {
    // Enhanced error logging
    console.error('--- Error Creating Conversation ---');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Session User ID:', session?.user?.id);
    console.error('Requested Participant IDs (from client, if any):', requestedParticipantIds);
    console.error('Staff IDs found (IDs of users fetched with ADMIN/MAINTENANCE roles):', JSON.stringify(staffUserIdsFound, null, 2));
    console.error('Final Participant IDs for Creation (before unique filter):', JSON.stringify(finalParticipantIdsForCreation, null, 2));
    console.error('Valid Participant IDs to Connect (after filter & map):', JSON.stringify(validParticipantIdsToConnect, null, 2));
    console.error('Initial Message:', initialMessage);
    
    // Log the full error object from Prisma or other sources
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('Original Error (may have more specific type info):', error); 

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Record to connect not found
        // This error could mean one of the staff IDs or requested IDs was invalid
        return NextResponse.json({ error: 'One or more participant IDs are invalid.' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to create conversation', details: (error as Error).message }, { status: 500 });
  }
} 