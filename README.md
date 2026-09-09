# WINZY - Premium 9 Games • Instant • Live Balance • 100X Admin

Live: https://jackbhai.github.io/winzy/
Admin Secret: https://jackbhai.github.io/winzy/secure-777-pranshu-admin
Admin Login: quizgk777@gmail.com / @Pranshu1

## Features • 100X

### Games (9 Premium, Instant, No Refresh)
- **Lottery**: Pick 6 numbers 1-49, scheduled draws
- **Spin & Win**: Premium wheel with conic gradient, 1.8s spin (was 4s), slice weights + win % control
- **Dice Roll**: 0.6s instant, over/under, 99/chance payout
- **Number Guess**: 1-10 grid, instant, 8x
- **Crash** (NEW): Multiplier rises, crash random, cashout before crash, up to 100x, graph animation
- **Mines** (NEW): 5x5 grid, pick safe tiles, avoid mines, multiplier per gem
- **Plinko** (NEW): Ball drop physics, pins, 7 multiplier slots, low/med/high risk
- **CoinFlip** (NEW): 3D coin flip, heads/tails, 1.95x, 1s animation
- **Slots** (NEW): 3 reels, jackpot 50x, premium slot machine

All games:
- Server-side crypto RNG (crypto.getRandomValues)
- Instant results <200ms server, 0.6-1.8s premium animation (no 4s wait)
- Live balance via Supabase realtime channel on profiles table, no refresh needed
- History realtime INSERT subscription
- Admin win probability control 0-100% per game, instant effect

### Wallet • Live
- Jack Bank gateway real integration
- Deposit: fresh order_ref WZ-<time36>-<rand4>, pay_url new tab, polls every 4s + Check now + auto-reconcile on app-open
- Withdraw: targets payer of PAID order_ref, from merchant unsettled pool, idempotency key
- Coins virtual notice only in wallet
- Wagering rule: lifetime bets >= lifetime deposits * multiplier
- Realtime ledger via postgres_changes channel

### Admin • 100X
- Hidden route /secure-777-pranshu-admin, /admin blocked
- 7-tap gesture on Profile WINZY v1 text
- Dashboard: 6 gradient cards, recent deposits/payouts live, top players
- Players: 50+ params per player grouped, search, filters, deep modal with 6 tabs (overview, ledger, deposits, games, settings, risk), ban/unban, add/subtract credit, make admin
- Deposits/Withdrawals: live verify Jack Bank
- Game Config: 55+ global params + 9 win probability % controls (0-100) for easy house management
- Games Analytics: 9 games edge, bet, win, count
- Gateway: keys editable, test button, server-side only

## Tech Stack
- React + Vite + Supabase (real DB, auth, edge functions)
- AMOLED pure-black theme, hand-made vector icons (no lucide, no emoji in code)
- Mobile-first, English only, no demo data

## Deploy Edge Function (Required for 5 new games)

Frontend is live but backend for 5 new games needs deployment (Supabase access token invalid).

### Manual Deploy via Supabase CLI

```bash
npm i -g supabase
supabase login  # use new sbp_ token from Supabase Dashboard > Account > Access Tokens
supabase link --project-ref ghdwhgrqnedimudaeidc
supabase functions deploy winzy-api --no-verify-jwt
```

### Run Migration for New Games Tables

After deploy, call as admin:

```bash
curl -X POST https://ghdwhgrqnedimudaeidc.supabase.co/functions/v1/winzy-api/admin/migrate/run \
  -H "apikey: <anon>" -H "Authorization: Bearer <admin_access_token>"
```

Or run SQL manually in Supabase Dashboard > SQL Editor:

```sql
-- See supabase/migrations/002_new_games.sql
```

## Security
- RLS with winzy_is_admin() on all tables
- Service role bypass for edge functions only
- Rate limiting: 10 deposits/min, 5 withdraws/min, 30 spins/min etc.
- Server-side validation: auth, balance, bet limits, idempotency, amount >= deposit
- Secrets server-side only, never frontend

## Build

```bash
npm ci
npm run build
```

## Pages Workflow
- .github/workflows/pages.yml builds and copies dist/index.html to dist/404.html for SPA secret route
