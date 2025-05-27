import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
// Remove Resend and uuidv4 as NextAuth will handle email sending
// import { Resend } from 'resend';
// import { v4 as uuidv4 } from 'uuid';

// const resend = new Resend(process.env.RESEND_API_KEY); // Not needed here anymore

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null, // User is not verified yet
        role: 'CUSTOMER',
      },
    });

    // Programmatically trigger NextAuth's EmailProvider to send a verification/sign-in link
    try {
      const signInEmailUrl = `${process.env.NEXTAUTH_URL}/api/auth/signin/email`;
      const csrfTokenResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/csrf`);
      const csrfJson = await csrfTokenResponse.json();
      const csrfToken = csrfJson?.csrfToken;

      if (!csrfToken) {
        console.error('[Register API] Failed to fetch CSRF token for email sign-in trigger');
        // Don't delete user here, they are registered but email failed. They can try signing in via email manually.
        return NextResponse.json({ message: 'Registration successful, but failed to automatically send verification email. Please try signing in with email.' }, { status: 201 });
      }

      const emailSignInResponse = await fetch(signInEmailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Cookies might be needed if your NextAuth setup relies on them for CSRF or session state even for this call
          // For simplicity, omitting direct cookie forwarding from client request if possible.
          // The csrfToken in the body is often the primary CSRF protection for POST to signin/email.
        },
        body: new URLSearchParams({
          email: email,
          csrfToken: csrfToken, 
          // callbackUrl: process.env.NEXTAUTH_URL || '/' // Optional: where to redirect after successful email link click
        }),
      });

      if (!emailSignInResponse.ok) {
        const errorBody = await emailSignInResponse.text();
        console.error(`[Register API] Failed to trigger NextAuth email sign-in for ${email}. Status: ${emailSignInResponse.status}. Body: ${errorBody}`);
        // User is registered, but email trigger failed. They can try manually.
        return NextResponse.json({ message: 'Registration successful, but failed to automatically send verification email. Please try signing in with email.'}, { status: 201 });
      }

      console.log(`[Register API] Successfully triggered NextAuth email sign-in for ${email}`);

    } catch (error) {
      console.error('[Register API] Error triggering NextAuth email sign-in:', error);
      // User is registered, but email trigger failed. They can try manually.
      return NextResponse.json({ message: 'Registration successful, but failed to automatically send verification email. Please try signing in with email.' }, { status: 201 });
    }

    return NextResponse.json(
        { message: 'Registration successful! Please check your email to verify your account.' }, 
        { status: 201 }
    );

  } catch (error) {
    console.error('[Register API] Outer registration error:', error);
    return NextResponse.json({ message: 'Internal server error during registration.' }, { status: 500 });
  }
} 