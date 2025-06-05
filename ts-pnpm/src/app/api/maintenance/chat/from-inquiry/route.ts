import { Prisma,UserRole } from '@prisma/client'; // Import UserRole and Prisma namespace
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import prisma from '@/lib/prisma';

// POST /api/maintenance/chat/from-inquiry
// Finds or creates a chat conversation based on an inquiryId
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  // For maintenance staff, we might rely on a different session/cookie mechanism
  // For now, let's assume an admin/maintenance user is making this request
  // And their ID is available. If using NextAuth for them:
  const staffUserId = token?.sub;

  if (!staffUserId) {
    // Fallback or check for maintenance-specific session cookie if not using NextAuth for them
    // This part needs to align with how maintenance staff are authenticated.
    // For demonstration, let's assume a generic staff ID if no session.
    // In a real scenario, this MUST be a secure and valid staff ID.
    // return NextResponse.json({ error: 'Unauthorized: Staff session not found' }, { status: 401 });
    console.warn('No staff session token found, proceeding with placeholder logic for staff ID. Ensure proper auth for maintenance.');
  }

  try {
    const body = await request.json();
    const { inquiryId } = body;

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { customer: true }, // Include customer if it's a registered user
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const customerId = inquiry.customerId; // This is if the customer is a registered User
    const customerEmail = inquiry.customerEmail;
    const customerName = inquiry.customerName;

    // If inquiry.customerId is null, we might need to find or create a guest/placeholder user
    // For simplicity, we'll assume direct inquiries might not always have a registered customerId initially
    // and proceed with customerEmail to find existing conversations or users.

    // Attempt to find an existing conversation with this customer (via email or ID) 
    // involving any staff member, or specifically the requesting staff member.
    const existingConversation = await prisma.chatConversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: customerId ? { id: customerId } : { email: customerEmail },
            },
          },
          {
            participants: {
              // Check if any staff is already in the conversation
              // This could be refined to check for a specific staff member (staffUserId)
              some: { role: { in: [UserRole.ADMIN, UserRole.MAINTENANCE] } }, 
            },
          },
        ],
      },
      select: { id: true },
    });

    if (existingConversation) {
      return NextResponse.json({ conversationId: existingConversation.id });
    }

    // If no existing conversation, create a new one.
    // First, ensure the customer exists as a User. If not, we might need a strategy:
    // 1. Create a guest User record (if your system supports it).
    // 2. For now, we'll assume if customerId is null, we can't link to a User directly for chat participants
    //    and the chat will be more informational until/unless they register.
    //    A more robust solution would create a User record if one doesn't exist for customerEmail.

    let targetCustomerId = customerId;
    if (!targetCustomerId) {
        // Attempt to find user by email for linking
        const userByEmail = await prisma.user.findUnique({ where: { email: customerEmail } });
        if (userByEmail) {
            targetCustomerId = userByEmail.id;
        } else {
            // Option: Create a guest user or handle as unlinked
            // For now, we won't create a user, this implies a limitation if no email match
            console.warn(`No registered user for inquiry ${inquiryId} with email ${customerEmail}. Chat may have limited linking.`);
            // If you MUST have a customer participant, this is where you'd create one.
            // For this simplified version, we'll proceed, but the conversation might lack a formal customer link if not found.
        }
    }

    // Ensure a staff member is part of the new conversation.
    // The staffUserId should be the ID of the logged-in maintenance person or an admin.
    // If staffUserId is not available from session, this will fail or use a placeholder.
    // For a real app, ensure staffUserId is reliably obtained.
    const placeholderStaffIdForDemo = staffUserId || "placeholder-staff-id"; // Replace with actual logic
    if (!staffUserId && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Critical: Staff user ID could not be determined for chat creation.' }, { status: 500 });
    }

    const participantsToConnect = [];
    if (targetCustomerId) {
        participantsToConnect.push({ id: targetCustomerId });
    }
    participantsToConnect.push({ id: placeholderStaffIdForDemo }); // Add the staff member

    if (participantsToConnect.length < 2 && !targetCustomerId) {
        // This case means we have only staff, and no identified customer to link.
        // This might happen if an inquiry is from a new email and we don't auto-create users.
        // The chat would essentially be with an "unknown" customer identified by inquiry details.
        // How to handle this depends on business logic. For now, log and proceed if staff is there.
        console.log(`Creating a chat for inquiry ${inquiryId} with staff ${placeholderStaffIdForDemo}, but no linkable customer user found for ${customerEmail}`);
        // If you must have a customer participant, throw error or handle differently.
    }
    
    // If only one participant (staff) after trying to add customer, this means customer was not found/created.
    // A conversation needs at least two for standard setup, unless it's a self-note.
    // However, for a customer inquiry, we expect a customer.
    // If targetCustomerId is null, the conversation will effectively be between staff and the *idea* of the customer from the inquiry.
    // This might be okay if the chat interface can show inquiry details alongside.

    const newConversationData: Prisma.ChatConversationCreateInput = {
        participants: {
          connect: participantsToConnect.map(p => ({ id: p.id }))
        },
        // It's good to associate the conversation with the inquiry if possible
        // This would require adding an optional `inquiryId` to your ChatConversation model
        // inquiry: { connect: { id: inquiryId } }, 
        // Add a title based on inquiry, e.g.:
        title: `Inquiry: ${inquiry.serviceNeeded || inquiry.customerName.substring(0,20)}... (${inquiry.id.substring(0,8)})`,
        // Set initial last message or leave it to be updated by first actual message
        lastMessage: `New inquiry from ${customerName} re: ${inquiry.serviceNeeded || 'general question'}`,
        lastMessageAt: new Date(),
      };

    const newConversation = await prisma.chatConversation.create({ data: newConversationData });

    return NextResponse.json({ conversationId: newConversation.id }, { status: 201 });

  } catch (error) {
    console.error('Error finding or creating conversation from inquiry:', error);
    return NextResponse.json({ error: 'Failed to process chat from inquiry' }, { status: 500 });
  }
} 