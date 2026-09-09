-- 5 new games: crash, mines, plinko, coinflip, slots
-- Add columns to game_settings

alter table public.game_settings add column if not exists crash_min_bet numeric default 1;
alter table public.game_settings add column if not exists crash_max_bet numeric default 5000;
alter table public.game_settings add column if not exists crash_house_edge numeric default 3;
alter table public.game_settings add column if not exists crash_max_multiplier numeric default 100;
alter table public.game_settings add column if not exists crash_cooldown_sec int default 1;

alter table public.game_settings add column if not exists mines_min_bet numeric default 1;
alter table public.game_settings add column if not exists mines_max_bet numeric default 5000;
alter table public.game_settings add column if not exists mines_house_edge numeric default 3;
alter table public.game_settings add column if not exists mines_grid_size int default 25;
alter table public.game_settings add column if not exists mines_count int default 5;
alter table public.game_settings add column if not exists mines_cooldown_sec int default 1;

alter table public.game_settings add column if not exists plinko_min_bet numeric default 1;
alter table public.game_settings add column if not exists plinko_max_bet numeric default 5000;
alter table public.game_settings add column if not exists plinko_house_edge numeric default 4;
alter table public.game_settings add column if not exists plinko_max_multiplier numeric default 100;
alter table public.game_settings add column if not exists plinko_cooldown_sec int default 1;

alter table public.game_settings add column if not exists coinflip_min_bet numeric default 1;
alter table public.game_settings add column if not exists coinflip_max_bet numeric default 5000;
alter table public.game_settings add column if not exists coinflip_payout_multiplier numeric default 1.95;
alter table public.game_settings add column if not exists coinflip_house_edge numeric default 2.5;
alter table public.game_settings add column if not exists coinflip_cooldown_sec int default 1;

alter table public.game_settings add column if not exists slots_min_bet numeric default 1;
alter table public.game_settings add column if not exists slots_max_bet numeric default 2000;
alter table public.game_settings add column if not exists slots_house_edge numeric default 5;
alter table public.game_settings add column if not exists slots_jackpot_multiplier numeric default 50;
alter table public.game_settings add column if not exists slots_cooldown_sec int default 1;

-- History tables

create table if not exists public.crash_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  cashout_target numeric not null,
  crash_point numeric not null,
  win boolean not null,
  multiplier numeric not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.crash_history enable row level security;
drop policy if exists "crash_own" on public.crash_history;
create policy "crash_own" on public.crash_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists crash_user_idx on public.crash_history(user_id, created_at desc);

create table if not exists public.mines_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  mines_count int not null,
  revealed int not null,
  win boolean not null,
  multiplier numeric not null,
  win_amount numeric not null,
  board int[] not null,
  picks int[] not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.mines_history enable row level security;
drop policy if exists "mines_own" on public.mines_history;
create policy "mines_own" on public.mines_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists mines_user_idx on public.mines_history(user_id, created_at desc);

create table if not exists public.plinko_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  risk text not null default 'medium',
  slot_index int not null,
  multiplier numeric not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.plinko_history enable row level security;
drop policy if exists "plinko_own" on public.plinko_history;
create policy "plinko_own" on public.plinko_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists plinko_user_idx on public.plinko_history(user_id, created_at desc);

create table if not exists public.coinflip_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  picked text not null,
  result_side text not null,
  win boolean not null,
  multiplier numeric not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.coinflip_history enable row level security;
drop policy if exists "coinflip_own" on public.coinflip_history;
create policy "coinflip_own" on public.coinflip_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists coinflip_user_idx on public.coinflip_history(user_id, created_at desc);

create table if not exists public.slots_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_amount numeric not null,
  reels text[] not null,
  win boolean not null,
  multiplier numeric not null,
  win_amount numeric not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.slots_history enable row level security;
drop policy if exists "slots_own" on public.slots_history;
create policy "slots_own" on public.slots_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
create index if not exists slots_user_idx on public.slots_history(user_id, created_at desc);

-- Extend player_settings for new games
alter table public.player_settings add column if not exists can_play_crash boolean default true;
alter table public.player_settings add column if not exists can_play_mines boolean default true;
alter table public.player_settings add column if not exists can_play_plinko boolean default true;
alter table public.player_settings add column if not exists can_play_coinflip boolean default true;
alter table public.player_settings add column if not exists can_play_slots boolean default true;
alter table public.player_settings add column if not exists max_bet_crash numeric;
alter table public.player_settings add column if not exists max_bet_mines numeric;
alter table public.player_settings add column if not exists max_bet_plinko numeric;
alter table public.player_settings add column if not exists max_bet_coinflip numeric;
alter table public.player_settings add column if not exists max_bet_slots numeric;
alter table public.player_settings add column if not exists min_bet_crash numeric;
alter table public.player_settings add column if not exists min_bet_mines numeric;
alter table public.player_settings add column if not exists min_bet_plinko numeric;
alter table public.player_settings add column if not exists min_bet_coinflip numeric;
alter table public.player_settings add column if not exists min_bet_slots numeric;
alter table public.player_settings add column if not exists cooldown_crash_sec int;
alter table public.player_settings add column if not exists cooldown_mines_sec int;
alter table public.player_settings add column if not exists cooldown_plinko_sec int;
alter table public.player_settings add column if not exists cooldown_coinflip_sec int;
alter table public.player_settings add column if not exists cooldown_slots_sec int;
alter table public.player_settings add column if not exists custom_house_edge_crash numeric;
alter table public.player_settings add column if not exists custom_house_edge_mines numeric;
alter table public.player_settings add column if not exists custom_house_edge_plinko numeric;
alter table public.player_settings add column if not exists custom_house_edge_coinflip numeric;
alter table public.player_settings add column if not exists custom_house_edge_slots numeric;
alter table public.player_settings add column if not exists max_crash_per_day int;
alter table public.player_settings add column if not exists max_mines_per_day int;
alter table public.player_settings add column if not exists max_plinko_per_day int;
alter table public.player_settings add column if not exists max_coinflip_per_day int;
alter table public.player_settings add column if not exists max_slots_per_day int;

-- Enable realtime for profiles and ledger
-- Note: Supabase realtime needs publication, but RLS policies already allow own select
-- We ensure supabase_realtime publication includes these tables if not already
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='wallet_ledger') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_ledger;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore if publication doesn't exist in local dev
  NULL;
END $$;
