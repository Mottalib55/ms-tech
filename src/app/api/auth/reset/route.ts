import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { ApiError, parseBody, route } from '@/server/http';
import { clientIp, enforce } from '@/server/limiter';
import { resetSchema } from '@/server/validations';

export const POST = route(async (req: Request) => {
  await enforce(`reset:${clientIp(req)}`, 10, 900);
  const { token, password } = await parseBody(req, resetSchema);
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: createHash('sha256').update(token).digest('hex'), resetTokenExpires: { gt: new Date() } },
  });
  if (!user) throw new ApiError(400, 'Ce lien n\'est plus valable. Demandez-en un nouveau.');
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), resetTokenHash: null, resetTokenExpires: null, tokenVersion: { increment: 1 } },
  });
  return { success: true };
});
