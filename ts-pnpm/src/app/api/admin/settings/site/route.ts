import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper function to get the singleton settings object
async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { singleton: 1 },
  });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { singleton: 1 },
    });
  }

  return settings;
}

/**
 * GET /api/admin/settings/site
 * Retrieves the current site settings.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/site
 * Updates the site settings.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const currentSettings = await getSiteSettings();

    const updatedSettings = await prisma.siteSettings.update({
      where: { id: currentSettings.id },
      data: { ...body },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 