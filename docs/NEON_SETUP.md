# Neon Postgres setup for Potra

Use this when Supabase asks for an upgrade. Potra only needs normal Postgres for the shared registry.

## What Neon stores

Potra uses Postgres for shared app records only:

```text
launched tokens
liquidity positions
swap records
activity events
```

Onchain balances and transactions still live on Portaldot. The database is not the source of truth for wallet balances.

## 1. Create the Neon project

Open this in your browser:

```text
https://console.neon.tech
```

Create a new project.

Recommended settings:

```text
Project name: potra
Database name: potra
Region: closest affordable/default region
```

## 2. Copy the connection string

In Neon, open your project dashboard and copy the pooled Postgres connection string.

It should look like this:

```env
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

Keep it private. It belongs only in the backend environment.

## 3. Run the schema

Open Neon SQL Editor.

Paste everything from:

```text
database/schema.sql
```

Run it once.

## 4. Add backend env locally

Run this in Windows PowerShell:

```powershell
cd c:\dev\potra\backend
notepad .env
```

Add:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=5
```

Keep your existing Portaldot values too:

```env
PORTALDOT_RPC_URL=wss://rpc.194-163-190-189.sslip.io
PORTALDOT_RPC=wss://rpc.194-163-190-189.sslip.io
```

## 5. Test backend health

Run this in Windows PowerShell:

```powershell
cd c:\dev\potra\backend
npm install
npm run dev
```

Open this in your browser address bar:

```text
http://localhost:8787/health
```

Expected database section:

```json
{
  "configured": true,
  "provider": "postgres"
}
```

## 6. Confirm shared registry

Run Potra locally and test:

```text
Launch a token
Refresh the app
Open Swap
Open Liquidity
Confirm the token is still visible
Check Neon table launched_tokens
```

## Important safety note

Do not put `DATABASE_URL` inside Vercel frontend variables. It belongs only in the backend, locally and on Railway.
