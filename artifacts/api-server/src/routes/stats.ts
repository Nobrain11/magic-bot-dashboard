import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  botConfigTable,
  botStateTable,
  walletsTable,
  transactionsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

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

// GET /stats/market
router.get("/stats/market", async (req, res): Promise<void> => {
  const config = await ensureConfig();

  // Try to get live market data from Jupiter
  let marketCap = config.initialMc;
  let solPrice = 150.0;
  let tokenPrice = 0.0;

  try {
    const solPriceRes = await fetch("https://price.jup.ag/v4/price?ids=SOL");
    if (solPriceRes.ok) {
      const data = (await solPriceRes.json()) as {
        data?: { SOL?: { price?: number } };
      };
      solPrice = data?.data?.SOL?.price ?? 150.0;
    }
  } catch (_) {}

  try {
    if (
      config.tokenMint &&
      config.tokenMint !== "YOUR_TOKEN_MINT_ADDRESS"
    ) {
      const quoteRes = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${config.tokenMint}&amount=100000000&slippageBps=50`
      );
      if (quoteRes.ok) {
        const q = (await quoteRes.json()) as { outAmount?: string };
        if (q.outAmount) {
          const tokens = parseInt(q.outAmount, 10) / 1e6;
          if (tokens > 0) {
            tokenPrice = (0.1 / tokens) * solPrice;
            marketCap = tokenPrice * 1_000_000_000;
          }
        }
      }
    }
  } catch (_) {}

  res.json({
    marketCap,
    solPrice,
    tokenPrice,
    timestamp: new Date().toISOString(),
  });
});

export default router;
