import { z } from 'zod';

export const updateWalletSchema = z.object({
  body: z.object({
    // New format (preferred): amount + currency
    amount: z.number().optional(),
    currency: z.enum(['GC', 'SC']).optional(),
    // Legacy format: separate gc_amount and sc_amount
    gc_amount: z.number().optional(),
    sc_amount: z.number().optional(),
    // Common fields
    transaction_type: z.enum(['deposit', 'withdrawal', 'bet', 'win', 'bonus', 'referral', 'achievement', 'purchase', 'redemption', 'transfer']).optional(),
    description: z.string().max(255).optional(),
    metadata: z.record(z.any()).optional(),
  }).refine(
    (data) => {
      // Must have either (amount + currency) OR (gc_amount and/or sc_amount)
      const hasNewFormat = data.amount !== undefined && data.currency !== undefined;
      const hasLegacyFormat = data.gc_amount !== undefined || data.sc_amount !== undefined;
      return hasNewFormat || hasLegacyFormat;
    },
    { message: 'Must provide either (amount + currency) or (gc_amount/sc_amount)' }
  )
});
