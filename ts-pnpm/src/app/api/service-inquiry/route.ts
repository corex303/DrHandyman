import fs from 'fs/promises'; // For file system operations
import { NextRequest, NextResponse } from 'next/server';
import path from 'path'; // For path manipulation
import { z } from 'zod';

import prisma from '@/lib/prisma';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'inquiries');

async function ensureUploadsDirExists() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log(`Uploads directory ensured: ${UPLOADS_DIR}`);
  } catch (error) {
    console.error("Error creating uploads directory:", error);
    // Depending on your error handling strategy, you might want to throw this error
  }
}
// Call it once when the module loads or before handling requests
ensureUploadsDirExists();


const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").optional().or(z.literal('')),
  service: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters."),
  // Add g-recaptcha-response to the schema for validation if desired, or handle separately
});

export async function POST(request: NextRequest) {
  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Error parsing FormData:", error);
    return NextResponse.json({ message: "Invalid request format.", errors: { form: ["Could not parse form data."] } }, { status: 400 });
  }
  
  const captchaToken = formData.get('g-recaptcha-response') as string;
  if (!captchaToken) {
    return NextResponse.json({ message: "CAPTCHA validation failed", errors: { captcha: ["Please complete the CAPTCHA."] } }, { status: 400 });
  }

  try {
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not set in environment variables.');
      return NextResponse.json({ message: "Server configuration error. Please try again later." }, { status: 500 });
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${captchaToken}`;
    const response = await fetch(verificationUrl, { method: 'POST' });
    const verificationResult = await response.json();

    if (!verificationResult.success) {
      console.error('CAPTCHA verification failed:', verificationResult['error-codes']);
      return NextResponse.json({ message: "CAPTCHA validation failed. Please try again.", errors: { captcha: ["Invalid CAPTCHA. Please try again."] } }, { status: 400 });
    }
  } catch (error) {
    console.error("Error during CAPTCHA verification:", error);
    return NextResponse.json({ message: "Error verifying CAPTCHA. Please try again later." }, { status: 500 });
  }
  
  const dataToValidate: Record<string, any> = {};
  formData.forEach((value, key) => {
    // Exclude g-recaptcha-response from Zod validation if it's not in the schema
    if (key !== 'attachments' && key !== 'g-recaptcha-response') { 
      dataToValidate[key] = value;
    }
  });

  const validation = inquirySchema.safeParse(dataToValidate);
  if (!validation.success) {
    return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, phone, service, message } = validation.data;
  const files = formData.getAll('attachments').filter(file => file instanceof File && file.size > 0) as File[];
  const uploadedFileDetails: Array<{ fileName: string; filePath: string; fileType: string; fileSize: number }> = [];

  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Sanitize filename and ensure uniqueness
      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Basic sanitization
      const uniqueFilename = `${Date.now()}-${originalName}`;
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);
      
      await fs.writeFile(filePath, buffer);
      console.log(`File uploaded to: ${filePath}`);
      
      uploadedFileDetails.push({
        fileName: file.name, // Store original name for DB record
        filePath: `/uploads/inquiries/${uniqueFilename}`, // Relative path for client access
        fileType: file.type,
        fileSize: file.size,
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        serviceNeeded: service,
        message: message,
        attachments: uploadedFileDetails.length > 0 ? {
          create: uploadedFileDetails.map(att => ({
            fileName: att.fileName,
            filePath: att.filePath,
            fileType: att.fileType,
            fileSize: att.fileSize,
          })),
        } : undefined,
      },
    });

    // TODO: Implement email notification to admin

    return NextResponse.json({ message: "Inquiry submitted successfully! We will get back to you soon.", inquiryId: inquiry.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating inquiry or uploading files:", error);
    // Basic error cleanup: attempt to delete files if inquiry creation failed
    for (const uploadedFile of uploadedFileDetails) {
      try {
        const fullPath = path.join(process.cwd(), 'public', uploadedFile.filePath); // Construct full path again
        await fs.unlink(fullPath);
        console.log(`Cleaned up file: ${fullPath}`);
      } catch (cleanupError) {
        console.error(`Error cleaning up file ${uploadedFile.filePath}:`, cleanupError);
      }
    }
    return NextResponse.json({ message: "An internal error occurred. Please try again later." }, { status: 500 });
  }
} 