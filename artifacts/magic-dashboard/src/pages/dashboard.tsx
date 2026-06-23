import React, { useMemo } from "react";
import {
  useGetBotStatus,
  useGetStatsSummary,
  useGetMarketStats,
  useListTransactions,
  useGetActiveWallets,
  useGetPriceChart,
  getGetBotStatusQueryKey,
  getGetStatsSummaryQueryKey,
  getGetMarketStatsQueryKey,
  getListTransactionsQueryKey,
  getGetActiveWalletsQueryKey,
  getGetPriceChartQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import bannerImage from "@assets/IMG_2735_1782149827146.jpeg";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Zap, Wallet, ArrowUpDown, ExternalLink } from "lucide-react";

function PriceChart() {
  const { data: candles, isLoading } = useGetPriceChart({
    query: { queryKey: getGetPriceChartQueryKey(), refetchInterval: 30000 },
  });

  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    const step = Math.max(1, Math.floor(candles.length / 120));
    return candles
      .filter((_, i) => i % step === 0)
      .map((c) => ({
        time: new Date(c.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        price: c.close,
        volume: c.volume,
        open: c.open,
        high: c.high,
        low: c.low,
      }));
  }, [candles]);

  const minPrice = useMemo(
    () => (chartData.length ? Math.min(...chartData.map((d) => d.price)) * 0.995 : 0),
    [chartData]
  );
  const maxPrice = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.price)) * 1.005 : 0),
    [chartData]
  );
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const isPositive = priceChange !== null && priceChange >= 0;
  const lineColor = isPositive ? "#4ade80" : "#f87171";
  const formatPrice = (v: number) => {
    if (v === 0) return "$0";
    if (v < 0.000001) return `$${v.toExponential(2)}`;
    return `$${v.toFixed(8)}`;
  };

  return (
    <Card className="bg-card/40 border-border col-span-full">
      <CardHeader className="border-b border-border/60 py-3 px-5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
            $MAGIC / USD
          </CardTitle>
          <span className="text-[10px] text-muted-foreground/50">24H</span>
          {priceChange !== null && (
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-sm ${isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
            </span>
          )}
        </div>
        {chartData.length > 0 && (
          <span className="text-[10px] text-muted-foreground/50 font-mono">{chartData.length} pts</span>
        )}
      </CardHeader>
      <CardContent className="p-0 pt-3 pb-3 pr-4">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-xs font-mono">
            Fetching mainnet data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-xs font-mono">
            No price history available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickCount={6}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatPrice}
                width={78}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a0a12",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "2px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#e5e7eb",
                }}
                formatter={(value: number) => [formatPrice(value), "Price"]}
                labelStyle={{ color: "#6b7280", marginBottom: "4px" }}
                cursor={{ stroke: "rgba(255,255,255,0.06)" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={1.5}
                fill="url(#priceGrad)"
                dot={false}
                activeDot={{ r: 3, fill: lineColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card className={`bg-card/40 border-border hover:border-border/80 transition-colors`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</span>
          <div className={`p-1.5 rounded-sm ${accent ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 border border-border/50"}`}>
            <Icon size={13} className={accent ? "text-primary" : "text-muted-foreground"} />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono tracking-tight">{value}</div>
        {sub && <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: status } = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey(), refetchInterval: 5000 } });
  const { data: stats } = useGetStatsSummary({ query: { queryKey: getGetStatsSummaryQueryKey(), refetchInterval: 5000 } });
  const { data: market } = useGetMarketStats({ query: { queryKey: getGetMarketStatsQueryKey(), refetchInterval: 5000 } });
  const { data: transactions } = useListTransactions({ query: { queryKey: getListTransactionsQueryKey(), refetchInterval: 10000 } });
  const { data: activeWallets } = useGetActiveWallets({ query: { queryKey: getGetActiveWalletsQueryKey(), refetchInterval: 10000 } });

  const progress =
    stats && stats.targetMc > 0
      ? Math.min(100, Math.max(0, (stats.currentMc / stats.targetMc) * 100))
      : 0;

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div className="relative w-full h-36 overflow-hidden border border-border/60 rounded-sm group">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30 z-10" />
        <img
          src={bannerImage}
          alt="$MAGIC"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 group-hover:scale-105 transition-transform duration-[2s]"
        />
        <div className="absolute inset-0 z-20 px-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-primary tracking-[0.2em] uppercase">
              COMMAND CENTER
            </h2>
            {status?.running ? (
              <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 uppercase text-[10px] tracking-widest font-bold px-2 py-0.5">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse mr-1.5 inline-block" />
                Running
              </Badge>
            ) : (
              <Badge className="bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 uppercase text-[10px] tracking-widest font-bold px-2 py-0.5">
                Stopped
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground/60 font-mono text-[11px] tracking-wide">
            Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 lg:col-span-1">
          <Card className="bg-card/40 border-primary/20 hover:border-primary/30 transition-colors h-full">
            <CardContent className="p-5 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Market Cap</span>
                <div className="p-1.5 rounded-sm bg-primary/10 border border-primary/20">
                  <TrendingUp size={13} className="text-primary" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-foreground font-mono tracking-tight">
                  ${market?.marketCap ? (market.marketCap / 1000).toFixed(2) : "0.00"}k
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Target ${stats?.targetMc ? (stats.targetMc / 1000).toFixed(0) : "20"}k</span>
                    <span className="text-primary font-bold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-0.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary shadow-[0_0_4px_rgba(234,179,8,0.5)] transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <StatCard
          label="Total Actions"
          value={stats?.totalTransactions ?? 0}
          sub={
            <span className="flex gap-3">
              <span className="text-green-400">{stats?.totalBuys ?? 0} buys</span>
              <span className="text-red-400">{stats?.totalSells ?? 0} sells</span>
            </span>
          }
          icon={ArrowUpDown}
        />

        <StatCard
          label="Wallets Active"
          value={stats?.walletsUsed ?? 0}
          sub={
            <span>
              <span className="text-green-400">{activeWallets?.buyers.length ?? 0}</span> buyers /{" "}
              <span className="text-red-400">{activeWallets?.sellers.length ?? 0}</span> sellers
            </span>
          }
          icon={Wallet}
        />

        <StatCard
          label="SOL Spent"
          value={<>◎{stats?.totalSolSpent ? stats.totalSolSpent.toFixed(3) : "0.000"}</>}
          sub={`Uptime: ${stats?.uptimeMinutes ? stats.uptimeMinutes.toFixed(0) : "0"}m`}
          icon={Zap}
        />
      </div>

      {/* Price Chart */}
      <PriceChart />

      {/* Transactions + Price Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Live Feed */}
        <Card className="lg:col-span-3 bg-card/40 border-border flex flex-col h-[320px]">
          <CardHeader className="border-b border-border/60 py-3 px-5 shrink-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Transaction Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            {(!transactions || transactions.length === 0) ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/50 text-xs font-mono">
                Awaiting activity...
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {transactions.slice(0, 50).map((tx) => (
                  <div
                    key={tx.id}
                    className="px-5 py-2.5 flex items-center justify-between hover:bg-secondary/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm shrink-0 ${
                          tx.action === "BUY"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {tx.action}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">W-{tx.walletId}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-foreground font-mono">◎{tx.amount.toFixed(3)}</span>
                      <a
                        href={`https://solscan.io/tx/${tx.txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground/30 hover:text-primary transition-colors group-hover:text-primary/60"
                        title="View on Solscan"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Panel */}
        <Card className="lg:col-span-2 bg-card/40 border-border h-[320px] flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(139,92,246,0.12),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 text-center w-full">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono mb-2">
              $MAGIC / USD
            </div>
            <div className="text-4xl font-black text-foreground font-mono tracking-tighter mb-1">
              ${market?.tokenPrice ? market.tokenPrice.toFixed(8) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground/50 font-mono mb-6">
              SOL: ${market?.solPrice ? market.solPrice.toFixed(2) : "—"}
            </div>

            <div className="space-y-1.5 text-left border border-border/40 rounded-sm p-3 bg-background/30">
              {[
                {
                  label: "Market Cap",
                  value: market?.marketCap ? `$${(market.marketCap / 1000).toFixed(1)}k` : "—",
                  cls: "text-foreground",
                },
                {
                  label: "Target MC",
                  value: `$${stats?.targetMc ? (stats.targetMc / 1000).toFixed(0) : "20"}k`,
                  cls: "text-primary",
                },
                {
                  label: "Progress",
                  value: `${progress.toFixed(2)}%`,
                  cls: "text-primary",
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-[11px] font-mono py-0.5">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-bold ${row.cls}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
