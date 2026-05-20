# Potra Supabase Setup

Potra now supports a shared Supabase Postgres registry so launched tokens, liquidity positions, swaps, and activity are visible across users and browsers.

## 1. Create project

Create a Supabase project and wait for the database to finish provisioning.

## 2. Run schema

Open Supabase SQL Editor and run:

```sql
-- paste everything from supabase/schema.sql
```

The schema creates:

```text
launched_tokens
liquidity_positions
swap_transactions
activity_events
```

## 3. Copy backend credentials

From Supabase project settings, copy:

```text
Project URL
service_role key
```

Only put the service role key in the Railway backend. Never put it in Vercel or frontend env.

## 4. Backend env

Use these in `backend/.env` locally and Railway variables online:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## 5. Frontend behavior

The frontend still writes to local storage immediately so the app feels fast. It also posts successful launches, liquidity positions, and swaps to the backend. On page load, Swap and Liquidity pull the shared registry from the backend so other users can see created tokens and markets.

## 6. Safety rule

Never commit:

```text
.env
.env.local
backend/.env
evm/.env
service role keys
private keys
seed phrases
```
