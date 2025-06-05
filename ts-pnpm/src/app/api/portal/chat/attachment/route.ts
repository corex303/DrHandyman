import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// import { supabase } from '@/lib/supabaseClient'; // No longer using the anon client for upload
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; // Import the admin client getter

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  // console.log("NextAuth JWT token in chat/attachment route:", JSON.stringify(token, null, 2)); 
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized: No user session found' }, { status: 401 });
  }
  const userId = token.sub;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Basic validation (can be expanded)
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const supabaseAdmin = getSupabaseAdmin(); // Get the admin client
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available. Check SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json({ error: 'File upload service is currently unavailable.' }, { status: 503 });
    }

    // Upload to Supabase Storage using the ADMIN client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('chat-attachments') 
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, 
      });

    if (uploadError) {
      console.error('Supabase admin upload error:', uploadError); // Changed log prefix
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 });
    }

    // Construct the public URL using the ADMIN client
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
        console.error('Failed to get public URL for Supabase file (using admin client):', filePath);
        return NextResponse.json({ error: 'File uploaded but failed to retrieve public URL.' }, { status: 500 });
    }

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      type: file.type,
      name: file.name, 
      size: file.size,
      storagePath: filePath, 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error processing file upload:', error);
    if (error.message.includes('request.formData')) {
        return NextResponse.json({ error: 'Invalid request format or no form data received.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process file upload' }, { status: 500 });
  }
} 