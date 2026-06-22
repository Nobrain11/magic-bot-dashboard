import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { walletsTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

// GET /wallets
router.get("/wallets", async (req, res): Promise<void> => {
  const wallets = await db.select().from(walletsTable).orderBy(asc(walletsTable.id));

  res.json(
    wallets.map((w) => ({
      id: w.id,
      publicKey: w.publicKey,
      role: w.role,
      isActive: w.isActive,
      solBalance: w.solBalance,
      tokenBalance: w.tokenBalance,
      totalBuys: w.totalBuys,
      totalSells: w.totalSells,
      buyCountThisRotation: w.buyCountThisRotation,
      sellCountThisRotation: w.sellCountThisRotation,
    }))
  );
});

// GET /wallets/active
router.get("/wallets/active", async (req, res): Promise<void> => {
  const allWallets = await db.select().from(walletsTable).orderBy(asc(walletsTable.id));

  const activeWallets = allWallets.filter((w) => w.isActive);
  const buyers = activeWallets.filter((w) => w.role === "buyer").map((w) => w.id);
  const sellers = activeWallets.filter((w) => w.role === "seller").map((w) => w.id);

  const inactiveWallets = allWallets.filter((w) => !w.isActive);
  const inactiveBuyerCount = inactiveWallets.filter((w) => w.role === "buyer").length;
  const inactiveSellerCount = inactiveWallets.filter((w) => w.role === "seller").length;

  res.json({
    buyers,
    sellers,
    inactiveBuyerCount,
    inactiveSellerCount,
  });
});

export default router;
