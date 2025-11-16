# TokenRush Architecture

## Overview
TokenRush is a Telegram Mini App ecosystem that combines an interactive React frontend, a Node.js backend, and a Telegram bot to deliver play-to-earn arcade experiences. The platform manages player identity through Telegram authentication, tracks token balances and rewards, and enables social features such as leaderboards and referrals. Supabase provides the persistent data layer, while Monetag rewarded ads supply optional monetization.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Telegram WebApp (React + TWA SDK)                                      │
│  • Game lobby + mini games (CrashMaster, MineQuest, DiceHero, LimboLeap)│
│  • Wallet & rewards dashboard                                          │
│  • Achievements, leaderboards, referrals                               │
└──────▲─────────────────────────────────────────────────────────────────┘
       │ Telegram WebApp init data + REST/WS API calls
┌──────┴─────────────────────────────────────────────────────────────────┐
│ Backend API (Node.js + Express)                                        │
│  • Auth validates Telegram init data                                   │
│  • Token economy + gameplay ledger                                     │
│  • Rewards, achievements, referrals, withdrawals                       │
│  • Monetag ad reward webhook                                           │
│  • Rate limiting & logging                                             │
└──────▲───────────────────────────────┬──────────────────────────────────┘
       │ Supabase service account      │ Bot-to-API communication
┌──────┴────────────────────────────┐  │     ┌────────────────────────────┐
│ Supabase PostgreSQL               │  │     │ Telegram Bot (Telegraf)    │
│  • Users                          │  │     │  • Mini app launch, deep   │
│  • Sessions, rewards, leaderboards│  │     │    linking, broadcast      │
│  • Ad rewards, withdrawals        │  │     │  • Prize draw notifications │
│  • Audit logs                     │  │     │  • Admin commands           │
└───────────────────────────────────┘  │     └────────────────────────────┘
       ▲                               │
       └──────────── Background jobs & analytics pipeline (CRON / Supabase)
