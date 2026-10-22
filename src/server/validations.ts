import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const connectProviderSchema = z.object({
  provider: z.enum(['powens', 'lean', 'saltedge', 'coingecko', 'binance', 'ibkr'], {
    message: 'Provider requis',
  }),
  callbackUrl: z.string().url().optional(),
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
