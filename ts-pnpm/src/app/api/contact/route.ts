import { NextResponse } from "next/server";
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as z from "zod";

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

    // TODO: Store inquiry in database
    console.log("Form data received on server:", { name, email, phone, service, message });

    // TODO: Send email notification to admin

    return NextResponse.json({ message: "Form submitted successfully!" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimited')) {
        return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }    
    console.error("Error processing form submission:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
} 