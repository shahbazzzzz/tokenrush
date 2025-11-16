import type { UserProfile } from '@tokenrush/shared';

declare global {
  namespace Express {
    interface User {
      id: string;
      telegramId: number;
      username?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
