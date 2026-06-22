import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botRouter from "./bot";
import walletsRouter from "./wallets";
import transactionsRouter from "./transactions";
import statsRouter from "./stats";
import internalRouter from "./internal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botRouter);
router.use(walletsRouter);
router.use(transactionsRouter);
router.use(statsRouter);
router.use(internalRouter);

export default router;
