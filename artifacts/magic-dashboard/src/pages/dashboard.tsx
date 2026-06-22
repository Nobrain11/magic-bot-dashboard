import React from "react";
import { useGetBotStatus, useGetStatsSummary, useGetMarketStats, useListTransactions, useGetActiveWallets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import bannerImage from "@assets/IMG_2735_1782149827146.jpeg";

export default function Dashboard() {
  const { data: status } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const { data: stats } = useGetStatsSummary({ query: { refetchInterval: 5000 } });
  const { data: market } = useGetMarketStats({ query: { refetchInterval: 5000 } });
  const { data: transactions } = useListTransactions({ query: { refetchInterval: 10000 } });
  const { data: activeWallets } = useGetActiveWallets({ query: { refetchInterval: 10000 } });

  const progress = stats && stats.targetMc > 0 
    ? Math.min(100, Math.max(0, (stats.currentMc / stats.targetMc) * 100)) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative w-full h-48 rounded-md overflow-hidden border border-border group">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <img src={bannerImage} alt="Magic Bot Banner" className="absolute inset-0 w-full h-full object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-black text-primary tracking-widest uppercase filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">COMMAND CENTER</h2>
            {status?.running ? (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 uppercase tracking-widest font-bold animate-pulse">Running</Badge>
            ) : (
              <Badge variant="destructive" className="uppercase tracking-widest font-bold">Stopped</Badge>
            )}
          </div>
          <p className="text-muted-foreground font-mono text-sm max-w-xl">
            Conjuring spells in the dark. Watching charts pulse like mana flowing.
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.05)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Market Cap</CardTitle>
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
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Total Actions</CardTitle>
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
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Wallets Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.walletsUsed || 0}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="text-primary">{activeWallets?.buyers.length || 0}</span> active buyers / <span className="text-primary">{activeWallets?.sellers.length || 0}</span> active sellers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Total SOL Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ◎{stats?.totalSolSpent ? stats.totalSolSpent.toFixed(2) : "0.00"}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Uptime: {stats?.uptimeMinutes || 0}m
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Logs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border h-[400px] flex flex-col">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Transaction Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="divide-y divide-border">
              {transactions?.slice(0, 50).map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={tx.action === 'BUY' ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}>
                      {tx.action}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-mono">
                      W-{tx.walletId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">◎{tx.amount.toFixed(3)}</div>
                    <a href={`https://solscan.io/tx/${tx.txSignature}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
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

        {/* Minimal Token Price Info Placeholder */}
        <Card className="bg-card/50 backdrop-blur border-border h-[400px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-background to-background pointer-events-none" />
           <div className="relative z-10 text-center">
             <div className="text-6xl font-black text-foreground mb-4 font-mono tracking-tighter filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                ${market?.tokenPrice ? market.tokenPrice.toFixed(6) : "0.000000"}
             </div>
             <div className="text-sm text-primary uppercase tracking-widest font-bold">Current $MAGIC Price</div>
             <div className="mt-8 text-xs text-muted-foreground bg-secondary/50 p-3 border border-border rounded">
                Token Mint: <span className="text-foreground select-all">Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump</span>
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
