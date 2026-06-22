# $MAGIC Bot Dashboard

A dark arcane war room for controlling and monitoring the $MAGIC Solana rotating-wallet market-making bot. Built for the token: `Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump`.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/magic-dashboard run dev` — run the dashboard frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080)
- Frontend: React + Vite (port 18276), dark arcane theme, purple/gold palette
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Python bot: `bot/magic_bot.py` (spawned by API server on start)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema/bot.ts` — DB tables: bot_config, bot_state, wallets, transactions, bot_logs
- `artifacts/api-server/src/routes/` — Express route handlers (bot, wallets, transactions, stats, internal)
- `artifacts/magic-dashboard/src/` — React dashboard pages (Dashboard, Wallets, Transactions, Settings)
- `bot/magic_bot.py` — Python rotating wallet bot (spawned by POST /api/bot/start)
- `bot/wallets/` — Generated Solana keypairs (created by Python bot)

## Architecture decisions

- Bot process is spawned as a child process of the API server when `/api/bot/start` is called
- Python bot writes transactions/wallet state back via `/api/internal/transaction` and `/api/internal/wallet`
- Bot state (running/stopped, pid, totalActions) persisted in DB so dashboard survives API restarts
- If bot script is missing, API falls back to "simulated mode" showing demo data
- Dashboard auto-polls every 5s (status, market, logs) and 10s (wallets, transactions)

## Product

- **Dashboard** — Live bot status, market cap progress toward $20k target, transaction feed, price feed
- **Wallets** — All 40 rotating wallets (30 buyers + 10 sellers) with SOL/token balances, active/inactive
- **Transactions** — Full swap history with Solana Explorer links
- **Settings** — Edit token mint, RPC URL, slippage, MC target, rotation params; start/stop bot with live log tail

## User preferences

- Token: `Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump` ($MAGIC / Wizard World Magic)
- Always dark mode only

## Gotchas

- After OpenAPI spec changes, always run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs` before checking artifact packages
- The Python bot requires `aiohttp`, `base58`, `solana-py`, `solders`, `spl-token` to run real swaps — falls back to simulation mode if missing
- Bot wallets are stored in `bot/wallets/wallet_N.json` — fund them with SOL before running for real

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
