import crypto from 'node:crypto';
import type { TelegramAuthPayload, TelegramUser } from '@tokenrush/shared';
import { env } from '../config/env.js';

const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

interface ParsedInitData {
  authDate: string;
  hash: string;
  user: TelegramUser;
  queryId?: string;
  startParam?: string;
  rawData: string;
}

const parseInitData = (initData: string): ParsedInitData => {
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  if (!data.hash || !data.auth_date || !data.user) {
    throw new Error('Invalid Telegram init data');
  }

  const user: TelegramUser = JSON.parse(data.user);

  return {
    authDate: data.auth_date,
    hash: data.hash,
    user,
    queryId: data.query_id,
    startParam: data.start_param,
    rawData: initData,
  };
};

const computeHash = (data: string) => {
  const secret = crypto
    .createHash('sha256')
    .update(TELEGRAM_BOT_TOKEN)
    .digest();

  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

export const verifyTelegramInitData = (initData: string): TelegramAuthPayload => {
  const parsed = parseInitData(initData);

  const dataCheckString = Object.entries(new URLSearchParams(parsed.rawData))
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const computed = computeHash(dataCheckString);

  if (computed !== parsed.hash) {
    throw new Error('Invalid Telegram authorization hash');
  }

  return {
    query_id: parsed.queryId,
    auth_date: parsed.authDate,
    hash: parsed.hash,
    user: parsed.user,
    start_param: parsed.startParam,
    rawData: parsed.rawData,
  };
};
