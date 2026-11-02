import { prisma } from '@/server/db';
import { parseBody, requireUser, route } from '@/server/http';
import { budgetSchema } from '@/server/validations';

const include = {
  categories: { select: { id: true, name: true, icon: true, color: true, budgeted: true, spent: true } },
} as const;

export const GET = route(async () => {
  const user = await requireUser();
  const budgets = await prisma.monthlyBudget.findMany({
    where: { userId: user.id },
    include,
    orderBy: { month: 'desc' },
  });
  return budgets.map(({ id, month, income, expenses, savings, categories }) => ({ id, month, income, expenses, savings, categories }));
});

// Expenses and savings are derived here, so the figures cannot disagree with the categories.
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { month, income, expenses: declared, categories } = await parseBody(req, budgetSchema);
  const expenses = categories ? categories.reduce((sum, c) => sum + c.spent, 0) : declared;
  const totals = { income, expenses, savings: income - expenses };

  return prisma.$transaction(async (tx) => {
    const budget = await tx.monthlyBudget.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: totals,
      create: { ...totals, userId: user.id, month },
    });
    if (categories) {
      await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
      if (categories.length) {
        await tx.budgetCategory.createMany({ data: categories.map((c) => ({ ...c, budgetId: budget.id })) });
      }
    }
    return tx.monthlyBudget.findUnique({ where: { id: budget.id }, include });
  });
});
