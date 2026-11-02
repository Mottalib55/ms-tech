import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/server/db';
import { parseBody, route } from '@/server/http';
import { clientIp, enforce } from '@/server/limiter';
import { sendMail } from '@/server/mail';
import { forgotSchema } from '@/server/validations';

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
    const link = `${process.env.NEXTAUTH_URL}/reset?token=${token}`;
    const sent = await sendMail(email, 'Réinitialisez votre mot de passe MS Tech',
      `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, ouvrez ce lien (valable une heure) :</p><p><a href="${link}">${link}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`);
    if (!sent) console.warn('[mail] RESEND_API_KEY absent ou envoi refusé : lien de réinitialisation non envoyé');
    if (process.env.E2E_EXPOSE_RESET === '1') return { success: true, devToken: token };
  }
  return { success: true };
});
