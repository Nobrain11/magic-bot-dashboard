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

function PriceChart() {
  const { data: candles, isLoading } = useGetPriceChart({
    query: { queryKey: getGetPriceChartQueryKey(), refetchInterval: 30000 },
  });

  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    // Downsample to ~120 points if needed
    const step = Math.max(1, Math.floor(candles.length / 120));
    return candles
      .filter((_, i) => i % step === 0)
      .map((c) => ({
        time: new Date(c.time * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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

  const formatPrice = (v: number) => {
    if (v === 0) return "$0";
    if (v < 0.000001) return `$${v.toExponential(2)}`;
    return `$${v.toFixed(8)}`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border col-span-full">
      <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle className="text-sm uppercase tracking-widest text-primary">
            $MAGIC / USD — 24h
          </CardTitle>
          {priceChange !== null && (
            <span
              className={`text-xs font-bold font-mono ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          )}
        </div>
        {chartData.length > 0 && (
          <span className="text-xs text-muted-foreground font-mono">
            {chartData.length} data points
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 pt-4 pb-4 pr-4">
        {isLoading ? (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-xs font-mono">
            Fetching mainnet data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-xs font-mono">
            No price history available for this pair yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#4ade80" : "#f87171"}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#4ade80" : "#f87171"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickCount={6}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatPrice}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f13",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#e5e7eb",
                }}
                formatter={(value: number) => [formatPrice(value), "Price"]}
                labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#4ade80" : "#f87171"}
                strokeWidth={1.5}
                fill="url(#priceGrad)"
                dot={false}
                activeDot={{ r: 3, fill: isPositive ? "#4ade80" : "#f87171" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f13] border border-white/10 rounded p-2 font-mono text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      <div className="text-foreground">O: {payload[0]?.payload?.open?.toFixed(8)}</div>
      <div className="text-foreground">H: {payload[0]?.payload?.high?.toFixed(8)}</div>
      <div className="text-foreground">L: {payload[0]?.payload?.low?.toFixed(8)}</div>
      <div className="text-foreground font-bold">C: {payload[0]?.payload?.price?.toFixed(8)}</div>
    </div>
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
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative w-full h-40 rounded-md overflow-hidden border border-border group">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <img
          src={bannerImage}
          alt="$MAGIC Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-1">
            <h2 className="text-3xl font-black text-primary tracking-widest uppercase filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              COMMAND CENTER
            </h2>
            {status?.running ? (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 uppercase tracking-widest font-bold animate-pulse">
                Running
              </Badge>
            ) : (
              <Badge variant="destructive" className="uppercase tracking-widest font-bold">
                Stopped
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-mono text-xs">
            Conjuring spells in the dark. Watching charts pulse like mana flowing.
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.05)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${market?.marketCap ? (market.marketCap / 1000).toFixed(2) : "0.00"}k
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex justify-between">
              <span>Target: ${stats?.targetMc ? (stats.targetMc / 1000).toFixed(0) : "0"}k</span>
              <span className="text-primary">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1 bg-secondary mt-1 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.totalTransactions || 0}</div>
            <div className="mt-2 text-xs flex gap-4 text-muted-foreground">
              <span className="text-green-400">{stats?.totalBuys || 0} BUYS</span>
              <span className="text-red-400">{stats?.totalSells || 0} SELLS</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">
              Wallets Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.walletsUsed || 0}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="text-primary">{activeWallets?.buyers.length || 0}</span> buyers /{" "}
              <span className="text-primary">{activeWallets?.sellers.length || 0}</span> sellers active
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">
              Total SOL Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ◎{stats?.totalSolSpent ? stats.totalSolSpent.toFixed(3) : "0.000"}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Uptime: {stats?.uptimeMinutes ? stats.uptimeMinutes.toFixed(0) : "0"}m
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart — full width */}
      <div className="grid grid-cols-1">
        <PriceChart />
      </div>

      {/* Recent Transactions + Current Price */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border h-[360px] flex flex-col">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Transaction Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="divide-y divide-border">
              {transactions?.slice(0, 50).map((tx) => (
                <div
                  key={tx.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        tx.action === "BUY"
                          ? "text-green-400 border-green-400/30 text-xs"
                          : "text-red-400 border-red-400/30 text-xs"
                      }
                    >
                      {tx.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">W-{tx.walletId}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">◎{tx.amount.toFixed(3)}</div>
                    <a
                      href={`https://solscan.io/tx/${tx.txSignature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline font-mono"
                    >
                      {tx.txSignature.substring(0, 8)}...
                    </a>
                  </div>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Awaiting arcane activity...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Price Panel */}
        <Card className="bg-card/50 backdrop-blur border-border h-[360px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-background to-background pointer-events-none" />
          <div className="relative z-10 text-center w-full">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-3">
              Current $MAGIC Price
            </div>
            <div className="text-5xl font-black text-foreground font-mono tracking-tighter filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-2">
              ${market?.tokenPrice ? market.tokenPrice.toFixed(8) : "0.00000000"}
            </div>
            <div className="text-xs text-muted-foreground font-mono mb-6">
              SOL: ${market?.solPrice ? market.solPrice.toFixed(2) : "—"}
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between text-xs font-mono border-b border-border pb-2">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="text-foreground font-bold">
                  {market?.marketCap
                    ? `$${(market.marketCap / 1000).toFixed(1)}k`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono border-b border-border pb-2">
                <span className="text-muted-foreground">Target MC</span>
                <span className="text-primary font-bold">
                  ${stats?.targetMc ? (stats.targetMc / 1000).toFixed(0) : "20"}k
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary font-bold">{progress.toFixed(2)}%</span>
              </div>
            </div>

            <div className="mt-5 text-[9px] text-muted-foreground bg-secondary/50 px-3 py-2 border border-border rounded font-mono truncate">
              Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
