import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { User as PrismaUser, UserRole } from 'generated/prisma-client'; // Adjusted path if necessary based on actual structure
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { Resend } from 'resend';

import prisma from '@/lib/prisma'; // Assuming prisma client is at lib/prisma

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: 'onboarding@resend.dev',
      maxAge: 24 * 60 * 60,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const fromAddress = provider.from || process.env.EMAIL_FROM || 'onboarding@resend.dev';
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        try {
          const { data, error } = await resend.emails.send({
            from: fromAddress, 
            to: email,
            subject: 'Sign in to Dr. Handyman',
            html: `
              <h1>Sign in to Dr. Handyman</h1>
              <p>Click the link below to sign in to your account:</p>
              <a href="${url}">Sign In</a>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn\\'t request this, please ignore this email.</p>
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) { 
      if (user) {
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
          session.user.emailVerified = new Date(token.emailVerified);
        } else {
          session.user.emailVerified = null;
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

        // Ensure user.emailVerified is treated as a Date if it exists
        let emailVerifiedTime: Date | null = null;
        if (user.emailVerified) {
            if (user.emailVerified instanceof Date) {
                emailVerifiedTime = user.emailVerified;
            } else if (typeof user.emailVerified === 'string') { // Handle ISO string case if necessary
                emailVerifiedTime = new Date(user.emailVerified);
            }
        }
        
        if (emailVerifiedTime) {
            if (isNewUser || (dbUser && !dbUser.emailVerified)) {
                try {
                    await prisma.user.update({
                        where: { email: userEmail },
                        data: { emailVerified: emailVerifiedTime },
                    });
                } catch (e) {
                    console.error("[NextAuth signIn OAuth] Error updating emailVerified in DB:", e);
                }
            }
        }


        if (isNewUser) {
          (user as { role?: UserRole }).role = UserRole.CUSTOMER; 
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin', 
    // signOut: '/auth/signout', // default
    // error: '/auth/error', // default
    verifyRequest: '/auth/verify-request', // Used for Email provider
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },
  // debug: !IS_PRODUCTION, // Enable debug messages in development
  logger: { // More fine-grained logging control
    error(code, metadata) {
      console.error(`[NextAuth Error] Code: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`[NextAuth Warning] Code: ${code}`);
    },
    // debug(code, metadata) {
    //   if (!IS_PRODUCTION) { // Only log debug messages in development
    //     console.log(`[NextAuth Debug] Code: ${code}`, metadata);
    //   }
    // },
  },
  secret: process.env.NEXTAUTH_SECRET, 
}; 