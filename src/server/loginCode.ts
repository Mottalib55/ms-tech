import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from './db';

const LIFETIME_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

const hash = (email: string, code: string) =>
  createHash('sha256').update(`${email}:${code}:${process.env.NEXTAUTH_SECRET}`).digest();

/** Sending a new code replaces the previous one. */
export async function issueLoginCode(email: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const data = { codeHash: hash(email, code).toString('hex'), attempts: 0, expiresAt: new Date(Date.now() + LIFETIME_MS) };
  await prisma.loginCode.upsert({ where: { email }, create: { email, ...data }, update: data });
  return code;
}

/** True once, for the right code, in time, within the allowed attempts. */
export async function consumeLoginCode(email: string, code: string): Promise<boolean> {
  const row = await prisma.loginCode.findUnique({ where: { email } });
  if (!row) return false;
  if (row.expiresAt.getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
    await prisma.loginCode.delete({ where: { email } }).catch(() => {});
    return false;
  }
  const ok = timingSafeEqual(Buffer.from(row.codeHash, 'hex'), hash(email, code.trim()));
  if (ok) await prisma.loginCode.delete({ where: { email } }).catch(() => {});
  else await prisma.loginCode.update({ where: { email }, data: { attempts: { increment: 1 } } }).catch(() => {});
  return ok;
}

/** Without a mail provider the option is simply not offered. */
export const loginCodeEnabled = () => Boolean(process.env.RESEND_API_KEY || process.env.E2E_EXPOSE_RESET === '1');
