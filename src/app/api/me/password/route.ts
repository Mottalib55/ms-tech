import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { ApiError, parseBody, requireUser, route } from '@/server/http';
import { passwordSchema } from '@/server/validations';
import { enforce } from '@/server/limiter';

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  if (user.isDemo) throw new ApiError(400, 'Indisponible en mode démo.');
  await enforce(`pw:${user.id}`, 10, 300);
  const { currentPassword, newPassword } = await parseBody(req, passwordSchema);
  if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(403, 'Mot de passe actuel incorrect.');
  }
  // Bumping the version signs out every other device.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12), tokenVersion: { increment: 1 } },
  });
  return { tokenVersion: updated.tokenVersion };
});
