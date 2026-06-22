import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, Wallet, History, Settings, Zap, TrendingUp } from "lucide-react";
import { useGetMarketStats, useGetBotStatus } from "@workspace/api-client-react";

function PriceTicker() {
  const { data: market } = useGetMarketStats({ query: { refetchInterval: 5000 } });
  const { data: status } = useGetBotStatus({ query: { refetchInterval: 5000 } });

  const price = market?.tokenPrice ?? 0;
  const mc = market?.marketCap ?? 0;
  const sol = market?.solPrice ?? 0;

  return (
    <div className="h-10 border-b border-border bg-sidebar/80 backdrop-blur flex items-center justify-between px-6 shrink-0 z-20">
      {/* Left: price */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">$MAGIC</span>
          <span className="text-sm font-black text-primary font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
            ${price > 0 ? price.toFixed(8) : "—"}
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">MC</span>
          <span className="text-xs font-bold text-foreground font-mono">
            {mc > 0 ? `$${mc >= 1000 ? (mc / 1000).toFixed(1) + "k" : mc.toFixed(0)}` : "—"}
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">SOL</span>
          <span className="text-xs font-bold text-foreground font-mono">
            ${sol > 0 ? sol.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      {/* Right: bot status pill */}
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${status?.running ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] animate-pulse" : "bg-zinc-600"}`}
        />
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
          {status?.running ? "Bot Active" : "Bot Offline"}
        </span>
        {status?.running && status.totalActions > 0 && (
          <>
            <span className="w-px h-3 bg-border" />
            <span className="text-xs text-muted-foreground font-mono">{status.totalActions} actions</span>
          </>
        )}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background dark text-foreground font-mono">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-sidebar shrink-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded border border-primary/20">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">$MAGIC</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">War Room</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <div className="font-bold text-foreground truncate text-[10px]">Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump</div>
            <div className="mt-1 opacity-50">Solana Mainnet</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Price ticker bar — always at the top */}
        <PriceTicker />

        <main className="flex-1 overflow-auto p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
