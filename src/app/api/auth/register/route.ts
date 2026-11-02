import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { ApiError, parseBody, route } from '@/server/http';
import { clientIp, enforce } from '@/server/limiter';
import { registerSchema } from '@/server/validations';
import { requestLocale } from '@/server/i18n';

export const POST = route(async (req: Request) => {
  await enforce(`register:${clientIp(req)}`, 10, 3600);
  const { name, email, password } = await parseBody(req, registerSchema);
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ApiError(409, 'errors.auth.emailExists');
  }
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12), language: await requestLocale() },
  });
  return { id: user.id, name: user.name, email: user.email };
});
