import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';

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

export async function GET() {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const appearance = await prisma.appearanceSettings.findFirst();
    return NextResponse.json(appearance);
  } catch (error) {
    console.error('Failed to fetch appearance settings:', error);
    return NextResponse.json({ error: 'Failed to fetch appearance settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    let appearance;
    if (id) {
      appearance = await prisma.appearanceSettings.update({
        where: { id },
        data,
      });
    } else {
      appearance = await prisma.appearanceSettings.create({
        data,
      });
    }
    return NextResponse.json(appearance);
  } catch (error) {
    console.error('Failed to update appearance settings:', error);
    return NextResponse.json({ error: 'Failed to update appearance settings' }, { status: 500 });
  }
}

// Note: Logo/Favicon uploads would typically be handled in separate endpoints
// (e.g., /api/admin/settings/branding/logo) that manage file storage (e.g., to Cloudinary)
// and then update the URL in the 'appearance' JSON via this PUT endpoint or directly.
// For simplicity in this step, file upload logic is not included here. 