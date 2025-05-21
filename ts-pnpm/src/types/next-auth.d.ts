import type { UserRole } from '@prisma/client'; // Assuming UserRole enum is exported from prisma client
import type { Session as NextAuthSession, User as NextAuthUser } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends NextAuthSession {
    user?: {
      id: string;
      role: UserRole;
    } & NextAuthUser; // Keep existing User fields like name, email, image
  }

  interface User extends NextAuthUser {
    id: string;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    id: string;
    role: UserRole;
    // name, email, picture will be standard if populated from provider
  }
} 