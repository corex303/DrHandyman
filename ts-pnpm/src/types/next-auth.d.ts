import type { Session as NextAuthSession, User as NextAuthUser } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';

import type { UserRole } from '../../generated/prisma-client'; // Assuming UserRole enum is exported from prisma client

declare module 'next-auth' {
  interface Session extends NextAuthSession {
    user?: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & NextAuthUser; // Keep existing User fields like name, email, image
  }

  interface User extends NextAuthUser {
    id: string;
    role: UserRole;
    emailVerified: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    id: string;
    role: UserRole;
    emailVerified: string | null;
    // name, email, picture will be standard if populated from provider
  }
} 