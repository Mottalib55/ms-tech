import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { route } from '@/server/http';
import { clientIp, enforce } from '@/server/limiter';
import { createDemoData } from '@/server/demo';
import { requestLocale, translate } from '@/server/i18n';

// The demo: a private throwaway account with invented data, removed after
// a day by the cron. Each visitor gets their own, so nobody sees anyone's edits.
export const POST = route(async (req: Request) => {
  await enforce(`demo:${clientIp(req)}`, 10, 3600);
  const locale = await requestLocale();
  const password = randomBytes(18).toString('base64url');
  const email = `demo-${randomBytes(8).toString('hex')}@demo.mstech.invalid`;
  const user = await prisma.user.create({
    data: { name: await translate('server.demo.userName', undefined, locale), language: locale, email, isDemo: true, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createDemoData(user.id, locale);
  return { email, password };
});
