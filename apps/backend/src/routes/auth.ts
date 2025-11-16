import { Router } from 'express';
import { z } from 'zod';
import { verifyTelegramInitData } from '../utils/telegram.js';
import { asyncHandler } from '../utils/async-handler.js';
import { signAuthTokens, verifyRefreshToken } from '../services/jwt-service.js';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import type { TelegramUser } from '@tokenrush/shared';

const router = Router();

const telegramAuthSchema = z.object({
  initData: z.string().nonempty(),
});

const refreshSchema = z.object({
  refreshToken: z.string().nonempty(),
});

const upsertUser = async (user: TelegramUser, referralCode?: string) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.photo_url,
        referral_code: referralCode,
      },
      { onConflict: 'telegram_id' },
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

router.post(
  '/telegram',
  asyncHandler(async (req, res) => {
    const { initData } = telegramAuthSchema.parse(req.body);
    const payload = verifyTelegramInitData(initData);

    const user = await upsertUser(payload.user, payload.start_param);

    const tokens = signAuthTokens({
      sub: user.id,
      telegramId: payload.user.id,
      username: payload.user.username,
    });

    res.json({
      tokens,
      user,
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload?.sub)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const tokens = signAuthTokens({
      sub: user.id,
      telegramId: user.telegram_id,
      username: user.username ?? undefined,
    });

    res.json({ tokens, user });
  }),
);

router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json({
      monetagSdkUrl: env.MONETAG_SDK_URL,
      monetagZoneId: env.MONETAG_ZONE_ID,
    });
  }),
);

export { router as authRouter };
