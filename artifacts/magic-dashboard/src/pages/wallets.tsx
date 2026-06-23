import React, { useMemo } from "react";
import {
  useListWallets,
  useGetActiveWallets,
  getListWalletsQueryKey,
  getGetActiveWalletsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Coins, Wallet, Zap } from "lucide-react";

const LOW_SOL = 0.1;
const CRITICAL_SOL = 0.05;

export default function Wallets() {
  const { data: wallets, isLoading } = useListWallets({
    query: { queryKey: getListWalletsQueryKey(), refetchInterval: 10000 },
  });
  const { data: activeWallets } = useGetActiveWallets({
    query: { queryKey: getGetActiveWalletsQueryKey(), refetchInterval: 10000 },
  });

  const isActiveWallet = (id: number, role: string) => {
    if (!activeWallets) return false;
    if (role === "buyer") return activeWallets.buyers.includes(id);
    if (role === "seller") return activeWallets.sellers.includes(id);
    return false;
  };

  const fundingStats = useMemo(() => {
    if (!wallets) return null;
    const totalSol = wallets.reduce((sum, w) => sum + w.solBalance, 0);
    const funded = wallets.filter((w) => w.solBalance >= LOW_SOL).length;
    const low = wallets.filter((w) => w.solBalance < LOW_SOL && w.solBalance >= CRITICAL_SOL).length;
    const critical = wallets.filter((w) => w.solBalance < CRITICAL_SOL).length;
    return { totalSol, funded, low, critical, total: wallets.length };
  }, [wallets]);

  const solColor = (bal: number) => {
    if (bal < CRITICAL_SOL) return "text-red-400";
    if (bal < LOW_SOL) return "text-amber-400";
    return "text-foreground";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-widest text-primary">
          Wallet Arsenal
        </h1>
        <div className="flex gap-2 text-[11px] font-mono">
          <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {activeWallets?.buyers.length ?? 0} buying
          </div>
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {activeWallets?.sellers.length ?? 0} selling
          </div>
        </div>
      </div>

      {/* Funding Summary */}
      {fundingStats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card/50 border border-border p-4 rounded-sm flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-sm border border-primary/20">
                <Coins size={16} className="text-primary" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total SOL</div>
                <div className="text-lg font-black text-foreground font-mono">◎{fundingStats.totalSol.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-card/50 border border-border p-4 rounded-sm flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-sm border border-green-500/20">
                <Wallet size={16} className="text-green-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Funded</div>
                <div className="text-lg font-black text-green-400 font-mono">
                  {fundingStats.funded}
                  <span className="text-xs text-muted-foreground font-normal ml-1">/ {fundingStats.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-card/50 border border-border p-4 rounded-sm flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-sm border border-amber-500/20">
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Low Gas</div>
                <div className="text-lg font-black text-amber-400 font-mono">{fundingStats.low}</div>
              </div>
            </div>

            <div className={`bg-card/50 border p-4 rounded-sm flex items-center gap-3 ${fundingStats.critical > 0 ? "border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-border"}`}>
              <div className="bg-red-500/10 p-2 rounded-sm border border-red-500/20">
                <Zap size={16} className="text-red-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Critical</div>
                <div className={`text-lg font-black font-mono ${fundingStats.critical > 0 ? "text-red-400 animate-pulse" : "text-muted-foreground"}`}>
                  {fundingStats.critical}
                </div>
              </div>
            </div>
          </div>

          {fundingStats.critical > 0 && (
            <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/5 px-4 py-3 rounded-sm">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400 font-mono">
                {fundingStats.critical} wallet{fundingStats.critical > 1 ? "s are" : " is"} critically low on SOL (&lt;0.05 ◎). Fund them before starting the bot to avoid failed transactions.
              </p>
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="text-muted-foreground animate-pulse text-xs font-mono">Summoning wallets...</div>
      )}

      {/* Wallet Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {wallets?.map((wallet) => {
          const isActive = isActiveWallet(wallet.id, wallet.role);
          const isCritical = wallet.solBalance < CRITICAL_SOL;
          const isLow = wallet.solBalance < LOW_SOL && wallet.solBalance >= CRITICAL_SOL;

          return (
            <Card
              key={wallet.id}
              className={`transition-all duration-300 ${
                isActive
                  ? "border-primary/50 shadow-[0_0_12px_rgba(234,179,8,0.12)] bg-card/70"
                  : isCritical
                  ? "border-red-500/30 bg-card/40"
                  : isLow
                  ? "border-amber-500/20 bg-card/40"
                  : "border-border bg-card/40 opacity-75 hover:opacity-100"
              }`}
            >
              <CardHeader className="py-2.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-mono text-foreground flex items-center gap-1.5">
                  <span className="text-muted-foreground">W-</span>
                  <span className="font-bold">{wallet.id}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-0.5" />}
                  {isCritical && !isActive && <AlertTriangle size={10} className="text-red-400 ml-0.5" />}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`uppercase text-[9px] px-1.5 py-0 ${
                    wallet.role === "buyer"
                      ? "text-green-400 border-green-400/30"
                      : "text-red-400 border-red-400/30"
                  }`}
                >
                  {wallet.role}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5">
                <div className="text-[9px] text-primary/80 truncate bg-secondary/30 px-1.5 py-1 rounded-sm border border-border/30 font-mono" title={wallet.publicKey}>
                  {wallet.publicKey.substring(0, 8)}…{wallet.publicKey.substring(wallet.publicKey.length - 4)}
                </div>

                <div className="grid grid-cols-2 gap-x-2 text-xs">
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">SOL</div>
                    <div className={`font-bold font-mono ${solColor(wallet.solBalance)}`}>
                      ◎{wallet.solBalance.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Token</div>
                    <div className="font-bold text-accent font-mono">
                      {Math.floor(wallet.tokenBalance).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] bg-background/50 p-1.5 rounded-sm border border-border/20">
                  <div className="text-center border-r border-border/30">
                    <div className="text-green-400/60 mb-0.5 text-[9px]">BUYS</div>
                    <span className="text-green-400 font-bold">{wallet.buyCountThisRotation}</span>
                    <span className="text-muted-foreground text-[9px]"> / {wallet.totalBuys}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400/60 mb-0.5 text-[9px]">SELLS</div>
                    <span className="text-red-400 font-bold">{wallet.sellCountThisRotation}</span>
                    <span className="text-muted-foreground text-[9px]"> / {wallet.totalSells}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
