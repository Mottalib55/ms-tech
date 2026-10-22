import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';
import { budgetSchema } from '@/server/validations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const budgets = await prisma.monthlyBudget.findMany({
      where: { userId },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            budgeted: true,
            spent: true,
          },
        },
      },
      orderBy: { month: 'desc' },
    });

    const result = budgets.map((b) => ({
      id: b.id,
      month: b.month,
      income: b.income,
      expenses: b.expenses,
      savings: b.savings,
      categories: b.categories,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { month, income, expenses, savings, categories } = parsed.data;

    const budget = await prisma.monthlyBudget.upsert({
      where: {
        userId_month: { userId, month },
      },
      update: {
        income: income ?? 0,
        expenses: expenses ?? 0,
        savings: savings ?? 0,
      },
      create: {
        userId,
        month,
        income: income ?? 0,
        expenses: expenses ?? 0,
        savings: savings ?? 0,
      },
    });

    if (categories && Array.isArray(categories)) {
      await prisma.budgetCategory.deleteMany({
        where: { budgetId: budget.id },
      });

      await prisma.budgetCategory.createMany({
        data: categories.map(
          (cat: {
            name: string;
            icon: string;
            color: string;
            budgeted: number;
            spent: number;
          }) => ({
            budgetId: budget.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            budgeted: cat.budgeted,
            spent: cat.spent,
          })
        ),
      });
    }

    const result = await prisma.monthlyBudget.findUnique({
      where: { id: budget.id },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            budgeted: true,
            spent: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create or update budget' },
      { status: 500 }
    );
  }
}
