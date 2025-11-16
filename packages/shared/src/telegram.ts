export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user: TelegramUser;
  auth_date: string;
  hash: string;
  start_param?: string;
}

export interface TelegramAuthPayload extends TelegramInitData {
  rawData: string;
}
