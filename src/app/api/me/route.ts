import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { ApiError, parseBody, requireUser, route } from '@/server/http';
import { deleteAccountSchema, profileSchema } from '@/server/validations';
import { recordSnapshot } from '@/server/summary';
import { enforce } from '@/server/limiter';

const pub = (u: { id: string; name: string | null; email: string; currency: string; language: string; isDemo: boolean; createdAt: Date }) => ({
  id: u.id, name: u.name, email: u.email, currency: u.currency, language: u.language, isDemo: u.isDemo, createdAt: u.createdAt,
});

export const GET = route(async () => pub(await requireUser()));

export const PATCH = route(async (req: Request) => {
  const user = await requireUser();
  const { currentPassword, ...data } = await parseBody(req, profileSchema);
  if (data.email && data.email !== user.email) {
    if (user.isDemo) throw new ApiError(400, 'Indisponible en mode démo.');
    await enforce(`pw:${user.id}`, 10, 300);
    if (!currentPassword || !user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ApiError(403, 'Mot de passe actuel requis pour changer d\'email.');
    }
    if (await prisma.user.findUnique({ where: { email: data.email } })) {
      throw new ApiError(409, 'Cet email est déjà utilisé.');
    }
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  if (data.currency && data.currency !== user.currency) {
    // The curve is stored in the user's currency: restart it rather than plot two units.
    await prisma.performancePoint.deleteMany({ where: { userId: user.id } });
    await recordSnapshot(user.id);
  }
  return pub(updated);
});

// Apple guideline 5.1.1(v): an account created in the app can be deleted in the app.
export const DELETE = route(async (req: Request) => {
  const user = await requireUser();
  const { password } = await parseBody(req, deleteAccountSchema);
  await enforce(`pw:${user.id}`, 10, 300);
  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(403, 'Mot de passe incorrect.');
  }
  await prisma.user.delete({ where: { id: user.id } });
  return { success: true };
});
