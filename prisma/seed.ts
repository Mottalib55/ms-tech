import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'alexandre.dupont@email.com' },
    update: {},
    create: {
      name: 'Alexandre Dupont',
      email: 'alexandre.dupont@email.com',
      passwordHash,
      currency: 'EUR',
      language: 'fr',
    },
  });

  console.log(`User created: ${user.email}`);

  // Create financial accounts
  const accounts = await Promise.all([
    prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: 'PEA Market Securities',
        institution: 'Market Securities',
        type: 'brokerage',
        balance: 145320.50,
        currency: 'EUR',
        status: 'connected',
        color: '#f4be7e',
        lastSync: new Date(),
      },
    }),
    prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: 'CTO Saxo Banque',
        institution: 'Saxo Banque',
        type: 'brokerage',
        balance: 89450.75,
        currency: 'EUR',
        status: 'connected',
        color: '#5682f2',
        lastSync: new Date(),
      },
    }),
    prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: 'Livret A - BNP Paribas',
        institution: 'BNP Paribas',
        type: 'bank',
        balance: 22950.00,
        currency: 'EUR',
        status: 'connected',
        color: '#34d399',
        lastSync: new Date(),
      },
    }),
    prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: 'Assurance Vie Linxea',
        institution: 'Linxea',
        type: 'insurance',
        balance: 67800.00,
        currency: 'EUR',
        status: 'connected',
        color: '#a78bfa',
        lastSync: new Date(),
      },
    }),
    prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: 'Crypto Binance',
        institution: 'Binance',
        type: 'crypto',
        balance: 18750.30,
        currency: 'EUR',
        status: 'connected',
        color: '#f97316',
        lastSync: new Date(),
      },
    }),
    prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: 'SCPI Corum Origin',
        institution: 'Corum',
        type: 'real-estate',
        balance: 52000.00,
        currency: 'EUR',
        status: 'connected',
        color: '#ec4899',
        lastSync: new Date(),
      },
    }),
  ]);

  console.log(`Created ${accounts.length} accounts`);

  // Create holdings
  const holdingsData = [
    { accountIdx: 1, symbol: 'MSFT', name: 'Microsoft Corporation', quantity: 45, avgPrice: 310.50, currentPrice: 415.20, currency: 'USD', assetClass: 'stocks', sector: 'Technology', region: 'North America', dailyChange: 1.25 },
    { accountIdx: 0, symbol: 'LVMH', name: 'LVMH Moët Hennessy', quantity: 20, avgPrice: 680.00, currentPrice: 745.50, currency: 'EUR', assetClass: 'stocks', sector: 'Consumer Goods', region: 'Europe', dailyChange: -0.45 },
    { accountIdx: 1, symbol: 'AAPL', name: 'Apple Inc.', quantity: 60, avgPrice: 142.00, currentPrice: 178.50, currency: 'USD', assetClass: 'stocks', sector: 'Technology', region: 'North America', dailyChange: 0.82 },
    { accountIdx: 0, symbol: 'CW8', name: 'Amundi MSCI World ETF', quantity: 120, avgPrice: 380.00, currentPrice: 452.30, currency: 'EUR', assetClass: 'etf', sector: 'Diversified', region: 'Global', dailyChange: 0.35 },
    { accountIdx: 4, symbol: 'BTC', name: 'Bitcoin', quantity: 0.15, avgPrice: 42000, currentPrice: 67500, currency: 'EUR', assetClass: 'crypto', sector: 'Crypto', region: 'Global', dailyChange: 2.10 },
    { accountIdx: 4, symbol: 'ETH', name: 'Ethereum', quantity: 2.5, avgPrice: 2200, currentPrice: 3450, currency: 'EUR', assetClass: 'crypto', sector: 'Crypto', region: 'Global', dailyChange: 1.85 },
    { accountIdx: 0, symbol: 'AIR', name: 'Airbus SE', quantity: 35, avgPrice: 120.50, currentPrice: 155.80, currency: 'EUR', assetClass: 'stocks', sector: 'Industrials', region: 'Europe', dailyChange: -0.22 },
    { accountIdx: 5, symbol: 'CORUM', name: 'SCPI Corum Origin', quantity: 100, avgPrice: 1090, currentPrice: 1135, currency: 'EUR', assetClass: 'real-estate', sector: 'Real Estate', region: 'Europe', dailyChange: 0 },
    { accountIdx: 3, symbol: 'EURO-FOND', name: 'Fonds Euro Suravenir', quantity: 1, avgPrice: 45000, currentPrice: 47250, currency: 'EUR', assetClass: 'bonds', sector: 'Fixed Income', region: 'Europe', dailyChange: 0.01 },
  ];

  const holdings = await Promise.all(
    holdingsData.map((h) =>
      prisma.holding.create({
        data: {
          accountId: accounts[h.accountIdx].id,
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          currentPrice: h.currentPrice,
          currency: h.currency,
          assetClass: h.assetClass,
          sector: h.sector,
          region: h.region,
          dailyChange: h.dailyChange,
        },
      })
    )
  );

  console.log(`Created ${holdings.length} holdings`);

  // Create fees
  const feesData = [
    { accountIdx: 0, accountName: 'PEA Market Securities', type: 'management', label: 'Frais de gestion PEA', amount: 435.96, percentage: 0.30, frequency: 'annual', suggestion: 'Négocier un taux de 0.15% avec un courtier en ligne', alternativeFee: 0.15 },
    { accountIdx: 1, accountName: 'CTO Saxo Banque', type: 'management', label: 'Frais de gestion CTO', amount: 447.25, percentage: 0.50, frequency: 'annual', suggestion: 'Migrer vers un courtier à frais réduits (DEGIRO, Trade Republic)', alternativeFee: 0.00 },
    { accountIdx: 1, accountName: 'CTO Saxo Banque', type: 'transaction', label: 'Frais de courtage', amount: 180.00, percentage: 0.08, frequency: 'per-transaction' },
    { accountIdx: 3, accountName: 'Assurance Vie Linxea', type: 'management', label: 'Frais de gestion AV', amount: 407.00, percentage: 0.60, frequency: 'annual', suggestion: 'Comparer avec Lucya Cardif (0.50%) ou Linxea Spirit 2 (0.50%)', alternativeFee: 0.50 },
    { accountIdx: 4, accountName: 'Crypto Binance', type: 'transaction', label: 'Frais de trading crypto', amount: 93.75, percentage: 0.10, frequency: 'per-transaction' },
  ];

  for (const f of feesData) {
    await prisma.fee.create({
      data: {
        accountId: accounts[f.accountIdx].id,
        accountName: f.accountName,
        type: f.type,
        label: f.label,
        amount: f.amount,
        percentage: f.percentage,
        frequency: f.frequency,
        suggestion: f.suggestion,
        alternativeFee: f.alternativeFee,
      },
    });
  }

  console.log(`Created ${feesData.length} fees`);

  // Create dividends
  const dividendsData = [
    { holdingIdx: 0, symbol: 'MSFT', name: 'Microsoft Corporation', amount: 42.30, currency: 'USD', exDate: '2025-02-15', payDate: '2025-03-13', status: 'paid', frequency: 'quarterly' },
    { holdingIdx: 1, symbol: 'LVMH', name: 'LVMH Moët Hennessy', amount: 260.00, currency: 'EUR', exDate: '2025-04-15', payDate: '2025-04-25', status: 'confirmed', frequency: 'annual' },
    { holdingIdx: 2, symbol: 'AAPL', name: 'Apple Inc.', amount: 14.40, currency: 'USD', exDate: '2025-02-09', payDate: '2025-02-15', status: 'paid', frequency: 'quarterly' },
    { holdingIdx: 6, symbol: 'AIR', name: 'Airbus SE', amount: 63.00, currency: 'EUR', exDate: '2025-04-17', payDate: '2025-04-25', status: 'confirmed', frequency: 'annual' },
    { holdingIdx: 7, symbol: 'CORUM', name: 'SCPI Corum Origin', amount: 51.50, currency: 'EUR', exDate: '2025-03-01', payDate: '2025-03-15', status: 'paid', frequency: 'monthly' },
  ];

  for (const d of dividendsData) {
    await prisma.dividend.create({
      data: {
        holdingId: holdings[d.holdingIdx].id,
        symbol: d.symbol,
        name: d.name,
        amount: d.amount,
        currency: d.currency,
        exDate: d.exDate,
        payDate: d.payDate,
        status: d.status,
        frequency: d.frequency,
      },
    });
  }

  console.log(`Created ${dividendsData.length} dividends`);

  // Create monthly budgets
  const months = ['2025-01', '2025-02', '2025-03'];
  const budgetValues = [
    { income: 6500, expenses: 4200, savings: 2300 },
    { income: 6500, expenses: 3800, savings: 2700 },
    { income: 7200, expenses: 4500, savings: 2700 },
  ];
  const categories = [
    { name: 'Logement', icon: 'home', color: '#f4be7e', budgeted: 1500, spent: 1500 },
    { name: 'Alimentation', icon: 'utensils', color: '#5682f2', budgeted: 600, spent: 520 },
    { name: 'Transport', icon: 'car', color: '#34d399', budgeted: 300, spent: 280 },
    { name: 'Loisirs', icon: 'gamepad', color: '#a78bfa', budgeted: 400, spent: 450 },
    { name: 'Investissement', icon: 'trending-up', color: '#f97316', budgeted: 2000, spent: 2000 },
  ];

  for (let i = 0; i < months.length; i++) {
    const budget = await prisma.monthlyBudget.create({
      data: {
        userId: user.id,
        month: months[i],
        income: budgetValues[i].income,
        expenses: budgetValues[i].expenses,
        savings: budgetValues[i].savings,
      },
    });

    await prisma.budgetCategory.createMany({
      data: categories.map((c) => ({
        budgetId: budget.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        budgeted: c.budgeted,
        spent: c.spent,
      })),
    });
  }

  console.log(`Created ${months.length} monthly budgets`);

  // Create performance points
  const perfData: { date: string; value: number }[] = [];
  let value = 280000;
  const startDate = new Date('2024-01-01');
  for (let i = 0; i < 450; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    value = value * (1 + (Math.random() - 0.48) * 0.015);
    perfData.push({
      date: d.toISOString().slice(0, 10),
      value: Math.round(value),
    });
  }

  await prisma.performancePoint.createMany({
    data: perfData.map((p) => ({
      userId: user.id,
      date: p.date,
      value: p.value,
    })),
  });

  console.log(`Created ${perfData.length} performance points`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