```

## Components

### 1. Frontend (Telegram Mini App)
- **Stack:** React + TypeScript + Vite, Telegram Web App SDK, Zustand for state, React Query for data fetching, TailwindCSS for styling.
- **Responsibilities:**
  - Authenticate users via Telegram init data and bootstrap session with backend.
  - Provide animated lobby with four mini games. Games run client-side with deterministic logic; results sent to backend for validation and persistence.
  - Manage wallets, daily bonuses, achievements, leaderboards, referrals.
  - Handle Monetag rewarded ad prompts using SDK URL injected at runtime.
  - Offer onboarding/tutorial, responsive UI, dark/light support.
- **Structure Highlights:**
  - `src/app` – init, routing, providers.
  - `src/components` – UI primitives, cards, buttons, dialogs.
  - `src/games` – individual mini-games encapsulated with shared `GameEngine` helpers.
  - `src/features` – domain slices (wallet, rewards, referrals, leaderboard).
  - `src/hooks` – TWA hooks, animation hooks.
  - `src/services` – API clients, telemetry.
  - `src/styles` – Tailwind config, theme tokens.
  - `src/assets` – SVG/PNG icon set generated for all required graphics.

### 2. Backend API
- **Stack:** Node.js, Express, TypeScript, Supabase client, Zod for validation, Redis-compatible cache (in-memory fallback) for rate limiting, pino for logging.
- **Responsibilities:**
  - Validate Telegram authentication hash using bot token.
  - Maintain user records, token balances, XP, streaks.
  - Record game sessions, compute rewards, enforce risk-guards (max payout, cooldowns).
  - Manage achievements, referrals, leaderboard aggregation.
  - Expose REST endpoints and WebSocket channel for real-time leaderboard.
  - Secure Monetag rewarded ad callbacks before crediting rewards.
  - Queue withdrawal requests and notify admin via bot.
- **Structure Highlights:**
  - `src/app.ts` Express app wiring (routes, middleware, error handling).
  - `src/index.ts` bootstrap & graceful shutdown.
  - `src/config` environment loaders, constants.
  - `src/routes` route modules (auth, users, games, rewards, admin).
  - `src/middleware` auth guard, rate limiter, telemetry.
  - `src/services` business logic (token economy, achievements, leaderboard, notifications).
  - `src/datastore` Supabase repository with fallback in-memory adapter for local dev.
  - `src/jobs` scheduled tasks (daily streak reset, prize draw settlement).

### 3. Telegram Bot
- **Stack:** Telegraf + TypeScript.
- **Responsibilities:**
  - Launch mini app via `/start` with deep links containing referral codes.
  - Provide admin commands (/broadcast, /draw, /stats).
  - Push daily bonus reminders and achievement unlock notifications.
  - Receive withdrawal requests from backend (via webhook or supabase function) to notify operators.

### 4. Shared Package
- **Contents:** TypeScript interfaces, enums, and schema definitions shared across backend, frontend, and bot (e.g., `GameType`, `TokenTransaction`, `AchievementId`). Bundled as an internal npm package via workspace or path exports.

### 5. Infrastructure & Deployment
- **Hosting:** Frontend on Vercel, Backend on Render (or Supabase Edge functions fallback), Bot on Render/railway.
- **CI/CD:** GitHub Actions pipeline to lint, test, build, and deploy each project.
- **Monitoring:** Supabase logs + optional Sentry integration for frontend/backend.

## Data Model (Supabase)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Core profile | `id (uuid)`, `telegram_id`, `username`, `first_name`, `avatar_url`, `referral_code`, `referred_by`, `balance`, `lifetime_earned`, `streak_count`, `last_login_at`, `created_at` |
| `game_sessions` | Each round of any game | `id`, `user_id`, `game_type`, `wager`, `payout`, `result_payload (jsonb)`, `started_at`, `ended_at` |
| `token_transactions` | Ledger for all token changes | `id`, `user_id`, `source (enum)`, `amount`, `balance_after`, `metadata`, `created_at` |
| `daily_rewards` | Login streak tracking | `id`, `user_id`, `reward_amount`, `streak_day`, `issued_at`, `claimed` |
| `achievements` | Catalog of achievements | `id`, `title`, `description`, `threshold`, `icon`, `created_at`, `active` |
| `user_achievements` | Unlocks | `user_id`, `achievement_id`, `unlocked_at` |
| `referrals` | Referral relationships | `id`, `referrer_user_id`, `referred_user_id`, `bonus_amount`, `status`, `created_at` |
| `withdrawals` | Prize redemption | `id`, `user_id`, `amount`, `method`, `status`, `processed_at`, `created_at` |
| `leaderboard_snapshots` | Weekly leaderboard caches | `id`, `week_start`, `week_end`, `data (jsonb)` |
| `ad_rewards` | Monetag claims | `id`, `user_id`, `zone_id`, `reward_amount`, `claimed_at`, `verification_payload` |
| `audit_logs` | Security monitoring | `id`, `actor_id`, `action`, `metadata`, `created_at` |

### Enums & Constraints
- `game_type` enum: `crashmaster`, `minequest`, `dicehero`, `limboleap`.
- `token_source` enum: `game_win`, `game_loss`, `daily_bonus`, `achievement`, `referral`, `ad_reward`, `withdrawal`, `manual_adjustment`.
- Unique indexes on `users.telegram_id`, `users.referral_code`.
- Policies restricting access by `telegram_id` via Supabase Row Level Security.

## API Surface

### Authentication
- `POST /auth/telegram` – Validates Telegram init data hash, issues JWT + refresh token.
- `POST /auth/refresh` – Refresh flow with token rotation.

### User & Wallet
- `GET /users/me` – Profile, balances, streaks, achievements.
- `POST /users/me/daily-claim` – Claim daily login bonus.
- `POST /users/me/referrals` – Confirm referral code usage.
- `GET /users/me/history` – Paginated ledger of token transactions.

### Games
- `POST /games/:gameType/start` – Register new session, validate wager.
- `POST /games/:gameType/complete` – Submit result payload, run server-side validation, finalize tokens.
- `GET /games/config` – Return game parameters (min/max bets, multipliers).

### Rewards & Leaderboard
- `GET /leaderboard/global` – Top 100 players (cached per minute).
- `GET /leaderboard/friends` – Data filtered by referral network.
- `POST /ads/monetag/webhook` – Monetag callback verifying signatures, credit tokens.
- `POST /withdrawals` – Request withdrawal, queue for review.

### Admin (protected)
- `POST /admin/broadcast` – Trigger bot broadcast message.
- `POST /admin/prize-draw` – Run weekly draw and persist results.

### Real-time
- WebSocket endpoint `/ws/leaderboard` streams updated leaderboard entries.

## Gameplay Mechanics

### CrashMaster
- Client simulates exponential growth multiplier with random crash time derived from server-supplied seed.
- Server validation ensures submitted cash-out multiplier is less than crash multiplier and calculates payout = wager × cashout.

### MineQuest
- Grid-based mine detection. Server sends hashed mine layout seed; client reveals tiles; on completion, payload plus reveal steps validated before payout.

### DiceHero
- RNG dice roll based on server seed; winning ranges determined by selected risk tier (low/high). Payout table stored server-side.

### LimboLeap
- Server issues target multiplier distribution; client selects target, server validates win if random multiplier >= target.

All games use deterministic seeds from backend to prevent tampering and rely on hashed payload verification on completion.

## Security Considerations
- Telegram hash verification prevents spoofed sessions.
- JWT scoped per device; refresh tokens stored httpOnly.
- Supabase Row Level Security + policies ensure user isolation.
- Rate limiter (per-IP + per-telegram-id) on sensitive endpoints.
- Request validation with Zod + data sanitization.
- Audit logging for high-value actions (withdrawals, admin commands).
- Secrets sourced from `.env` and never committed.

## Monetag Integration Plan
- Monetag SDK URL injected via `.env` and loaded lazily when user opts into ad reward.
- After ad completion, SDK triggers callback which sends signed payload to backend; backend verifies using Monetag zone + secret, then credits `ad_rewards` table.

## Notifications & Scheduling
- Bot schedules daily bonus reminders via Supabase cron or Render cron job.
- Weekly prize draw job calculates winners, persists snapshot, and sends notifications.

## Deployment & DevOps
- **Frontend:** Vercel project with environment variables for API URL, Monetag IDs, feature flags.
- **Backend:** Render web service; use Build Command `npm ci && npm run build`, Start Command `node dist/index.js`.
- **Bot:** Render worker with Telegraf webhook pointing to backend route.
- **Supabase:** SQL migrations managed via Supabase CLI; migrations stored in `supabase/migrations`.
- **CI:** GitHub Actions workflows for lint/test per package and deploy previews for frontend.

## Local Development Flow
1. Copy `.env.example` in each package to `.env` and populate tokens (Telegram bot token, Supabase keys, Monetag zone).
2. Start backend (`npm run dev`) – uses in-memory datastore if Supabase credentials missing for rapid prototyping.
3. Start frontend (`npm run dev`) – served via Vite with HTTPS for Telegram compatibility.
4. Optionally start bot (`npm run dev`) with polling mode for local testing.
5. Use mocked Monetag sandbox endpoint during development.

## Future Enhancements
- Replace in-memory leaderboard cache with Redis.
- Add quest system with configurable missions.
- Integrate wallet providers for on-chain token redemption.
- Expand analytics dashboards for retention monitoring.
