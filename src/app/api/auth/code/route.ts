import { prisma } from '@/server/db';
import { parseBody, route } from '@/server/http';
import { translate } from '@/server/i18n';
import { clientIp, enforce } from '@/server/limiter';
import { issueLoginCode, loginCodeEnabled } from '@/server/loginCode';
import { sendMail } from '@/server/mail';
import { forgotSchema } from '@/server/validations';
import type { Locale } from '@/i18n/routing';

export const GET = route(async () => ({ enabled: loginCodeEnabled() }));

// Always the same answer, so this cannot be used to test who has an account.
export const POST = route(async (req: Request) => {
  await enforce(`code:${clientIp(req)}`, 10, 900);
  const { email } = await parseBody(req, forgotSchema);
  await enforce(`code-mail:${email}`, 5, 900);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isDemo && loginCodeEnabled()) {
    const code = await issueLoginCode(email);
    const locale = user.language as Locale;
    const sent = await sendMail(
      email,
      await translate('server.loginCode.subject', { code }, locale),
      `<p>${await translate('server.loginCode.body', { code }, locale)}</p><p style="font-size:28px;font-weight:600;letter-spacing:4px">${code}</p><p>${await translate('server.loginCode.ignore', undefined, locale)}</p>`,
    );
    if (!sent) console.warn('[mail] login code not sent');
    if (process.env.E2E_EXPOSE_RESET === '1') return { success: true, devCode: code };
  }
  return { success: true };
});
