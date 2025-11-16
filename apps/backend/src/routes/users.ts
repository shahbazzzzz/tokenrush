import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { supabase } from '../config/supabase.js';
import { getTransactionHistory, getUserBalance } from '../services/token-service.js';
import { TokenSource } from '@tokenrush/shared';
import { getUserAchievements, getReferralStats, processReferral } from '../services/rewards-service.js';

const router = Router();

const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const transactionsQuerySchema = paginationSchema.extend({
  source: z.nativeEnum(TokenSource).optional(),
});

const referralSchema = z.object({
  referralCode: z.string().min(4).max(16),
});

const mapUser = (record: Record<string, any>) => ({
  id: record.id,
  telegramId: record.telegram_id,
  username: record.username ?? undefined,
  firstName: record.first_name ?? undefined,
  lastName: record.last_name ?? undefined,
  avatarUrl: record.avatar_url ?? undefined,
  referralCode: record.referral_code,
  referredBy: record.referred_by ?? undefined,
  balance: record.token_balance ?? 0,
  createdAt: record.created_at,
});

router.use(authMiddleware);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(mapUser(data));
  }),
);

router.get(
  '/wallet',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const balance = await getUserBalance(userId);

    const { data: credits, error } = await supabase
      .from('token_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gt('amount', 0);

    const lifetimeEarned = error || !credits ? 0 : credits.reduce((sum, row) => sum + (row.amount ?? 0), 0);

    res.json({ balance, lifetimeEarned });
  }),
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const params = transactionsQuerySchema.parse(req.query);

    const { data, count } = await getTransactionHistory(userId, params.limit, params.offset, params.source);

    res.json({ data, count });
  }),
);

router.get(
  '/achievements',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const achievements = await getUserAchievements(userId);
    res.json(achievements);
  }),
);

router.post(
  '/referral',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { referralCode } = referralSchema.parse(req.body);

    const result = await processReferral(userId, referralCode);
    res.json(result);
  }),
);

router.get(
  '/referrals',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const stats = await getReferralStats(userId);
    res.json(stats);
  }),
);

export { router as userRouter };
