-- WINZY schema — AMOLED game app with Jack Bank gateway
create extension if not exists "uuid-ossp";

-- 1. Profiles table first (no policies yet)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  balance numeric(16,2) not null default 0,
  lifetime_deposits numeric(16,2) not null default 0,
  lifetime_bets numeric(16,2) not null default 0,
  lifetime_wins numeric(16,2) not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
-- Ensure columns exist if table was pre-existing
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists balance numeric(16,2) default 0;
alter table public.profiles add column if not exists lifetime_deposits numeric(16,2) default 0;
alter table public.profiles add column if not exists lifetime_bets numeric(16,2) default 0;
alter table public.profiles add column if not exists lifetime_wins numeric(16,2) default 0;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists created_at timestamptz default now();

-- 2. Helper functions
create or replace function public.winzy_is_admin()
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  return exists(select 1 from public.profiles where id = auth.uid() and is_admin = true);
exception when undefined_column then
  return false;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, balance)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), 0)
  on conflict (id) do nothing;
  update public.profiles set is_admin = true where id = new.id and (select count(*) from public.profiles where is_admin = true) = 0;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 3. RLS for profiles
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid() or public.winzy_is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid() or public.winzy_is_admin()) with check (id = auth.uid() or public.winzy_is_admin());
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert to authenticated with check (true);

