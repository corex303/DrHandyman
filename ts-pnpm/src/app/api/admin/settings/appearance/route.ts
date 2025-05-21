import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; // Corrected: Default import for prisma
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to get or create the single SiteSettings record
async function getSiteSettings() {
  let settings = await prisma.siteSettings.findFirst();
  
  if (!settings) {
    // If no settings record exists at all, create it with a default appearance object.
    settings = await prisma.siteSettings.create({
      data: {
        siteName: 'Dr. Handyman NC', // Default site name
        appearance: { // Default appearance object
          theme: 'default', // Example default theme
          logoUrl: '',
          faviconUrl: ''
        },
      },
    });
  } else if (settings.appearance === null || typeof settings.appearance !== 'object') {
    // If settings record exists, but appearance is null or not an object, update it.
    const existingAppearance = (typeof settings.appearance === 'object' && settings.appearance !== null) ? settings.appearance : {};
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { 
        appearance: { // Default appearance object
          theme: 'default', 
          logoUrl: (existingAppearance as any)?.logoUrl || '',
          faviconUrl: (existingAppearance as any)?.faviconUrl || ''
        }
      },
    });
  }
  return settings;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Corrected: Check for session and session.user before accessing role
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    // Ensure settings and settings.appearance are not null before sending
    if (!settings || !settings.appearance) {
      // This case should ideally be handled by getSiteSettings, but as a safeguard:
      console.error('[GET /api/admin/settings/appearance] Critical: getSiteSettings returned invalid data.');
      // Return a default structure that the frontend expects for appearance
      return NextResponse.json({ theme: 'default', logoUrl: '', faviconUrl: '' }); 
    }
    return NextResponse.json(settings.appearance);
  } catch (error) {
    console.error('[GET /api/admin/settings/appearance] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch appearance settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Corrected: Check for session and session.user before accessing role
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const currentSettings = await getSiteSettings();

    // Ensure currentSettings.appearance is a valid object for spreading
    const currentAppearanceObject = (typeof currentSettings.appearance === 'object' && currentSettings.appearance !== null) 
                                      ? currentSettings.appearance 
                                      : {};

    if (typeof data !== 'object' || data === null) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const updatedSettings = await prisma.siteSettings.update({
      where: { id: currentSettings.id },
      data: {
        // Ensure we are merging with existing appearance settings if a partial update is sent
        appearance: { 
          ...(currentAppearanceObject as object), 
          ...data 
        },
      },
    });
    return NextResponse.json(updatedSettings.appearance);
  } catch (error) {
    console.error('[PUT /api/admin/settings/appearance] Error:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update appearance settings' }, { status: 500 });
  }
}

// Note: Logo/Favicon uploads would typically be handled in separate endpoints
// (e.g., /api/admin/settings/branding/logo) that manage file storage (e.g., to Cloudinary)
// and then update the URL in the 'appearance' JSON via this PUT endpoint or directly.
// For simplicity in this step, file upload logic is not included here. 