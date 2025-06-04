// import { PrismaAdapter } from '@next-auth/prisma-adapter';
// import bcrypt from 'bcryptjs'; 
// import { User as PrismaUser,UserRole } from 'generated/prisma-client';
import NextAuth from 'next-auth'; // Keep NextAuth for the handler
// import CredentialsProvider from 'next-auth/providers/credentials'; 
// import EmailProvider from 'next-auth/providers/email'; 
// import GitHubProvider from 'next-auth/providers/github';
// import GoogleProvider from 'next-auth/providers/google';
// import { Resend } from 'resend'; 

// import prisma from '@/lib/prisma'; 
import { authOptions } from '@/lib/auth/options'; // Import from new location

// const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// export const authOptions: NextAuthOptions = { ... MOVED ... };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 