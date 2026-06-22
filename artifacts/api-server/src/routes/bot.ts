import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  botConfigTable,
  botStateTable,
  botLogsTable,
  walletsTable,
  transactionsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  StartBotBody,
  UpdateBotConfigBody,
} from "@workspace/api-zod";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

// In-memory bot process reference
let botProcess: ChildProcess | null = null;

async function ensureConfig() {
  const existing = await db.select().from(botConfigTable).limit(1);
  if (existing.length === 0) {
    await db.insert(botConfigTable).values({});
  }
  return (await db.select().from(botConfigTable).limit(1))[0];
}

async function ensureState() {
  const existing = await db.select().from(botStateTable).limit(1);
  if (existing.length === 0) {
    await db.insert(botStateTable).values({});
  }
  return (await db.select().from(botStateTable).limit(1))[0];
}

async function appendLog(level: string, message: string) {
  try {
    await db.insert(botLogsTable).values({ level, message });
  } catch (e) {
    logger.warn({ e }, "Failed to append log");
  }
}

// GET /bot/status
router.get("/bot/status", async (req, res): Promise<void> => {
  const state = await ensureState();
  const now = Date.now();
  const startedAt = state.startedAt ? state.startedAt.toISOString() : null;
  const uptime = state.startedAt
    ? (now - new Date(state.startedAt).getTime()) / 1000
    : null;

  // Sync running state with process
  if (state.running && botProcess === null) {
    await db
      .update(botStateTable)
      .set({ running: false, pid: null })
      .where(eq(botStateTable.id, state.id));
    state.running = false;
  }

  res.json({
    running: state.running,
    startedAt,
    pid: state.pid,
    uptime,
    totalActions: state.totalActions,
  });
});

// POST /bot/start
router.post("/bot/start", async (req, res): Promise<void> => {
  const parsed = StartBotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const state = await ensureState();
  if (state.running && botProcess) {
    res.json({
      running: true,
      startedAt: state.startedAt?.toISOString() ?? null,
      pid: state.pid,
      uptime: state.startedAt
        ? (Date.now() - new Date(state.startedAt).getTime()) / 1000
        : null,
      totalActions: state.totalActions,
    });
    return;
  }

  // Update config if provided
  const config = parsed.data;
  if (Object.keys(config).length > 0) {
    const existing = await ensureConfig();
    await db
      .update(botConfigTable)
      .set({ ...config })
      .where(eq(botConfigTable.id, existing.id));
  }

  // Determine workspace root path for the Python bot
  const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();

  const botScript = path.resolve(workspaceRoot, "bot", "magic_bot.py");

  let proc: ChildProcess | null = null;
  try {
    if (fs.existsSync(botScript)) {
      const currentConfig = await ensureConfig();
      proc = spawn("python3", [botScript], {
        cwd: path.resolve(workspaceRoot, "bot"),
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          BOT_STRATEGY: currentConfig.strategyMode ?? "balanced",
          API_BASE_URL: `http://localhost:${process.env.PORT ?? 8080}/api`,
        },
      });

      botProcess = proc;

      proc.stdout?.on("data", async (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          await appendLog("INFO", line);
        }
      });

      proc.stderr?.on("data", async (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          await appendLog("ERROR", line);
        }
      });

      proc.on("exit", async (code) => {
        logger.info({ code }, "Bot process exited");
        botProcess = null;
        await appendLog("INFO", `Bot process exited with code ${code}`);
        try {
          const s = await ensureState();
          await db
            .update(botStateTable)
            .set({ running: false, pid: null })
            .where(eq(botStateTable.id, s.id));
        } catch (_) {}
      });
    } else {
      logger.warn({ botScript }, "Bot script not found at expected path");
      await appendLog("WARN", `Bot script not found at ${botScript}`);
      await appendLog("ERROR", "Cannot start bot: magic_bot.py not found. Ensure the bot/ directory is present and Python dependencies are installed (aiohttp, base58, solana-py, solders, spl-token).");
      res.status(500).json({ error: "Bot script not found. Ensure bot/magic_bot.py exists and Python deps are installed." });
      return;
    }
  } catch (err) {
    logger.error({ err }, "Failed to spawn bot process");
    await appendLog("ERROR", `Failed to start bot: ${String(err)}`);
  }

  const startedAt = new Date();
  await db
    .update(botStateTable)
    .set({ running: true, startedAt, pid: proc?.pid ?? null })
    .where(eq(botStateTable.id, state.id));

  await appendLog("INFO", "Bot started");

  res.json({
    running: true,
    startedAt: startedAt.toISOString(),
    pid: proc?.pid ?? null,
    uptime: 0,
    totalActions: 0,
  });
});

// POST /bot/stop
router.post("/bot/stop", async (req, res): Promise<void> => {
  const state = await ensureState();

  if (botProcess) {
    try {
      botProcess.kill("SIGTERM");
    } catch (err) {
      logger.warn({ err }, "Failed to kill bot process");
    }
    botProcess = null;
  }

  await db
    .update(botStateTable)
    .set({ running: false, pid: null })
    .where(eq(botStateTable.id, state.id));

  await appendLog("INFO", "Bot stopped by user");

  res.json({
    running: false,
    startedAt: null,
    pid: null,
    uptime: null,
    totalActions: state.totalActions,
  });
});

// GET /bot/config
router.get("/bot/config", async (req, res): Promise<void> => {
  const config = await ensureConfig();
  res.json({
    tokenMint: config.tokenMint,
    rpcUrl: config.rpcUrl,
    totalWallets: config.totalWallets,
    activeBuyers: config.activeBuyers,
    activeSellers: config.activeSellers,
    rotateEveryNBuys: config.rotateEveryNBuys,
    targetMc: config.targetMc,
    initialMc: config.initialMc,
    intervalSeconds: config.intervalSeconds,
    sellProbability: config.sellProbability,
    slippageBps: config.slippageBps,
    strategyMode: config.strategyMode,
  });
});

// PATCH /bot/config
router.patch("/bot/config", async (req, res): Promise<void> => {
  const parsed = UpdateBotConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await ensureConfig();
  const [updated] = await db
    .update(botConfigTable)
    .set(parsed.data)
    .where(eq(botConfigTable.id, existing.id))
    .returning();

  res.json({
    tokenMint: updated.tokenMint,
    rpcUrl: updated.rpcUrl,
    totalWallets: updated.totalWallets,
    activeBuyers: updated.activeBuyers,
    activeSellers: updated.activeSellers,
    rotateEveryNBuys: updated.rotateEveryNBuys,
    targetMc: updated.targetMc,
    initialMc: updated.initialMc,
    intervalSeconds: updated.intervalSeconds,
    sellProbability: updated.sellProbability,
    slippageBps: updated.slippageBps,
    strategyMode: updated.strategyMode,
  });
});

// GET /bot/logs
router.get("/bot/logs", async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(botLogsTable)
    .orderBy(desc(botLogsTable.id))
    .limit(200);

  res.json(
    logs.reverse().map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      level: l.level,
      message: l.message,
    }))
  );
});

export default router;
