-- Potra Postgres schema
-- Run this in Neon SQL Editor or any Postgres database before deploying the backend.

create table if not exists launched_tokens (
  asset_id bigint primary key,
  name text not null,
  symbol text not null,
  total_supply text not null,
  decimals integer not null check (decimals >= 0 and decimals <= 18),
  owner_address text not null,
  tx_hashes jsonb not null default '[]'::jsonb,
  description text,
  website text,
  twitter text,
  telegram text,
  launched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists launched_tokens_symbol_idx on launched_tokens (symbol);
create index if not exists launched_tokens_owner_idx on launched_tokens (owner_address);
create index if not exists launched_tokens_launched_at_idx on launched_tokens (launched_at desc);

create table if not exists liquidity_positions (
  id text primary key,
  owner_address text not null,
  pool_address text not null,
  asset_id bigint not null,
  asset_name text not null,
  asset_symbol text not null,
  asset_decimals integer not null check (asset_decimals >= 0 and asset_decimals <= 18),
  pot_amount text not null,
  asset_amount text not null,
  pot_tx_hash text not null,
  asset_tx_hash text not null,
  status text not null default 'funded',
  mode text not null default 'managed-vault',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists liquidity_positions_asset_idx on liquidity_positions (asset_id);
create index if not exists liquidity_positions_owner_idx on liquidity_positions (owner_address);
create index if not exists liquidity_positions_created_at_idx on liquidity_positions (created_at desc);

create table if not exists swap_transactions (
  id text primary key,
  wallet_address text not null,
  direction text not null check (direction in ('potToAsset', 'assetToPot')),
  asset_id bigint not null,
  asset_symbol text not null,
  input_amount text not null,
  output_amount text not null,
  input_tx_hash text not null,
  output_tx_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists swap_transactions_wallet_idx on swap_transactions (wallet_address);
create index if not exists swap_transactions_asset_idx on swap_transactions (asset_id);
create index if not exists swap_transactions_created_at_idx on swap_transactions (created_at desc);

create table if not exists activity_events (
  id text primary key,
  event_type text not null,
  wallet_address text,
  title text not null,
  description text,
  tx_hash text,
  asset_id bigint,
  asset_symbol text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_wallet_idx on activity_events (wallet_address);
create index if not exists activity_events_type_idx on activity_events (event_type);
create index if not exists activity_events_created_at_idx on activity_events (created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_launched_tokens_updated_at on launched_tokens;
create trigger set_launched_tokens_updated_at
before update on launched_tokens
for each row execute function set_updated_at();

drop trigger if exists set_liquidity_positions_updated_at on liquidity_positions;
create trigger set_liquidity_positions_updated_at
before update on liquidity_positions
for each row execute function set_updated_at();
