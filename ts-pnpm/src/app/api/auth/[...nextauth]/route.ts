import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma'; // Assuming prisma client is at lib/prisma
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[NextAuth] Authorize: Received credentials:", credentials?.email);
        if (!credentials?.email || !credentials.password) {
          console.log("[NextAuth] Authorize: Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        console.log("[NextAuth] Authorize: User fetched from DB:", user?.email, "Role:", user?.role);

        if (!user || !user.password) {
          console.log("[NextAuth] Authorize: User not found or no password in DB");
          return null;
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        console.log("[NextAuth] Authorize: Password valid?", isValidPassword);

        if (!isValidPassword) {
          console.log("[NextAuth] Authorize: Invalid password");
          return null;
        }

        const userToReturn = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        console.log("[NextAuth] Authorize: Returning user object:", userToReturn);
        return userToReturn;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } } // Optional: if refresh tokens are needed
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt', // Using JWT for session strategy (Subtask 3.3)
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("[NextAuth] JWT Callback: Incoming user:", user?.email, "Role:", user?.role);
      console.log("[NextAuth] JWT Callback: Incoming token:", token);
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      console.log("[NextAuth] JWT Callback: Returning token:", token);
      return token;
    },
    async session({ session, token, user: sessionUser }) {
      console.log("[NextAuth] Session Callback: Incoming token:", token);
      console.log("[NextAuth] Session Callback: Incoming session:", session);
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      console.log("[NextAuth] Session Callback: Returning session:", session);
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin', // Default sign-in page, can be customized
    // error: '/auth/error', // Error code passed in query string as ?error=
    // signOut: '/auth/signout',
    // verifyRequest: '/auth/verify-request', // (e.g. Check your email)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // domain: 'yourdomain.com' // Optional: specify domain if needed
      }
    },
    // You can add other cookie configurations here if needed (e.g., csrfToken, callbackUrl, pkceCodeVerifier)
  },
  // debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 