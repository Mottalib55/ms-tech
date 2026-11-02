import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'errors.validation.nameRequired').max(100),
  email: z.string().trim().toLowerCase().email('errors.validation.emailInvalid'),
  password: z.string().min(8, 'errors.validation.passwordMin').max(200),
});

export const connectProviderSchema = z.object({
  provider: z.enum(['powens', 'lean', 'saltedge', 'ibkr', 'sandbox'], {
    message: 'errors.validation.unknownProvider',
  }),
});

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'errors.validation.monthFormat'),
  income: z.number().min(0).default(0),
  expenses: z.number().min(0).default(0),
  savings: z.number().default(0),
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        icon: z.string().min(1),
        color: z.string().min(1),
        budgeted: z.number().min(0),
        spent: z.number().min(0),
      })
    )
    .optional(),
});

const money = z.number({ message: 'errors.validation.amountInvalid' }).finite('errors.validation.amountInvalid').min(-1e12).max(1e12);
const positive = z.number({ message: 'errors.validation.valueInvalid' }).finite('errors.validation.valueInvalid').min(0, 'errors.validation.valuePositive').max(1e12);
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'AED', 'CAD', 'JPY', 'SAR', 'MAD'] as const;
const currency = z.enum(CURRENCIES, { message: 'errors.validation.currencyUnsupported' });

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'errors.validation.accountNameRequired').max(80),
  institution: z.string().trim().max(80).default(''),
  type: z.enum(['bank', 'brokerage', 'insurance', 'crypto', 'real-estate', 'other', 'loan'], { message: 'errors.validation.accountTypeInvalid' }),
  balance: money,
  currency: currency.default('EUR'),
});
export const accountPatchSchema = accountSchema.partial();

export const holdingSchema = z.object({
  accountId: z.string().min(1, 'errors.validation.chooseAccount'),
  symbol: z.string().trim().min(1, 'errors.validation.symbolRequired').max(20).transform((s) => s.toUpperCase()),
  name: z.string().trim().min(1, 'errors.validation.nameRequired').max(120),
  quantity: z.number({ message: 'errors.validation.quantityInvalid' }).finite().positive('errors.validation.quantityPositive').max(1e12),
  avgPrice: positive,
  currentPrice: positive,
  currency: currency.default('EUR'),
  assetClass: z.enum(['stocks', 'etf', 'crypto', 'real-estate', 'bonds', 'cash', 'commodities', 'other'], { message: 'errors.validation.assetClassInvalid' }),
  sector: z.string().trim().max(60).default('other'),
  region: z.string().trim().max(60).default('world'),
});
export const holdingPatchSchema = holdingSchema.omit({ accountId: true }).partial();

export const feeSchema = z.object({
  accountId: z.string().min(1, 'errors.validation.chooseAccount'),
  type: z.enum(['management', 'transaction', 'custody', 'exchange', 'performance'], { message: 'errors.validation.feeTypeInvalid' }),
  label: z.string().trim().min(1, 'errors.validation.labelRequired').max(100),
  amount: positive,
  percentage: positive.max(100, 'errors.validation.percentMax'),
  frequency: z.enum(['annual', 'monthly', 'quarterly', 'per-transaction'], { message: 'errors.validation.frequencyInvalid' }),
  suggestion: z.string().trim().max(240).nullish(),
  alternativeFee: positive.max(100).nullish(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'errors.validation.dateInvalid');
export const dividendSchema = z.object({
  holdingId: z.string().min(1, 'errors.validation.choosePosition'),
  amount: positive,
  currency: currency.default('EUR'),
  exDate: isoDate,
  payDate: isoDate,
  status: z.enum(['paid', 'confirmed', 'projected'], { message: 'errors.validation.statusInvalid' }),
  frequency: z.enum(['monthly', 'quarterly', 'semi-annual', 'annual'], { message: 'errors.validation.frequencyInvalid' }),
});

export const transactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(['deposit', 'withdrawal', 'buy', 'sell', 'dividend', 'fee', 'transfer'], { message: 'errors.validation.typeInvalid' }),
  amount: money,
  date: isoDate,
  description: z.string().trim().max(200).optional(),
  updateBalance: z.boolean().default(true),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'errors.validation.nameRequired').max(100).optional(),
  email: z.string().trim().toLowerCase().email('errors.validation.emailInvalid').optional(),
  currentPassword: z.string().optional(),
  currency: currency.optional(),
  language: z.enum(['fr', 'en', 'ar']).optional(),
});

const strongPassword = z.string().min(8, 'errors.validation.passwordMin').max(200);
export const passwordSchema = z.object({ currentPassword: z.string().min(1, 'errors.validation.currentPasswordRequired'), newPassword: strongPassword });
export const deleteAccountSchema = z.object({ password: z.string().min(1, 'errors.validation.passwordRequired') });
export const languageSchema = z.object({ language: z.enum(['fr', 'en', 'ar']) });
export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email('errors.validation.emailInvalid') });
export const resetSchema = z.object({ token: z.string().min(20, 'errors.validation.linkInvalid'), password: strongPassword });
export const connectKeysSchema = z.object({
  provider: z.enum(['binance', 'ibkr']),
  apiKey: z.string().trim().min(10, 'errors.validation.keyIncomplete').max(500),
  apiSecret: z.string().trim().min(4, 'errors.validation.secretIncomplete').max(500),
});
