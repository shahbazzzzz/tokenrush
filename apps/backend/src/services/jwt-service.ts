import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface TokenPayload {
  sub: string;
  telegramId: number;
  username?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const signAuthTokens = (payload: TokenPayload): AuthTokens => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  const expiresIn = typeof env.JWT_EXPIRES_IN === 'string' ? parseJwtExpiry(env.JWT_EXPIRES_IN) : env.JWT_EXPIRES_IN;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

const parseJwtExpiry = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600;
  }

  const quantity = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return quantity;
    case 'm':
      return quantity * 60;
    case 'h':
      return quantity * 60 * 60;
    case 'd':
      return quantity * 60 * 60 * 24;
    default:
      return 3600;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
