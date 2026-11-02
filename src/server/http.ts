import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError, type ZodType } from 'zod';
import { authOptions } from './auth';
import { prisma } from './db';
import { translate } from './i18n';

export class ApiError extends Error {
  /** `message` is a key from messages/<locale>/errors.json, or plain text. */
  constructor(public status: number, message: string, public values?: Record<string, string | number>) {
    super(message);
  }
}

export const notFound = (what = 'item') => new ApiError(404, `errors.notFound.${what}`);

/** Wraps a route handler: every failure becomes a JSON { error } the UI can show. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response | unknown>) {
  return async (...args: A): Promise<Response> => {
    try {
      const out = await handler(...args);
      return out instanceof Response ? out : NextResponse.json(out ?? { success: true });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: await translate(error.message, error.values) }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return NextResponse.json({ error: await translate(error.issues[0]?.message?.startsWith('errors.') ? error.issues[0].message : 'errors.invalidData') }, { status: 400 });
      }
      console.error('[api]', error);
      return NextResponse.json({ error: await translate('errors.generic') }, { status: 500 });
    }
  };
}

/** The signed-in user. Rejects sessions older than the last password change. */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) throw new ApiError(401, 'errors.sessionExpired');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.tokenVersion !== (session.user.tokenVersion ?? 0)) {
    throw new ApiError(401, 'errors.sessionExpired');
  }
  return user;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, 'errors.badRequest');
  }
  return schema.parse(body);
}

/** Accounts and everything below them are only reachable through their owner. */
export async function ownedAccount(userId: string, accountId: string) {
  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw notFound('account');
  return account;
}
