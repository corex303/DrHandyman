import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin?error=VerificationMissingToken', req.url));
  }

  try {
    const verificationRequest = await prisma.emailVerificationRequest.findUnique({
      where: { token },
      include: { user: true }, // Include the user to update them
    });

    if (!verificationRequest) {
      return NextResponse.redirect(new URL('/auth/signin?error=VerificationInvalidToken', req.url));
    }

    if (new Date() > verificationRequest.expires) {
      // Optionally, delete the expired token
      await prisma.emailVerificationRequest.delete({ where: { token } });
      return NextResponse.redirect(new URL('/auth/signin?error=VerificationExpiredToken', req.url));
    }

    // Token is valid and not expired, update the user
    await prisma.user.update({
      where: { id: verificationRequest.userId },
      data: { emailVerified: new Date() }, // Mark email as verified with current timestamp
    });

    // Delete the token now that it has been used
    await prisma.emailVerificationRequest.delete({
      where: { token },
    });

    // Redirect to sign-in page with a success message
    return NextResponse.redirect(new URL('/auth/signin?message=EmailVerified', req.url));

  } catch (error) {
    console.error('Email verification error:', error);
    // Generic error redirect
    return NextResponse.redirect(new URL('/auth/signin?error=VerificationFailed', req.url));
  }
} 