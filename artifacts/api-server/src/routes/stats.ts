import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  botConfigTable,
  botStateTable,
  walletsTable,
  transactionsTable,
} from "@workspace/db";

const router: IRouter = Router();

const TOKEN_MINT = "Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump";
const WSOL_MINT = "So11111111111111111111111111111111111111112";

async function ensureState() {
  const existing = await db.select().from(botStateTable).limit(1);
  if (existing.length === 0) {
    await db.insert(botStateTable).values({});
  }
  return (await db.select().from(botStateTable).limit(1))[0];
}

async function ensureConfig() {
  const existing = await db.select().from(botConfigTable).limit(1);
  if (existing.length === 0) {
    await db.insert(botConfigTable).values({});
  }
  return (await db.select().from(botConfigTable).limit(1))[0];
}

// GET /stats/summary
router.get("/stats/summary", async (req, res): Promise<void> => {
  const [state, config] = await Promise.all([ensureState(), ensureConfig()]);

  const allTxs = await db.select().from(transactionsTable);
  const totalBuys = allTxs.filter((t) => t.action === "BUY").length;
  const totalSells = allTxs.filter((t) => t.action === "SELL").length;
  const totalSolSpent = allTxs
    .filter((t) => t.action === "BUY")
    .reduce((sum, t) => sum + t.amount, 0);

  const allWallets = await db.select().from(walletsTable);
  const walletsUsed = allWallets.filter(
    (w) => w.totalBuys > 0 || w.totalSells > 0
  ).length;

  const lastTx = allTxs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  const currentMc = lastTx?.marketCap ?? config.initialMc;

  const uptimeMinutes = state.startedAt
    ? (Date.now() - new Date(state.startedAt).getTime()) / 60000
    : 0;

  res.json({
    totalTransactions: allTxs.length,
    totalBuys,
    totalSells,
    totalSolSpent,
    walletsUsed,
    currentMc,
    targetMc: config.targetMc,
    uptimeMinutes,
  });
});

// GET /stats/market — live price from DexScreener (mainnet)
router.get("/stats/market", async (req, res): Promise<void> => {
  let marketCap = 0;
  let solPrice = 0;
  let tokenPrice = 0;

  // Fetch SOL price and $MAGIC price concurrently
  await Promise.all([
    // SOL price from CoinGecko (public, no key needed)
    (async () => {
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
          { signal: AbortSignal.timeout(5000) }
        );
        if (r.ok) {
          const d = (await r.json()) as { solana?: { usd?: number } };
          solPrice = d?.solana?.usd ?? 0;
        }
      } catch (_) {}
    })(),

    // $MAGIC price & market cap from DexScreener
    (async () => {
      try {
        const r = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (r.ok) {
          const d = (await r.json()) as {
            pairs?: Array<{
              priceUsd?: string;
              fdv?: number;
              marketCap?: number;
              chainId?: string;
              dexId?: string;
              liquidity?: { usd?: number };
            }>;
          };
          // Pick the Solana pair with most liquidity
          const pairs = (d?.pairs ?? [])
            .filter((p) => p.chainId === "solana")
            .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));

          if (pairs.length > 0) {
            const best = pairs[0];
            tokenPrice = parseFloat(best.priceUsd ?? "0") || 0;
            marketCap = best.marketCap ?? best.fdv ?? 0;
          }
        }
      } catch (_) {}
    })(),
  ]);

  // Fallback: derive from Jupiter quote if DexScreener returned nothing
  if (tokenPrice === 0) {
    try {
      const r = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${WSOL_MINT}&outputMint=${TOKEN_MINT}&amount=100000000&slippageBps=100`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (r.ok) {
        const q = (await r.json()) as { outAmount?: string };
        if (q.outAmount) {
          const tokens = parseInt(q.outAmount, 10) / 1_000_000;
          if (tokens > 0 && solPrice > 0) {
            tokenPrice = (0.1 / tokens) * solPrice;
            marketCap = tokenPrice * 1_000_000_000;
          }
        }
      }
    } catch (_) {}
  }

  res.json({
    marketCap,
    solPrice,
    tokenPrice,
    timestamp: new Date().toISOString(),
  });
});

export default router;