-- 4. Game settings (50+ params)
create table if not exists public.game_settings (
  id int primary key,
  lottery_ticket_price numeric not null default 10,
  lottery_max_tickets_per_user int not null default 10,
  lottery_match3_pct numeric not null default 10,
  lottery_match4_pct numeric not null default 15,
  lottery_match5_pct numeric not null default 25,
  lottery_match6_pct numeric not null default 50,
  lottery_house_edge numeric not null default 10,
  lottery_draw_interval_hours int not null default 24,
  lottery_min_pot numeric not null default 100,
  lottery_max_pot numeric not null default 1000000,
  lottery_auto_credit boolean not null default true,
  lottery_jackpot_rollover boolean not null default true,
  spin_cost numeric not null default 10,
  spin_multiplier_0 numeric not null default 0,
  spin_multiplier_1_2 numeric not null default 1.2,
  spin_multiplier_1_5 numeric not null default 1.5,
  spin_multiplier_2 numeric not null default 2,
  spin_multiplier_5 numeric not null default 5,
  spin_multiplier_jackpot numeric not null default 10,
  spin_weight_0 int not null default 30,
  spin_weight_1_2 int not null default 25,
  spin_weight_1_5 int not null default 20,
  spin_weight_2 int not null default 15,
  spin_weight_5 int not null default 8,
  spin_weight_jackpot int not null default 2,
  spin_house_edge numeric not null default 5,
  spin_max_win numeric not null default 10000,
  spin_cooldown_sec int not null default 2,
  spin_daily_limit int not null default 100,
  dice_min_bet numeric not null default 1,
  dice_max_bet numeric not null default 1000,
  dice_min_target numeric not null default 5,
  dice_max_target numeric not null default 95,
  dice_house_edge numeric not null default 2,
  dice_max_multiplier numeric not null default 10,
  dice_cooldown_sec int not null default 1,
  guess_cost numeric not null default 10,
  guess_payout_multiplier numeric not null default 8,
  guess_min_bet numeric not null default 1,
  guess_max_bet numeric not null default 1000,
  guess_house_edge numeric not null default 5,
  guess_cooldown_sec int not null default 1,
  wallet_min_deposit numeric not null default 10,
  wallet_max_deposit numeric not null default 10000,
  wallet_min_withdraw numeric not null default 50,
  wallet_max_withdraw numeric not null default 5000,
  wallet_daily_withdraw_limit numeric not null default 10000,
  wallet_daily_deposit_limit numeric not null default 20000,
  wallet_wagering_multiplier numeric not null default 1,
  wallet_withdraw_cooldown_sec int not null default 60,
  wallet_deposit_bonus_pct numeric not null default 0,
  wallet_referral_bonus numeric not null default 0,
  gateway_fee_pct numeric not null default 2,
  gateway_enabled boolean not null default true,
  gateway_test_mode boolean not null default false,
  site_maintenance boolean not null default false,
  site_maintenance_msg text not null default 'Maintenance',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.game_settings enable row level security;
drop policy if exists "game_settings_select_all" on public.game_settings;
create policy "game_settings_select_all" on public.game_settings for select to authenticated using (true);
drop policy if exists "game_settings_admin" on public.game_settings;
create policy "game_settings_admin" on public.game_settings for all to authenticated using (public.winzy_is_admin()) with check (public.winzy_is_admin());
insert into public.game_settings (id) values (1) on conflict (id) do nothing;

-- 5. Gateway config (admin-only)
create table if not exists public.gateway_config (
  id int primary key,
  jackbank_url text not null default 'https://nksthsgrxudptwdbytoh.supabase.co',
  jackbank_anon_key text,
  merchant_api_key text,
  merchant_api_secret text,
  pay_url_base text not null default 'https://jackbhai.github.io/jack-bank/#/gateway/',
  enabled boolean not null default true,
  test_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gateway_config enable row level security;
drop policy if exists "gateway_config_admin_only" on public.gateway_config;
create policy "gateway_config_admin_only" on public.gateway_config for all to authenticated using (public.winzy_is_admin()) with check (public.winzy_is_admin());
insert into public.gateway_config (id) values (1) on conflict (id) do nothing;

-- 6. Player settings (50+ per player)
create table if not exists public.player_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  max_bet_lottery numeric,
  max_bet_spin numeric,
  max_bet_dice numeric,
  max_bet_guess numeric,
  min_bet_lottery numeric,
  min_bet_spin numeric,
  min_bet_dice numeric,
  min_bet_guess numeric,
  daily_loss_limit numeric,
  daily_win_limit numeric,
  daily_bet_limit numeric,
  max_deposit_per_day numeric,
  max_withdraw_per_day numeric,
  cooldown_spin_sec int,
  cooldown_dice_sec int,
  cooldown_guess_sec int,
  cooldown_lottery_sec int,
  custom_house_edge_spin numeric,
  custom_house_edge_dice numeric,
  custom_house_edge_guess numeric,
  custom_house_edge_lottery numeric,
  jackpot_eligible boolean default true,
  bonus_eligible boolean default true,
  is_blocked boolean default false,
  is_verified boolean default false,
  can_withdraw boolean default true,
  can_deposit boolean default true,
  can_play_lottery boolean default true,
  can_play_spin boolean default true,
  can_play_dice boolean default true,
  can_play_guess boolean default true,
  wager_multiplier_override numeric,
  withdraw_fee_pct numeric,
  deposit_bonus_pct numeric,
  referral_bonus_pct numeric,
  max_tickets_per_draw int,
  max_spins_per_day int,
  max_dice_per_day int,
  max_guess_per_day int,
  risk_score int,
  trust_score int,
  notes text,
  tags text,
  custom_multiplier_spin numeric,
  custom_payout_guess numeric,
  lottery_discount_pct numeric,
  spin_discount_pct numeric,
  vip_level int,
  vip_cashback_pct numeric,
  allow_high_roller boolean default false,
  require_2fa_withdraw boolean default false,
  auto_flag_suspicious boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.player_settings enable row level security;
drop policy if exists "player_settings_admin" on public.player_settings;
create policy "player_settings_admin" on public.player_settings for all to authenticated using (public.winzy_is_admin()) with check (public.winzy_is_admin());
drop policy if exists "player_settings_own_read" on public.player_settings;
create policy "player_settings_own_read" on public.player_settings for select to authenticated using (user_id = auth.uid());

-- 7. Wallet ledger
create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('deposit','bet','win','withdraw','bonus','refund','adjustment')),
  amount numeric(16,2) not null,
  balance_after numeric(16,2),
  ref_id text,
  note text,
  game_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.wallet_ledger enable row level security;
drop policy if exists "ledger_select_own" on public.wallet_ledger;
create policy "ledger_select_own" on public.wallet_ledger for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists ledger_user_idx on public.wallet_ledger(user_id, created_at desc);

-- 8. Deposits
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_ref text not null unique,
  amount numeric(16,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  pay_url text,
  pay_token text,
  jack_response jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.deposits enable row level security;
drop policy if exists "deposits_own" on public.deposits;
create policy "deposits_own" on public.deposits for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists deposits_user_idx on public.deposits(user_id, created_at desc);
create index if not exists deposits_order_ref_idx on public.deposits(order_ref);

-- 9. Withdrawals
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(16,2) not null,
  order_ref_target text not null,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  payout_id text,
  jack_response jsonb,
  created_at timestamptz not null default now()
);
alter table public.withdrawals enable row level security;
drop policy if exists "withdrawals_own" on public.withdrawals;
create policy "withdrawals_own" on public.withdrawals for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists withdrawals_user_idx on public.withdrawals(user_id, created_at desc);

-- 10. Lottery draws
create table if not exists public.lottery_draws (
  id uuid primary key default gen_random_uuid(),
  draw_number int not null unique,
  status text not null default 'open' check (status in ('open','drawing','completed')),
  ticket_price numeric not null default 10,
  winning_numbers int[],
  prize_tiers jsonb not null default '{}'::jsonb,
  total_pot numeric not null default 0,
  tickets_count int not null default 0,
  winners_count int not null default 0,
  winners jsonb not null default '[]'::jsonb,
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.lottery_draws enable row level security;
drop policy if exists "lottery_draws_public" on public.lottery_draws;
create policy "lottery_draws_public" on public.lottery_draws for select to authenticated using (true);

-- 11. Lottery tickets
create table if not exists public.lottery_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draw_id uuid not null references public.lottery_draws(id) on delete cascade,
  numbers int[] not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','won','lost')),
  win_amount numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.lottery_tickets enable row level security;
drop policy if exists "lottery_tickets_own" on public.lottery_tickets;
create policy "lottery_tickets_own" on public.lottery_tickets for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists lottery_tickets_draw_idx on public.lottery_tickets(draw_id);
create index if not exists lottery_tickets_user_idx on public.lottery_tickets(user_id);

-- 12. Spin history
create table if not exists public.spin_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  multiplier numeric not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.spin_history enable row level security;
drop policy if exists "spin_own" on public.spin_history;
create policy "spin_own" on public.spin_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists spin_user_idx on public.spin_history(user_id, created_at desc);

-- 13. Dice history
create table if not exists public.dice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  target numeric not null,
  over boolean not null,
  roll numeric not null,
  win boolean not null,
  multiplier numeric not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.dice_history enable row level security;
drop policy if exists "dice_own" on public.dice_history;
create policy "dice_own" on public.dice_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());

-- 14. Guess history
create table if not exists public.guess_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  picked int not null,
  drawn int not null,
  win boolean not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.guess_history enable row level security;
drop policy if exists "guess_own" on public.guess_history;
create policy "guess_own" on public.guess_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());

-- 15. Rate limit table
create table if not exists public.rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  count int not null default 1,
  window_start timestamptz not null default now(),
  primary key (user_id, action)
);
alter table public.rate_limits enable row level security;
drop policy if exists "rate_limits_own" on public.rate_limits;
create policy "rate_limits_own" on public.rate_limits for all to authenticated using (user_id = auth.uid() or public.winzy_is_admin()) with check (user_id = auth.uid() or public.winzy_is_admin());
