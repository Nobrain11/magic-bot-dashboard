import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botConfigTable = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  tokenMint: text("token_mint").notNull().default("Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump"),
  rpcUrl: text("rpc_url").notNull().default("https://api.mainnet-beta.solana.com"),
  totalWallets: integer("total_wallets").notNull().default(40),
  activeBuyers: integer("active_buyers").notNull().default(5),
  activeSellers: integer("active_sellers").notNull().default(5),
  rotateEveryNBuys: integer("rotate_every_n_buys").notNull().default(3),
  targetMc: real("target_mc").notNull().default(20000),
  initialMc: real("initial_mc").notNull().default(5000),
  intervalSeconds: integer("interval_seconds").notNull().default(30),
  sellProbability: real("sell_probability").notNull().default(0.4),
  slippageBps: integer("slippage_bps").notNull().default(500),
  strategyMode: text("strategy_mode").notNull().default("balanced"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBotConfigSchema = createInsertSchema(botConfigTable).omit({ id: true, updatedAt: true });
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfigTable.$inferSelect;

export const walletsTable = pgTable("wallets", {
  id: integer("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  role: text("role").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  solBalance: real("sol_balance").notNull().default(0),
  tokenBalance: real("token_balance").notNull().default(0),
  totalBuys: integer("total_buys").notNull().default(0),
  totalSells: integer("total_sells").notNull().default(0),
  buyCountThisRotation: integer("buy_count_this_rotation").notNull().default(0),
  sellCountThisRotation: integer("sell_count_this_rotation").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWalletSchema = createInsertSchema(walletsTable).omit({ updatedAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type WalletRow = typeof walletsTable.$inferSelect;

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  walletId: integer("wallet_id").notNull(),
  action: text("action").notNull(),
  amount: real("amount").notNull().default(0),
  marketCap: real("market_cap").notNull().default(0),
  txSignature: text("tx_signature").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionRow = typeof transactionsTable.$inferSelect;

export const botLogsTable = pgTable("bot_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  level: text("level").notNull().default("INFO"),
  message: text("message").notNull(),
});

export const insertBotLogSchema = createInsertSchema(botLogsTable).omit({ id: true });
export type InsertBotLog = z.infer<typeof insertBotLogSchema>;
export type BotLog = typeof botLogsTable.$inferSelect;

export const botStateTable = pgTable("bot_state", {
  id: serial("id").primaryKey(),
  running: boolean("running").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }),
  pid: integer("pid"),
  totalActions: integer("total_actions").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBotStateSchema = createInsertSchema(botStateTable).omit({ id: true, updatedAt: true });
export type InsertBotState = z.infer<typeof insertBotStateSchema>;
export type BotState = typeof botStateTable.$inferSelect;
