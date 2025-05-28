import { NextResponse } from "next/server";
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as z from "zod";
import prisma from '@/lib/prisma'; // Import Prisma client
import { UserRole } from '@prisma/client'; // Corrected import path for UserRole

// Re-define or import the schema. For simplicity, re-defining here.
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional().or(z.literal('')),
  service: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

// Rate Limiter Configuration (example: 5 requests per minute per IP)
const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds
});

export async function POST(request: Request) {
  // Basic CSRF Check: Origin Header
  // TODO: Implement more robust CSRF protection (e.g., using NextAuth.js or a dedicated CSRF library)
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://${host}`;

  // Allow requests from the same origin or if origin is null (e.g. non-browser clients, or strict same-origin requests)
  // In a production environment, ensure NEXT_PUBLIC_SITE_URL is correctly set.
  if (origin && new URL(origin).origin !== new URL(siteUrl).origin) {
    console.warn(`CSRF attempt blocked: Origin (${origin}) does not match Host (${siteUrl})`);
    return NextResponse.json({ message: "Forbidden: Invalid origin" }, { status: 403 });
  }

  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'; // Get client IP
    await rateLimiter.consume(ip);

    const body = await request.json();
    const validatedData = formSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ errors: validatedData.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, phone, service, message } = validatedData.data;

    // --- Store inquiry in database & handle user --- 
    let inquiryCustomer = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create a new one with CUSTOMER role
    if (!inquiryCustomer) {
      inquiryCustomer = await prisma.user.create({
        data: {
          email: email,
          name: name,
          role: UserRole.CUSTOMER, // Default role for new users from contact form
        },
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        serviceNeeded: service || null,
        message: message,
        customerId: inquiryCustomer.id, // Link to existing or new user
      },
    });
    
    console.log("Inquiry stored in database:", inquiry);
    // --- END Store inquiry ---    

    // --- Create ChatConversation --- 
    try {
      const staffMember = await prisma.user.findFirst({
        where: {
          OR: [
            { role: UserRole.ADMIN },
            { role: UserRole.MAINTENANCE },
          ],
        },
      });

      if (staffMember && inquiryCustomer) {
        const conversation = await prisma.chatConversation.create({
          data: {
            participants: {
              connect: [
                { id: inquiryCustomer.id },
                { id: staffMember.id },
              ],
            },
            // Set the direct foreign keys for customer and staff if they exist
            customerId: inquiryCustomer.id,
            staffId: staffMember.id,
            // Optionally, add an initial message
            // messages: {
            //   create: {
            //     senderId: staffMember.id, // Or a system ID
            //     content: `New inquiry #${inquiry.id} received from ${inquiryCustomer.name}. Subject: ${service || 'General Inquiry'}`,
            //   },
            // },
          },
          include: { participants: true } // Include participants to confirm creation
        });
        console.log("Chat conversation created:", conversation);
      } else {
        console.warn("Could not create chat conversation: Staff member or customer not found.");
      }
    } catch (chatError: any) {
      console.error("Error creating chat conversation:", chatError);
      // Do not fail the whole request if chat creation fails, inquiry is already saved.
    }
    // --- END Create ChatConversation --- 

    // TODO: Send email notification to admin about the new inquiry

    return NextResponse.json({ message: "Form submitted successfully! Your inquiry has been received." , inquiryId: inquiry.id }, { status: 200 });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimited')) {
        return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }    
    console.error("Error processing form submission:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
} 