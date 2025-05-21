import { NextResponse } from 'next/server';
// We'll use a simple marker value instead of JWT for now
// import { sign } from 'jsonwebtoken'; 
// import { cookies } from 'next/headers';

// const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-for-maintenance-jwt';
const COOKIE_NAME = 'maintenance_session';
const SIMPLIFIED_TOKEN_VALUE = 'maintenance_session_active_marker'; // A simple marker

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!process.env.MAINTENANCE_GLOBAL_PASSWORD) {
      console.error('MAINTENANCE_GLOBAL_PASSWORD is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    if (password === process.env.MAINTENANCE_GLOBAL_PASSWORD) {
      // Using a simplified marker value instead of a JWT for now
      // const payload = { isAuthenticated: true, timestamp: Date.now() };
      // const token = sign(payload, JWT_SECRET, { expiresIn: '8h' });
      const token = SIMPLIFIED_TOKEN_VALUE;

      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Maintenance login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 