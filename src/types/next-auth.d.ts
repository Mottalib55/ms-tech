import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; tokenVersion?: number; isDemo?: boolean };
  }
  interface User { id: string; tokenVersion?: number; isDemo?: boolean }
}

declare module 'next-auth/jwt' {
  interface JWT { id?: string; tokenVersion?: number; isDemo?: boolean }
}
