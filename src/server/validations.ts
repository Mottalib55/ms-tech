import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(200),
});

export const connectProviderSchema = z.object({
  provider: z.enum(['powens', 'lean', 'saltedge', 'ibkr', 'sandbox'], {
    message: 'Fournisseur inconnu',
  }),
});

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format mois invalide (YYYY-MM)'),
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

const money = z.number({ message: 'Montant invalide' }).finite('Montant invalide').min(-1e12).max(1e12);
const positive = z.number({ message: 'Valeur invalide' }).finite('Valeur invalide').min(0, 'La valeur doit être positive').max(1e12);
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'AED', 'CAD', 'JPY', 'SAR', 'MAD'] as const;
const currency = z.enum(CURRENCIES, { message: 'Devise non prise en charge' });

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Donnez un nom au compte').max(80),
  institution: z.string().trim().max(80).default(''),
  type: z.enum(['bank', 'brokerage', 'insurance', 'crypto', 'real-estate', 'other', 'loan'], { message: 'Type de compte invalide' }),
  balance: money,
  currency: currency.default('EUR'),
});
export const accountPatchSchema = accountSchema.partial();

export const holdingSchema = z.object({
  accountId: z.string().min(1, 'Choisissez un compte'),
  symbol: z.string().trim().min(1, 'Symbole requis').max(20).transform((s) => s.toUpperCase()),
  name: z.string().trim().min(1, 'Nom requis').max(120),
  quantity: z.number({ message: 'Quantité invalide' }).finite().positive('La quantité doit être positive').max(1e12),
  avgPrice: positive,
  currentPrice: positive,
  currency: currency.default('EUR'),
  assetClass: z.enum(['stocks', 'etf', 'crypto', 'real-estate', 'bonds', 'cash', 'commodities', 'other'], { message: 'Classe d\'actif invalide' }),
  sector: z.string().trim().max(60).default('Autre'),
  region: z.string().trim().max(60).default('Monde'),
});
export const holdingPatchSchema = holdingSchema.omit({ accountId: true }).partial();

export const feeSchema = z.object({
  accountId: z.string().min(1, 'Choisissez un compte'),
  type: z.enum(['management', 'transaction', 'custody', 'exchange', 'performance'], { message: 'Type de frais invalide' }),
  label: z.string().trim().min(1, 'Libellé requis').max(100),
  amount: positive,
  percentage: positive.max(100, 'Le pourcentage ne peut dépasser 100'),
  frequency: z.enum(['annual', 'monthly', 'quarterly', 'per-transaction'], { message: 'Fréquence invalide' }),
  suggestion: z.string().trim().max(240).nullish(),
  alternativeFee: positive.max(100).nullish(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide');
export const dividendSchema = z.object({
  holdingId: z.string().min(1, 'Choisissez une position'),
  amount: positive,
  currency: currency.default('EUR'),
  exDate: isoDate,
  payDate: isoDate,
  status: z.enum(['paid', 'confirmed', 'projected'], { message: 'Statut invalide' }),
  frequency: z.enum(['monthly', 'quarterly', 'semi-annual', 'annual'], { message: 'Fréquence invalide' }),
});

export const transactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(['deposit', 'withdrawal', 'buy', 'sell', 'dividend', 'fee', 'transfer'], { message: 'Type invalide' }),
  amount: money,
  date: isoDate,
  description: z.string().trim().max(200).optional(),
  updateBalance: z.boolean().default(true),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(100).optional(),
  email: z.string().trim().toLowerCase().email('Email invalide').optional(),
  currentPassword: z.string().optional(),
  currency: currency.optional(),
  language: z.enum(['fr', 'en']).optional(),
});

const strongPassword = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(200);
export const passwordSchema = z.object({ currentPassword: z.string().min(1, 'Mot de passe actuel requis'), newPassword: strongPassword });
export const deleteAccountSchema = z.object({ password: z.string().min(1, 'Mot de passe requis') });
export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email('Email invalide') });
export const resetSchema = z.object({ token: z.string().min(20, 'Lien invalide'), password: strongPassword });
export const connectKeysSchema = z.object({
  provider: z.enum(['binance', 'ibkr']),
  apiKey: z.string().trim().min(10, 'Saisissez la clé complète').max(500),
  apiSecret: z.string().trim().min(4, 'Saisissez la seconde valeur complète').max(500),
});
