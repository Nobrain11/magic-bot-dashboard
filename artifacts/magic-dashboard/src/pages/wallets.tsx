import React from "react";
import {
  useListWallets,
  useGetActiveWallets,
  getListWalletsQueryKey,
  getGetActiveWalletsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Wallets() {
  const { data: wallets, isLoading } = useListWallets({ query: { queryKey: getListWalletsQueryKey(), refetchInterval: 10000 } });
  const { data: activeWallets } = useGetActiveWallets({ query: { queryKey: getGetActiveWalletsQueryKey(), refetchInterval: 10000 } });

  const isActiveWallet = (id: number, role: string) => {
    if (!activeWallets) return false;
    if (role === 'buyer') return activeWallets.buyers.includes(id);
    if (role === 'seller') return activeWallets.sellers.includes(id);
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-2 inline-block">
          Wallet Arsenal
        </h1>
        <div className="flex gap-4 text-xs font-mono">
          <div className="bg-secondary px-3 py-1 rounded border border-border text-green-400">
            Active Buyers: {activeWallets?.buyers.length || 0}
          </div>
          <div className="bg-secondary px-3 py-1 rounded border border-border text-red-400">
            Active Sellers: {activeWallets?.sellers.length || 0}
          </div>
        </div>
      </div>

      {isLoading && <div className="text-muted-foreground animate-pulse text-sm">Summoning wallets...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wallets?.map(wallet => {
          const isActive = isActiveWallet(wallet.id, wallet.role);
          
          return (
            <Card 
              key={wallet.id} 
              className={`bg-card/50 backdrop-blur transition-all duration-300 ${
                isActive 
                  ? 'border-primary/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.02]' 
                  : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <CardHeader className="py-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-mono text-foreground flex items-center gap-2">
                  <span className="text-muted-foreground">W-</span>{wallet.id}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                </CardTitle>
                <Badge variant="outline" className={`uppercase text-[10px] ${wallet.role === 'buyer' ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                  {wallet.role}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Public Key</div>
                  <div className="text-xs text-primary truncate bg-secondary/50 p-1.5 rounded border border-border/50" title={wallet.publicKey}>
                    {wallet.publicKey.substring(0, 12)}...{wallet.publicKey.substring(wallet.publicKey.length - 4)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">SOL Balance</div>
                    <div className="font-bold text-foreground">◎{wallet.solBalance.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Token Balance</div>
                    <div className="font-bold text-accent">{Math.floor(wallet.tokenBalance).toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-background p-2 rounded border border-border/30">
                  <div className="text-center border-r border-border/50">
                    <div className="text-green-400/70 mb-0.5">BUYS</div>
                    <div className="text-green-400 font-bold">{wallet.buyCountThisRotation} <span className="text-muted-foreground font-normal">/ {wallet.totalBuys}</span></div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400/70 mb-0.5">SELLS</div>
                    <div className="text-red-400 font-bold">{wallet.sellCountThisRotation} <span className="text-muted-foreground font-normal">/ {wallet.totalSells}</span></div>
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
