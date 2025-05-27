import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs'; // Uncommented
// Using path relative to baseUrl defined in tsconfig.json
import { User as PrismaUser,UserRole } from 'generated/prisma-client';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials'; // Uncommented
import EmailProvider from 'next-auth/providers/email'; // Added EmailProvider
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { Resend } from 'resend'; // Import Resend

import prisma from '@/lib/prisma'; // Assuming prisma client is at lib/prisma

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: 'onboarding@resend.dev', // Explicitly set the 'from' address here
      maxAge: 24 * 60 * 60, // How long email links are valid for (default is 24hr)
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const fromAddress = provider.from || process.env.EMAIL_FROM || 'onboarding@resend.dev';
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        try {
          const { data, error } = await resend.emails.send({
            from: fromAddress, 
            to: email,
            subject: 'Sign in to Dr. Handyman', // Subject for magic link sign-in
            html: `
              <h1>Sign in to Dr. Handyman</h1>
              <p>Click the link below to sign in to your account:</p>
              <a href="${url}">Sign In</a>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't request this, please ignore this email.</p>
            `,
          });

          if (error) {
            console.error('[NextAuth EmailProvider] Resend API Error:', error);
            throw new Error(`Failed to send verification email via Resend: ${error.message}`);
          }
        } catch (error) {
          console.error('[NextAuth EmailProvider] Error sending verification email via Resend:', error);
          throw new Error('Failed to send verification email due to a system error with Resend.');
        }
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("MissingCredentials"); 
        }

        const user: PrismaUser | null = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) { 
          throw new Error("InvalidCredentials"); 
        }

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified"); 
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("InvalidCredentials");
        }

        const userToReturn = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          image: user.image,
          emailVerified: user.emailVerified
        };
        return userToReturn;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        const userRole = (profile as any).role as UserRole || UserRole.CUSTOMER;
        const emailVerifiedDate = profile.email_verified ? new Date() : null;

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: userRole, 
          emailVerified: emailVerifiedDate,
        };
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      profile(profile) {
        const emailVerifiedDate = new Date(); 
        const userRole = (profile as any).role as UserRole || UserRole.CUSTOMER;

        return {
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
          role: userRole, 
          emailVerified: emailVerifiedDate,
        };
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (default for JWT)
  },
  callbacks: {
    async jwt({ token, user, account }) { 
      if (user) { // user object is only passed on first call (sign-in/registration)
        token.id = user.id;
        token.role = user.role; 

        if (account && (account.provider === 'google' || account.provider === 'github')) {
          token.emailVerified = new Date().toISOString(); 
        } else if (user.emailVerified instanceof Date) {
          token.emailVerified = (user.emailVerified as Date).toISOString();
        } else {
          token.emailVerified = null;
        }
      }
      return token;
    },
    async session({ session, token }) { 
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.role) {
          session.user.role = token.role as UserRole; 
        }
        if (token.emailVerified) {
          session.user.emailVerified = token.emailVerified as Date | null; 
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) { 
      const userEmail = user.email; 
      if (!userEmail) {
        console.error("[NextAuth] signIn: No email found on user object. Denying.");
        return '/auth/signin?error=EmailNotFoundInToken'; 
      }

      const dbUser: PrismaUser | null = await prisma.user.findUnique({ where: { email: userEmail } });

      if (account?.provider === 'credentials') {
        return true; 
      }

      if (account?.provider === 'email') {
        const freshDbUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (freshDbUser?.emailVerified) {
          if (!dbUser) { 
            (user as { role?: UserRole }).role = UserRole.CUSTOMER; 
          }
          return true;
        } else {
          console.error(`[NextAuth] signIn (email provider): Magic link processed for ${userEmail}, but emailVerified is still not set in DB. This is an unexpected state.`);
          return '/auth/signin?error=VerificationFailed'; 
        }
      }

      if (account && (account.provider === 'google' || account.provider === 'github')) {
        const isNewUser = !dbUser;

        if (user.emailVerified instanceof Date) {
            if (isNewUser || (dbUser && !dbUser.emailVerified)) {
                try {
                    await prisma.user.update({
                        where: { email: userEmail },
                        data: { emailVerified: new Date(user.emailVerified) },
                    });
                } catch (e) {
                    console.error("[NextAuth signIn OAuth] Error updating emailVerified in DB:", e);
                }
            }
        }

        const finalDbUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (finalDbUser) {
            let targetRole: UserRole = UserRole.CUSTOMER;
            if ([UserRole.ADMIN, UserRole.MAINTENANCE, UserRole.CUSTOMER].includes(finalDbUser.role as UserRole)) {
                targetRole = finalDbUser.role as UserRole;
            } else {
                targetRole = UserRole.CUSTOMER;
            }

            if (targetRole !== finalDbUser.role) {
                await prisma.user.update({
                    where: { email: userEmail },
                    data: { role: targetRole },
                });
            }
        }
        
        return true;
      }
      
      console.warn(`[NextAuth] signIn: Unhandled provider or scenario for user ${userEmail}. Denying.`);
      return false;
    },
    async redirect({ url, baseUrl }) {
      let absoluteUrl = url;
      if (url.startsWith('/')) {
        absoluteUrl = baseUrl + url;
      }

      const isFromAuthCallback = absoluteUrl.startsWith(`${baseUrl}/api/auth/callback/`) || 
                                 absoluteUrl.startsWith(`${baseUrl}/auth/signin`) || 
                                 absoluteUrl.startsWith(`${baseUrl}/auth/verify-request`);

      const callbackUrlParam = new URL(absoluteUrl).searchParams.get('callbackUrl');

      let targetRedirectUrl = '/portal'; // Default target after successful auth

      if (isFromAuthCallback) {
        if (callbackUrlParam && !callbackUrlParam.startsWith('/auth')) {
          targetRedirectUrl = callbackUrlParam; // Respect specific, non-auth callbackUrl
        }
        return `${baseUrl}/auth/redirecting?target=${encodeURIComponent(targetRedirectUrl)}`;
      }

      if (absoluteUrl.startsWith(`${baseUrl}/auth/signout`)) {
        return `${baseUrl}/auth/signin`;
      }

      if (absoluteUrl === `${baseUrl}${targetRedirectUrl}` || absoluteUrl === (baseUrl + callbackUrlParam)) {
         return absoluteUrl;
      }
      
      if (absoluteUrl.startsWith(`${baseUrl}/auth`)){
        return `${baseUrl}/auth/redirecting?target=${encodeURIComponent('/portal')}`;
      }
      
      return absoluteUrl;
    }
  },
  pages: {
    signIn: '/auth/signin', 
    verifyRequest: '/auth/verify-request', // Page to show after email for magic link has been sent
    // error: '/auth/error', // Custom error page (optional)
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: IS_PRODUCTION ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: IS_PRODUCTION,
      },
    },
    callbackUrl: {
      name: IS_PRODUCTION ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: IS_PRODUCTION,
      },
    },
    csrfToken: {
      name: IS_PRODUCTION ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`, // Note: __Host- implies path=/, secure, and no domain
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: IS_PRODUCTION,
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 