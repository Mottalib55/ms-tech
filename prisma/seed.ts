import bcrypt from 'bcryptjs';
import { prisma } from '../src/server/db';
import { createDemoData } from '../src/server/demo';

// Idempotent, local only: a known account for trying the app by hand.
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusé : ne jamais amorcer une base de production.');
  const email = 'demo@mstech.local';
  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({
    data: { name: 'Alexandre Démo', email, passwordHash: await bcrypt.hash('demo1234', 12), isDemo: true },
  });
  await createDemoData(user.id);
  console.log(`Prêt : ${email} / demo1234`);
}

main().finally(() => prisma.$disconnect());
