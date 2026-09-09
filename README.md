# WINZY — AMOLED Game App

Stack: React + Vite + Supabase (real DB + auth + edge functions), mobile-first, pure-black AMOLED theme, hand-made vector icons (no lucide, no emoji).

Games:
- LOTTERY: pick 6 (1-49), scheduled draws, auto-credit winnings
- SPIN & WIN: wheel multipliers 0x/1.2x/1.5x/2x/5x + jackpot, server-side RNG
- DICE ROLL: over/under target, instant
- NUMBER GUESS: 1-10 exact 8x

Wallet: virtual coins displayed as ₹ (1 coin = ₹1 look). Notice "Coins are virtual and have no cash value" only in wallet screen.

Gateway: Jack Bank (https://nksthsgrxudptwdbytoh.supabase.co) — real PostgREST RPC:
- jb_gateway_create_order, jb_gateway_verify, jb_gateway_payout, jb_gateway_payout_status
- Deposits: fresh order_ref WZ-<time36>-<rand4>, open pay_url in new tab, poll verify every 4s, auto-reconcile on app open
- Withdraw: checks paid deposit target, wagering rule (bets >= deposits), min/max/daily limit, calls payout with idempotency key

Security:
- All outcomes server-side crypto RNG in edge function
- Never trust client bet amounts/multipliers
- RLS on all tables, admin check via winzy_is_admin()
- Rate-limit via rate_limits table
- Gateway secrets server-side only (edge function env + admin-only gateway_config table)

Admin Panel (sidebar):
- Dashboard (coins in/out, house edge)
- Lottery draw control (run draw, publish)
- Deposits/Payouts with live Jack Bank status
- Users (balances, 50+ params per player)
- Game settings (50+ global params)
- Gateway settings (keys, enable/disable, Test)

## Setup

1. Create Supabase project for WINZY
2. Run `supabase/migrations/001_winzy_schema.sql` in SQL editor
3. Deploy edge function `supabase/functions/winzy-api`:
   - Set secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JACKBANK_URL, JACKBANK_ANON_KEY, JACKBANK_MERCHANT_API_KEY, JACKBANK_MERCHANT_API_SECRET
   - Deploy: `supabase functions deploy winzy-api --no-verify-jwt`
4. Frontend env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
5. npm install, npm run dev, npm run build
6. GitHub Pages: base /winzy/, workflow deploys dist

First user becomes admin automatically. Or manually: `update profiles set is_admin=true where email='you@example.com'`.

## Jack Bank Integration

Jack Bank anon key + merchant api key/secret from merchant dashboard. Same (merchant, order_ref) upserts to pending — always fresh order_ref per deposit. Credit only when verify.status=paid and verify.amount >= deposit amount. Payouts target payer of paid order_ref, from merchant unsettled balance.

## Testing

Signup → deposit flow up to pay_url → game bet → withdraw validation. Clean up temp data after.

Live: https://jackbhai.github.io/winzy/
