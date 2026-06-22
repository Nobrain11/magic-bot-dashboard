import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable, botStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// POST /internal/transaction — called by the Python bot to record a swap
router.post("/internal/transaction", async (req, res): Promise<void> => {
  const { walletId, action, amount, marketCap, txSignature } = req.body;
  if (!walletId || !action || !txSignature) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      walletId: Number(walletId),
      action: String(action),
      amount: Number(amount) || 0,
      marketCap: Number(marketCap) || 0,
      txSignature: String(txSignature),
    })
    .returning();

  // Increment totalActions on bot state
  const states = await db.select().from(botStateTable).limit(1);
  if (states.length > 0) {
    await db
      .update(botStateTable)
      .set({ totalActions: (states[0].totalActions ?? 0) + 1 })
      .where(eq(botStateTable.id, states[0].id));
  }

  res.status(201).json({ id: tx.id });
});

// POST /internal/wallet — called by the Python bot to sync wallet state
router.post("/internal/wallet", async (req, res): Promise<void> => {
  const { id, publicKey, role, isActive, solBalance, tokenBalance, totalBuys, totalSells, buyCountThisRotation, sellCountThisRotation } = req.body;
  if (!id || !publicKey) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = await db.select().from(walletsTable).where(eq(walletsTable.id, Number(id))).limit(1);

  if (existing.length > 0) {
    await db
      .update(walletsTable)
      .set({
        publicKey: String(publicKey),
        role: String(role || "buyer"),
        isActive: Boolean(isActive),
        solBalance: Number(solBalance) || 0,
        tokenBalance: Number(tokenBalance) || 0,
        totalBuys: Number(totalBuys) || 0,
        totalSells: Number(totalSells) || 0,
        buyCountThisRotation: Number(buyCountThisRotation) || 0,
        sellCountThisRotation: Number(sellCountThisRotation) || 0,
      })
      .where(eq(walletsTable.id, Number(id)));
  } else {
    await db.insert(walletsTable).values({
      id: Number(id),
      publicKey: String(publicKey),
      role: String(role || "buyer"),
      isActive: Boolean(isActive),
      solBalance: Number(solBalance) || 0,
      tokenBalance: Number(tokenBalance) || 0,
      totalBuys: Number(totalBuys) || 0,
      totalSells: Number(totalSells) || 0,
      buyCountThisRotation: Number(buyCountThisRotation) || 0,
      sellCountThisRotation: Number(sellCountThisRotation) || 0,
    });
  }

  res.status(200).json({ ok: true });
});

export default router;
