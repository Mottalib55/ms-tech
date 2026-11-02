import { prisma } from '@/server/db';
import { parseBody, requireUser, route } from '@/server/http';
import { languageSchema } from '@/server/validations';

/** Called by the language switcher: e-mails and other devices follow the account's language. */
export const PUT = route(async (req: Request) => {
  const user = await requireUser();
  const { language } = await parseBody(req, languageSchema);
  await prisma.user.update({ where: { id: user.id }, data: { language } });
  return { success: true };
});
