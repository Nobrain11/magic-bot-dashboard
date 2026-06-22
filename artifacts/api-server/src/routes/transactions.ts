import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /transactions
router.get("/transactions", async (req, res): Promise<void> => {
  const txs = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.timestamp))
    .limit(500);

  res.json(
    txs.map((t) => ({
      id: t.id,
      timestamp: t.timestamp.toISOString(),
      walletId: t.walletId,
      action: t.action,
      amount: t.amount,
      marketCap: t.marketCap,
      txSignature: t.txSignature,
    }))
  );
});

export default router;
