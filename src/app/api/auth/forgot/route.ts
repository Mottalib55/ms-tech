import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/server/db';
import { parseBody, route } from '@/server/http';
import { clientIp, enforce } from '@/server/limiter';
import { sendMail } from '@/server/mail';
import { forgotSchema } from '@/server/validations';
import { translate } from '@/server/i18n';
import type { Locale } from '@/i18n/routing';

// Always the same answer, so this page cannot be used to test who has an account.
export const POST = route(async (req: Request) => {
  await enforce(`forgot:${clientIp(req)}`, 5, 900);
  const { email } = await parseBody(req, forgotSchema);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isDemo) {
    const token = randomBytes(32).toString('base64url');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: createHash('sha256').update(token).digest('hex'), resetTokenExpires: new Date(Date.now() + 3600_000) },
    });
    const locale = user.language as Locale;
    const link = `${process.env.NEXTAUTH_URL}/${locale}/reset?token=${token}`;
    const sent = await sendMail(
      email,
      await translate('server.reset.subject', undefined, locale),
      `<p>${await translate('server.reset.hello', undefined, locale)}</p><p>${await translate('server.reset.body', undefined, locale)}</p><p><a href="${link}">${link}</a></p><p>${await translate('server.reset.ignore', undefined, locale)}</p>`,
    );
    if (!sent) console.warn('[mail] reset link not sent: RESEND_API_KEY missing or send refused');
    if (process.env.E2E_EXPOSE_RESET === '1') return { success: true, devToken: token };
  }
  return { success: true };
});
