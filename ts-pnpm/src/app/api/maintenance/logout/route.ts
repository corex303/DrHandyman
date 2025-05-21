import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // Not directly needed if setting on response

const COOKIE_NAME = 'maintenance_session';

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });
    return response;
  } catch (error) {
    console.error('Maintenance logout error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 